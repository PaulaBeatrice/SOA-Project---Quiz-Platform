import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { api } from '@quiz-platform/shared-lib';
import CreateQuiz from './components/CreateQuiz';

/**
 * QuizManager Component
 * Manages quiz listing, creation, and taking
 */
export default function QuizManager({ user }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('browse');

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/quizzes');
      setQuizzes(response.data);
    } catch (error) {
      console.error('Error loading quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="quiz-manager">
      <div className="quiz-header">
        <h2> Quiz Management</h2>
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'browse' ? 'active' : ''}`}
            onClick={() => setActiveTab('browse')}
          >
            Browse Quizzes
          </button>
          {user?.role === 'TEACHER' && (
            <button
              className={`tab ${activeTab === 'create' ? 'active' : ''}`}
              onClick={() => setActiveTab('create')}
            >
              Create Quiz
            </button>
          )}
        </div>
      </div>

      <div className="quiz-content">
        {activeTab === 'browse' && (
          <div className="browse-section">
            {loading ? (
              <p>Loading quizzes...</p>
            ) : (
              <div className="quizzes-grid">
                {quizzes.map((quiz) => (
                  <div key={quiz.id} className="quiz-card">
                    <h3>{quiz.title}</h3>
                    <p>{quiz.description}</p>
                    <div className="quiz-meta">
                      <span> {quiz.timeLimit} min</span>
                      <span> {quiz.questionCount} questions</span>
                      <span> {quiz.submissionCount} taken</span>
                    </div>
                    <button className="take-btn">Take Quiz</button>
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
  );
}
