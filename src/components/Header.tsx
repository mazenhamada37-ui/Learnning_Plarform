import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  UserCheck, 
  Plus, 
  BookOpen, 
  Ribbon, 
  Search, 
  ShieldCheck,
  GraduationCap,
  Menu,
  X,
  ArrowDown,
  Sparkles
} from 'lucide-react';
import { StudentProfile, InstructorProfile, Course } from '../types';
import { getCourseSearchScore } from '../utils/searchUtils';

export interface HeaderProps {
  currentRole?: 'student' | 'teacher' | 'instructor' | 'admin';
  onRoleChange?: (role: any) => void;
  activeTab?: string;
  setActiveTab?: (tab: 'catalog' | 'dashboard' | 'instructor') => void;
  onOpenAiGenerator?: () => void;
  onOpenAiTutor?: () => void;
  onOpenAddCourseModal?: () => void;
  onOpenStudentProfile?: () => void;
  onOpenAddAccount?: () => void;
  onOpenCatalog?: () => void;
  onOpenDashboard?: () => void;
  onSearch?: (query: string) => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  courses?: Course[];
  onSelectCourse?: (course: Course) => void;
  studentProfile?: StudentProfile | null;
  instructorProfile?: InstructorProfile | null;
  userName?: string;
  onOpenRegistrationModal?: () => void;
  onOpenInstructorRegistrationModal?: () => void;
  onOpenAddUserModal?: () => void;
  onOpenAdminModal?: () => void;
  onUserProfileClick?: () => void;
  onAddAccount?: () => void;
  onOpenCourseCatalog?: () => void;
  onOpenDashboardAndCertificates?: () => void;
  darkMode?: boolean;
  setDarkMode?: (val: boolean) => void;
  completedCoursesCount?: number;
  streakDays?: number;
  extraRegisteredStudents?: StudentProfile[];
  extraRegisteredInstructors?: InstructorProfile[];
  onSelectActiveStudent?: (student: StudentProfile) => void;
  onSelectActiveInstructor?: (instructor: InstructorProfile) => void;
  onLogoutStudent?: () => void;
  onLogoutInstructor?: () => void;
  isOwnerSession?: boolean;
  onSelectOwner?: () => void;
  isCloudSynced?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole = 'student',
  onRoleChange,
  activeTab = 'catalog',
  setActiveTab,
  onOpenAiTutor,
  onOpenStudentProfile,
  onOpenAddAccount,
  onOpenCatalog,
  onOpenDashboard,
  onSearch,
  searchQuery = '',
  setSearchQuery,
  courses = [],
  onSelectCourse,
  studentProfile,
  instructorProfile,
  userName = 'Mazen Hamada',
  onOpenRegistrationModal,
  onOpenInstructorRegistrationModal,
  onOpenAddUserModal,
  onOpenAdminModal,
  onUserProfileClick,
  onAddAccount,
  onOpenCourseCatalog,
  onOpenDashboardAndCertificates,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current && 
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute matched/relevant courses for dropdown with accurate relevance ranking
  const matchedCourses = React.useMemo(() => {
    if (!searchQuery.trim() || !courses.length) return [];
    return courses
      .map(course => ({
        course,
        score: getCourseSearchScore(course, searchQuery)
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.course)
      .slice(0, 6); // Top 6 most relevant
  }, [searchQuery, courses]);

  // Smooth scroll down to catalog section on Enter
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsSearchFocused(false);
      if (activeTab !== 'catalog' && setActiveTab) {
        setActiveTab('catalog');
      }
      setTimeout(() => {
        const el = document.getElementById('catalog-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 600, behavior: 'smooth' });
        }
      }, 50);
    } else if (e.key === 'Escape') {
      setIsSearchFocused(false);
    }
  };

