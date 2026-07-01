import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { getAllSpins } from "../services/spinService";
import {
  FiRefreshCw,
  FiAward,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiTarget
} from "react-icons/fi";

const formatDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
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

const Spins = () => {
  const [spins, setSpins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(15);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchSpins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllSpins(page, size);
      if (res.success && res.data) {
        setSpins(res.data.content || []);
        setTotalPages(res.data.totalPages || 0);
        setTotalElements(res.data.totalElements || 0);
      } else {
        toast.error("Failed to load spin history");
      }
    } catch {
      toast.error("Error loading spin history");
    } finally {
      setLoading(false);
    }
  }, [page, size]);

  useEffect(() => {
    fetchSpins();
  }, [fetchSpins]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Spin Wheel Rewards</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track user spin activities, outcomes, and rewards won
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSpins}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-50 shadow-sm"
          >
            <FiRefreshCw className={`text-sm ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-4 p-5 bg-white rounded-xl shadow-sm hover:-translate-y-0.5 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center text-xl shrink-0">
            <FiTarget />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-800">{loading ? "—" : totalElements}</div>
            <div className="text-xs text-gray-500 mt-0.5">Total Spins</div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 p-5 bg-white rounded-xl shadow-sm hover:-translate-y-0.5 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center text-xl shrink-0">
            <FiAward />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-800">
              {loading ? "—" : spins.reduce((sum, spin) => sum + (spin.coinsWon || 0), 0)}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Coins Won (This Page)</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">ID</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  <span className="flex items-center gap-1"><FiUser className="text-xs" /> User</span>
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Outcome</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Coins Won</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  <span className="flex items-center gap-1"><FiCalendar className="text-xs" /> Spin Date</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: j === 1 ? "120px" : "80px" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : spins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-gray-400 text-sm">
                    <FiTarget className="text-4xl mx-auto mb-3 text-gray-200" />
                    No spin records found.
                  </td>
                </tr>
              ) : (
                spins.map((spin) => (
                  <tr key={spin.id} className="hover:bg-gray-50/70 transition">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                        #{spin.id}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-semibold text-gray-800">
                        {spin.username || `User #${spin.userId}`}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        {spin.outcome || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100">
                        {spin.coinsWon || 0} Coins
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 font-mono">
                      {formatDate(spin.createdTime || spin.spinDate)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {!loading && totalElements > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-4 border-t border-gray-100 text-sm text-gray-500 gap-4">
            <div className="flex items-center gap-2">
              <span>
                Showing {page * size + 1}–
                {Math.min((page + 1) * size, totalElements)} of {totalElements} spins
              </span>
              <select
                value={size}
                onChange={(e) => {
                  setSize(Number(e.target.value));
                  setPage(0);
                }}
                className="border border-gray-200 rounded-md text-sm px-2 py-1 focus:outline-none focus:ring-2 focus:ring-red-300 bg-white text-gray-700 ml-2"
              >
                <option value={15}>15</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
              </select>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <FiChevronLeft />
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: totalPages }).map((_, i) => {
                  if (
                    i === 0 ||
                    i === totalPages - 1 ||
                    (i >= page - 1 && i <= page + 1)
                  ) {
                    return (
                      <button
                        key={i}
                        onClick={() => setPage(i)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                          page === i
                            ? "bg-red-600 text-white shadow"
                            : "hover:bg-gray-100 text-gray-600"
                        }`}
                      >
                        {i + 1}
                      </button>
                    );
                  } else if (
                    (i === 1 && page > 2) ||
                    (i === totalPages - 2 && page < totalPages - 3)
                  ) {
                    return <span key={i} className="px-1 text-gray-400">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Spins;
