import { useState, useEffect, useCallback } from "react";
import { getAllUsers, deactivateUser, activateUser, getReferralLeaderboard } from "../services/userService";
import { toast } from "react-toastify";
import {
  FiUsers,
  FiUserX,
  FiUserCheck,
  FiSearch,
  FiAward,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiMail,
  FiShield,
  FiAlertTriangle,
  FiX,
} from "react-icons/fi";
import { MdLeaderboard } from "react-icons/md";

const PAGE_SIZE = 10;

const statusBadge = (status) => {
  const isActive = status === "ACTIVE";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? "bg-emerald-500" : "bg-red-500"}`}
      />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
};

const roleBadge = (role) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600">
    <FiShield className="text-[10px]" />
    {role}
  </span>
);

const Avatar = ({ name, pictureUrl }) => {
  if (pictureUrl) {
    return (
      <img
        src={pictureUrl}
        alt={name}
        className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm"
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
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-sm">
      {initials}
    </div>
  );
};

const rankStyle = {
  1: { bg: "bg-amber-100", text: "text-amber-600", label: "🥇" },
  2: { bg: "bg-gray-100", text: "text-gray-500", label: "🥈" },
  3: { bg: "bg-orange-100", text: "text-orange-500", label: "🥉" },
};

/* ── Status Change Confirmation Modal ── */
const StatusModal = ({ user, onConfirm, onCancel, submitting }) => {
  if (!user) return null;
  const isActive = user.status === "ACTIVE";
  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={!submitting ? onCancel : undefined}
      />
      {/* modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* top colour bar */}
        <div className={`h-1.5 w-full ${isActive ? "bg-red-500" : "bg-emerald-500"}`} />

        <div className="p-6">
          {/* close */}
          <button
            onClick={onCancel}
            disabled={submitting}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition disabled:opacity-40"
          >
            <FiX />
          </button>

          {/* icon */}
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
              isActive ? "bg-red-50" : "bg-emerald-50"
            }`}
          >
            {isActive ? (
              <FiUserX className="text-2xl text-red-500" />
            ) : (
              <FiUserCheck className="text-2xl text-emerald-500" />
            )}
          </div>

          <h2 className="text-lg font-bold text-gray-800">
            {isActive ? "Deactivate User" : "Activate User"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {isActive
              ? "This will prevent the user from accessing the app."
              : "This will restore the user's access to the app."}
          </p>

          {/* user card */}
          <div className="mt-5 flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-800 truncate">{user.fullName || user.name}</div>
              <div className="text-xs text-gray-400 truncate">{user.email}</div>
            </div>
            <span
              className={`ml-auto shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? "bg-emerald-500" : "bg-red-500"}`} />
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>

          {/* warning note */}
          <div className={`mt-4 flex items-start gap-2.5 p-3 rounded-lg text-xs ${
            isActive ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
          }`}>
            <FiAlertTriangle className="shrink-0 mt-0.5" />
            <span>
              {isActive
                ? `Are you sure you want to deactivate "${user.name}"? They will lose access immediately.`
                : `Are you sure you want to activate "${user.name}"? They will regain full access.`}
            </span>
          </div>

          {/* actions */}
          <div className="mt-6 flex items-center gap-3 justify-end">
            <button
              onClick={onCancel}
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={submitting}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-60 disabled:cursor-not-allowed ${
                isActive
                  ? "bg-red-500 hover:bg-red-600 shadow-md shadow-red-200"
                  : "bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-200"
              }`}
            >
              {submitting ? (
                <FiRefreshCw className="animate-spin" />
              ) : isActive ? (
                <FiUserX />
              ) : (
                <FiUserCheck />
              )}
              {submitting
                ? isActive ? "Deactivating…" : "Activating…"
                : isActive ? "Yes, Deactivate" : "Yes, Activate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  /* ── status modal state ── */
  const [modalUser, setModalUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState("users"); // 'users' | 'leaderboard'
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  /* ── fetch users ── */
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllUsers();
      if (res.success) setUsers(res.data);
      else toast.error("Failed to load users");
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── fetch leaderboard ── */
  const fetchLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const res = await getReferralLeaderboard();
      if (res.success) setLeaderboard(res.data);
      else toast.error("Failed to load leaderboard");
    } catch {
      toast.error("Failed to load leaderboard");
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (activeTab === "leaderboard" && leaderboard.length === 0) {
      fetchLeaderboard();
    }
  }, [activeTab, fetchLeaderboard, leaderboard.length]);

  /* ── status change handler ── */
  const handleStatusChange = async () => {
    if (!modalUser) return;
    const isActive = modalUser.status === "ACTIVE";
    setSubmitting(true);
    try {
      const res = isActive
        ? await deactivateUser(modalUser.id)
        : await activateUser(modalUser.id);
      if (res.success) {
        const newStatus = isActive ? "INACTIVE" : "ACTIVE";
        toast.success(
          `${modalUser.name} has been ${isActive ? "deactivated" : "activated"}`
        );
        setUsers((prev) =>
          prev.map((u) =>
            u.id === modalUser.id ? { ...u, status: newStatus } : u
          )
        );
        setModalUser(null);
      }
    } catch {
      toast.error(`Failed to ${isActive ? "deactivate" : "activate"} user`);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── derived ── */
  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeCount = users.filter((u) => u.status === "ACTIVE").length;
  const inactiveCount = users.filter((u) => u.status !== "ACTIVE").length;

  /* ── reset to page 1 on search change ── */
  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div>
      {/* Status Change Modal */}
      <StatusModal
        user={modalUser}
        onConfirm={handleStatusChange}
        onCancel={() => !submitting && setModalUser(null)}
        submitting={submitting}
      />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Users Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage registered users and view referral performance
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          {
            label: "Total Users",
            value: users.length,
            icon: <FiUsers />,
            color: "text-indigo-500",
            bg: "bg-indigo-50",
          },
          {
            label: "Active Users",
            value: activeCount,
            icon: <FiUser />,
            color: "text-emerald-500",
            bg: "bg-emerald-50",
          },
          {
            label: "Inactive Users",
            value: inactiveCount,
            icon: <FiUserX />,
            color: "text-red-500",
            bg: "bg-red-50",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-4 p-5 bg-white rounded-xl shadow-sm hover:-translate-y-0.5 hover:shadow-md transition"
          >
            <div
              className={`w-12 h-12 rounded-xl ${s.bg} ${s.color} flex items-center justify-center text-xl shrink-0`}
            >
              {s.icon}
            </div>
            <div>
              <div className="text-xl font-bold text-gray-800">{loading ? "—" : s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 gap-4 flex-wrap">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition ${
                activeTab === "users"
                  ? "bg-white shadow text-gray-800"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FiUsers className="text-base" /> All Users
            </button>
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition ${
                activeTab === "leaderboard"
                  ? "bg-white shadow text-gray-800"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <MdLeaderboard className="text-base" /> Referral Leaderboard
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {activeTab === "users" ? (
              <div className="relative flex-1 sm:flex-none">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={handleSearch}
                  className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 w-full sm:w-56"
                />
              </div>
            ) : (
              <button
                onClick={fetchLeaderboard}
                disabled={leaderboardLoading}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                <FiRefreshCw className={`text-sm ${leaderboardLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            )}
          </div>
        </div>

        {/* ── Users Table ── */}
        {activeTab === "users" && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">#</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">User</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      <span className="flex items-center gap-1"><FiMail className="text-xs" /> Email</span>
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Role</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 6 }).map((__, j) => (
                          <td key={j} className="px-5 py-3.5">
                            <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: j === 1 ? "160px" : "80px" }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center text-gray-400 text-sm">
                        <FiUsers className="text-4xl mx-auto mb-3 text-gray-200" />
                        {search ? "No users match your search." : "No users found."}
                      </td>
                    </tr>
                  ) : (
                    paginated.map((user, idx) => (
                      <tr key={user.id} className="hover:bg-gray-50/70 transition">
                        <td className="px-5 py-3.5 text-sm text-gray-400">
                          {(page - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={user.name} pictureUrl={user.pictureUrl} />
                            <div>
                              <div className="text-sm font-semibold text-gray-800 leading-tight">
                                {user.fullName || user.name}
                              </div>
                              {user.fullName && user.name !== user.fullName && (
                                <div className="text-xs text-gray-400">@{user.name}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-600">{user.email}</td>
                        <td className="px-5 py-3.5">{roleBadge(user.role)}</td>
                        <td className="px-5 py-3.5">{statusBadge(user.status)}</td>
                        <td className="px-5 py-3.5">
                          {user.status === "ACTIVE" ? (
                            <button
                              onClick={() => setModalUser(user)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition"
                            >
                              <FiUserX /> Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => setModalUser(user)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition"
                            >
                              <FiUserCheck /> Activate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && filtered.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 text-sm text-gray-500">
                <span>
                  Showing {(page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} users
                </span>
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
                          ? "bg-red-600 text-white shadow"
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
              </div>
            )}
          </>
        )}

        {/* ── Leaderboard Tab ── */}
        {activeTab === "leaderboard" && (
          <div>
            {leaderboardLoading ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Rank</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">User</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Referral Code</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Referrals</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 4 }).map((__, j) => (
                          <td key={j} className="px-5 py-3.5">
                            <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: j === 1 ? "160px" : "80px" }} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-sm">
                <MdLeaderboard className="text-4xl mx-auto mb-3 text-gray-200" />
                No referral data available.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Rank</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">User</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Referral Code</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Referrals</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {leaderboard.map((entry) => {
                      const rs = rankStyle[entry.rank] || { bg: "bg-gray-50", text: "text-gray-500", label: `#${entry.rank}` };
                      return (
                        <tr key={entry.userId} className="hover:bg-gray-50/70 transition">
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${rs.bg} ${rs.text}`}
                            >
                              {entry.rank <= 3 ? rs.label : `#${entry.rank}`}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <Avatar name={entry.username} />
                              <span className="text-sm font-semibold text-gray-800">{entry.username}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-mono text-sm bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md">
                              {entry.referralCode}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-800">{entry.totalReferrals}</span>
                              <span className="text-xs text-gray-400">referrals</span>
                              {entry.rank === 1 && (
                                <FiAward className="text-amber-500 text-base" />
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
        )}
      </div>
    </div>
  );
};

export default Users;
