'use client';

import React, { useState, useEffect } from 'react';
import { Book, Package, LogOut, Plus, Edit2, Trash2, Save, X, Search } from 'lucide-react';

// This would connect to your backend API in production
const API_URL = 'http://localhost:3001/api';

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [activeTab, setActiveTab] = useState('books'); // books, orders
  const [books, setBooks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editingBook, setEditingBook] = useState(null);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // New book form state
  const [newBook, setNewBook] = useState({
    isbn: '',
    title: '',
    author: '',
    description: '',
    price: '',
    stock: '',
    image_url: ''
  });

  // Load sample data (in production, this would fetch from your API)
  useEffect(() => {
    if (isLoggedIn) {
      loadBooks();
      loadOrders();
    }
  }, [isLoggedIn]);

  const loadBooks = () => {
    // Sample data - replace with API call
    setBooks([
      {
        isbn: '978-0-06-112008-4',
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        description: 'A classic of modern American literature',
        price: 24.99,
        stock: 15,
        image_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400'
      },
      {
        isbn: '978-0-14-028329-3',
        title: '1984',
        author: 'George Orwell',
        description: 'A dystopian social science fiction novel',
        price: 19.99,
        stock: 23,
        image_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'
      }
    ]);
  };

  const loadOrders = () => {
    // Sample data - replace with API call
    setOrders([
      {
        order_id: 'ORD-12345678',
        customer_name: 'John Smith',
        customer_email: 'john@example.com',
        customer_address: '123 Main St',
        customer_city: 'New York',
        customer_country: 'USA',
        total: 67.47,
        status: 'pending',
        created_at: '2025-11-07T10:30:00',
        items: [
          { title: 'To Kill a Mockingbird', quantity: 2, price: 24.99 },
          { title: '1984', quantity: 1, price: 19.99 }
        ]
      },
      {
        order_id: 'ORD-12345679',
        customer_name: 'Jane Doe',
        customer_email: 'jane@example.com',
        customer_address: '456 Oak Ave',
        customer_city: 'Los Angeles',
        customer_country: 'USA',
        total: 42.49,
        status: 'processing',
        created_at: '2025-11-06T15:20:00',
        items: [
          { title: '1984', quantity: 2, price: 19.99 }
        ]
      }
    ]);
  };

  const handleLogin = () => {
    // Simple authentication - in production, this should call your backend API
    if (username === 'admin' && password === 'admin123') {
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Invalid username or password');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
  };

  const handleAddBook = () => {
    if (!newBook.isbn || !newBook.title || !newBook.author || !newBook.price) {
      alert('Please fill in all required fields (ISBN, Title, Author, Price)');
      return;
    }

    // In production, this would POST to your API
    setBooks([...books, {
      ...newBook,
      price: parseFloat(newBook.price),
      stock: parseInt(newBook.stock) || 0
    }]);

    // Reset form
    setNewBook({
      isbn: '',
      title: '',
      author: '',
      description: '',
      price: '',
      stock: '',
      image_url: ''
    });
    setIsAddingBook(false);
  };

  const handleEditBook = (isbn) => {
    const book = books.find(b => b.isbn === isbn);
    setEditingBook({ ...book });
  };

  const handleSaveEdit = () => {
    // In production, this would PUT to your API
    setBooks(books.map(b => b.isbn === editingBook.isbn ? editingBook : b));
    setEditingBook(null);
  };

  const handleDeleteBook = (isbn) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      // In production, this would DELETE to your API
      setBooks(books.filter(b => b.isbn !== isbn));
    }
  };

  const handleUpdateOrderStatus = (orderId, newStatus) => {
    // In production, this would PATCH to your API
    setOrders(orders.map(o => 
      o.order_id === orderId ? { ...o, status: newStatus } : o
    ));
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.isbn.includes(searchTerm)
  );

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'sent': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md border border-black p-8">
          <div className="flex items-center gap-3 mb-8">
            <Book className="w-8 h-8" />
            <h1 className="text-2xl font-serif">Admin Login</h1>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-black"
                placeholder="admin"
              />
            </div>
            
            <div>
              <label className="block text-sm mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-black"
                placeholder="admin123"
              />
            </div>

            {loginError && (
              <p className="text-red-600 text-sm">{loginError}</p>
            )}

            <button
              onClick={handleLogin}
              className="w-full py-3 bg-black text-white hover:bg-gray-800 transition"
            >
              Login
            </button>

            <p className="text-xs text-gray-500 mt-4">
              Demo credentials: admin / admin123
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-300 py-4 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Book className="w-6 h-6" />
            <h1 className="text-xl font-serif">Admin Dashboard</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 border border-black hover:bg-gray-50 transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('books')}
              className={`py-4 border-b-2 transition ${
                activeTab === 'books'
                  ? 'border-black font-semibold'
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Book className="w-4 h-4" />
                Books ({books.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-4 border-b-2 transition ${
                activeTab === 'orders'
                  ? 'border-black font-semibold'
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Orders ({orders.length})
              </div>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Books Management */}
        {activeTab === 'books' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-serif">Manage Books</h2>
              <button
                onClick={() => setIsAddingBook(true)}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white hover:bg-gray-800 transition"
              >
                <Plus className="w-4 h-4" />
                Add New Book
              </button>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title, author, or ISBN..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:outline-none focus:border-black"
                />
              </div>
            </div>

            {/* Add Book Form */}
            {isAddingBook && (
              <div className="border border-black p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-serif">Add New Book</h3>
                  <button onClick={() => setIsAddingBook(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2">ISBN *</label>
                    <input
                      type="text"
                      value={newBook.isbn}
                      onChange={(e) => setNewBook({...newBook, isbn: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                      placeholder="978-0-00-000000-0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-2">Title *</label>
                    <input
                      type="text"
                      value={newBook.title}
                      onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-2">Author *</label>
                    <input
                      type="text"
                      value={newBook.author}
                      onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-2">Price ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newBook.price}
                      onChange={(e) => setNewBook({...newBook, price: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-2">Stock Quantity</label>
                    <input
                      type="number"
                      value={newBook.stock}
                      onChange={(e) => setNewBook({...newBook, stock: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-2">Image URL</label>
                    <input
                      type="text"
                      value={newBook.image_url}
                      onChange={(e) => setNewBook({...newBook, image_url: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                      placeholder="https://..."
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm mb-2">Description</label>
                    <textarea
                      value={newBook.description}
                      onChange={(e) => setNewBook({...newBook, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                      rows="3"
                    />
                  </div>
                </div>
                
                <button
                  onClick={handleAddBook}
                  className="mt-4 px-6 py-2 bg-black text-white hover:bg-gray-800 transition"
                >
                  Add Book
                </button>
              </div>
            )}

            {/* Books List */}
            <div className="space-y-4">
              {filteredBooks.map(book => (
                <div key={book.isbn} className="border border-gray-300 p-4">
                  {editingBook && editingBook.isbn === book.isbn ? (
                    // Edit Mode
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm mb-1">ISBN</label>
                        <input
                          type="text"
                          value={editingBook.isbn}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 bg-gray-50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm mb-1">Title</label>
                        <input
                          type="text"
                          value={editingBook.title}
                          onChange={(e) => setEditingBook({...editingBook, title: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm mb-1">Author</label>
                        <input
                          type="text"
                          value={editingBook.author}
                          onChange={(e) => setEditingBook({...editingBook, author: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm mb-1">Price</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editingBook.price}
                          onChange={(e) => setEditingBook({...editingBook, price: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm mb-1">Stock</label>
                        <input
                          type="number"
                          value={editingBook.stock}
                          onChange={(e) => setEditingBook({...editingBook, stock: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm mb-1">Image URL</label>
                        <input
                          type="text"
                          value={editingBook.image_url}
                          onChange={(e) => setEditingBook({...editingBook, image_url: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <label className="block text-sm mb-1">Description</label>
                        <textarea
                          value={editingBook.description}
                          onChange={(e) => setEditingBook({...editingBook, description: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                          rows="2"
                        />
                      </div>
                      
                      <div className="col-span-2 flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="flex items-center gap-2 px-4 py-2 bg-black text-white hover:bg-gray-800"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={() => setEditingBook(null)}
                          className="px-4 py-2 border border-black hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex gap-4">
                      {book.image_url && (
                        <img src={book.image_url} alt={book.title} className="w-20 h-28 object-cover" />
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-serif mb-1">{book.title}</h3>
                        <p className="text-gray-600 mb-1">{book.author}</p>
                        <p className="text-sm text-gray-500 mb-2">ISBN: {book.isbn}</p>
                        <p className="text-sm text-gray-600 mb-2">{book.description}</p>
                        <div className="flex gap-4 text-sm">
                          <span className="font-semibold">Price: ${book.price?.toFixed(2)}</span>
                          <span className={book.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                            Stock: {book.stock}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleEditBook(book.isbn)}
                          className="p-2 border border-gray-300 hover:bg-gray-50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBook(book.isbn)}
                          className="p-2 border border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders Management */}
        {activeTab === 'orders' && (
          <div>
            <h2 className="text-2xl font-serif mb-6">Manage Orders</h2>
            
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.order_id} className="border border-gray-300 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-serif mb-2">Order #{order.order_id}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-sm font-semibold ${getStatusColor(order.status)}`}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <h4 className="font-semibold mb-2">Customer Information</h4>
                      <p className="text-sm">{order.customer_name}</p>
                      <p className="text-sm text-gray-600">{order.customer_email}</p>
                      <p className="text-sm text-gray-600 mt-2">
                        {order.customer_address}<br />
                        {order.customer_city}<br />
                        {order.customer_country}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Order Items</h4>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm mb-1">
                          <span>{item.title} × {item.quantity}</span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="border-t border-gray-300 mt-2 pt-2 flex justify-between font-bold">
                        <span>Total:</span>
                        <span>${order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateOrderStatus(order.order_id, 'pending')}
                      className={`px-4 py-2 text-sm border transition ${
                        order.status === 'pending'
                          ? 'bg-yellow-100 border-yellow-300'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => handleUpdateOrderStatus(order.order_id, 'processing')}
                      className={`px-4 py-2 text-sm border transition ${
                        order.status === 'processing'
                          ? 'bg-blue-100 border-blue-300'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Processing
                    </button>
                    <button
                      onClick={() => handleUpdateOrderStatus(order.order_id, 'sent')}
                      className={`px-4 py-2 text-sm border transition ${
                        order.status === 'sent'
                          ? 'bg-purple-100 border-purple-300'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Sent
                    </button>
                    <button
                      onClick={() => handleUpdateOrderStatus(order.order_id, 'completed')}
                      className={`px-4 py-2 text-sm border transition ${
                        order.status === 'completed'
                          ? 'bg-green-100 border-green-300'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Completed
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}