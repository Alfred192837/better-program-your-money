const storage = require('../../utils/storage');
const { formatAmount } = require('../../utils/util');

Page({
  data: {
    books: [],
    isEmpty: true,
    showCreate: false,
    newBookName: '',
    existingNames: [],
    // Batch select
    selectMode: false,
    selectedIds: {},
    selectedCount: 0
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const books = storage.getBooks();
    const allBills = storage.getBills();
    books.forEach(book => {
      const bookBills = allBills.filter(b => b.bookId === book.id);
      let income = 0, expense = 0;
      bookBills.forEach(b => {
        if (b.type === 1) income += b.amount;
        else expense += b.amount;
      });
      book.incomeStr = formatAmount(income, 1);
      book.expenseStr = formatAmount(expense, 0);
      book.billCount = bookBills.length;
    });

    const names = [...new Set(books.map(b => b.name))];
    this.setData({
      books,
      isEmpty: books.length === 0,
      existingNames: names,
      selectMode: false,
      selectedIds: {},
      selectedCount: 0
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

  onBookTap(e) {
    if (this.data.selectMode) {
      const { id } = e.currentTarget.dataset;
      const selectedIds = { ...this.data.selectedIds };
      if (selectedIds[id]) delete selectedIds[id];
      else selectedIds[id] = true;
      this.setData({ selectedIds, selectedCount: Object.keys(selectedIds).length });
    } else {
      wx.navigateTo({ url: `/pages/index/index?bookId=${e.currentTarget.dataset.id}` });
    }
  },

  onBatchDelete() {
    const count = this.data.selectedCount;
    if (count === 0) return;
    const ids = Object.keys(this.data.selectedIds).map(Number);
    const totalBills = storage.getBills().filter(b => ids.includes(b.bookId)).length;
    wx.showModal({
      title: 'Delete selected books?',
      content: `${count} books and all ${totalBills} records will be permanently deleted.`,
      confirmText: 'Delete',
      confirmColor: '#E74C3C',
      success: (res) => {
        if (res.confirm) {
          ids.forEach(id => storage.deleteBook(id));
          wx.showToast({ title: `Deleted ${count} books`, icon: 'success' });
          this.refresh();
        }
      }
    });
  },

  // --- Single item ---

  onBookLongPress(e) {
    if (this.data.selectMode) return;
    const { id, name } = e.currentTarget.dataset;
    wx.showActionSheet({
      itemList: ['Rename', 'Delete'],
      success: (res) => {
        if (res.tapIndex === 0) this.renameBook(id, name);
        else if (res.tapIndex === 1) this.confirmDeleteBook(id, name);
      }
    });
  },

  renameBook(id, oldName) {
    wx.showModal({
      title: 'Rename book',
      editable: true,
      placeholderText: 'Enter new name',
      content: oldName,
      success: (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          storage.updateBook(id, res.content.trim());
          this.refresh();
        }
      }
    });
  },

  confirmDeleteBook(id, name) {
    const billCount = storage.getBills().filter(b => b.bookId === id).length;
    wx.showModal({
      title: `Delete "${name}"?`,
      content: `All ${billCount} records in this book will be deleted.`,
      confirmColor: '#E74C3C',
      success: (res) => {
        if (res.confirm) {
          storage.deleteBook(id);
          this.refresh();
          wx.showToast({ title: 'Deleted', icon: 'success' });
        }
      }
    });
  },

  // --- Create book ---

  onShowCreate() {
    this.setData({ showCreate: true, newBookName: '' });
  },

  onCancelCreate() {
    this.setData({ showCreate: false, newBookName: '' });
  },

  onNameInput(e) {
    this.setData({ newBookName: e.detail.value });
  },

  onTagTap(e) {
    this.setData({ newBookName: e.currentTarget.dataset.name });
  },

  onConfirmCreate() {
    const name = this.data.newBookName.trim();
    if (!name) return;
    storage.addBook(name);
    this.setData({ showCreate: false, newBookName: '' });
    this.refresh();
    wx.showToast({ title: 'Created', icon: 'success' });
  },

  onAddTap() {
    this.onShowCreate();
  }
});
