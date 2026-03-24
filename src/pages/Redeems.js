import { useState, useEffect, useCallback } from "react";
import { getAllRedeems, markProcessing, approveRedeem, rejectRedeem } from "../services/redeemService";
import { createReward } from "../services/rewardService";
import { toast } from "react-toastify";
import {
  FiRefreshCw,
  FiSearch,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiLoader,
  FiX,
  FiAlertTriangle,
  FiCodesandbox,
  FiAward,
  FiCalendar,
  FiDollarSign,
} from "react-icons/fi";
import { MdOutlineRedeem } from "react-icons/md";

/* ─────────────── helpers ─────────────── */

const STATUS_META = {
  PENDING: {
    label: "Pending",
    dot: "bg-amber-400",
    chip: "bg-amber-50 text-amber-700 border border-amber-200",
    icon: <FiClock className="shrink-0" />,
  },
  PROCESSING: {
    label: "Processing",
    dot: "bg-blue-400",
    chip: "bg-blue-50 text-blue-700 border border-blue-200",
    icon: <FiLoader className="shrink-0 animate-spin" />,
  },
  APPROVED: {
    label: "Approved",
    dot: "bg-emerald-400",
    chip: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    icon: <FiCheckCircle className="shrink-0" />,
  },
  REJECTED: {
    label: "Rejected",
    dot: "bg-red-400",
    chip: "bg-red-50 text-red-700 border border-red-200",
    icon: <FiXCircle className="shrink-0" />,
  },
};

const StatusChip = ({ status }) => {
  const m = STATUS_META[status] ?? STATUS_META.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${m.chip}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
};

const fmt = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—";

/* ─────────────── Status Action Modal ─────────────── */

const ACTION_META = {
  PROCESSING: {
    title: "Mark as Processing",
    desc: "This will move the request into processing state.",
    warning: "The user's coins remain on hold until approved or rejected.",
    btnLabel: "Mark Processing",
    btnCls: "bg-blue-500 hover:bg-blue-600 shadow-blue-200",
    iconCls: "bg-blue-50 text-blue-500",
    icon: <FiLoader className="text-2xl" />,
  },
  APPROVED: {
    title: "Approve Redeem",
    desc: "This will approve the redeem request.",
    warning: "Once approved, the user's coins will be finalised. This cannot be undone.",
    btnLabel: "Yes, Approve",
    btnCls: "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200",
    iconCls: "bg-emerald-50 text-emerald-500",
    icon: <FiCheckCircle className="text-2xl" />,
  },
  REJECTED: {
    title: "Reject Redeem",
    desc: "This will reject the redeem request.",
    warning: "The coins will be refunded back to the user's wallet immediately.",
    btnLabel: "Yes, Reject",
    btnCls: "bg-red-500 hover:bg-red-600 shadow-red-200",
    iconCls: "bg-red-50 text-red-500",
    icon: <FiXCircle className="text-2xl" />,
  },
};

