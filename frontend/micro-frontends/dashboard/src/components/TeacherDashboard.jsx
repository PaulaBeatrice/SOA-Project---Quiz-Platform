import React from 'react';

/**
 * TeacherDashboard Component
 * Shows teacher quiz management, student performance, and analytics
 */
export default function TeacherDashboard({ user, data }) {
  if (!data) return null;

  return (
    <div className="teacher-dashboard">
      <h2>Welcome, {user?.firstName}! </h2>
      
      <div className="dashboard-grid">
        {/* Statistics Cards */}
        <div className="stats-section">
          <div className="stat-card blue">
            <h3>My Quizzes</h3>
            <p className="stat-value">{data?.totalQuizzes || 0}</p>
          </div>
          
          <div className="stat-card green">
            <h3>Total Submissions</h3>
            <p className="stat-value">{data?.totalSubmissions || 0}</p>
          </div>
          
          <div className="stat-card purple">
            <h3>Class Average</h3>
            <p className="stat-value">{(data?.classAverage || 0).toFixed(2)}%</p>
          </div>
          
          <div className="stat-card orange">
            <h3>Pass Rate</h3>
            <p className="stat-value">{(data?.passRate || 0).toFixed(2)}%</p>
          </div>
        </div>

        {/* Recent Quizzes */}
        <div className="quizzes-section">
          <h3>My Quizzes</h3>
          <table className="quizzes-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Submissions</th>
                <th>Avg Score</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.quizzes?.map((quiz) => (
                <tr key={quiz.id}>
                  <td>{quiz.title}</td>
                  <td>{quiz.submissionCount}</td>
                  <td>{quiz.averageScore.toFixed(2)}%</td>
                  <td>
                    <span className={`status-${quiz.published ? 'published' : 'draft'}`}>
                      {quiz.published ? ' Published' : ' Draft'}
                    </span>
                  </td>
                  <td>
                    <button className="action-btn">Edit</button>
                    <button className="action-btn">Results</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Student Performance */}
        <div className="performance-section">
          <h3>Top Performers</h3>
          <div className="performance-list">
            {data?.topPerformers?.map((student, index) => (
              <div key={student.id} className="performance-item">
                <span className="rank">#{index + 1}</span>
                <div className="student-info">
                  <p className="student-name">{student.name}</p>
                  <p className="student-score">{student.averageScore.toFixed(2)}% average</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .teacher-dashboard {
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
          color: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .stat-card.blue {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .stat-card.green {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .stat-card.purple {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        .stat-card.orange {
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        }

        .stat-value {
          font-size: 28px;
          font-weight: bold;
          margin: 10px 0 0 0;
        }

        .quizzes-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-radius: 8px;
          overflow: hidden;
        }

        .quizzes-table th,
        .quizzes-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
        }

        .quizzes-table th {
          background-color: #f5f5f5;
          font-weight: 600;
        }

        .status-published {
          color: green;
          font-weight: bold;
        }

        .status-draft {
          color: orange;
          font-weight: bold;
        }

        .action-btn {
          padding: 6px 12px;
          margin-right: 5px;
          border: none;
          background-color: #667eea;
          color: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .action-btn:hover {
          background-color: #5568d3;
        }

        .performance-item {
          display: flex;
          align-items: center;
          padding: 12px;
          background: white;
          margin-bottom: 10px;
          border-radius: 6px;
          border-left: 4px solid #667eea;
        }

        .rank {
          font-weight: bold;
          color: #667eea;
          font-size: 18px;
          margin-right: 15px;
        }

        .student-name {
          margin: 0;
          font-weight: 600;
        }

        .student-score {
          margin: 2px 0 0 0;
          color: #666;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
