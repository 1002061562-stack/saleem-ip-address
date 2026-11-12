import React from 'react';
import {
  BookOpen,
  HelpCircle,
  AlertTriangle,
  Layers,
  GraduationCap,
  Volume2,
  VolumeX,
  UserCheck,
  Award,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { Student, StudentProgress, ActiveTab } from '../../types';
import { audio } from '../../services/audioService';

interface NavbarProps {
  students: Student[];
  activeStudent: Student;
  onSelectStudent: (id: string) => void;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  progress: StudentProgress;
  isSoundMuted: boolean;
  onToggleSound: () => void;
  onOpenUploadModal: () => void;
  userRole: 'student' | 'teacher';
  onLogoutToPortal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  students,
  activeStudent,
  onSelectStudent,
  activeTab,
  onSelectTab,
  progress,
  isSoundMuted,
  onToggleSound,
  onOpenUploadModal,
  userRole,
  onLogoutToPortal,
}) => {
  const mistakesCount = progress.mistakeQuestionIds.length;
  const masteredCount = progress.masteredMistakeIds.length;

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* App Title & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-600/20 text-white">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-white">مختبر الشبكات 3D</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                الصف العاشر
              </span>
            </div>
            <p className="text-xs text-slate-400">Class A, B, C • قناع الشبكة • العناوين الخاصة والعامة</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => {
              audio.playClick();
              onSelectTab('learn');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'learn'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>الدروس التفاعلية</span>
          </button>

          <button
            onClick={() => {
              audio.playClick();
              onSelectTab('quiz');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'quiz'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>بنك الاختبارات</span>
          </button>

          <button
            onClick={() => {
              audio.playClick();
              onSelectTab('mistakes');
            }}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'mistakes'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>تدريب الأخطاء</span>
            {mistakesCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-rose-500 text-white font-mono font-bold">
                {mistakesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              audio.playClick();
              onSelectTab('3dlab');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === '3dlab'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>معمل 3D المفتوح</span>
          </button>

          {userRole === 'teacher' && (
            <button
              onClick={() => {
                audio.playClick();
                onSelectTab('teacher');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'teacher'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>لوحة المعلم والإكسل</span>
            </button>
          )}
        </nav>

        {/* Student Selector, Role Badge & Sound / Logout Controls */}
        <div className="flex items-center gap-2.5">
          {/* Active Student Pill (or Teacher Mode Indicator) */}
          {userRole === 'student' ? (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400">حساب الطالب:</span>
                <span className="text-xs font-bold text-white line-clamp-1 max-w-[130px]">
                  {activeStudent.name}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-purple-950/60 border border-purple-800 rounded-xl px-2.5 py-1">
              <GraduationCap className="w-4 h-4 text-purple-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-purple-300">وضع المعلم:</span>
                <select
                  value={activeStudent.id}
                  onChange={(e) => {
                    audio.playClick();
                    onSelectStudent(e.target.value);
                  }}
                  className="bg-transparent text-xs font-bold text-purple-200 focus:outline-none cursor-pointer max-w-[140px]"
                  title="فحص كطالب محدد"
                >
                  {students.map((std) => (
                    <option key={std.id} value={std.id} className="bg-slate-900 text-slate-100">
                      معاينة: {std.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Student Score Badge (in student mode) */}
          {userRole === 'student' && (
            <div className="hidden sm:flex items-center gap-1.5 bg-amber-950/40 border border-amber-800/60 rounded-xl px-2.5 py-1.5 text-xs text-amber-300 font-bold">
              <Award className="w-4 h-4 text-amber-400" />
              <span>{progress.totalScore} نقطة</span>
            </div>
          )}

          {/* Mastered Mistakes Counter */}
          {masteredCount > 0 && userRole === 'student' && (
            <div className="hidden md:flex items-center gap-1 bg-emerald-950/40 border border-emerald-800/60 rounded-xl px-2.5 py-1.5 text-xs text-emerald-300 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{masteredCount} متقن</span>
            </div>
          )}

          {/* Audio Mute Button */}
          <button
            onClick={onToggleSound}
            className={`p-2 rounded-xl border transition-colors ${
              isSoundMuted
                ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                : 'bg-cyan-950 border-cyan-800 text-cyan-400 hover:bg-cyan-900'
            }`}
            title={isSoundMuted ? 'تشغيل المؤثرات الصوتية' : 'كتم الصوت'}
          >
            {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Switch Role / Exit to Initial Screen */}
          <button
            onClick={() => {
              audio.playClick();
              onLogoutToPortal();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-800 text-slate-400 hover:text-rose-300 text-xs font-semibold transition-colors"
            title="العودة للشاشة الأولى (الدخول كطالب أو كمعلم)"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">تبديل / خروج</span>
          </button>
        </div>
      </div>
    </header>
  );
};
