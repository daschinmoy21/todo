import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = (email, password) =>
  api.post('/login', { email, password });

export const register = (email, password, username) =>
  api.post('/register', { email, password, username });

export const getBoards = () =>
  api.get('/boards');

export const createBoard = (title) =>
  api.post('/boards', { title });

export const getBoard = (boardId) =>
  api.get(`/boards/${boardId}`);

export const createList = (boardId, title) =>
  api.post(`/boards/${boardId}/lists`, { title });

export const createTask = (listId, title, description) =>
  api.post(`/lists/${listId}/tasks`, { title, description });

export const getLists = (boardId) =>
  api.get(`/boards/${boardId}/lists`);

export const moveTask = (taskId, destinationListId, newPosition) =>
  api.patch(`/tasks/${taskId}/move`, { destinationListId, newPosition });

export const getUserProfile = () =>
  api.get('/users/profile');

export const updateUserProfile = (profileData) =>
  api.patch('/users/profile', profileData);

export const getTaskComments = (taskId) =>
  api.get(`/tasks/${taskId}/comments`);

export const createTaskComment = (taskId, comment_text) =>
  api.post(`/tasks/${taskId}/comments`, { comment_text });

export const getBoardMessages = (boardId) =>
  api.get(`/boards/${boardId}/messages`);

export const searchUsers = (query) =>
  api.get(`/users/search?q=${query}`);

export const getBoardMembers = (boardId) =>
  api.get(`/boards/${boardId}/members`);

export const addBoardMember = (boardId, userId, role) =>
  api.post(`/boards/${boardId}/members`, { userId, role });

export const removeBoardMember = (boardId, memberId) =>
  api.delete(`/boards/${boardId}/members/${memberId}`);

export const updateBoardMemberRole = (boardId, memberId, role) =>
  api.patch(`/boards/${boardId}/members/${memberId}`, { role });

export const moveList = (listId, newPosition, boardId) =>
  api.patch(`/lists/${listId}/move`, { position: newPosition, boardId });

export const createLabel = (boardId, name, color) =>
  api.post(`/boards/${boardId}/labels`, { name, color });

export const getLabels = (boardId) =>
  api.get(`/boards/${boardId}/labels`);

export const addLabelToTask = (taskId, labelId) =>
  api.post(`/tasks/${taskId}/labels`, { labelId });

export const removeLabelFromTask = (taskId, labelId) =>
  api.delete(`/tasks/${taskId}/labels/${labelId}`);

export const deleteBoard = (boardId) =>
  api.delete(`/boards/${boardId}`);

export default api; 