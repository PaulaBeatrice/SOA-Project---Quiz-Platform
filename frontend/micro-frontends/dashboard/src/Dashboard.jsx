import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

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
 * Dashboard Component
 * Main dashboard micro-frontend that loads student or teacher view
 * based on user role
 */
export default function Dashboard({ user }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    completedQuizzes: 0,
    averageScore: 0,
  });
  const [quizzes, setQuizzes] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [error, setError] = useState(null);

  // Memoized function to load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Validate user ID is available
      if (!user || !user.id) {
        console.warn('User ID not available yet');
        setLoading(false);
        return;
      }

      // Fetch active quizzes through API Gateway
      // Routes: /api/quiz-service/quizzes -> quiz-service:8082
      const quizzesRes = await api.get('/api/quiz-service/quizzes');
      setQuizzes(quizzesRes.data || []);

      // Load user submissions through API Gateway
      // Routes: /api/submissions/user/{userId} -> submission-service:8083
      let submissionsData = [];
      try {
        const submissionsRes = await api.get(`/api/submissions/user/${user.id}`);
        submissionsData = submissionsRes.data || [];
        setSubmissions(submissionsData);
        console.log('Loaded submissions for user ' + user.id + ':', submissionsData);
      } catch (err) {
        console.error('ERROR loading submissions:', err.response?.status, err.response?.data, err.message);
        setSubmissions([]);
      }

      // Calculate stats
      const allSubmissions = submissionsData.length;
      const gradedSubmissions = submissionsData.filter(
        (sub) => sub.status === 'GRADED' && sub.score !== null && sub.score !== undefined
      );

      let avgScore = 0;
      if (gradedSubmissions.length > 0) {
        const totalScore = gradedSubmissions.reduce((sum, sub) => sum + (sub.score || 0), 0);
        const totalMaxScore = gradedSubmissions.reduce((sum, sub) => sum + (sub.maxScore || 0), 0);
        avgScore = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
      }

      setStats({
        totalQuizzes: (quizzesRes.data || []).length,
        completedQuizzes: allSubmissions,
        averageScore: avgScore,
      });
      setError(null);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Could not load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load data on component mount
  useEffect(() => {
    if (user && user.id) {
      console.log('Loading dashboard data for user:', user.username);
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#f8d7da',
        color: '#721c24',
        borderRadius: '5px',
        marginBottom: '20px'
      }}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Welcome to Quiz Platform</h1>
      <p>Logged in as: {user.username} ({user.role})</p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        <div style={{
          padding: '20px',
          backgroundColor: '#e3f2fd',
          borderRadius: '5px',
          textAlign: 'center'
        }}>
          <h3>Available Quizzes</h3>
          <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#1976d2' }}>
            {stats.totalQuizzes}
          </div>
        </div>

        {user.role === 'STUDENT' && (
          <>
            <div style={{
              padding: '20px',
              backgroundColor: '#f3e5f5',
              borderRadius: '5px',
              textAlign: 'center'
            }}>
              <h3>Completed Quizzes</h3>
              <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#7b1fa2' }}>
                {stats.completedQuizzes}
              </div>
            </div>

            <div style={{
              padding: '20px',
              backgroundColor: '#e8f5e9',
              borderRadius: '5px',
              textAlign: 'center'
            }}>
              <h3>Average Score</h3>
              <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#388e3c' }}>
                {stats.averageScore}%
              </div>
            </div>
          </>
        )}

        <div style={{
          padding: '20px',
          backgroundColor: '#fff3e0',
          borderRadius: '5px',
          textAlign: 'center'
        }}>
          <h3>Your Role</h3>
          <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#f57c00' }}>
            {user.role}
          </div>
        </div>
      </div>

      {user.role === 'STUDENT' && (
        <div>
          <h2>Available Quizzes to Take</h2>
          {quizzes.length === 0 ? (
            <p style={{ color: '#666' }}>No quizzes available at the moment.</p>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {quizzes.map((quiz) => {
                const quizSubmissions = submissions.filter((sub) => sub.quizId === quiz.id);
                const userSubmission = quizSubmissions.length > 0
                  ? quizSubmissions.reduce((latest, current) => {
                      const latestTime = new Date(latest.submittedAt || latest.startedAt);
                      const currentTime = new Date(current.submittedAt || current.startedAt);
                      return currentTime > latestTime ? current : latest;
                    })
                  : null;

                return (
                  <div
                    key={quiz.id}
                    style={{
                      padding: '20px',
                      border: userSubmission ? '2px solid #28a745' : '1px solid #ddd',
                      borderRadius: '5px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      backgroundColor: userSubmission ? '#f0f8f0' : 'white'
                    }}
                  >
                    <h3>{quiz.title}</h3>
                    <p style={{ color: '#666', marginBottom: '10px' }}>
                      {quiz.description}
                    </p>
                    <p style={{ fontSize: '0.9em', color: '#999' }}>
                      Duration: {quiz.timeLimit || 'Unlimited'} minutes<br />
                      Questions: {quiz.questions ? quiz.questions.length : 0}
                    </p>
                    {userSubmission && (
                      <p style={{ fontSize: '0.85em', color: '#28a745', marginTop: '10px' }}>
                        ✓ Score: {Math.round((userSubmission.score / userSubmission.maxScore) * 100)}%
                      </p>
                    )}
                    <button
                      onClick={() => window.location.href = `/quizzes/${quiz.id}`}
                      style={{
                        marginTop: '15px',
                        padding: '10px 20px',
                        backgroundColor: userSubmission ? '#ffc107' : '#007bff',
                        color: userSubmission ? '#000' : 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        width: '100%'
                      }}
                    >
                      {userSubmission ? 'Retake Quiz' : 'Take Quiz'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <h2 style={{ marginTop: '40px' }}>Submission History</h2>
          {submissions.length === 0 ? (
            <p style={{ color: '#666' }}>No submissions yet.</p>
          ) : (
            <div style={{
              overflowX: 'auto',
              marginTop: '20px',
              backgroundColor: '#fff',
              borderRadius: '5px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.9em'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Quiz Name</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Score</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Percentage</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Date Submitted</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission, index) => {
                    const quiz = quizzes.find((q) => q.id === submission.quizId);
                    const percentage = submission.maxScore > 0
                      ? Math.round((submission.score / submission.maxScore) * 100)
                      : 0;
                    const submittedDate = submission.submittedAt
                      ? new Date(submission.submittedAt).toLocaleString()
                      : 'Not submitted';

                    return (
                      <tr
                        key={submission.id}
                        style={{
                          borderBottom: '1px solid #eee',
                          backgroundColor: index % 2 === 0 ? '#fafafa' : '#fff'
                        }}
                      >
                        <td style={{ padding: '12px', color: '#333' }}>
                          {quiz ? quiz.title : `Quiz ${submission.quizId}`}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#333' }}>
                          {submission.score}/{submission.maxScore}
                        </td>
                        <td
                          style={{
                            padding: '12px',
                            textAlign: 'center',
                            color: percentage >= 70 ? '#28a745' : percentage >= 50 ? '#ffc107' : '#dc3545',
                            fontWeight: 'bold'
                          }}
                        >
                          {percentage}%
                        </td>
                        <td style={{ padding: '12px', color: '#666' }}>
                          {submittedDate}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: '3px',
                              backgroundColor: submission.status === 'GRADED' ? '#28a745' : '#ffc107',
                              color: 'white',
                              fontSize: '0.85em',
                              fontWeight: 'bold'
                            }}
                          >
                            {submission.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {user.role === 'TEACHER' && (
        <div>
          <h2>Your Quizzes</h2>
          {quizzes.length === 0 ? (
            <p style={{ color: '#666' }}>No quizzes created yet.</p>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {quizzes.map((quiz) => (
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
                  <p style={{ color: '#666', marginBottom: '10px' }}>
                    {quiz.description}
                  </p>
                  <p style={{ fontSize: '0.9em', color: '#999' }}>
                    Duration: {quiz.timeLimit || 'Unlimited'} minutes<br />
                    Questions: {quiz.questions ? quiz.questions.length : 0}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
