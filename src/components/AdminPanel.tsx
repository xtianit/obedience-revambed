import { useState, useEffect, useCallback } from "react";
import {
    Users, CreditCard, TrendingUp, ShieldCheck,
    Search, RefreshCw, Crown, UserX, CheckCircle,
    XCircle, Clock, ChevronDown, ChevronUp, BarChart3,
    Calendar, DollarSign, Activity, AlertTriangle,
} from "lucide-react";
import {
    getAllProfiles, getAllSubscriptions, updateSubscriptionStatus,
    updateProfileRole, getSubscriptionStats,
    type Profile, type SubscriptionWithProfile,
} from "../lib/supabase";


// ─── Types ────────────────────────────────────────────────────────────────────
interface UserRow {
    profile:      Profile;
    subscription: SubscriptionWithProfile | null;
    daysLeft:     number;
}

interface Stats {
    total:   number;
    active:  number;
    expired: number;
    revenue: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const daysLeft = (endDate: string): number => {
    const diff = new Date(endDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86_400_000));
};

const fmt = (d: string) => new Date(d).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });

const naira = (kobo: number) =>
    (kobo / 100).toLocaleString("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({
    icon: Icon, label, value, sub, color,
}: { icon: React.ElementType; label: string; value: string | number; sub?: string; color: string }) => (
    <div className={`relative overflow-hidden rounded-2xl p-5 border ${color} backdrop-blur-sm`}>
        <div className="flex items-start justify-between mb-3">
            <p className="text-sm font-semibold uppercase tracking-widest opacity-70">{label}</p>
            <Icon size={20} className="opacity-60" />
        </div>
        <p className="text-3xl font-black mb-1">{value}</p>
        {sub && <p className="text-xs opacity-60">{sub}</p>}
    </div>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status, days }: { status: string; days: number }) => {
    if (status === "active" && days > 0)
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/30">
                <Activity size={10} /> Active · {days}d left
            </span>
        );
    if (status === "cancelled")
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30">
                <XCircle size={10} /> Cancelled
            </span>
        );
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 text-xs font-bold border border-gray-500/30">
            <Clock size={10} /> {status === "expired" ? "Expired" : "No Sub"}
        </span>
    );
};

// ─── Main AdminPanel Component ────────────────────────────────────────────────
interface AdminPanelProps {
    darkMode: boolean;
    currentUserId: string;
}

