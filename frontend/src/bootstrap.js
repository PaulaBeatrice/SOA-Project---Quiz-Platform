import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import './styles.css';
import NotificationService from './services/NotificationService';

// Local components
import Login from './components/Login';

// Lazy load micro-frontend modules
const DashboardModule = lazy(() => import('dashboard/Dashboard'));
const QuizModule = lazy(() => import('quiz/QuizManager'));
const AdminDashboard = lazy(() => import('admin/AdminDashboard').catch(() => {
  console.warn('Failed to load admin micro-frontend');
  return { default: () => <div style={{padding: '20px', textAlign: 'center'}}><h2>Admin Dashboard (Coming Soon)</h2></div> };
}));

function App() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Unified notification handler - this is the SINGLE callback for ALL notifications
  const handleNotification = useCallback((notification) => {
    console.log('🔔 [App] Notification received:', notification);
    const notifWithId = { ...notification, id: Date.now() };
    setNotifications(prev => [...prev, notifWithId]);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notifWithId.id));
    }, 5000);
  }, []);

  // Check if already logged in and connect to WebSocket
  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    const userIdStr = localStorage.getItem('userId');

    if (token && username && userIdStr) {
      // Restore user ID from localStorage, converting to number
      const userId = parseInt(userIdStr, 10);
      const userData = { id: userId, username, role, token };
      setUser(userData);

      // Connect to WebSocket with the unified handler (non-blocking)
      console.log('🔌 [App] Connecting to WebSocket for user:', username);
      NotificationService.connect(username, handleNotification).catch(err => {
        console.warn('WebSocket connection failed, continuing without notifications:', err);
      });
    }

    return () => {
      NotificationService.disconnect();
    };
  }, [handleNotification]);

  const handleLogin = useCallback((userData) => {
    console.log('✅ [App] User logged in:', userData.username);
    setUser(userData);

    // Store in localStorage for persistence
    localStorage.setItem('token', userData.token);
    localStorage.setItem('username', userData.username);
    localStorage.setItem('role', userData.role);
    localStorage.setItem('userId', userData.id);

    // Connect to WebSocket with the unified handler (non-blocking)
    console.log('🔌 [App] Connecting to WebSocket for user:', userData.username);
    NotificationService.connect(userData.username, handleNotification).catch(err => {
      console.warn('WebSocket connection failed, continuing without notifications:', err);
    });
  }, [handleNotification]);

  const handleLogout = useCallback(() => {
    console.log('✅ [App] User logged out');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    NotificationService.disconnect();
    setNotifications([]);
  }, []);

  return (
    <BrowserRouter>
      <div className="app-container">
        {/* Notification Display */}
        {notifications.length > 0 && (
          <div className="notification-container">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`notification notification-${notif.type || 'info'}`}
                style={{
                  backgroundColor:
                    notif.type === 'success'
                      ? '#4caf50'
                      : notif.type === 'error'
                      ? '#f44336'
                      : '#2196f3',
                }}
              >
                {notif.message || notif.type}
              </div>
            ))}
          </div>
        )}

        {!user ? (
          <Login onLogin={handleLogin} />
        ) : (
          <>
            {/* Navigation Bar */}
            <nav className="navbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', backgroundColor: '#333', color: 'white' }}>
              <div className="nav-brand">
                <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
                  Quiz Platform
                </Link>
              </div>
              <div className="nav-links" style={{ display: 'flex', gap: '20px' }}>
                {user.role !== 'ADMIN' && (
                  <>
                    <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
                      Dashboard
                    </Link>
                    {(user.role === 'STUDENT' || user.role === 'TEACHER') && (
                      <Link to="/quizzes" style={{ color: 'white', textDecoration: 'none' }}>
                        {user.role === 'STUDENT' ? 'Quizzes' : 'My Quizzes'}
                      </Link>
                    )}
                  </>
                )}
                {user.role === 'ADMIN' && (
                  <Link to="/admin" style={{ color: 'white', textDecoration: 'none' }}>
                    Admin Panel
                  </Link>
                )}
                <span style={{ color: 'lightgray' }}>Welcome, {user.username}</span>
                <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Logout
                </button>
              </div>
            </nav>

            {/* Routes */}
            <Routes>
              {/* Dashboard - Available to students and teachers only */}
              {user.role !== 'ADMIN' && (
                <Route 
                  path="/" 
                  element={<Suspense fallback={<div style={{padding: '20px', textAlign: 'center'}}>Loading dashboard...</div>}><DashboardModule user={user} /></Suspense>} 
                />
              )}

              {/* Admin Panel redirects to /admin */}
              {user.role === 'ADMIN' && (
                <Route 
                  path="/" 
                  element={<Navigate to="/admin" />} 
                />
              )}

              {/* Quiz Module - Available to students and teachers */}
              {(user.role === 'STUDENT' || user.role === 'TEACHER') && (
                <Route 
                  path="/quizzes/*" 
                  element={<Suspense fallback={<div style={{padding: '20px', textAlign: 'center'}}>Loading quizzes...</div>}><QuizModule user={user} /></Suspense>} 
                />
              )}

              {/* Admin Panel - Available to admins only */}
              {user.role === 'ADMIN' && (
                <Route 
                  path="/admin/*" 
                  element={<Suspense fallback={<div style={{padding: '20px', textAlign: 'center'}}>Loading admin panel...</div>}><AdminDashboard user={user} /></Suspense>} 
                />
              )}

              {/* Fallback */}
              <Route path="*" element={<Navigate to={user.role === 'ADMIN' ? '/admin' : '/'} />} />
            </Routes>
          </>
        )}
      </div>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

export default App;
