import * as XLSX from 'xlsx';
import { Student, StudentProgress } from '../types';
import { ALL_QUESTIONS } from '../data/curriculum';

export interface ParseExcelResult {
  students: Student[];
  errors: string[];
}

export async function parseExcelFile(file: File): Promise<ParseExcelResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with raw values
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
        
        if (!rows || rows.length === 0) {
          resolve({ students: [], errors: ['الملف فارغ أو لا يحتوي على أي صفوف صالحة.'] });
          return;
        }

        const students: Student[] = [];
        const errors: string[] = [];

        rows.forEach((row, index) => {
          // Identify columns flexibly (Arabic or English)
          let name = '';
          let classGroup = 'عاشر 1';
          let nationalId = '';

          for (const [key, val] of Object.entries(row)) {
            const cleanKey = key.trim().toLowerCase();
            const stringVal = String(val).trim();

            if (!name && (
              cleanKey.includes('اسم') ||
              cleanKey.includes('name') ||
              cleanKey.includes('طالب') ||
              cleanKey.includes('student')
            )) {
              name = stringVal;
            } else if (
              cleanKey.includes('صف') ||
              cleanKey.includes('شعبة') ||
              cleanKey.includes('فصل') ||
              cleanKey.includes('class') ||
              cleanKey.includes('grade') ||
              cleanKey.includes('section')
            ) {
              if (stringVal) classGroup = stringVal;
            } else if (
              cleanKey.includes('قيد') ||
              cleanKey.includes('هوية') ||
              cleanKey.includes('رقم') ||
              cleanKey.includes('id') ||
              cleanKey.includes('code')
            ) {
              if (stringVal) nationalId = stringVal;
            }
          }

          // Fallback if no specific column matched: check first non-empty text column
          if (!name) {
            const values = Object.values(row).map(v => String(v).trim()).filter(Boolean);
            if (values.length > 0 && isNaN(Number(values[0]))) {
              name = values[0];
              if (values[1]) classGroup = values[1];
              if (values[2]) nationalId = values[2];
            }
          }

          if (name) {
            students.push({
              id: `std_excel_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
              name,
              classGroup: classGroup || 'عاشر',
              nationalId: nationalId || undefined,
              createdAt: Date.now(),
            });
          } else {
            errors.push(`الصف رقم ${index + 2}: لم يتم العثور على اسم صالح للطالب.`);
          }
        });

        resolve({ students, errors });
      } catch (err) {
        resolve({
          students: [],
          errors: ['حدث خطأ أثناء قراءة ملف الإكسل: ' + (err instanceof Error ? err.message : String(err))]
        });
      }
    };

    reader.onerror = () => {
      resolve({ students: [], errors: ['فشل قراءة الملف من الجهاز.'] });
    };

    reader.readAsArrayBuffer(file);
  });
}

export function downloadSampleTemplate() {
  const sampleData = [
    {
      'اسم الطالب': 'محمد خالد النجار',
      'الصف والشعبة': 'عاشر 1',
      'رقم الهوية / القيد': '10985511',
      'ملاحظات المعلم': 'ممتاز في الجانب النظري',
    },
    {
      'اسم الطالب': 'سارة إبراهيم الشيخ',
      'الصف والشعبة': 'عاشر 1',
      'رقم الهوية / القيد': '10985512',
      'ملاحظات المعلم': 'تحتاج تدريب على Class B',
    },
    {
      'اسم الطالب': 'أحمد ياسين خليل',
      'الصف والشعبة': 'عاشر 2',
      'رقم الهوية / القيد': '10985513',
      'ملاحظات المعلم': 'طالب نشيط',
    },
    {
      'اسم الطالب': 'مريم طارق الفهد',
      'الصف والشعبة': 'عاشر 2',
      'رقم الهوية / القيد': '10985514',
      'ملاحظات المعلم': '',
    },
    {
      'اسم الطالب': 'عمر وليد الرشيد',
      'الصف والشعبة': 'عاشر 3',
      'رقم الهوية / القيد': '10985515',
      'ملاحظات المعلم': '',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  // Auto-fit column width
  ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 30 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'قائمة الطلاب');

  XLSX.writeFile(wb, 'نموذج_قائمة_الطلاب_الصف_العاشر.xlsx');
}

export function exportStudentReport(students: Student[], progressMap: Record<string, StudentProgress>) {
  // Sheet 1: Student summary
  const studentRows = students.map((std, index) => {
    const prog = progressMap[std.id] || {
      completedLessons: [],
      attempts: [],
      mistakeQuestionIds: [],
      masteredMistakeIds: [],
      totalScore: 0,
      earnedBadges: [],
    };

    const totalAttempts = prog.attempts.length;
    const correctAttempts = prog.attempts.filter(a => a.isCorrect).length;
    const wrongAttempts = totalAttempts - correctAttempts;
    const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
    const activeMistakes = prog.mistakeQuestionIds.length;
    const masteredMistakes = prog.masteredMistakeIds.length;

    let evaluation = 'لم يبدأ بعد';
    if (accuracy >= 90) evaluation = 'ممتاز (متقن جداً)';
    else if (accuracy >= 75) evaluation = 'جيد جداً';
    else if (accuracy >= 60) evaluation = 'جيد (يحتاج متابعة)';
    else if (totalAttempts > 0) evaluation = 'يحتاج إلى تدريب الأخطاء';

    return {
      'م': index + 1,
      'اسم الطالب': std.name,
      'الصف / الشعبة': std.classGroup,
      'رقم الهوية / القيد': std.nationalId || '---',
      'الدروس المكتملة': `${prog.completedLessons.length} من 4`,
      'إجمالي الأسئلة المنجزة': totalAttempts,
      'الإجابات الصحيحة': correctAttempts,
      'الإجابات الخاطئة': wrongAttempts,
      'نسبة الدقة': `${accuracy}%`,
      'أخطاء بحاجة تدريب': activeMistakes,
      'أخطاء تم تصحيحها وإتقانها': masteredMistakes,
      'النقاط المكتسبة': prog.totalScore,
      'تقييم المستوى': evaluation,
    };
  });

  const wsStudents = XLSX.utils.json_to_sheet(studentRows);
  wsStudents['!cols'] = [
    { wch: 6 },
    { wch: 25 },
    { wch: 14 },
    { wch: 18 },
    { wch: 16 },
    { wch: 22 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 },
    { wch: 20 },
    { wch: 24 },
    { wch: 16 },
    { wch: 24 },
  ];

  // Sheet 2: Questions Difficulty & Performance
  const questionRows = ALL_QUESTIONS.map((q, idx) => {
    let totalQAttempts = 0;
    let correctQAttempts = 0;

    Object.values(progressMap).forEach(prog => {
      prog.attempts.forEach(att => {
        if (att.questionId === q.id) {
          totalQAttempts++;
          if (att.isCorrect) correctQAttempts++;
        }
      });
    });

    const successRate = totalQAttempts > 0 ? Math.round((correctQAttempts / totalQAttempts) * 100) : 0;

    return {
      'رقم': idx + 1,
      'نص السؤال': q.questionAr,
      'الموضوع': q.topicId,
      'المستوى': q.difficulty,
      'إجمالي المحاولات': totalQAttempts,
      'الإجابات الصحيحة': correctQAttempts,
      'نسبة النجاح': totalQAttempts > 0 ? `${successRate}%` : 'لم يُجرب بعد',
      'حالة الصعوبة': successRate < 50 && totalQAttempts > 0 ? 'سؤال صعب (يتطلب إعادة شرح)' : 'مستوعب جيداً',
    };
  });

  const wsQuestions = XLSX.utils.json_to_sheet(questionRows);
  wsQuestions['!cols'] = [
    { wch: 6 },
    { wch: 50 },
    { wch: 15 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 15 },
    { wch: 30 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsStudents, 'درجات الطلاب');
  XLSX.utils.book_append_sheet(wb, wsQuestions, 'تحليل الأسئلة والأخطاء');

  const todayStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `تقرير_مختبر_الشبكات_الصف_العاشر_${todayStr}.xlsx`);
}
