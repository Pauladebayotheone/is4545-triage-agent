import React from 'react';
import {
  ShieldAlert,
  FileSpreadsheet,
  Upload,
  BookOpen,
  Sparkles,
  Download,
  Activity,
  Layers,
  Zap,
} from 'lucide-react';
import { downloadSampleTemplate } from '../utils/fileParser';

interface NavbarProps {
  activeTab: 'queue' | 'quick';
  setActiveTab: (tab: 'queue' | 'quick') => void;
  onOpenUpload: () => void;
  onOpenGuidelines: () => void;
  onLoadBenchmark: () => void;
  totalRecordsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenUpload,
  onOpenGuidelines,
  onLoadBenchmark,
  totalRecordsCount,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-bold text-slate-900 tracking-tight sm:text-base">
                  Healthcare Complaint Triage Assistant
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <Activity className="w-3 h-3 text-blue-600" />
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Clinical Governance, Risk Prioritization & Departmental Routing Engine
              </p>
            </div>
          </div>

          {/* Navigation View Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setActiveTab('queue')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'queue'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Queue ({totalRecordsCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('quick')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'quick'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Quick Triage</span>
            </button>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenUpload}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload CSV / Excel</span>
              <span className="sm:hidden">Upload</span>
            </button>

            <button
              onClick={onLoadBenchmark}
              className="hidden lg:inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              title="Load 10 realistic hospital cases"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Load 10 Cases</span>
            </button>

            <button
              onClick={onOpenGuidelines}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              title="6-Step Clinical Governance Guidelines & SOP"
            >
              <BookOpen className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
