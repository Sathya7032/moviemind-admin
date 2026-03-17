import { useState, useEffect, useCallback } from "react";
import { getFullLeaderboard } from "../services/leaderboardService";
import { toast } from "react-toastify";
import { FiRefreshCw, FiSearch, FiTrendingUp, FiUsers, FiAward } from "react-icons/fi";
import { MdLeaderboard } from "react-icons/md";

const MEDAL = { 1: "🥇", 2: "🥈", 3: "🥉" };

const rankBg = (rank) => {
  if (rank === 1) return "from-amber-400 to-yellow-300";
  if (rank === 2) return "from-slate-400 to-slate-300";
  if (rank === 3) return "from-orange-400 to-amber-300";
  return "from-indigo-500 to-indigo-400";
};

const podiumHeight = { 1: "h-36", 2: "h-28", 3: "h-20" };
const podiumOrder  = { 1: "order-2", 2: "order-1", 3: "order-3" };

const Avatar = ({ name }) => {
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-sm font-bold ring-2 ring-white shadow-sm shrink-0">
      {initials}
    </div>
  );
};

const Leaderboard = () => {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getFullLeaderboard();
      if (res.success) setData(res.data);
      else toast.error("Failed to load leaderboard");
    } catch {
      toast.error("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  const filtered = data.filter((e) =>
    e.username?.toLowerCase().includes(search.toLowerCase())
  );

  const top3    = data.slice(0, 3);
  const topUser = data[0];

  return (
    <div>
      {/* ── Page header ── */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Wallet Leaderboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Top players ranked by total coins earned
          </p>
        </div>
        <button
          onClick={fetchLeaderboard}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-50 shadow-sm"
        >
          <FiRefreshCw className={`text-sm ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Players",   value: data.length,              icon: <FiUsers />,     color: "text-indigo-500", bg: "bg-indigo-50" },
          { label: "Top Player",      value: topUser?.username ?? "—", icon: <FiAward />,     color: "text-amber-500",  bg: "bg-amber-50"  },
          { label: "Highest Coins",   value: topUser ? `${topUser.totalCoins.toLocaleString()} 🪙` : "—", icon: <FiTrendingUp />, color: "text-emerald-500", bg: "bg-emerald-50" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-4 p-5 bg-white rounded-xl shadow-sm hover:-translate-y-0.5 hover:shadow-md transition">
            <div className={`w-12 h-12 rounded-xl ${s.bg} ${s.color} flex items-center justify-center text-xl shrink-0`}>
              {s.icon}
            </div>
            <div className="min-w-0">
              <div className="text-xl font-bold text-gray-800 truncate">{loading ? "—" : s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Podium (top 3) ── */}
      {!loading && top3.length >= 3 && (
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 rounded-2xl p-8 mb-6 overflow-hidden relative">
          {/* decorative blobs */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative text-center mb-8">
            <span className="inline-flex items-center gap-2 text-white/80 text-sm font-semibold uppercase tracking-widest">
              <MdLeaderboard className="text-lg" /> Hall of Fame
            </span>
          </div>

          <div className="relative flex items-end justify-center gap-3 sm:gap-6 overflow-x-auto pb-1">
            {[top3[1], top3[0], top3[2]].map((entry) => (
              <div
                key={entry.userId}
                className={`flex flex-col items-center ${podiumOrder[entry.rank]}`}
              >
                {/* crown / medal */}
                <div className="text-3xl mb-2">{MEDAL[entry.rank]}</div>

                {/* avatar ring */}
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br ${rankBg(entry.rank)} flex items-center justify-center text-white text-base sm:text-lg font-extrabold shadow-lg ring-4 ring-white/20 mb-3`}>
                  {entry.username?.slice(0, 2).toUpperCase()}
                </div>

                <span className="text-white text-xs sm:text-sm font-bold truncate max-w-[70px] sm:max-w-[90px] text-center leading-tight">
                  {entry.username}
                </span>
                <span className="text-indigo-200 text-xs mt-0.5">
                  {entry.totalCoins.toLocaleString()} 🪙
                </span>

                {/* podium block */}
                <div className={`mt-3 w-24 ${podiumHeight[entry.rank]} bg-white/10 backdrop-blur rounded-t-xl flex items-center justify-center`}>
                  <span className="text-white/60 text-lg font-black">#{entry.rank}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Full Table ── */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* toolbar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 gap-3 flex-wrap">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <MdLeaderboard className="text-indigo-500" /> Full Rankings
          </h2>
          <div className="relative flex-1 sm:flex-none">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search player..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 w-full sm:w-52"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide w-16">Rank</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Player</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">User ID</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Coins</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide w-40">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {[40, 160, 80, 80, 120].map((w, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: w }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-gray-400 text-sm">
                    <MdLeaderboard className="text-5xl mx-auto mb-3 text-gray-200" />
                    {search ? "No players match your search." : "No leaderboard data yet."}
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => {
                  const maxCoins = data[0]?.totalCoins || 1;
                  const pct = Math.round((entry.totalCoins / maxCoins) * 100);
                  const isTop3 = entry.rank <= 3;

                  return (
                    <tr
                      key={entry.userId}
                      className={`transition ${isTop3 ? "bg-indigo-50/40 hover:bg-indigo-50" : "hover:bg-gray-50/70"}`}
                    >
                      {/* rank */}
                      <td className="px-5 py-3.5">
                        {isTop3 ? (
                          <span className="text-xl leading-none">{MEDAL[entry.rank]}</span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-500 text-xs font-bold">
                            #{entry.rank}
                          </span>
                        )}
                      </td>

                      {/* player */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={entry.username} />
                          <div>
                            <div className={`text-sm font-semibold leading-tight ${isTop3 ? "text-indigo-700" : "text-gray-800"}`}>
                              {entry.username}
                            </div>
                            {entry.rank === 1 && (
                              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wide">⚡ Top Player</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* user id */}
                      <td className="px-5 py-3.5 text-xs text-gray-400 font-mono">#{entry.userId}</td>

                      {/* coins */}
                      <td className="px-5 py-3.5 text-right">
                        <span className={`text-sm font-bold ${isTop3 ? "text-indigo-600" : "text-gray-700"}`}>
                          {entry.totalCoins.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">🪙</span>
                      </td>

                      {/* progress bar */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all bg-gradient-to-r ${
                                isTop3 ? "from-indigo-400 to-indigo-600" : "from-gray-300 to-gray-400"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 w-8 text-right shrink-0">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3.5 border-t border-gray-100 text-xs text-gray-400">
            Showing {filtered.length} of {data.length} players
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
