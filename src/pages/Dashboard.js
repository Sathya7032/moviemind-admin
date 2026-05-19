import { useState, useEffect, useCallback } from "react";
import {
  FiUsers, FiHelpCircle, FiGrid, FiTrendingUp,
  FiUserCheck, FiUserX, FiClock, FiRefreshCw,
  FiAward,
} from "react-icons/fi";
import { NavLink } from "react-router-dom";
import { getAllUsers } from "../services/userService";
import { getAllCategories } from "../services/categoryService";
import { getAllQuestions } from "../services/questionService";
import { getAllRedeems } from "../services/redeemService";
import { getFullLeaderboard } from "../services/leaderboardService";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const MEDAL = { 1: "🥇", 2: "🥈", 3: "🥉" };

const STATUS_CHIP = {
  PENDING:    "bg-amber-50 text-amber-700 border border-amber-200",
  PROCESSING: "bg-blue-50 text-blue-700 border border-blue-200",
  APPROVED:   "bg-emerald-50 text-emerald-700 border border-emerald-200",
  REJECTED:   "bg-red-50 text-red-700 border border-red-200",
};

const SkeletonRow = ({ cols }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-5 py-3.5">
        <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: i === 1 ? 120 : 70 }} />
      </td>
    ))}
  </tr>
);

