import axios from "axios";

const FASTAPI_BASE_URL = "http://127.0.0.1:8000/api/v1";
const NODE_BASE_URL = "http://127.0.0.1:3000";

// Worker Login
export const loginWorker = async (credentials) => {
  const response = await axios.post(
    `http://127.0.0.1:8000/auth/worker/login`,
    credentials
  );
  return response.data;
};

// Facility Login
export const loginFacility = async (credentials) => {
  const response = await axios.post(
    `http://127.0.0.1:8000/auth/facility/login`,
    credentials
  );
  return response.data;
};

// Jobs
export const getJobs = async (token) => {
  const res = await axios.get(`http://127.0.0.1:8000/jobs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const updateJobStatus = async (jobId, status, token) => {
  const res = await axios.patch(
    `http://127.0.0.1:8000/jobs/${jobId}/status`,
    { status },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

// Applications
export const updateApplicationStatus = async (applicationId, status, token) => {
  const res = await axios.patch(
    `http://127.0.0.1:8000/applications/${applicationId}/status`,
    { status },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

// Facilities
export const getFacilities = async (token) => {
  const res = await axios.get(`http://127.0.0.1:8000/facilities`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Workers
export const getWorkers = async (token) => {
  const res = await axios.get(`http://127.0.0.1:8000/workers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Client-side Search Functions
export const searchJobs = async (query: string, token?: string) => {
  const response = await axios.get(`http://127.0.0.1:8000/jobs`, {
    params: { search: query },
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return response.data;
};

export const searchFacilities = async (query: string, token?: string) => {
  const response = await axios.get(`http://127.0.0.1:8000/facilities`, {
    params: { search: query },
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return response.data;
};

export const searchWorkers = async (query: string, token?: string) => {
  const response = await axios.get(`http://127.0.0.1:8000/workers`, {
    params: { search: query },
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return response.data;
};
