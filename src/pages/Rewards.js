import { useState, useEffect, useCallback } from "react";
import {
  getAllRewards,
  createReward,
  updateReward,
  deleteReward,
  redeemReward,
} from "../services/rewardService";
import { getAllRedeems } from "../services/redeemService";
import { getAllUsers } from "../services/userService";
import { toast } from "react-toastify";
import {
  FiRefreshCw,
  FiSearch,
  FiCheckCircle,
  FiX,
  FiAlertTriangle,
  FiAward,
  FiPlus,
  FiTrash2,
  FiGift,
  FiUser,
  FiCalendar,
  FiDollarSign,
  FiEdit2,
} from "react-icons/fi";
import { MdOutlineRedeem } from "react-icons/md";

/* ─────────────── helpers ─────────────── */

const REWARD_STATUS_META = {
  ISSUED: {
    label: "Issued",
    dot: "bg-blue-400",
    chip: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  REDEEMED: {
    label: "Redeemed",
    dot: "bg-emerald-400",
    chip: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  EXPIRED: {
    label: "Expired",
    dot: "bg-red-400",
    chip: "bg-red-50 text-red-700 border border-red-200",
  },
};

const StatusChip = ({ status }) => {
  const m = REWARD_STATUS_META[status] ?? REWARD_STATUS_META.ISSUED;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${m.chip}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
};

const fmt = (iso) =>
  iso ? new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }) : "—";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  }) : "—";

const REWARD_TYPES = ["GIFT_CARD", "CASHBACK", "DISCOUNT_COUPON", "VOUCHER", "POINTS", "OTHER"];
const REWARD_STATUSES = ["ISSUED", "REDEEMED", "EXPIRED"];
const EMPTY_FORM = { userId: "", rewardType: "", provider: "", amount: "", rewardCode: "", passcode: "", expiryDate: "", description: "" };

/* ─────────────── Delete Modal ─────────────── */

