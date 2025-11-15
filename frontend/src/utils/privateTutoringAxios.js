import axios from 'axios';
import { getToken, getRefreshToken, storeTokens, logout } from './privateTutoringAuth';

const privateTutoringAxios = axios.create({
  baseURL: '/api/private-tutoring',
});

privateTutoringAxios.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue = [];

const processQueue = (error, token = null) => {
  pendingQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token);
    }
  });
  pendingQueue = [];
};

privateTutoringAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const code = error.response?.data?.code;

    const isAuthError = error.response?.status === 401 && (code === 'TOKEN_EXPIRED' || code === 'INVALID_TOKEN');
    if (!isAuthError || originalRequest.__isRetry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          originalRequest.__isRetry = true;
          return privateTutoringAxios(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    isRefreshing = true;

    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const refreshResponse = await axios.post('/api/private-tutoring/auth/refresh', null, {
        headers: { Authorization: `Bearer ${refreshToken}` },
      });

      const newAccessToken = refreshResponse.data?.access_token;
      const newRefreshToken = refreshResponse.data?.refresh_token;

      if (!newAccessToken) {
        throw new Error('No access token in refresh response');
      }

      storeTokens(newAccessToken, newRefreshToken, null);
      processQueue(null, newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      originalRequest.__isRetry = true;
      return privateTutoringAxios(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      logout();
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default privateTutoringAxios;


