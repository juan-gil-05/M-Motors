import axios from "axios"

// import.meta.env.PROD is initialized automatically by VITE when app is in prod 
const defaultBaseURL = import.meta.env.PROD
    ? "https://m-motors-9ufv.onrender.com/" // Endpoint API for production
    : "http://localhost:8000/" // Endpoint API for local

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || defaultBaseURL,
})

export default api
