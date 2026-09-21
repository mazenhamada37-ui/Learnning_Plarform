import React from 'react';
import { X, GraduationCap, Award, UserPlus, ArrowLeft } from 'lucide-react';

interface AddUserTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStudent: () => void;
  onSelectInstructor: () => void;
}

export const AddUserTypeModal: React.FC<AddUserTypeModalProps> = ({
  isOpen,
  onClose,
  onSelectStudent,
  onSelectInstructor,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in dir-rtl flex min-h-full items-center justify-center"
    >
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh] my-auto min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 p-4 sm:p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 bg-white/15 rounded-xl backdrop-blur-md shrink-0">
              <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold">إضافة حساب جديد ➕</h3>
              <p className="text-[11px] sm:text-xs text-white/90 mt-0.5 font-medium">
                اختر نوع الحساب الذي ترغب في تسجيله
              </p>
            </div>
          </div>
        </div>

        {/* Options Container */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0 touch-pan-y overscroll-contain">
          <p className="text-center text-sm font-semibold text-slate-700 dark:text-slate-300">
            هل أنت طالب أم محاضر؟
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Student Card */}
            <button
              onClick={onSelectStudent}
              className="group flex flex-col items-center justify-between p-5 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 hover:bg-emerald-100/60 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/60 transition-all hover:scale-[1.02] text-right shadow-xs hover:shadow-md cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md mb-3 group-hover:bg-emerald-600 transition-colors">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h4 className="font-bold text-slate-900 dark:text-white text-base">حساب طالب</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  حضور الكورسات والتعلم وحفظ التقدم
                </p>
              </div>
              <div className="mt-4 w-full py-2 bg-emerald-600 group-hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors">
                <span>سجل كطالب</span>
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Instructor Card */}
            <button
              onClick={onSelectInstructor}
              className="group flex flex-col items-center justify-between p-5 rounded-2xl border-2 border-amber-200 dark:border-amber-800/60 bg-amber-50/50 hover:bg-amber-100/60 dark:bg-amber-950/30 dark:hover:bg-amber-950/60 transition-all hover:scale-[1.02] text-right shadow-xs hover:shadow-md cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md mb-3 group-hover:bg-amber-600 transition-colors">
                <Award className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h4 className="font-bold text-slate-900 dark:text-white text-base">حساب محاضر</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  إنشاء وإدارة وتحديث الكورسات للطلاب
                </p>
              </div>
              <div className="mt-4 w-full py-2 bg-amber-600 group-hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors">
                <span>سجل كمحاضر</span>
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              </div>
            </button>
          </div>

          <div className="pt-2 text-center">
            <button
              onClick={onClose}
              className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline"
            >
              إلغاء الأمر
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
