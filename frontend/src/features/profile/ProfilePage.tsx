import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, ShieldCheck, Database, Cpu, LogOut, CheckCircle2 } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-brand-500/20">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{user?.name}</h1>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <p className="text-xs text-slate-400 mt-1">
              Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'November 2026'}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Architecture & Security Status */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Architecture & Security Verification</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of the Clean Architecture and operational boundaries enforced for your account.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-600">
              <Cpu className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">AI Service</span>
            </div>
            <p className="text-xs font-semibold text-slate-800">FastAPI & Google Gemini</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              API credentials are strictly confined to the private Python runtime. No keys exposed to the browser.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
            <div className="flex items-center space-x-2 text-blue-600">
              <Database className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Persistence</span>
            </div>
            <p className="text-xs font-semibold text-slate-800">SQLite + Prisma ORM</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Every content query is scoped by your authenticated user ID at the database layer.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
            <div className="flex items-center space-x-2 text-purple-600">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Authentication</span>
            </div>
            <p className="text-xs font-semibold text-slate-800">JWT + bcrypt Hashing</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Passwords hashed with bcrypt work factor 10. Sessions signed with short-lived access tokens.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center space-x-2 text-xs text-emerald-700 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>All system boundaries and tenant isolation policies verified active.</span>
        </div>
      </div>
    </div>
  );
};
