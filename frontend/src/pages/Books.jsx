import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';

export default function Books() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalCopies, setTotalCopies] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadBooks(query = '') {
    setLoading(true);
    setError('');
    try {
      const endpoint = query ? `/api/books/?q=${encodeURIComponent(query)}` : '/api/books/';
      const data = await apiFetch(endpoint);
      setBooks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBooks();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await apiFetch(`/api/books/${editingId}/`, {
          method: 'PATCH',
          body: JSON.stringify({ title, author, total_copies: Number(totalCopies) })
        });
      } else {
        await apiFetch('/api/books/', {
          method: 'POST',
          body: JSON.stringify({ title, author, total_copies: Number(totalCopies) })
        });
      }
      resetForm();
      loadBooks(search);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this book?')) return;
    setError('');
    try {
      await apiFetch(`/api/books/${id}/`, { method: 'DELETE' });
      loadBooks(search);
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(book) {
    setEditingId(book.id);
    setTitle(book.title);
    setAuthor(book.author);
    setTotalCopies(book.total_copies);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setTitle('');
    setAuthor('');
    setTotalCopies(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Book Catalog</h2>
          <p className="text-sm text-slate-500">Manage book titles, authors, and track active copy availability</p>
        </div>
        <span className="self-start sm:self-auto px-3 py-1 bg-sky-100 text-sky-800 text-xs font-semibold rounded-full">
          {books.length} {books.length === 1 ? 'Book' : 'Books'} Registered
        </span>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
          {error}
        </div>
      )}

      {loading && (
        <div className="p-3.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 text-sm font-medium">
          Loading book catalog...
        </div>
      )}

      {/* Add / Edit Form Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <span>{editingId ? '✏️ Edit Book' : '➕ Add New Book'}</span>
        </h3>
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5">
            <input
              type="text"
              placeholder="Book Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>
          <div className="sm:col-span-4">
            <input
              type="text"
              placeholder="Author Name"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>
          <div className="sm:col-span-3 flex items-center gap-2">
            <input
              type="number"
              placeholder="Copies"
              min="1"
              value={totalCopies}
              onChange={(e) => setTotalCopies(e.target.value)}
              className="w-24 px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
            <button
              type="submit"
              className="flex-1 py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
            >
              {editingId ? 'Update' : 'Add'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Search Input Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search catalog by title or author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') loadBooks(search); }}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
          />
        </div>
        <button
          type="button"
          onClick={() => loadBooks(search)}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
        >
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(''); loadBooks(''); }}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium rounded-lg transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Catalog Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 w-16">ID</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Author</th>
                <th className="py-3 px-4 text-center">Total Copies</th>
                <th className="py-3 px-4 text-center">Available</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {books.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No books found in catalog.
                  </td>
                </tr>
              ) : (
                books.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-slate-400">#{b.id}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{b.title}</td>
                    <td className="py-3 px-4 text-slate-600">{b.author}</td>
                    <td className="py-3 px-4 text-center font-medium">{b.total_copies}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          b.available_copies > 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {b.available_copies} available
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => startEdit(b)}
                        className="px-2.5 py-1 text-xs font-medium text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 rounded-md transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(b.id)}
                        className="px-2.5 py-1 text-xs font-medium text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
