import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle,
  X,
  Plus,
} from 'lucide-react';
import { Student } from '../../types';
import { parseExcelFile, downloadSampleTemplate, ParseExcelResult } from '../../services/excelService';
import { audio } from '../../services/audioService';

interface ExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (students: Student[], replaceExisting: boolean) => void;
}

export const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseResult, setParseResult] = useState<ParseExcelResult | null>(null);
  const [replaceExisting, setReplaceExisting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      audio.playClick();
      setFile(selectedFile);
      setIsParsing(true);
      const res = await parseExcelFile(selectedFile);
      setParseResult(res);
      setIsParsing(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      audio.playClick();
      setFile(droppedFile);
      setIsParsing(true);
      const res = await parseExcelFile(droppedFile);
      setParseResult(res);
      setIsParsing(false);
    }
  };

  const handleConfirmImport = () => {
    if (parseResult && parseResult.students.length > 0) {
      audio.playMastered();
      onImportSuccess(parseResult.students, replaceExisting);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl p-6 shadow-2xl flex flex-col gap-5 text-right select-none max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-800 text-purple-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">استيراد قائمة الطلاب من ملف إكسل</h3>
              <p className="text-xs text-slate-400">يدعم صيغ ملفات (.xlsx, .xls, .csv)</p>
            </div>
          </div>

          <button
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Template Download Banner */}
        <div className="flex items-center justify-between p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl">
          <div className="text-xs text-slate-300">
            <span className="font-bold text-white">هل تحتاج نموذج إكسل جاهز؟</span>
            <p className="text-[11px] text-slate-400">حمل نموذج إكسل معبأ بأسماء وشعب تجريبية لصف العاشر</p>
          </div>
          <button
            onClick={() => {
              audio.playClick();
              downloadSampleTemplate();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-xs font-bold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تحميل النموذج</span>
          </button>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 hover:border-purple-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-950/40"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />
          <UploadCloud className="w-12 h-12 text-purple-400 mb-2" />
          <span className="text-sm font-bold text-white mb-1">
            {file ? file.name : 'اسحب وأفلت ملف الإكسل هنا، أو انقر للاختيار'}
          </span>
          <span className="text-xs text-slate-500">يتعرف تلقائياً على أعمدة: اسم الطالب، الصف/الشعبة، رقم القيد/الهوية</span>
        </div>

        {/* Parsing Indicator */}
        {isParsing && (
          <div className="text-center text-xs text-purple-300 py-2">
            جارٍ تحليل وقراءة ملف الإكسل...
          </div>
        )}

        {/* Parse Preview */}
        {parseResult && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle className="w-4 h-4" />
                <span>تم العثور على {parseResult.students.length} طالب بنجاح</span>
              </div>
              {parseResult.errors.length > 0 && (
                <div className="flex items-center gap-1.5 text-amber-400 text-[11px]">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>تنبيه: {parseResult.errors.length} صف تم تجاهله</span>
                </div>
              )}
            </div>

            {/* Students Mini Preview */}
            <div className="max-h-36 overflow-y-auto border border-slate-800 rounded-xl divide-y divide-slate-800 bg-slate-950/60 text-xs">
              {parseResult.students.slice(0, 10).map((s, idx) => (
                <div key={idx} className="p-2 flex items-center justify-between">
                  <span className="font-semibold text-white">{s.name}</span>
                  <span className="text-slate-400 text-[11px]">{s.classGroup}</span>
                </div>
              ))}
              {parseResult.students.length > 10 && (
                <div className="p-2 text-center text-[11px] text-slate-500">
                  و {parseResult.students.length - 10} طلاب إضافيين...
                </div>
              )}
            </div>

            {/* Import Mode: Replace vs Append */}
            <div className="flex items-center gap-2 pt-1 text-xs text-slate-300">
              <input
                type="checkbox"
                id="replaceCheck"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
                className="accent-purple-600 rounded cursor-pointer"
              />
              <label htmlFor="replaceCheck" className="cursor-pointer">
                استبدال القائمة الحالية بالكامل (إذا لم يُحدد، ستتم إضافة الطلاب الجدد إلى القائمة الموجودة)
              </label>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
          >
            إلغاء
          </button>

          <button
            onClick={handleConfirmImport}
            disabled={!parseResult || parseResult.students.length === 0}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
              parseResult && parseResult.students.length > 0
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            تأكيد استيراد الطلاب
          </button>
        </div>
      </div>
    </div>
  );
};
