import axios from "axios";
import toast from "react-hot-toast";


const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const orgId = localStorage.getItem("currentOrgId");
  if (orgId) {
    config.headers["x-org-id"] = orgId;
  }

  return config;
});


api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const { data } = await axios.post("/api/auth/refresh", { refreshToken });

          if (data.success) {
            localStorage.setItem("accessToken", data.data.accessToken);
            localStorage.setItem("refreshToken", data.data.refreshToken);
            originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("currentOrgId");
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      } else {
        
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
      }
    }

    
    if (error.response?.status !== 401) {
      const message = error.response?.data?.message || "Something went wrong";
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
