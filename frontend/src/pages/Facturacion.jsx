import { useState, useEffect } from 'react';
import { Card, CardContent, Box, Paper, TextField, Divider } from '@mui/material';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { FaFileInvoiceDollar, FaMoneyBillWave, FaTicketAlt, FaHistory, FaCalendarAlt } from 'react-icons/fa';

const formatearMonto = (monto) => {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(monto);
};

const Facturacion = () => {
  const [montoTotalRaw, setMontoTotalRaw] = useState('');
  const [cantidadTickets, setCantidadTickets] = useState('');
  const [tickets, setTickets] = useState([]);
  const [historialFacturas, setHistorialFacturas] = useState([]);
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [historialFiltrado, setHistorialFiltrado] = useState([]);

  useEffect(() => {
    cargarHistorial();
  }, []);

  useEffect(() => {
    filtrarHistorial();
  }, [historialFacturas, filtroFechaDesde, filtroFechaHasta]);

  const cargarHistorial = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/facturacion/historial', {
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
    let filtrado = [...historialFacturas];

    if (filtroFechaDesde) {
      const desde = new Date(`${filtroFechaDesde}T00:00:00`);
      filtrado = filtrado.filter((factura) => {
        const fechaFactura = new Date(factura.fecha || factura.fechaVencimientoCae);
        fechaFactura.setHours(0, 0, 0, 0);
        return fechaFactura >= desde;
      });
    }

    if (filtroFechaHasta) {
      const hasta = new Date(`${filtroFechaHasta}T23:59:59`);
      filtrado = filtrado.filter((factura) => {
        const fechaFactura = new Date(factura.fecha || factura.fechaVencimientoCae);
        fechaFactura.setHours(23, 59, 59, 999);
        return fechaFactura <= hasta;
      });
    }

    setHistorialFiltrado(filtrado);
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
      
      ticketsGenerados.push({
        id: i + 1,
        monto: montoTicket,
        tipo: Math.random() < 0.5 ? 'Pollo' : 'Cerdo',
        cliente: 'Consumidor Final'
      });
    }

    setTickets(ticketsGenerados);
  };

  const facturar = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/facturacion/generar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ tickets })
      });

      if (!response.ok) {
        throw new Error('Error al generar las facturas');
      }

      const data = await response.json();
      alert('Facturas generadas exitosamente');
      console.log('Facturas:', data.facturas);
      setTickets([]);
      setMontoTotalRaw('');
      setCantidadTickets('');
      cargarHistorial();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al generar las facturas: ' + error.message);
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
    const ventana = window.open('', '_blank', 'width=600,height=800');

    if (!ventana) {
      alert('Habilite las ventanas emergentes para reimprimir la factura.');
      return;
    }

    const contenido = `
      <html>
        <head>
          <title>Factura #${factura.numeroFactura || factura.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { margin-bottom: 8px; }
            .row { margin: 6px 0; }
            .label { font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Factura #${factura.numeroFactura || factura.id}</h1>
          <div class="row"><span class="label">Fecha:</span> ${new Date(factura.fecha || factura.fechaVencimientoCae).toLocaleDateString('es-AR')}</div>
          <div class="row"><span class="label">Monto:</span> $${formatearMonto(factura.monto)}</div>
          <div class="row"><span class="label">Tipo:</span> ${factura.tipo}</div>
          <div class="row"><span class="label">Cliente:</span> ${factura.cliente}</div>
        </body>
      </html>
    `;

    ventana.document.write(contenido);
    ventana.document.close();
    ventana.focus();
    ventana.print();
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
            Facturación
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
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ mt: 3 }}>
                <Button 
                  variant="contained" 
                  onClick={generarTicketsAleatorios}
                  sx={{ 
                    background: 'linear-gradient(45deg, #2563eb, #1d4ed8)',
                    padding: '12px 32px',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    borderRadius: '10px',
                    textTransform: 'none',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1d4ed8, #1e40af)',
                      boxShadow: '0 6px 16px rgba(37, 99, 235, 0.4)'
                    }
                  }}
                >
                  Simular Tickets
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {tickets.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ mb: 3, color: '#e5e7eb', fontWeight: 'bold' }}>
              Tickets Generados
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
                  }
                }}
              >
                Facturar Todos los Tickets
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      {/* Panel Lateral - Historial */}
      <Box sx={{ width: '350px', flexShrink: 0 }}>
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
            </Box>
          </Box>

          <Divider sx={{ borderColor: '#333', mb: 2 }} />

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
                    <Typography sx={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '0.875rem' }}>
                      #{factura.numeroFactura || factura.id}
                    </Typography>
                    <Typography sx={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                      {new Date(factura.fecha).toLocaleDateString('es-AR')}
                    </Typography>
                  </Box>
                  <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    ${formatearMonto(factura.monto)}
                  </Typography>
                  <Typography sx={{ color: '#9ca3af', fontSize: '0.75rem', mt: 0.5 }}>
                    {factura.tipo} - {factura.cliente}
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => reimprimirFactura(factura)}
                      sx={{
                        borderColor: '#2563eb',
                        color: '#93c5fd',
                        textTransform: 'none',
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
