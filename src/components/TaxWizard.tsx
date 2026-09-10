import React, { useState } from 'react';
import { 
  User, 
  Briefcase, 
  TrendingUp, 
  HeartHandshake, 
  Check, 
  ArrowLeft, 
  ArrowRight,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Building2,
  ChevronDown,
  ChevronUp,
  Scale,
  ShieldCheck,
  Award,
  GraduationCap,
  MapPin,
  Sparkles,
  Baby,
  RotateCcw,
  Users
} from 'lucide-react';
import { TaxInputData, TaxYear, Employer106Record, Child } from '../types/tax';
import { GuideTooltip } from './GuideTooltip';
import { Form106Scanner } from './Form106Scanner';
import { ELIGIBLE_SETTLEMENTS } from '../data/taxRates';

interface TaxWizardProps {
  input: TaxInputData;
  onChange: (updated: Partial<TaxInputData>) => void;
  currentStep: number;
  onStepChange: (step: number) => void;
  onCalculate: () => void;
  activeSpouseTab?: 'primary' | 'spouse';
  onSpouseTabChange?: (tab: 'primary' | 'spouse') => void;
  onReset?: () => void;
}

const STEPS = [
  { id: 1, title: 'שנת מס ופרטים אישיים', shortTitle: 'פרטים אישיים', icon: User },
  { id: 2, title: 'מעסיקים וטפסי 106', shortTitle: 'טפסי 106', icon: Briefcase },
  { id: 3, title: 'הכנסות נוספות ושוק ההון', shortTitle: 'הכנסות ושוק ההון', icon: TrendingUp },
  { id: 4, title: 'זיכויים, הטבות ופטורים', shortTitle: 'זיכויים ופטורים', icon: HeartHandshake },
];

