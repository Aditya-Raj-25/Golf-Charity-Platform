import axios from 'axios';
import { supabase } from './supabaseClient';

const isLocal = window.location.hostname === 'localhost';

const api = axios.create({
  baseURL: isLocal ? 'http://localhost:3001/api' : 'https://golf-charity-backend-pku8.onrender.com/api',
});

// Inject auth token
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export default api;
