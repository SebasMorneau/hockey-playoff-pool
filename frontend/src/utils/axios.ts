import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3300/api";

// Create axios instance with base URL
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Add request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const storedAuth = JSON.parse(
      localStorage.getItem("hockey-pool-auth") || "{}",
    );
    const token = storedAuth.state?.token;
    console.log("Auth state from localStorage:", {
      hasToken: !!token,
      tokenPrefix: token ? token.substring(0, 10) + "..." : "none",
    });

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log("Request config:", {
      url: config.url,
      method: config.method,
      hasAuthHeader: !!config.headers.Authorization,
    });
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  },
);

// Add response interceptor to handle auth errors
axiosInstance.interceptors.response.use(
  (response) => {
    console.log("Response received:", {
      url: response.config.url,
      status: response.status,
      hasData: !!response.data,
    });
    return response;
  },
  (error) => {
    console.error("Response error:", {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
    });
    if (error.response?.status === 401) {
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes("/login")) {
        localStorage.removeItem("hockey-pool-auth");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
