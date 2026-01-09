import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api, { submissionAPI } from '../services/api';
import NotificationService from '../services/NotificationService';

function Dashboard({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    completedQuizzes: 0,
    averageScore: 0,
  });
  const [quizzes, setQuizzes] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notificationConnected, setNotificationConnected] = useState(false);

  // Memoize loadDashboardData to avoid unnecessary re-renders
  const loadDashboardData = useCallback(async () => {
    try {
      // Validate user ID is available
      if (!user || !user.id) {
        console.warn('User ID not available yet');
        setLoading(false);
        return;
      }

      const quizzesRes = await api.get('/quiz-service/quizzes/active');
      setQuizzes(quizzesRes.data || []);
      
      // Load user submissions
      let submissionsData = [];
      try {
        const submissionsRes = await submissionAPI.getByUser(user.id);
        submissionsData = submissionsRes.data || [];
        setSubmissions(submissionsData);
        console.log(' Loaded submissions for user ' + user.id + ':', submissionsData);
        console.log(' API Response status:', submissionsRes.status, 'Data:', JSON.stringify(submissionsData));
      } catch (err) {
        console.error(' ERROR loading submissions:', err.response?.status, err.response?.data, err.message);
        console.log('Could not load submissions:', err);
      }

      // Calculate stats - Count ALL submissions as completed, but only GRADED ones for average
      const allSubmissions = submissionsData.length; // Count all (IN_PROGRESS, SUBMITTED, GRADED)
      const gradedSubmissions = submissionsData.filter(sub => sub.status === 'GRADED' && sub.score !== null && sub.score !== undefined);
      console.log(' All submissions:', allSubmissions, '| Graded submissions:', gradedSubmissions.length);
      console.log(' Full gradedSubmissions array:', JSON.stringify(gradedSubmissions, null, 2));
      
      // Calculate average as a PERCENTAGE: (total score / total maxScore) * 100
      let avgScore = 0;
      if (gradedSubmissions.length > 0) {
        const totalScore = gradedSubmissions.reduce((sum, sub) => sum + (sub.score || 0), 0);
        const totalMaxScore = gradedSubmissions.reduce((sum, sub) => sum + (sub.maxScore || 0), 0);
        console.log(' Score calc: totalScore=' + totalScore + ', totalMaxScore=' + totalMaxScore);
        avgScore = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
      }

      console.log(' Average score calculated:', avgScore, '% from', gradedSubmissions.length, 'graded submissions');

      setStats({
        totalQuizzes: (quizzesRes.data || []).length,
        completedQuizzes: allSubmissions, // Count all submissions as "completed"
        averageScore: avgScore,
      });
      setError('');
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setError('Could not load quizzes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Handle incoming WebSocket notifications for quiz updates
  const handleNotification = useCallback((notification) => {
    console.log(' Notification received:', notification);
    const type = notification.eventType || notification.type;
    if (type === 'QUIZ_CREATED' || type === 'QUIZ_UPDATED' || type === 'QUIZ_DELETED') {
      console.log(' Quiz update received (' + type + '), refreshing dashboard...', notification);
      // Reload dashboard data when quiz is created, updated, or deleted
      setTimeout(() => loadDashboardData(), 500); // Small delay to ensure backend is updated
    } else if (type === 'SUBMISSION_GRADED') {
      console.log(' Submission graded, refreshing submissions...', notification);
      // Reload submissions when grading is complete
      setTimeout(() => loadDashboardData(), 500);
    }
  }, [loadDashboardData]);

  // Connect to WebSocket and ensure listener is set up BEFORE initial data load
  useEffect(() => {
    if (!user || !user.id || !user.username) {
      console.warn('User not fully loaded yet');
      return;
    }

    console.log(' Connecting to WebSocket for user:', user.username);
    
    // Connect to WebSocket FIRST
    NotificationService.connect(user.username, handleNotification);
    setNotificationConnected(true);
    
    // Then set up auto-refresh every 10 seconds as fallback
    const refreshInterval = setInterval(() => {
      console.log(' Auto-refreshing dashboard data...');
      loadDashboardData();
    }, 10000);

    return () => {
      clearInterval(refreshInterval);
      // Keep WebSocket connection open for other components
    };
  }, [user, handleNotification, loadDashboardData]);

  // Refresh submissions when returning from quiz submission
  useEffect(() => {
    if (location.state?.refreshSubmissions) {
      console.log('Refreshing submissions after quiz submission...');
      
      // Load immediately
      loadDashboardData();
      
      // Then retry after 2 seconds in case grading is still in progress
      const retryTimer = setTimeout(() => {
        console.log(' Retrying to load submissions (grading might still be processing)...');
        loadDashboardData();
      }, 2000);
      
      // And once more after 4 seconds
      const retryTimer2 = setTimeout(() => {
        console.log(' Final retry to load submissions...');
        loadDashboardData();
      }, 4000);
      
      // Clear the state flag
      window.history.replaceState({}, document.title);
      
      return () => {
        clearTimeout(retryTimer);
        clearTimeout(retryTimer2);
      };
    }
  }, [location.state?.refreshSubmissions, loadDashboardData]);

  // Initial data load when user is available
  useEffect(() => {
    if (user && user.id) {
      console.log(' Loading initial dashboard data for user:', user.username);
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

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

      {user.role === 'STUDENT' || user.role === 'student' ? (
        <div>
          <h2>Available Quizzes to Take</h2>
          {loading ? (
            <p>Loading quizzes...</p>
          ) : quizzes.length === 0 ? (
            <p style={{ color: '#666' }}>No quizzes available at the moment.</p>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {quizzes.map(quiz => {
                // Find the MOST RECENT submission for this quiz (not the first one)
                const quizSubmissions = submissions.filter(sub => sub.quizId === quiz.id);
                const userSubmission = quizSubmissions.length > 0 
                  ? quizSubmissions.reduce((latest, current) => {
                      const latestTime = new Date(latest.submittedAt || latest.startedAt);
                      const currentTime = new Date(current.submittedAt || current.startedAt);
                      return currentTime > latestTime ? current : latest;
                    })
                  : null;
                const scorePercentage = userSubmission && userSubmission.maxScore > 0 
                  ? Math.round((userSubmission.score / userSubmission.maxScore) * 100)
                  : 0;
                if (userSubmission) {
                  console.log('🎯 Quiz', quiz.id, ':', quiz.title, '| Submission:', JSON.stringify({
                    submissionId: userSubmission.id,
                    score: userSubmission.score,
                    maxScore: userSubmission.maxScore,
                    calculated: scorePercentage + '%',
                    submittedAt: userSubmission.submittedAt
                  }));
                }
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
                    <button
                      onClick={() => navigate(`/quiz/${quiz.id}`)}
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
                    const quiz = quizzes.find(q => q.id === submission.quizId);
                    const percentage = submission.maxScore > 0 
                      ? Math.round((submission.score / submission.maxScore) * 100)
                      : 0;
                    const submittedDate = submission.submittedAt 
                      ? new Date(submission.submittedAt).toLocaleString()
                      : 'Not submitted';
                    const statusColor = submission.status === 'GRADED' ? '#28a745' : '#ffc107';
                    
                    return (
                      <tr key={submission.id} style={{
                        borderBottom: '1px solid #eee',
                        backgroundColor: index % 2 === 0 ? '#fafafa' : '#fff'
                      }}>
                        <td style={{ padding: '12px', color: '#333' }}>{quiz ? quiz.title : `Quiz ${submission.quizId}`}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#333' }}>
                          {submission.score}/{submission.maxScore}
                        </td>
                        <td style={{ 
                          padding: '12px', 
                          textAlign: 'center', 
                          color: percentage >= 70 ? '#28a745' : percentage >= 50 ? '#ffc107' : '#dc3545',
                          fontWeight: 'bold'
                        }}>
                          {percentage}%
                        </td>
                        <td style={{ padding: '12px', color: '#666' }}>
                          {submittedDate}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '3px',
                            backgroundColor: statusColor,
                            color: 'white',
                            fontSize: '0.85em',
                            fontWeight: 'bold'
                          }}>
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
      ) : (
        <div>
          <h2>Your Quizzes</h2>
          {loading ? (
            <p>Loading quizzes...</p>
          ) : quizzes.length === 0 ? (
            <p style={{ color: '#666' }}>No quizzes created yet. <button onClick={() => navigate('/admin')} style={{ cursor: 'pointer', color: '#007bff', background: 'none', border: 'none', textDecoration: 'underline' }}>Create one in the Admin Panel</button></p>
          ) : (
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
                  <p style={{ color: '#666', marginBottom: '10px' }}>
                    {quiz.description}
                  </p>
                  <p style={{ fontSize: '0.9em', color: '#999' }}>
                    Duration: {quiz.timeLimit || 'Unlimited'} minutes<br />
                    Questions: {quiz.questions ? quiz.questions.length : 0}
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
                      onClick={() => navigate('/admin')}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                      }}
                    >
                      Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;

