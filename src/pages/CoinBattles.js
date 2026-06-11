import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { getAllBattlesForAdmin } from "../services/coinBattleService";
import { toast } from "react-toastify";
import {
  FiTarget,
  FiSearch,
  FiAward,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiUsers,
  FiActivity,
  FiTrendingUp,
} from "react-icons/fi";

/* ── Format date helper ── */
const formatDate = (dateString) => {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

const statusBadge = (status) => {
  let classes = "bg-gray-100 text-gray-700";
  let dotColor = "bg-gray-500";
  let label = status;

  if (status === "WAITING") {
    classes = "bg-blue-100 text-blue-700";
    dotColor = "bg-blue-500";
    label = "Waiting";
  } else if (status === "ACTIVE") {
    classes = "bg-amber-100 text-amber-700";
    dotColor = "bg-amber-500";
    label = "Active";
  } else if (status === "COMPLETED") {
    classes = "bg-emerald-100 text-emerald-700";
    dotColor = "bg-emerald-500";
    label = "Completed";
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColor}`} />
      {label}
    </span>
  );
};

const Avatar = ({ name, pictureUrl }) => {
  if (pictureUrl) {
    return (
      <img
        src={pictureUrl}
        alt={name}
        className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
        onError={(e) => {
          e.target.style.display = "none";
          e.target.nextSibling.style.display = "flex";
        }}
      />
    );
  }
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-white shadow-sm shrink-0">
      {initials}
    </div>
  );
};

const CoinBattles = () => {
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // 'ALL' | 'WAITING' | 'ACTIVE' | 'COMPLETED'
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchBattles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllBattlesForAdmin();
      if (res.success) {
        setBattles(res.data);
      } else {
        toast.error("Failed to load coin battles");
      }
    } catch {
      toast.error("Failed to load coin battles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBattles();
  }, [fetchBattles]);

  /* ── Filter & Search logic ── */
  const filtered = battles.filter((b) => {
    const q = search.toLowerCase();
    const matchesSearch =
      b.groupName?.toLowerCase().includes(q) ||
      b.inviteCode?.toLowerCase().includes(q) ||
      b.categoryName?.toLowerCase().includes(q) ||
      b.createdByName?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (statusFilter !== "ALL" && b.status !== statusFilter) {
      return false;
    }

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Stats
  const activeCount = battles.filter((b) => b.status === "ACTIVE").length;
  const completedCount = battles.filter((b) => b.status === "COMPLETED").length;
  const totalPotSum = battles.reduce((sum, b) => sum + (b.totalPotCoins || 0), 0);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStatusTab = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-1 py-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Coin Battles</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor competitive multiplayer battles, inspect scores, and audit pots
          </p>
        </div>
        <button
          onClick={fetchBattles}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
        >
          <FiRefreshCw className={`text-sm ${loading ? "animate-spin" : ""}`} />
          Refresh Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {[
          {
            label: "Total Battles",
            value: battles.length,
            icon: <FiTarget />,
            color: "text-indigo-500",
            bg: "bg-indigo-50",
          },
          {
            label: "Active Battles",
            value: activeCount,
            icon: <FiActivity />,
            color: "text-amber-500",
            bg: "bg-amber-50",
          },
          {
            label: "Completed Battles",
            value: completedCount,
            icon: <FiAward />,
            color: "text-emerald-500",
            bg: "bg-emerald-50",
          },
          {
            label: "Total Pot Value",
            value: `${totalPotSum} 🪙`,
            icon: <FiTrendingUp />,
            color: "text-red-500",
            bg: "bg-red-50",
          },
        ].map((s, idx) => (
          <div
            key={idx}
            className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition"
          >
            <div className={`w-12 h-12 rounded-xl ${s.bg} ${s.color} flex items-center justify-center text-xl shrink-0`}>
              {s.icon}
            </div>
            <div>
              <div className="text-xl font-bold text-gray-800 leading-none">{loading ? "—" : s.value}</div>
              <div className="text-xs text-gray-400 mt-1.5 font-medium">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-5 border-b border-gray-100 gap-4">
          {/* Status Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 self-start md:self-auto">
            {[
              { id: "ALL", label: "All Battles" },
              { id: "WAITING", label: "Waiting" },
              { id: "ACTIVE", label: "Active" },
              { id: "COMPLETED", label: "Completed" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleStatusTab(tab.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                  statusFilter === tab.id
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search battles, hosts, codes..."
              value={search}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 bg-gray-50/30"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">ID</th>
                <th className="py-3.5 px-6">Group Info</th>
                <th className="py-3.5 px-6">Created By</th>
                <th className="py-3.5 px-6 text-center">Entry Coins</th>
                <th className="py-3.5 px-6 text-center">Players</th>
                <th className="py-3.5 px-6 text-center">Total Pot</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Created At</th>
                <th className="py-3.5 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j} className="py-4 px-6">
                        <div
                          className="h-4 bg-gray-100 rounded animate-pulse"
                          style={{ width: j === 1 ? "140px" : j === 2 ? "120px" : "60px" }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-gray-400 text-sm">
                    <FiTarget className="text-4xl mx-auto mb-3 text-gray-200" />
                    No battles found matching the criteria.
                  </td>
                </tr>
              ) : (
                paginated.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition">
                    <td className="py-4 px-6 text-sm text-gray-400 font-mono">
                      #{b.id}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-gray-800 text-sm">
                        {b.groupName}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold uppercase bg-red-50 text-red-600 px-2 py-0.5 rounded">
                          {b.categoryName}
                        </span>
                        <span className="text-xs text-gray-400 font-mono bg-gray-50 border border-gray-100 px-1.5 rounded">
                          Invite: {b.inviteCode}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Avatar name={b.createdByName} pictureUrl={b.createdByPicture} />
                        <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]" title={b.createdByName}>
                          {b.createdByName}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-semibold text-gray-700">
                      {b.entryCoins} 🪙
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-gray-50 border border-gray-100 text-xs font-semibold text-gray-600">
                        <FiUsers className="text-[10px]" />
                        <span>{b.currentPlayers} / {b.maxPlayers}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-bold text-red-500">
                      {b.totalPotCoins} 🪙
                    </td>
                    <td className="py-4 px-6">
                      {statusBadge(b.status)}
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-500 font-mono">
                      {formatDate(b.createdAt)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Link
                        to={`/dashboard/coin-battles/${b.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition shadow-sm"
                      >
                        <FiEye /> View Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 text-sm text-gray-500 gap-4">
            <span>
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} battles
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <FiChevronLeft />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                      page === i + 1
                        ? "bg-red-500 text-white shadow-sm"
                        : "hover:bg-gray-100 text-gray-600"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <FiChevronRight />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoinBattles;
