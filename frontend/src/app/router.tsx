import React from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { LandingPage } from '../features/landing/LandingPage';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { GeneratorPage } from '../features/generator/GeneratorPage';
import { HistoryPage } from '../features/history/HistoryPage';
import { ProfilePage } from '../features/profile/ProfilePage';

const RootLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4">
          AI Content Generator (Version 1 - MVP) • Clean Architecture • Powered by Google Gemini
        </div>
      </footer>
    </div>
  );
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'generator', element: <GeneratorPage /> },
          { path: 'history', element: <HistoryPage /> },
          { path: 'profile', element: <ProfilePage /> },
        ],
      },
      { path: '*', element: <LandingPage /> },
    ],
  },
]);
