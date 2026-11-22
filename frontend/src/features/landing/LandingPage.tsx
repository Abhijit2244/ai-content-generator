import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  ArrowRight,
  FileText,
  Share2,
  Mail,
  ShoppingBag,
  BookOpen,
  TrendingUp,
  CheckCircle2,
  Layers,
  History,
  ShieldCheck,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();

  const features = [
    {
      title: 'Blog & Articles',
      desc: 'Engaging, SEO-conscious long-form and medium posts with natural narrative flow.',
      icon: FileText,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Social Media',
      desc: 'High-conversion posts optimized specifically for LinkedIn, Instagram, and X.',
      icon: Share2,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'High-Impact Emails',
      desc: 'Compelling subject lines and structured outreach for prospects, clients, and teams.',
      icon: Mail,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      title: 'Product Descriptions',
      desc: 'Scannable benefits and evocative sensory descriptions that turn visitors into buyers.',
      icon: ShoppingBag,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      title: 'Study Notes & Summaries',
      desc: 'Clear concept breakdowns, memory anchors, and review questions for fast mastery.',
      icon: BookOpen,
      color: 'bg-rose-50 text-rose-600',
    },
    {
      title: 'Reports & Marketing',
      desc: 'Authoritative executive briefs, campaign copy, and announcements tailored to your audience.',
      icon: TrendingUp,
      color: 'bg-indigo-50 text-indigo-600',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero section */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32 bg-gradient-to-b from-white via-slate-50 to-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Google Gemini-Powered Generation</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
            Generate, refine, and master written content with{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              complete creative control.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Create tailored articles, social posts, emails, and notes. Refine with instant actions,
            generate variations, restore version snapshots, and export seamlessly.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link
                to="/generator"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 rounded-xl text-base font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-md shadow-slate-900/10 hover:shadow-lg transition-all"
              >
                <span>Launch Generator</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 rounded-xl text-base font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all"
                >
                  <span>Start Writing Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-xl text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-sm transition-all"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              One platform for all your content needs
            </h2>
            <p className="mt-3 text-slate-600">
              Select your topic, tone, length, and audience. Gemini crafts tailored drafts in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="p-6 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md transition-all group"
                >
                  <div className={`w-12 h-12 rounded-xl ${feat.color} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{feat.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white border border-slate-200">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Smart Refinement Suite</h3>
              <p className="text-sm text-slate-600">
                Instant one-click actions: Rewrite, Simplify, Shorten, Expand, Improve Grammar, or Change Tone without leaving the editor.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <History className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Version Snapshots</h3>
              <p className="text-sm text-slate-600">
                Never lose an idea. Every generation, refinement, and edit creates an immutable snapshot you can inspect or restore at any time.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Private & Isolated</h3>
              <p className="text-sm text-slate-600">
                Your content is private and strictly scoped to your user account. Gemini credentials never touch the browser or public API.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