export const TaxWizard: React.FC<TaxWizardProps> = ({
  input,
  onChange,
  currentStep,
  onStepChange,
  onCalculate,
  activeSpouseTab = 'primary',
  onSpouseTabChange,
}) => {
  const [expandedEmployerId, setExpandedEmployerId] = useState<string | null>(null);

  // Initialize employers list if empty
  const employers: Employer106Record[] = (input.employers && input.employers.length > 0)
    ? input.employers
    : [{
        id: '1',
        employerName: input.employerName || 'מעסיק עיקרי',
        grossSalary: input.grossSalary || 0,
        taxDeducted: input.taxDeducted || 0,
        workMonths: input.workMonths || 12,
        employeePensionDeposit: input.employeePensionDeposit || 0,
        employerPensionDeposit: input.employerPensionDeposit || 0,
        nonInsuredSalary: input.nonInsuredSalary || 0,
      }];

  const updateEmployer = (id: string, updates: Partial<Employer106Record>) => {
    const updated = employers.map(emp => emp.id === id ? { ...emp, ...updates } : emp);
    
    // Sync top-level convenience values with primary employer or aggregates
    const totalGross = updated.reduce((acc, e) => acc + (e.grossSalary || 0), 0);
    const totalTax = updated.reduce((acc, e) => acc + (e.taxDeducted || 0), 0);
    const primary = updated[0];

    onChange({
      employers: updated,
      grossSalary: totalGross,
      taxDeducted: totalTax,
      workMonths: primary.workMonths,
      employerName: primary.employerName,
      employeePensionDeposit: primary.employeePensionDeposit,
      employerPensionDeposit: primary.employerPensionDeposit,
      nonInsuredSalary: primary.nonInsuredSalary,
      hadMultipleEmployers: updated.length > 1,
    });
  };

  const addEmployer = () => {
    const newEmp: Employer106Record = {
      id: Math.random().toString(),
      employerName: `מעסיק ${employers.length + 1}`,
      grossSalary: 0,
      taxDeducted: 0,
      workMonths: 12,
      employeePensionDeposit: 0,
      employerPensionDeposit: 0,
      nonInsuredSalary: 0,
    };
    const updated = [...employers, newEmp];
    onChange({
      employers: updated,
      hadMultipleEmployers: true,
    });
    setExpandedEmployerId(newEmp.id);
  };

  const removeEmployer = (id: string) => {
    if (employers.length <= 1) return;
    const updated = employers.filter(emp => emp.id !== id);
    const totalGross = updated.reduce((acc, e) => acc + (e.grossSalary || 0), 0);
    const totalTax = updated.reduce((acc, e) => acc + (e.taxDeducted || 0), 0);
    const primary = updated[0];

    onChange({
      employers: updated,
      grossSalary: totalGross,
      taxDeducted: totalTax,
      workMonths: primary.workMonths,
      employerName: primary.employerName,
      hadMultipleEmployers: updated.length > 1,
    });
  };

  const clearEmployerFields = (id: string) => {
    updateEmployer(id, {
      employerName: '',
      grossSalary: 0,
      taxDeducted: 0,
      workMonths: 12,
      employeePensionDeposit: 0,
      employerPensionDeposit: 0,
      nonInsuredSalary: 0,
    });
  };

  const totalGrossAll = employers.reduce((acc, e) => acc + (e.grossSalary || 0), 0);
  const totalTaxAll = employers.reduce((acc, e) => acc + (e.taxDeducted || 0), 0);
  const totalPensionEmployeeAll = employers.reduce((acc, e) => acc + (e.employeePensionDeposit || 0), 0);

  const addChild = () => {
    const newChild: Child = {
      id: Math.random().toString(),
      birthYear: input.taxYear,
    };
    onChange({ children: [...(input.children || []), newChild] });
  };

  const removeChild = (id: string) => {
    onChange({ children: (input.children || []).filter(c => c.id !== id) });
  };

  const updateChild = (id: string, updates: Partial<Child>) => {
    onChange({
      children: (input.children || []).map(c => c.id === id ? { ...c, ...updates } : c),
    });
  };

  const availableYears: TaxYear[] = [2025, 2024, 2023, 2022, 2021, 2020];
  const progressPercent = Math.round((currentStep / 4) * 100);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
      {/* Spouse Navigation Banner (if married and enabled) */}
      {input.maritalStatus === 'married' && onSpouseTabChange && (
        <div className="bg-indigo-950 text-white px-5 py-3 flex items-center justify-between border-b border-indigo-900">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Scale className="w-4 h-4 text-indigo-300" />
            <span>חישוב זוגי משותף לשנת {input.taxYear}:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSpouseTabChange('primary')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSpouseTab === 'primary'
                  ? 'bg-white text-indigo-950 shadow-xs'
                  : 'text-indigo-200 hover:bg-indigo-900/80'
              }`}
            >
              בן הזוג העיקרי ({input.employeeName || 'עובד א׳'})
            </button>
            <button
              type="button"
              onClick={() => {
                onChange({ includeSpouseCalculation: true });
                onSpouseTabChange('spouse');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSpouseTab === 'spouse'
                  ? 'bg-white text-indigo-950 shadow-xs'
                  : 'text-indigo-200 hover:bg-indigo-900/80'
              }`}
            >
              בן/בת הזוג ({input.spouseData?.employeeName || 'עובד ב׳'})
            </button>
          </div>
        </div>
      )}

      {/* Prominent Header Banner with Year and Step Progress */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-6 border-b border-indigo-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Tested Tax Year - High Contrast & Prominent */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/40 border border-indigo-400/40 flex items-center justify-center text-white shadow-inner">
              <Calendar className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="text-[11px] text-indigo-300 font-semibold uppercase tracking-wider">
                שנת מס נבדקת כעת
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                <span>שנת {input.taxYear}</span>
                <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  {input.taxYear === 2025 ? 'השנה האחרונה' : input.taxYear === 2020 ? 'מתיישן בקרוב!' : 'זכאות פתוחה'}
                </span>
              </div>
            </div>
          </div>

          {/* Step Progress Highlight - שלב X מתוך 4 */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:px-5 border border-white/15 flex flex-col items-end min-w-[200px]">
            <div className="flex items-center justify-between w-full text-xs font-bold mb-1.5">
              <span className="text-indigo-200">התקדמות בשאלון:</span>
              <span className="text-emerald-400 text-sm">
                שלב {currentStep} מתוך 4 ({progressPercent}%)
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-black/30 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Step Navigation Tabs (4 Steps) */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-white/15">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isDone = currentStep > step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepChange(step.id)}
                className={`flex items-center gap-2 p-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-right cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400/50 scale-[1.02]'
                    : isDone
                    ? 'bg-white/15 text-emerald-300 hover:bg-white/20'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs flex-shrink-0 font-black ${
                    isActive
                      ? 'bg-white text-indigo-900'
                      : isDone
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-white/20 text-white'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.id}
                </div>
                <span className="truncate">{step.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Step Body */}
      <div className="p-5 sm:p-8 min-h-[480px]">
        {/* ========================================================
            STEP 1: שנת מס ופרטים אישיים
        ======================================================== */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs tracking-wide">
                <span>שלב 1 מתוך 4</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">
                עבור איזו שנת מס תרצה לבדוק החזר מס?
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                לפי פקודת מס הכנסה, שכירים יכולים להגיש בקשה להחזר מס עבור <strong>עד 6 שנים אחורה</strong>. כל שנה נבדקת בנפרד.
              </p>
            </div>

            {/* Year Selector */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                בחר שנת מס לבדיקה:
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {availableYears.map((yr) => {
                  const isSelected = input.taxYear === yr;
                  const isExpiringSoon = yr === 2020;

                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => onChange({ taxYear: yr })}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/90 text-indigo-950 font-black shadow-md ring-2 ring-indigo-500/30 scale-[1.02]'
                          : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="text-xl font-bold">{yr}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {isExpiringSoon ? 'מתיישן בקרוב!' : yr === 2025 ? 'שנה אחרונה' : 'זמין להחזר'}
                      </div>
                      {isExpiringSoon && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                          דחוף
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gender Selection */}
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-bold text-slate-800">
                  מגדר (משפיע על נקודות הזיכוי הבסיסיות לפי החוק):
                </label>
                <span className="text-xs text-indigo-700 font-medium bg-indigo-50 px-2 py-0.5 rounded-md">
                  אישה מקבלת 2.75 נקודות כחוק (חצי נקודה נוספת)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => onChange({ gender: 'male' })}
                  className={`p-3.5 rounded-xl border text-center font-bold text-sm transition-all cursor-pointer ${
                    input.gender === 'male'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  גבר (2.25 נקודות זיכוי)
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ gender: 'female' })}
                  className={`p-3.5 rounded-xl border text-center font-bold text-sm transition-all cursor-pointer ${
                    input.gender === 'female'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  אישה (2.75 נקודות זיכוי)
                </button>
              </div>
            </div>

            {/* Marital Status & Dependent Spouse */}
            <div className="pt-2">
              <label className="block text-sm font-bold text-slate-800 mb-2">
                מצב משפחתי בשנת {input.taxYear}:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-xl">
                {(
                  [
                    { key: 'married', label: 'נשוי / נשואה' },
                    { key: 'single', label: 'רווק / רווקה' },
                    { key: 'divorced', label: 'גרוש / גרושה' },
                    { key: 'widowed', label: 'אלמן / אלמנה' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      if (item.key !== 'married') {
                        onChange({
                          maritalStatus: item.key,
                          hasDependentSpouse: false,
                          includeSpouseCalculation: false,
                          spouseData: undefined,
                        });
                        if (onSpouseTabChange) {
                          onSpouseTabChange('primary');
                        }
                      } else {
                        onChange({ maritalStatus: item.key });
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-center text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                      input.maritalStatus === item.key
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Married options: Dependent Spouse (סעיף 37) & Dual Calculation */}
              {input.maritalStatus === 'married' && (
                <div className="mt-4 p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl space-y-3">
                  <div className="font-bold text-indigo-950 text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-indigo-600" />
                      <span>מעמד בן/בת הזוג בשנת המס {input.taxYear} (דוח זוגי משותף - טופס 135):</span>
                    </div>
                    <span className="text-[11px] bg-indigo-100 text-indigo-900 font-bold px-2 py-0.5 rounded-md">
                      תיק משותף
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">
                    ברשות המסים דוח שנתי של זוג נשוי מנוהל כתיק משותף אחד, ומתבצע קיזוז הדדי בין החזר מס של בן זוג אחד לבין חוב של בן הזוג השני (אם קיים). אנא בחרו:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Option A: Both worked */}
                    <button
                      type="button"
                      onClick={() => {
                        onChange({
                          includeSpouseCalculation: true,
                          hasDependentSpouse: false,
                        });
                      }}
                      className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer relative ${
                        input.includeSpouseCalculation && !input.hasDependentSpouse
                          ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/30 shadow-xs'
                          : 'border-slate-200 bg-white/75 hover:border-slate-300 hover:bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs sm:text-sm font-black text-indigo-950 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-indigo-600" />
                          <span>שני בני הזוג עבדו (המלצה)</span>
                        </span>
                        {input.includeSpouseCalculation && !input.hasDependentSpouse && (
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        הזנת טפסי 106 של שני בני הזוג להפקת שומה זוגית סופית ומדויקת עם קיזוז הדדי מלא כחוק.
                      </p>
                    </button>

                    {/* Option B: Spouse did not work (Section 37) */}
                    <button
                      type="button"
                      onClick={() => {
                        onChange({
                          hasDependentSpouse: true,
                          includeSpouseCalculation: false,
                          spouseData: undefined,
                        });
                        if (onSpouseTabChange) {
                          onSpouseTabChange('primary');
                        }
                      }}
                      className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer relative ${
                        input.hasDependentSpouse && !input.includeSpouseCalculation
                          ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/30 shadow-xs'
                          : 'border-slate-200 bg-white/75 hover:border-slate-300 hover:bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs sm:text-sm font-black text-indigo-950 flex items-center gap-1.5">
                          <HeartHandshake className="w-4 h-4 text-indigo-600" />
                          <span>בן/בת הזוג לא עבדו כלל</span>
                        </span>
                        {input.hasDependentSpouse && !input.includeSpouseCalculation && (
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        סעיף 37 לפקודה: תוספת של 1 נקודת זיכוי שנתית (כ-2,900 ₪) ישירות למשכורת שלך! ללא צורך ב-106.
                      </p>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 2: מעסיקים וטפסי 106 (ללא דוגמאות מוכנות)
        ======================================================== */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs tracking-wide">
                  <span>שלב 2 מתוך 4</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">
                  מעסיקים ונתוני טופס 106 לשנת {input.taxYear}
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  עבדת אצל יותר ממעסיק אחד? תוכל להוסיף כל מעסיק בנפרד – המערכת תסכום את כל הנתונים אוטומטית!
                </p>
              </div>

              <button
                type="button"
                onClick={addEmployer}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>הוסף מעסיק נוסף (טופס 106)</span>
              </button>
            </div>

            {/* Aggregated Totals Bar (when multiple employers) */}
            {employers.length > 1 && (
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs font-medium">
                <div className="flex items-center gap-2 font-bold text-indigo-950">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>סך הכל מכל {employers.length} המעסיקים יחד:</span>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <span className="text-slate-500">משכורת ברוטו:</span>{' '}
                    <strong className="text-slate-900">₪{totalGrossAll.toLocaleString('he-IL')}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">מס שנוכה בפועל:</span>{' '}
                    <strong className="text-amber-800">₪{totalTaxAll.toLocaleString('he-IL')}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">הפרשות עובד לפנסיה:</span>{' '}
                    <strong className="text-emerald-800">₪{totalPensionEmployeeAll.toLocaleString('he-IL')}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Employers List */}
            <div className="space-y-6">
              {employers.map((emp, idx) => {
                const isExpanded = expandedEmployerId === emp.id || employers.length === 1;

                return (
                  <div
                    key={emp.id}
                    className="border border-slate-200 rounded-2xl bg-white shadow-xs overflow-hidden"
                  >
                    {/* Employer Card Header */}
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                          {idx + 1}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 text-sm sm:text-base">
                            {emp.employerName || `מעסיק ${idx + 1}`}
                          </span>
                          {idx === 0 && (
                            <span className="mr-2 text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">
                              מעסיק עיקרי
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => clearEmployerFields(emp.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-red-700 bg-white hover:bg-red-50 border border-slate-300 hover:border-red-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                          title="ניקוי כל שדות טופס 106 של מעסיק זה (למקרה שהסריקה שגויה)"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                          <span>ניקוי שדות</span>
                        </button>
                        {employers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEmployer(emp.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                            title="מחק מעסיק זה"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {employers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setExpandedEmployerId(isExpanded ? null : emp.id)}
                            className="p-1.5 text-slate-500 hover:text-slate-800"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Employer Card Body */}
                    {isExpanded && (
                      <div className="p-5 space-y-5">
                        {/* Scanner for this employer */}
                        <Form106Scanner
                          employerLabel={`טופס 106 - ${emp.employerName || `מעסיק ${idx + 1}`}`}
                          currentYear={input.taxYear}
                          onDataLoaded={(scanned) => {
                            updateEmployer(emp.id, {
                              grossSalary: scanned.grossSalary ?? emp.grossSalary,
                              taxDeducted: scanned.taxDeducted ?? emp.taxDeducted,
                              employerName: scanned.employerName || emp.employerName,
                              employeePensionDeposit: scanned.employeePensionDeposit ?? emp.employeePensionDeposit,
                              employerPensionDeposit: scanned.employerPensionDeposit ?? emp.employerPensionDeposit,
                              nonInsuredSalary: scanned.nonInsuredSalary ?? emp.nonInsuredSalary,
                            });
                          }}
                        />

                        {/* Manual inputs for Form 106 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-bold text-slate-700 block">
                                שם המעסיק:
                              </label>
                              <button
                                type="button"
                                onClick={() => clearEmployerFields(emp.id)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                                title="איפוס וניקוי כל נתוני טופס 106 שהוזנו או נסרקו עבור מעסיק זה"
                              >
                                <RotateCcw className="w-3 h-3 text-slate-500" />
                                <span>ניקוי שדות המעסיק</span>
                              </button>
                            </div>
                            <input
                              type="text"
                              value={emp.employerName || ''}
                              onChange={(e) => updateEmployer(emp.id, { employerName: e.target.value })}
                              placeholder="לדוגמה: חברת אלפא בע״מ"
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                              <span>משכורת ברוטו שנתית (שדה 158):</span>
                              <GuideTooltip fieldKey="grossSalary" />
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={emp.grossSalary || ''}
                                onChange={(e) => updateEmployer(emp.id, { grossSalary: Number(e.target.value) || 0 })}
                                placeholder="0"
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 pl-8"
                              />
                              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₪</div>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                              <span>מס הכנסה שנוכה (שדה 042):</span>
                              <GuideTooltip fieldKey="taxDeducted" />
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={emp.taxDeducted || ''}
                                onChange={(e) => updateEmployer(emp.id, { taxDeducted: Number(e.target.value) || 0 })}
                                placeholder="0"
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 pl-8 text-amber-900"
                              />
                              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₪</div>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1">
                              מספר חודשי עבודה אצל מעסיק זה:
                            </label>
                            <select
                              value={emp.workMonths || 12}
                              onChange={(e) => updateEmployer(emp.id, { workMonths: Number(e.target.value) })}
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm font-semibold cursor-pointer"
                            >
                              {Array.from({ length: 12 }, (_, i) => 12 - i).map((m) => (
                                <option key={m} value={m}>
                                  {m} חודשים
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                              <span>הפרשות עובד לפנסיה (שדות 045 / 086):</span>
                              <GuideTooltip fieldKey="pensionEmployee" />
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={emp.employeePensionDeposit || ''}
                                onChange={(e) => updateEmployer(emp.id, { employeePensionDeposit: Number(e.target.value) || 0 })}
                                placeholder="0"
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 pl-8 text-emerald-900"
                              />
                              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₪</div>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">זיכוי 35% ישיר ממס הכנסה</p>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                              <span>שכר לא מבוטח לקצבה (סעיף 47):</span>
                              <GuideTooltip fieldKey="nonInsuredSalary" />
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={emp.nonInsuredSalary || ''}
                                onChange={(e) => updateEmployer(emp.id, { nonInsuredSalary: Number(e.target.value) || 0 })}
                                placeholder="0"
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 pl-8"
                              />
                              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₪</div>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">זכאות להפקדה עצמאית וניכוי מס</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 3: הכנסות נוספות ושוק ההון (ביטוח לאומי + 867)
        ======================================================== */}
        {currentStep === 3 && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs tracking-wide">
                <span>שלב 3 מתוך 4</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">
                הכנסות נוספות: ביטוח לאומי ושוק ההון (טופס 867)
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                תשלומי ביטוח לאומי חייבים במס ורווחי/הפסדי הון מהבנק משפיעים ישירות על חישוב המס השנתי וההחזר המגיע לך.
              </p>
            </div>

            {/* PART A: National Insurance Benefits */}
            <div className="p-5 sm:p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <span>חלק א׳: תשלומי ביטוח לאומי החייבים במס בשנת {input.taxYear}</span>
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onChange({
                    receivedBituachLeumiBenefits: false,
                    unemploymentBenefits: 0,
                    reserveDutyBenefits: 0,
                    maternityBenefits: 0,
                    workInjuryBenefits: 0,
                    otherTaxableBituachLeumiBenefits: 0,
                    bituachLeumiTaxDeducted: 0,
                  })}
                  className={`flex-1 p-3 rounded-xl border text-center font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    !input.receivedBituachLeumiBenefits
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  לא קיבלתי גמלאות חייבות
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ receivedBituachLeumiBenefits: true })}
                  className={`flex-1 p-3 rounded-xl border text-center font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    input.receivedBituachLeumiBenefits
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  כן, קיבלתי תשלומים מביטוח לאומי
                </button>
              </div>

              {input.receivedBituachLeumiBenefits && (
                <div className="pt-3 space-y-4">
                  <div className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-indigo-100 text-xs text-slate-700">
                    <AlertCircle className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span>
                      הנתונים מופיעים במסמך: <strong>"אישור שנתי למס הכנסה על תשלומים וניכויים"</strong> באזור האישי באתר ביטוח לאומי.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">דמי אבטלה:</label>
                      <input
                        type="number"
                        value={input.unemploymentBenefits || ''}
                        onChange={(e) => onChange({ unemploymentBenefits: Number(e.target.value) || 0 })}
                        placeholder="0 ₪"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">תגמולי מילואים ישירים:</label>
                      <input
                        type="number"
                        value={input.reserveDutyBenefits || ''}
                        onChange={(e) => onChange({ reserveDutyBenefits: Number(e.target.value) || 0 })}
                        placeholder="0 ₪"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">דמי לידה ושמירת היריון:</label>
                      <input
                        type="number"
                        value={input.maternityBenefits || ''}
                        onChange={(e) => onChange({ maternityBenefits: Number(e.target.value) || 0 })}
                        placeholder="0 ₪"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">דמי פגיעה בעבודה:</label>
                      <input
                        type="number"
                        value={input.workInjuryBenefits || ''}
                        onChange={(e) => onChange({ workInjuryBenefits: Number(e.target.value) || 0 })}
                        placeholder="0 ₪"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">תגמולים חייבים אחרים:</label>
                      <input
                        type="number"
                        value={input.otherTaxableBituachLeumiBenefits || ''}
                        onChange={(e) => onChange({ otherTaxableBituachLeumiBenefits: Number(e.target.value) || 0 })}
                        placeholder="0 ₪"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold"
                      />
                    </div>

                    {/* מס שנוכה ע"י ביטוח לאומי */}
                    <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl">
                      <label className="text-xs font-bold text-amber-950 block mb-1">
                        מס שנוכה במקור בביטוח לאומי:
                      </label>
                      <input
                        type="number"
                        value={input.bituachLeumiTaxDeducted || ''}
                        onChange={(e) => onChange({ bituachLeumiTaxDeducted: Number(e.target.value) || 0 })}
                        placeholder="0 ₪"
                        className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-sm font-bold text-amber-950"
                      />
                      <p className="text-[10px] text-amber-900 mt-0.5">סכום זה מתווסף ישירות למס ששילמת!</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PART B: Capital Market (טופס 867) */}
            <div className="p-5 sm:p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <span>חלק ב׳: שוק ההון (טופס 867 מהבנק או מבית ההשקעות)</span>
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onChange({
                    investedInCapitalMarket: false,
                    capitalGains: 0,
                    capitalGains15: 0,
                    capitalLosses: 0,
                    capitalTaxPaid: 0,
                  })}
                  className={`flex-1 p-3 rounded-xl border text-center font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    !input.investedInCapitalMarket
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  לא השקעתי בשוק ההון
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ investedInCapitalMarket: true })}
                  className={`flex-1 p-3 rounded-xl border text-center font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    input.investedInCapitalMarket
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  כן, יש לי נתונים מטופס 867
                </button>
              </div>

              {input.investedInCapitalMarket && (
                <div className="pt-3 space-y-4">
                  <p className="text-xs text-slate-600">
                    הפסדים שלא קוזזו בבנק מקוזזים תחילה כנגד רווחי הון חייבים ב-25% ולאחר מכן כנגד 15%. מס שנוכה במקור בבנק מוחזר לחשבונך.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        רווחי הון ריאליים (25% מס):
                      </label>
                      <input
                        type="number"
                        value={input.capitalGains || ''}
                        onChange={(e) => onChange({ capitalGains: Number(e.target.value) || 0 })}
                        placeholder="0 ₪"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        רווחי הון נומינליים/ריבית (15% מס):
                      </label>
                      <input
                        type="number"
                        value={input.capitalGains15 || ''}
                        onChange={(e) => onChange({ capitalGains15: Number(e.target.value) || 0 })}
                        placeholder="0 ₪"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        הפסדי הון לקיזוז (טופס 867):
                      </label>
                      <input
                        type="number"
                        value={input.capitalLosses || ''}
                        onChange={(e) => onChange({ capitalLosses: Number(e.target.value) || 0 })}
                        placeholder="0 ₪"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-red-700"
                      />
                    </div>

                    <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl">
                      <label className="text-xs font-bold text-emerald-950 block mb-1">
                        מס שנוכה במקור בבנק:
                      </label>
                      <input
                        type="number"
                        value={input.capitalTaxPaid || ''}
                        onChange={(e) => onChange({ capitalTaxPaid: Number(e.target.value) || 0 })}
                        placeholder="0 ₪"
                        className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-sm font-black text-emerald-950"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 4: זיכויים, הטבות ופטורים (איחוד שלבים 4+5+6+8)
        ======================================================== */}
        {currentStep === 4 && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs tracking-wide">
                <span>שלב 4 מתוך 4</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">
                זיכויים, הטבות מס, ניכויים ופטורים לשנת {input.taxYear}
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                סעיפי פקודת מס הכנסה מעניקים הטבות ששוויין אלפי שקלים. סמן את הסעיפים הרלוונטיים עבורך:
              </p>
            </div>

            {/* SECTION 1: ילדים, משפחה, חזקה ומזונות */}
            <div className="p-5 sm:p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Baby className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">
                    ילדים, משפחה, חזקה ותשלומי מזונות
                  </h3>
                </div>
                <GuideTooltip fieldKey="children" />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onChange({ hasChildren: false, children: [] })}
                  className={`flex-1 p-3 rounded-xl border text-center font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    !input.hasChildren
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  אין לי ילדים מתחת לגיל 18
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChange({ hasChildren: true });
                    if (!input.children || input.children.length === 0) {
                      addChild();
                    }
                  }}
                  className={`flex-1 p-3 rounded-xl border text-center font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    input.hasChildren
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  כן, יש לי ילדים מתחת לגיל 18
                </button>
              </div>

              {input.hasChildren && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">פירוט שנת לידה של הילדים:</span>
                    <button
                      type="button"
                      onClick={addChild}
                      className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-2.5 py-1 rounded-lg cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>הוסף ילד</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {(input.children || []).map((child, idx) => {
                      const childAge = input.taxYear - child.birthYear;
                      return (
                        <div key={child.id} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-800">ילד #{idx + 1}</span>
                            <span className="text-[11px] text-indigo-600 block">
                              {childAge === 0 ? 'שנת לידה (פעוטות)' : `גיל ${childAge} בשנת ${input.taxYear}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <select
                              value={child.birthYear}
                              onChange={(e) => updateChild(child.id, { birthYear: Number(e.target.value) })}
                              className="bg-slate-50 border border-slate-300 text-slate-900 text-xs font-semibold rounded-lg px-2 py-1"
                            >
                              {Array.from({ length: 25 }, (_, i) => input.taxYear - i).map((y) => (
                                <option key={y} value={y}>{y}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => removeChild(child.id)}
                              className="text-slate-400 hover:text-red-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Single parent, custody, alimony, special needs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-200">
                    <label className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={input.isSingleParent || false}
                        onChange={(e) => onChange({ isSingleParent: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-xs font-semibold text-slate-800">
                        הורה יחיד / משפחה חד-הורית
                      </span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={input.receivesChildAllowance || false}
                        onChange={(e) => onChange({ receivesChildAllowance: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-xs font-semibold text-slate-800">
                        הילדים בחזקתי ומקבל/ת קצבת ילדים מביטוח לאומי
                      </span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={input.paysAlimony || false}
                        onChange={(e) => onChange({ paysAlimony: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-xs font-semibold text-slate-800">
                        משלם/ת מזונות ילדים (סעיף 40(ב)(2) - 1 נקודה)
                      </span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={input.hasSpecialNeedsDependent || false}
                        onChange={(e) => onChange({ hasSpecialNeedsDependent: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-xs font-semibold text-slate-800">
                        ילד עם צרכים מיוחדים / נטול יכולת (סעיף 45 - 2 נקודות)
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2: תואר אקדמי (סעיף 40ד) */}
            <div className="p-5 sm:p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={input.hasAcademicDegree || false}
                    onChange={(e) => onChange({ hasAcademicDegree: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                    <span className="font-bold text-slate-900 text-sm sm:text-base">
                      סיימתי תואר אקדמי או לימודי מקצוע (סעיף 40ד לפקודה)
                    </span>
                  </div>
                </label>
                <GuideTooltip fieldKey="academicDegree" />
              </div>

              {input.hasAcademicDegree && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">סוג התואר:</label>
                    <select
                      value={input.degreeType || 'bachelor'}
                      onChange={(e) => onChange({ degreeType: e.target.value as any })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold"
                    >
                      <option value="bachelor">תואר ראשון (1 נקודת זיכוי)</option>
                      <option value="master">תואר שני (0.5 נקודת זיכוי)</option>
                      <option value="practical_engineer">הנדסאי / לימודי מקצוע (1 נקודה)</option>
                      <option value="medicine">רפואה / רפואת שיניים</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">שנת סיום התואר:</label>
                    <select
                      value={input.graduationYear || input.taxYear - 1}
                      onChange={(e) => onChange({ graduationYear: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold"
                    >
                      {Array.from({ length: 6 }, (_, i) => input.taxYear - i).map((y) => (
                        <option key={y} value={y}>שנת {y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3: חייל משוחרר ושירות לאומי (סעיף 39א - חודש שחרור ו-36 חודשים) */}
            <div className="p-5 sm:p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={input.isDischargedSoldier || false}
                    onChange={(e) => onChange({
                      isDischargedSoldier: e.target.checked,
                      dischargeMonth: input.dischargeMonth || 1,
                      dischargeYear: input.dischargeYear || input.taxYear,
                    })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-600" />
                    <span className="font-bold text-slate-900 text-sm sm:text-base">
                      חייל/ת משוחרר/ת או שירות לאומי (סעיף 39א לפקודה)
                    </span>
                  </div>
                </label>
                <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded">
                  החל מחודש שלאחר השחרור למשך 36 חודש
                </span>
              </div>

              {input.isDischargedSoldier && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">אופי השירות:</label>
                    <select
                      value={input.serviceType || 'combat'}
                      onChange={(e) => onChange({ serviceType: e.target.value as any })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold"
                    >
                      <option value="combat">שירות קרבי / מלא (2 נקודות זיכוי שנתיות)</option>
                      <option value="regular">תומך / עורפי / שירות לאומי (1 נקודת זיכוי)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">חודש השחרור (1-12):</label>
                    <select
                      value={input.dischargeMonth || 1}
                      onChange={(e) => onChange({ dischargeMonth: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>חודש {m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">שנת השחרור:</label>
                    <select
                      value={input.dischargeYear || input.taxYear}
                      onChange={(e) => onChange({ dischargeYear: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold"
                    >
                      {Array.from({ length: 5 }, (_, i) => input.taxYear - i).map((y) => (
                        <option key={y} value={y}>שנת {y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 4: עולה חדש ותושב חוזר (סעיף 35 - חודש עליה וחישוב חודשי) */}
            <div className="p-5 sm:p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={input.isNewImmigrant || false}
                    onChange={(e) => onChange({
                      isNewImmigrant: e.target.checked,
                      immigrationMonth: input.immigrationMonth || 1,
                      immigrationYear: input.immigrationYear || input.taxYear,
                    })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    <span className="font-bold text-slate-900 text-sm sm:text-base">
                      עולה חדש / תושב חוזר ותיק (סעיף 35 לפקודה - 42 חודשים)
                    </span>
                  </div>
                </label>
                <GuideTooltip fieldKey="newImmigrant" />
              </div>

              {input.isNewImmigrant && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 max-w-md">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">חודש העלייה (1-12):</label>
                    <select
                      value={input.immigrationMonth || 1}
                      onChange={(e) => onChange({ immigrationMonth: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>חודש {m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">שנת העלייה:</label>
                    <select
                      value={input.immigrationYear || input.taxYear}
                      onChange={(e) => onChange({ immigrationYear: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold"
                    >
                      {Array.from({ length: 6 }, (_, i) => input.taxYear - i).map((y) => (
                        <option key={y} value={y}>שנת {y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 5: פטור בגין נכות רפואית בלבד (סעיף 9(5) לפקודה) */}
            <div className="p-5 sm:p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={input.hasMedicalDisability || false}
                    onChange={(e) => onChange({
                      hasMedicalDisability: e.target.checked,
                      disabilityPeriod: input.disabilityPeriod || 'permanent_or_over_365',
                    })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    <span className="font-bold text-slate-900 text-sm sm:text-base">
                      פטור ממס בגין נכות רפואית 90%+ (סעיף 9(5) לפקודת מס הכנסה)
                    </span>
                  </div>
                </label>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                  פטור ממס הכנסה
                </span>
              </div>

              {/* Distinction warning - Medical disability ONLY */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950">
                <strong>דגש מהותי כחוק:</strong> הפטור ניתן אך ורק בגין <strong>נכות רפואית משוקללת (90% ומעלה)</strong> שנקבעה בוועדה רפואית לפי פקודת מס הכנסה או ביטוח לאומי, <strong>ולא</strong> בגין דרגת אי-כושר או אובדן כושר עבודה בלבד.
              </div>

              {input.hasMedicalDisability && (
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-800 block">תקופת הנכות וזכאות לתגמול:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { key: 'temporary_under_185', label: 'זמנית - פחות מ-185 ימים (ללא פטור כחוק)' },
                      { key: 'temporary_185_to_364', label: 'זמנית - בין 185 ל-364 ימים (פטור קטן עד ~₪80,040)' },
                      { key: 'permanent_or_over_365', label: 'קבועה או מעל 365 ימים (פטור מלא עד ~₪480,000)' },
                      { key: 'eligible_for_monthly_stipend', label: 'זכאי לתגמול חודשי לפי חוק הנכים/נפגעי איבה (מוגדל עד ~₪720,000)' },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => onChange({ disabilityPeriod: opt.key as any })}
                        className={`p-2.5 rounded-xl border text-right text-xs font-semibold transition-all cursor-pointer ${
                          input.disabilityPeriod === opt.key
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-950 font-bold ring-1 ring-indigo-500'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 6: יישוב מזכה (סעיף 11) */}
            <div className="p-5 sm:p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={input.livesInEligibleSettlement || false}
                    onChange={(e) => onChange({
                      livesInEligibleSettlement: e.target.checked,
                      settlementName: input.settlementName || ELIGIBLE_SETTLEMENTS[0].name,
                      monthsInSettlement: input.monthsInSettlement || 12,
                    })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-indigo-600" />
                    <span className="font-bold text-slate-900 text-sm sm:text-base">
                      מגורים ביישוב מזכה (זיכוי פריפריה וקו עימות לפי סעיף 11)
                    </span>
                  </div>
                </label>
                <GuideTooltip fieldKey="eligibleSettlement" />
              </div>

              {input.livesInEligibleSettlement && (
                <div className="pt-2 border-t border-slate-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">בחר יישוב:</label>
                      <select
                        value={input.settlementName || ELIGIBLE_SETTLEMENTS[0].name}
                        onChange={(e) => onChange({ settlementName: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold"
                      >
                        {ELIGIBLE_SETTLEMENTS.map((s) => (
                          <option key={s.name} value={s.name}>
                            {s.name} ({Math.round(s.rate * 100)}% הנחה, תקרה ₪{(s.ceiling / 1000)}k)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">חודשי מגורים ביישוב בשנת {input.taxYear}:</label>
                      <select
                        value={input.monthsInSettlement || 12}
                        onChange={(e) => onChange({ monthsInSettlement: Number(e.target.value) })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold"
                      >
                        {Array.from({ length: 12 }, (_, i) => 12 - i).map((m) => (
                          <option key={m} value={m}>{m} חודשים</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 7: תרומות מוכרות סעיף 46 */}
            <div className="p-5 sm:p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={input.madeDonations || false}
                    onChange={(e) => onChange({ madeDonations: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="w-5 h-5 text-indigo-600" />
                    <span className="font-bold text-slate-900 text-sm sm:text-base">
                      תרמתי למוסדות מוכרים לפי סעיף 46 (מעל 200 ₪ בשנה)
                    </span>
                  </div>
                </label>
                <span className="text-xs text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded">
                  35% החזר כספי ישיר!
                </span>
              </div>

              {input.madeDonations && (
                <div className="pt-2 border-t border-slate-200 max-w-sm">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    סך כל התרומות בשנת {input.taxYear}:
                  </label>
                  <input
                    type="number"
                    value={input.donationAmount || ''}
                    onChange={(e) => onChange({ donationAmount: Number(e.target.value) || 0 })}
                    placeholder="0 ₪"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold"
                  />
                  {input.donationAmount && input.donationAmount > 200 && (
                    <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                      החזר צפוי מתרומות: ₪{Math.round(input.donationAmount * 0.35).toLocaleString('he-IL')}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* SECTION 8: ביטוח חיים, פנסיה וקופת גמל (סעיף 45 ו-47) */}
            <div className="p-5 sm:p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={input.madeSelfPensionDeposits || false}
                    onChange={(e) => onChange({ madeSelfPensionDeposits: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    <span className="font-bold text-slate-900 text-sm sm:text-base">
                      ביטוח חיים / משכנתא או הפקדות עצמאיות לקופת גמל (סעיפים 45 ו-47)
                    </span>
                  </div>
                </label>
                <GuideTooltip fieldKey="selfLifeInsurance" />
              </div>

              {input.madeSelfPensionDeposits && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">ביטוח חיים ומשכנתא (25% זיכוי):</label>
                    <input
                      type="number"
                      value={input.selfLifeInsuranceAmount || ''}
                      onChange={(e) => onChange({ selfLifeInsuranceAmount: Number(e.target.value) || 0 })}
                      placeholder="סכום שנתי ב-₪"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">הפקדה עצמאית לפנסיה/גמל (35% זיכוי):</label>
                    <input
                      type="number"
                      value={input.selfPensionAmount || ''}
                      onChange={(e) => onChange({ selfPensionAmount: Number(e.target.value) || 0 })}
                      placeholder="סכום שנתי ב-₪"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 9: מוסד סיעודי והשתלמות מקצועית */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={input.hasInstitutionalNursingExpenses || false}
                    onChange={(e) => onChange({
                      hasInstitutionalNursingExpenses: e.target.checked,
                      hasDeductibleExpenses: e.target.checked || input.hasProfessionalStudiesExpenses,
                      institutionalNursingExpenses: e.target.checked ? (input.institutionalNursingExpenses || 0) : 0,
                    })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">
                    החזקת הורה/קרוב במוסד סיעודי (סעיף 44 - 35% זיכוי)
                  </span>
                </label>
                {input.hasInstitutionalNursingExpenses && (
                  <input
                    type="number"
                    value={input.institutionalNursingExpenses || ''}
                    onChange={(e) => onChange({ institutionalNursingExpenses: Number(e.target.value) || 0 })}
                    placeholder="סך תשלום שנתי למוסד ב-₪"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold"
                  />
                )}
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={input.hasProfessionalStudiesExpenses || false}
                    onChange={(e) => onChange({
                      hasProfessionalStudiesExpenses: e.target.checked,
                      hasDeductibleExpenses: e.target.checked || input.hasInstitutionalNursingExpenses,
                      professionalStudiesExpenses: e.target.checked ? (input.professionalStudiesExpenses || 0) : 0,
                    })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">
                    השתלמות מקצועית לשמירה על הקיים (ניכוי מהכנסה)
                  </span>
                </label>
                {input.hasProfessionalStudiesExpenses && (
                  <input
                    type="number"
                    value={input.professionalStudiesExpenses || ''}
                    onChange={(e) => onChange({ professionalStudiesExpenses: Number(e.target.value) || 0 })}
                    placeholder="הוצאות קורסים/ספרות ב-₪"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="border-t border-slate-200 bg-slate-50/80 p-4 sm:p-5 flex items-center justify-between">
        <div>
          {currentStep > 1 && (
            <button
              type="button"
              onClick={() => onStepChange(currentStep - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>הקודם</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => onStepChange(currentStep + 1)}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition-colors cursor-pointer"
            >
              <span>המשך לשלב הבא</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onCalculate}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base sm:text-lg shadow-lg hover:shadow-xl transition-all cursor-pointer ring-4 ring-emerald-500/20"
            >
              <Sparkles className="w-5 h-5" />
              <span>חשב החזר מס מלא לשנת {input.taxYear}!</span>
              <ArrowLeft className="w-5 h-5 mr-1" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
