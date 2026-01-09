import React, { useState, useEffect } from 'react';
import { api } from '@quiz-platform/shared-lib';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';

/**
 * Dashboard Component
 * Main dashboard micro-frontend that loads student or teacher view
 * based on user role
 */
export default function Dashboard({ user }) {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch role-specific dashboard data
      if (user?.role === 'STUDENT') {
        const response = await api.get('/analytics/user/dashboard');
        setDashboardData(response.data);
      } else if (user?.role === 'TEACHER') {
        const response = await api.get('/analytics/teacher/dashboard');
        setDashboardData(response.data);
      }
    } catch (err) {
      setError(err.message);
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="dashboard-error">Error: {error}</div>;
  }

  return (
    <div className="dashboard-container">
      {user?.role === 'STUDENT' ? (
        <StudentDashboard user={user} data={dashboardData} />
      ) : user?.role === 'TEACHER' ? (
        <TeacherDashboard user={user} data={dashboardData} />
      ) : (
        <div>Unauthorized</div>
      )}
    </div>
  );
}
