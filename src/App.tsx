/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Student,
  StudentProgress,
  ActiveTab,
} from './types';
import {
  getStudents,
  saveStudents,
  getActiveStudentId,
  setActiveStudentId,
  getAllProgress,
  getStudentProgress,
  recordQuestionAnswer,
  completeLesson,
} from './services/storage';
import { audio } from './services/audioService';
import { Navbar } from './components/Header/Navbar';
import { NetworkScene } from './components/ThreeCanvas/NetworkScene';
import { DockControls } from './components/ThreeCanvas/DockControls';
import { LessonView } from './components/Lessons/LessonView';
import { QuizView } from './components/Quiz/QuizView';
import { MistakeTrainingView } from './components/Mistakes/MistakeTrainingView';
import { Open3DLabView } from './components/Lab3D/Open3DLabView';
import { TeacherDashboard } from './components/Teacher/TeacherDashboard';
import { ExcelUploadModal } from './components/Teacher/ExcelUploadModal';
import { PortalEntryScreen } from './components/Auth/PortalEntryScreen';

export default function App() {
  const [students, setStudents] = useState<Student[]>(() => getStudents());
  const [activeStudentId, setActiveStudentIdState] = useState<string>(() => getActiveStudentId());
  const [allProgress, setAllProgress] = useState<Record<string, StudentProgress>>(() => getAllProgress());
  const [activeTab, setActiveTab] = useState<ActiveTab>('learn');
  const [userRole, setUserRole] = useState<'student' | 'teacher' | null>(null);

  // 3D Scene Interactive State
  const [currentIp, setCurrentIp] = useState<string>('192.168.1.100');
  const [active3DMode, setActive3DMode] = useState<'octets' | 'topology' | 'packets'>('octets');
  const [explodedOffset, setExplodedOffset] = useState<number>(0.25);
  const [selectedOctetIndex, setSelectedOctetIndex] = useState<number | null>(null);
  const [celebrateTrigger, setCelebrateTrigger] = useState<number>(0);

  // Sound & Modals
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(() => audio.getIsMuted());
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  // Active student object and progress
  const activeStudent = students.find((s) => s.id === activeStudentId) || students[0] || {
    id: 'std_default',
    name: 'طالب الصف العاشر',
    classGroup: 'عاشر 1',
    createdAt: Date.now(),
  };

  const currentStudentProgress = allProgress[activeStudent.id] || getStudentProgress(activeStudent.id);

  const handleSelectStudent = (id: string) => {
    setActiveStudentId(id);
    setActiveStudentIdState(id);
  };

  const handleEnterAsStudent = (studentId: string) => {
    handleSelectStudent(studentId);
    setUserRole('student');
    setActiveTab('learn');
  };

  const handleEnterAsTeacher = () => {
    setUserRole('teacher');
    setActiveTab('teacher');
  };

  const handleLogoutToPortal = () => {
    setUserRole(null);
  };

  const handleToggleSound = () => {
    const muted = audio.toggleMute();
    setIsSoundMuted(muted);
  };

  const handleTriggerCelebrate = () => {
    setCelebrateTrigger((prev) => prev + 1);
  };

  const handleInspectIpIn3D = (ip: string, mode?: 'octets' | 'topology' | 'packets') => {
    setCurrentIp(ip);
    if (mode) setActive3DMode(mode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRecordAnswer = (
    qId: string,
    choice: number,
    isCorrect: boolean,
    isMistakePractice: boolean = false
  ) => {
    const res = recordQuestionAnswer(activeStudent.id, qId, choice, isCorrect, isMistakePractice);
    setAllProgress(getAllProgress());
    return { newlyMastered: res.newlyMastered };
  };

  const handleCompleteLesson = (lessonId: string) => {
    completeLesson(activeStudent.id, lessonId);
    setAllProgress(getAllProgress());
  };

  const handleImportSuccess = (importedStudents: Student[], replaceExisting: boolean) => {
    let nextList: Student[];
    if (replaceExisting) {
      nextList = importedStudents;
    } else {
      // Append non-duplicates
      const existingNames = new Set(students.map((s) => s.name.trim().toLowerCase()));
      const filtered = importedStudents.filter(
        (s) => !existingNames.has(s.name.trim().toLowerCase())
      );
      nextList = [...students, ...filtered];
    }
    saveStudents(nextList);
    setStudents(nextList);
    if (nextList.length > 0) {
      handleSelectStudent(nextList[0].id);
    }
  };

  const handleAddStudent = (newStudentData: Omit<Student, 'id' | 'createdAt'>) => {
    const newStudent: Student = {
      ...newStudentData,
      id: `std_manual_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
    };
    const nextList = [newStudent, ...students];
    saveStudents(nextList);
    setStudents(nextList);
    handleSelectStudent(newStudent.id);
  };

  const handleDeleteStudent = (id: string) => {
    const nextList = students.filter((s) => s.id !== id);
    saveStudents(nextList);
    setStudents(nextList);
    if (activeStudentId === id && nextList.length > 0) {
      handleSelectStudent(nextList[0].id);
    }
  };

  // If user has not chosen role yet, show initial Welcome / Role Selection screen
  if (!userRole) {
    return (
      <PortalEntryScreen
        students={students}
        progressMap={allProgress}
        selectedStudentId={activeStudent.id}
        onSelectStudent={handleSelectStudent}
        onEnterAsStudent={handleEnterAsStudent}
        onEnterAsTeacher={handleEnterAsTeacher}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo',sans-serif]">
      {/* Top Navigation */}
      <Navbar
        students={students}
        activeStudent={activeStudent}
        onSelectStudent={handleSelectStudent}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        progress={currentStudentProgress}
        isSoundMuted={isSoundMuted}
        onToggleSound={handleToggleSound}
        onOpenUploadModal={() => setIsImportModalOpen(true)}
        userRole={userRole}
        onLogoutToPortal={handleLogoutToPortal}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-5 flex flex-col gap-6">
        {/* Persistent 3D Interactive Lab Viewport (with zero occlusion dock) */}
        <section className="flex flex-col items-center w-full">
          {/* 3D Scene Viewport */}
          <div className="w-full h-[360px] sm:h-[420px]">
            <NetworkScene
              currentIp={currentIp}
              activeMode={active3DMode}
              explodedOffset={explodedOffset}
              selectedOctetIndex={selectedOctetIndex}
              onSelectOctet={(idx) => setSelectedOctetIndex(idx)}
              celebrateTrigger={celebrateTrigger}
            />
          </div>

          {/* Unified Collapsible Bottom Dock Controls */}
          <div className="w-full max-w-4xl -mt-6 z-20">
            <DockControls
              currentIp={currentIp}
              onIpChange={setCurrentIp}
              active3DMode={active3DMode}
              onChange3DMode={setActive3DMode}
              explodedOffset={explodedOffset}
              onExplodedChange={setExplodedOffset}
              selectedOctetIndex={selectedOctetIndex}
              onSelectOctet={setSelectedOctetIndex}
            />
          </div>
        </section>

        {/* Tab Specific Workspace */}
        <section className="w-full pt-2">
          {activeTab === 'learn' && (
            <LessonView
              studentId={activeStudent.id}
              progress={currentStudentProgress}
              onRecordAnswer={handleRecordAnswer}
              onCompleteLesson={handleCompleteLesson}
              onInspectIpIn3D={handleInspectIpIn3D}
              onTrigger3DCelebrate={handleTriggerCelebrate}
            />
          )}

          {activeTab === 'quiz' && (
            <QuizView
              studentId={activeStudent.id}
              progress={currentStudentProgress}
              onRecordAnswer={handleRecordAnswer}
              onTrigger3DCelebrate={handleTriggerCelebrate}
              onInspectIpIn3D={handleInspectIpIn3D}
            />
          )}

          {activeTab === 'mistakes' && (
            <MistakeTrainingView
              studentName={activeStudent.name}
              progress={currentStudentProgress}
              onRecordAnswer={handleRecordAnswer}
              onTrigger3DCelebrate={handleTriggerCelebrate}
              onInspectIpIn3D={handleInspectIpIn3D}
              onGoToQuiz={() => setActiveTab('quiz')}
            />
          )}

          {activeTab === '3dlab' && (
            <Open3DLabView
              currentIp={currentIp}
              onIpChange={setCurrentIp}
              active3DMode={active3DMode}
              onChange3DMode={setActive3DMode}
              onSelectOctet={setSelectedOctetIndex}
            />
          )}

          {activeTab === 'teacher' && (
            <TeacherDashboard
              students={students}
              progressMap={allProgress}
              activeStudentId={activeStudent.id}
              onSelectStudent={handleSelectStudent}
              onOpenImportModal={() => setIsImportModalOpen(true)}
              onAddStudent={handleAddStudent}
              onDeleteStudent={handleDeleteStudent}
            />
          )}
        </section>
      </main>

      {/* Excel Upload Modal */}
      <ExcelUploadModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <p>مختبر الشبكات ثلاثي الأبعاد • منهج شبكات الحاسوب للصف العاشر • فئات Class A, B, C وقناع الشبكة والعناوين الخاصة</p>
      </footer>
    </div>
  );
}
