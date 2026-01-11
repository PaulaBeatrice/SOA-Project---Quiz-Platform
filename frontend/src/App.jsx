import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';

// Lazy load remote micro-frontend modules
const DashboardModule = lazy(() => import('dashboard/Dashboard'));
const QuizModule = lazy(() => import('quiz/QuizManager'));
const AdminModule = lazy(() => import('admin/AdminDashboard'));

// Local pages
import Login from './components/Login';
import NotificationService from './services/NotificationService';

/**
 * Shell Application - Main App Container
 * Loads micro-frontends based on user role and route
 */
function App() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize global quiz event queue if not exists
  if (!window.quizEventQueue) {
    window.quizEventQueue = [];
    console.log('[App] Initialized global quiz event queue');
  }

  // Restore user session on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    const userId = localStorage.getItem('userId');

    if (token && username && userId) {
      const userData = { 
        id: parseInt(userId), 
        username, 
        role,
        firstName: localStorage.getItem('firstName'),
        lastName: localStorage.getItem('lastName'),
        token 
      };
      setUser(userData);
      
      // Connect to notification service
      NotificationService.connect(username, handleNotification);
    }
    setLoading(false);
  }, [handleNotification]);

  const handleNotification = useCallback((notification) => {
    console.log('[App] Notification received:', notification);
    
    // Dispatch event for quiz updates (this is the priority)
    try {
      const eventType = notification?.type || notification?.eventType;
      console.log('[App] Event type:', eventType);
      
      if (eventType === 'QUIZ_CREATED' || eventType === 'QUIZ_DELETED' || eventType === 'QUIZ_UPDATED') {
        console.log('[App] Quiz event detected - queuing and dispatching');
        
        // Queue event globally so QuizManager can fetch it even if not mounted yet
        const event = { type: eventType, timestamp: Date.now(), data: notification };
        window.quizEventQueue.push(event);
        console.log(' [App] Event queued, queue length:', window.quizEventQueue.length);
        
        // Also dispatch custom event for immediate handling if listener exists
        window.dispatchEvent(new CustomEvent('quiz-event', { detail: event }));
        console.log(' [App] Custom event dispatched');
      }
    } catch (err) {
      console.error(' [App] Error dispatching event:', err);
    }
    
    // Separately, handle notification UI (with error handling)
    try {
      const notifWithId = { ...notification, id: Date.now() };
      setNotifications(prev => [...prev, notifWithId]);
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notifWithId.id));
      }, 5000);
    } catch (err) {
      console.error(' [App] Error updating notifications:', err);
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('token', userData.token);
    localStorage.setItem('username', userData.username);
    localStorage.setItem('role', userData.role);
    localStorage.setItem('userId', userData.id);
    localStorage.setItem('firstName', userData.firstName || '');
    localStorage.setItem('lastName', userData.lastName || '');
    
    // Connect WebSocket
    NotificationService.connect(userData.username, handleNotification);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.clear();
    NotificationService.disconnect();
    setNotifications([]);
  };

  if (loading) {
    return <div className="loading">Loading Quiz Platform...</div>;
  }

  // Show login page if not authenticated
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      {/* Top Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <h1> Quiz Platform</h1>
        </div>

        <div className="navbar-menu">
          {user.role !== 'ADMIN' && (
            <Link to="/" className="nav-link">
               Dashboard
            </Link>
          )}

          {(user.role === 'STUDENT' || user.role === 'TEACHER') && (
            <Link to="/quizzes" className="nav-link">
              Quizzes
            </Link>
          )}

          {user.role === 'ADMIN' && (
            <Link to="/admin" className="nav-link">
               Admin Panel
            </Link>
          )}
        </div>

        <div className="navbar-user">
          <span className="user-info">
            {user.firstName} {user.lastName} ({user.role})
          </span>
          <button onClick={handleLogout} className="logout-btn">
             Logout
          </button>
        </div>
      </nav>

      {/* Notification Toast Container */}
      {notifications.length > 0 && (
        <div className="notification-container">
          {notifications.map((notif) => (
            <div key={notif.id} className={`notification notification-${notif.type || 'info'}`}>
              <p>{notif.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Main Content Area */}
      <div className="main-content">
        <Suspense fallback={<div className="loading">Loading module...</div>}>
          <Routes>
            {/* Dashboard - Available to students and teachers only */}
            {user.role !== 'ADMIN' && (
              <Route 
                path="/" 
                element={<DashboardModule user={user} />} 
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
                element={<QuizModule user={user} />} 
              />
            )}

            {/* Admin Panel - Available to admins only */}
            {user.role === 'ADMIN' && (
              <Route 
                path="/admin/*" 
                element={<AdminModule user={user} />} 
              />
            )}

            {/* Fallback */}
            <Route path="*" element={<Navigate to={user.role === 'ADMIN' ? '/admin' : '/'} />} />
          </Routes>
        </Suspense>
      </div>

      {/* Styles */}
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #f5f5f5;
        }

        .app-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background-color: #f5f5f5;
        }

        .navbar {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 0 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          height: 70px;
        }

        .navbar-brand h1 {
          font-size: 24px;
          font-weight: bold;
        }

        .navbar-menu {
          display: flex;
          gap: 20px;
          flex: 1;
          margin-left: 40px;
        }

        .nav-link {
          color: white;
          text-decoration: none;
          font-weight: 500;
          padding: 8px 12px;
          border-radius: 4px;
          transition: background-color 0.3s;
        }

        .nav-link:hover {
          background-color: rgba(255,255,255,0.2);
        }

        .navbar-user {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .user-info {
          font-size: 14px;
          opacity: 0.9;
        }

        .logout-btn {
          background: rgba(255,255,255,0.2);
          color: white;
          border: 1px solid white;
          padding: 8px 15px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s;
        }

        .logout-btn:hover {
          background: rgba(255,255,255,0.3);
        }

        .main-content {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }

        .notification-container {
          position: fixed;
          top: 80px;
          right: 20px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 400px;
        }

        .notification {
          padding: 15px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          animation: slideIn 0.3s ease-in-out;
        }

        .notification-success {
          background-color: #4caf50;
          color: white;
        }

        .notification-error {
          background-color: #f44336;
          color: white;
        }

        .notification-info {
          background-color: #2196f3;
          color: white;
        }

        .notification p {
          margin: 0;
          font-size: 14px;
        }

        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .loading {
          text-align: center;
          padding: 60px 20px;
          font-size: 18px;
          color: #666;
        }

        @media (max-width: 768px) {
          .navbar {
            flex-wrap: wrap;
            gap: 10px;
          }

          .navbar-menu {
            flex-basis: 100%;
            margin-left: 0;
            gap: 10px;
            order: 3;
          }

          .navbar-user {
            flex-basis: 100%;
            order: 4;
            justify-content: space-between;
          }

          .notification-container {
            left: 10px;
            right: 10px;
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
