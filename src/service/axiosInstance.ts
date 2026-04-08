import axios, { AxiosError } from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1",
  headers: {},
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      const token = localStorage.getItem("access_token");
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");

      // Only redirect to login if we had a token (expired) 
      // or if we are not on the Home/Product Detail page
      const publicPaths = ["/", "/product"];
      const currentPath = window.location.pathname;
      const isPublicPath = publicPaths.some(path =>
        currentPath === path || (path !== "/" && currentPath.startsWith(path))
      );

      if (token || !isPublicPath) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
