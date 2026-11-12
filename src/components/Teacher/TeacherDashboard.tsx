import React, { useState } from 'react';
import {
  Users,
  GraduationCap,
  Download,
  Upload,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  Sparkles,
  BarChart3,
  FileSpreadsheet,
  Eye,
  Trash2,
  X,
} from 'lucide-react';
import { Student, StudentProgress } from '../../types';
import { exportStudentReport, downloadSampleTemplate } from '../../services/excelService';
import { ALL_QUESTIONS } from '../../data/curriculum';
import { audio } from '../../services/audioService';

interface TeacherDashboardProps {
  students: Student[];
  progressMap: Record<string, StudentProgress>;
  activeStudentId: string;
  onSelectStudent: (id: string) => void;
  onOpenImportModal: () => void;
  onAddStudent: (newStudent: Omit<Student, 'id' | 'createdAt'>) => void;
  onDeleteStudent: (id: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  students,
  progressMap,
  activeStudentId,
  onSelectStudent,
  onOpenImportModal,
  onAddStudent,
  onDeleteStudent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentClass, setNewStudentClass] = useState('عاشر 1');
  const [newStudentNationalId, setNewStudentNationalId] = useState('');
  const [inspectStudentId, setInspectStudentId] = useState<string | null>(null);

  // Extract unique classes
  const classes = Array.from(new Set(students.map((s) => s.classGroup))).filter(Boolean);

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.name.includes(searchTerm) || (s.nationalId && s.nationalId.includes(searchTerm));
    const matchesClass = selectedClass === 'all' || s.classGroup === selectedClass;
    return matchesSearch && matchesClass;
  });

  // Calculate high-level stats
  const totalStudents = students.length;
  let totalAttemptsAcrossAll = 0;
  let totalCorrectAcrossAll = 0;
  let totalActiveMistakes = 0;
  let totalMasteredMistakes = 0;

  Object.values(progressMap).forEach((prog) => {
    totalAttemptsAcrossAll += prog.attempts.length;
    totalCorrectAcrossAll += prog.attempts.filter((a) => a.isCorrect).length;
    totalActiveMistakes += prog.mistakeQuestionIds.length;
    totalMasteredMistakes += prog.masteredMistakeIds.length;
  });

  const avgAccuracy = totalAttemptsAcrossAll > 0 ? Math.round((totalCorrectAcrossAll / totalAttemptsAcrossAll) * 100) : 0;

  const handleExportExcel = () => {
    audio.playClick();
    exportStudentReport(students, progressMap);
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    audio.playClick();
    onAddStudent({
      name: newStudentName.trim(),
      classGroup: newStudentClass.trim() || 'عاشر',
      nationalId: newStudentNationalId.trim() || undefined,
    });
    setNewStudentName('');
    setNewStudentNationalId('');
    setIsAddModalOpen(false);
  };

  const inspectedStudent = students.find((s) => s.id === inspectStudentId);
  const inspectedProgress = inspectStudentId ? progressMap[inspectStudentId] : null;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Top Banner & Quick Actions */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">لوحة تحكم المعلم لمتابعة الصف العاشر</h2>
            <p className="text-xs text-slate-400">
              إدارة قائمة الطلاب من ملفات إكسل ومتابعة تقدم الفهم ونقاط الضعف وتدريب الأخطاء.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              audio.playClick();
              downloadSampleTemplate();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
            title="تحميل ملف إكسل فارغ معبأ بنموذج جاهز"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>نموذج إكسل</span>
          </button>

          <button
            onClick={() => {
              audio.playClick();
              onOpenImportModal();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>استيراد من إكسل</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>تصدير الدرجات إلى Excel</span>
          </button>

          <button
            onClick={() => {
              audio.playClick();
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-semibold transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5 text-purple-400" />
            <span>إضافة طالب</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-cyan-400" />
            إجمالي الطلاب
          </span>
          <span className="text-2xl font-black text-white">{totalStudents}</span>
          <span className="text-[11px] text-slate-500">{classes.length} شُعب دراسية مسجلة</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            متوسط دقة الإجابات
          </span>
          <span className="text-2xl font-black text-emerald-400">{avgAccuracy}%</span>
          <span className="text-[11px] text-slate-500">من إجمالي {totalAttemptsAcrossAll} محاولة</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            أخطاء بحاجة لتدريب
          </span>
          <span className="text-2xl font-black text-rose-400">{totalActiveMistakes}</span>
          <span className="text-[11px] text-slate-500">في ورش تدريب الأخطاء</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            أخطاء تم تصحيحها وإتقانها
          </span>
          <span className="text-2xl font-black text-amber-400">{totalMasteredMistakes}</span>
          <span className="text-[11px] text-slate-500">طلاب تجاوزوا تعثرهم بنجاح</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 flex-1 max-w-sm bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث باسم الطالب أو رقم الهوية..."
            className="bg-transparent text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">الشعبة / الصف:</span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-1.5 font-semibold focus:outline-none"
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

      {/* Main Students Roster Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-bold">الطالب</th>
                <th className="py-3.5 px-4 font-bold">الصف</th>
                <th className="py-3.5 px-4 font-bold">الدروس المنجزة</th>
                <th className="py-3.5 px-4 font-bold">المحاولات والصحة</th>
                <th className="py-3.5 px-4 font-bold">نسبة الدقة</th>
                <th className="py-3.5 px-4 font-bold">أخطاء قيد التدريب</th>
                <th className="py-3.5 px-4 font-bold">تم إتقانه</th>
                <th className="py-3.5 px-4 font-bold">النقاط</th>
                <th className="py-3.5 px-4 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredStudents.map((std) => {
                const prog = progressMap[std.id] || {
                  completedLessons: [],
                  attempts: [],
                  mistakeQuestionIds: [],
                  masteredMistakeIds: [],
                  totalScore: 0,
                  earnedBadges: [],
                };

                const totalAtt = prog.attempts.length;
                const correctAtt = prog.attempts.filter((a) => a.isCorrect).length;
                const accuracy = totalAtt > 0 ? Math.round((correctAtt / totalAtt) * 100) : 0;
                const isActive = std.id === activeStudentId;

                return (
                  <tr
                    key={std.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isActive ? 'bg-cyan-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          {std.name}
                          {isActive && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                              الحالي
                            </span>
                          )}
                        </span>
                        {std.nationalId && <span className="text-[10px] text-slate-500 font-mono">{std.nationalId}</span>}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-300">{std.classGroup}</td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-950 text-cyan-300 font-mono text-[11px] border border-slate-800">
                        {prog.completedLessons.length} من 4
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-400 font-bold">{correctAtt} صح</span>
                        <span className="text-slate-600">/</span>
                        <span className="text-rose-400">{totalAtt - correctAtt} خطأ</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              accuracy >= 80 ? 'bg-emerald-500' : accuracy >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${accuracy}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-200">{accuracy}%</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {prog.mistakeQuestionIds.length > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                          {prog.mistakeQuestionIds.length} أخطاء
                        </span>
                      ) : (
                        <span className="text-emerald-400 text-[11px]">لا توجد أخطاء ✨</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {prog.masteredMistakeIds.length > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                          {prog.masteredMistakeIds.length} متقن
                        </span>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-amber-300 font-mono">{prog.totalScore}</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {!isActive ? (
                          <button
                            onClick={() => {
                              audio.playClick();
                              onSelectStudent(std.id);
                            }}
                            className="px-2 py-1 rounded-lg bg-cyan-950 text-cyan-300 hover:bg-cyan-900 border border-cyan-800 text-[11px] font-bold"
                            title="اختيار هذا الطالب للتعلم أو الاختبار الآن"
                          >
                            اختيار
                          </button>
                        ) : null}

                        <button
                          onClick={() => {
                            audio.playClick();
                            setInspectStudentId(std.id);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                          title="عرض سجل المحاولات التفصيلي"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {students.length > 1 && (
                          <button
                            onClick={() => {
                              audio.playClick();
                              if (confirm(`هل أنت متأكد من حذف الطالب "${std.name}"؟`)) {
                                onDeleteStudent(std.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-500 hover:text-rose-400"
                            title="حذف الطالب"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hardest Questions Analytics (تحليل الأسئلة التي تعثر بها الطلاب لصف العاشر) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <BarChart3 className="w-4 h-4 text-purple-400" />
          <span>تحليل صعوبة الأسئلة ومواضع التعثر في الصف:</span>
        </div>
        <p className="text-xs text-slate-400">
          تساعد هذه الإحصائيات المعلم في معرفة المفاهيم التي تحتاج إلى إعادة شرح في الفصل الدراسي (مثل الفرق بين Class A و B، أو استخراج NetID).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ALL_QUESTIONS.slice(0, 4).map((q, idx) => {
            let totalQ = 0;
            let correctQ = 0;
            Object.values(progressMap).forEach((p) => {
              p.attempts.forEach((att) => {
                if (att.questionId === q.id) {
                  totalQ++;
                  if (att.isCorrect) correctQ++;
                }
              });
            });
            const rate = totalQ > 0 ? Math.round((correctQ / totalQ) * 100) : 100;

            return (
              <div key={idx} className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white line-clamp-1">{q.questionAr}</span>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded ${
                      rate >= 75 ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                    }`}
                  >
                    {rate}% نجاح
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${rate >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    style={{ width: `${rate}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-400">{q.explanationAr}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">إضافة طالب جديد</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">اسم الطالب الرباعي:</label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="مثال: حسام محمد الخطيب"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">الصف / الشعبة:</label>
                <input
                  type="text"
                  required
                  value={newStudentClass}
                  onChange={(e) => setNewStudentClass(e.target.value)}
                  placeholder="مثال: عاشر 1 أو عاشر 2"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">رقم الهوية / القيد (اختياري):</label>
                <input
                  type="text"
                  value={newStudentNationalId}
                  onChange={(e) => setNewStudentNationalId(e.target.value)}
                  placeholder="مثال: 1098442"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30"
                >
                  حفظ الطالب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Audit Detail Modal */}
      {inspectedStudent && inspectedProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl p-6 shadow-2xl flex flex-col gap-4 text-right max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{inspectedStudent.name}</h3>
                <span className="text-xs text-slate-400">
                  {inspectedStudent.classGroup} • النقاط: {inspectedProgress.totalScore}
                </span>
              </div>
              <button
                onClick={() => setInspectStudentId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-300">سجل الإجابات والمحاولات الأخيرة:</span>
              {inspectedProgress.attempts.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 bg-slate-950 rounded-xl">
                  لم يسجل هذا الطالب أي محاولة بعد.
                </div>
              ) : (
                <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden text-xs">
                  {inspectedProgress.attempts.map((att, i) => {
                    const q = ALL_QUESTIONS.find((item) => item.id === att.questionId);
                    return (
                      <div key={i} className="p-3 flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-1 flex-1">
                          <span className="font-semibold text-white">{q?.questionAr || att.questionId}</span>
                          <span className="text-[11px] text-slate-400">
                            الإجابة المختارة: {q ? q.optionsAr[att.selectedAnswer] : att.selectedAnswer}
                          </span>
                        </div>
                        {att.isCorrect ? (
                          <span className="flex items-center gap-1 text-emerald-400 font-bold shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                            صحيحة
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-rose-400 font-bold shrink-0">
                            <XCircle className="w-4 h-4" />
                            خاطئة
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
