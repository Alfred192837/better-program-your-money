const storage = require('../../utils/storage');
const { formatAmount, calculateMonthlyStats } = require('../../utils/util');

const PAGE_SIZE = 50;

Page({
  data: {
    bookId: null,
    bookName: '',
    bills: [],
    displayedCount: 0,
    hasMore: true,
    monthLabel: '',
    totalIncomeStr: '',
    totalExpenseStr: '',
    balanceStr: '',
    balanceClass: '',
    isEmpty: false,
    isFirstLoad: true,
    // Batch select
    selectMode: false,
    selectedIds: {},
    selectedCount: 0
  },

  onLoad(options) {
    const bookId = Number(options.bookId);
    const book = storage.getBookById(bookId);
    this.setData({
      bookId,
      bookName: book ? book.name : '账单'
    });
    if (book) {
      wx.setNavigationBarTitle({ title: book.name });
    }
  },

  onShow() {
    this.refreshAll();
  },

  refreshAll() {
    const { bookId } = this.data;
    const allBills = storage.getBillsByBook(bookId);
    const now = new Date();
    const monthLabel = `${now.getFullYear()}/${now.getMonth() + 1}`;
    const stats = calculateMonthlyStats(allBills, now.getFullYear(), now.getMonth() + 1);

    allBills.forEach(b => {
      b.amountStr = (b.type === 0 ? '-' : '+') + '¥' + b.amount.toFixed(2);
      b.typeClass = b.type === 0 ? 'expense' : 'income';
    });

    const balance = stats.totalIncome - stats.totalExpense;
    const displayedCount = Math.min(PAGE_SIZE, allBills.length);

    this.setData({
      bills: allBills,
      displayedCount,
      hasMore: displayedCount < allBills.length,
      monthLabel,
      totalIncomeStr: formatAmount(stats.totalIncome, 1),
      totalExpenseStr: formatAmount(stats.totalExpense, 0),
      balanceStr: formatAmount(balance),
      balanceClass: balance >= 0 ? 'income' : 'expense',
      isEmpty: allBills.length === 0,
      isFirstLoad: false,
      selectMode: false,
      selectedIds: {},
      selectedCount: 0
    });
  },

  loadMore() {
    const { bills, displayedCount } = this.data;
    const next = displayedCount + PAGE_SIZE;
    const hasMore = next < bills.length;
    this.setData({
      displayedCount: hasMore ? next : bills.length,
      hasMore
    });
  },

  // --- Batch select ---

  onToggleSelectMode() {
    if (this.data.selectMode) {
      this.setData({ selectMode: false, selectedIds: {}, selectedCount: 0 });
    } else {
      this.setData({ selectMode: true, selectedIds: {}, selectedCount: 0 });
    }
  },

  onItemTap(e) {
    if (this.data.selectMode) {
      const { id } = e.currentTarget.dataset;
      const selectedIds = { ...this.data.selectedIds };
      if (selectedIds[id]) delete selectedIds[id];
      else selectedIds[id] = true;
      this.setData({ selectedIds, selectedCount: Object.keys(selectedIds).length });
    }
  },

  onBatchDelete() {
    const count = this.data.selectedCount;
    if (count === 0) return;
    wx.showModal({
      title: 'Delete selected?',
      content: `${count} records will be permanently deleted.`,
      confirmText: 'Delete',
      confirmColor: '#E74C3C',
      success: (res) => {
        if (res.confirm) {
          Object.keys(this.data.selectedIds).map(Number).forEach(id => storage.deleteBill(id));
          wx.showToast({ title: `Deleted ${count} records`, icon: 'success' });
          this.refreshAll();
        }
      }
    });
  },

  // --- Single item ---

  onAddTap() {
    wx.navigateTo({ url: `/pages/add/add?bookId=${this.data.bookId}` });
  },

  onSearchTap() {
    wx.navigateTo({ url: `/pages/search/search` });
  },

  onLongPress(e) {
    if (this.data.selectMode) return;
    const { id } = e.currentTarget.dataset;
    const bill = storage.getBillById(id);
    if (!bill) return;
    wx.showActionSheet({
      itemList: ['Edit', 'Delete'],
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.navigateTo({ url: `/pages/add/add?bookId=${this.data.bookId}&id=${id}` });
        } else if (res.tapIndex === 1) {
          this.confirmDelete(id, bill);
        }
      }
    });
  },

  confirmDelete(id, bill) {
    wx.showModal({
      title: 'Delete this record?',
      content: `${bill.category} ${bill.amountStr}`,
      confirmColor: '#E74C3C',
      success: (res) => {
        if (res.confirm) {
          storage.deleteBill(id);
          wx.showToast({ title: 'Deleted', icon: 'success', duration: 1500 });
          this.refreshAll();
        }
      }
    });
  }
});
