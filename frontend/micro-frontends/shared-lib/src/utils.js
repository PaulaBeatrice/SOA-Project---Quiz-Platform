// Shared utility functions

export const formatDate = (date) => {
  return new Date(date).toLocaleString();
};

export const calculatePercentage = (score, maxScore) => {
  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
};

export const getPercentageColor = (percentage) => {
  if (percentage >= 70) return '#28a745';
  if (percentage >= 50) return '#ffc107';
  return '#dc3545';
};

export const formatScore = (score, maxScore) => {
  return `${score}/${maxScore}`;
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'GRADED':
      return '#28a745';
    case 'SUBMITTED':
      return '#ffc107';
    case 'IN_PROGRESS':
      return '#17a2b8';
    default:
      return '#6c757d';
  }
};

export const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};
