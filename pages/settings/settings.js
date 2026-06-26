const storage = require('../../utils/storage');
const { generateCSV } = require('../../utils/util');

Page({
  data: {
    expenseCategories: [],
    incomeCategories: [],
    favoriteExpenseTags: [],
    favoriteIncomeTags: [],
    totalRecords: 0,
    editingCategory: null,
    editValue: '',
    activeTab: 'categories' // 'categories' | 'favorites'
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const cats = storage.getCategories();
    const favs = storage.getFavoriteTags();
    const bills = storage.getBills();
    this.setData({
      expenseCategories: [...cats.expense],
      incomeCategories: [...cats.income],
      favoriteExpenseTags: [...(favs.expense || [])],
      favoriteIncomeTags: [...(favs.income || [])],
      totalRecords: bills.length
    });
  },

  // --- Category management ---
  onEditCategory(e) {
    const { type, name } = e.currentTarget.dataset;
    this.setData({ editingCategory: { type, oldName: name }, editValue: name });
  },

  onEditInput(e) {
    this.setData({ editValue: e.detail.value });
  },

  onEditSave() {
    const { editingCategory, editValue } = this.data;
    if (!editingCategory || !editValue.trim()) return;
    const cats = storage.getCategories();
    const key = editingCategory.type === 'expense' ? 'expense' : 'income';
    const idx = cats[key].indexOf(editingCategory.oldName);
    if (idx !== -1) cats[key][idx] = editValue.trim();
    storage.saveCategories(cats);
    this.setData({ editingCategory: null, editValue: '' });
    this.refresh();
  },

  onEditCancel() {
    this.setData({ editingCategory: null, editValue: '' });
  },

  onDeleteCategory(e) {
    const { type, name } = e.currentTarget.dataset;
    wx.showModal({
      title: 'Delete category?',
      content: `"${name}" will be removed. Existing bills keep their category text.`,
      confirmColor: '#E74C3C',
      success: (res) => {
        if (res.confirm) {
          const cats = storage.getCategories();
          const key = type === 'expense' ? 'expense' : 'income';
          cats[key] = cats[key].filter(c => c !== name);
          storage.saveCategories(cats);
          // Also remove from favorites
          const favs = storage.getFavoriteTags();
          favs[key] = favs[key].filter(c => c !== name);
          storage.saveFavoriteTags(favs);
          this.refresh();
        }
      }
    });
  },

  onAddCategory(e) {
    const { type } = e.currentTarget.dataset;
    const cats = storage.getCategories();
    const key = type === 'expense' ? 'expense' : 'income';
    const newName = `New ${type === 'expense' ? 'Expense' : 'Income'}`;
    let name = newName;
    let i = 1;
    while (cats[key].includes(name)) { name = `${newName} ${++i}`; }
    cats[key].push(name);
    storage.saveCategories(cats);
    this.refresh();
  },

  // --- Favorite tag management ---
  onRemoveFavorite(e) {
    const { type, name } = e.currentTarget.dataset;
    const favs = storage.getFavoriteTags();
    const key = type === 'expense' ? 'expense' : 'income';
    favs[key] = favs[key].filter(t => t !== name);
    storage.saveFavoriteTags(favs);
    this.refresh();
  },

  onAddFavorite(e) {
    const { type } = e.currentTarget.dataset;
    const cats = storage.getCategories();
    const favs = storage.getFavoriteTags();
    const key = type === 'expense' ? 'expense' : 'income';
    const available = cats[key].filter(c => !favs[key].includes(c));
    if (available.length === 0) {
      wx.showToast({ title: 'No more categories to add', icon: 'none' });
      return;
    }
    wx.showActionSheet({
      itemList: available,
      success: (res) => {
        favs[key].push(available[res.tapIndex]);
        storage.saveFavoriteTags(favs);
        this.refresh();
      }
    });
  },

  onSwitchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
  },

  // --- Export ---
  onExport() {
    const bills = storage.getBillsSorted();
    if (bills.length === 0) {
      wx.showToast({ title: 'No records to export', icon: 'none' });
      return;
    }
    const csv = generateCSV(bills);
    const fs = wx.getFileSystemManager();
    const fileName = `bills_export_${Date.now()}.csv`;
    const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;
    fs.writeFile({
      filePath, data: csv, encoding: 'utf8',
      success: () => {
        wx.showModal({
          title: 'Export successful',
          content: `File saved:\n${fileName}`,
          confirmText: 'Share',
          success: (res) => {
            if (res.confirm) {
              wx.shareFileMessage({ filePath, fileName });
            }
          }
        });
      },
      fail: (err) => {
        wx.showToast({ title: 'Export failed: ' + err.errMsg, icon: 'none' });
      }
    });
  }
});
