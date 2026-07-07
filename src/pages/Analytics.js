import { useState, useEffect, useCallback } from "react";
import { getAllUsers } from "../services/userService";
import { getAllCategories } from "../services/categoryService";
import { getAllQuestions } from "../services/questionService";
import { getFullLeaderboard } from "../services/leaderboardService";
import { getAllRedeems } from "../services/redeemService";
import { getAnalytics } from "../services/analyticsService";
import { toast } from "react-toastify";
import {
  FiUsers, FiGrid, FiHelpCircle, FiTrendingUp, FiGift,
  FiRefreshCw, FiUserCheck, FiUserX, FiCheckCircle,
  FiXCircle, FiClock, FiLoader, FiAward,
} from "react-icons/fi";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";

/* ─── palette ─── */
const C = {
  indigo : "#6366f1",
  emerald: "#10b981",
  amber  : "#f59e0b",
  red    : "#ef4444",
  blue   : "#3b82f6",
  purple : "#8b5cf6",
  pink   : "#ec4899",
  teal   : "#14b8a6",
  orange : "#f97316",
  slate  : "#64748b",
};

/* ─── custom tooltip ─── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-xl rounded-xl px-4 py-3 text-sm">
      {label && <p className="font-semibold text-gray-700 mb-1.5">{label}</p>}
      {payload.map((e, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: e.color || e.fill }} />
          <span className="text-gray-500">{e.name}:</span>
          <span className="font-bold text-gray-800">
            {typeof e.value === "number" ? e.value.toLocaleString() : e.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ─── KPI card ─── */
