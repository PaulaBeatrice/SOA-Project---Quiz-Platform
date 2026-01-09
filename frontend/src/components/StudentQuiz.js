import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { submissionAPI, quizAPI } from '../services/api';

function StudentQuiz({ user }) {
  const { id: quizId } = useParams();  // Route param is 'id', not 'quizId'
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submissionScore, setSubmissionScore] = useState(0);
  const [submissionId, setSubmissionId] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const response = await quizAPI.getById(quizId);
      setQuiz(response.data);
      setError('');
      
      // Initialize answers object
      const initialAnswers = {};
      if (response.data.questions) {
        response.data.questions.forEach(q => {
          initialAnswers[q.id] = null;
        });
      }
      setAnswers(initialAnswers);
    } catch (err) {
      console.error('Error fetching quiz:', err);
      setError('Failed to load quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmitQuiz = async (e) => {
    e.preventDefault();
    try {
      // Validate that user ID is available
      if (!user || !user.id) {
        setError('User ID is not available. Please log in again.');
        console.error('User or user.id is missing:', user);
        return;
      }

      // Check if all questions are answered
      const unanswered = quiz.questions.filter(q => answers[q.id] === null);
      if (unanswered.length > 0) {
        setError(`Please answer all ${unanswered.length} question(s) before submitting.`);
        return;
      }

      console.log('Submitting quiz with userId:', user.id, 'quizId:', quiz.id);

      // First, start a submission to get a submission ID
      const startResponse = await submissionAPI.start(quiz.id, user.id);
      const submissionId = startResponse.data.id;
      setSubmissionId(submissionId);

      // Calculate score
      let correctCount = 0;
      quiz.questions.forEach(question => {
        if (answers[question.id] === question.correctOptionIndex) {
          correctCount++;
        }
      });

      const score = Math.round((correctCount / quiz.questions.length) * 100);

      // Convert answers to the format expected by the backend (questionId -> answer string/text)
      const answersPayload = {};
      console.log(' Converting answers to text format...');
      console.log(' Raw answers:', answers);
      Object.keys(answers).forEach(questionId => {
        const answerIndex = answers[questionId];
        // Find the question to get the actual answer text from options
        const question = quiz.questions.find(q => q.id === parseInt(questionId));
        if (question && answerIndex !== null) {
          // Store the actual answer text, not the index
          const answerText = question.options[answerIndex];
          answersPayload[questionId] = answerText;
          console.log(`  Q${questionId}: index=${answerIndex} → text="${answerText}" (options: ${JSON.stringify(question.options)})`);
        }
      });
      console.log(' Final answers payload:', answersPayload);

      // Now submit the quiz with the submission ID
      const submitResponse = await submissionAPI.submit(submissionId, answersPayload);
      
      console.log('Quiz submitted successfully:', submitResponse.data);
      setSubmissionScore(score);
      setSubmitted(true);
      setError('');
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError('Failed to submit quiz. Please try again.');
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading quiz...</div>;

  if (!quiz) return <div style={{ padding: '20px' }}>Quiz not found</div>;

  if (submitted) {
    const handleBackToDashboard = () => {
      // Force a hard refresh of the Dashboard component
      // by navigating with a state flag
      navigate('/dashboard', { state: { refreshSubmissions: true } });
    };

    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{
          padding: '40px',
          backgroundColor: '#d4edda',
          borderRadius: '5px',
          maxWidth: '500px',
          margin: '50px auto'
        }}>
          <h2 style={{ color: '#155724', marginBottom: '20px' }}>Quiz Submitted!</h2>
          <div style={{
            fontSize: '2em',
            fontWeight: 'bold',
            color: '#155724',
            marginBottom: '20px'
          }}>
            Your Score: {submissionScore}%
          </div>
          <p style={{ color: '#155724', fontSize: '1.1em', marginBottom: '20px' }}>
            Thank you for taking the quiz.
          </p>
          <button
            onClick={handleBackToDashboard}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions ? quiz.questions[currentQuestionIndex] : null;
  const totalQuestions = quiz.questions ? quiz.questions.length : 0;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <button
        onClick={() => navigate('/dashboard')}
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
        ← Back
      </button>

      <div style={{
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '5px',
        marginBottom: '20px'
      }}>
        <h1>{quiz.title}</h1>
        <p style={{ color: '#666' }}>{quiz.description}</p>
        <div style={{ fontSize: '0.9em', color: '#999' }}>
          <p>Duration: {quiz.timeLimit || 'Unlimited'} minutes</p>
          <p>Total Questions: {totalQuestions}</p>
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

      {currentQuestion && (
        <form onSubmit={handleSubmitQuiz} style={{
          padding: '20px',
          backgroundColor: '#fff',
          border: '1px solid #ddd',
          borderRadius: '5px'
        }}>
          <div style={{ marginBottom: '30px' }}>
            <div style={{
              marginBottom: '20px',
              padding: '10px',
              backgroundColor: '#e7f3ff',
              borderRadius: '5px'
            }}>
              <strong>Question {currentQuestionIndex + 1} of {totalQuestions}</strong>
            </div>

            <h3 style={{ marginBottom: '20px' }}>{currentQuestion.text}</h3>

            <div style={{ marginBottom: '20px' }}>
              {currentQuestion.options && currentQuestion.options.map((option, index) => (
                <label key={index} style={{
                  display: 'block',
                  padding: '12px',
                  marginBottom: '10px',
                  backgroundColor: answers[currentQuestion.id] === index ? '#d1ecf1' : '#f9f9f9',
                  border: answers[currentQuestion.id] === index ? '2px solid #0c5460' : '1px solid #ddd',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={index}
                    checked={answers[currentQuestion.id] === index}
                    onChange={() => handleAnswerSelect(currentQuestion.id, index)}
                    style={{ marginRight: '10px', cursor: 'pointer' }}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '30px',
            paddingTop: '20px',
            borderTop: '1px solid #ddd'
          }}>
            <div>
              {currentQuestionIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  ← Previous
                </button>
              )}
            </div>

            <div style={{
              fontSize: '0.9em',
              color: '#666'
            }}>
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </div>

            <div>
              {currentQuestionIndex < totalQuestions - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Next →
                </button>
              ) : (
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
                  Submit Quiz
                </button>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

export default StudentQuiz;
