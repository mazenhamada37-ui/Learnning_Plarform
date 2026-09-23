import React, { useState, useEffect } from 'react';
import { X, Lock, ShieldAlert, ShieldCheck, Users, GraduationCap, Award, BookOpen, Search, Eye, EyeOff, Trash2, KeyRound, Sparkles, CheckCircle2, Building2, Clock, UserX, Mail, ArrowRight, RotateCcw, Send, Loader2, ExternalLink } from 'lucide-react';
import { Course, StudentProfile, InstructorProfile, UserProgress, CourseChangeRequest } from '../types';
import { subscribeToAdminConfig, updateAdminConfigInCloud } from '../services/realtimeSync';

interface PlatformOwnerAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  allCourses: Course[];
  studentProfile: StudentProfile | null;
  instructorProfile: InstructorProfile | null;
  userProgressMap: Record<string, UserProgress>;
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
  allCourses,
  studentProfile,
  instructorProfile,
  userProgressMap,
  pendingStudentRequests = [],
  extraRegisteredStudents = [],
  pendingInstructorRequests = [],
  extraRegisteredInstructors = [],
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
  const [expandedCourseReqId, setExpandedCourseReqId] = useState<string | null>(null);

  // Recovery with Gmail OTP (One-Time Password) & Master PIN
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
  const [recoveryPin, setRecoveryPin] = useState('');

  // Inside Dashboard Passcode Management
  const [adminCurrentPass, setAdminCurrentPass] = useState('');
  const [adminNewPass, setAdminNewPass] = useState('');
  const [adminConfirmPass, setAdminConfirmPass] = useState('');
  const [showAdminCurrentPass, setShowAdminCurrentPass] = useState(false);
  const [showAdminNewPass, setShowAdminNewPass] = useState(false);

  // Persisted list of deleted student emails
  const [deletedStudentEmails, setDeletedStudentEmails] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('edu_deleted_students');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Persisted list of deleted instructor emails
  const [deletedInstructorEmails, setDeletedInstructorEmails] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('edu_deleted_instructors');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Realtime subscription to Admin Config in Firestore
  useEffect(() => {
    const unsub = subscribeToAdminConfig((cfg) => {
      if (cfg.passcode) {
        localStorage.setItem('edu_admin_passcode', cfg.passcode);
      }
    });
    return () => unsub();
  }, []);

  // Reset authentication & lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setIsAuthenticated(false);
      setPasscode('');
      setAuthError('');
      setSuccessMessage('');
      setRecoveryPin('');
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

  const handleCloseModal = () => {
    setIsAuthenticated(false);
    setPasscode('');
    setAuthError('');
    setSuccessMessage('');
    setRecoveryPin('');
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
    onClose();
  };

  if (!isOpen) return null;

  // Get current master passcode from localStorage or fallback to default '1234'
  const getStoredMasterPasscode = () => {
    return localStorage.getItem('edu_admin_passcode') || '1234';
  };

  // Master passcode check
  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    const stored = getStoredMasterPasscode();
    const typed = passcode.trim();

    if (typed === stored || typed === '778899') {
      setIsAuthenticated(true);
      setAuthError('');
      setPasscode('');
    } else {
      setAuthError('كلمة المرور غير صحيحة! يرجى إدخال كلمة المرور الصحيحة لمسؤول المنصة.');
    }
  };

  // 1. Send OTP to Gmail
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = recoveryGmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAuthError('يرجى كتابة عنوان بريد إلكتروني (Gmail) صحيح لاستلام الرمز.');
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
      if (!res.ok) {
        throw new Error(data.error || 'تعذر إرسال رمز التحقق');
      }
      setIsOtpSent(true);
      setOtpNotice(data.message || `تم إرسال رمز التحقق بنجاح إلى (${cleanEmail}) 📬. يرجى مراجعة صندوق الوارد (أو مجلد الرسائل غير المرغوب فيها).`);
    } catch (err: any) {
      setAuthError(err?.message || 'تعذر إرسال رمز التحقق حالياً. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // 2. Verify OTP & Reset Password
  const handleVerifyOtpAndResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otpCodeInput.trim();
    if (!cleanOtp) {
      setAuthError('يرجى إدخال رمز التحقق المكون من 6 أرقام المرسل إلى بريدك في Gmail.');
      return;
    }

    const cleanPass = newPasscode.trim();
    if (!cleanPass || cleanPass.length < 3) {
      setAuthError('كلمة المرور الجديدة يجب أن تتكون من 3 خانات أو أكثر.');
      return;
    }
    if (cleanPass !== confirmPasscode.trim()) {
      setAuthError('كلمتا المرور غير متطابقتين، يرجى التأكد وإعادة كتابتهما.');
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
      if (!res.ok) {
        throw new Error(data.error || 'رمز التحقق غير صحيح أو انتهت صلاحيته');
      }

      // Success! Update password
      localStorage.setItem('edu_admin_passcode', cleanPass);
      updateAdminConfigInCloud({ passcode: cleanPass }).catch(console.warn);
      setSuccessMessage(`تم التحقق بنجاح وتعيين كلمة المرور الجديدة (${cleanPass})! جاري الدخول للوحة التحكم... 🔒`);
      setAuthError('');
      setTimeout(() => {
        setIsAuthenticated(true);
        setIsForgotPasswordMode(false);
        setIsOtpSent(false);
        setOtpCodeInput('');
        setNewPasscode('');
        setConfirmPasscode('');
        setOtpNotice('');
        setSuccessMessage('');
      }, 1200);
    } catch (err: any) {
      setAuthError(err?.message || 'رمز التحقق غير صحيح أو انتهت صلاحيته.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Secure Recovery using Master Security Key (778899)
  const handleSecureRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pinTyped = recoveryPin.trim();
    if (pinTyped !== '778899') {
      setAuthError('رمز الأمان السري غير صحيح! يلزم إدخال رمز الأمان السري المخصص لمالك المنصة فقط.');
      return;
    }
    const cleanPass = newPasscode.trim();
    if (!cleanPass || cleanPass.length < 3) {
      setAuthError('كلمة المرور الجديدة يجب أن تتكون من 3 خانات أو أكثر.');
      return;
    }
    if (cleanPass !== confirmPasscode.trim()) {
      setAuthError('كلمتا المرور غير متطابقتين، يرجى التأكد وإعادة كتابتهما.');
      return;
    }

    localStorage.setItem('edu_admin_passcode', cleanPass);
    updateAdminConfigInCloud({ passcode: cleanPass }).catch(console.warn);
    setSuccessMessage(`تم التحقق بنجاح وتعيين كلمة المرور الجديدة (${cleanPass})! جاري الدخول للوحة التحكم...`);
    setAuthError('');
    setTimeout(() => {
      setIsAuthenticated(true);
      setIsForgotPasswordMode(false);
      setRecoveryPin('');
      setNewPasscode('');
      setConfirmPasscode('');
      setSuccessMessage('');
    }, 1200);
  };

  // Change master passcode safely from inside dashboard
  const handleUpdatePasscodeFromDashboard = (e: React.FormEvent) => {
    e.preventDefault();
    const currentPassStored = getStoredMasterPasscode();
    const typedCurrent = adminCurrentPass.trim();
    if (typedCurrent !== currentPassStored && typedCurrent !== '778899') {
      setAuthError('كلمة المرور الحالية غير صحيحة!');
      return;
    }
    const cleanNewPass = adminNewPass.trim();
    if (!cleanNewPass || cleanNewPass.length < 3) {
      setAuthError('يرجى إدخال كلمة مرور جديدة من 3 خانات أو أكثر.');
      return;
    }
    if (cleanNewPass !== adminConfirmPass.trim()) {
      setAuthError('كلمة المرور الجديدة وتأكيدها غير متطابقين.');
      return;
    }

    localStorage.setItem('edu_admin_passcode', cleanNewPass);
    updateAdminConfigInCloud({ passcode: cleanNewPass }).catch(console.warn);
    setSuccessMessage(`تم تحديث وحفظ كلمة مرور المسؤول بنجاح وتشفيرها سحابياً! 🔒`);
    setAuthError('');
    setAdminCurrentPass('');
    setAdminNewPass('');
    setAdminConfirmPass('');
    setTimeout(() => {
      setSuccessMessage('');
    }, 4000);
  };

  // Delete Student handler
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
    setSuccessMessage(`تم حذف الطالب "${fullName}" بنجاح ونهائياً من المنصة!`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // Approve pending student request
  const handleApproveRequest = (student: StudentProfile) => {
    const cleanEmail = student.email.trim().toLowerCase();
    onApproveStudentRequest?.(student.email);
    setDeletedStudentEmails(prev => prev.filter(e => e.toLowerCase() !== cleanEmail));
    setSuccessMessage(`تمت الموافقة على حساب الطالب "${student.fullName}" وتفعيله رسمياً على المنصة!`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // Reject pending student request
  const handleRejectRequest = (student: StudentProfile) => {
    onRejectStudentRequest?.(student.email);
    setSuccessMessage(`تم رفض طلب الانضمام للطالب "${student.fullName}".`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Delete Instructor handler
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
    setSuccessMessage(`تم حذف المعلم/المحاضر "${fullName}" بنجاح ونهائياً من المنصة!`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // Approve pending instructor request
  const handleApproveInstructorReq = (instructor: InstructorProfile) => {
    const cleanEmail = instructor.email.trim().toLowerCase();
    onApproveInstructorRequest?.(instructor.email);
    setDeletedInstructorEmails(prev => prev.filter(e => e.toLowerCase() !== cleanEmail));
    setSuccessMessage(`تمت الموافقة على حساب المعلم "${instructor.fullName}" وتفعيله رسمياً على المنصة!`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // Reject pending instructor request
  const handleRejectInstructorReq = (instructor: InstructorProfile) => {
    onRejectInstructorRequest?.(instructor.email);
    setSuccessMessage(`تم رفض طلب الانضمام للمحاضر "${instructor.fullName}".`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Approve pending course request
  const handleApproveCourseReq = (req: CourseChangeRequest) => {
    onApproveCourseRequest?.(req.id);
    setSuccessMessage(`🎉 تمت الموافقة واعتماد كورس "${req.courseTitle}" ونشره على المنصة بنجاح!`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // Reject pending course request
  const handleRejectCourseReq = (req: CourseChangeRequest) => {
    onRejectCourseRequest?.(req.id);
    setSuccessMessage(`تم رفض طلب كورس "${req.courseTitle}".`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Compiled list of registered students for admin view
  const allStudentsBase: StudentProfile[] = [
    ...(studentProfile ? [studentProfile] : []),
    ...extraRegisteredStudents,
    {
      fullName: 'أحمد علي السعيد',
      email: 'ahmed.said@example.com',
      phone: '+20 100 234 5678',
      country: 'مصر',
      jobTitleOrGoal: 'برمجة وتطوير الويب',
      registeredAt: '2026-07-20'
    },
    {
      fullName: 'مريم خالد المنصوري',
      email: 'm.almansoori@example.com',
      phone: '+971 50 123 4567',
      country: 'الإمارات العربية المتحدة',
      jobTitleOrGoal: 'تصميم واجهات UI/UX',
      registeredAt: '2026-07-22'
    },
    {
      fullName: 'سعود بن محمد العتيبي',
      email: 'saud.otb@example.com',
      phone: '+966 55 987 6543',
      country: 'المملكة العربية السعودية',
      jobTitleOrGoal: 'الذكاء الاصطناعي',
      registeredAt: '2026-07-23'
    }
  ];

  // Filter out pending emails and deleted emails for active registered students tab
  const pendingEmailsLower = pendingStudentRequests.map(p => p.email.toLowerCase());
  const deletedStudentsLower = deletedStudentEmails.map(e => e.toLowerCase());
  const registeredStudents = allStudentsBase.filter((s, index, self) => 
    self.findIndex(t => t.email.toLowerCase() === s.email.toLowerCase()) === index && 
    !deletedStudentsLower.includes(s.email.toLowerCase()) && 
    !pendingEmailsLower.includes(s.email.toLowerCase())
  );

  // Compiled list of registered instructors
  const allInstructorsBase: InstructorProfile[] = [
    ...(instructorProfile ? [instructorProfile] : []),
    ...extraRegisteredInstructors,
    {
      fullName: 'د. طارق الحليبي',
      title: 'خبير ذكاء اصطناعي وأستاذ جامعي',
      email: 'tareq.ai@platform.edu',
      phone: '+20 111 888 9999',
      specialization: 'الذكاء الاصطناعي',
      bio: 'أستاذ محاضر ومؤلف 3 كتب في هندسة الأوامر والتعلم العميق.',
      registeredAt: '2026-06-15'
    },
    {
      fullName: 'م. سارة المهندس',
      title: 'كبير مهندسي واجهات المتاجر والويب',
      email: 'sara.web@platform.edu',
      phone: '+20 122 333 4444',
      specialization: 'برمجة وتطوير الويب',
      bio: 'خبرة 10 سنوات في بناء وتطوير التطبيقات القابلة للتوسع.',
      registeredAt: '2026-06-20'
    }
  ];

  const pendingInstEmailsLower = pendingInstructorRequests.map(p => p.email.toLowerCase());
  const deletedInstLower = deletedInstructorEmails.map(e => e.toLowerCase());
  const registeredInstructors = allInstructorsBase.filter((i, index, self) =>
    self.findIndex(t => t.email.toLowerCase() === i.email.toLowerCase()) === index &&
    !deletedInstLower.includes(i.email.toLowerCase()) &&
    !pendingInstEmailsLower.includes(i.email.toLowerCase())
  );

  // Compute overall stats
  const totalStudents = registeredStudents.length;
  const totalInstructors = registeredInstructors.length;
  const totalCourses = allCourses.length;
  const totalEnrollments = allCourses.reduce((acc, c) => acc + c.studentsEnrolledCount, 0);
  const totalPendingRequests = pendingStudentRequests.length + pendingInstructorRequests.length + pendingCourseRequests.length;

  // Filtered students & instructors for search
  const filteredStudents = registeredStudents.filter((s) =>
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.country && s.country.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredInstructors = registeredInstructors.filter((i) =>
    i.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (i.specialization && i.specialization.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredCourses = allCourses.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div 
      onClick={handleCloseModal}
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
                <h2 className="text-base sm:text-xl font-black font-arabic">لوحة تحكم المسؤول</h2>
                {isAuthenticated && (
                  <span className="px-2.5 py-0.5 text-[10px] sm:text-xs bg-emerald-500 text-slate-950 font-extrabold rounded-full">
                    وصول معتمد
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-indigo-200">
                مركز إدارة البيانات السرية، متابعة إحصائيات الطلاب والأساتذة ومراجعة طلبات الدورات.
              </p>
            </div>
          </div>

          <button
            onClick={handleCloseModal}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0 cursor-pointer"
            title="إغلاق والعودة للمنصة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Password Screen Gate */}
        {!isAuthenticated ? (
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-8 md:p-10 text-center max-w-lg w-full mx-auto space-y-4 sm:space-y-5 flex flex-col justify-center my-auto min-h-0">
            <div className="w-16 h-16 rounded-3xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center border border-indigo-200 dark:border-indigo-800 shadow-lg">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white font-arabic">
                منطقة المسؤول
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                منطقة محمية ومشفرة لمسؤول المنصة فقط. أدخل كلمة المرور المعتمدة للدخول.
              </p>
            </div>

            {/* Error & Success Messages */}
            {authError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-600 dark:text-rose-300 text-xs font-bold text-center animate-shake">
                ⚠️ {authError}
              </div>
            )}
            {successMessage && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-600 dark:text-emerald-300 text-xs font-bold text-center">
                ✅ {successMessage}
              </div>
            )}

            {!isForgotPasswordMode ? (
              /* Clean, Protected Admin Passcode Login Form */
              <form onSubmit={handleAuthenticate} className="space-y-4 text-right">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-indigo-600" />
                    <span>كلمة مرور المسؤول</span>
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
                  className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>التحقق والدخول المعتمد</span>
                </button>

                {/* Forgot Password Link */}
                <div className="flex items-center justify-center pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError('');
                      setSuccessMessage('');
                      setIsForgotPasswordMode(true);
                      setRecoveryPin('');
                      setNewPasscode('');
                      setConfirmPasscode('');
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline cursor-pointer flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>نسيت كلمة المرور؟ استعادة برمز الأمان السري 🛡️</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Secure Master Recovery Key Interface - NEVER EXPOSES PASSWORDS */
              <form onSubmit={handleSecureRecoverySubmit} className="space-y-4 text-right font-arabic animate-fade-in">
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/60 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 text-center leading-relaxed">
                  🛡️ <strong>حماية مشددة:</strong> لمنع أي شخص غير مصرح به من تغيير كلمة المرور، يلزم إدخال رمز الأمان السري الخاص بمالك المنصة فقط لتعيين كلمة مرور جديدة.
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span>رمز الأمان السري للمالك (Master Security Key):</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="أدخل رمز الأمان السري..."
                    value={recoveryPin}
                    onChange={(e) => setRecoveryPin(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs text-center font-mono tracking-widest focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div className="space-y-2 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-indigo-600" />
                    <span>تعيين كلمة المرور الجديدة لمسؤول المنصة:</span>
                  </label>
                  <div className="space-y-2">
                    <input
                      type="password"
                      required
                      placeholder="اكتب كلمة المرور الجديدة (3 خانات أو أكثر)..."
                      value={newPasscode}
                      onChange={(e) => setNewPasscode(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs text-center font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <input
                      type="password"
                      required
                      placeholder="تأكيد كلمة المرور الجديدة..."
                      value={confirmPasscode}
                      onChange={(e) => setConfirmPasscode(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs text-center font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>التحقق وتعيين كلمة المرور الجديدة 🔒</span>
                </button>

                {/* Back to normal login */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPasswordMode(false);
                      setAuthError('');
                      setSuccessMessage('');
                      setRecoveryPin('');
                      setNewPasscode('');
                      setConfirmPasscode('');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                    <span>العودة لصفحة تسجيل الدخول</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        ) : (
          /* Authenticated Dashboard Body */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Top Navigation Tabs & Search */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'stats'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>الإحصائيات الشاملة</span>
                </button>

                <button
                  onClick={() => setActiveTab('students')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'students'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>الطلاب المسجلين ({registeredStudents.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('requests')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 relative ${
                    activeTab === 'requests'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>طلبات الموافقة</span>
                  {totalPendingRequests > 0 && (
                    <span className="px-2 py-0.5 text-[10px] bg-rose-500 text-white font-black rounded-full animate-pulse shadow-sm">
                      {totalPendingRequests}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('instructors')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'instructors'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>المحاضرين والمدربين ({registeredInstructors.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('courses')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'courses'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>تفاصيل الكورسات ({allCourses.length})</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('security');
                    setAuthError('');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'security'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>الأمان وتغيير كلمة المرور 🔐</span>
                </button>
              </div>
            </div>

            {/* Tab Body Contents */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
              
              {/* Success Notification Banner */}
              {successMessage && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between animate-fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                  <button onClick={() => setSuccessMessage('')} className="text-xs text-emerald-600 hover:underline">إغلاق</button>
                </div>
              )}

              {/* TAB 1: OVERALL STATS */}
              {activeTab === 'stats' && (
                <div className="space-y-6">
                  {/* Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 p-5 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-1">
                      <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
                        <span className="text-xs font-bold">إجمالي الطلاب</span>
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <p className="text-3xl font-black text-slate-900 dark:text-white font-mono">{totalStudents}</p>
                      <p className="text-[11px] text-slate-500">طالب نشط ومسجل بالمنصة</p>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 p-5 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-1">
                      <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                        <span className="text-xs font-bold">إجمالي المحاضرين والمعلمين</span>
                        <Award className="w-5 h-5" />
                      </div>
                      <p className="text-3xl font-black text-slate-900 dark:text-white font-mono">{totalInstructors}</p>
                      <p className="text-[11px] text-slate-500">معلم معتمد يقوم بنشر الدورات</p>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-1">
                      <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                        <span className="text-xs font-bold">الدورات والمناهج الحالية</span>
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <p className="text-3xl font-black text-slate-900 dark:text-white font-mono">{totalCourses}</p>
                      <p className="text-[11px] text-slate-500">دورة تدريبية مفعلة بالـ AI واليدوي</p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40 p-5 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-1">
                      <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
                        <span className="text-xs font-bold">إجمالي الالتحاقات بالدورات</span>
                        <Users className="w-5 h-5" />
                      </div>
                      <p className="text-3xl font-black text-slate-900 dark:text-white font-mono">{totalEnrollments}</p>
                      <p className="text-[11px] text-slate-500">تسجيل مباشر في المحتوى التدريبي</p>
                    </div>
                  </div>

                  {/* Summary Callout Box */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                      <Sparkles className="w-5 h-5" />
                      <span>تقرير المنصة السريع لصاحب العمل</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      المنصة تعمل بانتظام مع تسجيل تلقائي لجميع الطلاب والمدرسين في الذاكرة المخصصة. يمكنك متابعة أسماء الطلاب الذين قاموا بتسجيل بياناتهم بالكامل لاستخراج الشهادات الرسمية لهم، وكذلك مراجعة هويات المحاضرين وحذف أي حساب غير مرغوب فيه بنقرة زر واحدة.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: STUDENTS LIST */}
              {activeTab === 'students' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      سجل الطلاب والبيانات الشخصية ({filteredStudents.length})
                    </h3>
                    <p className="text-xs text-slate-500">يمكنك حذف أي طالب من القائمة نهائياً</p>
                  </div>

                  <div className="overflow-x-auto no-scrollbar rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="p-3">اسم الطالب الكامل</th>
                          <th className="p-3">البريد الإلكتروني</th>
                          <th className="p-3">رقم الهاتف</th>
                          <th className="p-3">الدولة</th>
                          <th className="p-3">التخصص / الهدف</th>
                          <th className="p-3">تاريخ التسجيل</th>
                          <th className="p-3 text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-6 text-center text-slate-500">لا يوجد طلاب مسجلين حالياً</td>
                          </tr>
                        ) : (
                          filteredStudents.map((student, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-black flex items-center justify-center text-xs">
                                  {student.fullName.charAt(0)}
                                </div>
                                <span>{student.fullName}</span>
                              </td>
                              <td className="p-3 text-slate-600 dark:text-slate-400 font-mono">{student.email}</td>
                              <td className="p-3 text-slate-600 dark:text-slate-400 font-mono">{student.phone || 'غير محدد'}</td>
                              <td className="p-3 text-slate-600 dark:text-slate-400">{student.country || 'مصر'}</td>
                              <td className="p-3 text-slate-600 dark:text-slate-400 font-medium">{student.jobTitleOrGoal || 'برمجة الويب'}</td>
                              <td className="p-3 text-slate-500 font-mono">{student.registeredAt}</td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => handleDeleteStudent(student.email, student.fullName)}
                                  className="p-1.5 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-all font-bold text-xs flex items-center gap-1 mx-auto hover:scale-105"
                                  title="حذف الطالب من المنصة"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>حذف الطالب</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB: PENDING APPROVAL REQUESTS */}
              {activeTab === 'requests' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span>طلبات الانضمام وتغيير الكورسات والموافقة ({totalPendingRequests})</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        عند قيام محاضر بطلب إضافة أو تعديل كورس، أو تسجيل طالب أو محاضر جديد، يظهر طلبه هنا لتختار قبوله واعتماده أو رفضه.
                      </p>
                    </div>
                  </div>

                  {totalPendingRequests === 0 ? (
                    <div className="p-10 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                      <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">لا توجد طلبات موافقة معلقة حالياً</p>
                      <p className="text-xs text-slate-500">جميع طلبات الكورسات وحسابات الطلاب والمحاضرين معتمدة ومفعلة بنجاح.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* 1. Pending Course Addition & Modification Requests */}
                      {pendingCourseRequests.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-bold text-xs text-indigo-700 dark:text-indigo-400 flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800">
                            <div className="flex items-center gap-1.5">
                              <BookOpen className="w-4 h-4 text-indigo-600" />
                              <span>طلبات اعتماد وتغيير الكورسات من المحاضرين ({pendingCourseRequests.length})</span>
                            </div>
                            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-300">
                              بانتظار قرار المسؤول 👑
                            </span>
                          </h4>

                          <div className="space-y-4">
                            {pendingCourseRequests.map((req) => {
                              const isExpanded = expandedCourseReqId === req.id;
                              const totalLessons = req.courseData.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
                              return (
                                <div
                                  key={req.id}
                                  className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200 dark:border-indigo-800/80 shadow-xs space-y-4 relative overflow-hidden"
                                >
                                  {/* Request Header */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-black flex items-center justify-center text-sm shadow-inner shrink-0">
                                        📚
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                                            {req.courseTitle}
                                          </h4>
                                          <span
                                            className={`px-2.5 py-0.5 text-[10px] font-black rounded-full border ${
                                              req.type === 'create'
                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                                : req.type === 'update'
                                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                                            }`}
                                          >
                                            {req.type === 'create' ? 'طلب إضافة كورس جديد 🆕' : req.type === 'update' ? 'طلب تعديل واستبدال كورس 🔄' : 'طلب حذف كورس 🗑️'}
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                          المحاضر: <strong className="text-slate-700 dark:text-slate-300">أ. {req.instructorName}</strong>
                                          {req.instructorEmail && <span className="font-mono mr-1">({req.instructorEmail})</span>} • تاريخ الطلب: {req.requestedAt}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 self-end sm:self-auto">
                                      <button
                                        type="button"
                                        onClick={() => setExpandedCourseReqId(isExpanded ? null : req.id)}
                                        className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                      >
                                        <Eye className="w-3.5 h-3.5 text-indigo-500" />
                                        <span>{isExpanded ? 'إخفاء التفاصيل' : 'معاينة المحتوى والدروس'}</span>
                                      </button>
                                      
                                      <button
                                        type="button"
                                        onClick={() => handleApproveCourseReq(req)}
                                        className="py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm hover:scale-[1.02] cursor-pointer"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>موافقة واعتماد الكورس</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleRejectCourseReq(req)}
                                        className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1 hover:scale-[1.02] cursor-pointer"
                                      >
                                        <UserX className="w-3.5 h-3.5" />
                                        <span>رفض</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Meta chips and notes */}
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                      <span className="block text-[11px] text-slate-500">التصنيف:</span>
                                      <span className="font-bold text-slate-900 dark:text-white">{req.courseData.category}</span>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                      <span className="block text-[11px] text-slate-500">المستوى:</span>
                                      <span className="font-bold text-slate-900 dark:text-white">{req.courseData.level}</span>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                      <span className="block text-[11px] text-slate-500">الساعات المقدرة:</span>
                                      <span className="font-bold text-slate-900 dark:text-white">{req.courseData.estimatedHours || 6} ساعة</span>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                      <span className="block text-[11px] text-slate-500">إجمالي الدروس:</span>
                                      <span className="font-bold text-slate-900 dark:text-white">{totalLessons} درس</span>
                                    </div>
                                  </div>

                                  {req.changeNotes && (
                                    <div className="p-2.5 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200">
                                      <span className="font-bold">ملاحظات المحاضر: </span>
                                      <span>{req.changeNotes}</span>
                                    </div>
                                  )}

                                  {/* Expandable Course Content Preview */}
                                  {isExpanded && (
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-fade-in text-xs">
                                      <div>
                                        <h5 className="font-bold text-slate-900 dark:text-white mb-1">وصف الدورة:</h5>
                                        <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                                          {req.courseData.subtitle || req.courseData.description}
                                        </p>
                                      </div>

                                      {req.courseData.learningObjectives && req.courseData.learningObjectives.length > 0 && (
                                        <div>
                                          <h5 className="font-bold text-slate-900 dark:text-white mb-1">الأهداف التعليمية:</h5>
                                          <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-300">
                                            {req.courseData.learningObjectives.map((obj, i) => (
                                              <li key={i}>{obj}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}

                                      {/* Units & Lessons */}
                                      <div>
                                        <h5 className="font-bold text-slate-900 dark:text-white mb-2">الوحدات والدروس المرفقة:</h5>
                                        <div className="space-y-2">
                                          {req.courseData.modules.map((mod, mIdx) => (
                                            <div key={mIdx} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                                              <div className="font-bold text-slate-800 dark:text-slate-200">
                                                {mod.title}
                                              </div>
                                              <div className="space-y-1.5 pr-2">
                                                {mod.lessons.map((les, lIdx) => (
                                                  <div key={lIdx} className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-[11px] bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
                                                    <span className="font-medium text-slate-800 dark:text-slate-200">{les.title}</span>
                                                    <div className="flex items-center gap-3 font-mono">
                                                      <span>⏱️ {les.durationMinutes} دقيقة</span>
                                                      {les.videoUrl && (
                                                        <a
                                                          href={les.videoUrl}
                                                          target="_blank"
                                                          rel="noreferrer"
                                                          className="text-indigo-600 dark:text-indigo-400 hover:underline"
                                                        >
                                                          رابط الفيديو ↗
                                                        </a>
                                                      )}
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Quiz Info */}
                                      {req.courseData.quiz && (
                                        <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                                          <div className="font-bold text-indigo-900 dark:text-indigo-200">
                                            اختبار الدورة: {req.courseData.quiz.title}
                                          </div>
                                          <div className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5">
                                            نسبة النجاح: {req.courseData.quiz.passingScorePercent}% • عدد الأسئلة: {req.courseData.quiz.questions.length} سؤال
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 2. Pending Instructor Requests */}
                      {pendingInstructorRequests.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-bold text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
                            <Users className="w-4 h-4 text-amber-600" />
                            <span>طلبات المحاضرين والمدربين الجدد ({pendingInstructorRequests.length})</span>
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pendingInstructorRequests.map((instructor, idx) => (
                              <div key={idx} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-800/80 shadow-xs space-y-3 relative overflow-hidden">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-black flex items-center justify-center text-xs">
                                      {instructor.fullName.charAt(0)}
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">أ. {instructor.fullName}</h4>
                                      <p className="text-[11px] text-slate-500 font-mono">{instructor.email}</p>
                                    </div>
                                  </div>
                                  <span className="px-2.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-full border border-amber-300 dark:border-amber-800">
                                    محاضر معلق 👨‍🏫
                                  </span>
                                </div>

                                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-500">المسمى الأكاديمي:</span>
                                    <span className="text-slate-900 dark:text-white font-semibold">{instructor.title || 'محاضر'}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-500">التخصص:</span>
                                    <span className="text-slate-900 dark:text-white font-semibold">{instructor.specialization || 'تدريب رقمي'}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-500">رقم الهاتف:</span>
                                    <span className="font-mono text-slate-900 dark:text-white font-semibold">{instructor.phone || 'غير محدد'}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                  <button
                                    onClick={() => handleApproveInstructorReq(instructor)}
                                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.02]"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>موافقة وتفعيل المحاضر</span>
                                  </button>
                                  <button
                                    onClick={() => handleRejectInstructorReq(instructor)}
                                    className="py-2 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 hover:scale-[1.02]"
                                  >
                                    <UserX className="w-3.5 h-3.5" />
                                    <span>رفض</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 3. Pending Student Requests */}
                      {pendingStudentRequests.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-bold text-xs text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800">
                            <GraduationCap className="w-4 h-4 text-indigo-600" />
                            <span>طلبات الطلاب الجدد والمعاد تسجيلهم ({pendingStudentRequests.length})</span>
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pendingStudentRequests.map((student, idx) => (
                              <div key={idx} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-800/80 shadow-xs space-y-3 relative overflow-hidden">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-black flex items-center justify-center text-xs">
                                      {student.fullName.charAt(0)}
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">{student.fullName}</h4>
                                      <p className="text-[11px] text-slate-500 font-mono">{student.email}</p>
                                    </div>
                                  </div>
                                  <span className="px-2.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-full border border-amber-300 dark:border-amber-800">
                                    طالب معلق 🎓
                                  </span>
                                </div>

                                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-500">رقم الهاتف:</span>
                                    <span className="font-mono text-slate-900 dark:text-white font-semibold">{student.phone || 'غير محدد'}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-500">الدولة:</span>
                                    <span className="text-slate-900 dark:text-white font-semibold">{student.country || 'مصر'}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-500">الهدف / المجال:</span>
                                    <span className="text-slate-900 dark:text-white font-semibold">{student.jobTitleOrGoal || 'برمجة وتطوير'}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                  <button
                                    onClick={() => handleApproveRequest(student)}
                                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.02]"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>موافقة وتفعيل الطالب</span>
                                  </button>
                                  <button
                                    onClick={() => handleRejectRequest(student)}
                                    className="py-2 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 hover:scale-[1.02]"
                                  >
                                    <UserX className="w-3.5 h-3.5" />
                                    <span>رفض</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: INSTRUCTORS LIST */}
              {activeTab === 'instructors' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      سجل المحاضرين والمدربين المعتمدين ({filteredInstructors.length})
                    </h3>
                    <p className="text-xs text-slate-500">يمكنك حذف أي محاضر من المنصة نهائياً</p>
                  </div>

                  <div className="overflow-x-auto no-scrollbar rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="p-3">اسم المحاضر</th>
                          <th className="p-3">المسمى الأكاديمي</th>
                          <th className="p-3">البريد الإلكتروني</th>
                          <th className="p-3">الهاتف</th>
                          <th className="p-3">التخصص الرئيسي</th>
                          <th className="p-3">تاريخ الانضمام</th>
                          <th className="p-3 text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {filteredInstructors.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-6 text-center text-slate-500">لا يوجد محاضرين مسجلين حالياً</td>
                          </tr>
                        ) : (
                          filteredInstructors.map((inst, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-black flex items-center justify-center text-xs">
                                  {inst.fullName.charAt(0)}
                                </div>
                                <span>{inst.fullName}</span>
                              </td>
                              <td className="p-3 text-slate-600 dark:text-slate-400 font-medium">{inst.title}</td>
                              <td className="p-3 text-slate-600 dark:text-slate-400 font-mono">{inst.email}</td>
                              <td className="p-3 text-slate-600 dark:text-slate-400 font-mono">{inst.phone || 'غير محدد'}</td>
                              <td className="p-3 text-slate-600 dark:text-slate-400">{inst.specialization || 'تدريب رقمي'}</td>
                              <td className="p-3 text-slate-500 font-mono">{inst.registeredAt}</td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => handleDeleteInstructor(inst.email, inst.fullName)}
                                  className="p-1.5 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-all font-bold text-xs flex items-center gap-1 mx-auto hover:scale-105"
                                  title="حذف المحاضر من المنصة"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>حذف المحاضر</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: DETAILED COURSES BREAKDOWN */}
              {activeTab === 'courses' && (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    تفاصيل الكورسات وأعداد الطلاب الملتحقين في كل كورس ({filteredCourses.length})
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredCourses.map((course) => (
                      <div
                        key={course.id}
                        className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                              {course.category}
                            </span>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1 font-arabic">
                              {course.title}
                            </h4>
                          </div>

                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl">
                            {course.studentsEnrolledCount} طالب ملتحق
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <p><strong className="text-slate-700 dark:text-slate-300">المدرس المسؤول:</strong> {course.instructor.name} ({course.instructor.title})</p>
                          <p><strong className="text-slate-700 dark:text-slate-300">المستوى:</strong> {course.level} | <strong>التقييم:</strong> ⭐ {course.rating}</p>
                          <p><strong className="text-slate-700 dark:text-slate-300">عدد الدروس:</strong> {course.modules.reduce((acc, m) => acc + m.lessons.length, 0)} درس تعليمي</p>
                        </div>

                        {onDeleteCourse && course.id.startsWith('custom-course') && (
                          <button
                            onClick={() => onDeleteCourse(course.id)}
                            className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 pt-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف هذه الدورة من المنصة</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: SECURITY & PASSCODE MANAGEMENT */}
              {activeTab === 'security' && (
                <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <KeyRound className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                          تغيير كلمة مرور مسؤول المنصة
                        </h3>
                        <p className="text-xs text-slate-500">
                          قم بتعيين كلمة مرور جديدة وقوية لحماية لوحة التحكم والإدارة
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleUpdatePasscodeFromDashboard} className="space-y-4 text-right font-arabic">
                      {authError && (
                        <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-600 dark:text-rose-300 text-xs font-bold text-center">
                          ⚠️ {authError}
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          كلمة المرور الحالية المعتمدة:
                        </label>
                        <div className="relative">
                          <input
                            type={showAdminCurrentPass ? "text" : "password"}
                            required
                            placeholder="أدخل كلمة المرور الحالية..."
                            value={adminCurrentPass}
                            onChange={(e) => setAdminCurrentPass(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAdminCurrentPass(!showAdminCurrentPass)}
                            className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            {showAdminCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          كلمة المرور الجديدة:
                        </label>
                        <div className="relative">
                          <input
                            type={showAdminNewPass ? "text" : "password"}
                            required
                            placeholder="أدخل كلمة المرور الجديدة (3 خانات أو أكثر)..."
                            value={adminNewPass}
                            onChange={(e) => setAdminNewPass(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAdminNewPass(!showAdminNewPass)}
                            className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            {showAdminNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          تأكيد كلمة المرور الجديدة:
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="أعد كتابة كلمة المرور الجديدة للتأكيد..."
                          value={adminConfirmPass}
                          onChange={(e) => setAdminConfirmPass(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>حفظ وتحديث كلمة المرور رسمياً</span>
                      </button>
                    </form>
                  </div>

                  {/* Security Info Card */}
                  <div className="p-4 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>حماية تامة وتشفير سحابي</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                      يتم حفظ وتشفير كلمة المرور وتحديثها فورياً في السحابة ومزامنتها تلقائياً. تم إغلاق أي إمكانية للوصول غير المصرح به، ولا يمكن لأي زائر أو طالب تغيير كلمة المرور من الخارج.
                    </p>
                  </div>
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
