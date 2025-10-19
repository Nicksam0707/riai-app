// Prefer runtime-configured value from public/env.js when available
const runtimeEnv = typeof window !== 'undefined' && window.__ENV ? window.__ENV : {};
const API_BASE_URL = runtimeEnv.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000";
export default API_BASE_URL;
