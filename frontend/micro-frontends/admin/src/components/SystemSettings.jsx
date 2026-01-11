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
 * SystemSettings Component
 * Manage system-wide configuration
 */
export default function SystemSettings() {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    maxLoginAttempts: 5,
    sessionTimeout: 3600,
    maxUploadSize: 10485760,
    emailNotificationsEnabled: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await api.post('/admin/settings', settings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="system-settings">
      <h3>System Settings</h3>

      <div className="settings-form">
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
            />
            <span>Maintenance Mode</span>
          </label>
          <p className="help-text">Enable to disable user access (admins can still login)</p>
        </div>

        <div className="form-group">
          <label>Max Login Attempts</label>
          <input
            type="number"
            value={settings.maxLoginAttempts}
            onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) })}
            min="1"
            max="10"
          />
          <p className="help-text">Number of failed login attempts before account lockout</p>
        </div>

        <div className="form-group">
          <label>Session Timeout (seconds)</label>
          <input
            type="number"
            value={settings.sessionTimeout}
            onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
            min="300"
            max="86400"
          />
          <p className="help-text">How long before inactive sessions expire</p>
        </div>

        <div className="form-group">
          <label>Max Upload Size (bytes)</label>
          <input
            type="number"
            value={settings.maxUploadSize}
            onChange={(e) => setSettings({ ...settings, maxUploadSize: parseInt(e.target.value) })}
            min="1000000"
          />
          <p className="help-text">Maximum file size for uploads in bytes</p>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={settings.emailNotificationsEnabled}
              onChange={(e) => setSettings({ ...settings, emailNotificationsEnabled: e.target.checked })}
            />
            <span>Enable Email Notifications</span>
          </label>
          <p className="help-text">Allow system to send email notifications to users</p>
        </div>

        <button onClick={handleSaveSettings} disabled={saving} className="save-btn">
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="system-info">
        <h4>System Information</h4>
        <div className="info-item">
          <span>Version:</span>
          <strong>1.0.0</strong>
        </div>
        <div className="info-item">
          <span>Environment:</span>
          <strong>Production</strong>
        </div>
        <div className="info-item">
          <span>Last Updated:</span>
          <strong>{new Date().toLocaleString()}</strong>
        </div>
      </div>

      <style>{`
        .system-settings {
          padding: 20px;
        }

        .settings-form {
          margin-bottom: 40px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: flex;
          align-items: center;
          font-weight: 600;
          margin-bottom: 5px;
        }

        .form-group input[type="checkbox"] {
          margin-right: 10px;
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .form-group input[type="number"] {
          width: 100%;
          padding: 10px;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          font-size: 14px;
        }

        .help-text {
          margin: 5px 0 0 0;
          font-size: 13px;
          color: #888;
        }

        .save-btn {
          padding: 12px 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
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

        .system-info {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }

        .system-info h4 {
          margin: 0 0 15px 0;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e0e0e0;
        }

        .info-item:last-child {
          border-bottom: none;
        }
      `}</style>
    </div>
  );
}
