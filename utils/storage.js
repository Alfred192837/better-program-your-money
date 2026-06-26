const BILLS_KEY = 'bills';
const CATEGORIES_KEY = 'categories';
const BOOKS_KEY = 'books';
const FAVORITES_KEY = 'favoriteTags';

// --- Books ---

function getBooks() {
  return wx.getStorageSync(BOOKS_KEY) || [];
}

function saveBooks(books) {
  wx.setStorageSync(BOOKS_KEY, books);
}

function addBook(name) {
  const books = getBooks();
  const book = { id: Date.now(), name: name.trim(), createdAt: Date.now() };
  books.unshift(book);
  saveBooks(books);
  return book;
}

function updateBook(id, name) {
  const books = getBooks().map(b => b.id === id ? { ...b, name: name.trim() } : b);
  saveBooks(books);
}

function deleteBook(id) {
  const books = getBooks().filter(b => b.id !== id);
  saveBooks(books);
  // Also delete all bills in this book
  const bills = getBills().filter(b => b.bookId !== id);
  wx.setStorageSync(BILLS_KEY, bills);
}

function getBookById(id) {
  return getBooks().find(b => b.id === id) || null;
}

function ensureDefaultBook() {
  const books = getBooks();
  if (books.length === 0) {
    const book = { id: 1, name: '日常', createdAt: Date.now() };
    saveBooks([book]);
    // Migrate existing bills without bookId to this book
    const bills = getBills();
    if (bills.length > 0) {
      bills.forEach(b => { if (!b.bookId) b.bookId = 1; });
      wx.setStorageSync(BILLS_KEY, bills);
    }
    return book;
  }
  return books[0];
}

// --- Bills ---

function getBills() {
  return wx.getStorageSync(BILLS_KEY) || [];
}

function saveBills(bills) {
  wx.setStorageSync(BILLS_KEY, bills);
}

function addBill(bill) {
  const bills = getBills();
  bills.unshift(bill);
  saveBills(bills);
}

function updateBill(id, updates) {
  const bills = getBills();
  const index = bills.findIndex(b => b.id === id);
  if (index !== -1) {
    bills[index] = { ...bills[index], ...updates };
    saveBills(bills);
  }
}

function deleteBill(id) {
  const bills = getBills().filter(b => b.id !== id);
  saveBills(bills);
}

function getBillById(id) {
  return getBills().find(b => b.id === id) || null;
}

function getBillsByBook(bookId) {
  return getBills()
    .filter(b => b.bookId === bookId)
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.createdAt - a.createdAt;
    });
}

function getBillsSorted() {
  const bills = getBills();
  bills.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.createdAt - a.createdAt;
  });
  return bills;
}

function clearBills() {
  wx.setStorageSync(BILLS_KEY, []);
}

// --- Categories ---

function getCategories() {
  return wx.getStorageSync(CATEGORIES_KEY) || { expense: [], income: [] };
}

function saveCategories(categories) {
  wx.setStorageSync(CATEGORIES_KEY, categories);
}

function getDefaultCategories() {
  return {
    expense: ['Food', 'Transportation', 'Shopping', 'Entertainment', 'Housing', 'Healthcare', 'Education', 'Communication', 'Gifts', 'Other'],
    income: ['Salary', 'Bonus', 'Freelance', 'Red Packet', 'Investment', 'Other']
  };
}

// --- Favorite Tags ---

function getFavoriteTags() {
  return wx.getStorageSync(FAVORITES_KEY) || { expense: [], income: [] };
}

function saveFavoriteTags(tags) {
  wx.setStorageSync(FAVORITES_KEY, tags);
}

module.exports = {
  // Books
  getBooks,
  addBook,
  updateBook,
  deleteBook,
  getBookById,
  ensureDefaultBook,
  // Bills
  getBills,
  addBill,
  updateBill,
  deleteBill,
  getBillById,
  getBillsByBook,
  getBillsSorted,
  clearBills,
  // Categories
  getCategories,
  saveCategories,
  getDefaultCategories,
  // Favorites
  getFavoriteTags,
  saveFavoriteTags
};