const fmt = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const Dashboard = () => {
  const [users,       setUsers]       = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [questions,   setQuestions]   = useState([]);
  const [redeems,     setRedeems]     = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [graphStartDate, setGraphStartDate] = useState("");
  const [graphEndDate, setGraphEndDate] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [u, c, q, r, l] = await Promise.allSettled([
        getAllUsers(), getAllCategories(), getAllQuestions(),
        getAllRedeems(), getFullLeaderboard(),
      ]);
      if (u.status === "fulfilled" && u.value.success) setUsers(u.value.data);
      if (c.status === "fulfilled" && c.value.success) setCategories(c.value.data);
      if (q.status === "fulfilled" && q.value.success) setQuestions(q.value.data);
      if (r.status === "fulfilled" && r.value.success) setRedeems(r.value.data);
      if (l.status === "fulfilled" && l.value.success) setLeaderboard(l.value.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const activeUsers    = users.filter(u => u.status === "ACTIVE").length;
  const inactiveUsers  = users.filter(u => u.status !== "ACTIVE").length;
  const pendingRedeems = redeems.filter(r => r.status === "PENDING").length;
  const approvedCoins  = redeems.filter(r => r.status === "APPROVED").reduce((s, r) => s + r.coins, 0);
  const recentRedeems  = [...redeems].slice(0, 5);
  const top5           = leaderboard.slice(0, 5);

  const getGraphData = () => {
    if (!users.length) return [];
    let filteredUsers = users;
    if (graphStartDate || graphEndDate) {
      filteredUsers = users.filter((u) => {
        if (!u.createdTime) return false;
        const userDate = new Date(u.createdTime);
        if (graphStartDate && userDate < new Date(graphStartDate)) return false;
        if (graphEndDate) {
          const endDate = new Date(graphEndDate);
          endDate.setHours(23, 59, 59, 999);
          if (userDate > endDate) return false;
        }
        return true;
      });
    }

    const rawCounts = {};
    filteredUsers.forEach(u => {
      if (!u.createdTime) return;
      const d = new Date(u.createdTime);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      rawCounts[key] = (rawCounts[key] || 0) + 1;
    });

    return Object.keys(rawCounts).sort().map(key => {
      const d = new Date(key);
      return {
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        users: rawCounts[key],
      };
    });
  };

  const graphData = getGraphData();
  const totalGraphUsers = graphData.reduce((acc, item) => acc + item.users, 0);

  const stats = [
    { label: "Total Users",      value: users.length,       icon: <FiUsers />,     color: "text-indigo-500",  bg: "bg-indigo-50"  },
    { label: "Active Users",     value: activeUsers,        icon: <FiUserCheck />, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Total Questions",  value: questions.length,   icon: <FiHelpCircle />,color: "text-purple-500",  bg: "bg-purple-50"  },
    { label: "Categories",       value: categories.length,  icon: <FiGrid />,      color: "text-teal-500",   bg: "bg-teal-50"    },
    { label: "Pending Redeems",  value: pendingRedeems,     icon: <FiClock />,     color: "text-amber-500",  bg: "bg-amber-50"   },
    { label: "Inactive Users",   value: inactiveUsers,      icon: <FiUserX />,     color: "text-red-500",    bg: "bg-red-50"     },
    { label: "Leaderboard",      value: leaderboard.length, icon: <FiTrendingUp />,color: "text-blue-500",   bg: "bg-blue-50"    },
    { label: "Approved Coins",   value: `${approvedCoins.toLocaleString()} 🪙`, icon: <FiAward />, color: "text-orange-500", bg: "bg-orange-50" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome to Javify Movie Guess Admin Panel</p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-50 shadow-sm"
        >
          <FiRefreshCw className={`text-sm ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats grid — 4 cols */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-4 p-5 bg-white rounded-xl shadow-sm hover:-translate-y-0.5 hover:shadow-md transition"
          >
            <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center text-xl shrink-0`}>
              {stat.icon}
            </div>
            <div className="min-w-0">
              <div className="text-xl font-bold text-gray-800 leading-tight truncate">
                {loading
                  ? <span className="inline-block w-10 h-5 bg-gray-100 rounded animate-pulse" />
                  : stat.value}
              </div>
              <div className="text-xs text-gray-500 mt-0.5 truncate">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Users Growth Graph */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-4 border-b border-gray-100 gap-4">
          <div>
            <h3 className="text-base font-semibold text-gray-800">Users Growth</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {totalGraphUsers} users joined in selected period
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={graphStartDate}
              onChange={(e) => setGraphStartDate(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-300"
            />
            <span className="text-gray-400 text-xs">to</span>
            <input
              type="date"
              value={graphEndDate}
              onChange={(e) => setGraphEndDate(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-300"
            />
            {(graphStartDate || graphEndDate) && (
              <button
                onClick={() => { setGraphStartDate(""); setGraphEndDate(""); }}
                className="text-xs text-red-500 hover:underline ml-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="p-5 h-72">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg animate-pulse">
              <FiTrendingUp className="text-4xl text-gray-300" />
            </div>
          ) : graphData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
              No user data for selected period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                />
                <Area type="monotone" dataKey="users" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Redeem Requests */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-800">Recent Redeem Requests</h3>
            <NavLink to="/dashboard/redeems" className="text-xs font-medium text-red-600 hover:bg-red-50 px-2 py-1 rounded-md transition">
              View All
            </NavLink>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">ID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Coins</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={4} />)
                  : recentRedeems.length === 0
                    ? (
                      <tr><td colSpan={4} className="px-5 py-8 text-center text-xs text-gray-400">No redeem requests yet</td></tr>
                    )
                    : recentRedeems.map((r) => (
                      <tr key={r.redeemId} className="border-t border-gray-50 hover:bg-gray-50 transition">
                        <td className="px-5 py-3">
                          <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">#{r.redeemId}</span>
                        </td>
                        <td className="px-5 py-3 text-sm font-semibold text-gray-700">
                          {r.coins?.toLocaleString()} <span className="text-gray-400 font-normal">🪙</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_CHIP[r.status] ?? "bg-gray-100 text-gray-500"}`}>
                            {r.status?.charAt(0) + r.status?.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500">{fmt(r.requestedAt)}</td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Players */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-800">Top Players</h3>
            <NavLink to="/dashboard/leaderboard" className="text-xs font-medium text-red-600 hover:bg-red-50 px-2 py-1 rounded-md transition">
              View All
            </NavLink>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Rank</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Player</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Coins</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={3} />)
                  : top5.length === 0
                    ? (
                      <tr><td colSpan={3} className="px-5 py-8 text-center text-xs text-gray-400">No leaderboard data yet</td></tr>
                    )
                    : top5.map((player) => (
                      <tr key={player.userId} className="border-t border-gray-50 hover:bg-gray-50 transition">
                        <td className="px-5 py-3">
                          {player.rank <= 3
                            ? <span className="text-lg">{MEDAL[player.rank]}</span>
                            : <span className="inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold bg-gray-100 text-gray-500">#{player.rank}</span>
                          }
                        </td>
                        <td className="px-5 py-3 text-sm font-medium text-gray-700">{player.username}</td>
                        <td className="px-5 py-3 text-sm font-bold text-gray-800 text-right">{player.totalCoins?.toLocaleString()} <span className="font-normal text-gray-400">🪙</span></td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  
};

export default Dashboard;
