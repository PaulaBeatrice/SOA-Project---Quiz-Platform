import React from 'react';
import AdminDashboard from './AdminDashboard';

export default function App() {
  return (
    <div>
      <AdminDashboard user={{ role: 'ADMIN', firstName: 'Admin', lastName: 'User' }} />
    </div>
  );
}
