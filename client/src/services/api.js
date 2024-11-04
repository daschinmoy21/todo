/**
 * API service for handling all HTTP requests to the backend
 */

import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Add authentication token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication endpoints
export const login = (email, password) =>
  api.post('/login', { email, password });

export const register = (email, password, username) =>
  api.post('/register', { email, password, username });

// Board management endpoints
export const getBoards = () =>
  api.get('/boards');

export const createBoard = (title) =>
  api.post('/boards', { title });

export const getBoard = (boardId) =>
  api.get(`/boards/${boardId}`);

// List management endpoints
export const createList = (boardId, title) =>
  api.post(`/boards/${boardId}/lists`, { title });

export const getLists = (boardId) =>
  api.get(`/boards/${boardId}/lists`);

// ... rest of the endpoints ...

export default api; 