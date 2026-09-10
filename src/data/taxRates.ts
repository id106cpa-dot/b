import { TaxYear, YearTaxConfig } from '../types/tax';

export const TAX_CONFIGS: Record<TaxYear, YearTaxConfig> = {
  2026: {
    year: 2026,
    creditPointAnnualValue: 2904,
    creditPointMonthlyValue: 242,
    brackets: [
      { limit: 84120, rate: 0.10 },
      { limit: 120720, rate: 0.14 },
      { limit: 193800, rate: 0.20 },
      { limit: 269280, rate: 0.31 },
      { limit: 560280, rate: 0.35 },
      { limit: Infinity, rate: 0.47 },
    ],
    surtaxThreshold: 721560,
    surtaxRate: 0.03,
    minDonationThreshold: 200,
    maxDonationPercentage: 0.30,
    pensionQualifyingMonthlySalary: 9700,
    pensionQualifyingAnnualSalary: 116400,
    maxEmployeePensionAnnualDeposit: 8148, // 7% * 116,400
    maxEmployeePensionAnnualCredit: 2851.8, // 35% * 8,148
    maxSelfPensionQualifyingDeposit: 5820, // 5% * 116,400
  },
  2025: {
    year: 2025,
    creditPointAnnualValue: 2904,
    creditPointMonthlyValue: 242,
    brackets: [
      { limit: 84120, rate: 0.10 },
      { limit: 120720, rate: 0.14 },
      { limit: 193800, rate: 0.20 },
      { limit: 269280, rate: 0.31 },
      { limit: 560280, rate: 0.35 },
      { limit: Infinity, rate: 0.47 },
    ],
    surtaxThreshold: 721560,
    surtaxRate: 0.03,
    minDonationThreshold: 200,
    maxDonationPercentage: 0.30,
    pensionQualifyingMonthlySalary: 9700,
    pensionQualifyingAnnualSalary: 116400,
    maxEmployeePensionAnnualDeposit: 8148,
    maxEmployeePensionAnnualCredit: 2851.8,
    maxSelfPensionQualifyingDeposit: 5820,
  },
  2024: {
    year: 2024,
    creditPointAnnualValue: 2904,
    creditPointMonthlyValue: 242,
    brackets: [
      { limit: 84120, rate: 0.10 },
      { limit: 120720, rate: 0.14 },
      { limit: 193800, rate: 0.20 },
      { limit: 269280, rate: 0.31 },
      { limit: 560280, rate: 0.35 },
      { limit: Infinity, rate: 0.47 },
    ],
    surtaxThreshold: 721560,
    surtaxRate: 0.03,
    minDonationThreshold: 200,
    maxDonationPercentage: 0.30,
    pensionQualifyingMonthlySalary: 9700,
    pensionQualifyingAnnualSalary: 116400,
    maxEmployeePensionAnnualDeposit: 8148,
    maxEmployeePensionAnnualCredit: 2851.8,
    maxSelfPensionQualifyingDeposit: 5820,
  },
  2023: {
    year: 2023,
    creditPointAnnualValue: 2820,
    creditPointMonthlyValue: 235,
    brackets: [
      { limit: 81480, rate: 0.10 },
      { limit: 116760, rate: 0.14 },
      { limit: 187440, rate: 0.20 },
      { limit: 260520, rate: 0.31 },
      { limit: 542160, rate: 0.35 },
      { limit: Infinity, rate: 0.47 },
    ],
    surtaxThreshold: 698280,
    surtaxRate: 0.03,
    minDonationThreshold: 200,
    maxDonationPercentage: 0.30,
    pensionQualifyingMonthlySalary: 9400,
    pensionQualifyingAnnualSalary: 112800,
    maxEmployeePensionAnnualDeposit: 7896, // 7% * 112,800
    maxEmployeePensionAnnualCredit: 2763.6, // 35% * 7,896
    maxSelfPensionQualifyingDeposit: 5640, // 5% * 112,800
  },
  2022: {
    year: 2022,
    creditPointAnnualValue: 2676,
    creditPointMonthlyValue: 223,
    brackets: [
      { limit: 77400, rate: 0.10 },
      { limit: 110880, rate: 0.14 },
      { limit: 178080, rate: 0.20 },
      { limit: 247440, rate: 0.31 },
      { limit: 514920, rate: 0.35 },
      { limit: Infinity, rate: 0.47 },
    ],
    surtaxThreshold: 663240,
    surtaxRate: 0.03,
    minDonationThreshold: 190,
    maxDonationPercentage: 0.30,
    pensionQualifyingMonthlySalary: 8900,
    pensionQualifyingAnnualSalary: 106800,
    maxEmployeePensionAnnualDeposit: 7476, // 7% * 106,800
    maxEmployeePensionAnnualCredit: 2616.6, // 35% * 7,476
    maxSelfPensionQualifyingDeposit: 5340, // 5% * 106,800
  },
  2021: {
    year: 2021,
    creditPointAnnualValue: 2616,
    creditPointMonthlyValue: 218,
    brackets: [
      { limit: 75480, rate: 0.10 },
      { limit: 108360, rate: 0.14 },
      { limit: 173880, rate: 0.20 },
      { limit: 241680, rate: 0.31 },
      { limit: 502920, rate: 0.35 },
      { limit: Infinity, rate: 0.47 },
    ],
    surtaxThreshold: 647640,
    surtaxRate: 0.03,
    minDonationThreshold: 190,
    maxDonationPercentage: 0.30,
    pensionQualifyingMonthlySalary: 8700,
    pensionQualifyingAnnualSalary: 104400,
    maxEmployeePensionAnnualDeposit: 7308, // 7% * 104,400
    maxEmployeePensionAnnualCredit: 2557.8, // 35% * 7,308
    maxSelfPensionQualifyingDeposit: 5220, // 5% * 104,400
  },
  2020: {
    year: 2020,
    creditPointAnnualValue: 2628,
    creditPointMonthlyValue: 219,
    brackets: [
      { limit: 75960, rate: 0.10 },
      { limit: 108960, rate: 0.14 },
      { limit: 174960, rate: 0.20 },
      { limit: 243120, rate: 0.31 },
      { limit: 505920, rate: 0.35 },
      { limit: Infinity, rate: 0.47 },
    ],
    surtaxThreshold: 651600,
    surtaxRate: 0.03,
    minDonationThreshold: 190,
    maxDonationPercentage: 0.30,
    pensionQualifyingMonthlySalary: 8800,
    pensionQualifyingAnnualSalary: 105600,
    maxEmployeePensionAnnualDeposit: 7392, // 7% * 105,600
    maxEmployeePensionAnnualCredit: 2587.2, // 35% * 7,392
    maxSelfPensionQualifyingDeposit: 5280, // 5% * 105,600
  },
};

