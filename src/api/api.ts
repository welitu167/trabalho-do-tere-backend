import axios from 'axios';

const api = axios.create({
  // Ajuste `baseURL` conforme necessário para seu backend
  baseURL: process.env.API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
