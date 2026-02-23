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
app.use('/products', productRoutes);
app.use('/sales', salesRoutes);
app.use('/auth', authRoutes);
app.use('/clients', require('./routes/clientRoutes'));
app.use('/audit', auditRoutes);
app.use('/reports', reportsRoutes);
app.use('/categories', categoryRoutes);
app.use('/admin', adminUserRoutes);
app.use('/cash', cashRoutes);
app.use('/facturacion', facturacionRoutes);

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ error: 'Something went wrong!', details: err.message });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
