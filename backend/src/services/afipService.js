const fs = require('fs');
const path = require('path');
const axios = require('axios');
const xml2js = require('xml2js');
const forge = require('node-forge');
const db = require('../config/db');

require('dotenv').config();

const WSDL = {
    WSAA: {
        TEST: 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms',
        PROD: 'https://wsaa.afip.gov.ar/ws/services/LoginCms'
    },
    WSFE: {
        TEST: 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx',
        PROD: 'https://servicios1.afip.gov.ar/wsfev1/service.asmx'
    }
};

class AfipService {
    constructor() {
        this.token = null;
        this.sign = null;
        this.expiration = null;
        this.cuit = process.env.AFIP_CUIT;
        this.ptoVta = Number.parseInt(process.env.AFIP_PTO_VTA || '3', 10);
        this.production = process.env.AFIP_PRODUCTION === 'true';
        this.forceMock = process.env.AFIP_FORCE_MOCK === 'true';

        // Resolver rutas de certificados relativas al directorio backend/
        const backendDir = path.resolve(__dirname, '..', '..');
        this.certPath = path.resolve(backendDir, process.env.AFIP_CERT_PATH || './certs/cert.crt');
        this.keyPath = path.resolve(backendDir, process.env.AFIP_KEY_PATH || './certs/key.key');

        console.log('[AFIP] Cert path:', this.certPath, '| Exists:', fs.existsSync(this.certPath));
        console.log('[AFIP] Key path:', this.keyPath, '| Exists:', fs.existsSync(this.keyPath));
        console.log('[AFIP] CUIT:', this.cuit, '| PtoVta:', this.ptoVta, '| Production:', this.production, '| ForceMock:', this.forceMock);
    }

    async getAuth() {
        if (this.token && this.sign && new Date() < this.expiration) {
            return { token: this.token, sign: this.sign };
        }
        return await this.loginCms();
    }

