const storage = require('../../utils/storage');
const { formatDate, parseAndValidateAmount } = require('../../utils/util');

Page({
  data: {
    isEdit: false,
    editId: null,
    bookId: null,
    amount: '',
    type: 0,
    category: '',
    date: formatDate(),
    note: '',
    amountError: '',
    saving: false,
    // Favorite tags for quick select
    favoriteTags: [],
    allCategoryNames: []
  },

  onLoad(options) {
    const now = new Date();
    this.setData({ date: formatDate(now), bookId: Number(options.bookId) });

    if (options.id) {
      const bill = storage.getBillById(Number(options.id));
      if (bill) {
        this.setData({
          isEdit: true,
          editId: bill.id,
          bookId: bill.bookId,
          amount: String(bill.amount),
          type: bill.type,
          category: bill.category,
          date: bill.date,
          note: bill.note || ''
        });
        wx.setNavigationBarTitle({ title: '编辑账单' });
      }
    }
  },

  onShow() {
    this.refreshTags();
  },

  refreshTags() {
    const favs = storage.getFavoriteTags();
    // Show favorites for current type, fall back to all categories
    const key = this.data.type === 0 ? 'expense' : 'income';
    const favTags = favs[key] || [];

    const cats = storage.getCategories();
    const allNames = [...cats.expense, ...cats.income].filter(
      (v, i, arr) => arr.indexOf(v) === i
    );

    this.setData({ favoriteTags: favTags, allCategoryNames: allNames });
  },

  onAmountInput(e) {
    this.setData({ amount: e.detail.value, amountError: '' });
  },

  onCategoryInput(e) {
    this.setData({ category: e.detail.value || e.currentTarget.dataset.name || '' });
  },

  onCategoryBlur() {
    const { category, type } = this.data;
    if (!category || !category.trim()) return;

    // Auto-save to categories list
    const cats = storage.getCategories();
    const typeKey = type === 0 ? 'expense' : 'income';
    if (!cats[typeKey].includes(category)) {
      cats[typeKey].push(category);
      storage.saveCategories(cats);
    }

    // Add to favorites
    const favs = storage.getFavoriteTags();
    if (!favs[typeKey].includes(category)) {
      favs[typeKey].unshift(category);
      storage.saveFavoriteTags(favs);
    }

    this.refreshTags();
  },

  onTypeChange(e) {
    const type = Number(e.currentTarget.dataset.value);
    this.setData({ type }, () => this.refreshTags());
  },

  onDateChange(e) {
    this.setData({ date: e.detail.value });
  },

  onNoteInput(e) {
    this.setData({ note: e.detail.value });
  },

  onSave() {
    const { amount, type, category, date, note, isEdit, editId, bookId } = this.data;
    const result = parseAndValidateAmount(amount);

    if (!result.valid) {
      this.setData({ amountError: result.error });
      return;
    }

    const billData = {
      bookId,
      type,
      amount: result.value,
      category: category.trim() || 'Other',
      date,
      note: note.trim(),
    };

    this.setData({ saving: true });

    if (isEdit) {
      storage.updateBill(editId, billData);
      wx.showToast({ title: 'Updated', icon: 'success', duration: 1500 });
    } else {
      storage.addBill({
        ...billData,
        id: Date.now(),
        createdAt: Date.now()
      });
      wx.showToast({ title: 'Saved', icon: 'success', duration: 1500 });
    }

    setTimeout(() => {
      wx.navigateBack();
    }, 800);
  }
});