  // When clicking a course from the search dropdown
  const handleSelectDropdownCourse = (course: Course) => {
    setIsSearchFocused(false);
    if (onSelectCourse) {
      onSelectCourse(course);
    } else {
      if (setActiveTab) setActiveTab('catalog');
      const el = document.getElementById('catalog-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Dynamic display name based on active role
  const studentDisplayName = studentProfile?.fullName || userName || 'Mazen Hamada';
  const instructorDisplayName = instructorProfile?.fullName || 'أستاذ محاضر';
  const isStudentActive = currentRole === 'student';
  const isInstructorActive = currentRole === 'instructor' || currentRole === 'teacher';

  // 1. Switch to student
  const handleSwitchToStudent = () => {
    if (onRoleChange) onRoleChange('student');
    if (setActiveTab) setActiveTab('catalog');
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 2. Switch to instructor
  const handleSwitchToInstructor = () => {
    if (onRoleChange) onRoleChange('instructor');
    if (setActiveTab) setActiveTab('instructor');
    setMobileMenuOpen(false);
    if (!instructorProfile && onOpenInstructorRegistrationModal) {
      onOpenInstructorRegistrationModal();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 3. Add account (+)
  const handleAddAccount = () => {
    setMobileMenuOpen(false);
    if (onOpenAddUserModal) {
      onOpenAddUserModal();
    } else if (onAddAccount) {
      onAddAccount();
    } else if (onOpenAddAccount) {
      onOpenAddAccount();
    }
  };

  // 4. User profile (Student or Instructor depending on active role)
  const handleUserProfile = () => {
    setMobileMenuOpen(false);
    if (isInstructorActive) {
      if (onOpenInstructorRegistrationModal) {
        onOpenInstructorRegistrationModal();
      }
    } else {
      if (onOpenStudentProfile) {
        onOpenStudentProfile();
      } else if (onUserProfileClick) {
        onUserProfileClick();
      } else if (onOpenRegistrationModal) {
        onOpenRegistrationModal();
      }
    }
  };

  // 5. Smart AI Tutor (المعلم الذكي)
  const handleAiTutor = () => {
    setMobileMenuOpen(false);
    if (onOpenAiTutor) {
      onOpenAiTutor();
    }
  };

  // 6. Admin (المسؤول)
  const handleAdmin = () => {
    setMobileMenuOpen(false);
    if (onOpenAdminModal) {
      onOpenAdminModal();
    } else if (onRoleChange) {
      onRoleChange('admin');
    }
  };

  // 7. Course Catalog (كتالوج الدورات)
  const handleCatalog = () => {
    setMobileMenuOpen(false);
    if (setActiveTab) setActiveTab('catalog');
    if (onOpenCatalog) onOpenCatalog();
    if (onOpenCourseCatalog) onOpenCourseCatalog();
    const el = document.getElementById('catalog-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 8. Dashboard & Certificates (لوحتي وشهادتي)
  const handleDashboard = () => {
    setMobileMenuOpen(false);
    if (setActiveTab) setActiveTab('dashboard');
    if (onOpenDashboard) onOpenDashboard();
    if (onOpenDashboardAndCertificates) onOpenDashboardAndCertificates();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Instructor Studio Tab Handler
  const handleInstructorStudio = () => {
    setMobileMenuOpen(false);
    if (setActiveTab) setActiveTab('instructor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 9. Search handler
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (setSearchQuery) setSearchQuery(val);
    if (onSearch) onSearch(val);
    if (val.trim() && activeTab !== 'catalog' && setActiveTab) {
      setActiveTab('catalog');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#090d16] border-b border-slate-800/80 font-arabic text-white select-none w-full" dir="rtl">
      {/* Top Navbar Row */}
      <div className="w-full px-3 md:px-5 h-16 flex items-center justify-between gap-3">
        
        {/* ========================================================= */}
        {/* DESKTOP VIEW (Visible on Screens >= md)                   */}
        {/* ========================================================= */}
        <div className="hidden md:flex items-center gap-2 lg:gap-3 flex-1 min-w-0">
          
          {/* Action Buttons Group (Navigation & Roles) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* 1. Student / Instructor Toggle */}
            <div className="flex bg-[#121929] p-0.5 sm:p-1 rounded-xl border border-slate-800/80 shrink-0">
              <button
                type="button"
                id="header-btn-student"
                onClick={handleSwitchToStudent}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isStudentActive
                    ? 'bg-slate-700/90 text-white border border-slate-600/50 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                طالب
              </button>
              <button
                type="button"
                id="header-btn-instructor"
                onClick={handleSwitchToInstructor}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isInstructorActive
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                محاضر
              </button>
            </div>

            {/* 2. Add Account Button (+) */}
            <button
              type="button"
              id="header-btn-add-account"
              onClick={handleAddAccount}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-500 hover:brightness-105 active:scale-95 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer shrink-0 whitespace-nowrap"
              title="إضافة حساب جديد (طالب أو محاضر)"
            >
              <span>إضافة حساب</span>
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
            </button>

            {/* 3. Role-Specific User Profile Button */}
            {isInstructorActive ? (
              <button
                type="button"
                id="header-btn-instructor-profile"
                onClick={handleUserProfile}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-[#2b1704] border border-amber-500/60 text-amber-300 hover:bg-[#3d2006] hover:border-amber-400 active:scale-95 text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap"
                title="بيانات وحساب المحاضر"
              >
                <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                <span className="max-w-[130px] truncate">{instructorDisplayName}</span>
              </button>
            ) : (
              <button
                type="button"
                id="header-btn-user-profile"
                onClick={handleUserProfile}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-[#092220] border border-emerald-500/50 text-emerald-400 hover:bg-[#0d2d2a] hover:border-emerald-400 active:scale-95 text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap"
                title="بيانات وحساب الطالب"
              >
                <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
                <span className="max-w-[130px] truncate">{studentDisplayName}</span>
              </button>
            )}

            {/* 4. Smart AI Tutor (المعلم الذكي) */}
            <button
              type="button"
              id="header-btn-ai-tutor"
              onClick={handleAiTutor}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#092225] border border-emerald-500/40 text-emerald-400 hover:bg-[#0d2d31] hover:border-emerald-400 active:scale-95 text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap"
              title="المعلم الذكي والمساعد الافتراضي"
            >
              <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
              <span>المعلم الذكي</span>
            </button>

            {/* 5. Admin / Platform Owner (المسؤول) */}
            <button
              type="button"
              id="header-btn-admin"
              onClick={handleAdmin}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#280c3a] border border-purple-500/50 text-purple-300 hover:bg-[#34114d] hover:border-purple-400 active:scale-95 text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap"
              title="لوحة تحكم المسؤول ومالك المنصة"
            >
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 shrink-0" />
              <span>المسؤول</span>
            </button>

            {/* 6 & 7. Role-Specific Navigation Buttons */}
            {isInstructorActive ? (
              /* Instructor Navigation: استوديو المحاضر */
              <button
                type="button"
                id="header-btn-instructor-studio"
                onClick={handleInstructorStudio}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === 'instructor'
                    ? 'bg-amber-950/80 border-amber-500/70 text-amber-300 shadow-sm'
                    : 'bg-[#121929] border-slate-700/80 text-amber-400 hover:bg-[#1a233a] hover:border-amber-500/50'
                }`}
                title="لوحة تحكم وإدارة دورات المحاضر"
              >
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                <span>استوديو المحاضر</span>
              </button>
            ) : (
              /* Student Navigation: كتالوج الدورات + لوحتي وشهادتي */
              <>
                <button
                  type="button"
                  id="header-btn-catalog"
                  onClick={handleCatalog}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                    activeTab === 'catalog'
                      ? 'bg-[#0d1f35] border-emerald-500/70 text-emerald-300 shadow-sm'
                      : 'bg-[#0d1627] border-slate-700/80 text-emerald-400 hover:bg-[#131f37] hover:border-emerald-500/50'
                  }`}
                  title="تصفح جميع الدورات والمناهج"
                >
                  <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
                  <span>كتالوج الدورات</span>
                </button>

                <button
                  type="button"
                  id="header-btn-dashboard"
                  onClick={handleDashboard}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                    activeTab === 'dashboard'
                      ? 'bg-[#0d1f35] border-amber-500/70 text-amber-300 shadow-sm'
                      : 'bg-[#0d1627] border-slate-700/80 text-slate-300 hover:bg-[#131f37] hover:text-white hover:border-slate-600'
                  }`}
                  title="لوحة الطالب ومتابعة التقدم والشهادات"
                >
                  <Ribbon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
                  <span>لوحتي وشهادتي</span>
                </button>
              </>
            )}
          </div>

        </div>

        {/* ========================================================= */}
        {/* MOBILE COMPACT CONTROLS (< md screens)                    */}
        {/* Shows Three Lines Menu Button (تلات شرط)                  */}
        {/* ========================================================= */}
        <div className="flex md:hidden items-center gap-2">
          {/* Three Lines Menu Toggle Button (زر التلات شرط) */}
          <button
            type="button"
            id="header-mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-9 h-9 rounded-xl bg-[#121929] border border-slate-700/80 hover:border-emerald-500/60 text-slate-200 hover:text-emerald-400 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
            aria-label="القائمة"
            title="القائمة"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-rose-400" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Platform Brand (Left Side) */}
        <div 
          onClick={handleCatalog}
          className="flex items-center gap-2 shrink-0 pl-1 cursor-pointer select-none"
        >
          <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-md font-bold hidden md:inline">
            الذكية
          </span>
          <span className="font-extrabold text-white text-sm sm:text-base tracking-tight flex items-center gap-1 whitespace-nowrap">
            منصة <span className="text-emerald-400">تعلَّم</span>
          </span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-md shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* DEDICATED FULL-WIDTH SEARCH ROW (سطر كامل مخصص للبحث بتصميم متقن وعصري) */}
      {/* ========================================================= */}
      <div className="w-full bg-[#080d19]/95 backdrop-blur-md border-t border-slate-800/80 px-3 sm:px-5 py-2.5 shadow-sm">
        <div ref={searchContainerRef} className="relative w-full max-w-5xl mx-auto">
          
          {/* Outer Search Bar Container */}
          <div 
            className={`relative flex items-center w-full rounded-2xl transition-all duration-200 border ${
              isSearchFocused
                ? 'bg-[#0f172a] border-emerald-500/70 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/40'
                : 'bg-[#0c1322] border-slate-750 hover:border-slate-600 shadow-inner'
            }`}
          >
            {/* Search Icon with Glowing Subtle State */}
            <div className="pr-3.5 pl-1 flex items-center justify-center shrink-0 pointer-events-none">
              <Search className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-colors duration-200 ${
                isSearchFocused ? 'text-emerald-400' : 'text-slate-400'
              }`} />
            </div>

            {/* Main Search Input */}
            <input
              type="text"
              id="header-search-input"
              placeholder="ابحث عن اسم الدورة، التخصص (برمجة، ذكاء اصطناعي، لغات...)، أو المحاضر..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setIsSearchFocused(true)}
              onKeyDown={handleSearchKeyDown}
              className="w-full h-10 sm:h-11 bg-transparent text-sm text-slate-100 placeholder-slate-400/80 focus:outline-none pr-1 pl-2 font-normal"
            />

            {/* Trailing Controls (Clear + Enter Button) */}
            <div className="pl-2 pr-1.5 flex items-center gap-1.5 shrink-0">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    if (setSearchQuery) setSearchQuery('');
                    if (onSearch) onSearch('');
                  }}
                  className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer text-xs"
                  title="مسح نص البحث"
                  aria-label="مسح البحث"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Instant Search / Go to Catalog Button */}
              <button
                type="button"
                onClick={() => {
                  setIsSearchFocused(false);
                  if (activeTab !== 'catalog' && setActiveTab) setActiveTab('catalog');
                  setTimeout(() => {
                    const el = document.getElementById('catalog-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    else window.scrollTo({ top: 600, behavior: 'smooth' });
                  }, 50);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 hover:border-emerald-500/60 text-emerald-300 font-bold text-xs transition-all cursor-pointer active:scale-95 shrink-0 select-none"
                title="اضغط للانتقال للكتالوج وتصفح النتائج"
              >
                <span>بحث</span>
                <kbd className="hidden sm:inline-block px-1 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/30 font-mono text-[10px] text-emerald-200">
                  Enter ↵
                </kbd>
              </button>
            </div>
          </div>

          {/* Quick topic tags row under the search bar for instant filtering */}
          <div className="hidden sm:flex items-center gap-1.5 pt-1.5 px-1 text-[11px] text-slate-400 overflow-x-auto no-scrollbar">
            <span className="shrink-0 text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>مواضيع شائعة:</span>
            </span>
            {[
              { label: 'الذكاء الاصطناعي', query: 'ذكاء' },
              { label: 'بايثون', query: 'Python' },
              { label: 'تطوير الويب', query: 'ويب' },
              { label: 'React', query: 'React' },
              { label: 'تصميم UI/UX', query: 'تصميم' },
              { label: 'الأمن السيبراني', query: 'أمن' }
            ].map((tag) => (
              <button
                key={tag.label}
                type="button"
                onClick={() => {
                  if (setSearchQuery) setSearchQuery(tag.query);
                  if (onSearch) onSearch(tag.query);
                  if (activeTab !== 'catalog' && setActiveTab) setActiveTab('catalog');
                  setIsSearchFocused(false);
                  setTimeout(() => {
                    const el = document.getElementById('catalog-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 50);
                }}
                className="shrink-0 px-2 py-0.5 rounded-md bg-[#121929]/80 hover:bg-emerald-500/15 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-300 transition-all cursor-pointer"
              >
                {tag.label}
              </button>
            ))}
          </div>

          {/* Live Search Suggestions Dropdown */}
          {isSearchFocused && searchQuery.trim().length > 0 && (
            <div 
              className="absolute top-full mt-2 right-0 left-0 bg-[#0d1627]/98 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in"
              dir="rtl"
            >
              {/* Header inside dropdown */}
              <div className="p-3 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400 bg-[#090f1d]/90">
                <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                  <span>أفضل النتائج المقترحة ({matchedCourses.length})</span>
                </span>
                <span className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400">
                  <span>اضغط</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-300">Enter ↵</kbd>
                  <span>للنزول للكتالوج</span>
                </span>
              </div>

              {matchedCourses.length > 0 ? (
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                  {matchedCourses.map((course) => (
                    <div
                      key={course.id}
                      onClick={() => handleSelectDropdownCourse(course)}
                      className="p-3 hover:bg-slate-800/60 transition-all cursor-pointer flex items-center gap-3 text-right group"
                    >
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-14 h-11 rounded-xl object-cover border border-slate-750 shrink-0 group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 truncate transition-colors">
                          {course.title}
                        </h4>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {course.instructor.name} • <span className="text-emerald-400 font-medium">{course.category}</span>
                        </p>
                      </div>
                      <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700 shrink-0">
                        {course.level}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  لا توجد نتائج مطابقة مباشرة لـ &ldquo;{searchQuery}&rdquo;، اضغط <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono text-xs">Enter ↵</kbd> للبحث الشامل في الكتالوج
                </div>
              )}

              {/* Quick Scroll-Down Footer Button */}
              <button
                type="button"
                onClick={() => {
                  setIsSearchFocused(false);
                  if (setActiveTab) setActiveTab('catalog');
                  const el = document.getElementById('catalog-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  else window.scrollTo({ top: 600, behavior: 'smooth' });
                }}
                className="w-full py-2.5 bg-[#121b2d] hover:bg-emerald-950/60 border-t border-slate-800 text-emerald-400 hover:text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ArrowDown className="w-4 h-4 animate-bounce" />
                <span>عرض جميع نتائج البحث في الكتالوج بالأسفل</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* MOBILE EXPANDED DRAWER MENU (عند فتح التلات شرط للشاشات الصغيرة فقط) */}
      {/* ========================================================= */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800/90 bg-[#090d16]/98 backdrop-blur-md px-4 py-4 space-y-3 animate-fade-in shadow-2xl">
          
          {/* 1. Active Role Switcher (طالب | محاضر) */}
          <div className="flex bg-[#121929] p-1 rounded-xl border border-slate-800 w-full">
            <button
              type="button"
              onClick={handleSwitchToStudent}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all text-center ${
                isStudentActive
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              طالب
            </button>
            <button
              type="button"
              onClick={handleSwitchToInstructor}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all text-center ${
                isInstructorActive
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              محاضر
            </button>
          </div>

          {/* 2. User Profile Card */}
          <div 
            onClick={handleUserProfile}
            className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
              isInstructorActive
                ? 'bg-[#2b1704] border-amber-500/50 hover:border-amber-400'
                : 'bg-[#092220] border-emerald-500/40 hover:border-emerald-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                isInstructorActive ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {isInstructorActive ? (
                  <GraduationCap className="w-4 h-4" />
                ) : (
                  <UserCheck className="w-4 h-4" />
                )}
              </div>
              <div className="text-right">
                <div className={`text-xs font-bold ${isInstructorActive ? 'text-amber-300' : 'text-emerald-300'}`}>
                  {isInstructorActive ? instructorDisplayName : studentDisplayName}
                </div>
                <div className="text-[10px] text-slate-400">
                  {isInstructorActive ? 'الملف الشخصي وإدارة المحاضر' : 'الملف الشخصي والكورسات المسجلة'}
                </div>
              </div>
            </div>
            <span className={`text-xs font-bold underline ${isInstructorActive ? 'text-amber-400' : 'text-emerald-400'}`}>
              عرض
            </span>
          </div>

          {/* 3. Action Grid according to Role */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {isInstructorActive ? (
              /* Instructor Studio Quick Link */
              <button
                type="button"
                onClick={handleInstructorStudio}
                className={`col-span-2 p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 justify-center transition-all ${
                  activeTab === 'instructor'
                    ? 'bg-amber-950/80 border-amber-500/70 text-amber-300'
                    : 'bg-[#121929] border-slate-700/80 text-amber-400 hover:bg-[#1a233a]'
                }`}
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>استوديو المحاضر (إدارة وتعديل الكورسات)</span>
              </button>
            ) : (
              /* Student Catalog & Dashboard */
              <>
                <button
                  type="button"
                  onClick={handleCatalog}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 justify-center transition-all ${
                    activeTab === 'catalog'
                      ? 'bg-[#0d1f35] border-emerald-500/70 text-emerald-300'
                      : 'bg-[#0d1627] border-slate-700/80 text-emerald-400 hover:bg-[#131f37]'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>كتالوج الدورات</span>
                </button>

                <button
                  type="button"
                  onClick={handleDashboard}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 justify-center transition-all ${
                    activeTab === 'dashboard'
                      ? 'bg-[#0d1f35] border-amber-500/70 text-amber-300'
                      : 'bg-[#0d1627] border-slate-700/80 text-slate-300 hover:bg-[#131f37]'
                  }`}
                >
                  <Ribbon className="w-4 h-4 text-slate-400" />
                  <span>لوحتي وشهادتي</span>
                </button>
              </>
            )}

            {/* Smart AI Tutor */}
            <button
              type="button"
              onClick={handleAiTutor}
              className="p-2.5 rounded-xl bg-[#092225] border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-1.5 justify-center hover:bg-[#0d2d31] transition-all"
            >
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>المعلم الذكي</span>
            </button>

            {/* Admin */}
            <button
              type="button"
              onClick={handleAdmin}
              className="p-2.5 rounded-xl bg-[#280c3a] border border-purple-500/50 text-purple-300 text-xs font-bold flex items-center gap-1.5 justify-center hover:bg-[#34114d] transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>المسؤول</span>
            </button>
          </div>

          {/* 4. Add Account Button */}
          <button
            type="button"
            onClick={handleAddAccount}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>إضافة حساب جديد (طالب أو محاضر)</span>
          </button>

        </div>
      )}

    </header>
  );
};

export default Header;
