export type PlanCode = "linkedin_scale" | "multichannel_scale";

export type PlanPricingInfo = {
  plan: PlanCode;
  basePriceId: string;
  additionalPriceId: string;
  baseIncludedAgents: number;
  additionalAgents: number;
  monthlyDisplayTotal: number;
};

const MIN_AGENTS = 2;
const MAX_AGENTS = 30;
const BASE_INCLUDED_AGENTS = 2;

type PlanAmounts = {
  baseAmount: number;
  additionalAmount: number;
};

const PLAN_AMOUNTS: Record<PlanCode, PlanAmounts> = {
  linkedin_scale: {
    baseAmount: 750,
    additionalAmount: 300
  },
  multichannel_scale: {
    baseAmount: 1350,
    additionalAmount: 550
  }
};

export function isPlanCode(value: unknown): value is PlanCode {
  return value === "linkedin_scale" || value === "multichannel_scale";
}

export function getPlanPricing(plan: PlanCode, agents: number): PlanPricingInfo {
  if (!Number.isInteger(agents) || agents < MIN_AGENTS || agents > MAX_AGENTS) {
    throw new Error(`Agents must be an integer between ${MIN_AGENTS} and ${MAX_AGENTS}.`);
  }

  const linkedinBase = process.env.PRICE_ID_LINKEDIN_BASE_2;
  const linkedinAdditional = process.env.PRICE_ID_LINKEDIN_ADDL_AGENT;
  const multichannelBase = process.env.PRICE_ID_MULTICHANNEL_BASE_2;
  const multichannelAdditional = process.env.PRICE_ID_MULTICHANNEL_ADDL_AGENT;

  if (!linkedinBase || !linkedinAdditional || !multichannelBase || !multichannelAdditional) {
    throw new Error("Missing one or more Stripe plan price IDs.");
  }

  const additionalAgents = Math.max(agents - BASE_INCLUDED_AGENTS, 0);
  const planAmounts = PLAN_AMOUNTS[plan];

  if (plan === "linkedin_scale") {
    return {
      plan,
      basePriceId: linkedinBase,
      additionalPriceId: linkedinAdditional,
      baseIncludedAgents: BASE_INCLUDED_AGENTS,
      additionalAgents,
      monthlyDisplayTotal: planAmounts.baseAmount + additionalAgents * planAmounts.additionalAmount
    };
  }

  return {
    plan,
    basePriceId: multichannelBase,
    additionalPriceId: multichannelAdditional,
    baseIncludedAgents: BASE_INCLUDED_AGENTS,
    additionalAgents,
    monthlyDisplayTotal: planAmounts.baseAmount + additionalAgents * planAmounts.additionalAmount
  };
}
