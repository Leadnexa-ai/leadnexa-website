import { createServerSupabase } from "./supabase-admin";

type PendingSignupRow = {
  id: string;
  email: string;
  password_hash: string;
  company_name: string | null;
  status: "pending" | "activated" | "expired";
  client_id: string | null;
};

function fallbackClientName(email: string): string {
  const prefix = email.split("@")[0]?.trim();
  return prefix && prefix.length > 0 ? prefix : "New Client";
}

export async function getPendingSignupById(id: string): Promise<PendingSignupRow | null> {
  const supabase = createServerSupabase();
  const result = await supabase
    .from("pending_signups")
    .select("id, email, password_hash, company_name, status, client_id")
    .eq("id", id)
    .maybeSingle();

  if (result.error) {
    throw new Error(`Failed to load pending signup: ${result.error.message}`);
  }

  return (result.data as PendingSignupRow | null) ?? null;
}

export async function activatePendingSignupFromCheckout(input: {
  pendingSignupId: string;
  checkoutSessionId: string;
  customerName?: string;
  customerEmail?: string;
}): Promise<{ clientId: string; email: string }> {
  const supabase = createServerSupabase();
  const pending = await getPendingSignupById(input.pendingSignupId);

  if (!pending) {
    throw new Error("Pending signup not found.");
  }

  if (pending.status === "activated" && pending.client_id) {
    return { clientId: pending.client_id, email: pending.email };
  }

  if (pending.status !== "pending") {
    throw new Error(`Pending signup is not active (status: ${pending.status}).`);
  }

  const clientName =
    pending.company_name?.trim() ||
    input.customerName?.trim() ||
    input.customerEmail?.trim() ||
    fallbackClientName(pending.email);

  const createdClient = await supabase
    .from("clients")
    .insert({ name: clientName, status: "active" })
    .select("id")
    .single();

  if (createdClient.error || !createdClient.data?.id) {
    throw new Error(`Failed to create client from pending signup: ${createdClient.error?.message ?? "unknown error"}`);
  }

  const clientId = createdClient.data.id;
  const appUserInsert = await supabase.from("app_users").insert({
    client_id: clientId,
    email: pending.email,
    password_hash: pending.password_hash,
    role: "admin",
    is_active: true
  });

  if (appUserInsert.error) {
    if (appUserInsert.error.code === "23505") {
      const existingUser = await supabase
        .from("app_users")
        .select("client_id")
        .eq("email", pending.email)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingUser.error || !existingUser.data?.client_id) {
        await supabase.from("clients").delete().eq("id", clientId);
        throw new Error(
          `Failed to resolve app user conflict during activation: ${existingUser.error?.message ?? "missing existing user"}`
        );
      }

      await supabase.from("clients").delete().eq("id", clientId);
      const existingClientId = existingUser.data.client_id;
      const updateOnConflict = await supabase
        .from("pending_signups")
        .update({
          status: "activated",
          client_id: existingClientId,
          stripe_checkout_session_id: input.checkoutSessionId,
          activated_at: new Date().toISOString()
        })
        .eq("id", pending.id)
        .select("id")
        .maybeSingle();

      if (updateOnConflict.error) {
        throw new Error(
          `Failed to finalize pending signup after app user conflict: ${updateOnConflict.error.message}`
        );
      }

      return { clientId: existingClientId, email: pending.email };
    }

    await supabase.from("clients").delete().eq("id", clientId);
    throw new Error(`Failed to create app user from pending signup: ${appUserInsert.error.message}`);
  }

  const activated = await supabase
    .from("pending_signups")
    .update({
      status: "activated",
      client_id: clientId,
      stripe_checkout_session_id: input.checkoutSessionId,
      activated_at: new Date().toISOString()
    })
    .eq("id", pending.id)
    .select("id")
    .maybeSingle();

  if (activated.error) {
    throw new Error(`Failed to activate pending signup: ${activated.error.message}`);
  }

  return { clientId, email: pending.email };
}
