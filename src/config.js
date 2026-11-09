const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export const AUTH_URL = `${API_BASE_URL}/auth`;
export const TASKS_URL = `${API_BASE_URL}/tasks`;