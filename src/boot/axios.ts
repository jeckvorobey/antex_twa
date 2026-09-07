import axios from 'axios';
import { defineBoot } from '#q-app/wrappers';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && !config.headers.has('Authorization')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Запоздавший 401 не должен удалять JWT уже другой сессии.
    const token = localStorage.getItem('access_token');
    if (
      error.response?.status === 401 &&
      token &&
      error.config?.headers?.Authorization === `Bearer ${token}`
    ) {
      localStorage.removeItem('access_token');
    }
    return Promise.reject(error);
  },
);

export default defineBoot(({ app }) => {
  app.config.globalProperties.$api = api;
});

export { api };
