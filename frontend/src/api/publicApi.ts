// path: frontend/src/api/publicApi.ts
import axios from "axios";

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 0
});

export default publicApi;
