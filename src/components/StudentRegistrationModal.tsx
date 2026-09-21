import React, { useState, useEffect } from 'react';
import { X, UserCheck, GraduationCap, Mail, Phone, MapPin, Target, Sparkles, CheckCircle2, Clock, ShieldAlert, LogOut } from 'lucide-react';
import { StudentProfile } from '../types';

interface StudentRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentProfile: StudentProfile | null;
  onSaveProfile: (profile: StudentProfile) => { isPending: boolean };
  onLogout?: () => void;
  isInitialRequired?: boolean;
}

export const StudentRegistrationModal: React.FC<StudentRegistrationModalProps> = ({
  isOpen,
  onClose,
  studentProfile,
  onSaveProfile,
  onLogout,
  isInitialRequired = false,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('مصر');
  const [jobTitleOrGoal, setJobTitleOrGoal] = useState('برمجة وتطوير الويب');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  useEffect(() => {
    if (studentProfile) {
      setFullName(studentProfile.fullName || '');
      setEmail(studentProfile.email || '');
      setPhone(studentProfile.phone || '');
      setCountry(studentProfile.country || 'مصر');
      setJobTitleOrGoal(studentProfile.jobTitleOrGoal || 'برمجة وتطوير الويب');
    } else {
      setFullName('');
      setEmail('');
      setPhone('');
      setCountry('مصر');
      setJobTitleOrGoal('برمجة وتطوير الويب');
    }
    setErrorMsg('');
    setIsSuccess(false);
    setIsPendingApproval(false);
  }, [studentProfile, isOpen]);

  useEffect(() => {
    if (isPendingApproval && isOpen) {
      const handleWindowClick = () => {
        onClose();
      };
      const timer = setTimeout(() => {
        window.addEventListener('click', handleWindowClick);
      }, 150);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('click', handleWindowClick);
      };
    }
  }, [isPendingApproval, isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 3) {
      setErrorMsg('يرجى كتابة الاسم الثلاثي الكامل ليظهر بشكل صحيح على الشهادة.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('يرجى إدخال بريد إلكتروني صحيح لتلقي الشهادات والملفات.');
      return;
    }

    const newProfile: StudentProfile = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      country,
      jobTitleOrGoal,
      registeredAt: studentProfile?.registeredAt || new Date().toISOString().split('T')[0],
    };

    const res = onSaveProfile(newProfile);
    if (res && res.isPending) {
      setIsPendingApproval(true);
    } else {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1000);
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in font-arabic flex min-h-full items-center justify-center"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative transition-all my-auto flex flex-col max-h-[85vh] sm:max-h-[90vh] min-h-0"
      >
        
        {/* Header decoration banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-5 sm:p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10 cursor-pointer"
            title="إغلاق والرجوع"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0">
              <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold">تسجيل بيانات الطالب والمتدرب</h3>
                <span className="px-2 py-0.5 text-[10px] sm:text-xs bg-amber-400 text-slate-950 font-extrabold rounded-full">خطوة أولى</span>
              </div>
              <p className="text-[11px] sm:text-xs text-emerald-100 mt-0.5">
                سجّل بياناتك الأساسية لتفعيل حسابك وإصدار الشهادات الرسمية باسمك الثلاثي.
              </p>
            </div>
          </div>
        </div>

        {/* Content body */}
        {isPendingApproval ? (
          <div className="p-6 sm:p-10 text-center space-y-4 overflow-y-auto touch-pan-y">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center border border-amber-200 dark:border-amber-800 shadow-lg">
              <Clock className="w-7 h-7 sm:w-8 sm:h-8 animate-spin" />
            </div>
            <div className="space-y-2">
              <span className="px-3 py-1 text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-full border border-amber-300 dark:border-amber-800">
                في انتظار موافقة صاحب المنصة 👑
              </span>
              <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white pt-1">
                تم إرسال طلب تفعيل الحساب
              </h4>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed max-w-md mx-auto bg-amber-50/50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200/60 dark:border-amber-800/60">
              مرحباً بك <span className="font-bold text-amber-600 dark:text-amber-400">{fullName}</span>. تم إرسال طلب تسجيلك بنجاح إلى قسم <span className="font-bold">"طلبات الموافقة"</span> لدى مالك المنصة. يلزم موافقة مالك المنصة لتفعيل حسابك ومباشرة الدخول للدروس.
            </p>
            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all"
              >
                حسناً، فهمت ذلك (متابعة)
              </button>
            </div>
          </div>
        ) : isSuccess ? (
          <div className="p-8 sm:p-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-2xl font-bold text-slate-900 dark:text-white">تم حفظ البيانات بنجاح!</h4>
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              أهلاً بك <span className="font-bold text-emerald-600">{fullName}</span>، يمكنك الآن البدء مباشرة في التدريب والدورات.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 min-h-0 touch-pan-y overscroll-contain">
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 text-xs font-semibold">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Name Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <span>الاسم الكامل (ثلاثي) <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: أحمد محمد علي"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                ملاحظة: سيُطبَع هذا الاسم بدقة كما هو على شهادة التخرج المعتمدة.
              </p>
            </div>

            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-emerald-600" />
                <span>البريد الإلكتروني <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="email"
                required
                placeholder="student@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            {/* Phone & Country row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>رقم الجوال / الهاتف</span>
                </label>
                <input
                  type="tel"
                  placeholder="+20 100 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>الدولة / البلد</span>
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
                >
                  <option value="مصر">مصر</option>
                  <option value="المملكة العربية السعودية">المملكة العربية السعودية</option>
                  <option value="الإمارات العربية المتحدة">الإمارات العربية المتحدة</option>
                  <option value="الكويت">الكويت</option>
                  <option value="الأردن">الأردن</option>
                  <option value="المغرب">المغرب</option>
                  <option value="دولة أخرى">دولة أخرى</option>
                </select>
              </div>
            </div>

            {/* Goal/Target Specialization */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-emerald-600" />
                <span>المجال أو الهدف التعليمي الرئيسي</span>
              </label>
              <select
                value={jobTitleOrGoal}
                onChange={(e) => setJobTitleOrGoal(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
              >
                <option value="برمجة وتطوير الويب">برمجة وتطوير الويب (Frontend / Fullstack)</option>
                <option value="الذكاء الاصطناعي وهندسة الأوامر">الذكاء الاصطناعي وهندسة الأوامر (Prompting & AI)</option>
                <option value="تصميم واجهات تجربة المستخدم UI/UX">تصميم واجهات تجربة المستخدم (UI/UX Design)</option>
                <option value="علوم البيانات والتحليل الإحصائي">علوم البيانات والتحليل الإحصائي (Data Science)</option>
                <option value="الأمن السيبراني وحماية الشبكات">الأمن السيبراني وحماية الشبكات (Cybersecurity)</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                className="flex-1 py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>حفظ البيانات وبدء التدريب الآن</span>
              </button>

              {!isInitialRequired && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
                >
                  إلغاء
                </button>
              )}
            </div>

            {/* Logout Section at the bottom */}
            {studentProfile && onLogout && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-rose-50/50 dark:bg-rose-950/30 p-3.5 rounded-2xl border border-rose-100 dark:border-rose-900/50">
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">تسجيل الخروج النهائي</span>
                  <span className="text-[11px] text-slate-500">حساب الطالب: {studentProfile.fullName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>تسجيل خروج</span>
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
