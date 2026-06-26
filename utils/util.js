/**
 * Format a Date object or timestamp to "YYYY-MM-DD" string.
 */
function formatDate(date) {
  const d = date ? new Date(date) : new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Format a number to currency display string.
 * Positive → "¥1,234.56", expense amounts passed as negative → "-¥1,234.56"
 * @param {number} amount
 * @param {number} type - 0=expense, 1=income. If omitted, sign follows amount.
 */
function formatAmount(amount, type) {
  const abs = Math.abs(amount);
  const parts = abs.toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formatted = `¥${parts.join('.')}`;
  if (type !== undefined) {
    return type === 0 ? `-${formatted}` : `+${formatted}`;
  }
  return amount < 0 ? `-${formatted}` : `+${formatted}`;
}

/**
 * Get start and end date strings for a given year/month.
 */
function getMonthRange(year, month) {
  const m = String(month).padStart(2, '0');
  const start = `${year}-${m}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${m}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

/**
 * Calculate monthly statistics from a bills array.
 * Filters to bills within the given year/month.
 */
function calculateMonthlyStats(bills, year, month) {
  const { start, end } = getMonthRange(year, month);
  const monthBills = bills.filter(b => b.date >= start && b.date <= end);

  let totalIncome = 0;
  let totalExpense = 0;
  const byCategory = {};

  monthBills.forEach(b => {
    if (b.type === 1) {
      totalIncome += b.amount;
    } else {
      totalExpense += b.amount;
    }
    const cat = b.category || 'Other';
    if (!byCategory[cat]) {
      byCategory[cat] = { income: 0, expense: 0 };
    }
    if (b.type === 1) {
      byCategory[cat].income += b.amount;
    } else {
      byCategory[cat].expense += b.amount;
    }
  });

  return { totalIncome, totalExpense, byCategory, count: monthBills.length };
}

/**
 * Generate CSV string from bills array.
 */
function generateCSV(bills) {
  const header = 'Date,Type,Category,Amount,Note';
  const rows = bills.map(b => {
    const type = b.type === 0 ? 'Expense' : 'Income';
    const sign = b.type === 0 ? '-' : '';
    return `${b.date},${type},"${b.category}","${sign}${b.amount.toFixed(2)}","${(b.note || '').replace(/"/g, '""')}"`;
  });
  return '﻿' + [header, ...rows].join('\n'); // BOM for Excel UTF-8
}

/**
 * Validate an amount string. Returns parsed number or null.
 */
function parseAndValidateAmount(str) {
  const trimmed = str.trim();
  if (!trimmed) return { valid: false, value: null, error: 'Amount is required' };
  const num = parseFloat(trimmed);
  if (isNaN(num)) return { valid: false, value: null, error: 'Please enter a valid number' };
  if (num <= 0) return { valid: false, value: null, error: 'Amount must be greater than 0' };
  const decimals = trimmed.includes('.') ? trimmed.split('.')[1].length : 0;
  if (decimals > 2) return { valid: false, value: null, error: 'Maximum 2 decimal places' };
  return { valid: true, value: Math.round(num * 100) / 100, error: null };
}

module.exports = {
  formatDate,
  formatAmount,
  getMonthRange,
  calculateMonthlyStats,
  generateCSV,
  parseAndValidateAmount
};
