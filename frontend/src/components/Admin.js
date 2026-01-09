import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import NotificationService from '../services/NotificationService';

function Admin({ user }) {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 30,
    questions: []
  });

  const fetchQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/quiz-service/quizzes');
      setQuizzes(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setError('Failed to load quizzes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle real-time quiz updates via WebSocket
  const handleQuizNotification = useCallback((notification) => {
    console.log(' Quiz notification received:', notification);
    const type = notification.eventType || notification.type;
    if (type === 'QUIZ_CREATED' || type === 'QUIZ_UPDATED' || type === 'QUIZ_DELETED') {
      console.log(' Quiz change detected, refreshing admin quiz list...');
      // Small delay to ensure backend is updated
      setTimeout(() => fetchQuizzes(), 500);
    }
  }, [fetchQuizzes]);

  // Initial load and WebSocket setup
  useEffect(() => {
    fetchQuizzes();
    
    // Connect to WebSocket for real-time updates
    if (user && user.username) {
      console.log(' Admin connecting to WebSocket:', user.username);
      NotificationService.connect(user.username, handleQuizNotification);
    }
  }, [user?.username, fetchQuizzes, handleQuizNotification]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    try {
      if (!formData.title || !formData.description) {
        setError('Please fill in all required fields');
        return;
      }

      // Get user ID from a new endpoint or use username for now
      // For now, we'll use a simple numeric ID based on username hash
      const userId = Math.abs(user.username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) || 1;

      const newQuiz = {
        title: formData.title,
        description: formData.description,
        timeLimit: parseInt(formData.duration),
        createdBy: userId,
        active: true
      };

      await api.post('/quiz-service/quizzes', newQuiz);
      
      setFormData({
        title: '',
        description: '',
        duration: 30,
        questions: []
      });
      setShowForm(false);
      setError('');
      setSuccessMessage('Quiz created successfully! ✓');
      
      // Auto-dismiss success message
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Refresh quiz list immediately
      setTimeout(() => fetchQuizzes(), 300);
    } catch (err) {
      console.error('Error creating quiz:', err);
      setError('Failed to create quiz: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      try {
        await api.delete(`/quiz-service/quizzes/${quizId}`);
        fetchQuizzes();
      } catch (err) {
        console.error('Error deleting quiz:', err);
        setError('Failed to delete quiz. Please try again.');
      }
    }
  };

  if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You don't have permission to access the admin panel.</p>
      </div>
    );
  }

  return (
    <div className="admin-container" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Admin Panel</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {showForm ? 'Cancel' : '+ Create Quiz'}
        </button>
      </div>

      {error && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '5px'
        }}>
          {error}
        </div>
      )}

      {successMessage && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          backgroundColor: '#d4edda',
          color: '#155724',
          borderRadius: '5px',
          fontWeight: 'bold'
        }}>
          {successMessage}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreateQuiz} style={{
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <h2>Create New Quiz</h2>
          
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="title">Quiz Title *</label>
            <input
              id="title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter quiz title"
              style={{
                display: 'block',
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                borderRadius: '5px',
                border: '1px solid #ddd'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter quiz description"
              rows="4"
              style={{
                display: 'block',
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                borderRadius: '5px',
                border: '1px solid #ddd',
                fontFamily: 'inherit'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="duration">Duration (minutes)</label>
            <input
              id="duration"
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              min="1"
              style={{
                display: 'block',
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                borderRadius: '5px',
                border: '1px solid #ddd'
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Create Quiz
          </button>
        </form>
      )}

      <div>
        {loading && <p>Loading quizzes...</p>}
        
        {!loading && quizzes.length === 0 && (
          <p style={{ color: '#666' }}>No quizzes created yet. Create one to get started!</p>
        )}

        {!loading && quizzes.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {quizzes.map(quiz => (
              <div
                key={quiz.id}
                style={{
                  padding: '20px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  backgroundColor: '#f0f8ff'
                }}
              >
                <h3>{quiz.title}</h3>
                <p style={{ color: '#333', marginBottom: '10px' }}>
                  {quiz.description}
                </p>
                <p style={{ fontSize: '1em', color: '#1976d2', fontWeight: '600', marginBottom: '15px' }}>
                  {quiz.timeLimit} minutes
                </p>
                <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => navigate(`/quiz/${quiz.id}`)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    View & Edit
                  </button>
                  <button
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;