const KpiCard = ({ label, value, sub, icon, color, bg, loading }) => (
  <div className="flex items-center gap-4 p-5 bg-white rounded-xl shadow-sm hover:-translate-y-0.5 hover:shadow-md transition">
    <div className={`w-12 h-12 rounded-xl ${bg} ${color} flex items-center justify-center text-xl shrink-0`}>
      {icon}
    </div>
    <div className="min-w-0">
      <div className="text-2xl font-extrabold text-gray-800 leading-tight">
        {loading ? <span className="inline-block w-12 h-6 bg-gray-100 rounded animate-pulse" /> : value}
      </div>
      <div className="text-xs text-gray-500 mt-0.5 truncate">{label}</div>
      {sub && !loading && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  </div>
);

/* ─── section wrapper ─── */
const Section = ({ title, subtitle, children, action }) => (
  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
    <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 gap-3">
      <div>
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

/* ─── skeleton chart ─── */
const ChartSkeleton = ({ h = 260 }) => (
  <div className={`w-full rounded-lg bg-gray-50 animate-pulse`} style={{ height: h }} />
);

/* ─── custom pie label ─── */
const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  if (percent < 0.05) return null;
  const RAD = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RAD);
  const y = cy + r * Math.sin(-midAngle * RAD);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      className="text-[11px] font-bold" style={{ fontSize: 11, fontWeight: 700 }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

/* ════════════════════════════════════════
   MAIN ANALYTICS COMPONENT
═══════════════════════════════════════ */
const Analytics = () => {
  const [users,      setUsers]      = useState([]);
  const [categories, setCategories] = useState([]);
  const [questions,  setQuestions]  = useState([]);
  const [leaderboard,setLeaderboard]= useState([]);
  const [redeems,    setRedeems]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [analytics,  setAnalytics]  = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [u, c, q, l, r, a] = await Promise.allSettled([
        getAllUsers(0, 100000),
        getAllCategories(),
        getAllQuestions(),
        getFullLeaderboard(),
        getAllRedeems(),
        getAnalytics(),
      ]);
      if (u.status === "fulfilled" && u.value.success) {
        setUsers(u.value.data?.content || (Array.isArray(u.value.data) ? u.value.data : []));
      }
      if (c.status === "fulfilled" && c.value.success) setCategories(c.value.data);
      if (q.status === "fulfilled" && q.value.success) setQuestions(q.value.data);
      if (l.status === "fulfilled" && l.value.success) setLeaderboard(l.value.data);
      if (r.status === "fulfilled" && r.value.success) setRedeems(r.value.data);
      if (a.status === "fulfilled" && a.value.success) setAnalytics(a.value.data);
    } catch {
      toast.error("Some analytics data failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ─── derived data ─── */

  // users
  const activeUsers   = users.filter(u => u.status === "ACTIVE").length;
  const inactiveUsers = users.filter(u => u.status !== "ACTIVE").length;
  const userStatusData = [
    { name: "Active",   value: activeUsers,   fill: C.emerald },
    { name: "Inactive", value: inactiveUsers, fill: C.red     },
  ];

  // questions per category
  const qPerCat = categories.map(cat => ({
    name: cat.name?.length > 14 ? cat.name.slice(0, 14) + "…" : cat.name,
    fullName: cat.name,
    Questions: questions.filter(q => q.categoryId === cat.id || q.category?.id === cat.id).length,
  })).filter(c => c.Questions > 0).sort((a, b) => b.Questions - a.Questions).slice(0, 10);

  // categories active vs inactive
  const activeCats   = categories.filter(c => c.active).length;
  const inactiveCats = categories.filter(c => !c.active).length;
  const catStatusData = [
    { name: "Active",   value: activeCats,   fill: C.indigo  },
    { name: "Inactive", value: inactiveCats, fill: C.slate   },
  ];

  // redeems by status
  const redeemStatusData = ["PENDING","PROCESSING","APPROVED","REJECTED"].map(s => ({
    name  : s.charAt(0) + s.slice(1).toLowerCase(),
    value : redeems.filter(r => r.status === s).length,
    fill  : s === "APPROVED" ? C.emerald : s === "REJECTED" ? C.red : s === "PROCESSING" ? C.blue : C.amber,
  })).filter(d => d.value > 0);

  // redeem coins by status (bar)
  const redeemCoinsBar = ["PENDING","PROCESSING","APPROVED","REJECTED"].map(s => ({
    status: s.charAt(0) + s.slice(1).toLowerCase(),
    Coins : redeems.filter(r => r.status === s).reduce((acc, r) => acc + (r.coins ?? 0), 0),
  }));

  // top 10 leaderboard bar
  const top10 = leaderboard.slice(0, 10).map(e => ({
    name : e.username?.length > 10 ? e.username.slice(0, 10) + "…" : e.username,
    Coins: e.totalCoins,
  }));

  // redeem timeline (group by date)
  const redeemByDate = (() => {
    const map = {};
    redeems.forEach(r => {
      if (!r.requestedAt) return;
      const d = new Date(r.requestedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map)
      .map(([date, count]) => ({ date, Requests: count }))
      .slice(-14);
  })();

  // total coins in wallet leaderboard
  const totalWalletCoins = leaderboard.reduce((s, e) => s + (e.totalCoins ?? 0), 0);
  const topPlayerCoins   = leaderboard[0]?.totalCoins ?? 0;

  // redeem summary
  const approvedCoins = redeems.filter(r => r.status === "APPROVED").reduce((s, r) => s + r.coins, 0);
  const pendingCoins  = redeems.filter(r => r.status === "PENDING").reduce((s, r) => s + r.coins, 0);

 
  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Analytics & Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Live overview across users, content, wallet and redeems</p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-50 shadow-sm"
        >
          <FiRefreshCw className={`text-sm ${loading ? "animate-spin" : ""}`} />
          Refresh All
        </button>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Users"      value={analytics?.totalUsers ?? users.length}       sub={`${activeUsers} active · ${inactiveUsers} inactive`}      icon={<FiUsers />}       color="text-indigo-500" bg="bg-indigo-50"  loading={loading} />
        <KpiCard label="Daily Active Users" value={analytics?.dailyActiveUsers ?? 0}          sub="Active in last 24h"                                       icon={<FiUserCheck />}    color="text-emerald-500" bg="bg-emerald-50"  loading={loading} />
        <KpiCard label="Monthly Active Users" value={analytics?.monthlyActiveUsers ?? 0}      sub="Active in last 30d"                                       icon={<FiUserCheck />}    color="text-teal-500" bg="bg-teal-50"  loading={loading} />
        <KpiCard label="Total Questions"  value={analytics?.totalQuestions ?? questions.length}   sub={`Across ${categories.length} categories`}                 icon={<FiHelpCircle />}  color="text-purple-500" bg="bg-purple-50"  loading={loading} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Quiz Attempts"    value={analytics?.totalQuizAttempts ?? 0}           sub="Total quiz game plays"                                    icon={<FiAward />}       color="text-rose-500" bg="bg-rose-50"  loading={loading} />
        <KpiCard label="Total Posts"      value={analytics?.totalPosts ?? 0}                  sub="Forum community posts"                                    icon={<FiGrid />}        color="text-blue-500" bg="bg-blue-50"  loading={loading} />
        <KpiCard label="Redeem Requests"  value={redeems.length}                              sub={`${redeems.filter(r=>r.status==="PENDING").length} pending`} icon={<FiGift />}      color="text-amber-500"  bg="bg-amber-50"   loading={loading} />
        <KpiCard label="Approved Coins"   value={`${approvedCoins.toLocaleString()} 🪙`}        sub={`Pending: ${pendingCoins.toLocaleString()} 🪙`}           icon={<FiCheckCircle />} color="text-orange-500" bg="bg-orange-50" loading={loading} />
      </div>

      {/* ── Row 1: User Status Pie + Redeem Status Pie ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <Section title="User Status Distribution" subtitle="Active vs Inactive accounts">
          {loading ? <ChartSkeleton /> : (
            users.length === 0 ? <Empty label="No user data" /> : (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full sm:w-[55%]">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={userStatusData} cx="50%" cy="50%" outerRadius={90}
                        dataKey="value" labelLine={false} label={PieLabel}>
                        {userStatusData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 w-full space-y-3">
                  {userStatusData.map(d => (
                    <div key={d.name}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="flex items-center gap-2 text-gray-600 font-medium">
                          <span className="w-3 h-3 rounded-full" style={{ background: d.fill }} />
                          {d.name}
                        </span>
                        <span className="font-bold text-gray-800">{d.value}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{
                          width: `${users.length ? (d.value / users.length) * 100 : 0}%`,
                          background: d.fill,
                        }} />
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-100 text-xs text-gray-400">
                    Total: <strong className="text-gray-600">{users.length}</strong> registered users
                  </div>
                </div>
              </div>
            )
          )}
        </Section>

        <Section title="Redeem Request Breakdown" subtitle="Status distribution of all redeem requests">
          {loading ? <ChartSkeleton /> : (
            redeems.length === 0 ? <Empty label="No redeem data" /> : (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full sm:w-[55%]">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={redeemStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={90}
                        dataKey="value" labelLine={false} label={PieLabel}>
                        {redeemStatusData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 w-full space-y-3">
                  {redeemStatusData.map(d => (
                    <div key={d.name}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="flex items-center gap-2 text-gray-600 font-medium">
                          <span className="w-3 h-3 rounded-full" style={{ background: d.fill }} />
                          {d.name}
                        </span>
                        <span className="font-bold text-gray-800">{d.value}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{
                          width: `${redeems.length ? (d.value / redeems.length) * 100 : 0}%`,
                          background: d.fill,
                        }} />
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-100 text-xs text-gray-400">
                    Total: <strong className="text-gray-600">{redeems.length}</strong> requests
                  </div>
                </div>
              </div>
            )
          )}
        </Section>
      </div>

      {/* ── Row 2: Questions per Category (bar) ── */}
      <Section
        title="Questions per Category"
        subtitle="Top 10 categories by question count"
      >
        {loading ? <ChartSkeleton h={300} /> : (
          qPerCat.length === 0 ? <Empty label="No question data" /> : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={qPerCat} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }}
                  angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Questions" fill={C.indigo} radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          )
        )}
      </Section>

      {/* ── Row 3: Top 10 Wallet Leaderboard (bar) ── */}
      <Section
        title="Top 10 Players — Wallet Coins"
        subtitle="Ranked by total coins in wallet"
      >
        {loading ? <ChartSkeleton h={300} /> : (
          top10.length === 0 ? <Empty label="No leaderboard data" /> : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={top10} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Coins" radius={[0, 6, 6, 0]} maxBarSize={28}>
                  {top10.map((_, i) => (
                    <Cell key={i} fill={
                      i === 0 ? C.amber :
                      i === 1 ? C.slate :
                      i === 2 ? C.orange :
                      C.indigo
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )
        )}
      </Section>

      {/* ── Row 4: Redeem Coins by Status + Redeem Timeline ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <Section title="Coins by Redeem Status" subtitle="Total coins grouped by request status">
          {loading ? <ChartSkeleton /> : (
            redeems.length === 0 ? <Empty label="No redeem data" /> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={redeemCoinsBar} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="status" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Coins" radius={[6, 6, 0, 0]} maxBarSize={56}>
                    <Cell fill={C.amber}   />
                    <Cell fill={C.blue}    />
                    <Cell fill={C.emerald} />
                    <Cell fill={C.red}     />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          )}
        </Section>

        <Section title="Redeem Request Timeline" subtitle="Daily redeem requests over last 14 days">
          {loading ? <ChartSkeleton /> : (
            redeemByDate.length === 0 ? <Empty label="No timeline data" /> : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={redeemByDate} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="redeemGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.purple} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={C.purple} stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="Requests" stroke={C.purple}
                    strokeWidth={2.5} fill="url(#redeemGrad)" dot={{ r: 3, fill: C.purple }} />
                </AreaChart>
              </ResponsiveContainer>
            )
          )}
        </Section>
      </div>

      {/* ── Row 5: Category active/inactive + summary table ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <Section title="Category Status" subtitle="Active vs Inactive categories">
          {loading ? <ChartSkeleton h={220} /> : (
            categories.length === 0 ? <Empty label="No category data" /> : (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full sm:w-1/2">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={catStatusData} cx="50%" cy="50%" outerRadius={80}
                        dataKey="value" labelLine={false} label={PieLabel}>
                        {catStatusData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 w-full space-y-4">
                  {catStatusData.map(d => (
                    <div key={d.name} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: d.fill }} />
                        {d.name}
                      </span>
                      <span className="text-sm font-bold text-gray-800">{d.value}</span>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-indigo-50 rounded-lg p-2 text-center">
                      <div className="font-bold text-indigo-600 text-lg">{categories.length}</div>
                      <div className="text-gray-500">Total</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <div className="font-bold text-gray-700 text-lg">{questions.length}</div>
                      <div className="text-gray-500">Questions</div>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </Section>

        {/* Summary table */}
        <Section title="Platform Summary" subtitle="Key metrics at a glance">
          {loading ? <ChartSkeleton h={220} /> : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-50">
                {[
                  { label: "Total Users",            value: users.length,            icon: <FiUsers className="text-indigo-500" /> },
                  { label: "Active Users",            value: activeUsers,             icon: <FiUserCheck className="text-emerald-500" /> },
                  { label: "Inactive Users",          value: inactiveUsers,           icon: <FiUserX className="text-red-500" /> },
                  { label: "Total Categories",        value: categories.length,       icon: <FiGrid className="text-teal-500" /> },
                  { label: "Total Questions",         value: questions.length,        icon: <FiHelpCircle className="text-purple-500" /> },
                  { label: "Leaderboard Players",     value: leaderboard.length,      icon: <FiTrendingUp className="text-amber-500" /> },
                  { label: "Total Wallet Coins",      value: `${totalWalletCoins.toLocaleString()} 🪙`, icon: <FiAward className="text-amber-400" /> },
                  { label: "Top Player Coins",        value: `${topPlayerCoins.toLocaleString()} 🪙`,  icon: <FiAward className="text-yellow-500" /> },
                  { label: "Total Redeem Requests",   value: redeems.length,          icon: <FiGift className="text-orange-500" /> },
                  { label: "Approved Coins Redeemed", value: `${approvedCoins.toLocaleString()} 🪙`, icon: <FiCheckCircle className="text-emerald-500" /> },
                  { label: "Rejected Requests",       value: redeems.filter(r => r.status === "REJECTED").length, icon: <FiXCircle className="text-red-500" /> },
                  { label: "Pending Requests",        value: redeems.filter(r => r.status === "PENDING").length,  icon: <FiClock className="text-amber-500" /> },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/60 transition">
                    <td className="py-2.5 pr-3">
                      <span className="flex items-center gap-2 text-gray-500">
                        <span className="text-base">{row.icon}</span>
                        {row.label}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-bold text-gray-800">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>
      </div>

    </div>
  );
};

const Empty = ({ label }) => (
  <div className="flex flex-col items-center justify-center py-10 text-gray-300">
    <FiLoader className="text-4xl mb-2" />
    <span className="text-sm">{label}</span>
  </div>
);

export default Analytics;
