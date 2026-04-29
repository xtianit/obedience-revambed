import { createClient } from "@supabase/supabase-js";

// ─── Replace these with your actual Supabase project values ───────────────────
// Found at: https://app.supabase.com → Project → Settings → API
const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Database Types ───────────────────────────────────────────────────────────

export interface Profile {
    id:           string;
    email:        string;
    full_name:    string | null;
    avatar_url:   string | null;
    role:         "user" | "admin";
    created_at:   string;
}

export interface Subscription {
    id:                          string;
    user_id:                     string;
    paystack_reference:          string;
    paystack_customer_code:      string | null;
    paystack_subscription_code:  string | null;
    status:                      "active" | "expired" | "cancelled";
    plan:                        "monthly";
    amount:                      number;           // in kobo
    start_date:                  string;
    end_date:                    string;
    created_at:                  string;
    updated_at:                  string;
    // joined field from profiles (admin queries)
    profiles?:                   Profile;
}

export interface SubscriptionWithProfile extends Subscription {
    profiles: Profile;
}

// ─── Auth Helpers ─────────────────────────────────────────────────────────────

export const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
        provider: "google",
        options:  { redirectTo: window.location.origin },
    });

export const signOut = () => supabase.auth.signOut();

// ─── Profile Helpers ──────────────────────────────────────────────────────────

export const getProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
    if (error) { console.error("getProfile:", error); return null; }
    return data as Profile;
};

export const getAllProfiles = async (): Promise<Profile[]> => {
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
    if (error) { console.error("getAllProfiles:", error); return []; }
    return (data as Profile[]) || [];
};

export const updateProfileRole = async (
    userId: string,
    role: "user" | "admin"
): Promise<boolean> => {
    const { error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", userId);
    if (error) { console.error("updateProfileRole:", error); return false; }
    return true;
};

// ─── Subscription Helpers ─────────────────────────────────────────────────────

export const getActiveSubscription = async (
    userId: string
): Promise<Subscription | null> => {
    const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .gt("end_date", new Date().toISOString())
        .order("end_date", { ascending: false })
        .limit(1)
        .single();
    if (error) return null;
    return data as Subscription;
};

export const createSubscription = async (params: {
    userId:         string;
    reference:      string;
    customerCode?:  string;
    subscriptionCode?: string;
    amount:         number;
}): Promise<Subscription | null> => {
    const now      = new Date();
    const endDate  = new Date(now);
    endDate.setDate(endDate.getDate() + 30); // 30-day subscription

    const { data, error } = await supabase
        .from("subscriptions")
        .insert({
            user_id:                    params.userId,
            paystack_reference:         params.reference,
            paystack_customer_code:     params.customerCode     || null,
            paystack_subscription_code: params.subscriptionCode || null,
            status:                     "active",
            plan:                       "monthly",
            amount:                     params.amount,
            start_date:                 now.toISOString(),
            end_date:                   endDate.toISOString(),
            updated_at:                 now.toISOString(),
        })
        .select()
        .single();

    if (error) { console.error("createSubscription:", error); return null; }
    return data as Subscription;
};

export const getAllSubscriptions = async (): Promise<SubscriptionWithProfile[]> => {
    const { data, error } = await supabase
        .from("subscriptions")
        .select("*, profiles(*)")
        .order("created_at", { ascending: false });
    if (error) { console.error("getAllSubscriptions:", error); return []; }
    return (data as SubscriptionWithProfile[]) || [];
};

export const updateSubscriptionStatus = async (
    subId:  string,
    status: "active" | "expired" | "cancelled",
    extraDays?: number
): Promise<boolean> => {
    const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (status === "active" && extraDays) {
        const end = new Date();
        end.setDate(end.getDate() + extraDays);
        updates.end_date  = end.toISOString();
        updates.start_date = new Date().toISOString();
    }
    const { error } = await supabase
        .from("subscriptions")
        .update(updates)
        .eq("id", subId);
    if (error) { console.error("updateSubscriptionStatus:", error); return false; }
    return true;
};

export const getSubscriptionStats = async () => {
    const { data, error } = await supabase
        .from("subscriptions")
        .select("status, amount, created_at");
    if (error) return { total: 0, active: 0, expired: 0, revenue: 0 };

    const subs   = data || [];
    const active = subs.filter((s) => s.status === "active").length;
    const revenue = subs
        .filter((s) => s.status === "active")
        .reduce((sum, s) => sum + (s.amount || 0), 0);

    return { total: subs.length, active, expired: subs.length - active, revenue };
};