import React from 'react';
import QuizManager from './QuizManager';

export default function App() {
  return (
    <div style={{ padding: '20px' }}>
      <QuizManager user={{ role: 'TEACHER' }} />
    </div>
  );
}
