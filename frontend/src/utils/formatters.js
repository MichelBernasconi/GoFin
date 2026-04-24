export const formatCurrency = (v, curr = 'USD') => {
  if (v === undefined || v === null || isNaN(v)) return '$...';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: curr }).format(v);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
