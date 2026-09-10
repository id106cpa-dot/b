import React, { useState } from 'react';
import { ShieldCheck, Mail, Phone, User, CheckCircle2, Lock, ArrowLeft, Loader2, X } from 'lucide-react';
import { TaxYear } from '../types/tax';

export interface LeadInfo {
  fullName: string;
  email: string;
  phone: string;
}

interface LeadCaptureModalProps {
  isOpen: boolean;
  taxYear: TaxYear;
  onClose: () => void;
  onSubmit: (lead: LeadInfo) => Promise<void> | void;
  initialLead?: Partial<LeadInfo>;
}

export const LeadCaptureModal: React.FC<LeadCaptureModalProps> = ({
  isOpen,
  taxYear,
  onClose,
  onSubmit,
  initialLead,
}) => {
  const [fullName, setFullName] = useState(initialLead?.fullName || '');
  const [email, setEmail] = useState(initialLead?.email || '');
  const [phone, setPhone] = useState(initialLead?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!fullName.trim()) {
      setValidationError('נא להזין שם מלא');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setValidationError('נא להזין כתובת דוא״ל תקינה');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 9) {
      setValidationError('נא להזין מספר טלפון תקין (לפחות 9 ספרות)');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
    } catch (err) {
      console.error('Error submitting lead:', err);
      // Still proceed on error to not block the user
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden relative">
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 p-6 text-white text-right relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute left-4 top-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            title="סגור"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>שומת מס לשנת {taxYear} מוכנה לצפייה</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black tracking-tight">
            לקבלת תוצאת חישוב שומת המס והדוח
          </h3>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1">
            הזן את פרטיך לצפייה מיידית בתוצאה המלאה. פירוט השומה יישלח במקביל לכתובת המייל שלך.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl text-right">
              {validationError}
            </div>
          )}

          {/* Full Name */}
          <div className="text-right">
            <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
              שם מלא: <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="ישראל ישראלי"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-9 text-right"
              />
              <User className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Email */}
          <div className="text-right">
            <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
              כתובת דוא״ל: <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@example.com"
                dir="ltr"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-9 text-right"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              העתק מסודר של שומת המס יישלח לכתובת זו
            </p>
          </div>

          {/* Phone */}
          <div className="text-right">
            <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
              מספר טלפון: <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="050-1234567"
                dir="ltr"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-9 text-right"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Privacy statement - highlighted as requested */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-right">
            <Lock className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-950 leading-relaxed font-medium">
              <strong className="font-bold block text-emerald-900">התחייבות לשמירה על פרטיותך:</strong>
              הפרטים מאובטחים, אינם נשמרים במאגר מידע פומבי, ושום מידע לא יועבר לשום גורם ללא הסכמתך המפורשת.
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>מעבד את הנתונים ושולח שומה...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>קבל את מסך התוצאה והדוח המלא</span>
                  <ArrowLeft className="w-4 h-4 mr-1" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
