import { format, subDays, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const getDateRange = (range) => {
  const now = new Date();

  switch (range) {
    case 'today':
      return {
        start: startOfDay(now),
        end: endOfDay(now)
      };
    case 'yesterday': {
      const yesterday = subDays(now, 1);
      return {
        start: startOfDay(yesterday),
        end: endOfDay(yesterday)
      };
    }
    case 'week':
      return {
        start: subDays(now, 7),
        end: now
      };
    case 'month':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now)
      };
    default:
      return {
        start: subDays(now, 30),
        end: now
      };
  }
};

export const calculatePercentageChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  const change = ((current - previous) / previous) * 100;
  return Math.round(change * 100) / 100; // Round to 2 decimal places
};

export const groupByDate = (data, dateKey) => {
  const groups = {};

  data.forEach(item => {
    const date = format(new Date(item[dateKey]), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
  });

  return groups;
};