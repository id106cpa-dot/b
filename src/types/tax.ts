export type TaxYear = 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026;

export type Gender = 'male' | 'female';
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed';

export interface Child {
  id: string;
  birthYear: number;
  isSpecialNeeds?: boolean;
}

export interface DirectTaxCreditItem {
  id: string;
  label: string;
  sectionCode: string;
  baseAmount: number;
  ratePercent: number;
  creditNIS: number;
  description: string;
}

export interface Employer106Record {
  id: string;
  employerName: string;
  grossSalary: number; // שדה 158 / 244 / 258
  taxDeducted: number; // שדה 042 / 142
  workMonths?: number; // שדה 010 (1-12) - מוצג לידיעה בלבד
  creditPointsInPayslip?: number; // שדה 024
  employeePensionDeposit?: number; // שדות 045 / 086 - הפרשות העובד לקצבה (זיכוי 35%)
  employerPensionDeposit?: number; // שדות 036 / 081 - הפרשות מעביד לקצבה מעל התקרה
  insuredSalary?: number; // שכר מבוטח לקצבה (חלק ד/ה בטופס 106)
  nonInsuredSalary?: number; // שכר שאינו מבוטח לקצבה (בסיס לעמית עצמאי / הפרש משדה 158)
  section47Deduction?: number; // שדה 047 - ניכוי לקצבה בתלוש
  nationalInsuranceDeducted?: number; // שדות 021 / 022
}

export interface TaxInputData {
  // Step 1: General Info
  taxYear: TaxYear;
  gender: Gender;
  maritalStatus: MaritalStatus;
  isIsraeliResident: boolean;

  // Step 2: Multiple Employers / Forms 106
  employers: Employer106Record[];

  // Legacy/Convenience flat fields (automatically synchronized with employers[0] or aggregated)
  grossSalary: number;
  taxDeducted: number;
  workMonths?: number;
  employerName?: string;
  employeeName?: string;
  creditPointsInPayslip?: number;
  employeePensionDeposit?: number;
  employerPensionDeposit?: number;
  insuredSalary?: number;
  nonInsuredSalary?: number;

  // Step 3: Taxable National Insurance Payments (תשלומי ביטוח לאומי החייבים במס)
  receivedBituachLeumiBenefits: boolean;
  unemploymentBenefits: number; // דמי אבטלה
  reserveDutyBenefits: number; // תגמולי מילואים ששולמו ישירות מביטוח לאומי
  maternityBenefits: number; // דמי לידה ושמירת היריון
  workInjuryBenefits: number; // דמי פגיעה בעבודה
  otherTaxableBituachLeumiBenefits: number; // תגמולים חייבים נוספים
  bituachLeumiTaxDeducted: number; // מס הכנסה שנוכה במקור ע"י ביטוח לאומי

  // Step 4 (Unified Benefits): Children & Family
  hasChildren: boolean;
  children: Child[];
  isSingleParent: boolean;
  custodyType?: 'sole' | 'shared' | 'none'; // חזקת ילדים: בלעדית / משותפת / ללא
  receivesChildAllowance?: boolean; // מקבל/ת קצבת ילדים מביטוח לאומי
  paysAlimony: boolean; // מזונות לבן/בת זוג לשעבר (סעיף 40א)
  paysChildAlimony?: boolean; // מזונות לילדים שאינם בחזקתו (סעיף 40(ב)(2))
  hasSpecialNeedsDependent: boolean; // נטול יכולת (סעיף 45)
  hasDependentSpouse: boolean; // בן זוג שאינו עובד / ללא הכנסה (סעיף 37 - 1 נקודת זיכוי)

  // Academic Degree, Military Service & Olim
  hasAcademicDegree: boolean;
  degreeType?: 'bachelor' | 'master' | 'doctorate' | 'practical_engineer';
  graduationYear?: number;

  // חייל/ת משוחרר/ת (סעיף 39א) - חודש ושנה
  isDischargedSoldier: boolean;
  dischargeYear?: number;
  dischargeMonth?: number; // 1-12
  serviceType?: 'combat' | 'regular';
  serviceDurationMonths?: number;

  // עולים חדשים ותושבים חוזרים (סעיף 35) - חודש ושנה
  isNewImmigrant: boolean;
  immigrationYear?: number;
  immigrationMonth?: number; // 1-12

  // Settlement Tax Credit (יישוב מזכה סעיף 11)
  livesInEligibleSettlement: boolean;
  settlementName?: string;
  monthsInSettlement?: number;

