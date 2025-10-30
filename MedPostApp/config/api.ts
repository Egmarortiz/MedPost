// API Configuration


const IS_PRODUCTION = false;

export const API_BASE_URL =  "https://blithefully-nonamendable-krystin.ngrok-free.dev";

console.log("API Base URL:", API_BASE_URL);

// API Endpoints
export const API_ENDPOINTS = {
  
  // Auth
  WORKER_REGISTER: `${API_BASE_URL}/v1/auth/worker/register`,
  WORKER_LOGIN: `${API_BASE_URL}/v1/auth/worker/login`,
  FACILITY_REGISTER: `${API_BASE_URL}/v1/auth/facility/register`,
  FACILITY_LOGIN: `${API_BASE_URL}/v1/auth/facility/login`,
  REFRESH_TOKEN: `${API_BASE_URL}/v1/auth/refresh`,
  UPLOAD_IMAGE: `${API_BASE_URL}/v1/upload/image`,
  UPLOAD_DOCUMENT: `${API_BASE_URL}/v1/upload/document`,
  
  // Workers
  WORKER_VERIFY: `${API_BASE_URL}/v1/workers/verify`,
  WORKER_PROFILE: `${API_BASE_URL}/v1/workers/me`,
  WORKER_UPDATE: `${API_BASE_URL}/v1/workers/me`,
  WORKER_EXPERIENCES: `${API_BASE_URL}/v1/workers/me/experiences`,
  WORKER_CREDENTIALS: `${API_BASE_URL}/v1/workers/me/credentials`,
  WORKERS_LIST: `${API_BASE_URL}/v1/workers`,
  
  // Facilities
  FACILITY_VERIFY: `${API_BASE_URL}/v1/facilities/verify`,
  FACILITY_PROFILE: `${API_BASE_URL}/v1/facilities/me`,
  FACILITY_UPDATE: `${API_BASE_URL}/v1/facilities/me`,
  FACILITIES_LIST: `${API_BASE_URL}/v1/facilities`,
  
  // Jobs
  JOBS_LIST: `${API_BASE_URL}/v1/jobs`,
  JOB_CREATE: `${API_BASE_URL}/v1/jobs`,
  JOB_GET: `${API_BASE_URL}/v1/jobs`,
  JOB_UPDATE: `${API_BASE_URL}/v1/jobs`,
  JOB_APPLY: `${API_BASE_URL}/v1/jobs`,
  JOB_APPLICATIONS_FACILITY: `${API_BASE_URL}/v1/jobs/applications/facility`,
  JOB_APPLICATIONS_WORKER: `${API_BASE_URL}/v1/jobs/applications/worker`,
  
  // Endorsements
  ENDORSEMENTS_FOR_WORKER: `${API_BASE_URL}/v1/endorsements/workers`,
  ENDORSEMENTS_CREATE: `${API_BASE_URL}/v1/endorsements`,
  
  // Auth
  AUTH_LOGOUT: `${API_BASE_URL}/v1/auth/logout`,
  
  // Admin
  ADMIN_PENDING_VERIFICATIONS: `${API_BASE_URL}/v1/admin/verifications/pending`,
  ADMIN_APPROVE_VERIFICATION: `${API_BASE_URL}/v1/admin/verifications/approve`,
  
  // Health check
  HEALTH: `${API_BASE_URL}/`,
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
};
