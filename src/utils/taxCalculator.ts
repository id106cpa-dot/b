import { TaxInputData, CalculationResult, Employer106Record, UnifiedCreditRow } from '../types/tax';
import { TAX_CONFIGS, ELIGIBLE_SETTLEMENTS } from '../data/taxRates';

/**
 * Calculates tax refund for an employee, supporting multiple Form 106s,
 * taxable National Insurance Institute benefits, deductions, statutory credits,
 * and married couple credit optimization (Section 45 and 46 transferability).
 */
export function calculateTaxRefund(
  input: TaxInputData,
  isRecursiveSpouseCall: boolean = false
): CalculationResult {
  const config = TAX_CONFIGS[input.taxYear] || TAX_CONFIGS[2024];

  // 1. Aggregate income and taxes from all employers (טפסי 106 מרובים)
  let totalGrossEmploymentIncome = 0;
  let totalTaxDeductedEmployment = 0;
  let totalEmployeePensionDeposits = 0; // שדות 045 / 086
  let totalEmployerPensionDeposits = 0; // שדות 036 / 081
  let totalNonInsuredSalary = 0; // שכר לא מבוטח
  let totalSection47InPayslip = 0; // שדה 047

  const employerList: Employer106Record[] = (input.employers && input.employers.length > 0)
    ? input.employers
    : [{
        id: 'primary',
        employerName: input.employerName || 'מעסיק עיקרי',
        grossSalary: input.grossSalary || 0,
        taxDeducted: input.taxDeducted || 0,
        workMonths: input.workMonths || 12,
        employeePensionDeposit: input.employeePensionDeposit || 0,
        employerPensionDeposit: input.employerPensionDeposit || 0,
        insuredSalary: input.insuredSalary || 0,
        nonInsuredSalary: input.nonInsuredSalary || 0,
      }];

  const employerCount = employerList.length;

  for (const emp of employerList) {
    totalGrossEmploymentIncome += Math.max(0, emp.grossSalary || 0);
    totalTaxDeductedEmployment += Math.max(0, emp.taxDeducted || 0);
    totalEmployeePensionDeposits += Math.max(0, emp.employeePensionDeposit || 0);
    totalEmployerPensionDeposits += Math.max(0, emp.employerPensionDeposit || 0);
    totalNonInsuredSalary += Math.max(0, emp.nonInsuredSalary || 0);
    totalSection47InPayslip += Math.max(0, emp.section47Deduction || 0);
  }

  // Detect missed tax coordination if multiple employers and secondary deducted >=35%
  let missedTaxCoordinationDetected = false;
  if (employerCount > 1) {
    for (let i = 1; i < employerList.length; i++) {
      const secondary = employerList[i];
      if (secondary.grossSalary > 0 && (secondary.taxDeducted / secondary.grossSalary) >= 0.35) {
        missedTaxCoordinationDetected = true;
        break;
      }
    }
  }

  // Taxable National Insurance Payments (אבטלה, מילואים, דמי לידה, דמי פגיעה וכו')
  const unemployment = Math.max(0, input.unemploymentBenefits || 0);
  const reserveDuty = Math.max(0, input.reserveDutyBenefits || 0);
  const maternity = Math.max(0, input.maternityBenefits || 0);
  const workInjury = Math.max(0, input.workInjuryBenefits || 0);
  const otherBL = Math.max(0, input.otherTaxableBituachLeumiBenefits || 0);
  const totalBituachLeumiIncome = unemployment + reserveDuty + maternity + workInjury + otherBL;

  const totalIncome = totalGrossEmploymentIncome + totalBituachLeumiIncome;

  // 2. Deductions (ניכויים המפחיתים את ההכנסה החייבת לפני חישוב מדרגות המס)
  let deductionsTotalNIS = 0;

  // פטור בגין נכות רפואית בלבד - סעיף 9(5) לפקודת מס הכנסה (הכנסה פטורה / ניכוי מלא מההכנסה)
  let medicalExemptionDeductionNIS = 0;
  if (input.hasMedicalExemption && (input.medicalDisabilityPercentage || 0) >= 90) {
    const dur = input.disabilityDurationType || 'full_year_or_permanent';
    if (dur === 'under_185_days') {
      medicalExemptionDeductionNIS = 0; // אין פטור לפחות מ-185 ימים
    } else if (dur === '185_to_364_days') {
      // פטור זמני / פטור קטן (תקרה שנתית כ-₪80,040 לשנים 2024-2026, ₪77,760 לשנת 2023, ₪74,000 לשנים קודמות)
      const tempCeiling = input.taxYear >= 2024 ? 80040 : (input.taxYear === 2023 ? 77760 : 74000);
      medicalExemptionDeductionNIS = Math.min(totalIncome, tempCeiling);
    } else {
      // 365 ימים ומעלה או לצמיתות - פטור מלא / פטור גדול מיגיעה אישית
      let fullCeiling = input.taxYear >= 2025 ? 480000 : (input.taxYear === 2024 ? 464400 : (input.taxYear === 2023 ? 445000 : 409200));
      if (input.isSecurityForcesOrTerrorVictim) {
        // פטור מוגדל לזכאים לתגמול חודשי לפי חוק הנכים או נפגעי פעולות איבה
        fullCeiling = input.taxYear >= 2025 ? 720000 : (input.taxYear === 2024 ? 698400 : (input.taxYear === 2023 ? 670000 : 628800));
      }
      medicalExemptionDeductionNIS = Math.min(totalIncome, fullCeiling);
    }
  }
  deductionsTotalNIS += medicalExemptionDeductionNIS;

  // הוצאות השתלמות מקצועית לשכיר לשמירה על הקיים (מופרד לחלוטין לפי פקודת מס הכנסה והלכת הידור)
  const studyExpenses = input.hasProfessionalStudiesExpenses ? Math.max(0, input.professionalStudiesExpenses || 0) : 0;
  deductionsTotalNIS += studyExpenses;

  // ניכוי סעיף 47: הפקדות לקופת גמל עבור שכר שאינו מבוטח (עד 11% מהשכר הלא מבוטח)
  let section47Deduction = totalSection47InPayslip;
  if (input.madeSelfPensionDeposits && input.selfPensionAmount > 0) {
    const nonInsuredBase = totalNonInsuredSalary > 0
      ? totalNonInsuredSalary
      : Math.max(0, totalIncome - (input.insuredSalary || 0));
    const maxDeductiblePension = Math.min(input.selfPensionAmount * 0.6, Math.max(0, nonInsuredBase * 0.11));
    section47Deduction += Math.round(maxDeductiblePension);
  }
  deductionsTotalNIS += section47Deduction;

  // Taxable income after deductions
  const taxableIncome = Math.max(0, totalIncome - deductionsTotalNIS);

  // 3. Tax brackets computation on taxableIncome
  let remainingTaxable = taxableIncome;
  let baseTaxBeforeCredits = 0;
  const bracketsBreakdown: CalculationResult['bracketsBreakdown'] = [];

  let previousLimit = 0;
  for (const bracket of config.brackets) {
    if (remainingTaxable <= 0) break;

    const bracketSpan = bracket.limit === Infinity ? remainingTaxable : bracket.limit - previousLimit;
    const taxableInThisBracket = Math.min(remainingTaxable, bracketSpan);
    const taxInThisBracket = taxableInThisBracket * bracket.rate;

    baseTaxBeforeCredits += taxInThisBracket;
    remainingTaxable -= taxableInThisBracket;

    const ratePercent = Math.round(bracket.rate * 100);
    const bracketLabel = bracket.limit === Infinity
      ? `מעל ₪${previousLimit.toLocaleString('he-IL')} (${ratePercent}%)`
      : `₪${previousLimit.toLocaleString('he-IL')} - ₪${bracket.limit.toLocaleString('he-IL')} (${ratePercent}%)`;

    bracketsBreakdown.push({
      bracketLabel,
      ratePercent,
      amountInBracket: Math.round(taxableInThisBracket),
      taxPaidInBracket: Math.round(taxInThisBracket),
    });

    previousLimit = bracket.limit;
  }

  // Surtax (מס יסף 3% מעל התקרה)
  let surtaxAmount = 0;
  if (taxableIncome > config.surtaxThreshold) {
    surtaxAmount = (taxableIncome - config.surtaxThreshold) * config.surtaxRate;
  }

  const initialTax = baseTaxBeforeCredits + surtaxAmount;

  // 4. Credit points compilation
  const creditPointsBreakdown: CalculationResult['creditPointsBreakdown'] = [];
  let creditPointsTotal = 0;

  // Basic Israeli resident
  if (input.isIsraeliResident) {
    creditPointsTotal += 2.25;
    creditPointsBreakdown.push({
      label: 'תושב/ת ישראל (בסיסי)',
      points: 2.25,
      reason: '2.25 נקודות זיכוי בסיסיות לכל תושב ישראל',
    });
  }

  // Female credit
  if (input.gender === 'female') {
    creditPointsTotal += 0.5;
    creditPointsBreakdown.push({
      label: 'אישה עובדת',
      points: 0.5,
      reason: 'חצי נקודת זיכוי נוספת לאישה',
    });
  }

  // Children points
  if (input.hasChildren && input.children && input.children.length > 0) {
    let childrenPoints = 0;
    for (const child of input.children) {
      const age = input.taxYear - child.birthYear;
      if (age >= 0 && age <= 18) {
        if (age === 0) {
          childrenPoints += input.taxYear >= 2024 ? 2.5 : 1.5;
        } else if (age >= 1 && age <= 2) {
          childrenPoints += input.taxYear >= 2024 ? 3.5 : 2.5;
        } else if (age === 3) {
          childrenPoints += input.taxYear >= 2024 ? 3.5 : 2.5;
        } else if (age >= 4 && age <= 5) {
          childrenPoints += input.taxYear >= 2024 ? 2.5 : 2.5;
        } else if (age >= 6 && age <= 17) {
          childrenPoints += input.taxYear >= 2024 ? 1.0 : 1.0;
        } else if (age === 18) {
          childrenPoints += 0.5;
        }
      }
    }
    if (childrenPoints > 0) {
      creditPointsTotal += childrenPoints;
      creditPointsBreakdown.push({
        label: `ילדים (${input.children.length} ילדים)`,
        points: Number(childrenPoints.toFixed(1)),
        reason: 'הטבות הורים עובדים, פעוטות וילדים בגילי 0-18',
      });
    }
  }

  // Single Parent / Custody / Alimony (סעיף 40 וסעיף 40א)
  // הורה יחידני (רווק/גרוש/אלמן) שילדיו בחזקתו הבלעדית או משותפת
  const isSeparatedOrSingle = input.maritalStatus === 'single' || input.maritalStatus === 'divorced' || input.maritalStatus === 'widowed';
  if (isSeparatedOrSingle && input.hasChildren && (input.isSingleParent || input.custodyType === 'sole' || input.custodyType === 'shared' || input.receivesChildAllowance)) {
    creditPointsTotal += 1.0;
    creditPointsBreakdown.push({
      label: 'הורה עצמאי / משפחה חד-הורית (סעיף 40(ב)(1))',
      points: 1.0,
      reason: 'נקודת זיכוי להורה עצמאי שילדיו בחזקתו',
    });
  }

  // זיכוי כלכלה (סעיף 40(א)) - השתתפות בכלכלת הילדים בהורות יחידה/משמורת
  if (isSeparatedOrSingle && input.hasChildren && (input.custodyType === 'sole' || input.custodyType === 'shared' || input.isSingleParent)) {
    creditPointsTotal += 1.0;
    creditPointsBreakdown.push({
      label: 'זיכוי כלכלה - גידול ילדים (סעיף 40(א))',
      points: 1.0,
      reason: 'נקודת זיכוי בגין נשיאה בכלכלת הילדים בהורות יחידנית / משמורת',
    });
  }

  // מזונות לילדים שאינם בחזקתו הבלעדית (סעיף 40(ב)(2))
  if (input.paysChildAlimony || (input.paysAlimony && input.hasChildren && input.custodyType === 'none')) {
    creditPointsTotal += 1.0;
    creditPointsBreakdown.push({
      label: 'השתתפות בכלכלת ילדים / מזונות ילדים (סעיף 40(ב)(2))',
      points: 1.0,
      reason: 'נקודת זיכוי להורה המשלם מזונות ומשתתף בכלכלת ילדיו שאינם בחזקתו',
    });
  }

  // Dependent Spouse (סעיף 37 - בן זוג ללא הכנסה)
  if (input.hasDependentSpouse || (input.maritalStatus === 'married' && !input.includeSpouseCalculation && input.grossSalary > 0 && input.spouseData?.grossSalary === 0)) {
    creditPointsTotal += 1.0;
    creditPointsBreakdown.push({
      label: 'בן/בת זוג ללא הכנסה (סעיף 37)',
      points: 1.0,
      reason: 'נקודת זיכוי שנתית בגין בן זוג שאינו עובד או שהגיע לגיל פרישה/נכות',
    });
  }

  // Alimony (מזונות לבן זוג לשעבר שהתגרש ממנו - סעיף 40א)
  if (input.paysAlimony && !input.paysChildAlimony) {
    creditPointsTotal += 1.0;
    creditPointsBreakdown.push({
      label: 'תשלום מזונות לבן/בת זוג לשעבר (סעיף 40א)',
      points: 1.0,
      reason: 'נקודת זיכוי למשלם מזונות לבן זוג לשעבר שהתגרש ממנו',
    });
  }

  // Special Needs Dependent (ילד / קרוב נטול יכולת סעיף 45)
  if (input.hasSpecialNeedsDependent) {
    creditPointsTotal += 2.0;
    creditPointsBreakdown.push({
      label: 'ילד או קרוב נטול יכולת (סעיף 45)',
      points: 2.0,
      reason: '2 נקודות זיכוי שוות ערך לכ-₪5,800 בשנה עבור תלוי עם מוגבלות',
    });
  }

  // Academic Degree (סעיף 40ד)
  if (input.hasAcademicDegree && input.graduationYear) {
    const yearsSinceGrad = input.taxYear - input.graduationYear;
    if (yearsSinceGrad >= 1 && yearsSinceGrad <= 3) {
      let degreePoints = 1.0;
      if (input.degreeType === 'master') degreePoints = 0.5;
      creditPointsTotal += degreePoints;
      creditPointsBreakdown.push({
        label: `סיום תואר אקדמי / מקצוע (${input.degreeType || 'תואר ראשון'})`,
        points: degreePoints,
        reason: 'נקודות זיכוי למסיימי תואר ב-3 השנים שלאחר סיום הלימודים (סעיף 40ד)',
      });
    }
  }

  // Discharged Soldier (סעיף 39א) - זכאות מתחילה חודש לאחר השחרור למשך 36 חודשים
  if (input.isDischargedSoldier && input.dischargeYear) {
    const dMonth = Math.min(12, Math.max(1, input.dischargeMonth || 1));
    const dYear = input.dischargeYear;

    // חודש הזכאות הראשון הוא חודש לאחר חודש השחרור
    const dischargeMonthIndex = dYear * 12 + dMonth;
    const startEligibleMonthIndex = dischargeMonthIndex + 1;
    const endEligibleMonthIndex = startEligibleMonthIndex + 35; // 36 חודשים כולל

    let eligibleSoldierMonths = 0;
    for (let m = 1; m <= 12; m++) {
      const curIndex = input.taxYear * 12 + m;
      if (curIndex >= startEligibleMonthIndex && curIndex <= endEligibleMonthIndex) {
        eligibleSoldierMonths++;
      }
    }

    if (eligibleSoldierMonths > 0) {
      const isCombat = input.serviceType === 'combat';
      // 2 נקודות שנתיות ללוחם (1/6 לכל חודש), 1 נקודה שנתית לאחר (1/12 לכל חודש)
      const monthlyRate = isCombat ? (2.0 / 12) : (1.0 / 12);
      const points = Number((eligibleSoldierMonths * monthlyRate).toFixed(2));
      creditPointsTotal += points;
      creditPointsBreakdown.push({
        label: `חייל/ת משוחרר/ת (${isCombat ? 'לוחם/ת / שירות מלא' : 'שירות סדיר'}) - ${eligibleSoldierMonths}/12 חודשים`,
        points,
        reason: `זכאות לפי סעיף 39א: ${eligibleSoldierMonths} חודשי זכאות בשנת המס (שחרור ${dMonth}/${dYear}, זכאות החל מחודש לאחר השחרור ל-36 חודשים)`,
      });
    }
  }

  // New Immigrant / Returning Resident (סעיף 35) - חישוב חודשי ממועד העלייה
  if (input.isNewImmigrant && input.immigrationYear) {
    const iMonth = Math.min(12, Math.max(1, input.immigrationMonth || 1));
    const iYear = input.immigrationYear;
    const aliyahMonthIndex = iYear * 12 + iMonth;

    let aliyaPoints = 0;
    let eligibleAliyahMonths = 0;

    for (let m = 1; m <= 12; m++) {
      const curIndex = input.taxYear * 12 + m;
      const monthSinceAliyah = curIndex - aliyahMonthIndex + 1; // חודש 1 הוא חודש העלייה

      if (monthSinceAliyah >= 1 && monthSinceAliyah <= 12) {
        // 1-12 חודשים ראשונים: 1/4 נקודה לחודש (3 נקודות לשנה)
        aliyaPoints += (1 / 4);
        eligibleAliyahMonths++;
      } else if (monthSinceAliyah >= 13 && monthSinceAliyah <= 24) {
        // 13-24 חודשים: 1/6 נקודה לחודש (2 נקודות לשנה)
        aliyaPoints += (1 / 6);
        eligibleAliyahMonths++;
      } else if (monthSinceAliyah >= 25 && monthSinceAliyah <= 36) {
        // 25-36 חודשים: 1/12 נקודה לחודש (1 נקודה לשנה)
        aliyaPoints += (1 / 12);
        eligibleAliyahMonths++;
      } else if (monthSinceAliyah >= 37 && monthSinceAliyah <= 42) {
        // 37-42 חודשים: 1/12 נקודה לחודש
        aliyaPoints += (1 / 12);
        eligibleAliyahMonths++;
      }
    }

    if (eligibleAliyahMonths > 0) {
      const finalOlimPoints = Number(aliyaPoints.toFixed(2));
      creditPointsTotal += finalOlimPoints;
      creditPointsBreakdown.push({
        label: `עולה חדש / תושב חוזר (סעיף 35) - ${eligibleAliyahMonths}/12 חודשים`,
        points: finalOlimPoints,
        reason: `זכאות לפי סעיף 35: ${eligibleAliyahMonths} חודשי זכאות בשנת המס החל ממועד העלייה (${iMonth}/${iYear})`,
      });
    }
  }

  // Monetary value of credit points
  const creditPointsValueNIS = Math.round(creditPointsTotal * config.creditPointAnnualValue);

  // Separate credit points restricted strictly to personal exertion (יגיעה אישית בלבד)
  // Under Sections 39a (soldiers), 40d (degrees), and 40 (working parent toddler/child benefits):
  let personalExertionOnlyPoints = 0;
  if (input.isDischargedSoldier) {
    const soldierItem = creditPointsBreakdown.find(b => b.label.includes('חייל'));
    if (soldierItem) personalExertionOnlyPoints += soldierItem.points;
  }
  if (input.hasAcademicDegree) {
    const academicItem = creditPointsBreakdown.find(b => b.label.includes('תואר') || b.label.includes('מקצוע'));
    if (academicItem) personalExertionOnlyPoints += academicItem.points;
  }
  if (input.hasChildren) {
    const childItem = creditPointsBreakdown.find(b => b.label.includes('ילדים'));
    if (childItem) personalExertionOnlyPoints += childItem.points;
  }

  // 5. Direct Tax Credits Breakdown (זיכויי מס ישירים בשקלים)
  const directTaxCreditsBreakdown: CalculationResult['directTaxCreditsBreakdown'] = [];

  // 5a. Eligible settlement credit (סעיף 11 - יגיעה אישית בלבד)
  let settlementCreditNIS = 0;
  if (input.livesInEligibleSettlement && input.settlementName) {
    const settlement = ELIGIBLE_SETTLEMENTS.find(s => s.name === input.settlementName);
    if (settlement) {
      const eligibleIncome = Math.min(taxableIncome, settlement.ceiling);
      settlementCreditNIS = Math.round(eligibleIncome * settlement.rate);
      if (settlementCreditNIS > 0) {
        directTaxCreditsBreakdown.push({
          id: 'settlement-11',
          label: `הנחת תושב יישוב מזכה (${input.settlementName})`,
          sectionCode: 'סעיף 11 (שדות 131/132)',
          baseAmount: eligibleIncome,
          ratePercent: Math.round(settlement.rate * 100),
          creditNIS: settlementCreditNIS,
          description: `הנחת מס בשיעור ${Math.round(settlement.rate * 100)}% מההכנסה החייבת עד לתקרת ₪${settlement.ceiling.toLocaleString('he-IL')}`,
        });
      }
    }
  }

  // 5b. Section 46 Donations credit (35% from donations above minimum)
  let donationCreditNIS = 0;
  if (input.madeDonations && input.donationAmount > config.minDonationThreshold) {
    const maxAllowedDonation = taxableIncome * config.maxDonationPercentage;
    const recognizedDonation = Math.min(input.donationAmount, maxAllowedDonation);
    donationCreditNIS = Math.round(recognizedDonation * 0.35);
    if (donationCreditNIS > 0) {
      directTaxCreditsBreakdown.push({
        id: 'donations-46',
        label: 'זיכוי בגין תרומות למוסדות ציבוריים מוכרים',
        sectionCode: 'סעיף 46 (שדה 037)',
        baseAmount: recognizedDonation,
        ratePercent: 35,
        creditNIS: donationCreditNIS,
        description: `זיכוי ישיר בשיעור 35% מסכום תרומות מוכר בסך ₪${recognizedDonation.toLocaleString('he-IL')} (מתוך ₪${input.donationAmount.toLocaleString('he-IL')} שנתרמו)`,
      });
    }
  }

  // 5c. Pension & Life Insurance credit (סעיף 45א - זיכוי 35% על שדות 045/086 בכפוף לתקרות החוק ו-25% על ביטוח חיים)
  let empPensionCredit = 0;
  if (totalEmployeePensionDeposits > 0) {
    const salaryLimit7Percent = Math.round(totalGrossEmploymentIncome * 0.07);
    const annualStatutoryCeiling = config.maxEmployeePensionAnnualDeposit;
    const recognizedEmpPension = Math.min(
      totalEmployeePensionDeposits,
      salaryLimit7Percent > 0 ? salaryLimit7Percent : annualStatutoryCeiling,
      annualStatutoryCeiling
    );
    empPensionCredit = Math.round(recognizedEmpPension * 0.35);

    directTaxCreditsBreakdown.push({
      id: 'pension-employee-45a',
      label: 'זיכוי 45א - הפרשות עובד לקופת גמל לקצבה (שדה 045 בטופס 106)',
      sectionCode: 'סעיף 45א(ב)',
      baseAmount: recognizedEmpPension,
      ratePercent: 35,
      creditNIS: empPensionCredit,
      description: `זיכוי מס בשיעור 35% מהפקדת עובד מוכרת כחוק (מוגבלת ל-7% משכר ועד תקרת הפקדה שנתית של ₪${annualStatutoryCeiling.toLocaleString('he-IL')}, תקרה שנתית לזיכוי ₪${config.maxEmployeePensionAnnualCredit.toFixed(0)}). סך הפקדת העובד בטופס 106: ₪${totalEmployeePensionDeposits.toLocaleString('he-IL')}.`,
    });
  }

  let selfPensionCredit = 0;
  if (input.madeSelfPensionDeposits && input.selfPensionAmount > 0) {
    const nonInsuredBase = totalNonInsuredSalary > 0
      ? totalNonInsuredSalary
      : Math.max(0, totalIncome - (input.insuredSalary || 0));
    const maxSelf5Percent = nonInsuredBase > 0
      ? Math.round(nonInsuredBase * 0.05)
      : config.maxSelfPensionQualifyingDeposit;
    const selfCeiling = config.maxSelfPensionQualifyingDeposit;
    const recognizedSelfPension = Math.min(
      input.selfPensionAmount,
      maxSelf5Percent,
      selfCeiling
    );
    selfPensionCredit = Math.round(recognizedSelfPension * 0.35);

    if (selfPensionCredit > 0) {
      directTaxCreditsBreakdown.push({
        id: 'pension-self-45',
        label: 'זיכוי 45א - הפקדות עצמאיות לקופת גמל לקצבה (שכר לא מבוטח)',
        sectionCode: 'סעיף 45א',
        baseAmount: recognizedSelfPension,
        ratePercent: 35,
        creditNIS: selfPensionCredit,
        description: `זיכוי בשיעור 35% מהפקדה עצמאית מוכרת (עד 5% משכר לא מבוטח ועד תקרה של ₪${selfCeiling.toLocaleString('he-IL')}). סך הפקדה עצמאית: ₪${input.selfPensionAmount.toLocaleString('he-IL')}.`,
      });
    }
  }

  let lifeInsuranceCredit = 0;
  if (input.selfLifeInsuranceAmount && input.selfLifeInsuranceAmount > 0) {
    const maxLifeRecognized = Math.min(
      input.selfLifeInsuranceAmount,
      Math.round(totalIncome * 0.05),
      config.maxSelfPensionQualifyingDeposit
    );
    lifeInsuranceCredit = Math.round(maxLifeRecognized * 0.25);
    if (lifeInsuranceCredit > 0) {
      directTaxCreditsBreakdown.push({
        id: 'life-insurance-45',
        label: 'זיכוי 45א על ביטוח חיים ומשכנתא',
        sectionCode: 'סעיף 45א (שדה 268)',
        baseAmount: maxLifeRecognized,
        ratePercent: 25,
        creditNIS: lifeInsuranceCredit,
        description: `זיכוי ישיר של 25% מפרמיות ביטוח חיים/משכנתא (עד 5% מההכנסה, מתוך ₪${input.selfLifeInsuranceAmount.toLocaleString('he-IL')} ששולמו).`,
      });
    }
  }

  const pensionLifeCreditNIS = empPensionCredit + selfPensionCredit + lifeInsuranceCredit;

  // 5d. Nursing institution expense credit (סעיף 44 - 35% זיכוי כספי מופרד לחלוטין)
  let nursingInstitutionCreditNIS = 0;
  if (input.hasInstitutionalNursingExpenses && input.institutionalNursingExpenses > 0) {
    nursingInstitutionCreditNIS = Math.round(input.institutionalNursingExpenses * 0.35);
    directTaxCreditsBreakdown.push({
      id: 'nursing-44',
      label: 'זיכוי החזקת קרוב במוסד סיעודי',
      sectionCode: 'סעיף 44 (שדה 050)',
      baseAmount: input.institutionalNursingExpenses,
      ratePercent: 35,
      creditNIS: nursingInstitutionCreditNIS,
      description: 'זיכוי מס ישיר בשיעור 35% מתשלומי החזקת הורה או קרוב במוסד סיעודי',
    });
  }

  // 5e. Capital market calculations & loss offsets (סעיף 91 וסעיף 92 לפקודה, טופס 867)
  let capitalGainsTaxable = 0;
  let capitalGainsTaxAmount = 0;
  let netGains25 = 0;
  let netGains15 = 0;

  if (input.investedInCapitalMarket) {
    const gains25 = input.capitalGains25 !== undefined
      ? Math.max(0, input.capitalGains25)
      : Math.max(0, input.capitalGains || 0);
    const gains15 = Math.max(0, input.capitalGains15 || 0);
    const losses = Math.max(0, input.capitalLosses || 0);

    // קיזוז הפסדים תחילה מרווחים החייבים ב-25% (מניות, קרנות נאמנות)
    const offsetAgainst25 = Math.min(gains25, losses);
    const remLosses = losses - offsetAgainst25;
    netGains25 = gains25 - offsetAgainst25;

    // יתרת הפסדים מתקזזת מרווחים החייבים ב-15% (אג"ח, פיקדונות שקליים)
    const offsetAgainst15 = Math.min(gains15, remLosses);
    netGains15 = gains15 - offsetAgainst15;

    capitalGainsTaxable = netGains25 + netGains15;

    // חישוב מס רווחי הון בשיעור מיוחד (25% ו-15%)
    capitalGainsTaxAmount = Math.round(netGains25 * 0.25 + netGains15 * 0.15);
  }

  // מס בשיעורים רגילים (מדרגות המס + מס יסף)
  const regularTaxableIncome = taxableIncome;
  const regularTaxAmount = Math.round(baseTaxBeforeCredits + surtaxAmount);

  // סה"כ מס ברוטו לפני זיכויים (מס רגיל + מס רווחי הון)
  const totalGrossTaxBeforeCredits = regularTaxAmount + capitalGainsTaxAmount;

  // Direct Tax Credits Total (sum of all direct credits)
  const directTaxCreditsTotalNIS = directTaxCreditsBreakdown.reduce((sum, item) => sum + item.creditNIS, 0);

  // Total Statutory Credits Value
  const totalGeneralCredits = creditPointsValueNIS + directTaxCreditsTotalNIS;

  // 10. Credit offset rules: Personal exertion vs Capital gains
  // Under Israeli tax law:
  // - Credits strictly restricted to personal exertion (soldiers 39a, degrees 40d, toddlers/children 40, settlement 11)
  //   CANNOT offset capital gains tax.
  // - Credits that are allowed against capital gains (basic resident 33/36, donations 46, pension 45a, nursing 44, dependent spouse 37, disability 45).
  // Strategy to maximize taxpayer benefit (קיזוז לטובת הנישום):
  // We first use the restricted personal-exertion credits against regular income tax.
  const personalExertionOnlyCreditsNIS = Math.round(personalExertionOnlyPoints * config.creditPointAnnualValue) + settlementCreditNIS;
  const capitalEligibleCreditsNIS = Math.max(0, totalGeneralCredits - personalExertionOnlyCreditsNIS);

  let remRegularTax = regularTaxAmount;
  // Step 1: Offset regular tax with restricted personal exertion credits
  const offsetFromPersonalExertionOnRegular = Math.min(remRegularTax, personalExertionOnlyCreditsNIS);
  remRegularTax -= offsetFromPersonalExertionOnRegular;

  // Step 2: Offset any remaining regular tax with capital-eligible credits
  const offsetFromCapitalEligibleOnRegular = Math.min(remRegularTax, capitalEligibleCreditsNIS);
  remRegularTax -= offsetFromCapitalEligibleOnRegular;

  const netRegularTax = remRegularTax;
  const creditsOffsetRegularTaxNIS = offsetFromPersonalExertionOnRegular + offsetFromCapitalEligibleOnRegular;

  // Step 3: Offset capital gains tax with remaining capital-eligible credits only
  const remCapitalEligibleCredits = capitalEligibleCreditsNIS - offsetFromCapitalEligibleOnRegular;
  const creditsOffsetCapitalGainsNIS = Math.min(capitalGainsTaxAmount, remCapitalEligibleCredits);
  const netCapitalTax = capitalGainsTaxAmount - creditsOffsetCapitalGainsNIS;

  // Final Tax Liability (מס נטו חבות שנתית)
  let taxLiabilityFinal = Math.round(netRegularTax + netCapitalTax);

  // 11. Total tax paid in advance (שכר + ביטוח לאומי שנוכה במקור + מס בנקאי)
  const bituachLeumiTaxDeducted = Math.max(0, input.bituachLeumiTaxDeducted || 0);
  const capitalTaxPaid = input.investedInCapitalMarket ? Math.max(0, input.capitalTaxPaid || 0) : 0;
  const taxAlreadyPaid = Math.round(totalTaxDeductedEmployment + bituachLeumiTaxDeducted + capitalTaxPaid);

  // 12. Net difference & STRICT SEPARATION: Nominal vs Interest/Linkage
  let netDifference = Math.round(taxAlreadyPaid - taxLiabilityFinal);

  // Nominal Refund (החזר קרן המס בלבד)
  let nominalRefund = netDifference > 0 ? netDifference : 0;

  // Statutory Interest & Indexation (4% שנתי + הצמדה למדד כחוק פטור ממס לפי סעיף 160)
  const yearsPassed = Math.max(0.5, 2026 - input.taxYear);
  const interestFactor = Math.pow(1 + 0.04, yearsPassed) - 1;
  let interestAndLinkageBenefit = netDifference > 0 ? Math.round(nominalRefund * interestFactor) : 0;
  let finalRefundWithInterest = netDifference > 0 ? nominalRefund + interestAndLinkageBenefit : netDifference;

  // 13. Compile key factors / narrative insights
  const keyRefundFactors: CalculationResult['keyRefundFactors'] = [];

  if (employerCount > 1) {
    keyRefundFactors.push({
      title: `עבודה אצל ${employerCount} מעסיקים במקביל / במעבר`,
      amount: missedTaxCoordinationDetected ? Math.round(totalTaxDeductedEmployment * 0.25) : 0,
      description: missedTaxCoordinationDetected
        ? 'זוהה ניכוי מס מקסימלי במעסיק משני ללא תיאום מס! מגיע לך החזר כספי ענק על כל המס העודף שנוכה.'
        : `סוכמו ${employerCount} טפסי 106. החישוב השנתי המאוחד מאזן את מדרגות המס ונקודות הזיכוי.`,
      icon: 'CalendarClock',
    });
  }

  if (totalBituachLeumiIncome > 0) {
    keyRefundFactors.push({
      title: 'תגמולים חייבים במס מביטוח לאומי (אבטלה / מילואים / דמי לידה)',
      amount: bituachLeumiTaxDeducted,
      description: `הוכנסו תגמולי ביטוח לאומי בסך ₪${totalBituachLeumiIncome.toLocaleString('he-IL')}. המס שנוכה במקור (₪${bituachLeumiTaxDeducted.toLocaleString('he-IL')}) נכלל במלואו בחישוב ההחזר!`,
      icon: 'CalendarClock',
    });
  }

  if (input.hasChildren && input.children.length > 0) {
    keyRefundFactors.push({
      title: 'הטבות הורים עובדים ופעוטות',
      amount: Math.round(input.children.length * config.creditPointAnnualValue * 1.5),
      description: `זכאות לנקודות זיכוי מוגדלות עבור ${input.children.length} ילדים בשווי של כ-₪${config.creditPointAnnualValue.toLocaleString('he-IL')} לנקודה.`,
      icon: 'Baby',
    });
  }

  if (input.hasDependentSpouse) {
    keyRefundFactors.push({
      title: 'זיכוי בגין בן/בת זוג ללא הכנסה (סעיף 37)',
      amount: Math.round(config.creditPointAnnualValue),
      description: 'נקודת זיכוי נוספת בשווי כ-₪2,900 עבור בן זוג שאינו עובד.',
      icon: 'HeartHandshake',
    });
  }

  if (deductionsTotalNIS > 0) {
    keyRefundFactors.push({
      title: 'ניכויים שהפחיתו את ההכנסה החייבת',
      amount: deductionsTotalNIS,
      description: `הפחתה של ₪${deductionsTotalNIS.toLocaleString('he-IL')} מההכנסה החייבת בגין שכר לא מבוטח (סעיף 47) / השתלמות מקצועית לשמירה על הקיים.`,
      icon: 'ShieldCheck',
    });
  }

  if (donationCreditNIS > 0) {
    keyRefundFactors.push({
      title: 'החזר 35% מתרומות (סעיף 46)',
      amount: donationCreditNIS,
      description: `תרמת ₪${input.donationAmount.toLocaleString('he-IL')} לעמותות מוכרות, ומגיע לך החזר כספי ישיר של 35% מהסכום!`,
      icon: 'HeartHandshake',
    });
  }

  if (settlementCreditNIS > 0) {
    keyRefundFactors.push({
      title: `הנחת תושב יישוב מזכה (${input.settlementName})`,
      amount: settlementCreditNIS,
      description: `הנחה מיוחדת בשיעור מההכנסה החייבת לתושבי ${input.settlementName} לפי סעיף 11 לפקודה.`,
      icon: 'MapPin',
    });
  }

  if (input.investedInCapitalMarket && (input.capitalLosses > 0 || capitalTaxPaid > netCapitalTax)) {
    const capitalSavings = Math.max(0, capitalTaxPaid - netCapitalTax);
    keyRefundFactors.push({
      title: 'קיזוז הפסדי הון והחזר מס שנוכה בבנק (טופס 867)',
      amount: capitalSavings,
      description: 'קיזוז הפסדים כנגד רווחי הון חייבים (25% ו-15%), ניצול נקודות זיכוי והשבת מס שנוכה במקור בבנק.',
      icon: 'TrendingUp',
    });
  }

  if (pensionLifeCreditNIS > 0) {
    keyRefundFactors.push({
      title: 'זיכוי על ביטוח חיים / משכנתא ופנסיה (סעיף 45)',
      amount: pensionLifeCreditNIS,
      description: 'זיכוי של 35% על הפרשות עובד לקצבה (שדות 045/086) ו-25% על ביטוח חיים ומשכנתא.',
      icon: 'ShieldCheck',
    });
  }

  if (nursingInstitutionCreditNIS > 0) {
    keyRefundFactors.push({
      title: 'זיכוי על החזקת קרוב במוסד סיעודי (סעיף 44)',
      amount: nursingInstitutionCreditNIS,
      description: 'זיכוי מס ישיר של 35% מתשלומי החזקת הורה או קרוב במוסד סיעודי / בית אבות.',
      icon: 'ShieldCheck',
    });
  }

  if (input.hasAcademicDegree) {
    keyRefundFactors.push({
      title: 'הטבת מס לבוגר תואר אקדמי / מקצוע',
      amount: Math.round(config.creditPointAnnualValue),
      description: 'נקודת זיכוי שנתית לפי סעיף 40ד המפחיתה את חבות המס.',
      icon: 'GraduationCap',
    });
  }

  if (input.isDischargedSoldier) {
    keyRefundFactors.push({
      title: 'הטבת חייל/ת משוחרר/ת',
      amount: Math.round(config.creditPointAnnualValue * (input.serviceType === 'combat' ? 2 : 1)),
      description: 'נקודות זיכוי מוגדלות ללוחמים ותומכי לחימה ב-36 החודשים שלאחר השחרור.',
      icon: 'Award',
    });
  }

  if (input.isNewImmigrant) {
    keyRefundFactors.push({
      title: 'הטבת עולה חדש / תושב חוזר (סעיף 35)',
      amount: Math.round(config.creditPointAnnualValue * 2),
      description: 'נקודות זיכוי מוגדלות המגיעות לעולים חדשים ותושבים חוזרים ותיקים.',
      icon: 'Award',
    });
  }

  // Recommendations
  const recommendations: string[] = [
    `ניתן להגיש בקשה להחזר מס לשנת ${input.taxYear} באמצעות טופס 135 (דוח מקוצר לשכירים).`,
    'מדינת ישראל מעניקה ריבית והצמדה של 4% שנתי ללא מס על כל סכום ההחזר החל מתום שנת המס!',
    'הזכות לדרוש החזר מס נשמרת עד 6 שנים אחורה בלבד – שנת 2020 תתיישן בקרוב!',
  ];

  if (employerCount > 1 && missedTaxCoordinationDetected) {
    recommendations.push('מומלץ לצרף את כל טפסי ה-106 של כל המעסיקים באותה שנה לקבלת ההחזר במלואו.');
  }

  // 13b. Construct Unified Continuous Credits List (רשימה רציפה אחידה שורה אחר שורה - שומת מס הכנסה)
  const unifiedCreditsList: UnifiedCreditRow[] = [];
  const pointAnnualVal = config.creditPointAnnualValue;

  // 1. Personal Credit Points (סעיפים 33–40 לפקודה, שדות 022–028)
  creditPointsBreakdown.forEach((item, index) => {
    const itemNIS = Math.round(item.points * pointAnnualVal);
    let sectionCode = 'סעיף 33–40';
    let formFieldCode = '022';

    if (item.label.includes('תושב')) {
      sectionCode = 'סעיף 33';
      formFieldCode = '022';
    } else if (item.label.includes('אישה')) {
      sectionCode = 'סעיף 36א';
      formFieldCode = '022';
    } else if (item.label.includes('ילד') || item.label.includes('פעוט') || item.label.includes('הורים')) {
      sectionCode = 'סעיף 40';
      formFieldCode = '022';
    } else if (item.label.includes('יחיד') || item.label.includes('חד-הורי')) {
      sectionCode = 'סעיף 40(ב)(1)';
      formFieldCode = '024';
    } else if (item.label.includes('מזונות')) {
      sectionCode = 'סעיף 40א / 40(ב)(2)';
      formFieldCode = '025';
    } else if (item.label.includes('ללא הכנסה')) {
      sectionCode = 'סעיף 37';
      formFieldCode = '023';
    } else if (item.label.includes('תואר') || item.label.includes('אקדמי') || item.label.includes('מקצוע')) {
      sectionCode = 'סעיף 40ד';
      formFieldCode = '026';
    } else if (item.label.includes('חייל') || item.label.includes('שירות לאומי')) {
      sectionCode = 'סעיף 39א';
      formFieldCode = '027';
    } else if (item.label.includes('עולה')) {
      sectionCode = 'סעיף 35';
      formFieldCode = '028';
    } else if (item.label.includes('נטול יכולת')) {
      sectionCode = 'סעיף 45';
      formFieldCode = '115';
    }

    unifiedCreditsList.push({
      id: `credit-point-${index}`,
      category: 'credit_point',
      label: item.label,
      sectionCode,
      formFieldCode,
      basisOrDetails: `${item.points} נקודות זיכוי (₪${pointAnnualVal.toLocaleString('he-IL')} לנקודה)`,
      creditNIS: itemNIS,
      description: item.reason,
    });
  });

  // 2. Direct Tax Credits (סעיף 45א פנסיה, סעיף 46 תרומות, סעיף 11 יישוב מוטב, סעיף 44)
  directTaxCreditsBreakdown.forEach((credit, idx) => {
    let formField = '045';
    if (credit.sectionCode.includes('46')) formField = '037';
    else if (credit.sectionCode.includes('11')) formField = '131';
    else if (credit.sectionCode.includes('268')) formField = '268';
    else if (credit.sectionCode.includes('44')) formField = '044';
    else if (credit.sectionCode.includes('200')) formField = '200';

    unifiedCreditsList.push({
      id: credit.id || `direct-credit-${idx}`,
      category: 'direct_credit',
      label: credit.label,
      sectionCode: credit.sectionCode,
      formFieldCode: formField,
      basisOrDetails: credit.ratePercent
        ? `בסיס מוכר: ₪${credit.baseAmount.toLocaleString('he-IL')} (${credit.ratePercent}%)`
        : `בסיס מוכר: ₪${credit.baseAmount.toLocaleString('he-IL')}`,
      ratePercent: credit.ratePercent,
      creditNIS: credit.creditNIS,
      description: credit.description,
    });
  });

  // 14. SPOUSE CALCULATION & CREDIT OPTIMIZATION (סעיף 45 / 46 ניוד זיכויים בין בני זוג בכפוף למגבלות החוק)
  let spouseResult: CalculationResult | undefined;
  let combinedResult: CalculationResult | undefined;
  let combinedFamilyNominalRefund: number | undefined;
  let combinedFamilyTotalRefund: number | undefined;
  let combinedFamilyNetDifference: number | undefined;
  let isCombinedDebt: boolean | undefined;
  let combinedDebtAmount: number | undefined;
  let spouseCreditOptimization: CalculationResult['spouseCreditOptimization'] = undefined;

  // IMPORTANT: Spouse calculation is STRICTLY restricted to married couples only!
  // If maritalStatus is divorced, single, or widowed, spouse calculation is NEVER performed.
  const isMarried = input.maritalStatus === 'married';

  if (isMarried && input.includeSpouseCalculation && input.spouseData && !isRecursiveSpouseCall) {
    // Calculate spouse result recursively
    const spousePrimaryCalc = calculateTaxRefund(input.spouseData, true);

    // Statutory optimization check between Primary and Spouse:
    // Under Israeli Tax Ordinance (חישוב נפרד לפי סעיף 66):
    // 1. Personal credit points (תושב, אישה, ילדים, תואר וכו') CANNOT be transferred.
    // 2. Section 46 (Donations) can be transferred, SUBJECT TO:
    //    Total donations credited to recipient cannot exceed 30% of recipient's taxable income (סעיף 46(א)).
    // 3. Section 45A (Pension & Life Insurance) can be transferred, SUBJECT TO:
    //    Recipient's remaining statutory ceiling under Section 45A (annual ceiling maxEmployeePensionAnnualCredit e.g. ~₪2,852, plus 5% life insurance ceiling).
    // 4. Total transfer cannot exceed recipient's remaining positive tax liability.

    // Primary surplus analysis:
    const primaryInitialTax = baseTaxBeforeCredits + surtaxAmount;
    const primaryUnusedTotal = Math.max(0, totalGeneralCredits - primaryInitialTax);

    // Only Section 46 (donations) and Section 45A (pension & life insurance) are legally transferable:
    const primaryTransferablePool = Math.min(primaryUnusedTotal, donationCreditNIS + pensionLifeCreditNIS);
    const primaryDonationSurplus = Math.min(primaryTransferablePool, donationCreditNIS);
    const primary45aSurplus = Math.min(primaryTransferablePool - primaryDonationSurplus, pensionLifeCreditNIS);

    // Spouse surplus analysis:
    const spouseInitialTax = spousePrimaryCalc.baseTaxBeforeCredits + spousePrimaryCalc.surtaxAmount;
    const spouseUnusedTotal = Math.max(0, spousePrimaryCalc.totalCreditsNIS - spouseInitialTax);
    const spouseTransferablePool = Math.min(spouseUnusedTotal, spousePrimaryCalc.donationCreditNIS + spousePrimaryCalc.pensionLifeCreditNIS);
    const spouseDonationSurplus = Math.min(spouseTransferablePool, spousePrimaryCalc.donationCreditNIS);
    const spouse45aSurplus = Math.min(spouseTransferablePool - spouseDonationSurplus, spousePrimaryCalc.pensionLifeCreditNIS);

    // Scenario 1: Primary has transferable surplus, Spouse has tax liability > 0
    if (primaryTransferablePool > 10 && spousePrimaryCalc.taxLiabilityFinal > 10) {
      // Check Recipient Spouse's Section 46 limitation: 30% of taxable income
      const spouseTaxable = spousePrimaryCalc.taxableIncome;
      const spouseMaxDonationsCap = Math.round(spouseTaxable * (config.maxDonationPercentage || 0.30));
      const spouseExistingDonations = input.spouseData.donationAmount || 0;
      const spouseRemainingDonationCapacity = Math.max(0, spouseMaxDonationsCap - spouseExistingDonations);
      const allowableDonationCreditTransfer = Math.min(
        primaryDonationSurplus,
        Math.round(spouseRemainingDonationCapacity * 0.35)
      );

      // Check Recipient Spouse's Section 45A limitation: remaining statutory ceiling
      const spouseRemaining45aCapacity = Math.max(
        0,
        config.maxEmployeePensionAnnualCredit - spousePrimaryCalc.pensionLifeCreditNIS
      );
      const allowable45aCreditTransfer = Math.min(primary45aSurplus, spouseRemaining45aCapacity);

      // Total transferable under statutory limitations
      const totalStatutoryTransfer = allowableDonationCreditTransfer + allowable45aCreditTransfer;
      const transferAmount = Math.min(totalStatutoryTransfer, spousePrimaryCalc.taxLiabilityFinal);

      if (transferAmount > 10) {
        const newSpouseTaxLiability = Math.max(0, spousePrimaryCalc.taxLiabilityFinal - transferAmount);
        const newSpouseNetDiff = Math.round(spousePrimaryCalc.taxAlreadyPaid - newSpouseTaxLiability);
        const newSpouseNominal = newSpouseNetDiff > 0 ? newSpouseNetDiff : 0;
        const newSpouseInterest = newSpouseNominal > 0 ? Math.round(newSpouseNominal * interestFactor) : 0;
        const newSpouseFinalRefund = newSpouseNominal > 0 ? newSpouseNominal + newSpouseInterest : newSpouseNetDiff;

        // Also add the transferred credit to spouse's unifiedCreditsList!
        const transferredCreditRow: UnifiedCreditRow = {
          id: 'spousal-transfer-opt',
          category: 'spousal_transfer',
          label: `מיטוב זיכויים בין בני זוג - הועבר מ${input.employeeName || 'בן זוג א׳'}`,
          sectionCode: 'סעיפים 45א / 46',
          formFieldCode: 'מיטוב שומה',
          basisOrDetails: `העברת עודף זיכוי מוכר בכפוף לתקרת 30% מהכנסה חייבת (סעיף 46) ותקרת סעיף 45א`,
          creditNIS: transferAmount,
          description: `הועבר עודף זיכוי מוכר מתרומות (סעיף 46) או קופת גמל (סעיף 45א) שלא נוצל אצל בן/בת הזוג, בכפוף לתקרות החוקיות.`,
        };

        spouseResult = {
          ...spousePrimaryCalc,
          taxLiabilityFinal: newSpouseTaxLiability,
          netDifference: newSpouseNetDiff,
          nominalRefund: newSpouseNominal,
          interestAndLinkageBenefit: newSpouseInterest,
          finalRefundWithInterest: newSpouseFinalRefund,
          unifiedCreditsList: [...spousePrimaryCalc.unifiedCreditsList, transferredCreditRow],
        };

        spouseCreditOptimization = {
          applied: true,
          transferredCreditAmount: transferAmount,
          fromSpouseName: input.employeeName || 'בן זוג א׳',
          toSpouseName: input.spouseData.employeeName || 'בן/בת זוג ב׳',
          creditType: 'סעיף 46 (תרומות עד 30% מהכנסה) וסעיף 45א (קופת גמל עד תקרת הזיכוי)',
          explanation: `בוצע מיטוב זיכויים משפחתי כחוק: הועבר עודף זיכוי מס בסך ₪${transferAmount.toLocaleString('he-IL')} מ${input.employeeName || 'בן זוג א׳'} ל${input.spouseData.employeeName || 'בן/בת זוג ב׳'}. הניוד נבדק ואושר בכפוף למגבלת סעיף 46 (תקרת 30% מההכנסה החייבת) ולתקרת הזיכוי המרבי לפי סעיף 45א. הזיכוי מנע אובדן הטבת מס והגדיל ישירות את החזר המס המשפחתי!`,
        };
      } else {
        spouseResult = spousePrimaryCalc;
      }
    }
    // Scenario 2: Spouse has transferable surplus, Primary has tax liability > 0
    else if (spouseTransferablePool > 10 && taxLiabilityFinal > 10) {
      // Check Recipient Primary's Section 46 limitation: 30% of taxable income
      const primaryMaxDonationsCap = Math.round(taxableIncome * (config.maxDonationPercentage || 0.30));
      const primaryExistingDonations = input.donationAmount || 0;
      const primaryRemainingDonationCapacity = Math.max(0, primaryMaxDonationsCap - primaryExistingDonations);
      const allowableDonationCreditTransfer = Math.min(
        spouseDonationSurplus,
        Math.round(primaryRemainingDonationCapacity * 0.35)
      );

      // Check Recipient Primary's Section 45A limitation: remaining statutory ceiling
      const primaryRemaining45aCapacity = Math.max(
        0,
        config.maxEmployeePensionAnnualCredit - pensionLifeCreditNIS
      );
      const allowable45aCreditTransfer = Math.min(spouse45aSurplus, primaryRemaining45aCapacity);

      const totalStatutoryTransfer = allowableDonationCreditTransfer + allowable45aCreditTransfer;
      const transferAmount = Math.min(totalStatutoryTransfer, taxLiabilityFinal);

      if (transferAmount > 10) {
        taxLiabilityFinal = Math.max(0, taxLiabilityFinal - transferAmount);
        netDifference = Math.round(taxAlreadyPaid - taxLiabilityFinal);
        nominalRefund = netDifference > 0 ? netDifference : 0;
        interestAndLinkageBenefit = netDifference > 0 ? Math.round(nominalRefund * interestFactor) : 0;
        finalRefundWithInterest = netDifference > 0 ? nominalRefund + interestAndLinkageBenefit : netDifference;

        unifiedCreditsList.push({
          id: 'spousal-transfer-opt',
          category: 'spousal_transfer',
          label: `מיטוב זיכויים בין בני זוג - הועבר מ${input.spouseData.employeeName || 'בן/בת זוג ב׳'}`,
          sectionCode: 'סעיפים 45א / 46',
          formFieldCode: 'מיטוב שומה',
          basisOrDetails: `העברת עודף זיכוי מוכר בכפוף לתקרת 30% מהכנסה חייבת (סעיף 46) ותקרת סעיף 45א`,
          creditNIS: transferAmount,
          description: `הועבר עודף זיכוי מוכר מתרומות (סעיף 46) או קופת גמל (סעיף 45א) שלא נוצל אצל בן/בת הזוג, בכפוף לתקרות החוקיות.`,
        });

        spouseResult = spousePrimaryCalc;

        spouseCreditOptimization = {
          applied: true,
          transferredCreditAmount: transferAmount,
          fromSpouseName: input.spouseData.employeeName || 'בן/בת זוג ב׳',
          toSpouseName: input.employeeName || 'בן זוג א׳',
          creditType: 'סעיף 46 (תרומות עד 30% מהכנסה) וסעיף 45א (קופת גמל עד תקרת הזיכוי)',
          explanation: `בוצע מיטוב זיכויים משפחתי כחוק: הועבר עודף זיכוי בסך ₪${transferAmount.toLocaleString('he-IL')} מ${input.spouseData.employeeName || 'בן/בת זוג ב׳'} ל${input.employeeName || 'בן זוג א׳'}. הניוד נבדק ואושר בכפוף למגבלת סעיף 46 (30% מההכנסה החייבת) ולתקרת הפקדה מזכה לפי סעיף 45א, והגדיל ישירות את ההחזר המשפחתי!`,
        };
      } else {
        spouseResult = spousePrimaryCalc;
      }
    } else {
      spouseResult = spousePrimaryCalc;
    }

    if (spouseResult) {
      // Joint filing calculation for Israeli Tax Authority (שומה משותפת לתיק משפחתי):
      // In Israeli tax law, joint assessment nets the mutual refund and debt between spouses.
      const primaryPaid = taxAlreadyPaid;
      const primaryTax = taxLiabilityFinal;
      const spousePaid = spouseResult.taxAlreadyPaid;
      const spouseTax = spouseResult.taxLiabilityFinal;

      const combinedTaxAlreadyPaid = primaryPaid + spousePaid;
      const combinedTaxLiabilityFinal = primaryTax + spouseTax;
      combinedFamilyNetDifference = combinedTaxAlreadyPaid - combinedTaxLiabilityFinal;

      if (combinedFamilyNetDifference > 0) {
        // Net positive difference is a refund
        combinedFamilyNominalRefund = combinedFamilyNetDifference;
        const combinedFamilyInterest = Math.round(combinedFamilyNominalRefund * interestFactor);
        combinedFamilyTotalRefund = combinedFamilyNominalRefund + combinedFamilyInterest;
        isCombinedDebt = false;
        combinedDebtAmount = 0;
      } else if (combinedFamilyNetDifference < 0) {
        // Net negative difference is a DEBT to the Tax Authority
        combinedFamilyNominalRefund = 0;
        combinedFamilyTotalRefund = combinedFamilyNetDifference; // Negative number for explicit arithmetic
        isCombinedDebt = true;
        combinedDebtAmount = Math.abs(combinedFamilyNetDifference);
      } else {
        combinedFamilyNominalRefund = 0;
        combinedFamilyTotalRefund = 0;
        isCombinedDebt = false;
        combinedDebtAmount = 0;
      }

      // Synthesize a full combined CalculationResult object representing the joint household file
      const primaryName = input.employeeName || 'בן זוג א׳';
      const spouseName = input.spouseData.employeeName || 'בן/בת זוג ב׳';

      combinedResult = {
        taxYear: input.taxYear,
        totalIncome: totalIncome + spouseResult.totalIncome,
        deductionsTotalNIS: deductionsTotalNIS + spouseResult.deductionsTotalNIS,
        medicalExemptionDeductionNIS: (medicalExemptionDeductionNIS || 0) + (spouseResult.medicalExemptionDeductionNIS || 0),
        taxableIncome: taxableIncome + spouseResult.taxableIncome,
        regularTaxableIncome: regularTaxableIncome + spouseResult.regularTaxableIncome,
        regularTaxAmount: regularTaxAmount + spouseResult.regularTaxAmount,
        capitalGainsTaxable: (capitalGainsTaxable || 0) + (spouseResult.capitalGainsTaxable || 0),
        capitalGainsTaxAmount: (capitalGainsTaxAmount || 0) + (spouseResult.capitalGainsTaxAmount || 0),
        totalGrossTaxBeforeCredits: totalGrossTaxBeforeCredits + spouseResult.totalGrossTaxBeforeCredits,
        creditsOffsetRegularTaxNIS: (creditsOffsetRegularTaxNIS || 0) + (spouseResult.creditsOffsetRegularTaxNIS || 0),
        creditsOffsetCapitalGainsNIS: (creditsOffsetCapitalGainsNIS || 0) + (spouseResult.creditsOffsetCapitalGainsNIS || 0),
        baseTaxBeforeCredits: Math.round(baseTaxBeforeCredits + spouseResult.baseTaxBeforeCredits),
        bracketsBreakdown: [
          ...bracketsBreakdown.map(b => ({ ...b, bracketLabel: `(${primaryName}) ${b.bracketLabel}` })),
          ...spouseResult.bracketsBreakdown.map(b => ({ ...b, bracketLabel: `(${spouseName}) ${b.bracketLabel}` })),
        ],
        surtaxAmount: Math.round(surtaxAmount + spouseResult.surtaxAmount),
        creditPointsTotal: Number((creditPointsTotal + spouseResult.creditPointsTotal).toFixed(2)),
        creditPointsBreakdown: [
          ...creditPointsBreakdown.map(c => ({ ...c, label: `(${primaryName}) ${c.label}` })),
          ...spouseResult.creditPointsBreakdown.map(c => ({ ...c, label: `(${spouseName}) ${c.label}` })),
        ],
        creditPointsValueNIS: creditPointsValueNIS + spouseResult.creditPointsValueNIS,
        settlementCreditNIS: settlementCreditNIS + spouseResult.settlementCreditNIS,
        donationCreditNIS: donationCreditNIS + spouseResult.donationCreditNIS,
        pensionLifeCreditNIS: pensionLifeCreditNIS + spouseResult.pensionLifeCreditNIS,
        nursingInstitutionCreditNIS: nursingInstitutionCreditNIS + spouseResult.nursingInstitutionCreditNIS,
        capitalLossOffsetCreditNIS: 0,
        totalCreditsNIS: Math.round(totalGeneralCredits + spouseResult.totalCreditsNIS),
        directTaxCreditsBreakdown: [
          ...directTaxCreditsBreakdown.map(d => ({ ...d, label: `(${primaryName}) ${d.label}` })),
          ...spouseResult.directTaxCreditsBreakdown.map(d => ({ ...d, label: `(${spouseName}) ${d.label}` })),
        ],
        directTaxCreditsTotalNIS: directTaxCreditsTotalNIS + spouseResult.directTaxCreditsTotalNIS,
        unifiedCreditsList: [
          ...unifiedCreditsList.map(u => ({ ...u, label: `(${primaryName}) ${u.label}` })),
          ...spouseResult.unifiedCreditsList.map(u => ({ ...u, label: `(${spouseName}) ${u.label}` })),
        ],
        taxLiabilityFinal: combinedTaxLiabilityFinal,
        taxAlreadyPaid: combinedTaxAlreadyPaid,
        netDifference: combinedFamilyNetDifference,
        nominalRefund: combinedFamilyNominalRefund,
        interestAndLinkageBenefit: combinedFamilyNetDifference > 0 ? Math.round(combinedFamilyNominalRefund * interestFactor) : 0,
        finalRefundWithInterest: combinedFamilyTotalRefund,
        employerCount: employerCount + spouseResult.employerCount,
        missedTaxCoordinationDetected: missedTaxCoordinationDetected || spouseResult.missedTaxCoordinationDetected,
        keyRefundFactors: [
          ...keyRefundFactors.map(k => ({ ...k, title: `(${primaryName}) ${k.title}` })),
          ...spouseResult.keyRefundFactors.map(k => ({ ...k, title: `(${spouseName}) ${k.title}` })),
        ],
        recommendations: [
          `שומת מס הכנסה משותפת לשני בני הזוג לשנת ${input.taxYear} (תיק משותף / דוח 135).`,
          combinedFamilyNetDifference > 0
            ? `סך החזר המס המשותף להפקדה בחשבון עומד על ₪${combinedFamilyTotalRefund.toLocaleString('he-IL')} (כולל ריבית והצמדה).`
            : combinedFamilyNetDifference < 0
            ? `לתשומת ליבך: לאחר קיזוז הדדי בין שני בני הזוג, קיימת יתרת חוב מס לתשלום בסך ₪${Math.abs(combinedFamilyNetDifference).toLocaleString('he-IL')}.`
            : 'אין יתרת חוב או החזר בתיק המשפחתי המשותף.',
          'ברשות המסים דוח זוגי נבדק כיחידה אחת – זכויותיו וחובותיו של בן זוג אחד מתקזזות ישירות עם בן הזוג השני.'
        ],
        combinedFamilyNominalRefund,
        combinedFamilyTotalRefund,
        combinedFamilyNetDifference,
        isCombinedDebt,
        combinedDebtAmount,
      };
    }
  }

  return {
    taxYear: input.taxYear,
    totalIncome,
    deductionsTotalNIS,
    medicalExemptionDeductionNIS,
    taxableIncome,
    regularTaxableIncome,
    regularTaxAmount,
    capitalGainsTaxable,
    capitalGainsTaxAmount,
    totalGrossTaxBeforeCredits,
    creditsOffsetRegularTaxNIS,
    creditsOffsetCapitalGainsNIS,
    baseTaxBeforeCredits: Math.round(baseTaxBeforeCredits),
    bracketsBreakdown,
    surtaxAmount: Math.round(surtaxAmount),
    creditPointsTotal: Number(creditPointsTotal.toFixed(2)),
    creditPointsBreakdown,
    creditPointsValueNIS,
    settlementCreditNIS,
    donationCreditNIS,
    pensionLifeCreditNIS,
    nursingInstitutionCreditNIS,
    capitalLossOffsetCreditNIS: 0,
    totalCreditsNIS: Math.round(totalGeneralCredits),
    directTaxCreditsBreakdown,
    directTaxCreditsTotalNIS,
    unifiedCreditsList,
    taxLiabilityFinal,
    taxAlreadyPaid,
    netDifference,
    nominalRefund,
    interestAndLinkageBenefit,
    finalRefundWithInterest,
    employerCount,
    missedTaxCoordinationDetected,
    keyRefundFactors,
    recommendations,
    spouseResult,
    combinedResult,
    combinedFamilyNominalRefund,
    combinedFamilyTotalRefund,
    combinedFamilyNetDifference,
    isCombinedDebt,
    combinedDebtAmount,
    spouseCreditOptimization,
  };
}
