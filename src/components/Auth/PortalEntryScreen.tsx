import React, { useState } from 'react';
import {
  GraduationCap,
  UserCheck,
  Sparkles,
  Layers,
  ArrowLeft,
  Search,
  KeyRound,
  FileSpreadsheet,
  CheckCircle2,
  BookOpen,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { Student, StudentProgress } from '../../types';
import { audio } from '../../services/audioService';

interface PortalEntryScreenProps {
  students: Student[];
  progressMap: Record<string, StudentProgress>;
  selectedStudentId: string;
  onSelectStudent: (id: string) => void;
  onEnterAsStudent: (studentId: string) => void;
  onEnterAsTeacher: () => void;
}

export const PortalEntryScreen: React.FC<PortalEntryScreenProps> = ({
  students,
  progressMap,
  selectedStudentId,
  onSelectStudent,
  onEnterAsStudent,
  onEnterAsTeacher,
}) => {
  const [activeRole, setActiveRole] = useState<'student' | 'teacher'>('student');
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [teacherPin, setTeacherPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Extract unique classes
  const classes = Array.from(new Set(students.map((s) => s.classGroup))).filter(Boolean);

  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.nationalId && s.nationalId.includes(studentSearch));
    const matchesClass = selectedClassFilter === 'all' || s.classGroup === selectedClassFilter;
    return matchesSearch && matchesClass;
  });

  const activeStudent = students.find((s) => s.id === selectedStudentId) || students[0];
  const activeProg = activeStudent ? progressMap[activeStudent.id] : null;

  const handleStudentLogin = (studentId: string) => {
    audio.playClick();
    onSelectStudent(studentId);
    onEnterAsStudent(studentId);
  };

  const handleTeacherLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    audio.playClick();
    // Allow instant entry or optional PIN (1234 or empty for seamless classroom flow)
    if (!teacherPin || teacherPin === '1234' || teacherPin.length > 0) {
      onEnterAsTeacher();
    } else {
      setPinError('رمز المرور غير صحيح');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-['Cairo',sans-serif] select-none">
      {/* Background Cyber Glow Gradients */}
      <div className="absolute top-1/4 -right-24 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-24 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-4xl flex flex-col items-center gap-6 z-10 py-6">
        {/* Brand & Title */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-cyan-500/25 border border-cyan-400/30 text-white mb-1">
            <Layers className="w-8 h-8" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
              منهاج شبكات الحاسوب • الصف العاشر
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            مختبر الشبكات ثلاثي الأبعاد
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg">
            منصة تفاعلية لتعلم فئات IP (Class A, Class B, Class C)، أقنعة الشبكة، العناوين الخاصة والعامة، مع تدريب الأخطاء الذكي.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="w-full max-w-md bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 flex items-center shadow-lg">
          <button
            type="button"
            onClick={() => {
              audio.playClick();
              setActiveRole('student');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeRole === 'student'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>الدخول كطالب</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audio.playClick();
              setActiveRole('teacher');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeRole === 'teacher'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>الدخول كمعلم</span>
          </button>
        </div>

        {/* Student Portal Card */}
        {activeRole === 'student' && (
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-cyan-400" />
                  <span>اختر اسمك من قائمة طلاب الصف العاشر</span>
                </h3>
                <p className="text-xs text-slate-400">
                  حدد اسمك للبدء في تلقي المعلومات واختبارات الفهم وتدريب الأخطاء المحفوظة
                </p>
              </div>

              {/* Class Filter */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">تصفية بالشعبة:</span>
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-1.5 font-bold focus:outline-none"
                >
                  <option value="all">جميع الشُعب</option>
                  {classes.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="ابحث عن اسمك أو رقم القيد..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Student List Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
              {filteredStudents.map((std) => {
                const isSelected = std.id === (activeStudent?.id || '');
                const prog = progressMap[std.id];
                const mistakesCount = prog?.mistakeQuestionIds.length || 0;
                const score = prog?.totalScore || 0;

                return (
                  <button
                    key={std.id}
                    type="button"
                    onClick={() => {
                      audio.playClick();
                      onSelectStudent(std.id);
                    }}
                    className={`text-right p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-cyan-950/70 border-cyan-400 ring-2 ring-cyan-500/40 shadow-lg shadow-cyan-950'
                        : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white line-clamp-1">{std.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 font-semibold">
                        {std.classGroup}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span className="flex items-center gap-1 text-amber-300 font-bold">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        {score} نقطة
                      </span>

                      {mistakesCount > 0 ? (
                        <span className="flex items-center gap-1 text-rose-400 font-semibold">
                          <AlertTriangle className="w-3 h-3" />
                          {mistakesCount} أخطاء
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          متقن
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Student Confirmation & Enter Button */}
            {activeStudent && (
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-cyan-950/30 border border-cyan-800/60 mt-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">الطالب المحدد حالياً:</span>
                    <h4 className="text-sm font-bold text-white">
                      {activeStudent.name} ({activeStudent.classGroup})
                    </h4>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleStudentLogin(activeStudent.id)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-cyan-600/30 transition-all"
                >
                  <span>دخول الطالب إلى المختبر 🚀</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Teacher Portal Card */}
        {activeRole === 'teacher' && (
          <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
            <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">بوابة المعلم لمتابعة الصف العاشر</h3>
                <p className="text-xs text-slate-400">
                  لوحة تحكم كاملة، إدارة قائمة الطلاب من ملفات Excel، وتصدير الدرجات
                </p>
              </div>
            </div>

            {/* Quick Overview Features for Teacher */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-2.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">استيراد وتصدير Excel</span>
                  <span className="text-slate-400 text-[11px]">رفع قوائم الطلاب وتصدير الدرجات بنقرة واحدة</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">تحليل الأخطاء والتعثر</span>
                  <span className="text-slate-400 text-[11px]">معرفة أكثر الأسئلة صعوبة في فئات IP</span>
                </div>
              </div>
            </div>

            {/* Direct Login Form */}
            <form onSubmit={handleTeacherLogin} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1.5">
                  رمز مرور المعلم (اختياري - يمكنك النقر على الدخول مباشرة):
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={teacherPin}
                    onChange={(e) => {
                      setTeacherPin(e.target.value);
                      setPinError('');
                    }}
                    placeholder="رمز المرور الافتراضي: 1234 أو اتركه فارغاً"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
                {pinError && <span className="text-[11px] text-rose-400 mt-1 block">{pinError}</span>}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-500">
                  {students.length} طالب مسجل حالياً في النظام
                </span>

                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-600/30 transition-all"
                >
                  <span>دخول لوحة تحكم المعلم</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Quick Footer info */}
        <div className="text-center text-xs text-slate-500 pt-2">
          مخصص لمدارس المرحلة الثانوية • وحدات Class A, Class B, Class C وقناع الشبكة
        </div>
      </div>
    </div>
  );
};
