import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api-client';
import { ContentItem, PaginatedResult } from '../../types';
import {
  Wand2,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FolderOpen,
  CheckCircle2,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['recentContent'],
    queryFn: () =>
      apiRequest<PaginatedResult<ContentItem>>('/content?page=1&limit=5&sortBy=updatedAt&sortOrder=desc'),
  });

  const recentItems = data?.items || [];
  const totalCount = data?.pagination?.total || 0;

  const quickTypes = [
    { label: 'Blog Article', type: 'blog', icon: FileText, color: 'text-blue-600 bg-blue-50' },
    { label: 'Social Post', type: 'social_linkedin', icon: Sparkles, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Client Email', type: 'email', icon: Wand2, color: 'text-purple-600 bg-purple-50' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl shadow-slate-900/10">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gemini Content Engine Ready</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Welcome back, {user?.name.split(' ')[0]}
          </h1>
          <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
            What would you like to write today? Pick a format or launch the generator workspace to craft tailored content.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/generator"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-sm shadow-md transition-all"
            >
              <Wand2 className="w-4 h-4" />
              <span>Open Generator</span>
            </Link>
            <Link
              to="/history"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm backdrop-blur-md transition-all"
            >
              <FolderOpen className="w-4 h-4" />
              <span>View Saved Library</span>
            </Link>
          </div>
        </div>

        {/* Decorative blur circle */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
      </div>

      {/* Metrics overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Documents</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{totalCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Supported Types</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">8 Formats</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">System Status</p>
            <p className="mt-1 text-sm font-semibold text-emerald-600 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Gemini Operational</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Launch & Recent Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Launch Cards */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Quick Create</h2>
          <div className="space-y-3">
            {quickTypes.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.type}
                  to={`/generator?type=${item.type}`}
                  className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                      <p className="text-xs text-slate-500">Structured prompt template</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Documents Table / List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent Content</h2>
            <Link to="/history" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
              View all ({totalCount})
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-slate-400 text-sm">Loading recent content...</div>
            ) : recentItems.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-500">No documents saved yet.</p>
                <Link
                  to="/generator"
                  className="mt-3 inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Generate your first draft</span>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentItems.map((item) => (
                  <Link
                    key={item.id}
                    to={`/generator?id=${item.id}`}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="min-w-0 pr-4">
                      <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-emerald-600 transition-colors">
                        {item.title}
                      </p>
                      <div className="flex items-center space-x-3 mt-1 text-xs text-slate-500">
                        <span className="capitalize px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {item.contentType.replace('_', ' ')}
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
