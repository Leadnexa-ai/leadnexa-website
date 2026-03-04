import { sendEmail } from "./email-delivery";
import { createServerSupabase } from "./supabase-admin";

type SendPostCheckoutEmailInput = {
  checkoutSessionId: string;
  clientId?: string;
  customerEmail?: string;
  customerName?: string;
};

function getSupportEmail(): string {
  const configured = (process.env.SUPPORT_EMAIL ?? "").trim();
  return configured || "sam@leadnexa.ai";
}

function getTeamNotificationRecipients(): string[] {
  const configured = (process.env.TEAM_PURCHASE_NOTIFICATION_EMAILS ?? "").trim();
  const fallback = [
    "sam@leadnexa.ai"
  ];
  const source = configured ? configured.split(",") : fallback;
  const normalized = source
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);
  return Array.from(new Set(normalized));
}

function formatPeriodEnd(value: string | null): string {
  if (!value) {
    return "your next billing cycle date";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "your next billing cycle date";
  }
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendPostCheckoutConfirmationEmail(
  input: SendPostCheckoutEmailInput
): Promise<void> {
  const supabase = createServerSupabase();
  const subscription = await supabase
    .from("client_subscriptions")
    .select(
      "id, client_id, client_email, agents, currency, current_period_end, purchase_confirmation_sent_at"
    )
    .eq("stripe_checkout_session_id", input.checkoutSessionId)
    .maybeSingle();

  if (subscription.error) {
    throw new Error(`Failed to load subscription for confirmation email: ${subscription.error.message}`);
  }

  const row = subscription.data;
  if (!row?.id) {
    return;
  }

  if (row.purchase_confirmation_sent_at) {
    return;
  }

  const clientId = input.clientId?.trim() || row.client_id;
  const resolvedClient = clientId
    ? await supabase.from("clients").select("name").eq("id", clientId).maybeSingle()
    : null;

  if (resolvedClient?.error) {
    throw new Error(`Failed to load client name for confirmation email: ${resolvedClient.error.message}`);
  }

  let recipient = input.customerEmail?.trim() || row.client_email?.trim() || "";
  if (!recipient && clientId) {
    const fallbackUser = await supabase
      .from("app_users")
      .select("email")
      .eq("client_id", clientId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (fallbackUser.error) {
      throw new Error(`Failed to resolve fallback recipient email: ${fallbackUser.error.message}`);
    }
    recipient = String(fallbackUser.data?.email ?? "").trim();
  }

  const customerRecipient = recipient || "unknown";

  const accountName =
    resolvedClient?.data?.name?.trim() ||
    input.customerName?.trim() ||
    recipient.split("@")[0] ||
    "there";
  const periodEnd = formatPeriodEnd(row.current_period_end ?? null);
  const questionnaireUrl = "https://tally.so/r/xXaGdy";
  const onboardingUrl = "https://cal.com/team/leadnexa/on-boarding-meeting";
  const supportEmail = getSupportEmail();
  const teamRecipients = getTeamNotificationRecipients();

  const subject = "LeadNexa payment confirmed - next steps";
  const html = [
    "<div style=\"font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#0f172a;max-width:620px;\">",
    `<h2 style=\"margin:0 0 12px 0;\">Payment confirmed, ${accountName}</h2>`,
    "<p style=\"margin:0 0 12px 0;\">Thanks for choosing LeadNexa. Your subscription is now active.</p>",
    `<p style=\"margin:0 0 12px 0;\">Plan summary: <strong>${row.agents} agent(s)</strong>, billed in <strong>${String(row.currency ?? "usd").toUpperCase()}</strong>.</p>`,
    `<p style=\"margin:0 0 16px 0;\">Current billing period ends on <strong>${periodEnd}</strong>.</p>`,
    "<p style=\"margin:0 0 8px 0;\"><strong>What happens next:</strong></p>",
    "<ol style=\"margin:0 0 16px 20px;padding:0;\">",
    `<li>Please complete the onboarding questionnaire: <a href=\"${questionnaireUrl}\" style=\"color:#0ea5e9;\">${questionnaireUrl}</a></li>`,
    `<li>Please schedule your onboarding meeting here: <a href=\"${onboardingUrl}\" style=\"color:#0ea5e9;\">${onboardingUrl}</a></li>`,
    "</ol>",
    `<p style=\"margin:0;\">Need help? Reply to this email or contact <a href=\"mailto:${supportEmail}\" style=\"color:#0ea5e9;\">${supportEmail}</a>.</p>`,
    "</div>"
  ].join("");
  const text = [
    `Payment confirmed, ${accountName}.`,
    "",
    "Your LeadNexa subscription is active.",
    `Plan: ${row.agents} agent(s), billed in ${String(row.currency ?? "usd").toUpperCase()}.`,
    `Current billing period ends on ${periodEnd}.`,
    "",
    "Next steps:",
    `1) Please complete the onboarding questionnaire: ${questionnaireUrl}`,
    `2) Please schedule your onboarding meeting: ${onboardingUrl}`,
    "",
    `Support: ${supportEmail}`
  ].join("\n");

  const markConfirmationSent = async () => {
    const markSent = await supabase
      .from("client_subscriptions")
      .update({ purchase_confirmation_sent_at: new Date().toISOString() })
      .eq("id", row.id)
      .is("purchase_confirmation_sent_at", null);

    if (markSent.error) {
      throw new Error(`Failed to mark confirmation email as sent: ${markSent.error.message}`);
    }
  };

  if (recipient) {
    await sendEmail({
      to: recipient,
      subject,
      html,
      text
    });
  }

  // Mark as sent immediately after customer email succeeds (or when no recipient exists)
  // so internal notification failures cannot trigger repeated customer emails on webhook retries.
  await markConfirmationSent();

  if (teamRecipients.length > 0) {
    const internalSubject = `New purchase confirmed - ${accountName}`;
    const internalHtml = [
      "<div style=\"font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#0f172a;max-width:620px;\">",
      "<h2 style=\"margin:0 0 12px 0;\">New LeadNexa purchase confirmed</h2>",
      `<p style=\"margin:0 0 8px 0;\"><strong>Customer:</strong> ${accountName}</p>`,
      `<p style=\"margin:0 0 8px 0;\"><strong>Email:</strong> ${customerRecipient}</p>`,
      `<p style=\"margin:0 0 8px 0;\"><strong>Plan:</strong> ${row.agents} agent(s), ${String(row.currency ?? "usd").toUpperCase()}</p>`,
      `<p style=\"margin:0 0 8px 0;\"><strong>Current period end:</strong> ${periodEnd}</p>`,
      `<p style=\"margin:0 0 8px 0;\"><strong>Client ID:</strong> ${clientId || "unknown"}</p>`,
      `<p style=\"margin:0 0 8px 0;\"><strong>Checkout Session:</strong> ${input.checkoutSessionId}</p>`,
      "<p style=\"margin:0;\">Customer should be asked to book onboarding: <a href=\"https://cal.com/team/leadnexa/on-boarding-meeting\" style=\"color:#0ea5e9;\">https://cal.com/team/leadnexa/on-boarding-meeting</a></p>",
      "</div>"
    ].join("");
    const internalText = [
      "New LeadNexa purchase confirmed.",
      `Customer: ${accountName}`,
      `Email: ${customerRecipient}`,
      `Plan: ${row.agents} agent(s), ${String(row.currency ?? "usd").toUpperCase()}`,
      `Current period end: ${periodEnd}`,
      `Client ID: ${clientId || "unknown"}`,
      `Checkout Session: ${input.checkoutSessionId}`,
      "Onboarding booking link: https://cal.com/team/leadnexa/on-boarding-meeting"
    ].join("\n");

    const failedRecipients: string[] = [];
    const INTERNAL_EMAIL_GAP_MS = 600;
    for (const teamEmail of teamRecipients) {
      try {
        await sendEmail({
          to: teamEmail,
          subject: internalSubject,
          html: internalHtml,
          text: internalText
        });
      } catch {
        failedRecipients.push(teamEmail);
      }
      await sleep(INTERNAL_EMAIL_GAP_MS);
    }

    if (failedRecipients.length > 0) {
      console.error(
        `[post-checkout-email] Internal purchase notifications failed for: ${failedRecipients.join(", ")}`
      );
    }
  }
}
