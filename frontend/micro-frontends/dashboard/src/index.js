import React from 'react';
import Dashboard from './Dashboard';

export default function App() {
  return (
    <div style={{ padding: '20px' }}>
      <Dashboard user={{ role: 'STUDENT', firstName: 'John' }} />
    </div>
  );
}
