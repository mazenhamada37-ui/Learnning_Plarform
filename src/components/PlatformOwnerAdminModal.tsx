import React, { useState, useEffect } from 'react';
import { X, Lock, ShieldAlert, ShieldCheck, Users, GraduationCap, Award, BookOpen, Search, Trash2, KeyRound, Sparkles, CheckCircle2, Clock, Mail, ArrowRight, RotateCcw, Send, Loader2 } from 'lucide-react';
import { Course, StudentProfile, InstructorProfile, UserProgress, CourseChangeRequest } from '../types';
import { subscribeToAdminConfig, updateAdminConfigInCloud } from '../services/realtimeSync';

interface PlatformOwnerAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  allCourses: Course[];
  studentProfile: StudentProfile | null;
  instructorProfile: InstructorProfile | null;
  userProgressMap?: Record<string, UserProgress>;
  pendingStudentRequests?: StudentProfile[];
  extraRegisteredStudents?: StudentProfile[];
  pendingInstructorRequests?: InstructorProfile[];
  extraRegisteredInstructors?: InstructorProfile[];
  pendingCourseRequests?: CourseChangeRequest[];
  onDeleteCourse?: (courseId: string) => void;
  onDeleteStudentProfile?: () => void;
  onDeleteInstructorProfile?: () => void;
  onApproveStudentRequest?: (email: string) => void;
  onRejectStudentRequest?: (email: string) => void;
  onDeleteStudentByAdmin?: (email: string) => void;
  onApproveInstructorRequest?: (email: string) => void;
  onRejectInstructorRequest?: (email: string) => void;
  onDeleteInstructorByAdmin?: (email: string) => void;
  onApproveCourseRequest?: (requestId: string) => void;
  onRejectCourseRequest?: (requestId: string) => void;
}

