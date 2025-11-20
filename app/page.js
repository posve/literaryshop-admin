'use client';


import React, { useState, useEffect } from 'react';
import { 
  Book, Package, LogOut, Plus, Edit2, Trash2, Save, X, Search, 
  AlertCircle, TrendingUp, DollarSign, ShoppingBag, Clock,
  CheckCircle, XCircle, Filter, Download, Eye, BarChart3
} from 'lucide-react';
import ImageManager from './image-manager';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [books, setBooks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editingBook, setEditingBook] = useState(null);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBookForImages, setSelectedBookForImages] = useState(null);

  const [newBook, setNewBook] = useState({
    isbn: '',
    title: '',
    author: '',
    description: '',
    price: '',
    stock: '',
    image_url: '',
    category: ''
  });

  useEffect(() => {
    if (isLoggedIn) {
      loadBooks();
      loadOrders();
    }
  }, [isLoggedIn]);

  const handleLogin = async () => {
    if (!username || !password) {
      setLoginError('Please enter username and password');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok && data.success && data.token) {
        setIsLoggedIn(true);
        setToken(data.token);
        setLoginError('');
        // Clear password after successful login
        setPassword('');
      } else {
        setLoginError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setLoginError('Failed to connect to server');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setToken(null);
    setUsername('');
    setPassword('');
    setLoginError('');
  };

  // Helper function for authenticated API calls
  const fetchWithToken = (url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    });
  };

  const loadBooks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/books`);
      if (!response.ok) throw new Error('Failed to load books');
      const data = await response.json();

      // Fetch primary images for each book
      const booksWithImages = await Promise.all(
        data.map(async (book) => {
          try {
            const imagesResponse = await fetch(`${API_URL}/books/${book.isbn}/images`);
            if (imagesResponse.ok) {
              const images = await imagesResponse.json();
              // Find primary image, or use first image, or fall back to image_url
              const primaryImage = images.find(img => img.is_primary);
              const firstImage = images.length > 0 ? images[0] : null;
              const displayImage = primaryImage?.scaleway_url || firstImage?.scaleway_url || book.image_url;

              return {
                ...book,
                primary_image_url: displayImage,
                has_scaleway_images: images.length > 0
              };
            }
            return book;
          } catch (err) {
            // If image fetch fails, fall back to original image_url
            return book;
          }
        })
      );

      setBooks(booksWithImages);
      setError(null);
    } catch (err) {
      setError('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/orders`);
      if (!response.ok) throw new Error('Failed to load orders');
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError('Failed to load orders');
    }
  };

  const validateBookData = (book) => {
    if (!book.isbn || book.isbn.length < 10) {
      alert('Please enter a valid ISBN');
      return false;
    }
    if (!book.title || !book.author || !book.price) {
      alert('Title, author, and price are required');
      return false;
    }
    if (isNaN(parseFloat(book.price)) || parseFloat(book.price) <= 0) {
      alert('Please enter a valid price');
      return false;
    }
    return true;
  };

  const handleAddBook = async () => {
    if (!validateBookData(newBook)) return;

    try {
      const response = await fetchWithToken(`${API_URL}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newBook,
          price: parseFloat(newBook.price),
          stock: parseInt(newBook.stock) || 0
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add book');
      }

      await loadBooks();
      setNewBook({
        isbn: '',
        title: '',
        author: '',
        description: '',
        price: '',
        stock: '',
        image_url: '',
        category: ''
      });
      setIsAddingBook(false);
      alert('Book added successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveEdit = async () => {
    if (!validateBookData(editingBook)) return;

    try {
      const response = await fetchWithToken(`${API_URL}/books/${editingBook.isbn}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingBook)
      });

      if (!response.ok) throw new Error('Failed to update book');

      await loadBooks();
      setEditingBook(null);
      alert('Book updated successfully!');
    } catch (err) {
      alert('Failed to update book');
    }
  };

  const handleDeleteBook = async (isbn) => {
    if (!window.confirm('Delete this book? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetchWithToken(`${API_URL}/books/${isbn}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete');

      await loadBooks();
      alert('Book deleted successfully');
    } catch (err) {
      alert('Failed to delete book');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetchWithToken(`${API_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update');
      await loadOrders();
    } catch (err) {
      alert('Failed to update order status');
    }
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.isbn.includes(searchTerm)
  );

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(o => o.status === statusFilter);

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sent': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Calculate dashboard stats
  const stats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    totalRevenue: orders.reduce((sum, o) => sum + Number(o.total), 0),
    totalBooks: books.length,
    lowStock: books.filter(b => b.stock < 5).length
  };

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-8">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center">
                <Book className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Admin Portal</h1>
                <p className="text-sm text-slate-500">Management System</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  autoComplete="username"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  autoComplete="current-password"
                />
              </div>

              {loginError && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                onClick={handleLogin}
                className="w-full py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-semibold"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                <Book className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Rare & Fine Books</h1>
                <p className="text-xs text-slate-500">Management System</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'books', label: 'Books', icon: Book },
              { id: 'orders', label: 'Orders', icon: Package }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 transition font-medium ${
                    activeTab === tab.id
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Dashboard Overview</h2>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-blue-600" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-slate-500 text-sm font-medium">Total Orders</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalOrders}</p>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
                <p className="text-slate-500 text-sm font-medium">Pending Orders</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.pendingOrders}</p>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-slate-500 text-sm font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">${stats.totalRevenue.toFixed(2)}</p>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Book className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-slate-500 text-sm font-medium">Total Books</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalBooks}</p>
                {stats.lowStock > 0 && (
                  <p className="text-xs text-amber-600 mt-2">⚠️ {stats.lowStock} low stock</p>
                )}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Recent Orders</h3>
              </div>
              <div className="p-6">
                {orders.slice(0, 5).map(order => (
                  <div key={order.order_id} className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="font-medium text-slate-900">Order #{order.order_id}</p>
                      <p className="text-sm text-slate-500">{order.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">${Number(order.total).toFixed(2)}</p>
                      <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Books Tab */}
        {activeTab === 'books' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Book Inventory</h2>
              <button
                onClick={() => setIsAddingBook(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium"
              >
                <Plus className="w-4 h-4" />
                Add New Book
              </button>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title, author, or ISBN..."
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
            </div>

            {/* Add Book Modal */}
            {isAddingBook && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-900">Add New Book</h3>
                    <button onClick={() => setIsAddingBook(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">ISBN *</label>
                        <input
                          type="text"
                          value={newBook.isbn}
                          onChange={(e) => setNewBook({...newBook, isbn: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                          placeholder="978-0-00-000000-0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Title *</label>
                        <input
                          type="text"
                          value={newBook.title}
                          onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Author *</label>
                        <input
                          type="text"
                          value={newBook.author}
                          onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Price ($) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newBook.price}
                          onChange={(e) => setNewBook({...newBook, price: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Stock Quantity</label>
                        <input
                          type="number"
                          min="0"
                          value={newBook.stock}
                          onChange={(e) => setNewBook({...newBook, stock: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                        <input
                          type="text"
                          value={newBook.category}
                          onChange={(e) => setNewBook({...newBook, category: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                          placeholder="Fiction, Non-Fiction, etc."
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Image URL</label>
                        <input
                          type="url"
                          value={newBook.image_url}
                          onChange={(e) => setNewBook({...newBook, image_url: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                          placeholder="https://..."
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                        <textarea
                          value={newBook.description}
                          onChange={(e) => setNewBook({...newBook, description: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                          rows="3"
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={handleAddBook}
                      className="w-full py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-semibold"
                    >
                      Add Book
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Books List */}
            <div className="space-y-4">
              {filteredBooks.map(book => (
                <div key={book.isbn} className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
                  {editingBook && editingBook.isbn === book.isbn ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">ISBN</label>
                          <input
                            type="text"
                            value={editingBook.isbn}
                            disabled
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                          <input
                            type="text"
                            value={editingBook.title}
                            onChange={(e) => setEditingBook({...editingBook, title: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Author</label>
                          <input
                            type="text"
                            value={editingBook.author}
                            onChange={(e) => setEditingBook({...editingBook, author: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Price</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editingBook.price}
                            onChange={(e) => setEditingBook({...editingBook, price: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Stock</label>
                          <input
                            type="number"
                            min="0"
                            value={editingBook.stock}
                            onChange={(e) => setEditingBook({...editingBook, stock: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                          <input
                            type="text"
                            value={editingBook.category}
                            onChange={(e) => setEditingBook({...editingBook, category: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
                          <input
                            type="url"
                            value={editingBook.image_url}
                            onChange={(e) => setEditingBook({...editingBook, image_url: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                          <textarea
                            value={editingBook.description}
                            onChange={(e) => setEditingBook({...editingBook, description: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                            rows="2"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
                        >
                          <Save className="w-4 h-4" />
                          Save Changes
                        </button>
                        <button
                          onClick={() => setEditingBook(null)}
                          className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-4">
                      {(book.primary_image_url || book.image_url) && (
                        <div className="relative">
                          <img
                            src={book.primary_image_url || book.image_url}
                            alt={book.title}
                            className="w-20 h-28 object-cover rounded-lg"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          {book.has_scaleway_images && (
                            <span className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">
                              ☁️
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">{book.title}</h3>
                            <p className="text-slate-600 mb-2">{book.author}</p>
                            <p className="text-sm text-slate-500 mb-2">ISBN: {book.isbn}</p>
                            {book.category && (
                              <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full">
                                {book.category}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedBookForImages(book)}
                              className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                              title="Manage Images"
                            >
                              📷 Images
                            </button>
                            <button
                              onClick={() => setEditingBook({...book})}
                              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteBook(book.isbn)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 mt-2 line-clamp-2">{book.description}</p>
                        <div className="flex gap-6 mt-3 text-sm">
                          <div>
                            <span className="text-slate-500">Price: </span>
                            <span className="font-semibold text-slate-900">${Number(book.price).toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Stock: </span>
                            <span className={`font-semibold ${book.stock < 5 ? 'text-amber-600' : 'text-green-600'}`}>
                              {book.stock}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Order Management</h2>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="sent">Sent</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
                <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">No orders found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map(order => (
                  <div key={order.order_id} className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-1">
                            Order #{order.order_id}
                          </h3>
                          <p className="text-sm text-slate-500">
                            {new Date(order.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(order.status)}`}>
                          {order.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2 text-sm">Customer Information</h4>
                          <div className="space-y-1 text-sm">
                            <p className="text-slate-900 font-medium">{order.customer_name}</p>
                            <p className="text-slate-600">{order.customer_email}</p>
                            <p className="text-slate-600 mt-2">
                              {order.customer_address}<br />
                              {order.customer_city}, {order.customer_postal_code}<br />
                              {order.customer_country}
                            </p>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2 text-sm">Order Items</h4>
                          <div className="space-y-2 mb-3">
                            {order.items && order.items.length > 0 ? (
                              order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span className="text-slate-700">{item.title} × {item.quantity}</span>
                                  <span className="font-medium text-slate-900">
                                    ${(Number(item.price) * item.quantity).toFixed(2)}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-slate-500">No items</p>
                            )}
                          </div>
                          <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-semibold">
                            <span className="text-slate-900">Total:</span>
                            <span className="text-slate-900">${Number(order.total).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-4">
                        <p className="text-xs text-slate-500 mb-3 font-medium">UPDATE STATUS:</p>
                        <div className="flex gap-2 flex-wrap">
                          {['pending', 'processing', 'sent', 'completed'].map(status => (
                            <button
                              key={status}
                              onClick={() => handleUpdateOrderStatus(order.order_id, status)}
                              className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${
                                order.status === status
                                  ? `${getStatusColor(status)} font-semibold`
                                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Image Manager Modal - Step 4 */}
      {selectedBookForImages && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                Manage Images - {selectedBookForImages.title}
              </h2>
              <button
                onClick={() => setSelectedBookForImages(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-4">
              <ImageManager
                isbn={selectedBookForImages.isbn}
                token={token}
                onImageUploadSuccess={(image) => {
                  console.log('Image uploaded:', image);
                  // Refresh books list to show updated image in inventory
                  loadBooks();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}