import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api');
const API = axios.create({ baseURL });

// Asset APIs
export const getAssets = (params) => API.get('/assets', { params });
export const getAsset = (id) => API.get(`/assets/${id}`);
export const createAsset = (data) => API.post('/assets', data);
export const updateAsset = (id, data) => API.put(`/assets/${id}`, data);
export const deleteAsset = (id) => API.delete(`/assets/${id}`);

// Maintenance APIs
export const getMaintenanceLogs = (params) => API.get('/maintenance', { params });
export const createMaintenanceLog = (data) => API.post('/maintenance', data);
export const updateMaintenanceLog = (id, data) => API.put(`/maintenance/${id}`, data);
export const deleteMaintenanceLog = (id) => API.delete(`/maintenance/${id}`);

// Auth APIs
export const login = (credentials) => API.post('/auth/login', credentials);
