import React from 'react';

/**
 * StudentDashboard Component
 * Shows student quiz history, scores, and recommendations
 */
export default function StudentDashboard({ user, data }) {
  if (!data) return null;

  return (
    <div className="student-dashboard">
      <h2>Welcome, {user?.firstName}! </h2>
      
      <div className="dashboard-grid">
        {/* Statistics Cards */}
        <div className="stats-section">
          <div className="stat-card">
            <h3>Total Quizzes Taken</h3>
            <p className="stat-value">{data?.totalSubmissions || 0}</p>
          </div>
          
          <div className="stat-card">
            <h3>Average Score</h3>
            <p className="stat-value">{(data?.averageScore || 0).toFixed(2)}%</p>
          </div>
          
          <div className="stat-card">
            <h3>Success Rate</h3>
            <p className="stat-value">{(data?.successRate || 0).toFixed(2)}%</p>
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="submissions-section">
          <h3>Recent Submissions</h3>
          <table className="submissions-table">
            <thead>
              <tr>
                <th>Quiz</th>
                <th>Score</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentSubmissions?.map((submission) => (
                <tr key={submission.id}>
                  <td>{submission.quizTitle}</td>
                  <td>{submission.score}/{submission.maxScore}</td>
                  <td>{new Date(submission.submittedAt).toLocaleDateString()}</td>
                  <td>
                    <span className={submission.passed ? 'passed' : 'failed'}>
                      {submission.passed ? ' Passed' : ' Failed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recommendations */}
        <div className="recommendations-section">
          <h3>Recommended Quizzes</h3>
          <div className="recommendations-list">
            {data?.recommendations?.map((quiz) => (
              <div key={quiz.id} className="recommendation-card">
                <h4>{quiz.title}</h4>
                <p>{quiz.description}</p>
                <button>Take Quiz →</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .student-dashboard {
          padding: 20px;
        }

        .dashboard-grid {
          display: grid;
          gap: 20px;
          margin-top: 20px;
        }

        .stats-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .stat-value {
          font-size: 28px;
          font-weight: bold;
          margin: 10px 0 0 0;
        }

        .submissions-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-radius: 8px;
          overflow: hidden;
        }

        .submissions-table th,
        .submissions-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
        }

        .submissions-table th {
          background-color: #f5f5f5;
          font-weight: 600;
        }

        .passed {
          color: green;
          font-weight: bold;
        }

        .failed {
          color: red;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}
