import React, { useState, useEffect } from 'react';
import { api } from '@quiz-platform/shared-lib';

export default function TakeQuiz({ quizId, onComplete }) {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  useEffect(() => {
    if (!timeRemaining || submitted) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(time => {
        if (time <= 1) {
          handleSubmit();
          return 0;
        }
        return time - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, submitted]);

  const loadQuiz = async () => {
    try {
      const response = await api.get(`/quizzes/${quizId}`);
      setQuiz(response.data);
      setTimeRemaining(response.data.timeLimit * 60);
    } catch (error) {
      console.error('Error loading quiz:', error);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async () => {
    try {
      await api.post(`/submissions/${quizId}/submit`, { answers });
      setSubmitted(true);
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  if (!quiz) return <div>Loading quiz...</div>;
  if (submitted) return <div className="success"> Quiz submitted successfully!</div>;

  const question = quiz.questions[currentQuestion];
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="take-quiz">
      <div className="quiz-header">
        <h2>{quiz.title}</h2>
        <div className="timer" style={{ color: timeRemaining < 60 ? 'red' : 'black' }}>
           {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
      </div>

      <div className="progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
          />
        </div>
        <p>Question {currentQuestion + 1} of {quiz.questions.length}</p>
      </div>

      <div className="question-container">
        <h3>{question.text}</h3>
        
        {question.type === 'MULTIPLE_CHOICE' && (
          <div className="options">
            {question.options.map((option, index) => (
              <label key={index} className="option">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={answers[question.id] === option}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                />
                {option}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="navigation">
        <button 
          onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
        >
          ← Previous
        </button>
        
        {currentQuestion < quiz.questions.length - 1 ? (
          <button onClick={() => setCurrentQuestion(prev => prev + 1)}>
            Next →
          </button>
        ) : (
          <button onClick={handleSubmit} className="submit">
            Submit Quiz
          </button>
        )}
      </div>

      <style>{`
        .take-quiz {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }

        .quiz-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .timer {
          font-size: 24px;
          font-weight: bold;
        }

        .progress-bar {
          width: 100%;
          height: 10px;
          background: #e0e0e0;
          border-radius: 5px;
          overflow: hidden;
          margin-bottom: 10px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          transition: width 0.3s;
        }

        .question-container {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .options {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 15px;
        }

        .option {
          display: flex;
          align-items: center;
          padding: 10px;
          border: 2px solid #e0e0e0;
          border-radius: 4px;
          cursor: pointer;
          transition: border-color 0.3s;
        }

        .option:hover {
          border-color: #667eea;
        }

        .option input {
          margin-right: 10px;
        }

        .navigation {
          display: flex;
          gap: 10px;
          justify-content: space-between;
          margin-top: 20px;
        }

        .navigation button {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          background: #667eea;
          color: white;
          cursor: pointer;
          font-weight: 600;
        }

        .navigation button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .navigation button.submit {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .success {
          text-align: center;
          padding: 40px;
          font-size: 24px;
          color: green;
        }
      `}</style>
    </div>
  );
}