  // Capital Market (שוק ההון - טופס 867)
  investedInCapitalMarket: boolean;
  capitalGains: number; // סך רווחים כולל / ריאלי
  capitalGains25?: number; // רווחי הון ריאליים מניות בשיעור 25%
  capitalGains15?: number; // רווחי הון נומינליים אג"ח/פיקדונות בשיעור 15%
  capitalLosses: number; // הפסדי הון שטרם קוזזו בבנק
  capitalTaxPaid: number; // מס שנוכה במקור בבנק (שדה 040 בטופס 867)

  // Pension, Life Insurance, Donations & Deductions
  madeSelfPensionDeposits: boolean;
  selfPensionAmount: number; // הפקדות עצמאיות לקופת גמל/פנסיה (סעיף 45 זיכוי / סעיף 47 ניכוי)
  selfLifeInsuranceAmount: number; // ביטוח חיים עצמאי (כולל למשכנתא - סעיף 45)
  madeDonations: boolean;
  donationAmount: number; // תרומות מוכרות סעיף 46

  // הוצאות השתלמות מקצועית לשכיר לשמירה על הקיים (ניכוי המקטין הכנסה חייבת)
  hasProfessionalStudiesExpenses: boolean;
  professionalStudiesExpenses: number;

  // החזקת הורה/קרוב במוסד סיעודי (סעיף 44 - 35% זיכוי מס כספי)
  hasInstitutionalNursingExpenses: boolean;
  institutionalNursingExpenses: number;

  // פטור בגין נכות רפואית בלבד (סעיף 9(5) לפקודת מס הכנסה - פטור גדול/קטן)
  hasMedicalExemption: boolean;
  medicalDisabilityPercentage?: number; // 90% ומעלה
  disabilityDurationType?: 'under_185_days' | '185_to_364_days' | 'full_year_or_permanent';
  isSecurityForcesOrTerrorVictim?: boolean; // זכאי לתגמול חודשי לפי חוק הנכים או נפגעי איבה (פטור מוגדל)

  // Spouse flow & dual calculation
  includeSpouseCalculation?: boolean;
  spouseData?: TaxInputData;

  // Personal identification & Bank info for Form 135
  idNumber?: string;
  birthDate?: string;
  phone?: string;
  address?: string;
  city?: string;
  bankName?: string;
  bankCode?: string;
  bankBranch?: string;
  bankAccount?: string;
}

export function createDefaultTaxInput(overrides: Partial<TaxInputData> = {}): TaxInputData {
  const taxYear = overrides.taxYear || 2024;
  return {
    taxYear,
    gender: 'male',
    maritalStatus: 'married',
    isIsraeliResident: true,
    employeeName: 'ישראל ישראלי',
    idNumber: '012345678',
    birthDate: '1988-05-15',
    phone: '050-1234567',
    address: 'הרצל 12',
    city: 'תל אביב',
    bankName: 'בנק הפועלים',
    bankCode: '12',
    bankBranch: '600',
    bankAccount: '123456',
    employers: [
      {
        id: '1',
        employerName: 'מעסיק עיקרי',
        grossSalary: 0,
        taxDeducted: 0,
        workMonths: 12,
        employeePensionDeposit: 0,
        employerPensionDeposit: 0,
        insuredSalary: 0,
        nonInsuredSalary: 0,
      }
    ],
    grossSalary: 0,
    taxDeducted: 0,
    workMonths: 12,
    insuredSalary: 0,
    nonInsuredSalary: 0,
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
    hasDependentSpouse: false,
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
    hasProfessionalStudiesExpenses: false,
    professionalStudiesExpenses: 0,
    hasInstitutionalNursingExpenses: false,
    institutionalNursingExpenses: 0,
    hasMedicalExemption: false,
    ...overrides,
  };
}

export interface TaxBracket {
  limit: number;
  rate: number;
}

export interface YearTaxConfig {
  year: TaxYear;
  creditPointAnnualValue: number;
  creditPointMonthlyValue: number;
  brackets: TaxBracket[];
  surtaxThreshold: number;
  surtaxRate: number;
  minDonationThreshold: number;
  maxDonationPercentage: number;

  // Section 45A ceilings (סעיף 45א לפקודת מס הכנסה)
  pensionQualifyingMonthlySalary: number; // משכורת מזכה חודשית לעובד
  pensionQualifyingAnnualSalary: number;  // תקרת הכנסה מזכה שנתית לעובד
  maxEmployeePensionAnnualDeposit: number; // תקרת הפקדת עובד שנתית מוכרת לזיכוי (7%)
  maxEmployeePensionAnnualCredit: number; // תקרת זיכוי שנתי מרבי לעובד (35%)
  maxSelfPensionQualifyingDeposit: number; // תקרת הפקדה עצמאית לזיכוי 45א (5%)
}