export interface EligibleSettlement {
  name: string;
  rate: number; // e.g. 0.12 (12%)
  ceiling: number; // annual ceiling e.g. 168000
  region: string;
}

export const ELIGIBLE_SETTLEMENTS: EligibleSettlement[] = [
  { name: 'שדרות', rate: 0.20, ceiling: 241000, region: 'עוטף עזה' },
  { name: 'קרית שמונה', rate: 0.20, ceiling: 241000, region: 'קו עימות צפון' },
  { name: 'שלומי', rate: 0.18, ceiling: 241000, region: 'קו עימות צפון' },
  { name: 'אופקים', rate: 0.18, ceiling: 198000, region: 'נגב' },
  { name: 'נתיבות', rate: 0.16, ceiling: 198000, region: 'נגב' },
  { name: 'דימונה', rate: 0.16, ceiling: 198000, region: 'נגב' },
  { name: 'ערד', rate: 0.16, ceiling: 198000, region: 'נגב' },
  { name: 'מצפה רמון', rate: 0.19, ceiling: 241000, region: 'נגב' },
  { name: 'מעלות תרשיחא', rate: 0.14, ceiling: 198000, region: 'גליל' },
  { name: 'נהריה', rate: 0.12, ceiling: 168000, region: 'גליל מערבי' },
  { name: 'קצרין', rate: 0.12, ceiling: 168000, region: 'רמת הגולן' },
  { name: 'בית שאן', rate: 0.12, ceiling: 168000, region: 'עמק המעיינות' },
  { name: 'עכו', rate: 0.11, ceiling: 168000, region: 'גליל מערבי' },
  { name: 'טבריה', rate: 0.11, ceiling: 168000, region: 'גליל תחתון' },
  { name: 'כפר ורדים', rate: 0.11, ceiling: 168000, region: 'גליל' },
  { name: 'אילת', rate: 0.10, ceiling: 241000, region: 'דרום' },
  { name: 'כרמיאל', rate: 0.07, ceiling: 132000, region: 'גליל' },
  { name: 'ירוחם', rate: 0.18, ceiling: 198000, region: 'נגב' },
  { name: 'חצור הגלילית', rate: 0.14, ceiling: 198000, region: 'גליל' },
  { name: 'צפת', rate: 0.11, ceiling: 168000, region: 'גליל עליון' },
];
