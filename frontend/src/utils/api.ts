import axios from "axios";

const baseURL = process.env.REACT_APP_API_URL || "http://localhost:3300/api";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    const storedAuth = JSON.parse(
      localStorage.getItem("hockey-pool-auth") || "{}",
    );
    const token = storedAuth.state?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem("hockey-pool-auth");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