export const AdminPanel = ({ darkMode, currentUserId }: AdminPanelProps) => {
    const [stats,     setStats]     = useState<Stats>({ total: 0, active: 0, expired: 0, revenue: 0 });
    const [userRows,  setUserRows]  = useState<UserRow[]>([]);
    const [loading,   setLoading]   = useState(true);
    const [search,    setSearch]    = useState("");
    const [filter,    setFilter]    = useState<"all" | "active" | "expired" | "none">("all");
    const [sortField, setSortField] = useState<"name" | "status" | "expiry" | "joined">("joined");
    const [sortAsc,   setSortAsc]   = useState(false);
    const [actionId,  setActionId]  = useState<string | null>(null);  // loading state for row actions
    const [toast,     setToast]     = useState<{ msg: string; ok: boolean } | null>(null);
    const [activeTab, setActiveTab] = useState<"users" | "subscriptions" | "revenue">("users");

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3000);
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        const [profiles, subscriptions, statsData] = await Promise.all([
            getAllProfiles(),
            getAllSubscriptions(),
            getSubscriptionStats(),
        ]);

        // Build latest-sub map per user
        const subMap = new Map<string, SubscriptionWithProfile>();
        for (const sub of subscriptions) {
            const existing = subMap.get(sub.user_id);
            if (!existing || new Date(sub.created_at) > new Date(existing.created_at)) {
                subMap.set(sub.user_id, sub);
            }
        }

        const rows: UserRow[] = profiles.map((p) => {
            const sub = subMap.get(p.id) ?? null;
            return {
                profile: p,
                subscription: sub,
                daysLeft: sub ? daysLeft(sub.end_date) : 0,
            };
        });

        setUserRows(rows);
        setStats(statsData);
        setLoading(false);
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    // ── Filtering + sorting ───────────────────────────────────────────────────
    const filtered = userRows
        .filter((r) => {
            const q = search.toLowerCase();
            const match = (r.profile.email + (r.profile.full_name || "")).toLowerCase().includes(q);
            if (!match) return false;
            if (filter === "active")  return r.subscription?.status === "active" && r.daysLeft > 0;
            if (filter === "expired") return !r.subscription || r.subscription.status !== "active" || r.daysLeft === 0;
            if (filter === "none")    return !r.subscription;
            return true;
        })
        .sort((a, b) => {
            let cmp = 0;
            if (sortField === "name")   cmp = (a.profile.full_name || a.profile.email).localeCompare(b.profile.full_name || b.profile.email);
            if (sortField === "status") cmp = (a.subscription?.status || "z").localeCompare(b.subscription?.status || "z");
            if (sortField === "expiry") cmp = (a.subscription?.end_date || "").localeCompare(b.subscription?.end_date || "");
            if (sortField === "joined") cmp = a.profile.created_at.localeCompare(b.profile.created_at);
            return sortAsc ? cmp : -cmp;
        });

    const toggleSort = (field: typeof sortField) => {
        if (sortField === field) setSortAsc((p) => !p);
        else { setSortField(field); setSortAsc(true); }
    };

    // ── Row actions ───────────────────────────────────────────────────────────
   const handleActivate = async (row: UserRow) => {
    if (!row.subscription) return;

    setActionId(row.profile.id);

    const ok = await updateSubscriptionStatus(
        row.subscription.id,
        "active",
        30
    );

    if (ok) {
        showToast(
            `✅ ${row.profile.full_name || row.profile.email} activated for 30 days`
        );
    } else {
        showToast("❌ Failed to activate", false);
    }

    await loadData();
    setActionId(null);
};

    const handleCancel = async (row: UserRow) => {
    if (!row.subscription) return;

    setActionId(row.profile.id);

    const ok = await updateSubscriptionStatus(
        row.subscription.id,
        "cancelled"
    );

    if (ok) {
        showToast("⛔ Subscription cancelled");
    } else {
        showToast("❌ Failed to cancel", false);
    }

    await loadData();
    setActionId(null);
};

    const handleRoleToggle = async (row: UserRow) => {
    if (row.profile.id === currentUserId) {
        showToast("⚠️ You cannot change your own role", false);
        return;
    }

    setActionId(row.profile.id);

    const newRole =
        row.profile.role === "admin" ? "user" : "admin";

    const ok = await updateProfileRole(
        row.profile.id,
        newRole
    );

    if (ok) {
        showToast(`👑 ${row.profile.email} is now ${newRole}`);
    } else {
        showToast("❌ Role update failed", false);
    }

    await loadData();
    setActionId(null);
};

    // ── Theme helpers ─────────────────────────────────────────────────────────
    const card   = darkMode ? "bg-gray-800/60 border-white/10 text-white"   : "bg-white/80 border-gray-200 text-gray-800";
    const input  = darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-800 placeholder-gray-400";
    const rowBg  = darkMode ? "hover:bg-white/5" : "hover:bg-gray-50";
    const th     = darkMode ? "text-gray-400" : "text-gray-500";

    const tabs = [
        { id: "users",         label: "Users",         icon: Users },
        { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
        { id: "revenue",       label: "Revenue",       icon: BarChart3 },
    ] as const;

    // ── Revenue data ──────────────────────────────────────────────────────────
    const monthlyRevenue: Record<string, number> = {};
    userRows.forEach(({ subscription }) => {
        if (!subscription) return;
        const month = new Date(subscription.created_at).toLocaleString("default", { month: "short", year: "2-digit" });
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + subscription.amount / 100;
    });
    const revenueEntries = Object.entries(monthlyRevenue).slice(-6);
    const maxRevenue     = Math.max(...revenueEntries.map(([, v]) => v), 1);

    return (
        <div className="space-y-6 relative">
            {/* ── Toast ─────────────────────────────────────────────────────── */}
            {toast && (
                <div className={`fixed top-4 right-4 z-[200] px-5 py-3 rounded-xl shadow-2xl font-semibold text-sm flex items-center gap-2 transition-all ${toast.ok ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
                    {toast.ok ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                    {toast.msg}
                </div>
            )}

            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                        <ShieldCheck className="text-purple-400" size={28} /> Admin Management
                    </h2>
                    <p className="text-sm opacity-50 mt-0.5">Manage users, subscriptions and revenue</p>
                </div>
                <button onClick={loadData} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition">
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
                </button>
            </div>

            {/* ── Stats Cards ───────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Users}       label="Total Users"    value={stats.total}         sub="All registered"         color={`${card} border`} />
                <StatCard icon={Activity}    label="Active Subs"    value={stats.active}         sub="Paying subscribers"     color="bg-green-500/10 border-green-500/30 text-green-300" />
                <StatCard icon={Clock}       label="Expired"        value={stats.expired}        sub="Lapsed subscribers"     color="bg-orange-500/10 border-orange-500/30 text-orange-300" />
                <StatCard icon={DollarSign}  label="Active Revenue" value={naira(stats.revenue)} sub="From active subs"       color="bg-purple-500/10 border-purple-500/30 text-purple-300" />
            </div>

            {/* ── Tab Nav ───────────────────────────────────────────────────── */}
            <div className="flex gap-2 border-b border-white/10 pb-0">
                {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all border-b-2 -mb-px ${
                            activeTab === id
                                ? "border-purple-400 text-purple-400 bg-purple-500/10"
                                : "border-transparent opacity-50 hover:opacity-80"
                        }`}
                    >
                        <Icon size={15} /> {label}
                    </button>
                ))}
            </div>

            {/* ══ USERS TAB ════════════════════════════════════════════════════ */}
            {activeTab === "users" && (
                <div className="space-y-4">
                    {/* Search + Filter */}
                    <div className="flex gap-3 flex-wrap">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search name or email…"
                                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-purple-500 ${input}`}
                            />
                        </div>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as typeof filter)}
                            className={`px-4 py-2.5 rounded-xl border text-sm outline-none ${input}`}
                        >
                            <option value="all">All Users</option>
                            <option value="active">Active Subs</option>
                            <option value="expired">Expired / No Sub</option>
                            <option value="none">Never Subscribed</option>
                        </select>
                        <span className="self-center text-xs opacity-50">{filtered.length} results</span>
                    </div>

                    {/* Table */}
                    <div className={`rounded-2xl border overflow-hidden ${card}`}>
                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-16 opacity-40">No users found</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className={`border-b border-white/10 ${th} text-xs uppercase tracking-wider`}>
                                            <th className="text-left px-4 py-3">
                                                <button onClick={() => toggleSort("name")} className="flex items-center gap-1 hover:opacity-80">
                                                    User {sortField === "name" ? (sortAsc ? <ChevronUp size={12}/> : <ChevronDown size={12}/>) : null}
                                                </button>
                                            </th>
                                            <th className="text-left px-4 py-3">Role</th>
                                            <th className="text-left px-4 py-3">
                                                <button onClick={() => toggleSort("status")} className="flex items-center gap-1 hover:opacity-80">
                                                    Status {sortField === "status" ? (sortAsc ? <ChevronUp size={12}/> : <ChevronDown size={12}/>) : null}
                                                </button>
                                            </th>
                                            <th className="text-left px-4 py-3">
                                                <button onClick={() => toggleSort("expiry")} className="flex items-center gap-1 hover:opacity-80">
                                                    Expiry {sortField === "expiry" ? (sortAsc ? <ChevronUp size={12}/> : <ChevronDown size={12}/>) : null}
                                                </button>
                                            </th>
                                            <th className="text-left px-4 py-3">
                                                <button onClick={() => toggleSort("joined")} className="flex items-center gap-1 hover:opacity-80">
                                                    Joined {sortField === "joined" ? (sortAsc ? <ChevronUp size={12}/> : <ChevronDown size={12}/>) : null}
                                                </button>
                                            </th>
                                            <th className="text-right px-4 py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filtered.map((row) => {
                                            const busy = actionId === row.profile.id;
                                            const isActive = row.subscription?.status === "active" && row.daysLeft > 0;
                                            return (
                                                <tr key={row.profile.id} className={`${rowBg} transition`}>
                                                    {/* User info */}
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            {row.profile.avatar_url ? (
                                                                <img src={row.profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xs">
                                                                    {(row.profile.full_name || row.profile.email)[0].toUpperCase()}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="font-semibold leading-tight">{row.profile.full_name || "—"}</p>
                                                                <p className="text-xs opacity-50">{row.profile.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {/* Role */}
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${row.profile.role === "admin" ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/30" : "bg-blue-400/10 text-blue-300 border border-blue-400/20"}`}>
                                                            {row.profile.role === "admin" ? <Crown size={10} /> : null}
                                                            {row.profile.role}
                                                        </span>
                                                    </td>
                                                    {/* Sub status */}
                                                    <td className="px-4 py-3">
                                                        <StatusBadge status={row.subscription?.status || "none"} days={row.daysLeft} />
                                                    </td>
                                                    {/* Expiry */}
                                                    <td className="px-4 py-3 text-xs opacity-60">
                                                        {row.subscription ? (
                                                            <span className="flex items-center gap-1">
                                                                <Calendar size={11} />
                                                                {fmt(row.subscription.end_date)}
                                                            </span>
                                                        ) : "—"}
                                                    </td>
                                                    {/* Joined */}
                                                    <td className="px-4 py-3 text-xs opacity-50">{fmt(row.profile.created_at)}</td>
                                                    {/* Actions */}
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {busy ? (
                                                                <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                                                            ) : (
                                                                <>
                                                                    {row.subscription && !isActive && (
                                                                        <button onClick={() => handleActivate(row)} title="Activate 30 days" className="p-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/40 text-green-400 transition">
                                                                            <CheckCircle size={14} />
                                                                        </button>
                                                                    )}
                                                                    {row.subscription && isActive && (
                                                                        <button onClick={() => handleCancel(row)} title="Cancel subscription" className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 transition">
                                                                            <UserX size={14} />
                                                                        </button>
                                                                    )}
                                                                    <button onClick={() => handleRoleToggle(row)} title={row.profile.role === "admin" ? "Remove admin" : "Make admin"} className="p-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-400 transition">
                                                                        <Crown size={14} />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ══ SUBSCRIPTIONS TAB ════════════════════════════════════════════ */}
            {activeTab === "subscriptions" && (
                <div className="space-y-3">
                    {userRows
                        .filter((r) => r.subscription)
                        .sort((a, b) => (b.subscription!.created_at).localeCompare(a.subscription!.created_at))
                        .map(({ profile, subscription, daysLeft: days }) => (
                            <div key={subscription!.id} className={`${card} border rounded-2xl p-4 flex items-center gap-4 flex-wrap`}>
                                <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                                    {profile.avatar_url
                                        ? <img src={profile.avatar_url} alt="" className="w-9 h-9 rounded-full" />
                                        : <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">{profile.email[0].toUpperCase()}</div>
                                    }
                                    <div>
                                        <p className="font-semibold text-sm">{profile.full_name || profile.email}</p>
                                        <p className="text-xs opacity-50">{profile.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 flex-wrap text-sm">
                                    <StatusBadge status={subscription!.status} days={days} />
                                    <span className="opacity-60 text-xs flex items-center gap-1"><CreditCard size={11}/> {naira(subscription!.amount)}/month</span>
                                    <span className="opacity-60 text-xs flex items-center gap-1"><Calendar size={11}/> {fmt(subscription!.start_date)} → {fmt(subscription!.end_date)}</span>
                                    <span className="opacity-40 text-xs font-mono">{subscription!.paystack_reference.slice(0, 14)}…</span>
                                </div>
                            </div>
                        ))
                    }
                    {userRows.every((r) => !r.subscription) && (
                        <div className="text-center py-16 opacity-40">No subscriptions recorded yet</div>
                    )}
                </div>
            )}

            {/* ══ REVENUE TAB ══════════════════════════════════════════════════ */}
            {activeTab === "revenue" && (
                <div className="space-y-6">
                    {/* Mini bar chart */}
                    <div className={`${card} border rounded-2xl p-6`}>
                        <h3 className="text-lg font-bold mb-1 flex items-center gap-2"><TrendingUp size={18} className="text-purple-400"/> Monthly Revenue</h3>
                        <p className="text-xs opacity-50 mb-6">Last 6 months · ₦1,000 / subscriber / month</p>
                        {revenueEntries.length === 0 ? (
                            <p className="text-center opacity-40 py-8">No revenue data yet</p>
                        ) : (
                            <div className="flex items-end gap-3 h-40">
                                {revenueEntries.map(([month, val]) => (
                                    <div key={month} className="flex-1 flex flex-col items-center gap-2">
                                        <p className="text-xs font-bold opacity-70">₦{(val / 1000).toFixed(0)}k</p>
                                        <div className="w-full rounded-t-lg bg-gradient-to-t from-purple-600 to-pink-500 transition-all" style={{ height: `${(val / maxRevenue) * 100}%`, minHeight: "4px" }} />
                                        <p className="text-[10px] opacity-50">{month}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Revenue breakdown */}
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className={`${card} border rounded-2xl p-5`}>
                            <p className="text-xs uppercase tracking-widest opacity-50 mb-1">Total Payments</p>
                            <p className="text-3xl font-black">{userRows.filter((r) => r.subscription).length}</p>
                            <p className="text-xs opacity-40 mt-1">All time transactions</p>
                        </div>
                        <div className={`${card} border rounded-2xl p-5`}>
                            <p className="text-xs uppercase tracking-widest opacity-50 mb-1">Active MRR</p>
                            <p className="text-3xl font-black">{naira(stats.revenue)}</p>
                            <p className="text-xs opacity-40 mt-1">Monthly recurring revenue</p>
                        </div>
                        <div className={`${card} border rounded-2xl p-5`}>
                            <p className="text-xs uppercase tracking-widest opacity-50 mb-1">Conversion Rate</p>
                            <p className="text-3xl font-black">{stats.total ? Math.round((stats.active / stats.total) * 100) : 0}%</p>
                            <p className="text-xs opacity-40 mt-1">Users who subscribed</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;