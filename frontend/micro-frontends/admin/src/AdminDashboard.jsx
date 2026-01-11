import { useState } from 'react';
import UserManagement from './components/UserManagement';
import SystemSettings from './components/SystemSettings';

/**
 * AdminDashboard Component
 * Main admin panel with system-wide management capabilities
 */
export default function AdminDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('users');

  if (user?.role !== 'ADMIN') {
    return <div className="unauthorized"> Access Denied: Admin only</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2> System Administration</h2>
        <p className="admin-user">Logged in as admin {user.firstName} {user.lastName}</p>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
           User Management
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'users' && <UserManagement />}
      </div>

      <style>{`
        .admin-dashboard {
          padding: 20px;
          background: #f5f5f5;
          min-height: 100vh;
        }

        .admin-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .admin-header h2 {
          margin: 0;
        }

        .admin-user {
          margin: 10px 0 0 0;
          font-size: 14px;
          opacity: 0.9;
        }

        .admin-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .tab {
          padding: 12px 20px;
          border: 2px solid #e0e0e0;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
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

        .admin-content {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .unauthorized {
          text-align: center;
          padding: 40px;
          font-size: 18px;
          color: red;
        }
      `}</style>
    </div>
  );
}
