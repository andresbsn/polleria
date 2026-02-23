import { useState, useEffect } from 'react';
import { Card, CardContent, Box, Paper, TextField, Divider, LinearProgress, Chip, Alert, Checkbox, FormControlLabel, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { FaFileInvoiceDollar, FaMoneyBillWave, FaTicketAlt, FaHistory, FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaPrint } from 'react-icons/fa';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const formatearMonto = (monto) => {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(monto);
};

const formatearFecha = (fecha) => {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatearVencimientoCAE = (vto) => {
  if (!vto) return '-';
  // El CAE vencimiento viene como YYYYMMDD o como fecha
  const str = String(vto).replace(/-/g, '');
  if (str.length === 8) {
    return `${str.slice(6, 8)}/${str.slice(4, 6)}/${str.slice(0, 4)}`;
  }
  return new Date(vto).toLocaleDateString('es-AR');
};

const Facturacion = () => {
  const hoy = new Date().toISOString().split('T')[0];
  const [montoTotalRaw, setMontoTotalRaw] = useState('');
  const [cantidadTickets, setCantidadTickets] = useState('');
  const [tickets, setTickets] = useState([]);
  const [historialFacturas, setHistorialFacturas] = useState([]);
  const [filtroFechaDesde, setFiltroFechaDesde] = useState(hoy);
  const [filtroFechaHasta, setFiltroFechaHasta] = useState(hoy);
  const [historialFiltrado, setHistorialFiltrado] = useState([]);
  const [procesando, setProcesando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [resultados, setResultados] = useState([]);
  const [mensajeResultado, setMensajeResultado] = useState(null);

  // Estados para cliente particular
  const [clients, setClients] = useState([]);
  const [esClienteParticular, setEsClienteParticular] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');

  useEffect(() => {
    cargarHistorial();
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/clients`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setClients(data || []);
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  useEffect(() => {
    filtrarHistorial();
  }, [historialFacturas, filtroFechaDesde, filtroFechaHasta]);

  const cargarHistorial = async () => {
    try {
      let url = `${API_BASE}/api/facturacion/historial?limit=200`;
      if (filtroFechaDesde) url += `&desde=${filtroFechaDesde}`;
      if (filtroFechaHasta) url += `&hasta=${filtroFechaHasta}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setHistorialFacturas(data.facturas || []);
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
    }
  };

  const filtrarHistorial = () => {
    // Al simplificar, simplemente usamos lo que viene de la API.
    // El filtrado por fecha ya se hace en el backend.
    setHistorialFiltrado([...historialFacturas]);
  };

  const generarTicketsAleatorios = () => {
    const cantidad = parseInt(cantidadTickets);
    const total = parseFloat(montoTotalRaw.replace(',', '.'));
    
    if (isNaN(cantidad) || isNaN(total) || cantidad <= 0 || total <= 0) {
      alert('Por favor ingrese valores válidos');
      return;
    }

    let ticketsGenerados = [];
    let montoRestante = total;

    for (let i = 0; i < cantidad; i++) {
      const esUltimo = i === cantidad - 1;
      let montoTicket;
      
      if (esUltimo) {
        montoTicket = montoRestante;
      } else {
        const maxMonto = montoRestante / (cantidad - i) * 2;
        montoTicket = Math.random() * (maxMonto - 1) + 1;
        montoTicket = Math.round(montoTicket * 100) / 100;
      }

      montoRestante -= montoTicket;
      
      let clienteNombre = 'Consumidor Final';
      if (esClienteParticular && selectedClientId) {
        const c = clients.find(cl => cl.id === selectedClientId);
        if (c) clienteNombre = c.name;
      }
      
      ticketsGenerados.push({
        id: i + 1,
        monto: montoTicket,
        tipo: Math.random() < 0.5 ? 'Pollo' : 'Cerdo',
        cliente: clienteNombre
      });
    }

    setTickets(ticketsGenerados);
    setResultados([]);
    setMensajeResultado(null);
  };

  const facturar = async () => {
    if (tickets.length === 0) return;

    setProcesando(true);
    setProgreso(0);
    setResultados([]);
    setMensajeResultado(null);

    try {
      const client = esClienteParticular && selectedClientId ? clients.find(c => c.id === selectedClientId) : null;
      
      const response = await fetch(`${API_BASE}/api/facturacion/generar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          tickets,
          docTipo: client ? (client.tax_type === 'CUIT' ? 80 : 96) : 99,
          docNro: client ? client.tax_id : 0,
          cbteTipo: client && client.tax_type === 'CUIT' ? 6 : 6 // Por ahora mantenemos Factura B (6), o podríamos poner lógica de A
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar las facturas');
      }

      const data = await response.json();
      
      setResultados(data.facturas || []);
      setMensajeResultado(data.message);
      setProgreso(100);

      // Limpiar tickets y recargar historial
      setTickets([]);
      setMontoTotalRaw('');
      setCantidadTickets('');
      cargarHistorial();

    } catch (error) {
      console.error('Error:', error);
      setMensajeResultado('Error al facturar: ' + error.message);
    } finally {
      setProcesando(false);
    }
  };

  const formatearMontoInput = (valorRaw) => {
    if (!valorRaw) {
      return '';
    }

    const [enteros, decimales] = valorRaw.split(',');
    const numero = parseFloat(`${enteros}.${decimales || ''}`);

    if (Number.isNaN(numero)) {
      return '';
    }

    const decimalesCount = decimales ? Math.min(decimales.length, 2) : 0;

    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: decimalesCount,
      maximumFractionDigits: decimalesCount
    }).format(numero);
  };

  const normalizarMontoInput = (valor) => {
    const sinPuntos = valor.replace(/\./g, '');
    const soloNumerosYComa = sinPuntos.replace(/[^\d,]/g, '');
    const partes = soloNumerosYComa.split(',');

    if (partes.length === 1) {
      return partes[0];
    }

    return `${partes[0]},${partes.slice(1).join('').slice(0, 2)}`;
  };

  const handleMontoChange = (event) => {
    const valorNormalizado = normalizarMontoInput(event.target.value);
    setMontoTotalRaw(valorNormalizado);
  };

  const reimprimirFactura = (factura) => {
    const ventana = window.open('', '_blank', 'width=600,height=900');

    if (!ventana) {
      alert('Habilite las ventanas emergentes para reimprimir la factura.');
      return;
    }

    const cuit = import.meta.env.VITE_AFIP_CUIT || '2-043056237-2';
    const razonSocial = import.meta.env.VITE_RAZON_SOCIAL || 'Los Nonos';
    const domicilio = import.meta.env.VITE_DOMICILIO_FISCAL || '';
    const condicionIVA = import.meta.env.VITE_CONDICION_IVA || 'Responsable Inscripto';
    const inicioActividades = import.meta.env.VITE_INICIO_ACTIVIDADES || '';

    const neto = (factura.monto / 1.105).toFixed(2);
    const iva = (factura.monto - factura.monto / 1.105).toFixed(2);

    const contenido = `
      <html>
        <head>
          <title>Factura ${factura.numeroFactura || ''}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Arial', sans-serif; padding: 20px; color: #333; font-size: 12px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 12px; margin-bottom: 12px; }
            .header h1 { font-size: 18px; margin-bottom: 4px; }
            .tipo-factura { 
              display: inline-block; 
              border: 2px solid #333; 
              padding: 4px 16px; 
              font-size: 22px; 
              font-weight: bold; 
              margin: 8px 0;
            }
            .datos-emisor { margin-bottom: 12px; border-bottom: 1px solid #ccc; padding-bottom: 8px; }
            .datos-emisor p { margin: 2px 0; }
            .datos-factura { 
              display: flex; 
              justify-content: space-between; 
              border-bottom: 1px solid #ccc; 
              padding-bottom: 8px; 
              margin-bottom: 12px; 
            }
            .datos-factura .col { flex: 1; }
            .row { margin: 4px 0; display: flex; justify-content: space-between; }
            .label { font-weight: bold; }
            .totales { border-top: 2px solid #333; margin-top: 12px; padding-top: 8px; }
            .total-final { font-size: 16px; font-weight: bold; margin-top: 8px; }
            .cae-section { 
              margin-top: 16px; 
              border-top: 2px solid #333; 
              padding-top: 8px;
              text-align: center;
            }
            .cae-section .cae-number { font-size: 14px; font-weight: bold; letter-spacing: 1px; }
            .status-badge {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 4px;
              font-weight: bold;
              font-size: 11px;
            }
            .status-approved { background: #d4edda; color: #155724; }
            .status-error { background: #f8d7da; color: #721c24; }
            .footer { margin-top: 16px; text-align: center; font-size: 10px; color: #666; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${razonSocial}</h1>
            <div class="tipo-factura">${factura.tipoComprobante ? factura.tipoComprobante.replace('Factura ', '') : 'B'}</div>
          </div>

          <div class="datos-emisor">
            <p><span class="label">Razón Social:</span> ${razonSocial}</p>
            ${domicilio ? `<p><span class="label">Domicilio:</span> ${domicilio}</p>` : ''}
            <p><span class="label">CUIT:</span> ${cuit}</p>
            <p><span class="label">Condición IVA:</span> ${condicionIVA}</p>
            ${inicioActividades ? `<p><span class="label">Inicio Actividades:</span> ${inicioActividades}</p>` : ''}
          </div>

          <div class="datos-factura">
            <div class="col">
              <p><span class="label">Comprobante Nro:</span> ${factura.numeroFactura || '-'}</p>
              <p><span class="label">Fecha:</span> ${formatearFecha(factura.fecha)}</p>
              <p><span class="label">Punto de Venta:</span> ${factura.ptoVta ? String(factura.ptoVta).padStart(4, '0') : '-'}</p>
            </div>
            <div class="col" style="text-align: right;">
              <p><span class="label">Cliente:</span> ${factura.cliente || 'Consumidor Final'}</p>
              <p><span class="label">Tipo Doc:</span> ${factura.docTipo === 80 ? 'CUIT' : factura.docTipo === 96 ? 'DNI' : 'Consumidor Final'}</p>
              <p><span class="label">Nro Doc:</span> ${factura.docNro || '-'}</p>
            </div>
          </div>

          <div class="totales">
            <div class="row">
              <span class="label">Neto Gravado:</span>
              <span>$ ${formatearMonto(neto)}</span>
            </div>
            <div class="row">
              <span class="label">IVA 10,5%:</span>
              <span>$ ${formatearMonto(iva)}</span>
            </div>
            <div class="row total-final">
              <span>TOTAL:</span>
              <span>$ ${formatearMonto(factura.monto)}</span>
            </div>
          </div>

          <div class="cae-section">
            <p><span class="label">CAE Nro:</span> <span class="cae-number">${factura.cae || '---'}</span></p>
            <p><span class="label">Vto CAE:</span> ${formatearVencimientoCAE(factura.caeVencimiento)}</p>
            <p style="margin-top: 4px;">
              <span class="status-badge ${factura.status === 'APPROVED' ? 'status-approved' : 'status-error'}">
                ${factura.status === 'APPROVED' ? '✓ APROBADA' : '✗ ERROR'}
              </span>
            </p>
          </div>

          <div class="footer">
            <p>Comprobante generado electrónicamente</p>
          </div>
        </body>
      </html>
    `;

    ventana.document.write(contenido);
    ventana.document.close();
    ventana.focus();
    setTimeout(() => ventana.print(), 300);
  };

  const inputStyle = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: '#2d2d2d',
      color: '#fff',
      borderRadius: '10px',
      '&:hover fieldset': { borderColor: '#2563eb' },
      '&.Mui-focused fieldset': { borderColor: '#2563eb', borderWidth: '2px' }
    },
    '& .MuiOutlinedInput-input': { color: '#fff' },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#404040' }
  };

  const dateInputStyle = {
    ...inputStyle,
    '& .MuiOutlinedInput-root': {
      ...inputStyle['& .MuiOutlinedInput-root'],
      padding: '8px 12px'
    },
    '& .MuiOutlinedInput-input': { 
      color: '#fff',
      padding: '8px 0'
    }
  };

  const totalAprobados = resultados.filter(r => r.status === 'APPROVED').length;
  const totalErrores = resultados.filter(r => r.status === 'ERROR').length;

  return (
    <Box sx={{ 
      display: 'flex',
      gap: 3,
      padding: '2rem',
      minHeight: '100vh',
      background: '#121212'
    }}>
      {/* Panel Principal */}
      <Box sx={{ flex: 1, maxWidth: '900px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <FaFileInvoiceDollar size={40} color="#2563eb" />
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #2563eb, #1d4ed8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Facturación Electrónica
          </Typography>
        </Box>
        
        <Paper sx={{
          padding: '2rem',
          background: '#1e1e1e',
          border: '1px solid #333',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <FaMoneyBillWave size={24} color="#2563eb" />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#e5e7eb' }}>
                  Monto Total
                </Typography>
              </Box>
              <TextField
                fullWidth
                type="text"
                value={formatearMontoInput(montoTotalRaw)}
                onChange={handleMontoChange}
                placeholder="Ingrese el monto"
                variant="outlined"
                sx={inputStyle}
                disabled={procesando}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <FaTicketAlt size={24} color="#2563eb" />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#e5e7eb' }}>
                  Cantidad de Tickets
                </Typography>
              </Box>
              <TextField
                fullWidth
                type="text"
                value={cantidadTickets}
                onChange={(e) => setCantidadTickets(e.target.value)}
                placeholder="Cantidad de tickets"
                variant="outlined"
                sx={inputStyle}
                disabled={procesando}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1, borderColor: '#333' }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={esClienteParticular}
                      onChange={(e) => setEsClienteParticular(e.target.checked)}
                      sx={{ color: '#2563eb', '&.Mui-checked': { color: '#2563eb' } }}
                    />
                  }
                  label={<Typography sx={{ color: '#e5e7eb' }}>Facturar a cliente particular?</Typography>}
                />

                {esClienteParticular && (
                  <FormControl fullWidth sx={inputStyle}>
                    <InputLabel id="select-cliente-label" sx={{ color: '#9ca3af' }}>Seleccionar Cliente</InputLabel>
                    <Select
                      labelId="select-cliente-label"
                      value={selectedClientId}
                      label="Seleccionar Cliente"
                      onChange={(e) => setSelectedClientId(e.target.value)}
                      sx={{
                        '& .MuiSelect-select': { color: '#fff' },
                        '& .MuiSvgIcon-root': { color: '#9ca3af' }
                      }}
                    >
                      {clients.map((client) => (
                        <MenuItem key={client.id} value={client.id}>
                          {client.name} {client.tax_id ? `(${client.tax_id})` : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'flex-end', mt: 2 }}>
              <Button 
                variant="contained" 
                onClick={generarTicketsAleatorios}
                disabled={procesando}
                fullWidth
                sx={{ 
                  background: 'linear-gradient(45deg, #2563eb, #1d4ed8)',
                  padding: '12px 32px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  borderRadius: '10px',
                  textTransform: 'none',
                  height: '56px',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1d4ed8, #1e40af)',
                    boxShadow: '0 6px 16px rgba(37, 99, 235, 0.4)'
                  }
                }}
              >
                Simular Tickets
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Barra de progreso mientras se factura */}
        {procesando && (
          <Box sx={{ mt: 3 }}>
            <Paper sx={{ p: 3, background: '#1e1e1e', border: '1px solid #333', borderRadius: '12px' }}>
              <Typography sx={{ color: '#e5e7eb', mb: 2, fontWeight: 'bold' }}>
                Enviando tickets a AFIP... Por favor espere.
              </Typography>
              <LinearProgress 
                variant="indeterminate" 
                sx={{
                  borderRadius: '6px',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(45deg, #2563eb, #1d4ed8)'
                  },
                  backgroundColor: '#333'
                }}
              />
            </Paper>
          </Box>
        )}

        {/* Resultados de la facturación */}
        {resultados.length > 0 && (
          <Box sx={{ mt: 3 }}>
            {mensajeResultado && (
              <Alert 
                severity={totalErrores === 0 ? 'success' : totalErrores === resultados.length ? 'error' : 'warning'}
                sx={{ mb: 2, borderRadius: '10px' }}
              >
                {mensajeResultado}
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Chip 
                icon={<FaCheckCircle />} 
                label={`Aprobadas: ${totalAprobados}`} 
                sx={{ 
                  background: 'rgba(5, 150, 105, 0.2)', 
                  color: '#34d399',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  py: 2
                }} 
              />
              {totalErrores > 0 && (
                <Chip 
                  icon={<FaTimesCircle />} 
                  label={`Errores: ${totalErrores}`} 
                  sx={{ 
                    background: 'rgba(239, 68, 68, 0.2)', 
                    color: '#f87171',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    py: 2
                  }} 
                />
              )}
            </Box>

            <Typography variant="h6" sx={{ mb: 2, color: '#e5e7eb', fontWeight: 'bold' }}>
              Comprobantes Generados
            </Typography>

            <Grid container spacing={2}>
              {resultados.map((resultado, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Card sx={{
                    background: resultado.status === 'APPROVED' ? '#1a2e1a' : '#2e1a1a',
                    borderRadius: '12px',
                    border: resultado.status === 'APPROVED' ? '1px solid #065f46' : '1px solid #7f1d1d',
                  }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography sx={{ color: resultado.status === 'APPROVED' ? '#34d399' : '#f87171', fontWeight: 'bold', fontSize: '0.9rem' }}>
                          Ticket #{resultado.ticketId}
                        </Typography>
                        <Chip 
                          label={resultado.status === 'APPROVED' ? 'APROBADA' : 'ERROR'}
                          size="small"
                          sx={{
                            background: resultado.status === 'APPROVED' ? '#059669' : '#dc2626',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '0.7rem'
                          }}
                        />
                      </Box>

                      <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: '1.2rem', mb: 1 }}>
                        $ {formatearMonto(resultado.monto)}
                      </Typography>

                      {resultado.status === 'APPROVED' && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography sx={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                            <strong style={{ color: '#d1d5db' }}>Nro Cbte:</strong>{' '}
                            {resultado.ptoVta ? `${String(resultado.ptoVta).padStart(4, '0')}-${String(resultado.cbteNro).padStart(8, '0')}` : resultado.cbteNro}
                          </Typography>
                          <Typography sx={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                            <strong style={{ color: '#d1d5db' }}>CAE:</strong> {resultado.cae}
                          </Typography>
                          <Typography sx={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                            <strong style={{ color: '#d1d5db' }}>Vto CAE:</strong> {formatearVencimientoCAE(resultado.caeVencimiento)}
                          </Typography>
                        </Box>
                      )}

                      {resultado.status === 'ERROR' && (
                        <Typography sx={{ color: '#fca5a5', fontSize: '0.8rem' }}>
                          {resultado.error}
                        </Typography>
                      )}

                      {resultado.status === 'APPROVED' && (
                        <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<FaPrint size={12} />}
                            onClick={() => reimprimirFactura(resultado)}
                            sx={{
                              borderColor: '#059669',
                              color: '#34d399',
                              textTransform: 'none',
                              fontSize: '0.75rem',
                              '&:hover': {
                                borderColor: '#34d399',
                                background: 'rgba(5, 150, 105, 0.1)'
                              }
                            }}
                          >
                            Imprimir
                          </Button>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Tickets pendientes de facturar */}
        {tickets.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ mb: 3, color: '#e5e7eb', fontWeight: 'bold' }}>
              Tickets Generados ({tickets.length})
            </Typography>
            <Grid container spacing={3}>
              {tickets.map((ticket) => (
                <Grid item xs={12} sm={6} md={4} key={ticket.id}>
                  <Card sx={{
                    background: '#2d2d2d',
                    borderRadius: '12px',
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 12px 20px rgba(0,0,0,0.15)'
                    }
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: '#60a5fa',
                          fontWeight: 'bold',
                          mb: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <FaTicketAlt />
                        Ticket #{ticket.id}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography sx={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>
                          ${formatearMonto(ticket.monto)}
                        </Typography>
                        <Typography sx={{ color: '#9ca3af' }}>
                          Tipo: <span style={{ color: '#e5e7eb', fontWeight: 500 }}>{ticket.tipo}</span>
                        </Typography>
                        <Typography sx={{ color: '#9ca3af' }}>
                          Cliente: <span style={{ color: '#e5e7eb', fontWeight: 500 }}>{ticket.cliente}</span>
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={facturar}
                disabled={procesando}
                sx={{ 
                  background: 'linear-gradient(45deg, #059669, #047857)',
                  padding: '16px 48px',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  borderRadius: '12px',
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #047857, #065f46)',
                    boxShadow: '0 6px 16px rgba(5, 150, 105, 0.4)'
                  },
                  '&:disabled': {
                    background: '#333',
                    color: '#666'
                  }
                }}
              >
                {procesando ? 'Facturando...' : `Facturar ${tickets.length} Ticket${tickets.length > 1 ? 's' : ''}`}
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      {/* Panel Lateral - Historial */}
      <Box sx={{ width: '380px', flexShrink: 0 }}>
        <Paper sx={{
          padding: '1.5rem',
          background: '#1e1e1e',
          border: '1px solid #333',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          position: 'sticky',
          top: '2rem',
          maxHeight: 'calc(100vh - 4rem)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <FaHistory size={24} color="#2563eb" />
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#e5e7eb' }}>
              Historial de Facturas
            </Typography>
          </Box>

          {/* Filtros de fecha */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <FaCalendarAlt size={16} color="#9ca3af" />
              <Typography sx={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                Filtrar por fecha
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
              <TextField
                type="date"
                size="small"
                value={filtroFechaDesde}
                onChange={(e) => setFiltroFechaDesde(e.target.value)}
                placeholder="Desde"
                sx={dateInputStyle}
              />
              <TextField
                type="date"
                size="small"
                value={filtroFechaHasta}
                onChange={(e) => setFiltroFechaHasta(e.target.value)}
                placeholder="Hasta"
                sx={dateInputStyle}
              />
              <Button 
                size="small" 
                onClick={cargarHistorial}
                sx={{ color: '#60a5fa', textTransform: 'none' }}
              >
                Actualizar
              </Button>
            </Box>
          </Box>

          <Divider sx={{ borderColor: '#333', mb: 2 }} />

          {/* Resumen */}
          {historialFiltrado.length > 0 && (
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', px: 1 }}>
              <Typography sx={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                {historialFiltrado.length} factura{historialFiltrado.length > 1 ? 's' : ''}
              </Typography>
              <Typography sx={{ color: '#60a5fa', fontSize: '0.8rem', fontWeight: 'bold' }}>
                Total: $ {formatearMonto(historialFiltrado.reduce((sum, f) => sum + (f.monto || 0), 0))}
              </Typography>
            </Box>
          )}

          {/* Lista de facturas */}
          <Box sx={{ 
            flex: 1,
            overflowY: 'auto',
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-track': { background: '#1e1e1e' },
            '&::-webkit-scrollbar-thumb': { background: '#404040', borderRadius: '3px' }
          }}>
            {historialFiltrado.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography sx={{ color: '#6b7280' }}>
                  No hay facturas registradas
                </Typography>
              </Box>
            ) : (
              historialFiltrado.map((factura, index) => (
                <Box 
                  key={factura.id || index}
                  sx={{
                    p: 2,
                    mb: 1,
                    background: '#2d2d2d',
                    borderRadius: '8px',
                    border: '1px solid #404040',
                    '&:hover': {
                      borderColor: '#2563eb',
                      background: '#333'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography sx={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '0.8rem' }}>
                      {factura.numeroFactura || `#${factura.id}`}
                    </Typography>
                    <Chip 
                      label={factura.status === 'APPROVED' ? '✓' : '✗'}
                      size="small"
                      sx={{
                        minWidth: '24px',
                        height: '20px',
                        background: factura.status === 'APPROVED' ? '#059669' : '#dc2626',
                        color: '#fff',
                        fontSize: '0.7rem'
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem' }}>
                      $ {formatearMonto(factura.monto)}
                    </Typography>
                    <Typography sx={{ color: '#9ca3af', fontSize: '0.7rem' }}>
                      {formatearFecha(factura.fecha)}
                    </Typography>
                  </Box>

                  {factura.cae && (
                    <Typography sx={{ color: '#6b7280', fontSize: '0.7rem' }}>
                      CAE: {factura.cae} | Vto: {formatearVencimientoCAE(factura.caeVencimiento)}
                    </Typography>
                  )}

                  <Typography sx={{ color: '#9ca3af', fontSize: '0.7rem', mt: 0.5 }}>
                    {factura.tipoComprobante} - {factura.cliente}
                  </Typography>

                  <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<FaPrint size={10} />}
                      onClick={() => reimprimirFactura(factura)}
                      sx={{
                        borderColor: '#2563eb',
                        color: '#93c5fd',
                        textTransform: 'none',
                        fontSize: '0.7rem',
                        py: 0.3,
                        '&:hover': {
                          borderColor: '#60a5fa',
                          background: 'rgba(37, 99, 235, 0.1)'
                        }
                      }}
                    >
                      Reimprimir
                    </Button>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Facturacion;
