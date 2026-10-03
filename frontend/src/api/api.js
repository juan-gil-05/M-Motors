/* eslint-disable no-unused-vars */
import axios from "axios"
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants"

// import.meta.env.PROD is initialized automatically by VITE when app is in prod 
const defaultBaseURL = import.meta.env.PROD
  ? "https://m-motors-9ufv.onrender.com/" // Endpoint API for production
  : "http://localhost:8000/" // Endpoint API for local


const API_BASE_URL = import.meta.env.VITE_API_URL || defaultBaseURL;

// Create a configured Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'content-type': 'application/json',
  }
})

// Function to refresh the acces token
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN);

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const response = await axios.post(`${API_BASE_URL}api/token/refresh/`, {
    refresh: refreshToken,
  });

  const newAccessToken = response.data.access;
  localStorage.setItem(ACCESS_TOKEN, newAccessToken);

  return newAccessToken;
};

// Request Interceptor: Attach JWT Token automatically if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// If the access token is expired, call the refresh token function and retry the request with the new acces token 
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);
        window.location.href = "/connexion";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;