import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, FileText, CheckCircle2, AlertCircle, Download, Sparkles, X } from 'lucide-react';
import { parseFile, downloadSampleTemplate, ColumnMapping } from '../utils/fileParser';
import { ComplaintRecord } from '../types/triage';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadedRecords: (records: ComplaintRecord[]) => void;
  onLoadBenchmarkData: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onLoadedRecords,
  onLoadBenchmarkData,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{
    headers: string[];
    rows: Record<string, any>[];
    records: ComplaintRecord[];
    mapping: ColumnMapping;
    fileName: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setParsingError(null);
    try {
      const validExts = ['.csv', '.tsv', '.xlsx', '.xls'];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!validExts.includes(ext)) {
        throw new Error('Unsupported file format. Please upload a CSV, TSV, or Excel (.xlsx, .xls) file.');
      }

      const parsed = await parseFile(file);
      if (parsed.records.length === 0) {
        throw new Error('No valid complaint records found. Please ensure the file has rows with narrative text.');
      }

      setPreviewData({
        headers: parsed.headers,
        rows: parsed.rows,
        records: parsed.records,
        mapping: parsed.detectedMapping,
        fileName: file.name,
      });
    } catch (err: any) {
      setParsingError(err.message || 'Error processing spreadsheet file');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (!previewData) return;
    onLoadedRecords(previewData.records);
    onClose();
    setPreviewData(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Upload Healthcare Complaints Data Source</h2>
              <p className="text-xs text-slate-500">Supports CSV, TSV, and Excel (.xlsx, .xls) files</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {!previewData ? (
            <>
              {/* Drag and Drop Box */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/60 scale-[0.99]'
                    : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".csv,.tsv,.xlsx,.xls"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFile(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-14 h-14 rounded-2xl bg-blue-100/70 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">
                  Click to browse or drag and drop your file here
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  Patient portal messages, survey comments, grievance reports, reviews, or EHR feedback exports
                </p>
                <div className="inline-flex items-center space-x-2 text-[11px] font-medium text-slate-600 bg-slate-100/80 px-3 py-1.5 rounded-full">
                  <span>Auto-detects:</span>
                  <span className="text-blue-700 font-semibold">Complaint text, Patient Name, MRN, Date, Unit</span>
                </div>
              </div>

              {parsingError && (
                <div className="flex items-start space-x-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
                  <span>{parsingError}</span>
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onLoadBenchmarkData();
                    onClose();
                  }}
                  className="flex items-center space-x-3 p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50 text-left transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-700 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-blue-950">Load Benchmark Dataset</div>
                    <div className="text-[11px] text-blue-700/80">10 realistic hospital cases (Level 1-4)</div>
                  </div>
                </button>

                <div className="flex items-center space-x-2 p-2 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800">Download Template</div>
                    <div className="flex space-x-2 mt-0.5">
                      <button
                        onClick={() => downloadSampleTemplate('csv')}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 underline"
                      >
                        CSV
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        onClick={() => downloadSampleTemplate('xlsx')}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 underline"
                      >
                        Excel (.xlsx)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Preview State */
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-emerald-950">
                      Successfully detected {previewData.records.length} records in{' '}
                      <span className="font-mono">{previewData.fileName}</span>
                    </div>
                    <div className="text-[11px] text-emerald-800">
                      Mapped Complaint Narrative column to:{' '}
                      <span className="font-semibold underline">{previewData.mapping.complaintTextCol}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewData(null)}
                  className="text-xs font-medium text-emerald-700 hover:underline"
                >
                  Change file
                </button>
              </div>

              {/* Column Mapping confirmation */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="font-semibold text-slate-700">Column Mapping Details:</div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500">Complaint Text: </span>
                    <span className="font-medium text-slate-900">{previewData.mapping.complaintTextCol}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Patient Name: </span>
                    <span className="font-medium text-slate-900">{previewData.mapping.patientNameCol || 'Generated/N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">MRN: </span>
                    <span className="font-medium text-slate-900">{previewData.mapping.mrnCol || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Source Channel: </span>
                    <span className="font-medium text-slate-900">{previewData.mapping.sourceChannelCol || 'Default'}</span>
                  </div>
                </div>
              </div>

              {/* Record preview snippet */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                  Preview Sample Cases (First 3):
                </div>
                <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {previewData.records.slice(0, 3).map((rec, i) => (
                    <div key={i} className="p-3 text-xs bg-white">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span className="font-mono font-bold text-slate-700">{rec.id}</span>
                        <span>{rec.patientName || 'Anonymous'} • {rec.sourceChannel}</span>
                      </div>
                      <p className="text-slate-700 line-clamp-2 italic">"{rec.complaintText}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          {previewData && (
            <button
              type="button"
              onClick={handleConfirmImport}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all shadow-blue-500/20"
            >
              Import {previewData.records.length} Complaints to Triage Queue
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
