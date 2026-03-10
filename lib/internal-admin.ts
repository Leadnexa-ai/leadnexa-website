import bcrypt from "bcryptjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabase } from "./supabase-admin";

type AnySupabase = SupabaseClient<any, "public", any>;

type InternalAdminUserRow = {
  id: string;
  email: string;
  full_name: string | null;
  password_hash: string;
  is_active: boolean;
  can_access_all_clients: boolean;
  created_at: string;
};

type ClientRow = {
  id: string;
  name: string;
  status: string;
  heyreach_workspace_id: string | null;
  instantly_workspace_id: string | null;
  created_at: string;
};

type AppUserRow = {
  id: string;
  client_id: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

type SubscriptionRow = {
  client_id: string;
  status: string;
  created_at: string;
};

export type AccessibleSupportClient = {
  clientId: string;
  clientName: string;
  clientStatus: string;
  heyreachWorkspaceId: string | null;
  instantlyWorkspaceId: string | null;
  hasWorkspace: boolean;
  hasActiveSubscription: boolean;
  appUserCount: number;
};

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

function getSupabase(input?: AnySupabase): AnySupabase {
  return input ?? createServerSupabase();
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export async function authenticateInternalAdmin(input: {
  supabase?: AnySupabase;
  email: string;
  password: string;
}): Promise<InternalAdminUserRow | null> {
  const supabase = getSupabase(input.supabase);
  const email = normalizeEmail(input.email);

  const lookup = await supabase
    .from("internal_admin_users")
    .select("id, email, full_name, password_hash, is_active, can_access_all_clients, created_at")
    .ilike("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookup.error) {
    throw new Error(`Failed to lookup internal admin: ${lookup.error.message}`);
  }

  const admin = lookup.data as InternalAdminUserRow | null;
  if (!admin?.id || !admin.is_active) {
    return null;
  }

  const isMatch = await bcrypt.compare(input.password, admin.password_hash);
  if (!isMatch) {
    return null;
  }

  return admin;
}

export async function getInternalAdminById(input: {
  supabase?: AnySupabase;
  internalAdminUserId: string;
}): Promise<InternalAdminUserRow | null> {
  const supabase = getSupabase(input.supabase);
  const lookup = await supabase
    .from("internal_admin_users")
    .select("id, email, full_name, password_hash, is_active, can_access_all_clients, created_at")
    .eq("id", input.internalAdminUserId)
    .maybeSingle();

  if (lookup.error) {
    throw new Error(`Failed to load internal admin: ${lookup.error.message}`);
  }

  return (lookup.data as InternalAdminUserRow | null) ?? null;
}

async function getClientIdsForInternalAdmin(input: {
  supabase?: AnySupabase;
  internalAdminUserId: string;
}): Promise<string[]> {
  const supabase = getSupabase(input.supabase);
  const admin = await getInternalAdminById({
    supabase,
    internalAdminUserId: input.internalAdminUserId
  });

  if (!admin?.id || !admin.is_active) {
    throw new Error("Internal admin account is inactive or missing.");
  }

  if (admin.can_access_all_clients) {
    const clients = await supabase
      .from("clients")
      .select("id")
      .order("name", { ascending: true });

    if (clients.error) {
      throw new Error(`Failed to load clients: ${clients.error.message}`);
    }

    return (clients.data ?? []).map((row) => String(row.id));
  }

  const accessRows = await supabase
    .from("internal_admin_client_access")
    .select("client_id")
    .eq("internal_admin_user_id", input.internalAdminUserId);

  if (accessRows.error) {
    throw new Error(`Failed to load internal admin client access: ${accessRows.error.message}`);
  }

  return (accessRows.data ?? []).map((row) => String(row.client_id));
}

export async function listAccessibleClientsForInternalAdmin(input: {
  supabase?: AnySupabase;
  internalAdminUserId: string;
}): Promise<AccessibleSupportClient[]> {
  const supabase = getSupabase(input.supabase);
  const clientIds = await getClientIdsForInternalAdmin({
    supabase,
    internalAdminUserId: input.internalAdminUserId
  });

  if (clientIds.length === 0) {
    return [];
  }

  const clientsResult = await supabase
    .from("clients")
    .select("id, name, status, heyreach_workspace_id, instantly_workspace_id, created_at")
    .in("id", clientIds)
    .order("name", { ascending: true });

  if (clientsResult.error) {
    throw new Error(`Failed to load accessible clients: ${clientsResult.error.message}`);
  }

  const appUsersResult = await supabase
    .from("app_users")
    .select("id, client_id, email, role, is_active, created_at")
    .in("client_id", clientIds)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (appUsersResult.error) {
    throw new Error(`Failed to load client users: ${appUsersResult.error.message}`);
  }

  const subscriptionsResult = await supabase
    .from("client_subscriptions")
    .select("client_id, status, created_at")
    .in("client_id", clientIds)
    .order("created_at", { ascending: false });

  if (subscriptionsResult.error) {
    throw new Error(`Failed to load client subscriptions: ${subscriptionsResult.error.message}`);
  }

  const appUsers = (appUsersResult.data ?? []) as AppUserRow[];
  const subscriptions = (subscriptionsResult.data ?? []) as SubscriptionRow[];
  const clients = (clientsResult.data ?? []) as ClientRow[];

  return clients.map((client) => {
    const userCount = appUsers.filter((user) => user.client_id === client.id).length;
    const latestSubscription = subscriptions.find((row) => row.client_id === client.id) ?? null;

    return {
      clientId: client.id,
      clientName: client.name,
      clientStatus: client.status,
      heyreachWorkspaceId: client.heyreach_workspace_id,
      instantlyWorkspaceId: client.instantly_workspace_id,
      hasWorkspace: Boolean(client.heyreach_workspace_id || client.instantly_workspace_id),
      hasActiveSubscription: latestSubscription
        ? ACTIVE_SUBSCRIPTION_STATUSES.has(latestSubscription.status)
        : false,
      appUserCount: userCount
    };
  });
}

export async function assertInternalAdminCanAccessClient(input: {
  supabase?: AnySupabase;
  internalAdminUserId: string;
  clientId: string;
}): Promise<void> {
  const clientIds = await getClientIdsForInternalAdmin(input);
  if (!clientIds.includes(input.clientId)) {
    throw new Error("You do not have access to this client portal.");
  }
}

export async function chooseImpersonationTargetAppUser(input: {
  supabase?: AnySupabase;
  clientId: string;
}): Promise<AppUserRow | null> {
  const supabase = getSupabase(input.supabase);
  const result = await supabase
    .from("app_users")
    .select("id, client_id, email, role, is_active, created_at")
    .eq("client_id", input.clientId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (result.error) {
    throw new Error(`Failed to load target app user: ${result.error.message}`);
  }

  const rows = (result.data ?? []) as AppUserRow[];
  if (rows.length === 0) {
    return null;
  }

  return rows.find((row) => row.role === "admin") ?? rows[0];
}

export async function logInternalAdminImpersonation(input: {
  supabase?: AnySupabase;
  internalAdminUserId: string;
  clientId: string;
  appUserId: string;
  destinationPath: string;
}): Promise<void> {
  const supabase = getSupabase(input.supabase);
  const result = await supabase.from("internal_admin_impersonation_logs").insert({
    internal_admin_user_id: input.internalAdminUserId,
    client_id: input.clientId,
    app_user_id: input.appUserId,
    destination_path: input.destinationPath
  });

  if (result.error) {
    throw new Error(`Failed to write internal admin audit log: ${result.error.message}`);
  }
}