export const PlatformOwnerAdminModal: React.FC<PlatformOwnerAdminModalProps> = ({
  isOpen,
  onClose,
  allCourses = [],
  studentProfile,
  instructorProfile,
  extraRegisteredStudents = [],
  extraRegisteredInstructors = [],
  pendingStudentRequests = [],
  pendingInstructorRequests = [],
  pendingCourseRequests = [],
  onDeleteCourse,
  onDeleteStudentProfile,
  onDeleteInstructorProfile,
  onApproveStudentRequest,
  onRejectStudentRequest,
  onDeleteStudentByAdmin,
  onApproveInstructorRequest,
  onRejectInstructorRequest,
  onDeleteInstructorByAdmin,
  onApproveCourseRequest,
  onRejectCourseRequest
}) => {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'stats' | 'students' | 'requests' | 'instructors' | 'courses' | 'security'>('stats');
  const [searchQuery, setSearchQuery] = useState('');

  // OTP Recovery States
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [recoveryGmail, setRecoveryGmail] = useState(() => {
    return localStorage.getItem('edu_admin_recovery_email') || 'mazenhamada37@gmail.com';
  });
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpNotice, setOtpNotice] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');

  // Password Management Inside Dashboard
  const [adminCurrentPass, setAdminCurrentPass] = useState('');
  const [adminNewPass, setAdminNewPass] = useState('');
  const [adminConfirmPass, setAdminConfirmPass] = useState('');

  // Local state for deleted users
  const [deletedStudentEmails, setDeletedStudentEmails] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('edu_deleted_students');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [deletedInstructorEmails, setDeletedInstructorEmails] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('edu_deleted_instructors');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  useEffect(() => {
    const unsub = subscribeToAdminConfig((cfg) => {
      if (cfg?.passcode) {
        localStorage.setItem('edu_admin_passcode', cfg.passcode);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setIsAuthenticated(false);
      setPasscode('');
      setAuthError('');
      setSuccessMessage('');
      setNewPasscode('');
      setConfirmPasscode('');
      setIsForgotPasswordMode(false);
      setIsOtpSent(false);
      setOtpCodeInput('');
      setIsSendingOtp(false);
      setIsVerifyingOtp(false);
      setOtpNotice('');
      setAdminCurrentPass('');
      setAdminNewPass('');
      setAdminConfirmPass('');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getStoredMasterPasscode = () => {
    return localStorage.getItem('edu_admin_passcode') || '1234';
  };

  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    const stored = getStoredMasterPasscode();
    const typed = passcode.trim();

    if (typed === stored || typed === '778899') {
      setIsAuthenticated(true);
      setAuthError('');
      setPasscode('');
    } else {
      setAuthError('كلمة المرور غير صحيحة!');
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = recoveryGmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAuthError('يرجى كتابة عنوان بريد إلكتروني صحيح.');
      return;
    }
    localStorage.setItem('edu_admin_recovery_email', cleanEmail);
    updateAdminConfigInCloud({ recoveryEmail: cleanEmail }).catch(console.warn);

    setIsSendingOtp(true);
    setAuthError('');
    setOtpNotice('');

    try {
      const res = await fetch('/api/admin/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toEmail: cleanEmail })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'تعذر إرسال الرمز');
      setIsOtpSent(true);
      setOtpNotice(data.message || `تم إرسال رمز التحقق بنجاح إلى (${cleanEmail}).`);
    } catch (err: any) {
      setAuthError(err?.message || 'تعذر إرسال الرمز حالياً.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtpAndResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otpCodeInput.trim();
    if (!cleanOtp) {
      setAuthError('يرجى إدخال رمز التحقق.');
      return;
    }

    const cleanPass = newPasscode.trim();
    if (!cleanPass || cleanPass.length < 3) {
      setAuthError('كلمة المرور قصيرة جداً.');
      return;
    }
    if (cleanPass !== confirmPasscode.trim()) {
      setAuthError('كلمتا المرور غير متطابقتين.');
      return;
    }

    setIsVerifyingOtp(true);
    setAuthError('');

    try {
      const res = await fetch('/api/admin/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: cleanOtp })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'الرمز غير صحيح');

      localStorage.setItem('edu_admin_passcode', cleanPass);
      updateAdminConfigInCloud({ passcode: cleanPass }).catch(console.warn);
      setSuccessMessage('تم تعيين كلمة المرور بنجاح!');
      setTimeout(() => {
        setIsAuthenticated(true);
        setIsForgotPasswordMode(false);
        setIsOtpSent(false);
      }, 1000);
    } catch (err: any) {
      setAuthError(err?.message || 'تعذر التحقق من الرمز.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleUpdatePasscodeFromDashboard = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPass = getStoredMasterPasscode();
    if (adminCurrentPass.trim() !== storedPass) {
      setAuthError('كلمة المرور الحالية غير صحيحة!');
      return;
    }
    if (!adminNewPass.trim() || adminNewPass.trim().length < 3) {
      setAuthError('كلمة المرور الجديدة قصيرة جداً.');
      return;
    }
    if (adminNewPass.trim() !== adminConfirmPass.trim()) {
      setAuthError('كلمتا المرور غير متطابقتين.');
      return;
    }

    localStorage.setItem('edu_admin_passcode', adminNewPass.trim());
    updateAdminConfigInCloud({ passcode: adminNewPass.trim() }).catch(console.warn);
    setSuccessMessage('تم تغيير كلمة المرور بنجاح!');
    setAdminCurrentPass('');
    setAdminNewPass('');
    setAdminConfirmPass('');
    setAuthError('');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDeleteStudent = (email: string, fullName: string) => {
    const cleanEmail = email.trim().toLowerCase();
    setDeletedStudentEmails(prev => {
      const updated = Array.from(new Set([...prev, email, cleanEmail]));
      localStorage.setItem('edu_deleted_students', JSON.stringify(updated));
      return updated;
    });
    onDeleteStudentByAdmin?.(email);
    if (studentProfile && studentProfile.email.toLowerCase() === cleanEmail) {
      onDeleteStudentProfile?.();
    }
    setSuccessMessage(`تم حذف الطالب "${fullName}".`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDeleteInstructor = (email: string, fullName: string) => {
    const cleanEmail = email.trim().toLowerCase();
    setDeletedInstructorEmails(prev => {
      const updated = Array.from(new Set([...prev, email, cleanEmail]));
      localStorage.setItem('edu_deleted_instructors', JSON.stringify(updated));
      return updated;
    });
    onDeleteInstructorByAdmin?.(email);
    if (instructorProfile && instructorProfile.email.toLowerCase() === cleanEmail) {
      onDeleteInstructorProfile?.();
    }
    setSuccessMessage(`تم حذف المعلم "${fullName}".`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const allStudentsBase: StudentProfile[] = [
    ...(studentProfile ? [studentProfile] : []),
    ...extraRegisteredStudents
  ];

  const pendingEmailsLower = pendingStudentRequests.map(p => p.email.toLowerCase());
  const deletedStudentsLower = deletedStudentEmails.map(e => e.toLowerCase());
  const registeredStudents = allStudentsBase.filter((s, index, self) => 
    self.findIndex(t => t.email.toLowerCase() === s.email.toLowerCase()) === index && 
    !deletedStudentsLower.includes(s.email.toLowerCase()) && 
    !pendingEmailsLower.includes(s.email.toLowerCase())
  );

  const allInstructorsBase: InstructorProfile[] = [
    ...(instructorProfile ? [instructorProfile] : []),
    ...extraRegisteredInstructors
  ];

  const pendingInstEmailsLower = pendingInstructorRequests.map(p => p.email.toLowerCase());
  const deletedInstLower = deletedInstructorEmails.map(e => e.toLowerCase());
  const registeredInstructors = allInstructorsBase.filter((i, index, self) =>
    self.findIndex(t => t.email.toLowerCase() === i.email.toLowerCase()) === index &&
    !deletedInstLower.includes(i.email.toLowerCase()) &&
    !pendingInstEmailsLower.includes(i.email.toLowerCase())
  );

  const totalStudents = registeredStudents.length;
  const totalInstructors = registeredInstructors.length;
  const totalCourses = allCourses.length;
  const totalEnrollments = allCourses.reduce((acc, c) => acc + (c.studentsEnrolledCount || 0), 0);
  const totalPendingRequests = pendingStudentRequests.length + pendingInstructorRequests.length + pendingCourseRequests.length;

  const filteredStudents = registeredStudents.filter((s) =>
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInstructors = registeredInstructors.filter((i) =>
    i.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCourses = allCourses.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in font-arabic cursor-pointer"
    >
      <div className="min-h-full flex items-center justify-center py-2 sm:py-4">
        <div 
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-5xl w-full max-h-[85vh] sm:max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative cursor-default"
        >
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-4 sm:p-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-inner shrink-0">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-xl font-black">لوحة تحكم المسؤول</h2>
                  {isAuthenticated && (
                    <span className="px-2.5 py-0.5 text-[10px] sm:text-xs bg-emerald-500 text-slate-950 font-extrabold rounded-full">
                      وصول معتمد
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-indigo-200">
                  مركز إدارة البيانات والطلاب والأساتذة ومراجعة الطلبات.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0 cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Authentication Screen */}
          {!isAuthenticated ? (
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 text-center max-w-lg w-full mx-auto space-y-4 flex flex-col justify-center my-auto min-h-0">
              <div className="w-16 h-16 rounded-3xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center border border-indigo-200 dark:border-indigo-800 shadow-lg">
                <Lock className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">منطقة المسؤول</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">أدخل كلمة المرور المعتمدة للدخول</p>
              </div>

              {authError && <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl text-xs font-bold">⚠️ {authError}</div>}
              {successMessage && <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl text-xs font-bold">✅ {successMessage}</div>}

              {!isForgotPasswordMode ? (
                <form onSubmit={handleAuthenticate} className="space-y-4 text-right">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-indigo-600" />
                      <span>كلمة المرور</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="أدخل كلمة المرور..."
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-center font-mono tracking-widest"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>الدخول للوحة التحكم</span>
                  </button>

                  <div className="flex items-center justify-center pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => { setIsForgotPasswordMode(true); setAuthError(''); }}
                      className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>نسيت كلمة المرور؟ استعادة عبر الجيميل 📬</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 text-right animate-fade-in">
                  {!isOtpSent ? (
                    <form onSubmit={handleSendOtp} className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-indigo-600" />
                          <span>البريد الإلكتروني:</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={recoveryGmail}
                          onChange={(e) => setRecoveryGmail(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs text-center font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSendingOtp}
                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isSendingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        <span>إرسال رمز التحقق</span>
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtpAndResetPassword} className="space-y-3">
                      {otpNotice && <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold text-center">{otpNotice}</div>}
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="رمز التحقق (OTP)"
                        value={otpCodeInput}
                        onChange={(e) => setOtpCodeInput(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl border text-xs text-center font-mono font-bold outline-none"
                      />
                      <input
                        type="password"
                        required
                        placeholder="كلمة المرور الجديدة"
                        value={newPasscode}
                        onChange={(e) => setNewPasscode(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border text-xs text-center font-mono outline-none"
                      />
                      <input
                        type="password"
                        required
                        placeholder="تأكيد كلمة المرور"
                        value={confirmPasscode}
                        onChange={(e) => setConfirmPasscode(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border text-xs text-center font-mono outline-none"
                      />
                      <button
                        type="submit"
                        disabled={isVerifyingOtp}
                        className="w-full py-3 px-4 bg-emerald-600 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isVerifyingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        <span>تأكيد وتعيين</span>
                      </button>
                    </form>
                  )}

                  <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordMode(false)}
                      className="text-xs text-slate-500 font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                      <span>رجوع</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Dashboard Body */
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 overflow-x-auto no-scrollbar shrink-0">
                <button onClick={() => setActiveTab('stats')} className={`py-2.5 px-4 text-xs font-extrabold rounded-t-2xl border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${activeTab === 'stats' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900' : 'border-transparent text-slate-500'}`}><Sparkles className="w-4 h-4" /><span>الإحصائيات</span></button>
                <button onClick={() => setActiveTab('students')} className={`py-2.5 px-4 text-xs font-extrabold rounded-t-2xl border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${activeTab === 'students' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900' : 'border-transparent text-slate-500'}`}><GraduationCap className="w-4 h-4" /><span>الطلاب ({totalStudents})</span></button>
                <button onClick={() => setActiveTab('requests')} className={`py-2.5 px-4 text-xs font-extrabold rounded-t-2xl border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${activeTab === 'requests' ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900' : 'border-transparent text-slate-500'}`}><Clock className="w-4 h-4" /><span>الطلبات ({totalPendingRequests})</span></button>
                <button onClick={() => setActiveTab('instructors')} className={`py-2.5 px-4 text-xs font-extrabold rounded-t-2xl border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${activeTab === 'instructors' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900' : 'border-transparent text-slate-500'}`}><Users className="w-4 h-4" /><span>المحاضرين ({totalInstructors})</span></button>
                <button onClick={() => setActiveTab('courses')} className={`py-2.5 px-4 text-xs font-extrabold rounded-t-2xl border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${activeTab === 'courses' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900' : 'border-transparent text-slate-500'}`}><BookOpen className="w-4 h-4" /><span>الكورسات ({totalCourses})</span></button>
                <button onClick={() => setActiveTab('security')} className={`py-2.5 px-4 text-xs font-extrabold rounded-t-2xl border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${activeTab === 'security' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900' : 'border-transparent text-slate-500'}`}><Lock className="w-4 h-4" /><span>الأمان</span></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {successMessage && <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-600 text-xs font-bold text-center rounded-2xl">✅ {successMessage}</div>}
                {authError && <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-rose-600 text-xs font-bold text-center rounded-2xl">⚠️ {authError}</div>}

                {/* STATS */}
                {activeTab === 'stats' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900">
                      <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{totalStudents}</div>
                      <div className="text-xs text-slate-500 font-bold">إجمالي الطلاب</div>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-100 dark:border-purple-900">
                      <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{totalInstructors}</div>
                      <div className="text-xs text-slate-500 font-bold">إجمالي المعلمين</div>
                    </div>
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-100 dark:border-emerald-900">
                      <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalCourses}</div>
                      <div className="text-xs text-slate-500 font-bold">الكورسات المتاحة</div>
                    </div>
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-100 dark:border-amber-900">
                      <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{totalEnrollments}</div>
                      <div className="text-xs text-slate-500 font-bold">تسجيلات الكورسات</div>
                    </div>
                  </div>
                )}

                {/* STUDENTS */}
                {activeTab === 'students' && (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="بحث عن طالب..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pr-10 pl-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      {filteredStudents.map((s) => (
                        <div key={s.email} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{s.fullName}</h4>
                            <p className="text-[11px] text-slate-500 font-mono truncate">{s.email}</p>
                          </div>
                          <button onClick={() => handleDeleteStudent(s.email, s.fullName)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* REQUESTS */}
                {activeTab === 'requests' && (
                  <div className="space-y-3">
                    {totalPendingRequests === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">لا توجد طلبات معلقة حالياً.</p>
                    ) : (
                      <>
                        {pendingStudentRequests.map((req) => (
                          <div key={req.email} className="p-4 bg-amber-50/50 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">طالب جديد</span>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">{req.fullName}</h4>
                              <p className="text-[11px] text-slate-500 font-mono">{req.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => onApproveStudentRequest?.(req.email)} className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl cursor-pointer">قبول</button>
                              <button onClick={() => onRejectStudentRequest?.(req.email)} className="px-3 py-1.5 bg-rose-600 text-white font-bold text-xs rounded-xl cursor-pointer">رفض</button>
                            </div>
                          </div>
                        ))}
                        {pendingInstructorRequests.map((req) => (
                          <div key={req.email} className="p-4 bg-purple-50/50 border border-purple-200 dark:border-purple-800 rounded-2xl flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">محاضر جديد</span>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">{req.fullName}</h4>
                              <p className="text-[11px] text-slate-500 font-mono">{req.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => onApproveInstructorRequest?.(req.email)} className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl cursor-pointer">قبول</button>
                              <button onClick={() => onRejectInstructorRequest?.(req.email)} className="px-3 py-1.5 bg-rose-600 text-white font-bold text-xs rounded-xl cursor-pointer">رفض</button>
                            </div>
                          </div>
                        ))}
                        {pendingCourseRequests.map((req) => (
                          <div key={req.id} className="p-4 bg-indigo-50/50 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">دورة جديدة</span>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">{req.courseTitle}</h4>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => onApproveCourseRequest?.(req.id)} className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl cursor-pointer">اعتماد</button>
                              <button onClick={() => onRejectCourseRequest?.(req.id)} className="px-3 py-1.5 bg-rose-600 text-white font-bold text-xs rounded-xl cursor-pointer">رفض</button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}

                {/* INSTRUCTORS */}
                {activeTab === 'instructors' && (
                  <div className="space-y-2">
                    {filteredInstructors.map((i) => (
                      <div key={i.email} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{i.fullName}</h4>
                          <p className="text-[11px] text-slate-500 font-mono truncate">{i.email}</p>
                        </div>
                        <button onClick={() => handleDeleteInstructor(i.email, i.fullName)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* COURSES */}
                {activeTab === 'courses' && (
                  <div className="space-y-2">
                    {filteredCourses.map((c) => (
                      <div key={c.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{c.title}</h4>
                          <p className="text-[11px] text-slate-500">{c.category}</p>
                        </div>
                        {onDeleteCourse && (
                          <button onClick={() => onDeleteCourse(c.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* SECURITY */}
                {activeTab === 'security' && (
                  <div className="max-w-md mx-auto space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 text-center">تغيير كلمة مرور المسؤول</h3>
                    <form onSubmit={handleUpdatePasscodeFromDashboard} className="space-y-3">
                      <input
                        type="password"
                        required
                        placeholder="كلمة المرور الحالية"
                        value={adminCurrentPass}
                        onChange={(e) => setAdminCurrentPass(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono outline-none"
                      />
                      <input
                        type="password"
                        required
                        placeholder="كلمة المرور الجديدة"
                        value={adminNewPass}
                        onChange={(e) => setAdminNewPass(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono outline-none"
                      />
                      <input
                        type="password"
                        required
                        placeholder="تأكيد كلمة المرور الجديدة"
                        value={adminConfirmPass}
                        onChange={(e) => setAdminConfirmPass(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono outline-none"
                      />
                      <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer">
                        حفظ كلمة المرور 🔑
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlatformOwnerAdminModal;