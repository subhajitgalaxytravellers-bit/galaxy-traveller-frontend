import axios from "axios";
import {
  clearAuth,
  getValidToken,
  isAuthErrorResponse,
  setAuth,
} from "@/lib/auth";

const API_BASE =
  (process.env.NEXT_PUBLIC_BASE_API || "http://localhost:8080").replace(
    /\/$/,
    ""
  );

const client = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 10000,
});

/**
 * ✅ AUTO ATTACH TOKEN IF PRESENT
 */
client.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = getValidToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message || error?.message || "";
    if (typeof window !== "undefined" && isAuthErrorResponse(status, message)) {
      clearAuth("expired");
    }
    return Promise.reject(error);
  }
);

export default client;

export const Base_Url = API_BASE;

/**
 * Optional manual setters (still useful)
 */
export const setToken = (token, user) => {
  setAuth({ token, user });
  client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
};

export const removeToken = () => {
  clearAuth("logout");
  delete client.defaults.headers.common["Authorization"];
};

export const get = (path, config = {}) => client.get(path, config);
export const patch = (path, data) => client.patch(path, data);
export const post = (path, data) => client.post(path, data);
export const put = (path, data) => client.put(path, data);
export const del = (path) => client.delete(path);

export const upload = (path, data) =>
  client.post(path, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const download = (path) => client.get(path, { responseType: "blob" });

export const downloadFile = (path) =>
  client.get(path, { responseType: "blob" });

export const downloadImage = (path) =>
  client.get(path, { responseType: "blob" });
