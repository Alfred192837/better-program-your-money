const storage = require('../../utils/storage');
const { formatAmount, calculateMonthlyStats } = require('../../utils/util');

Page({
  data: {
    year: 0,
    month: 0,
    monthLabel: '',
    totalIncomeStr: '',
    totalExpenseStr: '',
    balanceStr: '',
    balanceClass: '',
    breakdown: [],
    isEmpty: true,
    maxTotal: 1,
    // For picker
    years: [],
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    yearIndex: 0,
    monthIndex: 0
  },

  onShow() {
    this.initPickerRange();
    this.calculate();
  },

  initPickerRange() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const years = [];
    for (let y = currentYear - 5; y <= currentYear + 2; y++) {
      years.push(y);
    }
    this.setData({
      years,
      yearIndex: years.indexOf(this.data.year || currentYear),
      monthIndex: (this.data.month || now.getMonth() + 1) - 1
    });
  },

  calculate() {
    const now = new Date();
    const year = this.data.year || now.getFullYear();
    const month = this.data.month || now.getMonth() + 1;

    const bills = storage.getBills();
    const stats = calculateMonthlyStats(bills, year, month);

    const totalIncome = stats.totalIncome;
    const totalExpense = stats.totalExpense;
    const balance = totalIncome - totalExpense;

    // Build breakdown array with pre-computed display values
    const breakdown = Object.entries(stats.byCategory)
      .map(([name, v]) => {
        const total = v.income + v.expense;
        const expensePercent = totalExpense > 0 ? ((v.expense / totalExpense) * 100).toFixed(1) : '0';
        const incomePercent = totalIncome > 0 ? ((v.income / totalIncome) * 100).toFixed(1) : '0';
        const hasIncome = v.income > 0;
        const hasExpense = v.expense > 0;

        return {
          name,
          income: v.income,
          expense: v.expense,
          total,
          incomeStr: formatAmount(v.income, 1),
          expenseStr: formatAmount(v.expense, 0),
          expensePercent,
          incomePercent,
          hasIncome,
          hasExpense
        };
      })
      .sort((a, b) => b.total - a.total);

    const maxTotal = breakdown.length > 0 ? Math.max(...breakdown.map(b => b.total)) : 1;

    // Pre-compute bar widths
    breakdown.forEach(b => {
      b.expenseBarWidth = b.expense > 0 ? Math.max((b.expense / maxTotal) * 100, 1) : 0;
      b.incomeBarWidth = b.income > 0 ? Math.max((b.income / maxTotal) * 100, 1) : 0;
      b.expenseOnly = b.hasExpense && !b.hasIncome;
      b.incomeOnly = b.hasIncome && !b.hasExpense;
    });

    this.setData({
      year,
      month,
      monthLabel: `${year}/${month}`,
      totalIncomeStr: formatAmount(totalIncome, 1),
      totalExpenseStr: formatAmount(totalExpense, 0),
      balanceStr: formatAmount(balance),
      balanceClass: balance >= 0 ? 'income' : 'expense',
      breakdown,
      isEmpty: stats.count === 0,
      maxTotal,
      yearIndex: this.data.years.indexOf(year),
      monthIndex: month - 1
    });
  },

  onMonthPickerChange(e) {
    const [yearIndex, monthIndex] = e.detail.value;
    this.setData({
      year: this.data.years[yearIndex],
      month: this.data.months[monthIndex]
    }, () => this.calculate());
  },

  onPrevMonth() {
    let { year, month } = this.data;
    month--;
    if (month < 1) { month = 12; year--; }
    this.setData({ year, month }, () => this.calculate());
  },

  onNextMonth() {
    let { year, month } = this.data;
    month++;
    if (month > 12) { month = 1; year++; }
    this.setData({ year, month }, () => this.calculate());
  }
});
