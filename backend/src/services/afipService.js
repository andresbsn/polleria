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
        this.ptoVta = Number.parseInt(process.env.AFIP_PTO_VTA || '1', 10);
        this.production = process.env.AFIP_PRODUCTION === 'true';
        this.certPath = process.env.AFIP_CERT_PATH;
        this.keyPath = process.env.AFIP_KEY_PATH;
        this.forceMock = process.env.AFIP_FORCE_MOCK === 'true';
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
            // Mock for development if certs missing
            console.warn("AFIP Certs not found, returning MOCK credentials.");
            this.token = "MOCK_TOKEN";
            this.sign = "MOCK_SIGN";
            this.expiration = new Date(Date.now() + 3600 * 1000);
            return { token: this.token, sign: this.sign };
        }

        const certPem = fs.readFileSync(this.certPath, 'utf8');
        const keyPem = fs.readFileSync(this.keyPath, 'utf8');

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

        // Sign TRA
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
        const cms = forge.pkcs7.messageToPem(p7).replace(/-----BEGIN PKCS7-----/, '').replace(/-----END PKCS7-----/, '').replace(/\s/g, '');

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

        try {
            const { data } = await axios.post(url, soapRequest, { headers: { 'Content-Type': 'text/xml', 'SOAPAction': '' } });

            // Parse XML
            const parser = new xml2js.Parser({ explicitArray: false });
            const result = await parser.parseStringPromise(data);
            const loginTicketResponse = result['soapenv:Envelope']['soapenv:Body']['loginCmsResponse']['loginCmsReturn'];
            const ticketData = await parser.parseStringPromise(loginTicketResponse);

            this.token = ticketData.loginTicketResponse.credentials.token;
            this.sign = ticketData.loginTicketResponse.credentials.sign;
            this.expiration = new Date(ticketData.loginTicketResponse.header.expirationTime);

            console.log("AFIP Authentication Successful");
            return { token: this.token, sign: this.sign };

        } catch (error) {
            console.error("AFIP Login Error:", error.response ? error.response.data : error.message);
            throw new Error("Failed to authenticate with AFIP");
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
            await this.saveInvoice(invoiceData.saleId, mockCae, mockVto, nextCbte, ptoVta, cbteTipo, 'APPROVED');
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
                        ImpNeto: Math.round((invoiceData.total / 1.21) * 100) / 100, // Assuming 21% VAT included for simplicity. Logic should be more robust.
                        ImpOpEx: 0,
                        ImpTrib: 0,
                        ImpIVA: Math.round((invoiceData.total - (invoiceData.total / 1.21)) * 100) / 100,
                        MonId: 'PES',
                        MonCotiz: 1,
                        Iva: {
                            AlicIva: {
                                Id: 5, // 21%
                                BaseImp: Math.round((invoiceData.total / 1.21) * 100) / 100,
                                Importe: Math.round((invoiceData.total - (invoiceData.total / 1.21)) * 100) / 100
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
                          <ar:ImpNeto>${(invoiceData.total / 1.21).toFixed(2)}</ar:ImpNeto>
                          <ar:ImpOpEx>0</ar:ImpOpEx>
                          <ar:ImpTrib>0</ar:ImpTrib>
                          <ar:ImpIVA>${(invoiceData.total - (invoiceData.total / 1.21)).toFixed(2)}</ar:ImpIVA>
                          <ar:MonId>PES</ar:MonId>
                          <ar:MonCotiz>1</ar:MonCotiz>
                          <ar:Iva>
                             <ar:AlicIva>
                                <ar:Id>5</ar:Id>
                                <ar:BaseImp>${(invoiceData.total / 1.21).toFixed(2)}</ar:BaseImp>
                                <ar:Importe>${(invoiceData.total - (invoiceData.total / 1.21)).toFixed(2)}</ar:Importe>
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
                await this.saveInvoice(invoiceData.saleId, cae, vto, nextCbte, ptoVta, cbteTipo, 'APPROVED');
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
            await this.saveInvoice(invoiceData.saleId, null, null, nextCbte, ptoVta, cbteTipo, 'ERROR', e.message);
            throw e;
        }
    }

    async saveInvoice(saleId, cae, vto, cbteNro, ptoVta, cbteTipo, status, afipError = null) {
        await db.query(`
            INSERT INTO invoices (sale_id, cae, cae_expiration, cbte_nro, pto_vta, cbte_tipo, status, afip_error)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (pto_vta, cbte_tipo, cbte_nro) DO NOTHING
        `, [saleId, cae, vto, cbteNro, ptoVta, cbteTipo, status, afipError]);
    }
}

module.exports = new AfipService();
