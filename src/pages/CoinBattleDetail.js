import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAdminBattleDetails, completeBattle } from "../services/coinBattleService";
import { toast } from "react-toastify";
import {
  FiArrowLeft,
  FiUsers,
  FiHelpCircle,
  FiAward,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiFileText,
  FiCheck,
  FiSearch,
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

const statusBadge = (status) => {
  let classes = "bg-gray-100 text-gray-700";
  let label = status;

  if (status === "WAITING") {
    classes = "bg-blue-100 text-blue-700 border border-blue-200";
    label = "Waiting for Players";
  } else if (status === "ACTIVE") {
    classes = "bg-amber-100 text-amber-700 border border-amber-200 animate-pulse";
    label = "Active / In Progress";
  } else if (status === "COMPLETED") {
    classes = "bg-emerald-100 text-emerald-700 border border-emerald-200";
    label = "Completed";
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${classes}`}>
      {label}
    </span>
  );
};

const Avatar = ({ name, pictureUrl, size = "md" }) => {
  const sizeClass = size === "lg" ? "w-16 h-16 text-xl" : "w-9 h-9 text-xs";
  if (pictureUrl) {
    return (
      <img
        src={pictureUrl}
        alt={name}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-white shadow-sm`}
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
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold ring-2 ring-white shadow-sm shrink-0`}>
      {initials}
    </div>
  );
};

const CoinBattleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [activeTab, setActiveTab] = useState("players"); // 'players' | 'questions' | 'answers'
  const [answerSearch, setAnswerSearch] = useState("");

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminBattleDetails(id);
      if (res.success) {
        setDetails(res.data);
      } else {
        toast.error("Failed to load battle details");
        navigate("/dashboard/coin-battles");
      }
    } catch {
      toast.error("Error fetching battle details");
      navigate("/dashboard/coin-battles");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleCompleteBattle = async () => {
    if (!window.confirm("Are you sure you want to manually complete this battle and distribute rewards? This action is irreversible.")) {
      return;
    }
    setCompleting(true);
    try {
      const res = await completeBattle(id);
      if (res.success) {
        toast.success("Battle completed successfully and rewards distributed!");
        fetchDetails(); // Reload data
      } else {
        toast.error(res.message || "Failed to complete battle");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error completing battle. Ensure all players have finished their attempts.";
      toast.error(errorMsg);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <FiRefreshCw className="animate-spin text-4xl text-red-500 mb-4" />
        <span className="text-gray-500 font-medium">Loading battle details...</span>
      </div>
    );
  }

  if (!details || !details.battleGroup) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Battle details could not be found.</p>
        <button
          onClick={() => navigate("/dashboard/coin-battles")}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          <FiArrowLeft /> Back to Coin Battles
        </button>
      </div>
    );
  }

  const { battleGroup, questions = [], playerAnswers = [] } = details;
  const { players = [] } = battleGroup;

  // Filter player answers
  const filteredAnswers = playerAnswers.filter(
    (ans) =>
      ans.playerName?.toLowerCase().includes(answerSearch.toLowerCase()) ||
      ans.questionText?.toLowerCase().includes(answerSearch.toLowerCase()) ||
      ans.submittedAnswer?.toLowerCase().includes(answerSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-1 py-1">
      {/* Back & Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard/coin-battles")}
            className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition shadow-sm"
            title="Back to Battles List"
          >
            <FiArrowLeft className="text-lg" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Battle Audit: {battleGroup.groupName}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Inspect questions, scores, and raw logs of player actions
            </p>
          </div>
        </div>

        {/* Manual Complete Battle */}
        {battleGroup.status !== "COMPLETED" && (
          <button
            onClick={handleCompleteBattle}
            disabled={completing}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-all shadow-md shadow-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {completing ? (
              <FiRefreshCw className="animate-spin" />
            ) : (
              <FiAward />
            )}
            Complete & Distribute Pot
          </button>
        )}
      </div>

      {/* Grid of Key Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Info Box */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden space-y-6">
          <div className="h-2 w-full bg-gradient-to-r from-red-500 to-indigo-500" />
          
          <div className="px-6 pb-2">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Battle Overview</h3>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">ID</span>
              <span className="text-sm font-semibold text-gray-800">#{battleGroup.id}</span>
            </div>
            <div className="mt-3.5 flex items-center justify-between">
              <span className="text-sm text-gray-500">Invite Code</span>
              <span className="text-sm font-bold font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">{battleGroup.inviteCode}</span>
            </div>
            <div className="mt-3.5 flex items-center justify-between">
              <span className="text-sm text-gray-500">Category</span>
              <span className="text-xs font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded uppercase">{battleGroup.categoryName}</span>
            </div>
            <div className="mt-3.5 flex items-center justify-between">
              <span className="text-sm text-gray-500">Entry Coins</span>
              <span className="text-sm font-bold text-gray-800">{battleGroup.entryCoins} 🪙</span>
            </div>
            <div className="mt-3.5 flex items-center justify-between">
              <span className="text-sm text-gray-500">Total Pot</span>
              <span className="text-base font-bold text-red-500">{battleGroup.totalPotCoins} 🪙</span>
            </div>
            <div className="mt-3.5 flex items-center justify-between">
              <span className="text-sm text-gray-500">Players Count</span>
              <span className="text-sm font-semibold text-gray-800">{battleGroup.currentPlayers} / {battleGroup.maxPlayers}</span>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
              <span className="text-xs text-gray-400">STATUS</span>
              <div>{statusBadge(battleGroup.status)}</div>
            </div>
          </div>

          <hr className="border-gray-100 mx-6" />

          {/* Creator Details */}
          <div className="px-6 pb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Hosted By</h3>
            <div className="mt-4 flex items-center gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
              <Avatar name={battleGroup.createdByName} pictureUrl={battleGroup.createdByPicture} size="md" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-800 truncate">{battleGroup.createdByName}</div>
                <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Creator ID: {battleGroup.createdById}</div>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Created:</span>
                <span className="text-gray-600 font-medium">{formatDate(battleGroup.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Last Updated:</span>
                <span className="text-gray-600 font-medium">{formatDate(battleGroup.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Details Sheets */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Tabs Selector */}
            <div className="flex border-b border-gray-100 bg-gray-50/50">
              <button
                onClick={() => setActiveTab("players")}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition border-b-2 ${
                  activeTab === "players"
                    ? "border-red-500 text-red-600 bg-white"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <FiUsers /> Players ({players.length})
              </button>
              <button
                onClick={() => setActiveTab("questions")}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition border-b-2 ${
                  activeTab === "questions"
                    ? "border-red-500 text-red-600 bg-white"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <FiHelpCircle /> Questions ({questions.length})
              </button>
              <button
                onClick={() => setActiveTab("answers")}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition border-b-2 ${
                  activeTab === "answers"
                    ? "border-red-500 text-red-600 bg-white"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <FiFileText /> Answers Logs ({playerAnswers.length})
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6">
              {/* Tab 1: Players */}
              {activeTab === "players" && (
                <div className="space-y-4">
                  {players.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm">
                      No players have joined this battle yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {players.map((p, idx) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-3.5 p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow transition"
                        >
                          <Avatar name={p.userName} pictureUrl={p.userPicture} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-gray-800 truncate" title={p.userName}>
                                {p.userName}
                              </span>
                              {p.rewardGiven && (
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-0.5">
                                  <FiCheck className="text-[10px]" /> Winner
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                              <span>Invested: {p.investedCoins} 🪙</span>
                              <span className="font-semibold text-gray-800">Score: {p.score} pts</span>
                            </div>
                            <div className="mt-1.5 flex items-center justify-between text-[11px] text-gray-400 border-t border-gray-50 pt-1.5">
                              <span>Correct: {p.correctAnswers}</span>
                              <span>{p.eliminated ? "🔴 Eliminated" : "🟢 Active"}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Questions */}
              {activeTab === "questions" && (
                <div className="space-y-5">
                  {questions.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm font-medium">
                      No questions assigned to this battle.
                    </div>
                  ) : (
                    questions.map((q) => (
                      <div key={q.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-2">
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shrink-0">
                              Q{q.questionNumber}
                            </span>
                            <span className="text-xs font-bold uppercase tracking-wider bg-gray-100 px-2 py-1 rounded text-gray-600">
                              {q.questionType}
                            </span>
                          </div>
                          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                            Mode: {q.gameMode || "Default"}
                          </span>
                        </div>

                        <div className="text-sm font-bold text-gray-800">{q.questionText}</div>

                        {q.imageUrl && (
                          <div className="mt-2 rounded-lg overflow-hidden border border-gray-100 max-w-sm">
                            <img src={q.imageUrl} alt="Question Scene" className="w-full h-auto object-cover max-h-48" />
                          </div>
                        )}

                        {/* Dialogue / Tagline description contexts */}
                        {(q.dialogue || q.tagline || q.sceneDescription) && (
                          <div className="text-xs text-gray-500 bg-white p-3 rounded-lg border border-gray-100/70 space-y-1">
                            {q.dialogue && <div><span className="font-semibold">Dialogue:</span> "{q.dialogue}"</div>}
                            {q.tagline && <div><span className="font-semibold">Tagline:</span> "{q.tagline}"</div>}
                            {q.sceneDescription && <div><span className="font-semibold">Scene:</span> {q.sceneDescription}</div>}
                          </div>
                        )}

                        {/* Options Display */}
                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                            {q.options.map((opt) => {
                              const isCorrect = q.correctAnswer?.trim().toLowerCase() === opt.optionText?.trim().toLowerCase();
                              return (
                                <div
                                  key={opt.id}
                                  className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-medium border ${
                                    isCorrect
                                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                      : "bg-white border-gray-200 text-gray-600"
                                  }`}
                                >
                                  <span>{opt.optionText}</span>
                                  {isCorrect && <FiCheckCircle className="text-emerald-600 shrink-0 text-sm" />}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Correct Answer label fallback */}
                        {(!q.options || q.options.length === 0) && (
                          <div className="text-xs bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-100 inline-flex items-center gap-1.5 font-semibold">
                            <FiCheckCircle className="text-emerald-600" />
                            Correct Answer: {q.correctAnswer}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 3: Answers Logs */}
              {activeTab === "answers" && (
                <div className="space-y-4">
                  {playerAnswers.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm">
                      No answers submitted by players yet.
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                        <input
                          type="text"
                          placeholder="Filter answers by player or question..."
                          value={answerSearch}
                          onChange={(e) => setAnswerSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-300"
                        />
                      </div>

                      <div className="overflow-x-auto pt-1">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              <th className="py-2.5 px-3">Player</th>
                              <th className="py-2.5 px-3">Question Text</th>
                              <th className="py-2.5 px-3">Submitted Answer</th>
                              <th className="py-2.5 px-3 text-center">Result</th>
                              <th className="py-2.5 px-3 text-center">Coins</th>
                              <th className="py-2.5 px-3 text-right">Timestamp</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {filteredAnswers.map((ans) => (
                              <tr key={ans.id} className="hover:bg-gray-50/50 transition text-xs">
                                <td className="py-3 px-3 font-semibold text-gray-800">
                                  {ans.username || ans.playerName}
                                </td>
                                <td className="py-3 px-3 text-gray-600 max-w-[200px] truncate" title={ans.questionText}>
                                  {ans.questionText}
                                </td>
                                <td className="py-3 px-3 text-gray-800 font-mono font-medium max-w-[150px] truncate" title={ans.submittedAnswer}>
                                  {ans.submittedAnswer}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    ans.correct ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                                  }`}>
                                    {ans.correct ? <FiCheckCircle /> : <FiXCircle />}
                                    {ans.correct ? "Correct" : "Wrong"}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-center font-bold text-gray-800">
                                  {ans.pointsEarned > 0 ? `+${ans.pointsEarned}` : "0"}
                                </td>
                                <td className="py-3 px-3 text-right text-gray-400 font-mono text-[10px]">
                                  {formatDate(ans.submittedAt)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
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

export default CoinBattleDetail;
