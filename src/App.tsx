import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Sparkles, 
  HelpCircle, 
  FileCheck2, 
  History, 
  ArrowLeft, 
  Coins, 
  RotateCcw, 
  ChevronDown, 
  Info,
  Users,
  Building2,
  AlertTriangle
} from 'lucide-react';
import { TaxInputData, TaxYear, createDefaultTaxInput } from './types/tax';
import { calculateTaxRefund } from './utils/taxCalculator';
import { TaxWizard } from './components/TaxWizard';
import { ResultDashboard } from './components/ResultDashboard';
import { LeadCaptureModal, LeadInfo } from './components/LeadCaptureModal';

const INITIAL_PRIMARY_DATA: TaxInputData = createDefaultTaxInput({
  taxYear: 2024,
  gender: 'male',
  maritalStatus: 'single',
  isIsraeliResident: true,
  employeeName: '',

  employers: [
    {
      id: 'emp-1',
      employerName: '',
      grossSalary: 0,
      taxDeducted: 0,
      workMonths: 12,
      employeePensionDeposit: 0,
      employerPensionDeposit: 0,
      nonInsuredSalary: 0,
    }
  ],
  grossSalary: 0,
  taxDeducted: 0,
  workMonths: 12,
  employerName: '',
  employeePensionDeposit: 0,
  employerPensionDeposit: 0,

  receivedBituachLeumiBenefits: false,
  unemploymentBenefits: 0,
  reserveDutyBenefits: 0,
  maternityBenefits: 0,
  workInjuryBenefits: 0,
  otherTaxableBituachLeumiBenefits: 0,
  bituachLeumiTaxDeducted: 0,

  hasChildren: false,
  children: [],
  isSingleParent: false,
  paysAlimony: false,
  hasSpecialNeedsDependent: false,

  hasAcademicDegree: false,
  isDischargedSoldier: false,
  isNewImmigrant: false,

  livesInEligibleSettlement: false,

  investedInCapitalMarket: false,
  capitalGains: 0,
  capitalLosses: 0,
  capitalTaxPaid: 0,

  madeSelfPensionDeposits: false,
  selfPensionAmount: 0,
  selfLifeInsuranceAmount: 0,
  madeDonations: false,
  donationAmount: 0,

  hasDependentSpouse: false,
  includeSpouseCalculation: false,
  spouseData: undefined,
});

