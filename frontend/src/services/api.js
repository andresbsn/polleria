import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

console.log('Axios Base URL:', API_URL);

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor
// Request interceptor to add Token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`[Request] ${config.method.toUpperCase()} ${config.url}`, config.data || '');
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response interceptor
api.interceptors.response.use(
    (response) => {
        console.log(`[Response] ${response.status} ${response.statusText}`, response.data);
        return response;
    },
    (error) => {
        console.error('API Response Error:', error.response || error.message);
        return Promise.reject(error);
    }
);

export const login = (username, password) => api.post('/auth/login', { username, password });

export const getProducts = () => api.get('/products');
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const createSale = (data) => api.post('/sales', data);
export const getSales = () => api.get('/sales');
export const getSaleById = (id) => api.get(`/sales/${id}`);
export const retryInvoice = (data) => api.post('/sales/retry-invoice', data);

export const getClients = () => api.get('/clients');
export const createClient = (data) => api.post('/clients', data);
export const getClientById = (id) => api.get(`/clients/${id}`);
export const registerClientPayment = (data) => api.post('/clients/payment', data);

export const getCategories = () => api.get('/categories');
export const createCategory = (data) => api.post('/categories', data);
export const setCategoryActive = (id, data) => api.put(`/categories/${id}`, data);

export const listUsers = () => api.get('/admin/users');
export const createUser = (data) => api.post('/admin/users', data);

export const getCashCurrent = () => api.get('/cash/current');
export const openCashSession = (data) => api.post('/cash/open', data);
export const closeCashSession = (data) => api.post('/cash/close', data);
export const getCashMovements = (params) => api.get('/cash/movements', { params });

export default api;
