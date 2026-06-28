import axios from "axios";
import genFingerprint from "./fingerprint";

const api = axios.create({
  timeout: 20000,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  config.headers["X-Fingerprint"] = genFingerprint();
  return config;
});

export default api;
