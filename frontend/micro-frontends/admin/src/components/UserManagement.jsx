import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Create axios instance with API base URL
const api = axios.create({
  baseURL: 'http://localhost:8080',
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
 * UserManagement Component
 * Allows admins to manage all users
 */
export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadUsers();
  }, [filter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/users/admin/users?role=${filter}`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/api/users/admin/users/${userId}`);
        setUsers(users.filter(u => u.id !== userId));
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await api.put(`/api/users/admin/users/${userId}/role`, { role: newRole });
      loadUsers();
    } catch (error) {
      console.error('Error changing role:', error);
    }
  };

  return (
    <div className="user-management">
      <h3>User Management</h3>

      <div className="filter-section">
        <label>Filter by Role:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Users</option>
          <option value="STUDENT">Students</option>
          <option value="TEACHER">Teachers</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.firstName} {user.lastName}</td>
                <td>{user.email}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) => handleChangeRole(user.id, e.target.value)}
                    className="role-select"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="TEACHER">Teacher</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
                <td>
                  <span className={user.isActive ? 'active' : 'inactive'}>
                    {user.isActive ? ' Active' : ' Inactive'}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <style>{`
        .user-management {
          padding: 20px;
        }

        .filter-section {
          margin-bottom: 20px;
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .filter-section select {
          padding: 8px;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          font-size: 14px;
        }

        .users-table {
          width: 100%;
          border-collapse: collapse;
        }

        .users-table th,
        .users-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
        }

        .users-table th {
          background-color: #f5f5f5;
          font-weight: 600;
        }

        .role-select {
          padding: 6px;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          font-size: 13px;
        }

        .active {
          color: green;
          font-weight: 600;
        }

        .inactive {
          color: orange;
          font-weight: 600;
        }

        .delete-btn {
          padding: 6px 12px;
          background: #f5576c;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .delete-btn:hover {
          background: #e63946;
        }
      `}</style>
    </div>
  );
}
