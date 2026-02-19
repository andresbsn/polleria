// Por el momento esto será un mock de la integración con AFIP
// Almacenamiento temporal en memoria (en producción usar base de datos)
let facturasAlmacenadas = [];

const generarFactura = async (req, res) => {
    try {
        const { tickets } = req.body;
        
        if (!tickets || !Array.isArray(tickets)) {
            return res.status(400).json({ error: 'Se requiere un array de tickets' });
        }

        // Simular proceso de facturación
        const facturas = tickets.map(ticket => ({
            ...ticket,
            afipCae: Math.random().toString(36).substring(2, 15),
            fechaVencimientoCae: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            numeroFactura: Math.floor(Math.random() * 99999) + 1,
            fecha: new Date().toISOString()
        }));

        // Guardar en el historial
        facturasAlmacenadas = [...facturas, ...facturasAlmacenadas];

        res.json({
            success: true,
            message: 'Facturas generadas en modo testing',
            facturas
        });
    } catch (error) {
        console.error('Error en facturación:', error);
        res.status(500).json({ error: 'Error al procesar la facturación' });
    }
};

const obtenerHistorial = async (req, res) => {
    try {
        res.json({
            success: true,
            facturas: facturasAlmacenadas
        });
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({ error: 'Error al obtener el historial de facturas' });
    }
};

module.exports = {
    generarFactura,
    obtenerHistorial
};
