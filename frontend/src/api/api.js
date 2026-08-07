/* eslint-disable no-unused-vars */
import axios from "axios"
import {ACCESS_TOKEN, REFRESH_TOKEN} from "../constants"

// import.meta.env.PROD is initialized automatically by VITE when app is in prod 
const defaultBaseURL = import.meta.env.PROD
    ? "https://m-motors-9ufv.onrender.com/" // Endpoint API for production
    : "http://localhost:8000/" // Endpoint API for local

// Create a configured Axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || defaultBaseURL,
    headers: {
        'content-type': 'application/json',
    }
})

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

export default api;