const storage = require('../../utils/storage');
const { formatAmount, formatDate } = require('../../utils/util');

const PAGE_SIZE = 50;

Page({
  data: {
    startDate: '',
    endDate: '',
    keyword: '',
    allResults: [],
    displayedResults: [],
    displayedCount: 0,
    hasMore: false,
    hasSearched: false,
    isEmpty: true
  },

  onLoad() {
    const now = new Date();
    const start = `${now.getFullYear()}-01-01`;
    const end = formatDate(now);
    this.setData({ startDate: start, endDate: end });
  },

  onStartDateChange(e) {
    this.setData({ startDate: e.detail.value });
  },

  onEndDateChange(e) {
    this.setData({ endDate: e.detail.value });
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  onSearch() {
    const { startDate, endDate, keyword } = this.data;
    let bills = storage.getBillsSorted();

    // Filter by date range
    if (startDate) {
      bills = bills.filter(b => b.date >= startDate);
    }
    if (endDate) {
      bills = bills.filter(b => b.date <= endDate);
    }

    // Filter by keyword (category or note)
    const kw = keyword.trim().toLowerCase();
    if (kw) {
      bills = bills.filter(b =>
        (b.category && b.category.toLowerCase().includes(kw)) ||
        (b.note && b.note.toLowerCase().includes(kw))
      );
    }

    // Pre-format display fields
    bills.forEach(b => {
      b.amountStr = (b.type === 0 ? '-' : '+') + '¥' + b.amount.toFixed(2);
      b.typeClass = b.type === 0 ? 'expense' : 'income';
    });

    const displayedCount = Math.min(PAGE_SIZE, bills.length);
    this.setData({
      allResults: bills,
      displayedResults: bills.slice(0, displayedCount),
      displayedCount,
      hasMore: displayedCount < bills.length,
      hasSearched: true,
      isEmpty: bills.length === 0
    });
  },

  loadMore() {
    const { allResults, displayedCount } = this.data;
    const next = displayedCount + PAGE_SIZE;
    const hasMore = next < allResults.length;
    this.setData({
      displayedResults: allResults.slice(0, next),
      displayedCount: hasMore ? next : allResults.length,
      hasMore
    });
  },

  onClear() {
    this.setData({
      keyword: '',
      allResults: [],
      displayedResults: [],
      displayedCount: 0,
      hasMore: false,
      hasSearched: false,
      isEmpty: true
    });
  }
});
