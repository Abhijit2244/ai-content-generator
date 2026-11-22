import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api-client';
import { ContentItem, PaginatedResult } from '../../types';
import {
  Search,
  Filter,
  ArrowUpDown,
  Trash2,
  Edit2,
  ExternalLink,
  Clock,
  Sparkles,
  FileText,
  AlertCircle,
  FolderOpen,
  Eye,
  X,
} from 'lucide-react';
import { MarkdownViewer } from '../../components/common/MarkdownViewer';

export const HistoryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'title' | 'createdAt'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Rename modal state
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [newTitle, setNewTitle] = useState('');

  // Delete confirm modal state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Markdown preview modal state
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);

  // Fetch Query
  const { data, isLoading, error } = useQuery({
    queryKey: ['contentList', searchTerm, contentTypeFilter, sortBy, sortOrder, page],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        sortBy,
        sortOrder,
      });
      if (searchTerm) params.append('search', searchTerm);
      if (contentTypeFilter) params.append('contentType', contentTypeFilter);
      return apiRequest<PaginatedResult<ContentItem>>(`/content?${params.toString()}`);
    },
  });

  // Rename Mutation
  const renameMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      apiRequest(`/content/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentList'] });
      setEditingItem(null);
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/content/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentList'] });
      setDeletingId(null);
    },
  });

  const items = data?.items || [];
  const pagination = data?.pagination;

  const handleStartRename = (item: ContentItem) => {
    setEditingItem(item);
    setNewTitle(item.title);
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem && newTitle.trim()) {
      renameMutation.mutate({ id: editingItem.id, title: newTitle.trim() });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Content Library</h1>
          <p className="mt-1 text-sm text-slate-500">
            Search, manage, rename, and reopen your saved Gemini generation projects.
          </p>
        </div>
        <Link
          to="/generator"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>New Generation</span>
        </Link>
      </div>

      {/* Search and Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        {/* Search Input (6 cols) */}
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search documents by title or keywords..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
          />
        </div>

        {/* Filter Type (3 cols) */}
        <div className="sm:col-span-3">
          <select
            value={contentTypeFilter}
            onChange={(e) => {
              setContentTypeFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
          >
            <option value="">All Formats</option>
            <option value="blog">Blog Articles</option>
            <option value="social_linkedin">LinkedIn</option>
            <option value="social_instagram">Instagram</option>
            <option value="social_x">X / Twitter</option>
            <option value="email">Emails</option>
            <option value="marketing">Marketing Copy</option>
            <option value="product_description">Product Descriptions</option>
            <option value="study_notes">Study Notes</option>
            <option value="report">Reports</option>
            <option value="creative_writing">Creative Writing</option>
          </select>
        </div>

        {/* Sort Dropdown (3 cols) */}
        <div className="sm:col-span-3 flex space-x-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
          >
            <option value="updatedAt">Last Updated</option>
            <option value="createdAt">Date Created</option>
            <option value="title">Title (A-Z)</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            title="Toggle sort direction"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <ArrowUpDown className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Content List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Searching library...</div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <FolderOpen className="w-6 h-6" />
            </div>
            <p className="text-base font-semibold text-slate-800">No documents found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm || contentTypeFilter
                ? 'Try adjusting your search query or format filter.'
                : 'You have not saved any content yet.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center space-x-2.5">
                    <h3 className="text-base font-bold text-slate-900 truncate">{item.title}</h3>
                    <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {item.contentType.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-1 max-w-2xl font-mono">
                    {item.content}
                  </p>

                  <div className="flex items-center space-x-4 text-xs text-slate-400 pt-1">
                    <span className="capitalize text-slate-600">Tone: {item.tone}</span>
                    <span>•</span>
                    <span className="capitalize text-slate-600">Length: {item.length}</span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>

                {/* Row actions */}
                <div className="flex items-center space-x-2 self-end sm:self-auto flex-shrink-0">
                  <button
                    onClick={() => setPreviewItem(item)}
                    title="Preview Markdown"
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-600" />
                    <span>View Markdown</span>
                  </button>

                  <Link
                    to={`/generator?id=${item.id}`}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                  >
                    <span>Open Editor</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => handleStartRename(item)}
                    title="Rename"
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDeletingId(item.id)}
                    title="Delete"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination controls */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} items)
            </span>
            <div className="flex space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rename Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveRename}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <h3 className="text-base font-bold text-slate-900">Rename Document</h3>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
              placeholder="New title..."
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={renameMutation.isPending}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
              >
                {renameMutation.isPending ? 'Saving...' : 'Save Title'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Confirm Deletion</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete this document and all its historical versions? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deletingId)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Markdown Quick Preview Modal */}
      {previewItem && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-4 max-h-[88vh] flex flex-col border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1 pr-4">
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {previewItem.contentType.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500 capitalize">{previewItem.tone} Tone</span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 leading-snug">
                  {previewItem.title}
                </h2>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                title="Close Preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Markdown Content Viewer */}
            <div className="flex-1 overflow-y-auto px-2 py-1 pr-3">
              <MarkdownViewer content={previewItem.content} />
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Created: {new Date(previewItem.createdAt).toLocaleDateString()}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Close
                </button>
                <Link
                  to={`/generator?id=${previewItem.id}`}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
                >
                  <span>Open in Editor</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