export default function App() {
  const [taxData, setTaxData] = useState<TaxInputData>(INITIAL_PRIMARY_DATA);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'wizard' | 'results'>('wizard');
  const [showFaq, setShowFaq] = useState<boolean>(false);
  const [activeSpouseTab, setActiveSpouseTab] = useState<'primary' | 'spouse'>('primary');
  const [isLeadModalOpen, setIsLeadModalOpen] = useState<boolean>(false);
  const [hasSubmittedLead, setHasSubmittedLead] = useState<boolean>(false);
  const [userLeadInfo, setUserLeadInfo] = useState<LeadInfo | null>(null);
  const [showSpouseMissingModal, setShowSpouseMissingModal] = useState<boolean>(false);

  const handleRequestResults = () => {
    // When married, Israel Tax Authority files a joint household assessment (Form 135).
    // The results MUST only be shown once spouse data has been provided (or spouse is marked non-working).
    if (taxData.maritalStatus === 'married' && taxData.includeSpouseCalculation) {
      const spouseHasSalary = 
        (taxData.spouseData?.employers && taxData.spouseData.employers.some(e => (e.grossSalary || 0) > 0 || (e.taxDeducted || 0) > 0)) ||
        ((taxData.spouseData?.grossSalary || 0) > 0);

      if (!spouseHasSalary) {
        setShowSpouseMissingModal(true);
        return;
      }
    }

    if (hasSubmittedLead) {
      setViewMode('results');
    } else {
      setIsLeadModalOpen(true);
    }
  };

  const handleLeadSubmit = async (lead: LeadInfo) => {
    setUserLeadInfo(lead);
    setHasSubmittedLead(true);
    setIsLeadModalOpen(false);

    // Personalize taxData with user's name/phone if empty
    updateTaxData({
      employeeName: taxData.employeeName || lead.fullName,
      phone: taxData.phone || lead.phone,
    });

    // Send tax assessment report to user email and business email via server API
    try {
      await fetch('/api/send-tax-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({
  fullName: lead.fullName,
  email: lead.email,
  phone: lead.phone,
  taxYear: taxData.taxYear,
  totalIncome: calculationResult.totalIncome,
  taxAlreadyPaid: calculationResult.taxAlreadyPaid,
  taxLiabilityFinal: calculationResult.taxLiabilityFinal,
  nominalRefund: calculationResult.nominalRefund,
  finalRefundWithInterest: calculationResult.finalRefundWithInterest,
  creditsSummary: calculationResult.creditsSummary,
  isFamily: taxData.maritalStatus === 'married' && !!taxData.includeSpouseCalculation,
}),
    
      });
    } catch (err) {
      console.warn('Could not dispatch tax report email notification:', err);
    }

    setViewMode('results');
  };

  const updateTaxData = (updated: Partial<TaxInputData>) => {
    if (activeSpouseTab === 'spouse') {
      setTaxData((prev) => ({
        ...prev,
        spouseData: {
          ...(prev.spouseData || {
            taxYear: prev.taxYear,
            gender: 'female',
            maritalStatus: 'married',
            isIsraeliResident: true,
            grossSalary: 0,
            taxDeducted: 0,
            workMonths: 12,
            hasChildren: prev.hasChildren,
            children: prev.children,
          }),
          ...updated,
        }
      }));
    } else {
      setTaxData((prev) => {
        const isNotMarried = updated.maritalStatus && updated.maritalStatus !== 'married';
        return {
          ...prev,
          ...updated,
          ...(isNotMarried ? {
            hasDependentSpouse: false,
            includeSpouseCalculation: false,
            spouseData: undefined,
          } : {}),
          // sync tax year to spouse if present
          ...(updated.taxYear && prev.spouseData ? {
            spouseData: { ...prev.spouseData, taxYear: updated.taxYear }
          } : {})
        };
      });
      if (updated.maritalStatus && updated.maritalStatus !== 'married') {
        setActiveSpouseTab('primary');
      }
    }
  };

  const handleReset = () => {
    setTaxData({
      ...INITIAL_PRIMARY_DATA,
      maritalStatus: 'single',
      grossSalary: 0,
      taxDeducted: 0,
      workMonths: 12,
      hadEmploymentBreak: false,
      hasChildren: false,
      children: [],
      madeDonations: false,
      donationAmount: 0,
      employers: [
        {
          id: '1',
          employerName: 'מעסיק 1',
          grossSalary: 0,
          taxDeducted: 0,
          workMonths: 12,
          employeePensionDeposit: 0,
          employerPensionDeposit: 0,
          nonInsuredSalary: 0,
        }
      ],
      hasDependentSpouse: false,
      includeSpouseCalculation: false,
      spouseData: undefined,
    });
    setActiveSpouseTab('primary');
    setCurrentStep(1);
    setViewMode('wizard');
  };

  // Live calculation results
  const calculationResult = useMemo(() => {
    return calculateTaxRefund(taxData);
  }, [taxData]);

  const isRefund = calculationResult.netDifference > 0;
  const isFamilyRefund = taxData.maritalStatus === 'married' && (calculationResult.combinedFamilyTotalRefund || 0) > 0;

  // Active data for wizard display depending on spouse tab
  const wizardActiveData = taxData.maritalStatus === 'married' && activeSpouseTab === 'spouse' && taxData.spouseData
    ? taxData.spouseData
    : taxData;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Assistant',sans-serif]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0f2942] text-white border-b border-slate-700 shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Elegant Emblem Badge for Maksum Zchuyot */}
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-[#0f2942] flex items-center justify-center font-black text-xl shadow-md border border-amber-300 flex-shrink-0 tracking-tight">
              מז
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-white text-lg sm:text-xl leading-tight tracking-tight">
                  מקסום זכויות
                </h1>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  ייעוץ מס והחזרי מס
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full hidden sm:inline-block">
                  מעודכן 2020-2026
                </span>
              </div>
              <p className="text-xs text-slate-300 hidden sm:block">
                בדיקת שומת מס והחזרי מס לשכירים • עד 6 שנים אחורה • שירות מקצועי לכל הארץ
              </p>
            </div>
          </div>

          {/* Quick Live Status / View Mode */}
          <div className="flex items-center gap-2.5">
            {/* Direct WhatsApp Pill */}
            <a
              href="https://wa.me/972552520065?text=%D7%A9%D7%9C%D7%95%D7%9D%20%D7%9E%D7%A7%D7%A1%D7%95%D7%9D%20%D7%96%D7%9B%D7%95%D7%99%D7%95%D7%AA%2C%20%D7%90%D7%A9%D7%9E%D7%97%20%D7%9C%D7%91%D7%A8%D7%A8%20%D7%9C%D7%92%D7%91%D7%99%20%D7%94%D7%97%D7%96%D7%A8%20%D7%9E%D7%A1"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs"
              title="פנייה מהירה בוואטסאפ: 055-2520065"
            >
              <span>055-2520065</span>
            </a>

            {calculationResult.netDifference !== 0 && (
              <div
                onClick={() => setViewMode(viewMode === 'wizard' ? 'results' : 'wizard')}
                className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                  taxData.maritalStatus === 'married' && taxData.includeSpouseCalculation
                    ? calculationResult.isCombinedDebt
                      ? 'bg-red-950/80 text-red-200 border-red-500/50 hover:bg-red-900'
                      : 'bg-emerald-950/80 text-emerald-200 border-emerald-500/50 hover:bg-emerald-900'
                    : isRefund
                      ? 'bg-emerald-950/80 text-emerald-200 border-emerald-500/50 hover:bg-emerald-900'
                      : 'bg-red-950/80 text-red-200 border-red-500/50 hover:bg-red-900'
                }`}
                title="לחץ לצפייה בפירוט המלא"
              >
                <Coins className="w-4 h-4 text-amber-400" />
                <span>
                  {taxData.maritalStatus === 'married' && taxData.includeSpouseCalculation ? (
                    calculationResult.isCombinedDebt ? (
                      <>
                        חוב משפחתי כולל:{' '}
                        <strong className="text-red-300">₪{Math.abs(calculationResult.combinedDebtAmount || 0).toLocaleString('he-IL')}</strong>
                      </>
                    ) : (
                      <>
                        החזר משפחתי כולל:{' '}
                        <strong className="text-white">₪{(calculationResult.combinedFamilyTotalRefund || 0).toLocaleString('he-IL')}</strong>
                      </>
                    )
                  ) : (
                    <>
                      {isRefund ? 'החזר משוער:' : 'חוב מס משוער:'}{' '}
                      <strong className={isRefund ? 'text-white' : 'text-red-300'}>
                        ₪{Math.abs(isRefund ? calculationResult.finalRefundWithInterest : calculationResult.netDifference).toLocaleString('he-IL')}
                      </strong>
                    </>
                  )}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
              title="ניקוי כל השדות והתחלת חישוב חדש"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>ניקוי שדות</span>
            </button>

            {viewMode === 'wizard' ? (
              <button
                type="button"
                onClick={handleRequestResults}
                className="bg-amber-500 hover:bg-amber-400 text-[#0f2942] font-black text-xs sm:text-sm px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>צפה בתוצאות</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setViewMode('wizard')}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>חזרה לשאלון</span>
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Banner with 6-year law reminder & Features */}
        <div className="mb-6 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-indigo-950">
          <div className="flex items-center gap-2.5">
            <Info className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <div>
              <span className="font-bold">זכאות רטרואקטיבית לשכירים: </span>
              <span>
                ניתן לקבל החזרי מס עד 6 שנים אחורה בתוספת <strong>4% ריבית שנתית והצמדה למדד</strong> פטורים ממס! תמיכה מלאה במספר מעסיקים ובחישוב זוגי.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
            <span className="font-semibold text-slate-500">שנת הבדיקה:</span>
            <span className="bg-white border border-indigo-200 text-indigo-800 font-bold px-2.5 py-0.5 rounded-lg">
              {taxData.taxYear}
            </span>
          </div>
        </div>

        {/* View switching */}
        {viewMode === 'wizard' ? (
          <TaxWizard
            input={wizardActiveData}
            onChange={updateTaxData}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            onCalculate={handleRequestResults}
            activeSpouseTab={activeSpouseTab}
            onSpouseTabChange={(tab) => setActiveSpouseTab(tab)}
            onReset={handleReset}
          />
        ) : (
          <ResultDashboard
            result={calculationResult}
            input={taxData}
            onEdit={() => setViewMode('wizard')}
            onReset={handleReset}
            onCheckAnotherYear={() => {
              const nextYear = (taxData.taxYear > 2020 ? taxData.taxYear - 1 : 2025) as TaxYear;
              updateTaxData({ taxYear: nextYear });
              setCurrentStep(1);
              setViewMode('wizard');
            }}
          />
        )}

        {/* Live bottom bar for mobile / sticky progress */}
        {viewMode === 'wizard' && calculationResult.taxAlreadyPaid > 0 && (
          <div className="mt-6 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                ₪
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">
                  {taxData.maritalStatus === 'married' && taxData.includeSpouseCalculation && calculationResult.combinedFamilyTotalRefund ? (
                    'הערכת החזר מס משפחתי כולל (קרן + ריבית והצמדה):'
                  ) : (
                    `הערכת החזר מס (שנת ${taxData.taxYear}):`
                  )}
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {taxData.maritalStatus === 'married' && taxData.includeSpouseCalculation && calculationResult.combinedFamilyTotalRefund ? (
                    <span className="text-emerald-600">
                      ₪{calculationResult.combinedFamilyTotalRefund.toLocaleString('he-IL')}+
                    </span>
                  ) : isRefund ? (
                    <span className="text-emerald-600">
                      ₪{calculationResult.finalRefundWithInterest.toLocaleString('he-IL')}+
                    </span>
                  ) : calculationResult.netDifference < 0 ? (
                    <span className="text-amber-600">
                      ₪{Math.abs(calculationResult.netDifference).toLocaleString('he-IL')} חבות
                    </span>
                  ) : (
                    <span>₪0</span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRequestResults}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>צפה בשומת המס וההחזר המלא</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Educational Q&A section */}
        <div className="mt-10 border-t border-slate-200 pt-8">
          <button
            type="button"
            onClick={() => setShowFaq(!showFaq)}
            className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 transition-colors text-right cursor-pointer"
          >
            <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
              <span>שאלות ותשובות נפוצות על שדות טופס 106, מספר מעסיקים וזוגות נשואים</span>
            </div>
            <ChevronDown className={`w-5 h-5 text-slate-400 transform transition-transform ${showFaq ? 'rotate-180' : ''}`} />
          </button>

          {showFaq && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm mb-1">
                  1. מה המשמעות של שדות 045/086 ו-036/081 בטופס 106?
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  שדה 045/086 מציג את הפרשות העובד לפנסיה ולקצבה ומזכה אותך ישירות ב-35% זיכוי מס לפי סעיף 45. שדה 036/081 מציג הפרשות מעביד שחויבו במס (מעל תקרת הפטור). שדות אלו קריטיים לחישוב מדויק של חבות המס.
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm mb-1">
                  2. עבדתי אצל שני מעסיקים במקביל ולא עשיתי תיאום מס, מה קורה?
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  המעסיק המשני מחויב לפי חוק לנכות את מדרגת המס המקסימלית (עד 47%). בהגשת דוח שנתי (טופס 135) שסוכם את שני המעסיקים יחד, המס מחושב מחדש לפי מדרגות שנתיות אמיתיות, וכל הכסף העודף מוחזר לחשבון הבנק שלך!
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm mb-1">
                  3. איך מחושב החזר מס עבור זוג נשוי?
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  אם בן/בת הזוג לא עבדו, מגיעה לך נקודת זיכוי לפי סעיף 37 (תוספת של כ-₪2,900 לשנה). אם שניכם עבדתם, מבוצע חישוב נפרד לכל אחד ובנוסף שקלול של כלל נקודות הזיכוי של הילדים והתרומות המשפחתיות – לקבלת סך ההחזר המשותף שנכנס לבנק.
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm mb-1">
                  4. האם מס הכנסה משלם ריבית והצמדה על ההחזר?
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  כן! לפי סעיף 160 לפקודה, המדינה משלמת 4% ריבית שנתית מצטברת בתוספת הצמדה למדד המחירים לצרכן מיום תום שנת המס ועד התשלום. הריבית וההצמדה פטורות ממס לחלוטין!
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-[#0f2942] text-slate-300 py-8 text-center text-xs">
        <div className="max-w-6xl mx-auto px-4 space-y-3">
          <div className="flex items-center justify-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-400 text-[#0f2942] font-black text-sm flex items-center justify-center">
              מז
            </div>
            <span className="font-extrabold text-white text-base">מקסום זכויות</span>
            <span className="text-amber-400 text-xs">| ייעוץ מס והחזרי מס לשכירים</span>
          </div>

          <p className="text-slate-300">
            ליווי אישי מקצועי למיצוי מלא של החזרי המס • פריסת שבח ופיצויים • קיבוע זכויות • טיפול מול פקיד השומה
          </p>

          <div className="flex items-center justify-center gap-4 text-xs font-bold text-amber-300 flex-wrap pt-1">
            <span>טלפון / וואטסאפ: 055-2520065</span>
            <span>•</span>
            <span>דוא״ל: id106cpa@gmail.com</span>
            <span>•</span>
            <span>שירות אונליין מהיר לכל רחבי הארץ</span>
          </div>

          <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-700/60">
            החישוב מבוסס על פקודת מס הכנסה, מדרגות המס ונקודות הזיכוי לשנים 2020–2026. כל הזכויות שמורות © מקסום זכויות.
          </p>
        </div>
      </footer>

      {/* Lead Capture & Email Dispatch Modal */}
      <LeadCaptureModal
        isOpen={isLeadModalOpen}
        taxYear={taxData.taxYear}
        onClose={() => setIsLeadModalOpen(false)}
        onSubmit={handleLeadSubmit}
        initialLead={userLeadInfo || undefined}
      />

      {/* Mandatory Spouse Data Notice for Married Joint Assessment */}
      {showSpouseMissingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 text-right">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">
                  תיק משותף לזוג נשוי (דוח 135)
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                  חובה למלא נתוני בן/בת זוג לקבלת תוצאה
                </h3>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-slate-600 space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p>
                לפי תקנות רשות המסים בישראל, <strong>השומה עבור זוג נשוי הינה שומה אחת עבור התא המשפחתי</strong>.
              </p>
              <p>
                פעמים רבות קיים החזר אצל אחד מבני הזוג אך חוב אצל השני (או להיפך), והם <strong>מתקזזים זה מול זה</strong> בדוח השנתי. תוצאת ביניים של בן זוג יחיד אינה מדויקת ועלולה להטעות.
              </p>
              <p className="font-bold text-indigo-950">
                אנא בחרו כיצד להמשיך:
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowSpouseMissingModal(false);
                  setActiveSpouseTab('spouse');
                  setCurrentStep(2);
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>מעבר למילוי נתוני בן/בת הזוג עכשיו (טופס 106)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  updateTaxData({
                    hasDependentSpouse: true,
                    includeSpouseCalculation: false,
                    spouseData: undefined,
                  });
                  setShowSpouseMissingModal(false);
                  if (hasSubmittedLead) {
                    setViewMode('results');
                  } else {
                    setIsLeadModalOpen(true);
                  }
                }}
                className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-300 text-center"
              >
                <span>בן/בת הזוג לא עבדו כלל בשנת {taxData.taxYear} (סעיף 37 - תוספת 1 נק׳ זיכוי)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSpouseMissingModal(false)}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-700 font-medium pt-1 cursor-pointer"
              >
                חזרה לעריכת השאלון
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