    async loginCms() {
        console.log("Authenticating with AFIP...");

        if (this.forceMock) {
            console.warn("AFIP_FORCE_MOCK enabled, returning MOCK credentials.");
            this.token = "MOCK_TOKEN";
            this.sign = "MOCK_SIGN";
            this.expiration = new Date(Date.now() + 3600 * 1000);
            return { token: this.token, sign: this.sign };
        }

        if (!fs.existsSync(this.certPath) || !fs.existsSync(this.keyPath)) {
            console.warn("AFIP Certs not found at:", this.certPath, this.keyPath);
            console.warn("Returning MOCK credentials.");
            this.token = "MOCK_TOKEN";
            this.sign = "MOCK_SIGN";
            this.expiration = new Date(Date.now() + 3600 * 1000);
            return { token: this.token, sign: this.sign };
        }

        console.log("Loading cert from:", this.certPath);
        console.log("Loading key from:", this.keyPath);

        // Create TRA (LoginTicketRequest)
        const traXml = `<?xml version="1.0" encoding="UTF-8"?>
        <loginTicketRequest version="1.0">
            <header>
                <uniqueId>${Math.floor(Date.now() / 1000)}</uniqueId>
                <generationTime>${new Date(Date.now() - 600000).toISOString()}</generationTime>
                <expirationTime>${new Date(Date.now() + 600000).toISOString()}</expirationTime>
            </header>
            <service>wsfe</service>
        </loginTicketRequest>`;

        // Sign TRA using openssl via child_process (more reliable than node-forge for AFIP)
        const { execSync } = require('child_process');
        const os = require('os');
        const traPath = path.join(os.tmpdir(), `tra_${Date.now()}.xml`);
        const cmsPath = path.join(os.tmpdir(), `cms_${Date.now()}.pem`);

        let cms;
        try {
            fs.writeFileSync(traPath, traXml);

            // Use openssl smime to create CMS signed data
            execSync(
                `openssl smime -sign -signer "${this.certPath}" -inkey "${this.keyPath}" -outform pem -nodetach -in "${traPath}" -out "${cmsPath}"`,
                { stdio: 'pipe' }
            );

            const cmsPem = fs.readFileSync(cmsPath, 'utf8');
            cms = cmsPem
                .replace(/-----BEGIN PKCS7-----/, '')
                .replace(/-----END PKCS7-----/, '')
                .replace(/\s/g, '');

            console.log("[AFIP] CMS signed successfully, length:", cms.length);

        } catch (signError) {
            console.error("[AFIP] Error signing TRA with openssl:", signError.message);
            // Fallback: try with node-forge
            console.log("[AFIP] Trying fallback with node-forge...");
            const certPem = fs.readFileSync(this.certPath, 'utf8');
            const keyPem = fs.readFileSync(this.keyPath, 'utf8');

            const p7 = forge.pkcs7.createSignedData();
            p7.content = forge.util.createBuffer(traXml, 'utf8');
            p7.addCertificate(forge.pki.certificateFromPem(certPem));
            p7.addSigner({
                key: forge.pki.privateKeyFromPem(keyPem),
                certificate: forge.pki.certificateFromPem(certPem),
                digestAlgorithm: forge.pki.oids.sha256,
                authenticatedAttributes: [{
                    type: forge.pki.oids.contentType,
                    value: forge.pki.oids.data
                }, {
                    type: forge.pki.oids.messageDigest
                }, {
                    type: forge.pki.oids.signingTime,
                    value: new Date()
                }]
            });
            p7.sign({ detached: false });
            cms = forge.pkcs7.messageToPem(p7)
                .replace(/-----BEGIN PKCS7-----/, '')
                .replace(/-----END PKCS7-----/, '')
                .replace(/\s/g, '');
        } finally {
            // Cleanup temp files
            try { fs.unlinkSync(traPath); } catch (_) { }
            try { fs.unlinkSync(cmsPath); } catch (_) { }
        }

        // Wrap in SOAP
        const soapRequest = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsaa="http://wsaa.view.sua.dnet.afip.gov.ar/xsd">
           <soapenv:Header/>
           <soapenv:Body>
              <wsaa:loginCms>
                 <wsaa:in0>${cms}</wsaa:in0>
              </wsaa:loginCms>
           </soapenv:Body>
        </soapenv:Envelope>`;

        const url = this.production ? WSDL.WSAA.PROD : WSDL.WSAA.TEST;
        console.log("[AFIP] Sending auth request to:", url);

        try {
            const { data } = await axios.post(url, soapRequest, {
                headers: { 'Content-Type': 'text/xml', 'SOAPAction': '' },
                timeout: 30000
            });

            console.log("[AFIP] Raw response:", typeof data === 'string' ? data.substring(0, 500) : JSON.stringify(data).substring(0, 500));

            // Parse XML
            const parser = new xml2js.Parser({ explicitArray: false });
            const result = await parser.parseStringPromise(data);

            // Check for SOAP Fault
            const body = result['soapenv:Envelope']?.['soapenv:Body'] || result['soap:Envelope']?.['soap:Body'];
            if (body?.['soapenv:Fault'] || body?.['soap:Fault']) {
                const fault = body['soapenv:Fault'] || body['soap:Fault'];
                console.error("[AFIP] SOAP Fault:", JSON.stringify(fault, null, 2));
                throw new Error("AFIP SOAP Fault: " + (fault.faultstring || fault.faultcode || JSON.stringify(fault)));
            }

            const loginCmsResponse = body?.loginCmsResponse || body?.['loginCmsResponse'];
            const loginCmsReturn = loginCmsResponse?.loginCmsReturn;

            if (!loginCmsReturn) {
                console.error("[AFIP] Unexpected response structure:", JSON.stringify(result, null, 2));
                throw new Error("Unexpected AFIP response structure");
            }

            const ticketData = await parser.parseStringPromise(loginCmsReturn);

            this.token = ticketData.loginTicketResponse.credentials.token;
            this.sign = ticketData.loginTicketResponse.credentials.sign;
            this.expiration = new Date(ticketData.loginTicketResponse.header.expirationTime);

            console.log("[AFIP] Authentication Successful! Token expires:", this.expiration.toISOString());
            return { token: this.token, sign: this.sign };

        } catch (error) {
            if (error.response) {
                console.error("[AFIP] Login HTTP Error:", error.response.status);
                console.error("[AFIP] Response data:", typeof error.response.data === 'string' ? error.response.data.substring(0, 1000) : JSON.stringify(error.response.data).substring(0, 1000));
            } else {
                console.error("[AFIP] Login Error:", error.message);
            }
            throw new Error("Failed to authenticate with AFIP: " + error.message);
        }
    }

    async getLastVoucher(ptoVta, cbteTipo) {
        if (this.token === "MOCK_TOKEN") return 0; // Mock

        const { token, sign } = await this.getAuth();
        const url = this.production ? WSDL.WSFE.PROD : WSDL.WSFE.TEST;

        const xml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ar="http://ar.gov.afip.dif.FEV1/">
           <soapenv:Header/>
           <soapenv:Body>
              <ar:FECompUltimoAutorizado>
                 <ar:Auth>
                    <ar:Token>${token}</ar:Token>
                    <ar:Sign>${sign}</ar:Sign>
                    <ar:Cuit>${this.cuit}</ar:Cuit>
                 </ar:Auth>
                 <ar:PtoVta>${ptoVta}</ar:PtoVta>
                 <ar:CbteTipo>${cbteTipo}</ar:CbteTipo>
              </ar:FECompUltimoAutorizado>
           </soapenv:Body>
        </soapenv:Envelope>`;

        try {
            const { data } = await axios.post(url, xml, { headers: { 'Content-Type': 'text/xml', 'SOAPAction': 'http://ar.gov.afip.dif.FEV1/FECompUltimoAutorizado' } });
            const parser = new xml2js.Parser({ explicitArray: false });
            const result = await parser.parseStringPromise(data);
            return parseInt(result['soap:Envelope']['soap:Body']['FECompUltimoAutorizadoResponse']['FECompUltimoAutorizadoResult']['CbteNro']);
        } catch (e) {
            throw new Error("Error getting last voucher number");
        }
    }

