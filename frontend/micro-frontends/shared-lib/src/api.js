// Shared API utilities
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const submissionAPI = {
  getByUser: (userId) => api.get(`/submission-service/submissions/user/${userId}`),
  create: (data) => api.post('/submission-service/submissions', data),
  submit: (id, answers) => api.post(`/submission-service/submissions/${id}/submit`, answers),
};

export const quizAPI = {
  getActive: () => api.get('/quiz-service/quizzes/active'),
  getById: (id) => api.get(`/quiz-service/quizzes/${id}`),
  create: (data) => api.post('/quiz-service/quizzes', data),
};

export default api;
