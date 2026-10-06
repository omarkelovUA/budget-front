// Same-origin paths: in dev, `ng serve` proxies them to the Spring Boot backend
// (src/proxy.conf.json), so there's no CORS setup and the refresh cookie just works.
export const API_BASE = '/api/v1';
export const AUTH_BASE = `${API_BASE}/auth`;
export const GOOGLE_LOGIN_URL = '/oauth2/authorization/google';
