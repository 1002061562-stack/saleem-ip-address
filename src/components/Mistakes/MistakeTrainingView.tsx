import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Trophy,
  ArrowLeft,
  RotateCcw,
  Lightbulb,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Question, StudentProgress } from '../../types';
import { ALL_QUESTIONS } from '../../data/curriculum';
import { audio } from '../../services/audioService';

interface MistakeTrainingViewProps {
  studentName: string;
  progress: StudentProgress;
  onRecordAnswer: (qId: string, choice: number, isCorrect: boolean, isMistakePractice: boolean) => { newlyMastered: boolean };
  onTrigger3DCelebrate: () => void;
  onInspectIpIn3D: (ip: string) => void;
  onGoToQuiz: () => void;
}

export const MistakeTrainingView: React.FC<MistakeTrainingViewProps> = ({
  studentName,
  progress,
  onRecordAnswer,
  onTrigger3DCelebrate,
  onInspectIpIn3D,
  onGoToQuiz,
}) => {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [justMastered, setJustMastered] = useState<boolean>(false);

  // Active mistakes that need remediation
  const mistakeQuestions = ALL_QUESTIONS.filter((q) =>
    progress.mistakeQuestionIds.includes(q.id)
  );

  // Previously corrected mistakes
  const masteredQuestions = ALL_QUESTIONS.filter((q) =>
    progress.masteredMistakeIds.includes(q.id)
  );

  const question = mistakeQuestions[currentIdx] || mistakeQuestions[0];

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    audio.playClick();
    setSelectedOption(idx);
  };

  const handleConfirm = () => {
    if (selectedOption === null || isAnswered || !question) return;

    const isCorrect = selectedOption === question.correctAnswer;
    setIsAnswered(true);

    if (isCorrect) {
      audio.playMastered();
      onTrigger3DCelebrate();
      setJustMastered(true);
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#f59e0b', '#ec4899'],
      });
    } else {
      audio.playWrong();
      setJustMastered(false);
    }

    onRecordAnswer(question.id, selectedOption, isCorrect, true);
  };

  const handleNext = () => {
    audio.playClick();
    setSelectedOption(null);
    setIsAnswered(false);
    setShowHint(false);
    setJustMastered(false);
    if (currentIdx < mistakeQuestions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setCurrentIdx(0);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-900 border border-rose-800/50 rounded-3xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">ورشة تدريب الأخطاء الذكية</h2>
            <p className="text-xs text-slate-300">
              مرحباً <span className="font-bold text-rose-300">{studentName}</span>، هنا تُصنع الخبرة الحقيقية! نتمرن على الأسئلة التي تعثرت بها حتى تتقنها 100%.
            </p>
          </div>
        </div>

        {/* Stats counter */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center bg-slate-950/80 px-3.5 py-2 rounded-xl border border-rose-900/50">
            <span className="text-[10px] text-slate-400">بحاجة لتدريب</span>
            <span className="text-base font-black text-rose-400">{mistakeQuestions.length}</span>
          </div>

          <div className="flex flex-col items-center bg-slate-950/80 px-3.5 py-2 rounded-xl border border-emerald-900/50">
            <span className="text-[10px] text-slate-400">تم إتقانها</span>
            <span className="text-base font-black text-emerald-400">{masteredQuestions.length}</span>
          </div>
        </div>
      </div>

      {/* If there are mistakes to practice */}
      {mistakeQuestions.length > 0 && question ? (
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-6">
          {/* Question Meta */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                سؤال الخطأ {currentIdx + 1} من {mistakeQuestions.length}
              </span>
              <span className="text-xs text-slate-400">
                الموضوع: {question.topicId === 'classes' ? 'فئات العناوين' : question.topicId === 'subnet' ? 'قناع الشبكة' : 'مبنى الـ IP'}
              </span>
            </div>

            {/* Hint Toggle */}
            <button
              onClick={() => {
                audio.playClick();
                setShowHint(!showHint);
              }}
              className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/40 border border-amber-800/60 hover:bg-amber-900/40 px-3 py-1 rounded-lg transition-colors"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>{showHint ? 'إخفاء التلميح' : 'عرض تلميح مساعد'}</span>
            </button>
          </div>

          {/* Hint Card */}
          {showHint && (
            <div className="bg-amber-950/30 border border-amber-800/60 rounded-2xl p-3.5 text-xs text-amber-200 flex items-start gap-2.5">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">تلميح مهندس الشبكات: </span>
                <span>
                  {question.topicId === 'classes'
                    ? 'تذكر نطاقات البايت الأول: Class A (1-126)، Class B (128-191)، Class C (192-223).'
                    : question.topicId === 'subnet'
                    ? 'قناع الشبكة يحدد البايتات المحجوزة للشبكة برقم 255، بينما الأجهزة يُعبر عنها بالأصفار.'
                    : question.topicId === 'private_public'
                    ? 'العناوين الخاصة RFC 1918 تبدأ بـ 10 أو 172.16-31 أو 192.168.'
                    : 'اقرأ السؤال بهدوء وتذكر أن الحد الأقصى لأي خانة هو 255.'}
                </span>
              </div>
            </div>
          )}

          {/* Question Text */}
          <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">{question.questionAr}</h3>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {question.optionsAr.map((optionText, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === question.correctAnswer;

              let cardStyle = 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-200';
              if (isSelected && !isAnswered) {
                cardStyle = 'bg-rose-950/70 border-rose-500 text-rose-100 ring-1 ring-rose-500';
              } else if (isAnswered) {
                if (isCorrect) {
                  cardStyle = 'bg-emerald-950/70 border-emerald-500 text-emerald-100 font-bold';
                } else if (isSelected && !isCorrect) {
                  cardStyle = 'bg-rose-950/70 border-rose-500 text-rose-100 line-through';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswered}
                  className={`text-right p-4 rounded-2xl border text-xs sm:text-sm transition-all flex items-center justify-between ${cardStyle}`}
                >
                  <span>{optionText}</span>
                  {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mr-2" />}
                  {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-400 shrink-0 mr-2" />}
                </button>
              );
            })}
          </div>

          {/* Action or Result Feedback */}
          {!isAnswered ? (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleConfirm}
                disabled={selectedOption === null}
                className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md ${
                  selectedOption !== null
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                تأكيد الإجابة وتجاوز الخطأ
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 pt-2 border-t border-slate-800">
              <div
                className={`p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed ${
                  justMastered
                    ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1.5 text-sm">
                  {justMastered ? (
                    <>
                      <Trophy className="w-5 h-5 text-amber-400" />
                      <span>مبروك! تغلبت على هذا السؤال وتم إتقانه بنجاح! 🎯 (+15 نقطة إضافية)</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <span>لا بأس، المحاولة مفتاح التعلم:</span>
                    </>
                  )}
                </div>
                <p className="text-slate-300">{question.explanationAr}</p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/30"
                >
                  <span>السؤال التالي في ورشة التدريب</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State: Zero mistakes waiting! */
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-10 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-20 h-20 rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-950/50">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-black text-white">سجلّك خالٍ من أي أخطاء حالياً!</h3>
          <p className="text-sm text-slate-300 max-w-md">
            أداء استثنائي يا بطل! لقد أتقنت جميع الأسئلة السابقة أو لم تسجل أي أخطاء جديدة. يمكنك التوجه إلى بنك الاختبارات لخوض تحديات جديدة!
          </p>

          <button
            onClick={() => {
              audio.playClick();
              onGoToQuiz();
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-cyan-600/30 transition-all mt-2"
          >
            <span>الانتقال لبنك الأسئلة والاختبارات</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Section showing Mastered Questions History */}
      {masteredQuestions.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>الأسئلة التي تغلبت عليها وأتقنتها بنجاح ({masteredQuestions.length}):</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {masteredQuestions.map((mq) => (
              <div
                key={mq.id}
                className="bg-slate-950/70 border border-emerald-900/40 rounded-2xl p-3.5 flex items-start gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-600 text-emerald-400 flex items-center justify-center shrink-0 text-xs">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-white line-clamp-2">{mq.questionAr}</span>
                  <span className="text-[11px] text-emerald-300 font-semibold">
                    الإجابة: {mq.optionsAr[mq.correctAnswer]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
