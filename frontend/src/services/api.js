import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (username, password) =>
    api.post('/users/auth/login', { username, password }),

  register: (username, email, password, role) =>
    api.post('/users/auth/register', { username, email, password, role }),
};

export const quizAPI = {
  getAll: () => api.get('/quiz-service/quizzes'),
  getActive: () => api.get('/quiz-service/quizzes/active'),
  getById: (id) => api.get(`/quiz-service/quizzes/${id}`),
  create: (quiz) => api.post('/quiz-service/quizzes', quiz),
  update: (id, quiz) => api.put(`/quiz-service/quizzes/${id}`, quiz),
  delete: (id) => api.delete(`/quiz-service/quizzes/${id}`),
};

export const submissionAPI = {
  start: (quizId, userId) =>
    api.post(`/submissions/start?quizId=${quizId}&userId=${userId}`),

  submit: (submissionId, answers) =>
    api.post(`/submissions/${submissionId}/submit`, answers),

  getById: (id) => api.get(`/submissions/${id}`),

  getByUser: (userId) => api.get(`/submissions/user/${userId}`),

  getByQuiz: (quizId) => api.get(`/submissions/quiz/${quizId}`),
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getQuizStats: () => api.get('/analytics/quiz-stats'),
  getUserStats: () => api.get('/analytics/user-stats'),
};

export default api;

