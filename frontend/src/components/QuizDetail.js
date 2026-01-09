import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { quizAPI } from '../services/api';

function QuizDetail({ user }) {
  const { id: quizId } = useParams();  // Route param is 'id', not 'quizId'
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    options: ['', '', '', ''],
    correctOptionIndex: 0
  });

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const response = await quizAPI.getById(quizId);
      setQuiz(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching quiz:', err);
      setError('Failed to load quiz. Please try again.');
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

      // Create correctAnswers array with the selected correct option text
      const correctOptionIndex = parseInt(newQuestion.correctOptionIndex);
      const correctAnswerText = newQuestion.options[correctOptionIndex];

      const questionData = {
        text: newQuestion.text,
        options: newQuestion.options,
        correctOptionIndex: correctOptionIndex,
        correctAnswers: [correctAnswerText]  // Add the correct answer as an array
      };

      await api.post(`/quiz-service/quizzes/${quizId}/questions`, questionData);

      setNewQuestion({
        text: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0
      });
      setShowAddQuestion(false);
      setError('');
      fetchQuiz();
    } catch (err) {
      console.error('Error adding question:', err);
      setError('Failed to add question: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await api.delete(`/quiz-service/questions/${questionId}`);
        fetchQuiz();
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

  if (loading) return <div style={{ padding: '20px' }}>Loading quiz...</div>;

  if (!quiz) return <div style={{ padding: '20px' }}>Quiz not found</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <button
        onClick={() => navigate('/admin')}
        style={{
          marginBottom: '20px',
          padding: '8px 16px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        ← Back to Admin Panel
      </button>

      <div style={{
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '5px',
        marginBottom: '20px'
      }}>
        <h1>{quiz.title}</h1>
        <p style={{ color: '#666', marginBottom: '10px' }}>{quiz.description}</p>
        <div style={{ fontSize: '0.9em', color: '#999' }}>
          <p>Duration: {quiz.timeLimit || 'Not set'} minutes</p>
          <p>Status: {quiz.active ? 'Active' : 'Inactive'}</p>
          <p>Total Questions: {quiz.questions ? quiz.questions.length : 0}</p>
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
            cursor: 'pointer'
          }}
        >
          {showAddQuestion ? 'Cancel' : '+ Add Question'}
        </button>
      </div>

      {showAddQuestion && (
        <form onSubmit={handleAddQuestion} style={{
          padding: '20px',
          backgroundColor: '#f0f7ff',
          borderRadius: '5px',
          marginBottom: '20px',
          border: '1px solid #cce5ff'
        }}>
          <h3>Add New Question</h3>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="questionText">Question Text *</label>
            <textarea
              id="questionText"
              value={newQuestion.text}
              onChange={(e) => handleQuestionChange('text', e.target.value)}
              placeholder="Enter your question here"
              rows="3"
              style={{
                display: 'block',
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                borderRadius: '5px',
                border: '1px solid #ddd',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Answer Options *</label>
            {newQuestion.options.map((option, index) => (
              <div key={index} style={{ marginBottom: '10px', marginTop: '10px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="radio"
                    id={`correct-${index}`}
                    name="correctAnswer"
                    checked={newQuestion.correctOptionIndex === index}
                    onChange={() => handleQuestionChange('correctOptionIndex', index)}
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor={`correct-${index}`} style={{ cursor: 'pointer', marginBottom: 0 }}>
                    Correct
                  </label>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '5px',
                      border: '1px solid #ddd'
                    }}
                    required
                  />
                </div>
              </div>
            ))}
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
            Add Question
          </button>
        </form>
      )}

      <div>
        <h2>Questions ({quiz.questions ? quiz.questions.length : 0})</h2>

        {!quiz.questions || quiz.questions.length === 0 ? (
          <p style={{ color: '#666' }}>No questions added yet. Add one to get started!</p>
        ) : (
          <div>
            {quiz.questions.map((question, qIndex) => (
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
  );
}

export default QuizDetail;
