import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '../../lib/api-client';
import { ContentItem, ContentVersion, VariationItem } from '../../types';
import {
  Wand2,
  Sparkles,
  Copy,
  Download,
  Save,
  RotateCcw,
  History,
  Layers,
  Check,
  AlertCircle,
  Loader2,
  ChevronRight,
  HelpCircle,
  Sliders,
  Type,
  FileDown,
  Eye,
  Edit3,
  Columns,
} from 'lucide-react';
import { MarkdownViewer } from '../../components/common/MarkdownViewer';

const formSchema = z.object({
  title: z.string().min(1, 'Please enter a subject or title'),
  contentType: z.enum([
    'blog',
    'social_linkedin',
    'social_instagram',
    'social_x',
    'email',
    'marketing',
    'product_description',
    'study_notes',
    'report',
    'creative_writing',
  ]),
  tone: z.enum([
    'professional',
    'casual',
    'friendly',
    'persuasive',
    'informative',
    'creative',
    'humorous',
    'academic',
  ]),
  length: z.enum(['short', 'medium', 'long']),
  targetAudience: z.string().optional(),
  keywords: z.string().optional(),
  context: z.string().optional(),
  referenceText: z.string().optional(),
});

type GeneratorFormData = z.infer<typeof formSchema>;

export const GeneratorPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialId = searchParams.get('id');
  const initialType = searchParams.get('type') as GeneratorFormData['contentType'] | null;

  // Active content state
  const [currentContentId, setCurrentContentId] = useState<string | null>(initialId);
  const [generatedTitle, setGeneratedTitle] = useState<string>('');
  const [editableContent, setEditableContent] = useState<string>('');
  const [activeVersionNumber, setActiveVersionNumber] = useState<number>(1);

  // Operation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);

  // Variations & Versions modal / state
  const [variations, setVariations] = useState<VariationItem[]>([]);
  const [showVariationsModal, setShowVariationsModal] = useState(false);
  const [isLoadingVariations, setIsLoadingVariations] = useState(false);

  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [showVersionsDrawer, setShowVersionsDrawer] = useState(false);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);

  // Refine custom instruction popover
  const [customRefineAction, setCustomRefineAction] = useState<string | null>(null);
  const [customInstruction, setCustomInstruction] = useState('');

  // Markdown Viewer / Editor mode state ('edit' | 'preview' | 'split')
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<GeneratorFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      contentType: initialType || 'blog',
      tone: 'informative',
      length: 'medium',
      targetAudience: '',
      keywords: '',
      context: '',
      referenceText: '',
    },
  });

  // Load existing content item if ID present in URL
  useEffect(() => {
    if (initialId) {
      apiRequest<ContentItem>(`/content/${initialId}`)
        .then((item) => {
          setCurrentContentId(item.id);
          setGeneratedTitle(item.title);
          setEditableContent(item.content);
          setValue('title', item.title);
          setValue('contentType', item.contentType);
          setValue('tone', item.tone);
          setValue('length', item.length);
        })
        .catch((err) => {
          setErrorMsg('Failed to load requested document.');
        });
    }
  }, [initialId, setValue]);

  // Main Generation Handler
  const handleGenerate = async (formData: GeneratorFormData) => {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const keywordList = formData.keywords
        ? formData.keywords
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean)
        : [];

      const payload = {
        title: formData.title,
        contentType: formData.contentType,
        tone: formData.tone,
        length: formData.length,
        targetAudience: formData.targetAudience || '',
        keywords: keywordList,
        context: formData.context || '',
        referenceText: formData.referenceText || '',
      };

      const result = await apiRequest<ContentItem & { version?: number }>(
        '/content/generate',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      setCurrentContentId(result.id);
      setGeneratedTitle(result.title);
      setEditableContent(result.content);
      setActiveVersionNumber(result.version || 1);
      setSearchParams({ id: result.id });
    } catch (err: any) {
      setErrorMsg(err.message || 'Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Refine content handler
  const executeRefine = async (action: string, instruction = '') => {
    if (!currentContentId) {
      setErrorMsg('Please generate or save content before refining.');
      return;
    }

    setIsRefining(true);
    setErrorMsg(null);
    try {
      const payload = {
        action,
        instruction,
        scope: 'full',
        currentContent: editableContent,
      };

      const result = await apiRequest<{
        id: string;
        title: string;
        content: string;
        version: number;
      }>(`/content/${currentContentId}/refine`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setEditableContent(result.content);
      setActiveVersionNumber(result.version);
      setCustomRefineAction(null);
      setCustomInstruction('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Refinement failed.');
    } finally {
      setIsRefining(false);
    }
  };

  // Variations Handler
  const handleFetchVariations = async () => {
    if (!currentContentId) {
      setErrorMsg('Please generate and save content first.');
      return;
    }
    setIsLoadingVariations(true);
    setErrorMsg(null);
    try {
      const result = await apiRequest<{ variations: VariationItem[] }>(
        `/content/${currentContentId}/variations`,
        {
          method: 'POST',
          body: JSON.stringify({ count: 3, currentContent: editableContent }),
        }
      );
      setVariations(result.variations);
      setShowVariationsModal(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate variations.');
    } finally {
      setIsLoadingVariations(false);
    }
  };

  const handleAdoptVariation = (variationText: string) => {
    setEditableContent(variationText);
    setShowVariationsModal(false);
    // Persist as edited change
    handleSave(variationText);
  };

  // Version History Handler
  const handleOpenVersions = async () => {
    if (!currentContentId) return;
    setIsLoadingVersions(true);
    try {
      const result = await apiRequest<ContentVersion[]>(
        `/content/${currentContentId}/versions`
      );
      setVersions(result);
      setShowVersionsDrawer(true);
    } catch (err: any) {
      setErrorMsg('Failed to retrieve versions history.');
    } finally {
      setIsLoadingVersions(false);
    }
  };

  const handleRestoreVersion = (snapshot: string, verNum: number) => {
    setEditableContent(snapshot);
    setActiveVersionNumber(verNum);
    setShowVersionsDrawer(false);
  };

  // Save / Update manual edits
  const handleSave = async (contentToSave = editableContent) => {
    if (!currentContentId) return;
    setIsSaving(true);
    try {
      await apiRequest(`/content/${currentContentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: generatedTitle,
          content: contentToSave,
        }),
      });
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 2500);
    } catch (err: any) {
      setErrorMsg('Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  // Clipboard copy
  const handleCopy = () => {
    if (!editableContent) return;
    navigator.clipboard.writeText(editableContent);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // Export TXT
  const handleExportTxt = () => {
    if (!editableContent) return;
    const blob = new Blob([editableContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedTitle.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'content'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Markdown
  const handleExportMd = () => {
    if (!editableContent) return;
    const mdHeader = `# ${generatedTitle}\n\n`;
    const fullText = editableContent.startsWith('# ') ? editableContent : mdHeader + editableContent;
    const blob = new Blob([fullText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedTitle.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'content'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = editableContent.trim() ? editableContent.trim().split(/\s+/).length : 0;
  const charCount = editableContent.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner / Error notification */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-sm text-red-700 shadow-sm animate-fade-in">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700 font-bold ml-4">
            ×
          </button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Generation Input Form (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">Content Configuration</h2>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              V1 Builder
            </span>
          </div>

          <form onSubmit={handleSubmit(handleGenerate)} className="space-y-4">
            {/* Title / Topic */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Topic or Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('title')}
                placeholder="e.g., The Future of Remote Work and AI"
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 transition-all ${
                  errors.title ? 'border-red-300 focus:ring-red-200' : 'border-slate-300 focus:ring-emerald-200 focus:border-emerald-500'
                }`}
              />
              {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
            </div>

            {/* Content Type */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Content Type <span className="text-red-500">*</span>
              </label>
              <select
                {...register('contentType')}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
              >
                <option value="blog">Blog Post / Article</option>
                <option value="social_linkedin">Social Post - LinkedIn</option>
                <option value="social_instagram">Social Post - Instagram Caption</option>
                <option value="social_x">Social Post - X (Twitter)</option>
                <option value="email">Professional Email</option>
                <option value="marketing">Marketing Copy & Ads</option>
                <option value="product_description">Product Description</option>
                <option value="study_notes">Study Notes & Explanations</option>
                <option value="report">Formal Report / Announcement</option>
                <option value="creative_writing">Creative Writing & Stories</option>
              </select>
            </div>

            {/* Tone & Length Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Tone <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('tone')}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="friendly">Friendly</option>
                  <option value="persuasive">Persuasive</option>
                  <option value="informative">Informative</option>
                  <option value="creative">Creative</option>
                  <option value="humorous">Humorous</option>
                  <option value="academic">Academic</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Length Target <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('length')}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
                >
                  <option value="short">Short (~100-200 words)</option>
                  <option value="medium">Medium (~300-500 words)</option>
                  <option value="long">Long (~700-1,000 words)</option>
                </select>
              </div>
            </div>

            {/* Target Audience */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Target Audience <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                {...register('targetAudience')}
                placeholder="e.g., Software developers, undergraduate students"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
              />
            </div>

            {/* Keywords */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Keywords to include <span className="text-slate-400 font-normal">(Comma-separated)</span>
              </label>
              <input
                type="text"
                {...register('keywords')}
                placeholder="e.g., productivity, automation, architecture"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
              />
            </div>

            {/* Additional Context */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Additional Instructions & Context
              </label>
              <textarea
                rows={2}
                {...register('context')}
                placeholder="e.g., Emphasize practical examples and avoid jargon..."
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 resize-none"
              />
            </div>

            {/* Reference Text */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Reference Source Text <span className="text-slate-400 font-normal">(Optional material)</span>
              </label>
              <textarea
                rows={3}
                {...register('referenceText')}
                placeholder="Paste background research or notes here..."
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 resize-none font-mono text-xs"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 shadow-md shadow-slate-900/10 transition-all text-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Synthesizing with Gemini...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 text-emerald-400" />
                  <span>{currentContentId ? 'Regenerate Content' : 'Generate Content'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Content Workspace & Editor (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 flex flex-col min-h-[640px]">
          {/* Header of Workspace */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={generatedTitle}
                onChange={(e) => setGeneratedTitle(e.target.value)}
                placeholder="Document Title"
                className="text-lg font-bold text-slate-900 bg-transparent border-none p-0 focus:outline-none focus:ring-0 w-full"
              />
              <div className="flex items-center space-x-3 text-xs text-slate-500 mt-0.5">
                <span>Version {activeVersionNumber}</span>
                <span>•</span>
                <span>{wordCount} words</span>
                <span>•</span>
                <span>{charCount} characters</span>
              </div>
            </div>

            {/* Top Workspace Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopy}
                disabled={!editableContent}
                title="Copy to clipboard"
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              >
                {copyFeedback ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>

              <div className="relative group">
                <button
                  disabled={!editableContent}
                  title="Export options"
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                >
                  <Download className="w-4 h-4" />
                </button>
                <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-white border border-slate-200 rounded-xl shadow-lg p-1 min-w-[130px] z-20">
                  <button
                    onClick={handleExportTxt}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center space-x-2"
                  >
                    <FileDown className="w-3.5 h-3.5 text-slate-500" />
                    <span>Plain Text (.txt)</span>
                  </button>
                  <button
                    onClick={handleExportMd}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center space-x-2"
                  >
                    <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Markdown (.md)</span>
                  </button>
                </div>
              </div>

              {currentContentId && (
                <button
                  onClick={handleOpenVersions}
                  title="Version history"
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                >
                  <History className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => handleSave()}
                disabled={!currentContentId || isSaving}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm"
              >
                {saveFeedback ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Refinement Actions Toolbar & View Mode Switcher */}
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-400 font-semibold px-2 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Refine:</span>
              </span>

              <button
                onClick={() => executeRefine('rewrite')}
                disabled={isRefining || !editableContent}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium transition-colors"
              >
                Rewrite
              </button>
              <button
                onClick={() => executeRefine('simplify')}
                disabled={isRefining || !editableContent}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium transition-colors"
              >
                Simplify
              </button>
              <button
                onClick={() => executeRefine('shorten')}
                disabled={isRefining || !editableContent}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium transition-colors"
              >
                Shorten
              </button>
              <button
                onClick={() => executeRefine('expand')}
                disabled={isRefining || !editableContent}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium transition-colors"
              >
                Expand
              </button>
              <button
                onClick={() => executeRefine('improve_grammar')}
                disabled={isRefining || !editableContent}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium transition-colors"
              >
                Improve Grammar
              </button>
              <button
                onClick={() => executeRefine('improve_readability')}
                disabled={isRefining || !editableContent}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium transition-colors"
              >
                Readability
              </button>

              {/* Custom tone / instructions trigger */}
              <button
                onClick={() => setCustomRefineAction(customRefineAction ? null : 'custom')}
                disabled={isRefining || !editableContent}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 font-medium transition-colors"
              >
                Custom Refine...
              </button>

              {/* Variations button */}
              <button
                onClick={handleFetchVariations}
                disabled={isLoadingVariations || !editableContent}
                className="px-3 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 font-semibold transition-colors flex items-center space-x-1"
              >
                {isLoadingVariations ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Layers className="w-3 h-3" />
                )}
                <span>Variations</span>
              </button>
            </div>

            {/* Markdown View Mode Toggle (Editor / Preview / Split) */}
            {editableContent && (
              <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200/80 shadow-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('edit')}
                  title="Raw Editor"
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-md font-medium text-xs transition-all ${
                    viewMode === 'edit'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Editor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('preview')}
                  title="Formatted Markdown Viewer"
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-md font-medium text-xs transition-all ${
                    viewMode === 'preview'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>Markdown View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('split')}
                  title="Side-by-side Editor & Live Preview"
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-md font-medium text-xs transition-all ${
                    viewMode === 'split'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-purple-700'
                  }`}
                >
                  <Columns className="w-3 h-3" />
                  <span>Split View</span>
                </button>
              </div>
            )}
          </div>

          {/* Custom Instruction Box if triggered */}
          {customRefineAction && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-xs">
              <input
                type="text"
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                placeholder="e.g., Make it warmer, add a metaphor about sailing, use British spelling..."
                className="flex-1 px-3 py-1.5 rounded-lg border border-emerald-300 text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                onClick={() => executeRefine('rewrite', customInstruction)}
                disabled={isRefining || !customInstruction.trim()}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors"
              >
                Apply
              </button>
              <button
                onClick={() => setCustomRefineAction(null)}
                className="px-2 py-1.5 text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Text Editor Area / Markdown Viewer */}
          <div className="flex-1 relative flex flex-col">
            {(isGenerating || isRefining) && (
              <div className="absolute inset-0 bg-white/75 backdrop-blur-xs flex flex-col items-center justify-center z-10 rounded-xl space-y-3">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-semibold text-slate-700">
                  {isGenerating ? 'Gemini is drafting your content...' : 'Applying smart refinement...'}
                </p>
              </div>
            )}

            {!editableContent && !isGenerating ? (
              <div className="flex-1 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                  <Wand2 className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-slate-600">Your content workspace is empty</p>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Fill in your topic on the left and click "Generate Content" to craft your initial draft with Gemini.
                </p>
              </div>
            ) : viewMode === 'preview' ? (
              <div className="w-full flex-1 p-6 rounded-xl border border-slate-200/80 bg-slate-50/40 overflow-y-auto max-h-[600px] min-h-[420px] shadow-xs">
                <MarkdownViewer content={editableContent} />
              </div>
            ) : viewMode === 'split' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[420px]">
                <div className="flex flex-col">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                    <Edit3 className="w-3 h-3 text-slate-500" />
                    <span>Markdown Editor</span>
                  </div>
                  <textarea
                    value={editableContent}
                    onChange={(e) => setEditableContent(e.target.value)}
                    placeholder="Generated content will appear here. You can freely edit, format, or refine it."
                    className="w-full flex-1 p-3.5 rounded-xl border border-slate-200/80 text-xs font-mono leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 resize-none min-h-[380px]"
                  />
                </div>
                <div className="flex flex-col">
                  <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                    <Eye className="w-3 h-3 text-emerald-600" />
                    <span>Live Markdown Preview</span>
                  </div>
                  <div className="w-full flex-1 p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 overflow-y-auto max-h-[520px] min-h-[380px]">
                    <MarkdownViewer content={editableContent} />
                  </div>
                </div>
              </div>
            ) : (
              <textarea
                value={editableContent}
                onChange={(e) => setEditableContent(e.target.value)}
                placeholder="Generated content will appear here. You can freely edit, format, or refine it."
                className="w-full flex-1 p-4 rounded-xl border border-slate-200/80 text-sm font-sans leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 resize-none min-h-[420px]"
              />
            )}
          </div>
        </div>
      </div>

      {/* Variations Modal */}
      {showVariationsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900">Alternative Variations</h3>
              </div>
              <button
                onClick={() => setShowVariationsModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Here are up to 3 distinct angles generated by Gemini. Select one to adopt it into your editor.
            </p>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {variations.map((v) => (
                <div
                  key={v.index}
                  className="p-4 rounded-xl border border-slate-200 hover:border-purple-300 transition-all bg-slate-50/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                      Option {v.index}
                    </span>
                    <button
                      onClick={() => handleAdoptVariation(v.content)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                    >
                      Adopt this option
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{v.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Version History Drawer / Modal */}
      {showVersionsDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-end">
          <div className="bg-white w-full max-w-md h-full p-6 shadow-2xl space-y-4 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-slate-700" />
                <h3 className="text-base font-bold text-slate-900">Version History</h3>
              </div>
              <button
                onClick={() => setShowVersionsDrawer(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Snapshot history of all generations, refinements, and edits.
            </p>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 divide-y divide-slate-100">
              {isLoadingVersions ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading versions...</div>
              ) : versions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">No versions found.</div>
              ) : (
                versions.map((ver) => (
                  <div key={ver.id} className="pt-3 first:pt-0 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        Version {ver.versionNumber}{' '}
                        <span className="text-[10px] font-normal text-slate-400 capitalize">
                          ({ver.changeType})
                        </span>
                      </span>
                      <button
                        onClick={() => handleRestoreVersion(ver.contentSnapshot, ver.versionNumber)}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                      >
                        Restore
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {new Date(ver.createdAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-600 line-clamp-3 bg-slate-50 p-2 rounded-lg font-mono">
                      {ver.contentSnapshot}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
