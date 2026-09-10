import React, { useState } from 'react';
import { 
  CheckCircle2, 
  TrendingUp, 
  AlertTriangle, 
  ArrowRight, 
  Printer, 
  RefreshCw,
  Baby,
  CalendarClock,
  HeartHandshake,
  MapPin,
  GraduationCap,
  Award,
  Sparkles,
  ShieldCheck,
  Coins,
  Percent,
  Users,
  Building2,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  FileText,
  RotateCcw,
  Check,
  FileSpreadsheet,
  Scale
} from 'lucide-react';
import { CalculationResult, TaxInputData } from '../types/tax';

interface ResultDashboardProps {
  result: CalculationResult;
  input: TaxInputData;
  onEdit: () => void;
  onCheckAnotherYear: () => void;
  onReset?: () => void;
}

export const ResultDashboard: React.FC<ResultDashboardProps> = ({
  result,
  input,
  onEdit,
  onCheckAnotherYear,
  onReset,
}) => {
  // Spouse view is strictly allowed ONLY if maritalStatus is 'married' and spouseResult exists!
  const hasSpouseData = input.maritalStatus === 'married' && !!result.spouseResult && !!input.spouseData;

  const [activeTab, setActiveTab] = useState<'individual' | 'spouse' | 'combined'>(() => {
    return hasSpouseData ? 'combined' : 'individual';
  });
  const [showKeyFactors, setShowKeyFactors] = useState<boolean>(false);
  const [showFullCreditsTable, setShowFullCreditsTable] = useState<boolean>(false);

  // Selected view data
  const currentDisplay = (activeTab === 'spouse' && hasSpouseData && result.spouseResult)
    ? result.spouseResult
    : (activeTab === 'combined' && hasSpouseData && result.combinedResult)
    ? result.combinedResult
    : result;

  const currentInput = activeTab === 'spouse' && hasSpouseData && input.spouseData
    ? input.spouseData
    : input;

  const currentIsRefund = currentDisplay.netDifference > 0;
  const currentIsDebt = currentDisplay.netDifference < 0;

  // Robust Print Handler: Native print + Popup Fallback with Maksum Zchuyot official branding
  const handlePrint = () => {
    try {
      window.focus();
      window.print();
    } catch (err) {
      console.warn('Native window.print failed, opening popup:', err);
    }

    // Also generate a clean, formatted printable window
    const printWin = window.open('', '_blank', 'width=900,height=800');
    if (printWin) {
      const clientName = currentInput.employeeName || 'שכיר';
      const year = currentDisplay.taxYear;
      const regularTax = currentDisplay.regularTaxAmount ?? currentDisplay.baseTaxBeforeCredits;
      const capitalTax = currentDisplay.capitalGainsTaxAmount ?? 0;
      const totalGross = currentDisplay.totalGrossTaxBeforeCredits ?? (regularTax + capitalTax);

      printWin.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="utf-8" />
          <title>שומת מס הכנסה לשנת המס ${year} - ${clientName} | מקסום זכויות</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; direction: rtl; padding: 24px; color: #0f172a; }
            .brand-header { background: #0f2942; color: #ffffff; padding: 20px; border-radius: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            .brand-logo-badge { background: linear-gradient(135deg, #d4af37, #f59e0b); color: #0f2942; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 900; border: 2px solid #ffffff; }
            .brand-info { flex: 1; margin-right: 16px; }
            .brand-title { font-size: 22px; font-weight: 900; color: #ffffff; margin-bottom: 2px; }
            .brand-subtitle { font-size: 13px; color: #cbd5e1; }
            .brand-contact { text-align: left; font-size: 12px; color: #cbd5e1; }
            .badge { background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; border: 1px solid #bbf7d0; display: inline-block; margin-top: 4px; }
            .summary-box { background: #f0fdf4; border: 2px solid #86efac; border-radius: 16px; padding: 20px; margin-bottom: 24px; }
            .refund-num { font-size: 34px; font-weight: 900; color: #15803d; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
            th, td { border: 1px solid #cbd5e1; padding: 9px 12px; text-align: right; }
            th { background: #f1f5f9; font-weight: bold; color: #334155; }
            .text-left { text-align: left; }
            .bold { font-weight: bold; }
            .total-row { background: #f8fafc; font-weight: bold; }
            .highlight-row { background: #ecfdf5; font-weight: bold; }
            .footer { font-size: 11px; color: #64748b; margin-top: 30px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="brand-header">
            <div style="display: flex; align-items: center;">
              <div class="brand-logo-badge">מז</div>
              <div class="brand-info">
                <div class="brand-title">מקסום זכויות</div>
                <div class="brand-subtitle">ייעוץ מס, החזרי מס ומיצוי זכויות לשכירים</div>
                <span class="badge">תחשיב שומה במתכונת רשות המסים לשנת ${year}</span>
              </div>
            </div>
            <div class="brand-contact">
              <div>טלפון / וואטסאפ: <strong>055-2520065</strong></div>
              <div>דוא"ל: <strong>id106cpa@gmail.com</strong></div>
              <div>שם הנישום: <strong>${clientName}</strong></div>
            </div>
          </div>

          <div class="summary-box">
            <div style="font-size: 14px; color: #166534; font-weight: bold;">
              יתרת זכות סופית להחזר לחשבון הבנק (כולל ריבית 4% והצמדה פטורים ממס):
            </div>
            <div class="refund-num">₪${currentDisplay.finalRefundWithInterest.toLocaleString('he-IL')}</div>
            <div style="font-size: 12px; color: #15803d; margin-top: 4px;">
              החזר קרן נומינלי: ₪${currentDisplay.nominalRefund.toLocaleString('he-IL')} | ריבית 4% והצמדה כחוק: ₪${currentDisplay.interestAndLinkageBenefit.toLocaleString('he-IL')}+
            </div>
          </div>

          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">ריכוז שומת המס</h3>
          <table>
            <tr>
              <td>הכנסה חייבת בשיעורים רגילים (שכר, תגמולים, ביטוח לאומי)</td>
              <td class="text-left font-mono">₪${currentDisplay.taxableIncome.toLocaleString('he-IL')}</td>
            </tr>
            <tr>
              <td><strong>מס בשיעורים רגילים (מדרגות המס)</strong></td>
              <td class="text-left font-mono bold">₪${regularTax.toLocaleString('he-IL')}</td>
            </tr>
            ${currentInput.investedInCapitalMarket || capitalTax > 0 ? `
              <tr>
                <td>הכנסה חייבת מרווחי הון (טופס 867 לאחר קיזוז הפסדים)</td>
                <td class="text-left font-mono">₪${(currentDisplay.capitalGainsTaxable || 0).toLocaleString('he-IL')}</td>
              </tr>
              <tr>
                <td><strong>מס מיוחד או מס רווחי הון (25% ו-15%)</strong></td>
                <td class="text-left font-mono bold">₪${capitalTax.toLocaleString('he-IL')}</td>
              </tr>
            ` : ''}
            <tr class="highlight-row">
              <td><strong>סה"כ מס ברוטו (לפני זיכויים)</strong></td>
              <td class="text-left font-mono bold">₪${totalGross.toLocaleString('he-IL')}</td>
            </tr>
            <tr>
              <td>פחות: סה"כ נקודות זיכוי וזיכויי מס (מתוכם קוזזו כחוק)</td>
              <td class="text-left font-mono bold" style="color: #15803d;">-₪${currentDisplay.totalCreditsNIS.toLocaleString('he-IL')}</td>
            </tr>
            <tr class="total-row">
              <td><strong>מס נטו חבות שנתית</strong></td>
              <td class="text-left font-mono bold">₪${currentDisplay.taxLiabilityFinal.toLocaleString('he-IL')}</td>
            </tr>
            <tr>
              <td>מס שנוכה בפועל ושולם מראש (שכר, ביטוח לאומי, שוק ההון)</td>
              <td class="text-left font-mono">₪${currentDisplay.taxAlreadyPaid.toLocaleString('he-IL')}</td>
            </tr>
            <tr class="total-row">
              <td><strong>החזר נומינלי (קרן המס)</strong></td>
              <td class="text-left font-mono bold" style="color: #15803d;">₪${currentDisplay.nominalRefund.toLocaleString('he-IL')}</td>
            </tr>
            <tr>
              <td>תוספת ריבית 4% שנתית והפרשי הצמדה למדד (פטורה ממס לפי סעיף 160)</td>
              <td class="text-left font-mono bold" style="color: #b45309;">+₪${currentDisplay.interestAndLinkageBenefit.toLocaleString('he-IL')}</td>
            </tr>
            <tr class="total-row" style="background:#dcfce7; font-size:15px;">
              <td><strong>סה"כ החזר צפוי (יתרת זכות להפקדה בבנק)</strong></td>
              <td class="text-left font-mono bold" style="color:#15803d;">₪${currentDisplay.finalRefundWithInterest.toLocaleString('he-IL')}</td>
            </tr>
          </table>

          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">פירוט שורות זיכוי במס (רשימה אחידה כחוק)</h3>
          <table>
            <thead>
              <tr>
                <th>סעיף הזיכוי</th>
                <th>סעיף חוק / קוד שדה</th>
                <th>בסיס החישוב</th>
                <th class="text-left">סכום הזיכוי [₪]</th>
              </tr>
            </thead>
            <tbody>
              ${currentDisplay.unifiedCreditsList.map(r => `
                <tr>
                  <td class="bold">${r.label}</td>
                  <td class="font-mono">${r.sectionCode} ${r.formFieldCode ? `(${r.formFieldCode})` : ''}</td>
                  <td>${r.basisOrDetails}</td>
                  <td class="text-left font-mono bold">₪${r.creditNIS.toLocaleString('he-IL')}</td>
                </tr>
              `).join('')}
              <tr class="total-row" style="background: #f1f5f9;">
                <td colspan="3"><strong>סה"כ זיכויים במס (מופחת מהמס ברוטו)</strong></td>
                <td class="text-left font-mono bold" style="color: #15803d;">₪${currentDisplay.totalCreditsNIS.toLocaleString('he-IL')}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            הופק באמצעות <strong>מקסום זכויות</strong> • ייעוץ מס והחזרי מס לשכירים • טלפון: 055-2520065 • דוא"ל: id106cpa@gmail.com
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
        </html>
      `);
      printWin.document.close();
    }
  };

  // WhatsApp Message for Rights Maximization with phone 972552520065
  const whatsappText = encodeURIComponent(
    `שלום מקסום זכויות, ביצעתי סימולציית שומת מס לשנת ${currentDisplay.taxYear} במחשבון. אומדן ההחזר שחושב הוא ₪${currentDisplay.finalRefundWithInterest.toLocaleString('he-IL')}. אשמח לבדיקה מקצועית ולמקסום מלוא הזכויות שלי!`
  );
  const whatsappUrl = `https://wa.me/972552520065?text=${whatsappText}`;

  return (
    <div className="space-y-6 animate-fade-in print:p-0">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
          <span className="text-sm font-bold text-slate-800">
            תחשיב שומת מס הכנסה לשנת המס {currentDisplay.taxYear}
          </span>
          <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
            מתכונת רשות המסים
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
              title="ניקוי שדות והתחלת חישוב חדש"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              <span>ניקוי שדות</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>הדפס שומה / PDF</span>
          </button>

          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer shadow-xs"
          >
            <ArrowRight className="w-4 h-4" />
            <span>חזרה לעריכת פרטים</span>
          </button>
        </div>
      </div>

      {/* Spouse View Tabs (if married and calculated) */}
      {hasSpouseData && (
        <div className="bg-indigo-950 text-white rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-300" />
            <div>
              <h4 className="font-bold text-sm">חישוב החזר מס משפחתי זוגי לשנת {result.taxYear}</h4>
              <p className="text-xs text-indigo-200">
                הוזנו נתוני שני בני הזוג
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-indigo-900/80 p-1 rounded-xl">
            {(() => {
              const primaryDiff = result.netDifference;
              const spouseDiff = result.spouseResult?.netDifference || 0;
              const combinedDiff = result.combinedFamilyNetDifference ?? (primaryDiff + spouseDiff);

              return (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab('individual')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'individual'
                        ? 'bg-white text-indigo-950 shadow-xs'
                        : 'text-indigo-200 hover:text-white'
                    }`}
                  >
                    {input.employeeName || 'בן זוג א׳'} (
                    {primaryDiff > 0
                      ? `החזר ₪${result.finalRefundWithInterest.toLocaleString('he-IL')}`
                      : primaryDiff < 0
                      ? `חוב ₪${Math.abs(primaryDiff).toLocaleString('he-IL')}-`
                      : 'ללא הפרש'}
                    )
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('spouse')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'spouse'
                        ? 'bg-white text-indigo-950 shadow-xs'
                        : 'text-indigo-200 hover:text-white'
                    }`}
                  >
                    {input.spouseData?.employeeName || 'בן/בת זוג ב׳'} (
                    {spouseDiff > 0
                      ? `החזר ₪${(result.spouseResult?.finalRefundWithInterest || 0).toLocaleString('he-IL')}`
                      : spouseDiff < 0
                      ? `חוב ₪${Math.abs(spouseDiff).toLocaleString('he-IL')}-`
                      : 'ללא הפרש'}
                    )
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('combined')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'combined'
                        ? combinedDiff < 0
                          ? 'bg-rose-500 text-white shadow-xs'
                          : 'bg-emerald-400 text-emerald-950 shadow-xs'
                        : 'text-emerald-300 hover:text-white'
                    }`}
                  >
                    סה״כ משפחתי זוגי (
                    {combinedDiff > 0
                      ? `החזר ₪${(result.combinedFamilyTotalRefund || 0).toLocaleString('he-IL')}`
                      : combinedDiff < 0
                      ? `חוב בתיק ₪${Math.abs(combinedDiff).toLocaleString('he-IL')}-`
                      : 'ללא הפרש'}
                    )
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================
          CLEAN GREEN/RED SUMMARY CARD (High Contrast, Clean, Official)
      ======================================================== */}
      <div
        className={`rounded-3xl p-6 sm:p-8 border shadow-lg relative overflow-hidden ${
          currentIsRefund
            ? 'bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 text-white border-emerald-500'
            : currentIsDebt
            ? 'bg-gradient-to-br from-red-700 via-rose-800 to-slate-900 text-white border-red-500'
            : 'bg-gradient-to-br from-slate-700 to-slate-900 text-white border-slate-600'
        }`}
      >
        <div className="relative z-10 space-y-6">
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {currentIsDebt ? 'שומת מס הכנסה - חוב מס לתשלום' : `שומת מס הכנסה לשנת ${currentDisplay.taxYear}`}
              </span>
              {activeTab === 'combined' && hasSpouseData && (
                <span className="bg-indigo-400 text-indigo-950 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>שומה זוגית משותפת (דוח 135)</span>
                </span>
              )}
              {currentDisplay.employerCount && currentDisplay.employerCount > 1 && (
                <span className="bg-indigo-300 text-indigo-950 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  <span>{currentDisplay.employerCount} מעסיקים שוקללו</span>
                </span>
              )}
            </div>

            <div className="text-xs text-white/80 font-medium print:hidden">
              חישוב מדויק לפי פקודת מס הכנסה
            </div>
          </div>

          {/* Big Amount Header */}
          <div>
            <p className="text-white/90 text-sm sm:text-base font-medium">
              {currentIsRefund
                ? activeTab === 'combined'
                  ? 'סך החזר המס המשפחתי הכולל להפקדה ישירות בחשבון הבנק שלכם:'
                  : 'סך החזר המס הצפוי להפקדה ישירות בחשבון הבנק שלך:'
                : currentIsDebt
                ? activeTab === 'combined'
                  ? 'יתרת חוב מס משותפת לתשלום לרשות המסים (לאחר קיזוז הדדי):'
                  : 'חבות מס שנתית לתשלום לרשות המסים (חוב מס):'
                : 'אין הפרש מס לתשלום או החזר:'}
            </p>
            <div className={`text-4xl sm:text-6xl font-black tracking-tight mt-1 ${currentIsDebt ? 'text-red-200' : 'text-white'}`}>
              {currentIsDebt ? '-' : ''}₪{Math.abs(currentIsRefund ? currentDisplay.finalRefundWithInterest : currentDisplay.netDifference).toLocaleString('he-IL')}
            </div>
            {currentIsRefund && (
              <p className="text-xs sm:text-sm text-emerald-100 mt-1">
                סכום זה כולל תוספת 4% ריבית שנתית והפרשי הצמדה למדד כחוק – פטורים ממס!
              </p>
            )}
            {currentIsDebt && (
              <p className="text-xs sm:text-sm text-red-100 mt-1 font-bold">
                {activeTab === 'combined'
                  ? 'לתשומת ליבכם: בתיק המשותף נוצר פער תת-ניכוי מס מצטבר לאחר קיזוז הדדי בין שני בני הזוג.'
                  : 'לתשומת ליבך: על פי נתוני הטפסים נוצר פער תת-ניכוי מס במקור במהלך השנה.'}
              </p>
            )}
          </div>

          {/* 3 Main Result Pillar Cards for Refund */}
          {currentIsRefund && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-white/20 text-xs sm:text-sm">
              <div className="bg-white/15 p-4 rounded-2xl backdrop-blur-xs">
                <div className="flex items-center gap-1.5 text-emerald-200 text-xs font-bold mb-1">
                  <Coins className="w-4 h-4" />
                  <span>החזר מס נומינלי (קרן):</span>
                </div>
                <div className="text-2xl font-black">
                  ₪{currentDisplay.nominalRefund.toLocaleString('he-IL')}
                </div>
                <div className="text-[11px] text-emerald-100 mt-1">
                  מס שנוכה (₪{currentDisplay.taxAlreadyPaid.toLocaleString('he-IL')}) פחות מס אמיתי
                </div>
              </div>

              <div className="bg-white/15 p-4 rounded-2xl backdrop-blur-xs">
                <div className="flex items-center gap-1.5 text-amber-200 text-xs font-bold mb-1">
                  <Percent className="w-4 h-4 text-amber-300" />
                  <span>ריבית 4% והצמדה כחוק:</span>
                </div>
                <div className="text-2xl font-black text-amber-200">
                  +₪{currentDisplay.interestAndLinkageBenefit.toLocaleString('he-IL')}
                </div>
                <div className="text-[11px] text-emerald-100 mt-1">
                  רווח פטור ממס לפי סעיף 160 לפקודה
                </div>
              </div>

              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-xs ring-1 ring-white/30">
                <div className="flex items-center gap-1.5 text-white text-xs font-bold mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>סה״כ יתרת זכות לבנק:</span>
                </div>
                <div className="text-2xl font-black text-emerald-100">
                  ₪{currentDisplay.finalRefundWithInterest.toLocaleString('he-IL')}
                </div>
                <div className="text-[11px] text-emerald-100 mt-1">
                  סכום סופי כפי שיופיע בשומת מס הכנסה
                </div>
              </div>
            </div>
          )}

          {/* 3 Main Result Pillar Cards for Debt */}
          {currentIsDebt && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-white/20 text-xs sm:text-sm">
              <div className="bg-white/15 p-4 rounded-2xl backdrop-blur-xs">
                <div className="flex items-center gap-1.5 text-red-200 text-xs font-bold mb-1">
                  <Scale className="w-4 h-4 text-red-300" />
                  <span>חבות מס שנתית אמיתית:</span>
                </div>
                <div className="text-2xl font-black text-white">
                  ₪{currentDisplay.taxLiabilityFinal.toLocaleString('he-IL')}
                </div>
                <div className="text-[11px] text-red-100 mt-1">
                  מס שהיה עליך לשלם לפי חוק
                </div>
              </div>

              <div className="bg-white/15 p-4 rounded-2xl backdrop-blur-xs">
                <div className="flex items-center gap-1.5 text-amber-200 text-xs font-bold mb-1">
                  <Coins className="w-4 h-4 text-amber-300" />
                  <span>מס שנוכה בפועל במקור:</span>
                </div>
                <div className="text-2xl font-black text-amber-200">
                  ₪{currentDisplay.taxAlreadyPaid.toLocaleString('he-IL')}
                </div>
                <div className="text-[11px] text-red-100 mt-1">
                  סך כל המקדמות והניכויים בפועל
                </div>
              </div>

              <div className="bg-red-950/60 p-4 rounded-2xl backdrop-blur-xs ring-2 ring-red-400">
                <div className="flex items-center gap-1.5 text-red-200 text-xs font-bold mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>יתרת חוב סופית לתשלום:</span>
                </div>
                <div className="text-2xl font-black text-red-300">
                  -₪{Math.abs(currentDisplay.netDifference).toLocaleString('he-IL')}
                </div>
                <div className="text-[11px] text-red-200 mt-1">
                  פער שנוצר עקב תת-ניכוי מס במקור
                </div>
              </div>
            </div>
          )}

          {/* Mutual Spousal Offset Card in Combined Mode */}
          {activeTab === 'combined' && hasSpouseData && (
            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/20 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm text-white">
                <Users className="w-4 h-4 text-indigo-300" />
                <span>פירוט קיזוז הדדי ברשות המסים (דוח זוגי משותף טופס 135):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-black/30 p-3 rounded-xl border border-white/10">
                  <span className="text-slate-300 font-bold block mb-1">{input.employeeName || 'בן זוג א׳'}:</span>
                  <span className={`text-base font-black ${result.netDifference >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                    {result.netDifference >= 0 
                      ? `זכאות להחזר: ₪${result.finalRefundWithInterest.toLocaleString('he-IL')}` 
                      : `חוב מס לתשלום: ₪${Math.abs(result.netDifference).toLocaleString('he-IL')}-`}
                  </span>
                  <p className="text-[11px] text-slate-300 mt-1">
                    מס שנוכה: ₪{result.taxAlreadyPaid.toLocaleString('he-IL')} | חבות מס: ₪{result.taxLiabilityFinal.toLocaleString('he-IL')}
                  </p>
                </div>

                <div className="bg-black/30 p-3 rounded-xl border border-white/10">
                  <span className="text-slate-300 font-bold block mb-1">{input.spouseData?.employeeName || 'בן/בת זוג ב׳'}:</span>
                  <span className={`text-base font-black ${(result.spouseResult?.netDifference || 0) >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                    {(result.spouseResult?.netDifference || 0) >= 0 
                      ? `זכאות להחזר: ₪${(result.spouseResult?.finalRefundWithInterest || 0).toLocaleString('he-IL')}` 
                      : `חוב מס לתשלום: ₪${Math.abs(result.spouseResult?.netDifference || 0).toLocaleString('he-IL')}-`}
                  </span>
                  <p className="text-[11px] text-slate-300 mt-1">
                    מס שנוכה: ₪{(result.spouseResult?.taxAlreadyPaid || 0).toLocaleString('he-IL')} | חבות מס: ₪{(result.spouseResult?.taxLiabilityFinal || 0).toLocaleString('he-IL')}
                  </p>
                </div>
              </div>
              <div className="text-[11px] text-slate-200 bg-white/5 p-2 rounded-lg">
                ⚖️ <strong>משמעות הקיזוז הזוגי ברשות המסים:</strong> רשות המסים מנפיקה שומה אחת לתיק המשפחתי. זכות להחזר אצל אחד מבני הזוג מתקזזת אוטומטית כנגד חוב של בן הזוג השני. הסכום הכולל בראש המסך מייצג את היתרה המשותפת הסופית.
              </div>
            </div>
          )}

          {/* CPA Advisory Box for Debt */}
          {currentIsDebt && (
            <div className="p-4 bg-red-950/80 border border-red-500/60 rounded-2xl text-red-100 text-xs sm:text-sm space-y-2">
              <div className="flex items-center gap-2 font-bold text-red-200 text-sm">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <span>שימו לב: מומלץ לא להגיש דוח עם חוב מס לפני בדיקת מומחה!</span>
              </div>
              <p>
                רשות המסים אינה מחייבת שכירים שאינם חייבים בהגשה להגיש דוח אם נוצר חוב. בנוסף, בבדיקה מעמיקה של רואה חשבון ייתכן שקיימות הוצאות מוכרות, נקודות זיכוי שלא נדרשו (כגון יישוב מזכה, תואר אקדמי, ילדים, ביטוחי חיים ומשכנתא, או תרומות), או אפשרויות לפריסת מס שיכולות להקטין או לבטל את החוב לחלוטין.
              </p>
              <div className="pt-1">
                <a
                  href="https://wa.me/972552520065?text=שלום,%20יצא%20לי%20חוב%20מס%20במחשבון%20ואני%20מעוניין%20בבדיקת%20עומק%20לפני%20הגשה"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>התייעץ מיידית עם מומחה 'מקסום זכויות' בווצאפ (055-2520065)</span>
                </a>
              </div>
            </div>
          )}

          {/* Clean Financial Breakdown Table - Exactly like Israel Tax Authority Assessment */}
          <div className="bg-black/25 rounded-2xl p-4 sm:p-5 border border-white/15">
            <h4 className="text-xs sm:text-sm font-bold text-white mb-3 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>תחשיב חבות המס במתכונת רשות המסים לשנת {currentDisplay.taxYear}:</span>
            </h4>

            {(() => {
              const regularTax = currentDisplay.regularTaxAmount ?? currentDisplay.baseTaxBeforeCredits;
              const capitalTax = currentDisplay.capitalGainsTaxAmount ?? 0;
              const totalGross = currentDisplay.totalGrossTaxBeforeCredits ?? (regularTax + capitalTax);
              const totalCreditsApplied = Math.min(totalGross, currentDisplay.totalCreditsNIS);

              return (
                <div className="divide-y divide-white/15 text-xs sm:text-sm">
                  {/* 1. הכנסה חייבת בשיעורים רגילים */}
                  <div className="py-2 flex items-center justify-between">
                    <span className="text-emerald-100">הכנסה חייבת בשיעורים רגילים (שכר עבודה, תגמולים, ביטוח לאומי):</span>
                    <span className="font-mono font-bold">₪{currentDisplay.taxableIncome.toLocaleString('he-IL')}</span>
                  </div>

                  {/* 2. מס בשיעורים רגילים (מדרגות המס) */}
                  <div className="py-2 flex items-center justify-between">
                    <span className="text-white font-medium">מס בשיעורים רגילים (מדרגות המס):</span>
                    <span className="font-mono font-bold text-amber-200">₪{regularTax.toLocaleString('he-IL')}</span>
                  </div>

                  {/* 3. מס מיוחד או מס רווחי הון */}
                  <div className="py-2 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-white font-medium">מס מיוחד או מס רווחי הון:</span>
                      <span className="text-[11px] text-emerald-200/80">
                        {capitalTax > 0 
                          ? `חבות מס 25% ו-15% על רווחי הון נטו (₪${(currentDisplay.capitalGainsTaxable || 0).toLocaleString('he-IL')})`
                          : 'לא דווחה הכנסה מרווחי הון או שקוזזה במלואה ע"י הפסדים'}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-amber-200">
                      ₪{capitalTax.toLocaleString('he-IL')}
                    </span>
                  </div>

                  {/* 4. סה"כ מס ברוטו שמתחתיו מגיעות נקודות הזיכוי */}
                  <div className="py-2.5 flex items-center justify-between bg-white/15 px-3 rounded-xl my-1 border border-white/20">
                    <span className="font-black text-white text-sm">
                      סה״כ מס ברוטו (לפני זיכויים):
                    </span>
                    <span className="font-mono font-black text-amber-300 text-base sm:text-lg">
                      ₪{totalGross.toLocaleString('he-IL')}
                    </span>
                  </div>

                  {/* 5. נקודות זיכוי וזיכויי מס */}
                  <div className="py-2 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-emerald-100">
                        פחות: סה״כ נקודות זיכוי וזיכויים כחוק ({currentDisplay.unifiedCreditsList.length} סעיפי זיכוי):
                      </span>
                      <span className="text-[11px] text-emerald-200/70">
                        *זיכויי יגיעה אישית (חייל, אקדמאי, יישוב מזכה) מקוזזים משכר בלבד, וזיכויי תושב/תרומות/גמל מקוזזים גם מרווחי הון
                      </span>
                    </div>
                    <span className="font-mono font-bold text-emerald-300">
                      -₪{totalCreditsApplied.toLocaleString('he-IL')}
                    </span>
                  </div>

                  {/* 6. מס נטו חבות שנתית */}
                  <div className="py-2 flex items-center justify-between font-bold">
                    <span className="text-white">מס נטו (חבות המס השנתית האמיתית):</span>
                    <span className="font-mono text-white">₪{currentDisplay.taxLiabilityFinal.toLocaleString('he-IL')}</span>
                  </div>

                  {/* 7. מס שנוכה בפועל */}
                  <div className="py-2 flex items-center justify-between">
                    <span className="text-emerald-100">מס שנוכה בפועל ושולם מראש (שכר, ביטוח לאומי, שוק ההון):</span>
                    <span className="font-mono font-bold">₪{currentDisplay.taxAlreadyPaid.toLocaleString('he-IL')}</span>
                  </div>

                  {/* 8. שורות סיכום ברורות: החזר נומינלי, ריבית והצמדה, סה"כ החזר צפוי או חוב מס לתשלום */}
                  {currentIsDebt ? (
                    <div className="pt-2 mt-1 space-y-1.5 border-t-2 border-white/30">
                      <div className="flex items-center justify-between font-bold text-xs sm:text-sm text-white">
                        <span>חבות מס שנתית מלאה לפי חוק:</span>
                        <span className="font-mono font-black text-white text-sm sm:text-base">
                          ₪{currentDisplay.taxLiabilityFinal.toLocaleString('he-IL')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs sm:text-sm text-amber-200">
                        <span>פחות: מס שנוכה בפועל ושולם מראש (תת-ניכוי):</span>
                        <span className="font-mono font-bold">
                          -₪{currentDisplay.taxAlreadyPaid.toLocaleString('he-IL')}
                        </span>
                      </div>

                      <div className="py-2.5 px-3 bg-red-950/80 rounded-xl flex items-center justify-between font-black text-sm sm:text-base text-white border border-red-500/50">
                        <span className="text-red-200">סה״כ חוב מס לתשלום (יתרת חובה לרשות המסים):</span>
                        <span className="font-mono text-xl sm:text-2xl text-red-300">
                          -₪{Math.abs(currentDisplay.netDifference).toLocaleString('he-IL')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 mt-1 space-y-1.5 border-t-2 border-white/30">
                      <div className="flex items-center justify-between font-bold text-xs sm:text-sm text-white">
                        <span>החזר נומינלי (קרן המס ששולמה ביתר):</span>
                        <span className="font-mono font-black text-emerald-300 text-sm sm:text-base">
                          ₪{currentDisplay.nominalRefund.toLocaleString('he-IL')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs sm:text-sm text-amber-200">
                        <span>תוספת ריבית 4% שנתית והפרשי הצמדה למדד (פטורים ממס לפי סעיף 160):</span>
                        <span className="font-mono font-bold">
                          +₪{currentDisplay.interestAndLinkageBenefit.toLocaleString('he-IL')}
                        </span>
                      </div>

                      <div className="py-2 px-3 bg-white/20 rounded-xl flex items-center justify-between font-black text-sm sm:text-base text-white border border-white/30">
                        <span className="text-emerald-100">סה״כ החזר צפוי (יתרת זכות להפקדה ישירה בחשבון):</span>
                        <span className="font-mono text-xl sm:text-2xl text-emerald-300">
                          ₪{currentDisplay.finalRefundWithInterest.toLocaleString('he-IL')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ========================================================
          CLEAN TOGGLE BUTTONS BELOW THE SUMMARY CARD
      ======================================================== */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Toggle 1: ממה מורכב ההחזר */}
        <button
          type="button"
          onClick={() => setShowKeyFactors(!showKeyFactors)}
          className={`flex-1 w-full p-4 rounded-2xl border text-right font-bold text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer ${
            showKeyFactors
              ? 'bg-indigo-50 border-indigo-500 text-indigo-950 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <div>
              <div className="font-bold">ממה מורכב ההחזר?</div>
              <div className="text-[11px] text-slate-500 font-normal">לחץ לפתיחת פירוט ההטבות והגורמים המזכים</div>
            </div>
          </div>
          {showKeyFactors ? <ChevronUp className="w-4 h-4 text-indigo-600" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {/* Toggle 2: פירוט שורות שומה וזיכויים מלא */}
        <button
          type="button"
          onClick={() => setShowFullCreditsTable(!showFullCreditsTable)}
          className={`flex-1 w-full p-4 rounded-2xl border text-right font-bold text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer ${
            showFullCreditsTable
              ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <div className="font-bold">פירוט שורות שומה וזיכויים מלא</div>
              <div className="text-[11px] text-slate-500 font-normal">מתכונת רשות המסים (רשימה אחידה ללא הפרדה)</div>
            </div>
          </div>
          {showFullCreditsTable ? <ChevronUp className="w-4 h-4 text-emerald-600" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
      </div>

      {/* COLLAPSIBLE SECTION 1: ממה מורכב ההחזר */}
      {showKeyFactors && (
        <div className="p-6 bg-white rounded-3xl border border-indigo-200 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>גורמי ההחזר והטבות המס שנוצלו בשנת {currentDisplay.taxYear}:</span>
            </h3>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full">
              {currentDisplay.keyRefundFactors.length} גורמים מזכים
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentDisplay.keyRefundFactors.map((factor, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{factor.title}</span>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                    +₪{factor.amount.toLocaleString('he-IL')}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {factor.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COLLAPSIBLE SECTION 2: פירוט שורות שומה וזיכויים מלא (רשימה אחידה ללא הפרדה) */}
      {showFullCreditsTable && (
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>שורות שומת הזיכויים המלאה לשנת {currentDisplay.taxYear}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                מוצג ברשימה רציפה שורה אחר שורה כפי שמופיע בטופס רשות המסים (ללא הפרדה מלאכותית)
              </p>
            </div>
            <div className="text-xs bg-emerald-50 text-emerald-800 font-bold px-3 py-1 rounded-full w-fit">
              סה״כ זיכויים: ₪{currentDisplay.totalCreditsNIS.toLocaleString('he-IL')}
            </div>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold text-xs">
                <tr>
                  <th className="p-3">סעיף הזיכוי</th>
                  <th className="p-3">סעיף חוק / קוד שדה</th>
                  <th className="p-3">בסיס החישוב והערות</th>
                  <th className="p-3 text-left">סכום הזיכוי [₪]</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentDisplay.unifiedCreditsList.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-900">{row.label}</td>
                    <td className="p-3 font-mono text-slate-600 text-xs">
                      {row.sectionCode} {row.formFieldCode ? `(${row.formFieldCode})` : ''}
                    </td>
                    <td className="p-3 text-slate-600 text-xs">{row.basisOrDetails}</td>
                    <td className="p-3 text-left font-mono font-bold text-emerald-800">
                      ₪{row.creditNIS.toLocaleString('he-IL')}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-300 text-xs sm:text-sm">
                  <td className="p-3" colSpan={3}>
                    סה״כ כלל הזיכויים המופחתים מהמס ברוטו:
                  </td>
                  <td className="p-3 text-left font-mono text-emerald-800 text-base">
                    ₪{currentDisplay.totalCreditsNIS.toLocaleString('he-IL')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          BOTTOM ACTIONS & WHATSAPP BUTTON (Clean & Direct)
      ======================================================== */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* WhatsApp Button for Maximizing Rights */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all text-sm sm:text-base cursor-pointer"
          >
            <MessageCircle className="w-5 h-5 fill-white text-transparent" />
            <span>למקסום זכויות וייעוץ אישי בוואטסאפ</span>
          </a>

          {/* Secondary Action Buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={onCheckAnotherYear}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-3 rounded-2xl transition-colors cursor-pointer text-xs sm:text-sm shadow-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>בדוק שנה נוספת (עד 6 שנים אחורה!)</span>
            </button>

            <button
              type="button"
              onClick={onEdit}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-5 py-3 rounded-2xl border border-slate-200 transition-colors cursor-pointer text-xs sm:text-sm"
            >
              <span>חזרה לעריכת פרטים</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-3 rounded-2xl border border-slate-300 transition-colors cursor-pointer text-xs sm:text-sm"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>הדפס שומה</span>
            </button>
          </div>
        </div>

        {/* Clear Privacy Statement */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-center text-center text-xs text-slate-500 gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>
            <strong>התחייבות לפרטיות:</strong> כל הפרטים מאובטחים לחלוטין. שום מידע אינו נשמר במאגר פומבי ולא יועבר לשום גורם ללא הסכמתך.
          </span>
        </div>
      </div>
    </div>
  );
};
