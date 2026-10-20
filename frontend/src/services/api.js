import axios from 'axios';
import { API_URL } from '../config/config';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Best human-readable message from an API, MetaMask or ethers error.
export function errorMessage(error, fallback = 'Something went wrong.') {
  if (error?.code === 'ACTION_REJECTED') return 'Request rejected in MetaMask.';
  return (
    error?.response?.data?.message ||
    error?.reason ||
    error?.shortMessage ||
    error?.message ||
    fallback
  );
}

export default api;