    async emitInvoice(invoiceData) {
        // data: { saleId, total, cbteTipo, docTipo, docNro, ptoVta }
        const ptoVta = invoiceData.ptoVta ?? this.ptoVta ?? 1; // Default PtoVta
        const cbteTipo = invoiceData.cbteTipo;

        const lastCbte = await this.getLastVoucher(ptoVta, cbteTipo);
        const nextCbte = lastCbte + 1;

        if (this.token === "MOCK_TOKEN") {
            // Simulate success
            const mockCae = "12345678901234";
            const mockVto = "20301231";
            await this.saveInvoice(invoiceData.saleId, mockCae, mockVto, nextCbte, ptoVta, cbteTipo, 'APPROVED', null, invoiceData.total, invoiceData.docTipo, invoiceData.docNro);
            return {
                status: 'APPROVED',
                cae: mockCae,
                cae_expiration: mockVto,
                cbte_nro: nextCbte,
                pto_vta: ptoVta,
                cbte_tipo: cbteTipo,
                msg: "MOCKED AFIP RESPONSE"
            };
        }

        const { token, sign } = await this.getAuth();
        const url = this.production ? WSDL.WSFE.PROD : WSDL.WSFE.TEST;

        // Build FECAESolicitar
        const req = {
            Auth: { Token: token, Sign: sign, Cuit: this.cuit },
            FeCAEReq: {
                FeCabReq: {
                    CantReg: 1,
                    PtoVta: ptoVta,
                    CbteTipo: cbteTipo
                },
                FeDetReq: {
                    FECAEDetRequest: {
                        Concepto: 1, // Productos
                        DocTipo: invoiceData.docTipo,
                        DocNro: invoiceData.docNro,
                        CbteDesde: nextCbte,
                        CbteHasta: nextCbte,
                        CbteFch: new Date().toISOString().split('T')[0].replace(/-/g, ''),
                        ImpTotal: invoiceData.total,
                        ImpTotConc: 0,
                        ImpNeto: Math.round((invoiceData.total / 1.105) * 100) / 100, // IVA 10.5% incluido
                        ImpOpEx: 0,
                        ImpTrib: 0,
                        ImpIVA: Math.round((invoiceData.total - (invoiceData.total / 1.105)) * 100) / 100,
                        MonId: 'PES',
                        MonCotiz: 1,
                        Iva: {
                            AlicIva: {
                                Id: 4, // 10.5%
                                BaseImp: Math.round((invoiceData.total / 1.105) * 100) / 100,
                                Importe: Math.round((invoiceData.total - (invoiceData.total / 1.105)) * 100) / 100
                            }
                        }
                    }
                }
            }
        };

        const builder = new xml2js.Builder(); // Need proper SOAP structure manually or build object carefully.
        // XML2JS builder is tricky for SOAP namespaces. I'll do string template for reliability in this context.

        const xmlBody = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ar="http://ar.gov.afip.dif.FEV1/">
           <soapenv:Header/>
           <soapenv:Body>
              <ar:FECAESolicitar>
                 <ar:Auth>
                    <ar:Token>${token}</ar:Token>
                    <ar:Sign>${sign}</ar:Sign>
                    <ar:Cuit>${this.cuit}</ar:Cuit>
                 </ar:Auth>
                 <ar:FeCAEReq>
                    <ar:FeCabReq>
                       <ar:CantReg>1</ar:CantReg>
                       <ar:PtoVta>${ptoVta}</ar:PtoVta>
                       <ar:CbteTipo>${cbteTipo}</ar:CbteTipo>
                    </ar:FeCabReq>
                    <ar:FeDetReq>
                       <ar:FECAEDetRequest>
                          <ar:Concepto>1</ar:Concepto>
                          <ar:DocTipo>${invoiceData.docTipo}</ar:DocTipo>
                          <ar:DocNro>${invoiceData.docNro}</ar:DocNro>
                          <ar:CbteDesde>${nextCbte}</ar:CbteDesde>
                          <ar:CbteHasta>${nextCbte}</ar:CbteHasta>
                          <ar:CbteFch>${new Date().toISOString().slice(0, 10).replace(/-/g, '')}</ar:CbteFch>
                          <ar:ImpTotal>${invoiceData.total.toFixed(2)}</ar:ImpTotal>
                          <ar:ImpTotConc>0</ar:ImpTotConc>
                          <ar:ImpNeto>${(invoiceData.total / 1.105).toFixed(2)}</ar:ImpNeto>
                          <ar:ImpOpEx>0</ar:ImpOpEx>
                          <ar:ImpTrib>0</ar:ImpTrib>
                          <ar:ImpIVA>${(invoiceData.total - (invoiceData.total / 1.105)).toFixed(2)}</ar:ImpIVA>
                          <ar:MonId>PES</ar:MonId>
                          <ar:MonCotiz>1</ar:MonCotiz>
                          <ar:Iva>
                             <ar:AlicIva>
                                <ar:Id>4</ar:Id>
                                <ar:BaseImp>${(invoiceData.total / 1.105).toFixed(2)}</ar:BaseImp>
                                <ar:Importe>${(invoiceData.total - (invoiceData.total / 1.105)).toFixed(2)}</ar:Importe>
                             </ar:AlicIva>
                          </ar:Iva>
                       </ar:FECAEDetRequest>
                    </ar:FeDetReq>
                 </ar:FeCAEReq>
              </ar:FECAESolicitar>
           </soapenv:Body>
        </soapenv:Envelope>`;

        try {
            const { data } = await axios.post(url, xmlBody, { headers: { 'Content-Type': 'text/xml', 'SOAPAction': 'http://ar.gov.afip.dif.FEV1/FECAESolicitar' } });

            // Check errors in response
            // For now assume success structure (simplification)
            const parser = new xml2js.Parser({ explicitArray: false });
            const result = await parser.parseStringPromise(data);
            const resDetalle = result['soap:Envelope']['soap:Body']['FECAESolicitarResponse']['FECAESolicitarResult']['FeDetResp']['FECAEDetResponse'];
            const resCab = result['soap:Envelope']['soap:Body']['FECAESolicitarResponse']['FECAESolicitarResult']['FeCabResp'];

            if (resCab.Resultado === 'A') {
                const cae = resDetalle.CAE;
                const vto = resDetalle.CAEFchVto;
                await this.saveInvoice(invoiceData.saleId, cae, vto, nextCbte, ptoVta, cbteTipo, 'APPROVED', null, invoiceData.total, invoiceData.docTipo, invoiceData.docNro);
                return {
                    status: 'APPROVED',
                    cae,
                    cae_expiration: vto,
                    cbte_nro: nextCbte,
                    pto_vta: ptoVta,
                    cbte_tipo: cbteTipo
                };
            } else {
                throw new Error("AFIP Rejected: " + JSON.stringify(result));
            }

        } catch (e) {
            console.error("Error creating invoice", e);
            await this.saveInvoice(invoiceData.saleId, null, null, nextCbte, ptoVta, cbteTipo, 'ERROR', e.message, invoiceData.total, invoiceData.docTipo, invoiceData.docNro);
            throw e;
        }
    }

    async saveInvoice(saleId, cae, vto, cbteNro, ptoVta, cbteTipo, status, afipError = null, total = 0, docTipo = 99, docNro = 0) {
        await db.query(`
            INSERT INTO invoices (sale_id, cae, cae_expiration, cbte_nro, pto_vta, cbte_tipo, status, afip_error, total, doc_tipo, doc_nro)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (pto_vta, cbte_tipo, cbte_nro) DO UPDATE SET
                cae = EXCLUDED.cae,
                cae_expiration = EXCLUDED.cae_expiration,
                status = EXCLUDED.status,
                afip_error = EXCLUDED.afip_error
        `, [saleId, cae, vto, cbteNro, ptoVta, cbteTipo, status, afipError, total, docTipo, docNro]);
    }
}

module.exports = new AfipService();
