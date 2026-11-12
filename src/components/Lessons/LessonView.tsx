import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Layers,
  HelpCircle,
  Lightbulb,
  Check,
  RotateCcw,
} from 'lucide-react';
import { Lesson, Question, StudentProgress } from '../../types';
import { LESSONS, ENCOURAGEMENTS } from '../../data/curriculum';
import { audio } from '../../services/audioService';

interface LessonViewProps {
  studentId: string;
  progress: StudentProgress;
  onRecordAnswer: (qId: string, choice: number, isCorrect: boolean) => { newlyMastered: boolean };
  onCompleteLesson: (lessonId: string) => void;
  onInspectIpIn3D: (ip: string, mode?: 'octets' | 'topology' | 'packets') => void;
  onTrigger3DCelebrate: () => void;
}

export const LessonView: React.FC<LessonViewProps> = ({
  studentId,
  progress,
  onRecordAnswer,
  onCompleteLesson,
  onInspectIpIn3D,
  onTrigger3DCelebrate,
}) => {
  const [selectedLessonId, setSelectedLessonId] = useState<string>(LESSONS[0].id);
  const [selectedSectionIdx, setSelectedSectionIdx] = useState<number>(0);

  // Question state for the current section
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  const currentLesson = LESSONS.find((l) => l.id === selectedLessonId) || LESSONS[0];
  const currentSection = currentLesson.sections[selectedSectionIdx] || currentLesson.sections[0];
  const question = currentSection.sampleQuestion;

  const isLessonFinished = progress.completedLessons.includes(currentLesson.id);

  const handleSelectOption = (idx: number) => {
    if (isSubmitted) return;
    audio.playClick();
    setSelectedOption(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isSubmitted) return;

    const isCorrect = selectedOption === question.correctAnswer;
    setIsSubmitted(true);

    if (isCorrect) {
      audio.playCorrect();
      onTrigger3DCelebrate();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#06b6d4', '#10b981', '#3b82f6', '#fbbf24'],
      });
      const enc = question.encouragementAr || ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
      setFeedbackMsg(enc);
    } else {
      audio.playWrong();
      setFeedbackMsg('إجابة غير صحيحة، لكن لا تقلق! قمنا بحفظ هذا السؤال في "ورشة تدريب الأخطاء" لتتمكن من التدرب عليه وتجاوزه بنجاح.');
    }

    onRecordAnswer(question.id, selectedOption, isCorrect);
  };

  const handleNextSection = () => {
    audio.playClick();
    setSelectedOption(null);
    setIsSubmitted(false);
    setFeedbackMsg('');

    if (selectedSectionIdx < currentLesson.sections.length - 1) {
      setSelectedSectionIdx(selectedSectionIdx + 1);
    } else {
      // Completed all sections in lesson!
      onCompleteLesson(currentLesson.id);
      audio.playMastered();
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  };

  const handlePrevSection = () => {
    audio.playClick();
    if (selectedSectionIdx > 0) {
      setSelectedOption(null);
      setIsSubmitted(false);
      setFeedbackMsg('');
      setSelectedSectionIdx(selectedSectionIdx - 1);
    }
  };

  const handleResetQuestion = () => {
    audio.playClick();
    setSelectedOption(null);
    setIsSubmitted(false);
    setFeedbackMsg('');
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Unit Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {LESSONS.map((lesson, idx) => {
          const isSelected = lesson.id === selectedLessonId;
          const isDone = progress.completedLessons.includes(lesson.id);

          return (
            <button
              key={lesson.id}
              onClick={() => {
                audio.playClick();
                setSelectedLessonId(lesson.id);
                setSelectedSectionIdx(0);
                setSelectedOption(null);
                setIsSubmitted(false);
                setFeedbackMsg('');
              }}
              className={`text-right p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2 ${
                isSelected
                  ? 'bg-gradient-to-br from-cyan-950/60 to-slate-900 border-cyan-500 ring-1 ring-cyan-500/50 shadow-lg shadow-cyan-950/50'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  الوحدة {idx + 1}
                </span>
                {isDone && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    مكتملة
                  </span>
                )}
              </div>
              <h3 className="font-bold text-sm text-white line-clamp-1">{lesson.titleAr}</h3>
              <p className="text-xs text-slate-400 line-clamp-2">{lesson.shortDescAr}</p>
            </button>
          );
        })}
      </div>

      {/* Main Lesson Content Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-6">
        {/* Section Header & Progress Pill */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-cyan-900/50 text-cyan-300 font-bold text-xs flex items-center justify-center border border-cyan-700/50">
              {selectedSectionIdx + 1}
            </span>
            <h2 className="text-lg font-bold text-white">{currentSection.titleAr}</h2>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>
              الجزء {selectedSectionIdx + 1} من {currentLesson.sections.length}
            </span>
            <div className="flex gap-1">
              {currentLesson.sections.map((_, i) => (
                <div
                  key={i}
                  className={`w-5 h-1.5 rounded-full ${
                    i === selectedSectionIdx
                      ? 'bg-cyan-500'
                      : i < selectedSectionIdx
                      ? 'bg-emerald-500'
                      : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bite-sized educational content */}
        <div className="flex flex-col gap-3 text-slate-200 text-sm leading-relaxed">
          {currentSection.contentAr.map((para, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
              <p>{para}</p>
            </div>
          ))}
        </div>

        {/* Key Takeaways & Rules Box */}
        <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900/50 to-slate-900 border border-cyan-800/40 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold">
            <Lightbulb className="w-4 h-4 text-cyan-400" />
            <span>القواعد الذهبية لصف العاشر:</span>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
            {currentSection.keyPointsAr.map((pt, i) => (
              <li key={i} className="flex items-center gap-2 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 3D Lab Interactive Launcher Banner */}
        {currentSection.interactiveIp && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white">العنوان التطبيقي لهذا الدرس:</span>
                <span className="font-mono text-cyan-300 text-xs ml-2 px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                  {currentSection.interactiveIp}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                audio.playClick();
                onInspectIpIn3D(currentSection.interactiveIp!, currentSection.suggested3DMode);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/30"
            >
              <span>معاينة تفاعلية في معمل 3D</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Check-for-Understanding Test Question (البرنامج يعطي معلومة ويختبر الطالب) */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <HelpCircle className="w-4 h-4" />
              <span>اختبر فهمك الفوري للمعلومة:</span>
            </div>
            {isSubmitted && (
              <button
                onClick={handleResetQuestion}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>إعادة المحاولة</span>
              </button>
            )}
          </div>

          <h4 className="text-sm font-bold text-white">{question.questionAr}</h4>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {question.optionsAr.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectAnswer = idx === question.correctAnswer;

              let btnStyle = 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300';
              if (isSelected && !isSubmitted) {
                btnStyle = 'bg-cyan-950 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500';
              } else if (isSubmitted) {
                if (isCorrectAnswer) {
                  btnStyle = 'bg-emerald-950/70 border-emerald-500 text-emerald-200 font-bold';
                } else if (isSelected && !isCorrectAnswer) {
                  btnStyle = 'bg-rose-950/70 border-rose-500 text-rose-200 line-through';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isSubmitted}
                  className={`text-right p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {isSubmitted && isCorrectAnswer && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mr-2" />}
                  {isSubmitted && isSelected && !isCorrectAnswer && <XCircle className="w-4 h-4 text-rose-400 shrink-0 mr-2" />}
                </button>
              );
            })}
          </div>

          {/* Submit Action or Feedback */}
          {!isSubmitted ? (
            <div className="flex justify-end pt-1">
              <button
                onClick={handleSubmitAnswer}
                disabled={selectedOption === null}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                  selectedOption !== null
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                تأكيد الإجابة
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 pt-2 border-t border-slate-800/80">
              <div
                className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                  selectedOption === question.correctAnswer
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  {selectedOption === question.correctAnswer ? (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>{feedbackMsg}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <span>توضيح الإجابة الصحيحة:</span>
                    </>
                  )}
                </div>
                <p className="text-slate-300 mt-1">{question.explanationAr}</p>
              </div>

              {/* Next Section or Lesson Button */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={handlePrevSection}
                  disabled={selectedSectionIdx === 0}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>القسم السابق</span>
                </button>

                <button
                  onClick={handleNextSection}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20"
                >
                  <span>
                    {selectedSectionIdx < currentLesson.sections.length - 1
                      ? 'الانتقال للقسم التالي'
                      : 'إتمام الوحدة بنجاح! 🎉'}
                  </span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
