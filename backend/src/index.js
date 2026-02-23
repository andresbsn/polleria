const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes imports
const productRoutes = require('./routes/productRoutes');
const salesRoutes = require('./routes/salesRoutes');
const authRoutes = require('./routes/authRoutes');
const auditRoutes = require('./routes/auditRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const cashRoutes = require('./routes/cashRoutes');
const facturacionRoutes = require('./routes/facturacion');

// Header check
app.get('/', (req, res) => {
    res.send({ status: 'API Online', version: '1.0.0', afip_env: process.env.AFIP_PRODUCTION === 'true' ? 'PROD' : 'HOMO' });
});

// Mount Routes
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/clients', require('./routes/clientRoutes'));
app.use('/api/audit', auditRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminUserRoutes);
app.use('/api/cash', cashRoutes);
app.use('/api/facturacion', facturacionRoutes);

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ error: 'Something went wrong!', details: err.message });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
