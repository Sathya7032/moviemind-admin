import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserSummaryById, deactivateUser, activateUser } from "../services/userService";
import { toast } from "react-toastify";
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiShield,
  FiCalendar,
  FiAward,
  FiShare2,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiRefreshCw,
  FiUserCheck,
  FiUserX,
  FiFileText,
  FiActivity,
} from "react-icons/fi";

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

const Avatar = ({ name, pictureUrl, size = "large" }) => {
  const sizeClasses = size === "large" ? "w-20 h-20 text-2xl" : "w-10 h-10 text-sm";
  if (pictureUrl) {
    return (
      <img
        src={pictureUrl}
        alt={name}
        className={`${sizeClasses} rounded-full object-cover ring-4 ring-white shadow-md`}
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
    <div className={`${sizeClasses} rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold ring-4 ring-white shadow-md shrink-0`}>
      {initials}
    </div>
  );
};

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("rewards"); // 'rewards' | 'referred'
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  // Pagination for reward transactions and referred users
  const [rewardsPage, setRewardsPage] = useState(1);
  const [referredPage, setReferredPage] = useState(1);
  const pageSize = 10;

  const fetchUserSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUserSummaryById(id);
      if (res.success) {
        setSummary(res.data);
      } else {
        toast.error("Failed to load user summary");
        navigate("/dashboard/users");
      }
    } catch (err) {
      toast.error("Error fetching user details");
      navigate("/dashboard/users");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchUserSummary();
  }, [fetchUserSummary]);

  const handleStatusToggle = async () => {
    if (!summary || !summary.userDetails) return;
    const user = summary.userDetails;
    const isActive = user.status === "ACTIVE";
    setStatusSubmitting(true);
    try {
      const res = isActive
        ? await deactivateUser(user.id)
        : await activateUser(user.id);
      if (res.success) {
        toast.success(
          `${user.name} has been ${isActive ? "deactivated" : "activated"}`
        );
        // Update local state
        setSummary((prev) => ({
          ...prev,
          userDetails: {
            ...prev.userDetails,
            status: isActive ? "INACTIVE" : "ACTIVE",
          },
        }));
      }
    } catch {
      toast.error(`Failed to change user status`);
    } finally {
      setStatusSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <FiRefreshCw className="animate-spin text-4xl text-red-500 mb-4" />
        <span className="text-gray-500 font-medium">Loading user details...</span>
      </div>
    );
  }

  if (!summary || !summary.userDetails) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">User data could not be found.</p>
        <button
          onClick={() => navigate("/dashboard/users")}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          <FiArrowLeft /> Back to Users List
        </button>
      </div>
    );
  }

  const { userDetails, referredUsers = [], rewardTransactions = [] } = summary;

  // Stats calculation
  const totalCoins = rewardTransactions.reduce((acc, curr) => acc + (curr.rewardCoins || 0), 0);
  const correctAttempts = rewardTransactions.filter((t) => t.correctAnswer).length;
  const totalAttempts = rewardTransactions.length;
  const accuracyRate = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
  const totalReferrals = referredUsers.length;

  // Paginated reward transactions
  const totalRewardsPages = Math.ceil(rewardTransactions.length / pageSize) || 1;
  const paginatedRewards = rewardTransactions.slice(
    (rewardsPage - 1) * pageSize,
    rewardsPage * pageSize
  );

  // Paginated referred users
  const totalReferredPages = Math.ceil(referredUsers.length / pageSize) || 1;
  const paginatedReferred = referredUsers.slice(
    (referredPage - 1) * pageSize,
    referredPage * pageSize
  );

  const isActive = userDetails.status === "ACTIVE";

  return (
    <div className="max-w-7xl mx-auto px-1 py-1">
      {/* Back & Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard/users")}
            className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition shadow-sm"
            title="Back to Users"
          >
            <FiArrowLeft className="text-lg" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">User Profile</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Detailed breakdown of user status, rewards, and referral performance
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleStatusToggle}
          disabled={statusSubmitting}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-sm disabled:opacity-75 disabled:cursor-not-allowed ${
            isActive
              ? "bg-red-500 hover:bg-red-600 shadow-red-100"
              : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100"
          }`}
        >
          {statusSubmitting ? (
            <FiRefreshCw className="animate-spin" />
          ) : isActive ? (
            <FiUserX />
          ) : (
            <FiUserCheck />
          )}
          {isActive ? "Deactivate User" : "Activate User"}
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {[
          {
            label: "Total Coins Earned",
            value: `${totalCoins} 🪙`,
            icon: <FiAward />,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "Accuracy Rate",
            value: `${accuracyRate}%`,
            icon: <FiActivity />,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
          {
            label: "Total Referrals",
            value: totalReferrals,
            icon: <FiShare2 />,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Questions Attempted",
            value: totalAttempts,
            icon: <FiFileText />,
            color: "text-sky-600",
            bg: "bg-sky-50",
          },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition duration-200"
          >
            <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center text-xl shrink-0`}>
              {stat.icon}
            </div>
            <div>
              <div className="text-xl font-bold text-gray-800 leading-tight">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Profile Card & Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column - Personal Info */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header Accent */}
          <div className={`h-2.5 w-full ${isActive ? "bg-emerald-500" : "bg-red-500"}`} />
          
          <div className="p-6 flex flex-col items-center border-b border-gray-100">
            <Avatar name={userDetails.name} pictureUrl={userDetails.pictureUrl} size="large" />
            <h2 className="text-lg font-bold text-gray-800 mt-4 text-center">
              {userDetails.fullName || userDetails.name}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">ID: {userDetails.id}</p>
            
            <div className="mt-3.5 flex flex-wrap gap-2 justify-center">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                {isActive ? "Active" : "Inactive"}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600">
                <FiShield className="mr-1 text-[10px]" /> {userDetails.role}
              </span>
              {userDetails.provider && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                  {userDetails.provider}
                </span>
              )}
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Email Address</div>
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-700 font-medium truncate">
                <FiMail className="text-gray-400 shrink-0" />
                <span className="truncate" title={userDetails.email}>{userDetails.email}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Referral Code</div>
                <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-700 font-semibold font-mono">
                  <FiShare2 className="text-gray-400 text-xs" />
                  <span>{userDetails.referralCode || "—"}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Referred By</div>
                <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-700 font-semibold font-mono">
                  <FiUser className="text-gray-400 text-xs" />
                  <span>{userDetails.referredByCode || "—"}</span>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 flex items-center gap-1"><FiCalendar /> Joined</span>
                <span className="text-gray-600 font-medium">{formatDate(userDetails.createdTime)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 flex items-center gap-1"><FiClock /> Last Active</span>
                <span className="text-gray-600 font-medium">{formatDate(userDetails.updatedTime)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Tabs & Details lists */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Tabs Header */}
            <div className="flex border-b border-gray-100 bg-gray-50/50">
              <button
                onClick={() => setActiveTab("rewards")}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition border-b-2 ${
                  activeTab === "rewards"
                    ? "border-red-500 text-red-600 bg-white"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <FiAward /> Reward Transactions ({rewardTransactions.length})
              </button>
              <button
                onClick={() => setActiveTab("referred")}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition border-b-2 ${
                  activeTab === "referred"
                    ? "border-red-500 text-red-600 bg-white"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <FiUser /> Referred Users ({referredUsers.length})
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6">
              {/* Tab 1: Rewards */}
              {activeTab === "rewards" && (
                <div>
                  {rewardTransactions.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-sm">
                      <FiAward className="text-4xl mx-auto mb-3 text-gray-200" />
                      No reward transactions recorded for this user.
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                              <th className="py-3 px-2">Q#</th>
                              <th className="py-3 px-4">Question Text</th>
                              <th className="py-3 px-3">Result</th>
                              <th className="py-3 px-3">Coins</th>
                              <th className="py-3 px-4 text-right">Attempted At</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {paginatedRewards.map((t, idx) => (
                              <tr key={idx} className="hover:bg-gray-50/50 transition">
                                <td className="py-3.5 px-2 text-sm text-gray-500 font-medium">
                                  {t.questionNumber ? `#${t.questionNumber}` : t.questionId || "—"}
                                </td>
                                <td className="py-3.5 px-4 text-sm text-gray-800 font-medium max-w-[280px] truncate" title={t.questionText || ""}>
                                  {t.questionText || "Daily Quiz/Special Challenge"}
                                </td>
                                <td className="py-3.5 px-3">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    t.correctAnswer ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                                  }`}>
                                    {t.correctAnswer ? (
                                      <>
                                        <FiCheckCircle className="text-xs shrink-0" />
                                        Correct
                                      </>
                                    ) : (
                                      <>
                                        <FiXCircle className="text-xs shrink-0" />
                                        Incorrect
                                      </>
                                    )}
                                  </span>
                                </td>
                                <td className="py-3.5 px-3 text-sm text-gray-800 font-bold">
                                  {t.rewardCoins > 0 ? `+${t.rewardCoins}` : t.rewardCoins} 🪙
                                </td>
                                <td className="py-3.5 px-4 text-xs text-gray-500 font-mono text-right">
                                  {formatDate(t.attemptedAt)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      {totalRewardsPages > 1 && (
                        <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100 text-sm text-gray-500">
                          <span>
                            Page {rewardsPage} of {totalRewardsPages}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setRewardsPage((p) => Math.max(1, p - 1))}
                              disabled={rewardsPage === 1}
                              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                              Previous
                            </button>
                            <button
                              onClick={() => setRewardsPage((p) => Math.min(totalRewardsPages, p + 1))}
                              disabled={rewardsPage === totalRewardsPages}
                              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Tab 2: Referred Users */}
              {activeTab === "referred" && (
                <div>
                  {referredUsers.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-sm">
                      <FiUser className="text-4xl mx-auto mb-3 text-gray-200" />
                      No users have registered with this user's referral code.
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                              <th className="py-3 px-4">#</th>
                              <th className="py-3 px-4">User</th>
                              <th className="py-3 px-4">Email</th>
                              <th className="py-3 px-4 text-right">User ID</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {paginatedReferred.map((refUser, idx) => (
                              <tr key={refUser.userId} className="hover:bg-gray-50/50 transition">
                                <td className="py-3.5 px-4 text-sm text-gray-500">
                                  {(referredPage - 1) * pageSize + idx + 1}
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-3">
                                    <Avatar name={refUser.name} size="small" />
                                    <span className="text-sm font-semibold text-gray-800">{refUser.name}</span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 text-sm text-gray-600">
                                  {refUser.email}
                                </td>
                                <td className="py-3.5 px-4 text-xs font-mono text-gray-500 text-right">
                                  {refUser.userId}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      {totalReferredPages > 1 && (
                        <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100 text-sm text-gray-500">
                          <span>
                            Page {referredPage} of {totalReferredPages}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setReferredPage((p) => Math.max(1, p - 1))}
                              disabled={referredPage === 1}
                              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                              Previous
                            </button>
                            <button
                              onClick={() => setReferredPage((p) => Math.min(totalReferredPages, p + 1))}
                              disabled={referredPage === totalReferredPages}
                              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;