const DeleteModal = ({ reward, userName, onConfirm, onCancel, submitting }) => {
  if (!reward) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!submitting ? onCancel : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="h-1.5 w-full bg-red-500" />
        <div className="p-6">
          <button onClick={onCancel} disabled={submitting}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition disabled:opacity-40">
            <FiX />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
            <FiAlertTriangle className="text-2xl text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-800">Delete Reward</h2>
          <p className="mt-1 text-sm text-gray-500">This will permanently remove the reward. This cannot be undone.</p>
          <div className="mt-5 p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Reward ID</span>
              <span className="font-mono font-semibold text-gray-700">#{reward.id}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Type</span>
              <span className="font-semibold text-gray-800">{reward.rewardType || "—"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Assigned To</span>
              <span className="font-semibold text-gray-800">{userName}</span>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-3 justify-end">
            <button onClick={onCancel} disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition disabled:opacity-50">
              Cancel
            </button>
            <button onClick={onConfirm} disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 shadow-md shadow-red-200 transition disabled:opacity-60">
              {submitting ? <FiRefreshCw className="animate-spin" /> : <FiTrash2 />}
              {submitting ? "Deleting…" : "Yes, Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── Redeem Confirm Modal ─────────────── */

const RedeemModal = ({ reward, userName, onConfirm, onCancel, submitting }) => {
  if (!reward) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!submitting ? onCancel : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="h-1.5 w-full bg-emerald-500" />
        <div className="p-6">
          <button onClick={onCancel} disabled={submitting}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition disabled:opacity-40">
            <FiX />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
            <MdOutlineRedeem className="text-2xl text-emerald-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-800">Mark as Redeemed</h2>
          <p className="mt-1 text-sm text-gray-500">Confirm this reward has been successfully redeemed by the user.</p>
          <div className="mt-5 p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Reward ID</span>
              <span className="font-mono font-semibold text-gray-700">#{reward.id}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Type</span>
              <span className="font-semibold text-gray-800">{reward.rewardType}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Assigned To</span>
              <span className="font-semibold text-gray-800">{userName}</span>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2.5 p-3 rounded-lg text-xs bg-amber-50 text-amber-700">
            <FiAlertTriangle className="shrink-0 mt-0.5" />
            <span>Once marked as redeemed, this reward cannot be used again.</span>
          </div>
          <div className="mt-6 flex items-center gap-3 justify-end">
            <button onClick={onCancel} disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button onClick={onConfirm} disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-200 transition">
              {submitting ? <FiRefreshCw className="animate-spin" /> : <FiCheckCircle />}
              {submitting ? "Please wait…" : "Yes, Mark Redeemed"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── Create / Edit Reward Drawer ─────────────── */

const RewardFormDrawer = ({ mode, reward, approvedUsers, onClose, onSuccess }) => {
  const isEdit = mode === "edit";
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEdit && reward) {
      /* Convert ISO datetime to datetime-local format */
      const toLocal = (iso) => {
        if (!iso) return "";
        const d = new Date(iso);
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      };
      setForm({
        userId:      String(reward.userId ?? ""),
        rewardType:  reward.rewardType ?? "",
        provider:    reward.provider ?? "",
        amount:      reward.amount != null ? String(reward.amount) : "",
        rewardCode:  reward.rewardCode ?? "",
        passcode:    reward.passcode ?? "",
        expiryDate:  toLocal(reward.expiryDate),
        description: reward.description ?? "",
        status:      reward.status ?? "ISSUED",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [isEdit, reward]);

  if (!mode) return null;

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEdit && !form.userId) { toast.error("Please select a user"); return; }
    if (!form.rewardType) { toast.error("Please select a reward type"); return; }
    setSubmitting(true);
    try {
      const payload = {
        rewardType:  form.rewardType,
        provider:    form.provider || null,
        amount:      form.amount ? Number(form.amount) : null,
        rewardCode:  form.rewardCode || null,
        passcode:    form.passcode || null,
        expiryDate:  form.expiryDate ? form.expiryDate + ":00" : null,
        description: form.description || null,
      };
      if (isEdit) {
        await updateReward(reward.id, { ...payload, status: form.status });
        toast.success("Reward updated successfully");
      } else {
        await createReward({ ...payload, userId: Number(form.userId) });
        toast.success("Reward created and assigned");
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-4 sm:p-0">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!submitting ? onClose : undefined} />
      <div className="relative bg-white w-full sm:w-[480px] h-full sm:rounded-l-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* top bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-500 to-red-700 shrink-0" />

        {/* header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-4 shrink-0">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${isEdit ? "bg-amber-50 text-amber-500" : "bg-red-50 text-red-500"}`}>
            {isEdit ? <FiEdit2 /> : <FiPlus />}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-800">{isEdit ? "Edit Reward" : "Create Reward"}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isEdit ? `Updating reward #${reward?.id}` : "Assign a new reward to an eligible user"}
            </p>
          </div>
          <button onClick={onClose} disabled={submitting}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition disabled:opacity-40 shrink-0">
            <FiX />
          </button>
        </div>

        {/* body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* User (create only) */}
          {!isEdit && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                <FiUser className="inline mr-1.5" />
                Assign To User <span className="text-red-500">*</span>
              </label>
              <select value={form.userId} onChange={(e) => set("userId", e.target.value)} required
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 bg-white text-gray-800">
                <option value="">— Select an approved-redeem user —</option>
                {approvedUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName || u.username || u.email}
                    {u.email ? ` (${u.email})` : ""}
                  </option>
                ))}
              </select>
              {approvedUsers.length === 0 && (
                <p className="mt-1.5 text-[11px] text-amber-600 flex items-center gap-1">
                  <FiAlertTriangle className="shrink-0" />
                  No users with approved redeems yet.
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {/* Reward Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Reward Type <span className="text-red-500">*</span>
              </label>
              <select value={form.rewardType} onChange={(e) => set("rewardType", e.target.value)} required
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 bg-white text-gray-800">
                <option value="">— Select —</option>
                {REWARD_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            {/* Provider */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Provider</label>
              <input type="text" placeholder="e.g. Amazon" value={form.provider} onChange={(e) => set("provider", e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                <FiDollarSign className="inline mr-1" />Amount (₹)
              </label>
              <input type="number" placeholder="e.g. 500" min="0" step="0.01" value={form.amount} onChange={(e) => set("amount", e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300" />
            </div>
            {/* Expiry */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                <FiCalendar className="inline mr-1" />Expiry Date
              </label>
              <input type="datetime-local" value={form.expiryDate} onChange={(e) => set("expiryDate", e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Reward Code */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Reward Code</label>
              <input type="text" placeholder="e.g. SAVE50NOW" value={form.rewardCode} onChange={(e) => set("rewardCode", e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 font-mono" />
            </div>
            {/* Passcode */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Passcode</label>
              <input type="text" placeholder="Optional" value={form.passcode} onChange={(e) => set("passcode", e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300" />
            </div>
          </div>

          {/* Status (edit only) */}
          {isEdit && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
              <div className="flex items-center gap-2">
                {REWARD_STATUSES.map((s) => (
                  <button key={s} type="button" onClick={() => set("status", s)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${
                      form.status === s
                        ? s === "ISSUED" ? "bg-blue-500 text-white border-blue-500"
                          : s === "REDEEMED" ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-red-500 text-white border-red-500"
                        : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
            <textarea placeholder="Optional instructions for the user…" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 resize-none" />
          </div>
        </form>

        {/* footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
          <button onClick={onClose} disabled={submitting}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md transition disabled:opacity-60 ${
              isEdit
                ? "bg-amber-500 hover:bg-amber-600 shadow-amber-200"
                : "bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 shadow-red-200"
            }`}>
            {submitting
              ? <><FiRefreshCw className="animate-spin" /> {isEdit ? "Saving…" : "Creating…"}</>
              : isEdit
              ? <><FiEdit2 /> Save Changes</>
              : <><FiPlus /> Create Reward</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── All Rewards Table ─────────────── */

const FILTER_TABS = ["ALL", "ISSUED", "REDEEMED", "EXPIRED"];

const AllRewardsTable = ({ rewards, usersMap, loading, onEdit, onRedeem, onDelete }) => {
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("ALL");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [redeemTarget, setRedeemTarget] = useState(null);
  const [actionSub, setActionSub]       = useState(false);

  const counts = {
    ALL:      rewards.length,
    ISSUED:   rewards.filter((r) => r.status === "ISSUED").length,
    REDEEMED: rewards.filter((r) => r.status === "REDEEMED").length,
    EXPIRED:  rewards.filter((r) => r.status === "EXPIRED").length,
  };

  const filtered = rewards.filter((r) => {
    const matchStatus = filter === "ALL" || r.status === filter;
    const q = search.toLowerCase();
    const uName = usersMap[r.userId] ?? r.userName ?? "";
    const matchSearch =
      !q ||
      String(r.id).includes(q) ||
      r.rewardType?.toLowerCase().includes(q) ||
      r.provider?.toLowerCase().includes(q) ||
      r.rewardCode?.toLowerCase().includes(q) ||
      r.status?.toLowerCase().includes(q) ||
      uName.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const handleDeleteConfirm = async () => {
    setActionSub(true);
    try {
      await onDelete(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setActionSub(false);
    }
  };

  const handleRedeemConfirm = async () => {
    setActionSub(true);
    try {
      await onRedeem(redeemTarget.id);
      setRedeemTarget(null);
    } finally {
      setActionSub(false);
    }
  };

  return (
    <>
      <DeleteModal
        reward={deleteTarget}
        userName={deleteTarget ? (usersMap[deleteTarget.userId] ?? deleteTarget.userName ?? "Unknown") : ""}
        onConfirm={handleDeleteConfirm}
        onCancel={() => !actionSub && setDeleteTarget(null)}
        submitting={actionSub}
      />
      <RedeemModal
        reward={redeemTarget}
        userName={redeemTarget ? (usersMap[redeemTarget.userId] ?? redeemTarget.userName ?? "Unknown") : ""}
        onConfirm={handleRedeemConfirm}
        onCancel={() => !actionSub && setRedeemTarget(null)}
        submitting={actionSub}
      />

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* toolbar */}
        <div className="px-5 pt-4 pb-0 border-b border-gray-100">
          <div className="flex items-center gap-1 overflow-x-auto pb-3">
            {FILTER_TABS.map((tab) => (
              <button key={tab} onClick={() => setFilter(tab)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filter === tab ? "bg-[#1e1e2d] text-white shadow" : "text-gray-500 hover:bg-gray-100"
                }`}>
                {tab === "ALL" ? "All Rewards" : REWARD_STATUS_META[tab]?.label}
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                  filter === tab ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                }`}>{counts[tab]}</span>
              </button>
            ))}
            <div className="ml-auto pl-3 shrink-0">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input type="text" placeholder="Search rewards, users…" value={search} onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 w-40 sm:w-56" />
              </div>
            </div>
          </div>
        </div>

        {/* table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">ID</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Assigned User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Provider</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Reward Code</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Expiry</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Redeemed At</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {[50, 120, 90, 90, 70, 110, 80, 90, 100, 130].map((w, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: w }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-16 text-center text-gray-400 text-sm">
                    <FiAward className="text-5xl mx-auto mb-3 text-gray-200" />
                    {search || filter !== "ALL" ? "No rewards match your filter." : "No rewards yet. Create one to get started."}
                  </td>
                </tr>
              ) : (
                filtered.map((reward) => {
                 
                  const isDone = reward.redeemed || reward.status === "REDEEMED";
                  return (
                    <tr key={reward.id} className="hover:bg-gray-50/70 transition">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                          #{reward.id}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                        
                          <span className="text-sm font-medium text-gray-800 whitespace-nowrap">{reward.name.toUpperCase()}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                          {reward.rewardType?.replace(/_/g, " ") || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">{reward.provider || "—"}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-bold text-gray-800 whitespace-nowrap">
                          {reward.amount != null ? `₹${Number(reward.amount).toLocaleString()}` : "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {reward.rewardCode
                          ? <span className="font-mono text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-md">{reward.rewardCode}</span>
                          : <span className="text-gray-300 italic text-xs">—</span>
                        }
                      </td>
                      <td className="px-5 py-3.5"><StatusChip status={reward.status} /></td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">{fmtDate(reward.expiryDate)}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">{fmt(reward.redeemedAt)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Edit */}
                          <button onClick={() => onEdit(reward)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 transition whitespace-nowrap">
                            <FiEdit2 className="text-xs" /> Edit
                          </button>
                          {/* Redeem */}
                          {!isDone && (
                            <button onClick={() => setRedeemTarget(reward)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition whitespace-nowrap">
                              <MdOutlineRedeem className="text-xs" /> Redeem
                            </button>
                          )}
                          {/* Delete */}
                          <button onClick={() => setDeleteTarget(reward)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition">
                            <FiTrash2 className="text-xs" />
                          </button>
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
          <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 flex-wrap gap-2">
            <span>Showing {filtered.length} of {rewards.length} rewards</span>
            <span>
              Total issued value:{" "}
              <strong className="text-gray-600">
                ₹{rewards.filter((r) => r.status === "ISSUED").reduce((s, r) => s + (r.amount ?? 0), 0).toLocaleString()}
              </strong>
            </span>
          </div>
        )}
      </div>
    </>
  );
};

/* ─────────────── Main Page ─────────────── */

const Rewards = () => {
  const [rewards, setRewards]         = useState([]);
  const [usersMap, setUsersMap]       = useState({});
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [drawerMode, setDrawerMode]   = useState(null);   // "create" | "edit" | null
  const [editTarget, setEditTarget]   = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rewardsRes, usersRes, redeemsRes] = await Promise.all([
        getAllRewards(),
        getAllUsers(),
        getAllRedeems(),
      ]);

      const users = Array.isArray(usersRes) ? usersRes : usersRes?.data ?? [];
      const map = {};
      users.forEach((u) => {
        map[u.id] = u.fullName || u.username || u.email || `User #${u.id}`;
      });
      setUsersMap(map);

      const redeems = Array.isArray(redeemsRes) ? redeemsRes : redeemsRes?.data ?? [];
      const approvedIds = new Set(
        redeems.filter((r) => r.status === "APPROVED").map((r) => r.userId)
      );
      setApprovedUsers(users.filter((u) => approvedIds.has(u.id)));

      const rewardList = Array.isArray(rewardsRes) ? rewardsRes : rewardsRes?.data ?? [];
      setRewards(rewardList);
    } catch {
      toast.error("Failed to load rewards data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* actions */
  const handleDelete = async (id) => {
    try {
      await deleteReward(id);
      toast.success("Reward deleted");
      setRewards((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Delete failed");
      throw err;
    }
  };

  const handleRedeem = async (id) => {
    try {
      await redeemReward(id);
      toast.success("Reward marked as redeemed");
      setRewards((prev) =>
        prev.map((r) => r.id === id ? { ...r, redeemed: true, status: "REDEEMED" } : r)
      );
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Redeem failed");
      throw err;
    }
  };

  const handleEdit = (reward) => {
    setEditTarget(reward);
    setDrawerMode("edit");
  };

  const openCreate = () => {
    setEditTarget(null);
    setDrawerMode("create");
  };

  /* stats */
  const stats = {
    total:    rewards.length,
    issued:   rewards.filter((r) => r.status === "ISSUED").length,
    redeemed: rewards.filter((r) => r.status === "REDEEMED").length,
    totalVal: rewards.filter((r) => r.status === "ISSUED").reduce((s, r) => s + (r.amount ?? 0), 0),
  };

  return (
    <div>
      {/* drawer */}
      <RewardFormDrawer
        mode={drawerMode}
        reward={editTarget}
        approvedUsers={approvedUsers}
        onClose={() => { setDrawerMode(null); setEditTarget(null); }}
        onSuccess={fetchData}
      />

      {/* header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Rewards</h1>
          <p className="text-sm text-gray-500 mt-1">
            Issue, track and manage all rewards assigned to users
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-50 shadow-sm">
            <FiRefreshCw className={`text-sm ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 rounded-xl shadow-md shadow-red-200 transition">
            <FiPlus /> Create Reward
          </button>
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Rewards",  value: stats.total,                                    icon: <FiAward />,         color: "text-indigo-500", bg: "bg-indigo-50"  },
          { label: "Issued",         value: stats.issued,                                   icon: <FiGift />,          color: "text-blue-500",   bg: "bg-blue-50"    },
          { label: "Redeemed",       value: stats.redeemed,                                 icon: <FiCheckCircle />,   color: "text-emerald-500",bg: "bg-emerald-50" },
          { label: "Issued Value",   value: `₹${stats.totalVal.toLocaleString()}`,          icon: <FiDollarSign />,    color: "text-amber-500",  bg: "bg-amber-50"   },
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

      {/* eligible users banner */}
      {!loading && approvedUsers.length > 0 && (
        <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <FiUser />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-700">
                {approvedUsers.length} user{approvedUsers.length > 1 ? "s" : ""} eligible for rewards
              </p>
              <p className="text-xs text-emerald-600">These users have at least one approved redeem request.</p>
            </div>
          </div>
          <button onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition shadow-sm">
            <FiPlus /> Assign Reward
          </button>
        </div>
      )}

      {/* table */}
      <AllRewardsTable
        rewards={rewards}
        usersMap={usersMap}
        loading={loading}
        onEdit={handleEdit}
        onRedeem={handleRedeem}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default Rewards;
