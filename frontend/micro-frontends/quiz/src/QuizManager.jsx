import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import axios from 'axios';
import CreateQuiz from './components/CreateQuiz';
import TakeQuiz from './components/TakeQuiz';
import QuizDetail from './components/QuizDetail';

// Create axios instance with API base URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost/api',
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * QuizManager Component
 * Manages quiz listing, creation, and taking
 */
export default function QuizManager({ user }) {
  const [quizzes, setQuizzes] = useState([]);
  const [myQuizzes, setMyQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedQuizId, setSelectedQuizId] = useState(null);

  useEffect(() => {
    console.log(' [QuizManager] useEffect mounted, loading quizzes');
    
    // Check if there are queued events from before this component mounted
    if (window.quizEventQueue && window.quizEventQueue.length > 0) {
      console.log(' [QuizManager] Found', window.quizEventQueue.length, 'queued quiz events');
      // Clear queue and reload
      window.quizEventQueue = [];
      loadQuizzes();
    } else {
      loadQuizzes();
    }

    // Listen for custom quiz events dispatched by main app
    // This works within the same tab/window where quiz-mfe is loaded as a module federation component
    const handleQuizEvent = (event) => {
      console.log(' [QuizManager] Quiz event received from main app:', event.detail);
      console.log(' [QuizManager] Event type:', event.detail?.type);
      // Immediately refresh quiz list when event is received
      console.log(' [QuizManager] Calling loadQuizzes()');
      loadQuizzes();
    };

    window.addEventListener('quiz-event', handleQuizEvent);
    console.log(' [QuizManager] Listener attached for quiz-event');

    // Also use polling as fallback (2 seconds for responsiveness)
    const pollInterval = setInterval(() => {
      console.log('[QuizManager] Polling loadQuizzes (2 second interval)');
      loadQuizzes();
    }, 2000);

    // Cleanup
    return () => {
      window.removeEventListener('quiz-event', handleQuizEvent);
      clearInterval(pollInterval);
    };
  }, []);

  const loadQuizzes = async () => {
    try {
      console.log(' [QuizManager] loadQuizzes called');
      setLoading(true);
      // Fetch quizzes through API Gateway
      // Routes: /quiz-service/quizzes -> API Gateway -> quiz-service:8082
      const response = await api.get('/quiz-service/quizzes');
      console.log(' [QuizManager] Quizzes loaded, count:', response.data?.length || 0);
      setQuizzes(response.data);
      // For now, teachers can see all quizzes as "their" quizzes
      // In a real app, you'd filter by teacher ID
      if (user?.role === 'TEACHER') {
        console.log(' [QuizManager] User is TEACHER, setting myQuizzes');
        setMyQuizzes(response.data);
      }
    } catch (error) {
      console.error('[QuizManager] Error loading quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      try {
        await api.delete(`/quiz-service/quizzes/${quizId}`);
        loadQuizzes();
      } catch (error) {
        console.error('Error deleting quiz:', error);
        alert('Failed to delete quiz: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  // If a quiz is selected, show the TakeQuiz component
  if (selectedQuizId) {
    return (
      <div className="quiz-manager">
        <button 
          onClick={() => setSelectedQuizId(null)}
          style={{
            padding: '10px 20px',
            marginBottom: '20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          ← Back to Quizzes
        </button>
        <TakeQuiz quizId={selectedQuizId} user={user} />
      </div>
    );
  }

  return (
    <Routes>
      <Route path=":id" element={<QuizDetail user={user} />} />
      <Route path="*" element={
        <div className="quiz-manager">
      <div className="quiz-header">
        <h2>Quiz Management</h2>
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'browse' ? 'active' : ''}`}
            onClick={() => setActiveTab('browse')}
          >
            Browse Quizzes
          </button>
          {user?.role === 'TEACHER' && (
            <>
              <button
                className={`tab ${activeTab === 'my-quizzes' ? 'active' : ''}`}
                onClick={() => setActiveTab('my-quizzes')}
              >
                My Quizzes
              </button>
              <button
                className={`tab ${activeTab === 'create' ? 'active' : ''}`}
                onClick={() => setActiveTab('create')}
              >
                Create Quiz
              </button>
            </>
          )}
        </div>
      </div>

      <div className="quiz-content">
        {activeTab === 'browse' && (
          <div className="browse-section">
            {loading ? (
              <p>Loading quizzes...</p>
            ) : quizzes.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666' }}>No quizzes available</p>
            ) : (
              <div className="quizzes-grid">
                {quizzes.map((quiz) => (
                  <div key={quiz.id} className="quiz-card">
                    <h3>{quiz.title}</h3>
                    <p>{quiz.description}</p>
                    <div className="quiz-meta">
                      <span>⏱ {quiz.timeLimit || 'Unlimited'} min</span>
                      <span>❓ {quiz.questions?.length || 0} questions</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        className="take-btn"
                        onClick={() => setSelectedQuizId(quiz.id)}
                        style={{ flex: 1 }}
                      >
                        Take Quiz
                      </button>
                      {user?.role === 'TEACHER' && (
                        <button 
                          className="take-btn"
                          onClick={() => window.location.href = `/quizzes/${quiz.id}`}
                          style={{ flex: 1, backgroundColor: '#17a2b8' }}
                        >
                          Manage
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'my-quizzes' && user?.role === 'TEACHER' && (
          <div className="browse-section">
            {loading ? (
              <p>Loading quizzes...</p>
            ) : myQuizzes.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666' }}>No quizzes created yet</p>
            ) : (
              <div className="quizzes-grid">
                {myQuizzes.map((quiz) => (
                  <div key={quiz.id} className="quiz-card">
                    <h3>{quiz.title}</h3>
                    <p>{quiz.description}</p>
                    <div className="quiz-meta">
                      <span>⏱ {quiz.timeLimit || 'Unlimited'} min</span>
                      <span>❓ {quiz.questions?.length || 0} questions</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        className="take-btn"
                        onClick={() => window.location.href = `/quizzes/${quiz.id}`}
                        style={{ flex: 1, backgroundColor: '#17a2b8' }}
                      >
                        Manage
                      </button>
                      <button 
                        className="take-btn"
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        style={{ flex: 1, backgroundColor: '#dc3545' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'create' && user?.role === 'TEACHER' && (
          <CreateQuiz onQuizCreated={loadQuizzes} />
        )}
      </div>

      <style>{`
        .quiz-manager {
          padding: 20px;
        }

        .quiz-header {
          margin-bottom: 30px;
        }

        .tabs {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }

        .tab {
          padding: 10px 20px;
          border: 2px solid #e0e0e0;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s;
        }

        .tab.active {
          border-color: #667eea;
          background: #667eea;
          color: white;
        }

        .tab:hover {
          border-color: #667eea;
        }

        .quizzes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .quiz-card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: transform 0.3s, box-shadow 0.3s;
        }

        .quiz-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .quiz-card h3 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .quiz-card p {
          color: #666;
          font-size: 14px;
          margin: 0 0 15px 0;
        }

        .quiz-meta {
          display: flex;
          gap: 10px;
          font-size: 13px;
          color: #888;
          margin-bottom: 15px;
          flex-wrap: wrap;
        }

        .take-btn {
          width: 100%;
          padding: 10px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.3s;
        }

        .take-btn:hover {
          opacity: 0.9;
        }
      `}</style>
        </div>
      } />
    </Routes>
  );
}