const ActionModal = ({ target, onConfirm, onCancel, submitting }) => {
  if (!target) return null;
  const m = ACTION_META[target.action];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!submitting ? onCancel : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className={`h-1.5 w-full ${
          target.action === "APPROVED" ? "bg-emerald-500" :
          target.action === "REJECTED" ? "bg-red-500" : "bg-blue-500"
        }`} />
        <div className="p-6">
          <button onClick={onCancel} disabled={submitting}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition disabled:opacity-40">
            <FiX />
          </button>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${m.iconCls}`}>
            {m.icon}
          </div>
          <h2 className="text-lg font-bold text-gray-800">{m.title}</h2>
          <p className="mt-1 text-sm text-gray-500">{m.desc}</p>
          <div className="mt-5 p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Redeem ID</span>
              <span className="font-mono font-semibold text-gray-700">#{target.redeem.redeemId}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">User</span>
              <span className="font-semibold text-gray-800">{target.redeem.name ?? `#${target.redeem.userId}`}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Coins</span>
              <span className="font-bold text-gray-800">{target.redeem.coins.toLocaleString()} 🪙</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Current Status</span>
              <StatusChip status={target.redeem.status} />
            </div>
          </div>
          <div className={`mt-4 flex items-start gap-2.5 p-3 rounded-lg text-xs ${
            target.action === "APPROVED" ? "bg-emerald-50 text-emerald-700" :
            target.action === "REJECTED" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"
          }`}>
            <FiAlertTriangle className="shrink-0 mt-0.5" />
            <span>{m.warning}</span>
          </div>
          <div className="mt-6 flex items-center gap-3 justify-end">
            <button onClick={onCancel} disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition disabled:opacity-50">
              Cancel
            </button>
            <button onClick={onConfirm} disabled={submitting}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-60 shadow-md ${m.btnCls}`}>
              {submitting ? <FiRefreshCw className="animate-spin" /> : m.icon}
              {submitting ? "Please wait…" : m.btnLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── Create Reward Modal ─────────────── */

const REWARD_TYPES = ["GIFT_CARD", "CASHBACK", "DISCOUNT_COUPON", "VOUCHER", "POINTS", "OTHER"];
const EMPTY_REWARD = {
  rewardType: "", provider: "", amount: "",
  rewardCode: "", passcode: "", expiryDate: "", description: "",
};

const CreateRewardModal = ({ redeem, onClose, onSuccess }) => {
  const [form, setForm]         = useState(EMPTY_REWARD);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (redeem) setForm(EMPTY_REWARD);
  }, [redeem]);

  if (!redeem) return null;

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.rewardType) { toast.error("Please select a reward type"); return; }
    setSubmitting(true);
    try {
      await createReward({
        userId:      redeem.userId,           // ← directly from the redeem
        rewardType:  form.rewardType,
        provider:    form.provider    || null,
        amount:      form.amount      ? Number(form.amount) : null,
        rewardCode:  form.rewardCode  || null,
        passcode:    form.passcode    || null,
        expiryDate:  form.expiryDate  ? form.expiryDate + ":00" : null,
        description: form.description || null,
      });
      toast.success(`Reward created for ${redeem.name ?? "user"}`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to create reward");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!submitting ? onClose : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="h-1.5 w-full bg-gradient-to-r from-red-500 to-red-700 shrink-0" />

        {/* header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-4 shrink-0">
          <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center text-red-500 text-xl shrink-0">
            <FiAward />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-800">Create Reward</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Redeem Request{" "}
              <span className="font-mono font-semibold text-gray-700">#{redeem.redeemId}</span>
              {" "}· {redeem.coins?.toLocaleString()} 🪙
            </p>
          </div>
          <button onClick={onClose} disabled={submitting}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition shrink-0 disabled:opacity-40">
            <FiX />
          </button>
        </div>

        {/* body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* User — read-only, from redeem */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {(redeem.name ?? "U").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-700 truncate">{redeem.name ?? "Unknown User"}</p>
              <p className="text-xs text-emerald-600">User ID: {redeem.userId}</p>
            </div>
            <FiCheckCircle className="text-emerald-500 shrink-0" />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Provider</label>
              <input type="text" placeholder="e.g. Amazon" value={form.provider} onChange={(e) => set("provider", e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                <FiDollarSign className="inline mr-1" />Amount (₹)
              </label>
              <input type="number" placeholder="e.g. 500" min="0" step="0.01" value={form.amount} onChange={(e) => set("amount", e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                <FiCalendar className="inline mr-1" />Expiry Date
              </label>
              <input type="datetime-local" value={form.expiryDate} onChange={(e) => set("expiryDate", e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Reward Code</label>
              <input type="text" placeholder="e.g. SAVE50NOW" value={form.rewardCode} onChange={(e) => set("rewardCode", e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Passcode</label>
              <input type="text" placeholder="Optional" value={form.passcode} onChange={(e) => set("passcode", e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
            <textarea placeholder="Optional instructions for the user…" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)}
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
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 shadow-md shadow-red-200 transition disabled:opacity-60">
            {submitting
              ? <><FiRefreshCw className="animate-spin" /> Creating…</>
              : <><FiAward /> Create Reward</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── Main Page ─────────────── */

const FILTER_TABS = ["ALL", "PENDING", "PROCESSING", "APPROVED", "REJECTED"];

const Redeems = () => {
  const [data, setData]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filter, setFilter]         = useState("ALL");
  const [modal, setModal]           = useState(null);   // { redeem, action }
  const [submitting, setSubmitting] = useState(false);
  const [rewardTarget, setRewardTarget] = useState(null); // redeem for reward modal

  const fetchRedeems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllRedeems();
      if (res.success) setData(res.data);
      else toast.error("Failed to load redeem requests");
    } catch {
      toast.error("Failed to load redeem requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRedeems(); }, [fetchRedeems]);

  const handleConfirm = async () => {
    if (!modal) return;
    setSubmitting(true);
    try {
      let res;
      if (modal.action === "PROCESSING") res = await markProcessing(modal.redeem.redeemId);
      else if (modal.action === "APPROVED") res = await approveRedeem(modal.redeem.redeemId);
      else res = await rejectRedeem(modal.redeem.redeemId);

      if (res.success) {
        toast.success(res.message);
        setData((prev) =>
          prev.map((r) =>
            r.redeemId === modal.redeem.redeemId ? { ...r, status: modal.action } : r
          )
        );
        setModal(null);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Action failed");
    } finally {
      setSubmitting(false);
    }
  };

  const counts = {
    ALL:        data.length,
    PENDING:    data.filter((r) => r.status === "PENDING").length,
    PROCESSING: data.filter((r) => r.status === "PROCESSING").length,
    APPROVED:   data.filter((r) => r.status === "APPROVED").length,
    REJECTED:   data.filter((r) => r.status === "REJECTED").length,
  };

  const filtered = data.filter((r) => {
    const matchStatus = filter === "ALL" || r.status === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      String(r.redeemId).includes(q) ||
      String(r.coins).includes(q) ||
      r.name?.toLowerCase().includes(q) ||
      r.status?.toLowerCase().includes(q) ||
      r.remarks?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const totalCoins   = data.reduce((s, r) => s + (r.coins ?? 0), 0);
  const pendingCoins = data.filter((r) => r.status === "PENDING").reduce((s, r) => s + (r.coins ?? 0), 0);

  return (
    <div>
      <ActionModal
        target={modal}
        onConfirm={handleConfirm}
        onCancel={() => !submitting && setModal(null)}
        submitting={submitting}
      />

      <CreateRewardModal
        redeem={rewardTarget}
        onClose={() => setRewardTarget(null)}
        onSuccess={fetchRedeems}
      />

      {/* header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Redeem Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Review and manage all user coin redemption requests</p>
        </div>
        <button onClick={fetchRedeems} disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-50 shadow-sm">
          <FiRefreshCw className={`text-sm ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Requests", value: counts.ALL,      icon: <MdOutlineRedeem />, color: "text-indigo-500", bg: "bg-indigo-50"  },
          { label: "Pending",        value: counts.PENDING,  icon: <FiClock />,         color: "text-amber-500",  bg: "bg-amber-50"   },
          { label: "Approved",       value: counts.APPROVED, icon: <FiCheckCircle />,   color: "text-emerald-500",bg: "bg-emerald-50" },
          { label: "Coins at Risk",  value: `${pendingCoins.toLocaleString()} 🪙`, icon: <FiCodesandbox />, color: "text-red-500", bg: "bg-red-50" },
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

      {/* table card */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">

        {/* toolbar */}
        <div className="px-5 pt-4 pb-0 border-b border-gray-100">
          <div className="flex items-center gap-1 overflow-x-auto pb-3">
            {FILTER_TABS.map((tab) => (
              <button key={tab} onClick={() => setFilter(tab)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filter === tab ? "bg-[#1e1e2d] text-white shadow" : "text-gray-500 hover:bg-gray-100"
                }`}>
                {tab === "ALL" ? "All" : STATUS_META[tab]?.label}
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                  filter === tab ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                }`}>{counts[tab]}</span>
              </button>
            ))}
            <div className="ml-auto pl-3 shrink-0">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input type="text" placeholder="Search name, coins…" value={search} onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 w-36 sm:w-48" />
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
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Coins</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Remarks</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Requested At</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 7 }).map((_, i) => (
                  <tr key={i}>
                    {[50, 130, 80, 90, 140, 130, 200].map((w, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: w }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-gray-400 text-sm">
                    <MdOutlineRedeem className="text-5xl mx-auto mb-3 text-gray-200" />
                    {search || filter !== "ALL" ? "No requests match your current filter." : "No redeem requests found."}
                  </td>
                </tr>
              ) : (
                filtered.map((redeem) => {
                  const isApproved = redeem.status === "APPROVED";
                  const isRejected = redeem.status === "REJECTED";
                  return (
                    <tr key={redeem.redeemId} className="hover:bg-gray-50/70 transition">
                      {/* ID */}
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                          #{redeem.redeemId}
                        </span>
                      </td>

                      {/* User — name + userId from API */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {(redeem.name ?? "U").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {redeem.name ?? "—"}
                            </p>
                            <p className="text-[11px] text-gray-400">ID: {redeem.userId}</p>
                          </div>
                        </div>
                      </td>

                      {/* Coins */}
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-bold text-gray-800">{redeem.coins.toLocaleString()}</span>
                        <span className="text-xs text-gray-400 ml-1">🪙</span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <StatusChip status={redeem.status} />
                      </td>

                      {/* Remarks */}
                      <td className="px-5 py-3.5 text-sm text-gray-500 max-w-[160px] truncate">
                        {redeem.remarks || <span className="text-gray-300 italic">—</span>}
                      </td>

                      {/* Requested At */}
                      <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                        {fmt(redeem.requestedAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        {isRejected ? (
                          <span className="text-xs text-gray-300 italic">No actions</span>
                        ) : isApproved ? (
                          <button
                            onClick={() => setRewardTarget(redeem)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 shadow-sm shadow-red-200 transition"
                          >
                            <FiAward className="text-xs" /> Give Reward
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            {redeem.status === "PENDING" && (
                              <button onClick={() => setModal({ redeem, action: "PROCESSING" })}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition">
                                <FiLoader className="text-xs" /> Processing
                              </button>
                            )}
                            <button onClick={() => setModal({ redeem, action: "APPROVED" })}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition">
                              <FiCheckCircle className="text-xs" /> Approve
                            </button>
                            <button onClick={() => setModal({ redeem, action: "REJECTED" })}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition">
                              <FiXCircle className="text-xs" /> Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* footer */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 flex-wrap gap-2">
            <span>Showing {filtered.length} of {data.length} requests</span>
            <span>
              Total coins across all requests:{" "}
              <strong className="text-gray-600">{totalCoins.toLocaleString()} 🪙</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Redeems;
