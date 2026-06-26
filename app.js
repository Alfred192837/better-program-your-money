const storage = require('./utils/storage');

App({
  onLaunch() {
    // Init categories
    const categories = wx.getStorageSync('categories');
    if (!categories) {
      wx.setStorageSync('categories', storage.getDefaultCategories());
    }

    // Init bills array
    if (!wx.getStorageSync('bills')) {
      wx.setStorageSync('bills', []);
    }

    // Init favorite tags
    if (!wx.getStorageSync('favoriteTags')) {
      wx.setStorageSync('favoriteTags', { expense: [], income: [] });
    }

    // Ensure at least one book exists (migrates old bills too)
    storage.ensureDefaultBook();
  }
});
