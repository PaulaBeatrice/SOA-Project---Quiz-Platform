import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Create axios instance with API base URL
const api = axios.create({
  baseURL: 'http://localhost:8080',
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function CreateQuiz({ onQuizCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState(30);
  const [quizId, setQuizId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    options: ['', '', '', ''],
    correctOptionIndex: 0
  });

  // Fetch questions when quizId changes
  const fetchQuestions = useCallback(async () => {
    if (quizId) {
      try {
        const response = await api.get(`/api/quiz-service/quizzes/${quizId}`);
        setQuestions(response.data.questions || []);
      } catch (err) {
        console.error('Error fetching questions:', err);
      }
    }
  }, [quizId]);

  useEffect(() => {
    if (quizId) {
      fetchQuestions();
    }
  }, [quizId, fetchQuestions]);

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await api.post('/api/quiz-service/quizzes', {
        title,
        description,
        timeLimit,
        active: true
      });
      setQuizId(response.data.id);
      setError('');
    } catch (err) {
      console.error('Error creating quiz:', err);
      setError('Failed to create quiz: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      if (!newQuestion.text) {
        setError('Please enter question text');
        return;
      }

      if (newQuestion.options.some(opt => !opt.trim())) {
        setError('Please fill in all answer options');
        return;
      }

      const correctOptionIndex = parseInt(newQuestion.correctOptionIndex);
      const correctAnswerText = newQuestion.options[correctOptionIndex];

      const questionData = {
        text: newQuestion.text,
        options: newQuestion.options,
        correctOptionIndex: correctOptionIndex,
        correctAnswers: [correctAnswerText]
      };

      await api.post(`/api/quiz-service/quizzes/${quizId}/questions`, questionData);

      setNewQuestion({
        text: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0
      });
      setShowAddQuestion(false);
      setError('');
      if (quizId) {
        fetchQuestions();
      }
    } catch (err) {
      console.error('Error adding question:', err);
      setError('Failed to add question: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await api.delete(`/api/quiz-service/quizzes/questions/${questionId}`);
        fetchQuestions();
      } catch (err) {
        console.error('Error deleting question:', err);
        setError('Failed to delete question.');
      }
    }
  };

  const handleQuestionChange = (field, value) => {
    setNewQuestion(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOptionChange = (index, value) => {
    const options = [...newQuestion.options];
    options[index] = value;
    setNewQuestion(prev => ({
      ...prev,
      options
    }));
  };

  const handleFinish = () => {
    // Reset form and call parent callback if provided
    setTitle('');
    setDescription('');
    setTimeLimit(30);
    setQuizId(null);
    setQuestions([]);
    setError('');
    setShowAddQuestion(false);
    setNewQuestion({
      text: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0
    });
    
    if (onQuizCreated) {
      onQuizCreated();
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      {!quizId ? (
        // Quiz Creation Form
        <form onSubmit={handleCreateQuiz} style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
          <h2>Create New Quiz</h2>

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

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Quiz Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter quiz title"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid #ddd',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                fontSize: '14px'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter quiz description"
              rows="3"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid #ddd',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Time Limit (minutes) *</label>
            <input
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(parseInt(e.target.value))}
              min="1"
              max="300"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid #ddd',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                fontSize: '14px'
              }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Creating...' : 'Create Quiz'}
          </button>
        </form>
      ) : (
        // Questions Management
        <div>
          <div style={{
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '5px',
            marginBottom: '20px'
          }}>
            <h1>{title}</h1>
            <p style={{ color: '#666', marginBottom: '10px' }}>{description}</p>
            <div style={{ fontSize: '0.9em', color: '#999' }}>
              <p>Duration: {timeLimit} minutes</p>
              <p>Total Questions: {questions.length}</p>
            </div>
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

          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => setShowAddQuestion(!showAddQuestion)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              {showAddQuestion ? 'Cancel' : '+ Add Question'}
            </button>
            <button
              onClick={handleFinish}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Finish
            </button>
          </div>

          {showAddQuestion && (
            <form onSubmit={handleAddQuestion} style={{
              padding: '15px',
              marginBottom: '15px',
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderRadius: '5px'
            }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', fontSize: '14px' }}>Question</label>
                <textarea
                  value={newQuestion.text}
                  onChange={(e) => handleQuestionChange('text', e.target.value)}
                  placeholder="Enter your question..."
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '10px',
                    marginBottom: '15px',
                    borderRadius: '5px',
                    border: '1px solid #ddd',
                    fontFamily: 'inherit',
                    fontSize: '15px',
                    boxSizing: 'border-box'
                  }}
                  required
                />
                
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', fontSize: '14px' }}>Answers</label>
                <div style={{ marginLeft: '0px' }}>
                  {newQuestion.options.map((option, oIndex) => (
                    <div key={oIndex} style={{
                      padding: '10px',
                      marginBottom: '8px',
                      backgroundColor: oIndex === newQuestion.correctOptionIndex ? '#d4edda' : '#f9f9f9',
                      borderRadius: '5px',
                      border: oIndex === newQuestion.correctOptionIndex ? '2px solid #28a745' : '1px solid #ddd',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start'
                    }}>
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={oIndex === newQuestion.correctOptionIndex}
                        onChange={() => handleQuestionChange('correctOptionIndex', oIndex)}
                        style={{ cursor: 'pointer', flexShrink: 0, marginTop: '5px' }}
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(oIndex, e.target.value)}
                        placeholder={`Answer ${oIndex + 1}`}
                        style={{
                          flex: 1,
                          padding: '8px 10px',
                          border: '1px solid #ccc',
                          backgroundColor: '#ffffff',
                          borderRadius: '3px',
                          fontFamily: 'inherit',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
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
                  Add Question
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddQuestion(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div>
            <h2>Questions ({questions.length})</h2>

            {questions.length === 0 ? (
              <p style={{ color: '#666' }}>No questions added yet. Add one to get started!</p>
            ) : (
              <div>
                {questions.map((question, qIndex) => (
                  <div
                    key={question.id}
                    style={{
                      padding: '15px',
                      marginBottom: '15px',
                      backgroundColor: '#fff',
                      border: '1px solid #ddd',
                      borderRadius: '5px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 10px 0' }}>
                          Question {qIndex + 1}: {question.text}
                        </h4>
                        <div style={{ marginLeft: '20px' }}>
                          {question.options && question.options.map((option, oIndex) => (
                            <div key={oIndex} style={{
                              padding: '8px',
                              marginBottom: '5px',
                              backgroundColor: oIndex === question.correctOptionIndex ? '#d4edda' : '#f9f9f9',
                              borderRadius: '3px',
                              border: oIndex === question.correctOptionIndex ? '1px solid #28a745' : '1px solid #eee'
                            }}>
                              <input
                                type="radio"
                                name={`q-${question.id}`}
                                checked={oIndex === question.correctOptionIndex}
                                disabled
                                style={{ marginRight: '8px' }}
                              />
                              {option}
                              {oIndex === question.correctOptionIndex && (
                                <span style={{ marginLeft: '10px', color: '#28a745', fontWeight: 'bold' }}>
                                  ✓ Correct
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          marginLeft: '15px',
                          whiteSpace: 'nowrap'
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
      )}
    </div>
  );
}

export default CreateQuiz;
