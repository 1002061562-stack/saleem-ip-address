import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Filter,
  RotateCcw,
  Award,
  Layers,
} from 'lucide-react';
import { Question, StudentProgress } from '../../types';
import { ALL_QUESTIONS, ENCOURAGEMENTS } from '../../data/curriculum';
import { audio } from '../../services/audioService';

interface QuizViewProps {
  studentId: string;
  progress: StudentProgress;
  onRecordAnswer: (qId: string, choice: number, isCorrect: boolean) => { newlyMastered: boolean };
  onTrigger3DCelebrate: () => void;
  onInspectIpIn3D: (ip: string) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  studentId,
  progress,
  onRecordAnswer,
  onTrigger3DCelebrate,
  onInspectIpIn3D,
}) => {
  const [filterTopic, setFilterTopic] = useState<string>('all');
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  const filteredQuestions = ALL_QUESTIONS.filter((q) => {
    if (filterTopic === 'all') return true;
    return q.topicId === filterTopic;
  });

  const question = filteredQuestions[currentQIndex] || filteredQuestions[0];

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    audio.playClick();
    setSelectedOption(idx);
  };

  const handleConfirm = () => {
    if (selectedOption === null || isAnswered) return;

    const isCorrect = selectedOption === question.correctAnswer;
    setIsAnswered(true);

    if (isCorrect) {
      audio.playCorrect();
      onTrigger3DCelebrate();
      confetti({
        particleCount: 50,
        spread: 65,
        origin: { y: 0.7 },
      });
      const enc = question.encouragementAr || ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
      setFeedbackMsg(enc);
    } else {
      audio.playWrong();
      setFeedbackMsg('إجابة خاطئة. تم حفظ هذا السؤال في "تدريب الأخطاء" لتتمكن من التدرب عليه لاحقاً وإتقانه.');
    }

    onRecordAnswer(question.id, selectedOption, isCorrect);
  };

  const handleNext = () => {
    audio.playClick();
    setSelectedOption(null);
    setIsAnswered(false);
    setFeedbackMsg('');
    if (currentQIndex < filteredQuestions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    } else {
      setCurrentQIndex(0); // loop
    }
  };

  const handlePrev = () => {
    audio.playClick();
    if (currentQIndex > 0) {
      setSelectedOption(null);
      setIsAnswered(false);
      setFeedbackMsg('');
      setCurrentQIndex(currentQIndex - 1);
    }
  };

  const topicTabs = [
    { id: 'all', label: 'جميع المواضيع' },
    { id: 'structure', label: 'مبنى الـ IP' },
    { id: 'classes', label: 'فئات A / B / C' },
    { id: 'subnet', label: 'أقنعة الشبكة' },
    { id: 'net_host', label: 'NetID و HostID' },
    { id: 'private_public', label: 'عناوين خاصة وعامة' },
    { id: 'special', label: 'عناوين محجوزة' },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Topics Filter Header */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 px-2 py-1">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          <span>الموضوع:</span>
        </div>
        {topicTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              audio.playClick();
              setFilterTopic(t.id);
              setCurrentQIndex(0);
              setSelectedOption(null);
              setIsAnswered(false);
              setFeedbackMsg('');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterTopic === t.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Question Card */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-6">
        {/* Question Counter & Meta */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
              سؤال {currentQIndex + 1} من {filteredQuestions.length}
            </span>
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                question.difficulty === 'easy'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : question.difficulty === 'medium'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-rose-950 text-rose-300 border border-rose-800'
              }`}
            >
              {question.difficulty === 'easy' ? 'مستوى سهل' : question.difficulty === 'medium' ? 'مستوى متوسط' : 'مستوى متقدم'}
            </span>
          </div>

          {question.relatedIp && (
            <button
              onClick={() => {
                audio.playClick();
                onInspectIpIn3D(question.relatedIp!);
              }}
              className="flex items-center gap-1.5 text-xs text-cyan-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-cyan-600 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>فحص {question.relatedIp} في 3D</span>
            </button>
          )}
        </div>

        {/* Question Text */}
        <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">{question.questionAr}</h3>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {question.optionsAr.map((optionText, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = idx === question.correctAnswer;

            let cardStyle = 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-200';
            if (isSelected && !isAnswered) {
              cardStyle = 'bg-blue-950/70 border-blue-500 text-blue-100 ring-1 ring-blue-500';
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

        {/* Action Controls & Feedback */}
        {!isAnswered ? (
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handlePrev}
              disabled={currentQIndex === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold"
            >
              <ArrowRight className="w-4 h-4" />
              <span>السابق</span>
            </button>

            <button
              onClick={handleConfirm}
              disabled={selectedOption === null}
              className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md ${
                selectedOption !== null
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              تأكيد الإجابة
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 pt-2 border-t border-slate-800">
            {/* Encouragement / Explanation banner */}
            <div
              className={`p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed ${
                selectedOption === question.correctAnswer
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold mb-1.5">
                {selectedOption === question.correctAnswer ? (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>{feedbackMsg}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>توضيح الإجابة الصحيحة لصف العاشر:</span>
                  </>
                )}
              </div>
              <p className="text-slate-300">{question.explanationAr}</p>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={handlePrev}
                disabled={currentQIndex === 0}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold"
              >
                <ArrowRight className="w-4 h-4" />
                <span>السابق</span>
              </button>

              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/30"
              >
                <span>السؤال التالي</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
