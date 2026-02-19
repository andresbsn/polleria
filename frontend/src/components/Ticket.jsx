import React, { forwardRef } from 'react';

const Ticket = forwardRef(({ sale }, ref) => {
    if (!sale) return null;

    const { 
        id, created_at, client_name, items, total, payment_method, subtotal, discount, discount_percent,
        cae, cbte_nro, pto_vta, cbte_tipo, cae_expiration, invoice_status 
    } = sale;

    const businessName = import.meta.env.VITE_BUSINESS_NAME || 'Los Nonos';
    const businessTaxId = import.meta.env.VITE_BUSINESS_TAX_ID || '20430562372';
    const businessAddress = import.meta.env.VITE_BUSINESS_ADDRESS || '24 de Octubre, Villa Ramallo';

    const date = new Date(created_at).toLocaleString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    return (
        <div ref={ref} className="ticket-container" style={{ 
            width: '80mm', 
            padding: '10px', 
            background: 'white', 
            color: 'black', 
            fontFamily: 'monospace',
            fontSize: '12px'
        }}>
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, fontWeight: 'bold', fontSize: '16px' }}>{businessName}</h3>
                <p style={{ margin: 0 }}>{businessAddress}</p>
                <p style={{ margin: 0 }}>CUIT: {businessTaxId}</p>
                <p style={{ margin: 0 }}>IVA Responsable Inscripto</p>
                <p style={{ margin: 0 }}>Inicio de Actividades: 01/01/2023</p>
            </div>

            <hr style={{ borderTop: '1px dashed black', margin: '5px 0' }} />

            <div style={{ marginBottom: '5px' }}>
                <p style={{ margin: 0 }}>Fecha: {date}</p>
                {cae ? (
                    <>
                        <p style={{ margin: 0 }}>Comp. Tipo: {cbte_tipo === 1 ? '001 (A)' : '006 (B)'}</p>
                        <p style={{ margin: 0 }}>Pto Vta: {String(pto_vta || 1).padStart(4, '0')} Comp: {String(cbte_nro).padStart(8, '0')}</p>
                    </>
                ) : (
                    <p style={{ margin: 0 }}>Ticket No Fiscal #{id}</p>
                )}
                <p style={{ margin: 0 }}>Cliente: {client_name || 'Consumidor Final'}</p>
            </div>

            <hr style={{ borderTop: '1px dashed black', margin: '5px 0' }} />

            <table style={{ width: '100%', marginBottom: '5px' }}>
                <thead>
                    <tr style={{ textAlign: 'left' }}>
                        <th>Cant</th>
                        <th>Desc</th>
                        <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {items && items.map((item, idx) => (
                        <tr key={idx}>
                            <td>{item.quantity}</td>
                            <td>{item.name || item.product_name}</td>
                            <td style={{ textAlign: 'right' }}>${(item.price_at_sale || item.price || 0) * item.quantity}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <hr style={{ borderTop: '1px dashed black', margin: '5px 0' }} />

            {subtotal !== undefined && subtotal !== null && Number(subtotal) !== Number(total) && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>SUBTOTAL</span>
                    <span>${Number(subtotal).toFixed(2)}</span>
                </div>
            )}

            {discount !== undefined && discount !== null && Number(discount) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>DESCUENTO</span>
                    <span>-{discount_percent !== undefined && discount_percent !== null ? `${Number(discount_percent).toFixed(2)}% ` : ''}-${Number(discount).toFixed(2)}</span>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
                <span>TOTAL</span>
                <span>${Number(total).toFixed(2)}</span>
            </div>
            <p style={{ margin: '5px 0', fontSize: '10px' }}>Pago: {payment_method}</p>

            {cae && (
                <div style={{ marginTop: '10px', textAlign: 'center' }}>
                    <p style={{ margin: 0 }}>CAE: {cae}</p>
                    <p style={{ margin: 0 }}>Vto CAE: {cae_expiration}</p>
                    <p style={{ margin: '5px 0', fontSize: '10px' }}>Comprobante Autorizado</p>
                </div>
            )}
            
            <div style={{ marginTop: '15px', textAlign: 'center' }}>
                <p style={{ margin: 0 }}>¡Gracias por su compra!</p>
            </div>
        </div>
    );
});

export default Ticket;
