import React, { useState } from 'react';
import { api } from '@quiz-platform/shared-lib';

/**
 * CreateQuiz Component
 * Allows teachers to create new quizzes
 */
export default function CreateQuiz({ onQuizCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState(30);
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    type: 'MULTIPLE_CHOICE',
    options: ['', '', ''],
    correctAnswer: '',
    points: 10
  });
  const [saving, setSaving] = useState(false);

  const handleAddQuestion = () => {
    if (newQuestion.text) {
      setQuestions([...questions, { ...newQuestion, id: Date.now() }]);
      setNewQuestion({
        text: '',
        type: 'MULTIPLE_CHOICE',
        options: ['', '', ''],
        correctAnswer: '',
        points: 10
      });
    }
  };

  const handleSaveQuiz = async () => {
    if (!title || questions.length === 0) {
      alert('Please fill in quiz title and add at least one question');
      return;
    }

    try {
      setSaving(true);
      await api.post('/quizzes', {
        title,
        description,
        timeLimit,
        questions
      });
      
      // Reset form
      setTitle('');
      setDescription('');
      setTimeLimit(30);
      setQuestions([]);
      
      if (onQuizCreated) onQuizCreated();
      alert('Quiz created successfully!');
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert('Error creating quiz');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="create-quiz">
      <h3>Create New Quiz</h3>

      <div className="form-group">
        <label>Quiz Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Java Fundamentals"
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what this quiz is about"
          rows="3"
        />
      </div>

      <div className="form-group">
        <label>Time Limit (minutes) *</label>
        <input
          type="number"
          value={timeLimit}
          onChange={(e) => setTimeLimit(parseInt(e.target.value))}
          min="1"
          max="300"
        />
      </div>

      <div className="questions-section">
        <h4>Questions ({questions.length})</h4>
        
        {questions.map((q, idx) => (
          <div key={q.id} className="question-item">
            <p><strong>{idx + 1}. {q.text}</strong></p>
            <button
              type="button"
              onClick={() => setQuestions(questions.filter(qq => qq.id !== q.id))}
              className="delete-btn"
            >
              Delete
            </button>
          </div>
        ))}

        <div className="new-question">
          <h4>Add Question</h4>
          
          <div className="form-group">
            <label>Question Text *</label>
            <input
              type="text"
              value={newQuestion.text}
              onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
              placeholder="Enter question"
            />
          </div>

          <div className="form-group">
            <label>Type</label>
            <select
              value={newQuestion.type}
              onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value })}
            >
              <option value="MULTIPLE_CHOICE">Multiple Choice</option>
              <option value="TRUE_FALSE">True/False</option>
              <option value="SHORT_ANSWER">Short Answer</option>
            </select>
          </div>

          <div className="form-group">
            <label>Points</label>
            <input
              type="number"
              value={newQuestion.points}
              onChange={(e) => setNewQuestion({ ...newQuestion, points: parseInt(e.target.value) })}
              min="1"
              max="100"
            />
          </div>

          <button onClick={handleAddQuestion} className="add-question-btn">
            + Add Question
          </button>
        </div>
      </div>

      <div className="actions">
        <button
          onClick={handleSaveQuiz}
          disabled={saving}
          className="save-btn"
        >
          {saving ? 'Saving...' : 'Save Quiz'}
        </button>
      </div>

      <style>{`
        .create-quiz {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 10px;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          font-family: inherit;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
        }

        .question-item {
          background: #f9f9f9;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .question-item p {
          margin: 0;
        }

        .delete-btn {
          padding: 5px 10px;
          background: #f5576c;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .add-question-btn {
          background: #667eea;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
        }

        .save-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 30px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          font-size: 16px;
        }

        .save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .actions {
          text-align: center;
          margin-top: 20px;
        }
      `}</style>
    </div>
  );
}
