import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  getDailyQuizAttemptsStats,
  getDailyChallengeParticipations,
  getTopUsersByChallengeAttempts,
  getUserDailyChallengeHistory,
} from "../services/activityTrackingService";
import {
  FiTrendingUp,
  FiCalendar,
  FiHelpCircle,
  FiZap,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiRefreshCw,
  FiEye,
} from "react-icons/fi";

/* ── helpers ── */
const formatDate = (dateString) => {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleDateString("en-IN", {
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

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const statusBadge = (status) => {
  const isCompleted = status === "COMPLETED" || status === "SUCCESS" || status === "APPROVED";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        isCompleted ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-600"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isCompleted ? "bg-emerald-500" : "bg-amber-500"}`}
      />
      {status === "COMPLETED" ? "Completed" : status === "STARTED" ? "Started" : status}
    </span>
  );
};

const renderPageNumbers = (currentPage, totalPages, onPageClick, activeColorClass = "bg-red-600") => {
  if (totalPages <= 1) return null;

  const pages = [];
  if (totalPages <= 6) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1, 2, 3);
    pages.push("...");
    pages.push(totalPages - 2, totalPages - 1, totalPages);
  }

  return (
    <>
      {pages.map((p, idx) => {
        if (p === "...") {
          return (
            <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 text-sm select-none">
              ...
            </span>
          );
        }
        return (
          <button
            key={`page-${p}`}
            onClick={() => onPageClick(p)}
            className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
              currentPage === p
                ? `${activeColorClass} text-white shadow`
                : "hover:bg-gray-100 text-gray-600"
            }`}
          >
            {p}
          </button>
        );
      })}
    </>
  );
};

/* ── User Challenge History Modal ── */
const UserHistoryModal = ({ user, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await getUserDailyChallengeHistory(user.id, page - 1, pageSize);
      if (res.success && res.data) {
        setHistory(res.data.content || []);
        setTotalElements(res.data.totalElements || 0);
      } else {
        toast.error("Failed to load challenge history");
      }
    } catch {
      toast.error("Failed to load challenge history");
    } finally {
      setLoading(false);
    }
  }, [user, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  if (!user) return null;

  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />

      {/* modal window */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg">
              <FiClock />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">Challenge Participation History</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Showing activity for user: <strong className="text-gray-700">{user.name}</strong> (ID: {user.id})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <FiX />
          </button>
        </div>

        {/* content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left border-b border-gray-100">
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Challenge ID</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Challenge Title</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Correct Answers</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Coins Earned</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Started At</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Completed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 4 }).map((_, idx) => (
                    <tr key={idx}>
                      {Array.from({ length: 7 }).map((__, colIdx) => (
                        <td key={colIdx} className="px-5 py-3">
                          <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-gray-400 text-sm">
                      No challenge history found for this user.
                    </td>
                  </tr>
                ) : (
                  history.map((h, index) => (
                    <tr key={index} className="hover:bg-gray-50/50 transition">
                      <td className="px-5 py-3 text-sm text-gray-500 font-mono">#{h.eventId}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-gray-800">{h.eventTitle || "—"}</td>
                      <td className="px-5 py-3 text-sm">{statusBadge(h.status)}</td>
                      <td className="px-5 py-3 text-sm font-bold text-gray-700">{h.correctCount ?? 0}</td>
                      <td className="px-5 py-3 text-sm font-bold text-emerald-600">
                        {h.coinsEarned ?? 0} <span className="text-xs text-gray-400 font-normal">🪙</span>
                      </td>
                      <td className="px-5 py-3 text-xs font-mono text-gray-500">{formatDate(h.startedAt)}</td>
                      <td className="px-5 py-3 text-xs font-mono text-gray-500">{formatDate(h.completedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* pagination footer */}
        {!loading && totalElements > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 text-sm text-gray-500 gap-3 bg-gray-50/30">
            <div className="flex items-center gap-4 flex-wrap">
              <span>
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalElements)} of {totalElements} entries
              </span>
              <div className="flex items-center gap-1.5">
                <label htmlFor="modalPageSize" className="text-gray-400">Rows:</label>
                <select
                  id="modalPageSize"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="border border-gray-200 rounded-md text-xs px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-white"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <FiChevronLeft /> Prev
              </button>
              {renderPageNumbers(page, totalPages, setPage, "bg-indigo-600")}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                Next <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const UserAnalytics = () => {
  const [activeTab, setActiveTab] = useState("challengesLeaderboard"); // 'challengesLeaderboard' | 'quizAttempts' | 'challengeParticipations'

  /* --- Daily Challenge Leaderboard State --- */
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardPage, setLeaderboardPage] = useState(1);
  const [leaderboardPageSize, setLeaderboardPageSize] = useState(20);
  const [leaderboardTotal, setLeaderboardTotal] = useState(0);

  /* --- Daily Quiz Attempts State --- */
  const [quizDate, setQuizDate] = useState(getTodayDateString());
  const [quizStats, setQuizStats] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizPage, setQuizPage] = useState(1);
  const [quizPageSize, setQuizPageSize] = useState(20);
  const [quizTotal, setQuizTotal] = useState(0);

  /* --- Daily Challenge Participations State --- */
  const [challengeDate, setChallengeDate] = useState(getTodayDateString());
  const [participations, setParticipations] = useState([]);
  const [participationsLoading, setParticipationsLoading] = useState(false);
  const [challengePage, setChallengePage] = useState(1);
  const [challengePageSize, setChallengePageSize] = useState(20);
  const [challengeTotal, setChallengeTotal] = useState(0);

  /* --- Modal State --- */
  const [selectedUser, setSelectedUser] = useState(null);

  /* --- Leaderboard Fetch --- */
  const fetchLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const res = await getTopUsersByChallengeAttempts(leaderboardPage - 1, leaderboardPageSize);
      if (res.success && res.data) {
        setLeaderboard(res.data.content || []);
        setLeaderboardTotal(res.data.totalElements || 0);
      } else {
        toast.error("Failed to load leaderboard");
      }
    } catch {
      toast.error("Failed to load leaderboard");
    } finally {
      setLeaderboardLoading(false);
    }
  }, [leaderboardPage, leaderboardPageSize]);

  /* --- Quiz Stats Fetch --- */
  const fetchQuizStats = useCallback(async () => {
    setQuizLoading(true);
    try {
      const res = await getDailyQuizAttemptsStats(quizDate, quizPage - 1, quizPageSize);
      if (res.success && res.data) {
        setQuizStats(res.data.content || []);
        setQuizTotal(res.data.totalElements || 0);
      } else {
        toast.error("Failed to load quiz statistics");
      }
    } catch {
      toast.error("Failed to load quiz statistics");
    } finally {
      setQuizLoading(false);
    }
  }, [quizDate, quizPage, quizPageSize]);

  /* --- Challenge Participations Fetch --- */
  const fetchParticipations = useCallback(async () => {
    setParticipationsLoading(true);
    try {
      const res = await getDailyChallengeParticipations(challengeDate, challengePage - 1, challengePageSize);
      if (res.success && res.data) {
        setParticipations(res.data.content || []);
        setChallengeTotal(res.data.totalElements || 0);
      } else {
        toast.error("Failed to load challenge participations");
      }
    } catch {
      toast.error("Failed to load challenge participations");
    } finally {
      setParticipationsLoading(false);
    }
  }, [challengeDate, challengePage, challengePageSize]);

  /* --- Mount & Tab Toggles --- */
  useEffect(() => {
    if (activeTab === "challengesLeaderboard") {
      fetchLeaderboard();
    }
  }, [activeTab, fetchLeaderboard]);

  useEffect(() => {
    if (activeTab === "quizAttempts") {
      fetchQuizStats();
    }
  }, [activeTab, fetchQuizStats]);

  useEffect(() => {
    if (activeTab === "challengeParticipations") {
      fetchParticipations();
    }
  }, [activeTab, fetchParticipations]);

  return (
    <div>
      {/* Modal Overlay */}
      {selectedUser && (
        <UserHistoryModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">User Analytics &amp; Tracking</h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor daily challenge leaderboard, quiz statistics, and live user participations.
        </p>
      </div>

      {/* Tab Controls */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="flex border-b border-gray-100 overflow-x-auto p-1 bg-gray-50/50">
          {[
            {
              id: "challengesLeaderboard",
              label: "Daily Challenges Leaderboard",
              icon: <FiTrendingUp />,
            },
            {
              id: "quizAttempts",
              label: "Daily Quiz Attempts Stats",
              icon: <FiHelpCircle />,
            },
            {
              id: "challengeParticipations",
              label: "Daily Challenge Participations",
              icon: <FiZap />,
            },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold whitespace-nowrap transition border-b-2 outline-none ${
                  isActive
                    ? "border-red-600 text-red-600 bg-white shadow-sm rounded-t-lg"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TAB 1: Daily Challenges Leaderboard ── */}
      {activeTab === "challengesLeaderboard" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-800">Challenge Attempts Leaderboard</h3>
            <button
              onClick={fetchLeaderboard}
              disabled={leaderboardLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
            >
              <FiRefreshCw className={leaderboardLoading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left border-b border-gray-100">
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Rank</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">User ID</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">User Name</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Attempts</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leaderboardLoading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={idx}>
                      {Array.from({ length: 5 }).map((__, colIdx) => (
                        <td key={colIdx} className="px-6 py-4">
                          <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-gray-400 text-sm">
                      No leaderboard data found.
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((entry, idx) => {
                    const rank = (leaderboardPage - 1) * leaderboardPageSize + idx + 1;
                    let rankBadge = rank;
                    if (rank === 1) rankBadge = "🥇";
                    else if (rank === 2) rankBadge = "🥈";
                    else if (rank === 3) rankBadge = "🥉";

                    return (
                      <tr key={entry.userId} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-4 text-sm font-bold text-gray-600">{rankBadge}</td>
                        <td className="px-6 py-4 text-sm font-mono text-gray-500">#{entry.userId}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-sm shrink-0">
                              {entry.userName?.charAt(0).toUpperCase() || "?"}
                            </div>
                            <span>{entry.userName || "—"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-800">
                          {entry.totalChallengesAttempted ?? 0} attempts
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => setSelectedUser({ id: entry.userId, name: entry.userName })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition"
                          >
                            <FiEye /> View History
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {!leaderboardLoading && leaderboardTotal > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 text-sm text-gray-500 gap-4 bg-gray-50/20">
              <div className="flex items-center gap-4 flex-wrap">
                <span>
                  Showing {(leaderboardPage - 1) * leaderboardPageSize + 1}–
                  {Math.min(leaderboardPage * leaderboardPageSize, leaderboardTotal)} of {leaderboardTotal} entries
                </span>
                <div className="flex items-center gap-2">
                  <label htmlFor="lbPageSize" className="text-gray-400">Rows per page:</label>
                  <select
                    id="lbPageSize"
                    value={leaderboardPageSize}
                    onChange={(e) => {
                      setLeaderboardPageSize(Number(e.target.value));
                      setLeaderboardPage(1);
                    }}
                    className="border border-gray-200 rounded-md text-sm px-2 py-1 focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setLeaderboardPage((p) => Math.max(1, p - 1))}
                  disabled={leaderboardPage === 1}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <FiChevronLeft /> Prev
                </button>
                {renderPageNumbers(leaderboardPage, Math.max(1, Math.ceil(leaderboardTotal / leaderboardPageSize)), setLeaderboardPage, "bg-red-600")}
                <button
                  onClick={() => setLeaderboardPage((p) => Math.min(Math.max(1, Math.ceil(leaderboardTotal / leaderboardPageSize)), p + 1))}
                  disabled={leaderboardPage === Math.max(1, Math.ceil(leaderboardTotal / leaderboardPageSize))}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next <FiChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: Daily Quiz Attempts Stats ── */}
      {activeTab === "quizAttempts" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Controls */}
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-600 flex items-center gap-1.5">
                <FiCalendar /> Date Select:
              </span>
              <input
                type="date"
                value={quizDate}
                onChange={(e) => {
                  setQuizDate(e.target.value);
                  setQuizPage(1);
                }}
                className="px-3.5 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </div>
            <button
              onClick={fetchQuizStats}
              disabled={quizLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
            >
              <FiRefreshCw className={quizLoading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left border-b border-gray-100">
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Question ID</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Question Text</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Attempts</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Correct Attempts</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Success Accuracy Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {quizLoading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={idx}>
                      {Array.from({ length: 5 }).map((__, colIdx) => (
                        <td key={colIdx} className="px-6 py-4">
                          <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : quizStats.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-gray-400 text-sm">
                      No quiz statistics recorded for {quizDate || "this date"}.
                    </td>
                  </tr>
                ) : (
                  quizStats.map((stat) => {
                    const accuracy = stat.totalAttempts > 0 ? Math.round((stat.correctAttempts / stat.totalAttempts) * 100) : 0;
                    return (
                      <tr key={stat.questionId} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-4 text-sm font-mono text-gray-500">#{stat.questionId}</td>
                        <td className="px-6 py-4 text-sm text-gray-800 font-semibold truncate max-w-[280px]">
                          {stat.questionText || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-700">{stat.totalAttempts ?? 0}</td>
                        <td className="px-6 py-4 text-sm font-bold text-emerald-600">{stat.correctAttempts ?? 0}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-gray-800 w-10 shrink-0 text-right">{accuracy}%</span>
                            <div className="w-24 bg-gray-100 rounded-full h-2 overflow-hidden shrink-0">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  accuracy >= 75
                                    ? "bg-emerald-500"
                                    : accuracy >= 40
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                                }`}
                                style={{ width: `${accuracy}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {!quizLoading && quizTotal > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 text-sm text-gray-500 gap-4 bg-gray-50/20">
              <div className="flex items-center gap-4 flex-wrap">
                <span>
                  Showing {(quizPage - 1) * quizPageSize + 1}–
                  {Math.min(quizPage * quizPageSize, quizTotal)} of {quizTotal} entries
                </span>
                <div className="flex items-center gap-2">
                  <label htmlFor="quizPageSize" className="text-gray-400">Rows per page:</label>
                  <select
                    id="quizPageSize"
                    value={quizPageSize}
                    onChange={(e) => {
                      setQuizPageSize(Number(e.target.value));
                      setQuizPage(1);
                    }}
                    className="border border-gray-200 rounded-md text-sm px-2 py-1 focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setQuizPage((p) => Math.max(1, p - 1))}
                  disabled={quizPage === 1}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <FiChevronLeft /> Prev
                </button>
                {renderPageNumbers(quizPage, Math.max(1, Math.ceil(quizTotal / quizPageSize)), setQuizPage, "bg-red-600")}
                <button
                  onClick={() => setQuizPage((p) => Math.min(Math.max(1, Math.ceil(quizTotal / quizPageSize)), p + 1))}
                  disabled={quizPage === Math.max(1, Math.ceil(quizTotal / quizPageSize))}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next <FiChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: Daily Challenge Participations ── */}
      {activeTab === "challengeParticipations" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Controls */}
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-600 flex items-center gap-1.5">
                <FiCalendar /> Date Select:
              </span>
              <input
                type="date"
                value={challengeDate}
                onChange={(e) => {
                  setChallengeDate(e.target.value);
                  setChallengePage(1);
                }}
                className="px-3.5 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </div>
            <button
              onClick={fetchParticipations}
              disabled={participationsLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
            >
              <FiRefreshCw className={participationsLoading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left border-b border-gray-100">
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">User</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Challenge ID</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Challenge Title</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Correct Answers</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Coins Earned</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Started At</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Completed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {participationsLoading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={idx}>
                      {Array.from({ length: 8 }).map((__, colIdx) => (
                        <td key={colIdx} className="px-6 py-4">
                          <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : participations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-gray-400 text-sm">
                      No challenge participation records found for {challengeDate || "this date"}.
                    </td>
                  </tr>
                ) : (
                  participations.map((p, index) => (
                    <tr key={index} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-sm shrink-0">
                            {p.userName?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-800 leading-tight">{p.userName || "—"}</div>
                            <div className="text-[11px] font-mono text-gray-400 mt-0.5">ID: {p.userId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-500">#{p.eventId}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-800">{p.eventTitle || "—"}</td>
                      <td className="px-6 py-4 text-sm">{statusBadge(p.status)}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-700">{p.correctCount ?? 0}</td>
                      <td className="px-6 py-4 text-sm font-bold text-emerald-600">
                        {p.coinsEarned ?? 0} <span className="text-xs text-gray-400 font-normal">🪙</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-gray-500">{formatDate(p.startedAt)}</td>
                      <td className="px-6 py-4 text-xs font-mono text-gray-500">{formatDate(p.completedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {!participationsLoading && challengeTotal > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 text-sm text-gray-500 gap-4 bg-gray-50/20">
              <div className="flex items-center gap-4 flex-wrap">
                <span>
                  Showing {(challengePage - 1) * challengePageSize + 1}–
                  {Math.min(challengePage * challengePageSize, challengeTotal)} of {challengeTotal} entries
                </span>
                <div className="flex items-center gap-2">
                  <label htmlFor="chPageSize" className="text-gray-400">Rows per page:</label>
                  <select
                    id="chPageSize"
                    value={challengePageSize}
                    onChange={(e) => {
                      setChallengePageSize(Number(e.target.value));
                      setChallengePage(1);
                    }}
                    className="border border-gray-200 rounded-md text-sm px-2 py-1 focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setChallengePage((p) => Math.max(1, p - 1))}
                  disabled={challengePage === 1}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <FiChevronLeft /> Prev
                </button>
                {renderPageNumbers(challengePage, Math.max(1, Math.ceil(challengeTotal / challengePageSize)), setChallengePage, "bg-red-600")}
                <button
                  onClick={() => setChallengePage((p) => Math.min(Math.max(1, Math.ceil(challengeTotal / challengePageSize)), p + 1))}
                  disabled={challengePage === Math.max(1, Math.ceil(challengeTotal / challengePageSize))}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next <FiChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserAnalytics;
