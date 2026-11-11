export type LoanKind = "housing" | "car" | "personal";
export type InterestMethod = "reducing" | "flat";

export interface LoanInput {
  kind: LoanKind;
  assetPrice: number;
  downpaymentAmount: number;
  annualRate: number;
  tenureYears: number;
  method: InterestMethod;
}

export interface LoanResult {
  principal: number;
  downpayment: number;
  monthlyInstallment: number;
  totalInterest: number;
  totalPayment: number;
  months: number;
  effectiveAnnualRate: number;
}

export interface DsrAssessment {
  dsrPercent: number;
  newTotalCommitments: number;
  status: "Healthy" | "Moderate" | "High" | "Over Limit";
}

export const MALAYSIA_LOAN_DEFAULTS: Record<
  LoanKind,
  {
    label: string;
    subtitle: string;
    assetLabel: string;
    defaultPrice: number;
    defaultDownpaymentPct: number;
    defaultRate: number;
    defaultTenure: number;
    maxTenure: number;
    defaultMethod: InterestMethod;
    ruleNote: string;
  }
> = {
  housing: {
    label: "Housing Loan",
    subtitle: "Reducing Balance · Max 35 yrs (BNM)",
    assetLabel: "Property Price",
    defaultPrice: 450000,
    defaultDownpaymentPct: 10,
    defaultRate: 4.15,
    defaultTenure: 35,
    maxTenure: 35,
    defaultMethod: "reducing",
    ruleNote:
      "Malaysian mortgages use monthly reducing balance interest. BNM caps tenure at 35 years (or age 70).",
  },
  car: {
    label: "Car Loan (Hire Purchase)",
    subtitle: "Flat Rate · Max 9 yrs (HP Act)",
    assetLabel: "Car On-The-Road Price",
    defaultPrice: 90000,
    defaultDownpaymentPct: 10,
    defaultRate: 2.85,
    defaultTenure: 9,
    maxTenure: 9,
    defaultMethod: "flat",
    ruleNote:
      "Malaysian Hire Purchase car loans use a flat annual rate on the full loan amount for up to 9 years.",
  },
  personal: {
    label: "Personal Loan",
    subtitle: "Flat / Reducing · Max 10 yrs (BNM)",
    assetLabel: "Loan Amount Needed",
    defaultPrice: 30000,
    defaultDownpaymentPct: 0,
    defaultRate: 6.5,
    defaultTenure: 5,
    maxTenure: 10,
    defaultMethod: "flat",
    ruleNote:
      "Most Malaysian bank/koperasi personal loans quote a flat rate (some digital loans use reducing balance). BNM caps tenure at 10 years.",
  },
};

/**
 * Solves monthly Effective Interest Rate (EIR) for a flat-rate loan using binary search.
 */
function solveFlatLoanEir(
  principal: number,
  monthlyPayment: number,
  months: number
): number {
  if (principal <= 0 || months <= 0 || monthlyPayment * months <= principal) {
    return 0;
  }
  let low = 0;
  let high = 1; // 100% monthly rate upper bound
  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2;
    const factor = Math.pow(1 + mid, months);
    const calcPayment = (principal * mid * factor) / (factor - 1);
    if (calcPayment > monthlyPayment) {
      high = mid;
    } else {
      low = mid;
    }
  }
  return ((low + high) / 2) * 12 * 100;
}

export function calculateMalaysiaLoan(input: LoanInput): LoanResult {
  const assetPrice = Math.max(0, Number(input.assetPrice) || 0);
  const downpayment = Math.min(assetPrice, Math.max(0, Number(input.downpaymentAmount) || 0));
  const principal = Math.max(0, assetPrice - downpayment);
  const annualRate = Math.max(0, Number(input.annualRate) || 0);
  const years = Math.max(1, Number(input.tenureYears) || 1);
  const months = Math.round(years * 12);

  if (principal === 0) {
    return {
      principal: 0,
      downpayment,
      monthlyInstallment: 0,
      totalInterest: 0,
      totalPayment: 0,
      months,
      effectiveAnnualRate: 0,
    };
  }

  if (input.method === "flat") {
    const totalInterest = principal * (annualRate / 100) * years;
    const totalPayment = principal + totalInterest;
    const monthlyInstallment = totalPayment / months;
    const effectiveAnnualRate = solveFlatLoanEir(principal, monthlyInstallment, months);

    return {
      principal,
      downpayment,
      monthlyInstallment,
      totalInterest,
      totalPayment,
      months,
      effectiveAnnualRate,
    };
  }

  // Reducing balance (amortized)
  const monthlyRate = annualRate / 100 / 12;
  let monthlyInstallment = 0;
  if (monthlyRate === 0) {
    monthlyInstallment = principal / months;
  } else {
    const factor = Math.pow(1 + monthlyRate, months);
    monthlyInstallment = (principal * (monthlyRate * factor)) / (factor - 1);
  }
  const totalPayment = monthlyInstallment * months;
  const totalInterest = Math.max(0, totalPayment - principal);

  return {
    principal,
    downpayment,
    monthlyInstallment,
    totalInterest,
    totalPayment,
    months,
    effectiveAnnualRate: annualRate,
  };
}

export function assessMalaysiaDsr(
  monthlyIncome: number,
  existingMonthlyCommitments: number,
  newLoanInstallment: number
): DsrAssessment | null {
  if (monthlyIncome <= 0) return null;
  const newTotalCommitments = Math.max(0, existingMonthlyCommitments) + Math.max(0, newLoanInstallment);
  const dsrPercent = Math.round((newTotalCommitments / monthlyIncome) * 100);

  let status: DsrAssessment["status"] = "Healthy";
  if (dsrPercent > 70) {
    status = "Over Limit";
  } else if (dsrPercent > 60) {
    status = "High";
  } else if (dsrPercent > 40) {
    status = "Moderate";
  }

  return {
    dsrPercent,
    newTotalCommitments,
    status,
  };
}
