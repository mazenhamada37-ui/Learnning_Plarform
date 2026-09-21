import React, { useState, useEffect } from 'react';
import { X, Award, Mail, Phone, BookOpen, Sparkles, CheckCircle2, UserCheck, Briefcase, Clock, LogOut } from 'lucide-react';
import { InstructorProfile } from '../types';

interface InstructorRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  instructorProfile: InstructorProfile | null;
  onSaveProfile: (profile: InstructorProfile) => { isPending: boolean };
  onLogout?: () => void;
  isInitialRequired?: boolean;
}

const DEFAULT_JOB_TITLES = [
  'مدرب خبير ومستشار رقمي',
  'أستاذ دكتور / بروفيسور',
  'محاضر جامعي وأكاديمي',
  'مهندس برمجيات ومحاضر تقني',
  'مدرب معتمد وخبير تدريب',
  'خبير ذكاء اصطناعي وتكنولوجيا',
  'مصمم واجهات ومطور ويب',
  'رائد أعمال ومستشار تقني',
  'مدرس / معلم متخصص',
  'مدير تنفيذي ومحاضر',
  'أخرى (تخصيص مسمى وظيفي خاص)',
];

export const InstructorRegistrationModal: React.FC<InstructorRegistrationModalProps> = ({
  isOpen,
  onClose,
  instructorProfile,
  onSaveProfile,
  onLogout,
  isInitialRequired = false,
}) => {
  const [fullName, setFullName] = useState('');
  const [selectedTitleOption, setSelectedTitleOption] = useState<string>('مدرب خبير ومستشار رقمي');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('برمجة وتطوير الويب');
  const [bio, setBio] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  useEffect(() => {
    if (instructorProfile) {
      setFullName(instructorProfile.fullName || '');
      const profileTitle = instructorProfile.title || '';
      if (DEFAULT_JOB_TITLES.includes(profileTitle)) {
        setSelectedTitleOption(profileTitle);
        setCustomTitle('');
      } else if (profileTitle) {
        setSelectedTitleOption('أخرى (تخصيص مسمى وظيفي خاص)');
        setCustomTitle(profileTitle);
      } else {
        setSelectedTitleOption('مدرب خبير ومستشار رقمي');
        setCustomTitle('');
      }
      setEmail(instructorProfile.email || '');
      setPhone(instructorProfile.phone || '');
      setSpecialization(instructorProfile.specialization || 'برمجة وتطوير الويب');
      setBio(instructorProfile.bio || '');
    } else {
      setFullName('');
      setSelectedTitleOption('مدرب خبير ومستشار رقمي');
      setCustomTitle('');
      setEmail('');
      setPhone('');
      setSpecialization('برمجة وتطوير الويب');
      setBio('خبير في تطوير البرمجيات وتدريب الكوادر التقنية.');
    }
    setErrorMsg('');
    setIsSuccess(false);
    setIsPendingApproval(false);
  }, [instructorProfile, isOpen]);

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
      setErrorMsg('يرجى كتابة الاسم الكامل للمحاضر بشكل صحيح.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('يرجى كتابة بريد إلكتروني صحيح للقيام بالاتصالات الإدارية.');
      return;
    }

    const finalTitle = selectedTitleOption === 'أخرى (تخصيص مسمى وظيفي خاص)'
      ? (customTitle.trim() || 'مدرب رقمي معتمد')
      : selectedTitleOption;

    const newProfile: InstructorProfile = {
      fullName: fullName.trim(),
      title: finalTitle,
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      specialization,
      bio: bio.trim() || 'مدرب ومحاضر في المنصة.',
      registeredAt: instructorProfile?.registeredAt || new Date().toISOString().split('T')[0],
    };

    const res = onSaveProfile(newProfile);
    if (res && res.isPending) {
      setIsPendingApproval(true);
    } else {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 900);
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
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 p-5 sm:p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10 cursor-pointer"
            title="إغلاق والرجوع"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0">
              <Award className="w-5 h-5 sm:w-6 sm:h-6 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold">تسجيل بيانات المحاضر</h3>
                <span className="px-2 py-0.5 text-[10px] sm:text-xs bg-slate-950 text-amber-300 font-extrabold rounded-full">استوديو التدريب</span>
              </div>
              <p className="text-[11px] sm:text-xs text-amber-100 mt-0.5">
                قم بتسجيل بياناتك الأكاديمية والمهنية لتتمكن من إنشاء المناهج ومتابعة طلابك.
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
                تم إرسال طلب تفعيل حساب المحاضر
              </h4>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed max-w-md mx-auto bg-amber-50/50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200/60 dark:border-amber-800/60">
              أهلاً بك أستاذ <span className="font-bold text-amber-600 dark:text-amber-400">{fullName}</span>. تم إرسال طلب تفعيل حساب المحاضر بنجاح إلى قسم <span className="font-bold">"طلبات الموافقة"</span> لدى مالك المنصة للمراجعة والقبول، ويلزم موافقة المالك لتفعيل الحساب والدخول لاستوديو التدريب.
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
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-2xl font-bold text-slate-900 dark:text-white">تم حفظ بيانات المحاضر بنجاح!</h4>
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              مرحباً بك أستاذ <span className="font-bold text-amber-600">{fullName}</span>، يمكنك الآن البدء في نشر وإدارة الدورات.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0 touch-pan-y overscroll-contain">
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 text-xs font-semibold">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Name Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-amber-600" />
                <span>الاسم الكامل للمحاضر <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: د. مازن عبد الله"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all"
              />
            </div>

            {/* Title & Email Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-amber-600" />
                  <span>المسمى الوظيفي / الأكاديمي</span>
                </label>
                <select
                  value={selectedTitleOption}
                  onChange={(e) => setSelectedTitleOption(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all cursor-pointer"
                >
                  {DEFAULT_JOB_TITLES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {selectedTitleOption === 'أخرى (تخصيص مسمى وظيفي خاص)' && (
                  <input
                    type="text"
                    required
                    placeholder="اكتب مسمّاك الوظيفي الخاص..."
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full mt-2 px-4 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/30 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all animate-fade-in"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-amber-600" />
                  <span>البريد الإلكتروني <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="instructor@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Phone & Specialization */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-amber-600" />
                  <span>رقم الهاتف / التواصل</span>
                </label>
                <input
                  type="tel"
                  placeholder="+20 110 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  <span>التخصص التدريبي الرئيسي</span>
                </label>
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all"
                >
                  <option value="برمجة وتطوير الويب">برمجة وتطوير الويب</option>
                  <option value="الذكاء الاصطناعي">الذكاء الاصطناعي والتكنيات الحديثة</option>
                  <option value="تصميم واجهات UI/UX">تصميم واجهات تجربة المستخدم UI/UX</option>
                  <option value="علوم البيانات">علوم البيانات والذكاء الأكاديمي</option>
                  <option value="إدارة الأعمال">إدارة الأعمال والتسويق</option>
                </select>
              </div>
            </div>

            {/* Bio / Qualifications */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                نبذة عن خبراتك ومؤهلاتك التدريبية
              </label>
              <textarea
                rows={2}
                placeholder="اكتب نبذة مختصرة للطلاب..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                className="flex-1 py-3 px-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-sm rounded-xl shadow-md shadow-amber-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>حفظ بيانات المحاضر وتأكيد الدخول</span>
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
            {instructorProfile && onLogout && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-rose-50/50 dark:bg-rose-950/30 p-3.5 rounded-2xl border border-rose-100 dark:border-rose-900/50">
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">تسجيل الخروج النهائي</span>
                  <span className="text-[11px] text-slate-500">حساب المحاضر: أ. {instructorProfile.fullName}</span>
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
                  <span>تسجيل خروج المحاضر</span>
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
