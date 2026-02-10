export type TierKey = "tier_750" | "tier_700" | "tier_650" | "tier_600";

export type TierInfo = {
  key: TierKey;
  unitPrice: number;
  priceId: string;
};

export function getTierForAgentCount(agents: number): TierInfo {
  if (!Number.isInteger(agents) || agents < 1 || agents > 30) {
    throw new Error("Agents must be an integer between 1 and 30.");
  }

  const priceId750 = process.env.PRICE_ID_TIER_750;
  const priceId700 = process.env.PRICE_ID_TIER_700;
  const priceId650 = process.env.PRICE_ID_TIER_650;
  const priceId600 = process.env.PRICE_ID_TIER_600;

  if (!priceId750 || !priceId700 || !priceId650 || !priceId600) {
    throw new Error("Missing one or more Stripe tier price IDs.");
  }

  if (agents <= 4) {
    return { key: "tier_750", unitPrice: 750, priceId: priceId750 };
  }

  if (agents <= 10) {
    return { key: "tier_700", unitPrice: 700, priceId: priceId700 };
  }

  if (agents <= 20) {
    return { key: "tier_650", unitPrice: 650, priceId: priceId650 };
  }

  return { key: "tier_600", unitPrice: 600, priceId: priceId600 };
}