export interface UnifiedCreditRow {
  id: string;
  category: 'credit_point' | 'direct_credit' | 'spousal_transfer';
  label: string;
  sectionCode: string; // סעיף החוק (למשל: סעיף 33, סעיף 40, סעיף 45א, סעיף 46)
  formFieldCode?: string; // שדה בטופס/שומה (למשל: שדה 022, שדה 045, שדה 037, שדה 268)
  basisOrDetails: string; // פירוט/בסיס (למשל: "2.25 נקודות זיכוי", "35% מתוך הפקדה מוכרת ₪8,148")
  ratePercent?: number; // שיעור הזיכוי (למשל 35% או 25%)
  creditNIS: number; // סכום הזיכוי המחושב בש"ח
  description?: string;
}

export interface CalculationResult {
  taxYear: TaxYear;
  totalIncome: number; // הכנסה גולמית כוללת
  deductionsTotalNIS: number; // סך כל הניכויים (מקטינים הכנסה חייבת)
  medicalExemptionDeductionNIS?: number; // פטור נכות רפואית סעיף 9(5)
  taxableIncome: number; // הכנסה חייבת במס לאחר ניכויים (בשיעורים רגילים)

  // התפלגות מס ברוטו לפי סוגי הכנסה (תואם שומת רשות המסים)
  regularTaxableIncome: number; // הכנסה חייבת בשיעורים רגילים
  regularTaxAmount: number; // מס בשיעורים רגילים (מדרגות המס + מס יסף)
  capitalGainsTaxable: number; // הכנסה חייבת מרווחי הון לאחר קיזוז הפסדים
  capitalGainsTaxAmount: number; // מס מיוחד / מס רווחי הון (25% ו-15%)
  totalGrossTaxBeforeCredits: number; // סה"כ מס ברוטו (מס רגיל + מס רווחי הון)
  creditsOffsetRegularTaxNIS?: number; // זיכויים שקוזזו כנגד מס רגיל
  creditsOffsetCapitalGainsNIS?: number; // זיכויים מותרים כחוק שקוזזו כנגד מס רווחי הון

  baseTaxBeforeCredits: number;
  bracketsBreakdown: Array<{
    bracketLabel: string;
    ratePercent: number;
    amountInBracket: number;
    taxPaidInBracket: number;
  }>;
  surtaxAmount: number;

  // Credit points detailed breakdown
  creditPointsTotal: number;
  creditPointsBreakdown: Array<{
    label: string;
    points: number;
    reason: string;
  }>;
  creditPointsValueNIS: number;

  // Specific tax credits
  settlementCreditNIS: number;
  donationCreditNIS: number;
  pensionLifeCreditNIS: number;
  nursingInstitutionCreditNIS: number;
  capitalLossOffsetCreditNIS: number;
  totalCreditsNIS: number;

  // Direct tax credits detailed items breakdown
  directTaxCreditsBreakdown: DirectTaxCreditItem[];
  directTaxCreditsTotalNIS: number;

  // רשימה רציפה אחידה של כלל הזיכויים שורה אחר שורה (תואם שומת רשות המסים)
  unifiedCreditsList: UnifiedCreditRow[];

  // Bottom line & Strict Separation
  taxLiabilityFinal: number; // המס האמיתי שהיה צריך לשלם
  taxAlreadyPaid: number; // סך המס שנוכה בפועל
  netDifference: number; // positive = REFUND, negative = DEBT

  // Separate Nominal vs Interest/Linkage
  nominalRefund: number; // החזר נומינלי בלבד
  interestAndLinkageBenefit: number; // ריבית 4% והצמדה למדד כחוק (פטורה ממס)
  finalRefundWithInterest: number; // סה"כ כולל משוער

  // Multi-employer analysis
  employerCount: number;
  missedTaxCoordinationDetected: boolean;

  // Narrative steps & highlights
  keyRefundFactors: Array<{
    title: string;
    amount: number;
    description: string;
    icon: string;
  }>;
  recommendations: string[];

  // Spouse comparison & Credit Optimization
  spouseResult?: CalculationResult;
  combinedResult?: CalculationResult;
  combinedFamilyNominalRefund?: number;
  combinedFamilyTotalRefund?: number;
  combinedFamilyNetDifference?: number;
  isCombinedDebt?: boolean;
  combinedDebtAmount?: number;
  spouseCreditOptimization?: {
    applied: boolean;
    transferredCreditAmount: number;
    fromSpouseName: string;
    toSpouseName: string;
    creditType: string;
    explanation: string;
  };
}

export interface GuideTooltipInfo {
  title: string;
  formName: string;
  fieldCode?: string;
  explanation: string;
  example: string;
  locationHint: string;
  badge?: string;
}
