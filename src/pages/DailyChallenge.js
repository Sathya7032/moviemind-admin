import { useState, useEffect, useCallback } from "react";
import {
  createEvent,
  getAllEvents,
  toggleEvent,
  distributePrizes,
  updateEvent,
  deleteEvent,
  getLeaderboard,
} from "../services/dailyChallengeService";
import { getAllCategories } from "../services/categoryService";
import { toast } from "react-toastify";
import {
  FiRefreshCw,
  FiPlus,
  FiToggleLeft,
  FiToggleRight,
  FiCalendar,
  FiGift,
  FiHelpCircle,
  FiX,
  FiAlertTriangle,
  FiCheckCircle,
  FiZap,
  FiAward,
  FiEdit2,
  FiTrash2,
  FiUsers,
  FiClock,
  FiLoader,
} from "react-icons/fi";

/* ─────────────── helpers ─────────────── */

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const hasEnded = (iso) => iso && new Date(iso) < new Date();

const StatusBadge = ({ active }) =>
  active ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      Inactive
    </span>
  );

/* ─────────────── Create Event Modal ─────────────── */

const EMPTY_FORM = {
  title: "",
  description: "",
  categoryId: "",
  startDate: "",
  endDate: "",
  rewardCoins: "",
  questionCount: 10,
  firstPrizeCoins: "",
  secondPrizeCoins: "",
  thirdPrizeCoins: "",
};

const CreateEventModal = ({ categories, onClose, onCreated }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.categoryId) e.categoryId = "Please select a category";
    if (!form.startDate) e.startDate = "Start date is required";
    if (!form.endDate) e.endDate = "End date is required";
    if (form.startDate && form.endDate && form.startDate > form.endDate)
      e.endDate = "End date must be after start date";
    if (!form.rewardCoins || Number(form.rewardCoins) <= 0)
      e.rewardCoins = "Enter a valid reward amount";
    if (!form.questionCount || Number(form.questionCount) < 1)
      e.questionCount = "Must be at least 1";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        categoryId: Number(form.categoryId),
        startDate: form.startDate,
        endDate: form.endDate,
        rewardCoins: Number(form.rewardCoins),
        questionCount: Number(form.questionCount),
        firstPrizeCoins: form.firstPrizeCoins ? Number(form.firstPrizeCoins) : null,
        secondPrizeCoins: form.secondPrizeCoins ? Number(form.secondPrizeCoins) : null,
        thirdPrizeCoins: form.thirdPrizeCoins ? Number(form.thirdPrizeCoins) : null,
      };
      const res = await createEvent(payload);
      if (res.success) {
        toast.success("Daily challenge event created!");
        onCreated(res.data);
        onClose();
      } else {
        toast.error(res.message || "Failed to create event");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!submitting ? onClose : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-500 to-red-700 shrink-0" />

        {/* header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <FiZap className="text-red-500 text-lg" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">New Daily Challenge</h2>
              <p className="text-xs text-gray-400 mt-0.5">Fill in the details below</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition disabled:opacity-40"
          >
            <FiX />
          </button>
        </div>

        {/* body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Bollywood Classics Week"
              className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 transition ${
                errors.title ? "border-red-400 bg-red-50" : "border-gray-200"
              }`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Optional description for this event…"
              rows={2}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 transition resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={form.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
              className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 transition bg-white ${
                errors.categoryId ? "border-red-400 bg-red-50" : "border-gray-200"
              }`}
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ""}{c.name}</option>
              ))}
            </select>
            {errors.categoryId && <p className="text-xs text-red-500 mt-1">{errors.categoryId}</p>}
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
                className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 transition ${
                  errors.startDate ? "border-red-400 bg-red-50" : "border-gray-200"
                }`}
              />
              {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
                className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 transition ${
                  errors.endDate ? "border-red-400 bg-red-50" : "border-gray-200"
                }`}
              />
              {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
            </div>
          </div>

          {/* Reward Coins & Question Count */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Reward Coins <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🪙</span>
                <input
                  type="number"
                  min="1"
                  value={form.rewardCoins}
                  onChange={(e) => set("rewardCoins", e.target.value)}
                  placeholder="100"
                  className={`w-full pl-8 pr-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 transition ${
                    errors.rewardCoins ? "border-red-400 bg-red-50" : "border-gray-200"
                  }`}
                />
              </div>
              {errors.rewardCoins && <p className="text-xs text-red-500 mt-1">{errors.rewardCoins}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Questions <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={form.questionCount}
                onChange={(e) => set("questionCount", e.target.value)}
                placeholder="10"
                className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 transition ${
                  errors.questionCount ? "border-red-400 bg-red-50" : "border-gray-200"
                }`}
              />
              {errors.questionCount && <p className="text-xs text-red-500 mt-1">{errors.questionCount}</p>}
            </div>
          </div>

          {/* Prize Setup */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <FiAward className="text-amber-500" />
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                Prize Setup
              </span>
              <span className="text-xs text-amber-500 font-normal">(optional)</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { field: "firstPrizeCoins",  medal: "🥇", label: "1st Place" },
                { field: "secondPrizeCoins", medal: "🥈", label: "2nd Place" },
                { field: "thirdPrizeCoins",  medal: "🥉", label: "3rd Place" },
              ].map(({ field, medal, label }) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    {medal} {label}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs">🪙</span>
                    <input
                      type="number"
                      min="1"
                      value={form[field]}
                      onChange={(e) => set(field, e.target.value)}
                      placeholder="—"
                      className="w-full pl-7 pr-2.5 py-2 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 transition bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2.5 text-xs text-amber-600">
              Leave blank if no prize for that position. Prizes are credited to winners' wallets after you click Distribute Prizes.
            </p>
          </div>
        </form>

        {/* footer */}
        <div className="shrink-0 px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 shadow-md shadow-red-200 transition disabled:opacity-60"
          >
            {submitting ? (
              <><FiRefreshCw className="animate-spin" /> Creating…</>
            ) : (
              <><FiPlus /> Create Event</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── Edit Event Modal ─────────────── */

const EditEventModal = ({ event, categories, onClose, onUpdated }) => {
  const toDateInput = (iso) => (iso ? iso.slice(0, 16) : "");

  const [form, setForm] = useState({
    title:           event.title ?? "",
    description:     event.description ?? "",
    categoryId:      event.category?.id ?? "",
    startDate:       toDateInput(event.startDate),
    endDate:         toDateInput(event.endDate),
    rewardCoins:     event.rewardCoins ?? "",
    questionCount:   event.questionCount ?? 10,
    firstPrizeCoins:  event.firstPrizeCoins  ?? "",
    secondPrizeCoins: event.secondPrizeCoins ?? "",
    thirdPrizeCoins:  event.thirdPrizeCoins  ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.categoryId) e.categoryId = "Please select a category";
    if (!form.startDate) e.startDate = "Start date is required";
    if (!form.endDate) e.endDate = "End date is required";
    if (form.startDate && form.endDate && form.startDate > form.endDate)
      e.endDate = "End date must be after start date";
    if (!form.rewardCoins || Number(form.rewardCoins) <= 0)
      e.rewardCoins = "Enter a valid reward amount";
    if (!form.questionCount || Number(form.questionCount) < 1)
      e.questionCount = "Must be at least 1";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const payload = {
        title:           form.title.trim(),
        description:     form.description.trim() || null,
        categoryId:      Number(form.categoryId),
        startDate:       form.startDate,
        endDate:         form.endDate,
        rewardCoins:     Number(form.rewardCoins),
        questionCount:   Number(form.questionCount),
        firstPrizeCoins:  form.firstPrizeCoins  ? Number(form.firstPrizeCoins)  : null,
        secondPrizeCoins: form.secondPrizeCoins ? Number(form.secondPrizeCoins) : null,
        thirdPrizeCoins:  form.thirdPrizeCoins  ? Number(form.thirdPrizeCoins)  : null,
      };
      const res = await updateEvent(event.id, payload);
      toast.success("Event updated successfully!");
      onUpdated(res.data ?? res);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to update event");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!submitting ? onClose : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-indigo-700 shrink-0" />

        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <FiEdit2 className="text-indigo-500 text-lg" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">Edit Challenge</h2>
              <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[220px]">{event.title}</p>
            </div>
          </div>
          <button onClick={onClose} disabled={submitting} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition disabled:opacity-40">
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Title <span className="text-red-500">*</span></label>
            <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)}
              className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 transition ${errors.title ? "border-red-400 bg-red-50" : "border-gray-200"}`} />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 transition resize-none" />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category <span className="text-red-500">*</span></label>
            <select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}
              className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 transition bg-white ${errors.categoryId ? "border-red-400 bg-red-50" : "border-gray-200"}`}>
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ""}{c.name}</option>
              ))}
            </select>
            {errors.categoryId && <p className="text-xs text-red-500 mt-1">{errors.categoryId}</p>}
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Start Date <span className="text-red-500">*</span></label>
              <input type="datetime-local" value={form.startDate} onChange={(e) => set("startDate", e.target.value)}
                className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 transition ${errors.startDate ? "border-red-400 bg-red-50" : "border-gray-200"}`} />
              {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">End Date <span className="text-red-500">*</span></label>
              <input type="datetime-local" value={form.endDate} onChange={(e) => set("endDate", e.target.value)}
                className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 transition ${errors.endDate ? "border-red-400 bg-red-50" : "border-gray-200"}`} />
              {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
            </div>
          </div>

          {/* Reward & Questions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Reward Coins <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🪙</span>
                <input type="number" min="1" value={form.rewardCoins} onChange={(e) => set("rewardCoins", e.target.value)}
                  className={`w-full pl-8 pr-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 transition ${errors.rewardCoins ? "border-red-400 bg-red-50" : "border-gray-200"}`} />
              </div>
              {errors.rewardCoins && <p className="text-xs text-red-500 mt-1">{errors.rewardCoins}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Questions <span className="text-red-500">*</span></label>
              <input type="number" min="1" value={form.questionCount} onChange={(e) => set("questionCount", e.target.value)}
                className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 transition ${errors.questionCount ? "border-red-400 bg-red-50" : "border-gray-200"}`} />
              {errors.questionCount && <p className="text-xs text-red-500 mt-1">{errors.questionCount}</p>}
            </div>
          </div>

          {/* Prize Setup */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <FiAward className="text-amber-500" />
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Prize Setup</span>
              <span className="text-xs text-amber-500 font-normal">(optional)</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { field: "firstPrizeCoins",  medal: "🥇", label: "1st Place" },
                { field: "secondPrizeCoins", medal: "🥈", label: "2nd Place" },
                { field: "thirdPrizeCoins",  medal: "🥉", label: "3rd Place" },
              ].map(({ field, medal, label }) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">{medal} {label}</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs">🪙</span>
                    <input type="number" min="1" value={form[field]} onChange={(e) => set(field, e.target.value)}
                      placeholder="—"
                      className="w-full pl-7 pr-2.5 py-2 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 transition bg-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        <div className="shrink-0 px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} disabled={submitting}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 shadow-md shadow-indigo-200 transition disabled:opacity-60">
            {submitting ? <><FiRefreshCw className="animate-spin" /> Saving…</> : <><FiEdit2 /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── Delete Confirm Modal ─────────────── */

const DeleteEventModal = ({ event, onConfirm, onCancel, submitting }) => {
  if (!event) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!submitting ? onCancel : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="h-1.5 w-full bg-red-500" />
        <div className="p-6">
          <button onClick={onCancel} disabled={submitting}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition disabled:opacity-40">
            <FiX />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
            <FiTrash2 className="text-2xl text-red-500" />
          </div>

          <h2 className="text-lg font-bold text-gray-800">Delete Event</h2>
          <p className="mt-1 text-sm text-gray-500">
            This event will be permanently removed. This cannot be undone.
          </p>

          <div className="mt-4 p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Event</span>
              <span className="font-semibold text-gray-700 truncate max-w-[180px]">{event.title}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Status</span>
              <StatusBadge active={event.active} />
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2.5 p-3 rounded-lg bg-red-50 text-red-700 text-xs">
            <FiAlertTriangle className="shrink-0 mt-0.5" />
            <span>Events with existing participants cannot be deleted.</span>
          </div>

          <div className="mt-6 flex items-center gap-3 justify-end">
            <button onClick={onCancel} disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition disabled:opacity-50">
              Cancel
            </button>
            <button onClick={onConfirm} disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 shadow-md shadow-red-200 transition disabled:opacity-60">
              {submitting ? <><FiRefreshCw className="animate-spin" /> Deleting…</> : <><FiTrash2 /> Yes, Delete</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── Toggle Confirm Modal ─────────────── */

const ToggleModal = ({ event, onConfirm, onCancel, submitting }) => {
  if (!event) return null;
  const toActive = !event.active;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!submitting ? onCancel : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className={`h-1.5 w-full ${toActive ? "bg-emerald-500" : "bg-gray-400"}`} />
        <div className="p-6">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition disabled:opacity-40"
          >
            <FiX />
          </button>

          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${toActive ? "bg-emerald-50" : "bg-gray-100"}`}>
            {toActive
              ? <FiCheckCircle className="text-2xl text-emerald-500" />
              : <FiToggleLeft className="text-2xl text-gray-400" />
            }
          </div>

          <h2 className="text-lg font-bold text-gray-800">
            {toActive ? "Activate Event" : "Deactivate Event"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {toActive
              ? "This event will be visible and accessible to users."
              : "This event will be hidden from users until reactivated."}
          </p>

          <div className="mt-5 p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Event</span>
              <span className="font-semibold text-gray-700 truncate max-w-[160px]">{event.title}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Current Status</span>
              <StatusBadge active={event.active} />
            </div>
          </div>

          <div className={`mt-4 flex items-start gap-2.5 p-3 rounded-lg text-xs ${toActive ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
            <FiAlertTriangle className="shrink-0 mt-0.5" />
            <span>
              {toActive
                ? "Users will immediately be able to participate in this challenge."
                : "Any ongoing participation will be paused."}
            </span>
          </div>

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
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-60 shadow-md ${
                toActive
                  ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200"
                  : "bg-gray-500 hover:bg-gray-600 shadow-gray-200"
              }`}
            >
              {submitting
                ? <><FiRefreshCw className="animate-spin" /> Please wait…</>
                : toActive
                  ? <><FiCheckCircle /> Yes, Activate</>
                  : <><FiToggleLeft /> Yes, Deactivate</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── Distribute Prizes Modal ─────────────── */

const DistributePrizesModal = ({ event, onConfirm, onCancel, submitting }) => {
  if (!event) return null;
  const prizes = [
    { medal: "🥇", label: "1st Place", coins: event.firstPrizeCoins },
    { medal: "🥈", label: "2nd Place", coins: event.secondPrizeCoins },
    { medal: "🥉", label: "3rd Place", coins: event.thirdPrizeCoins },
  ].filter((p) => p.coins);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!submitting ? onCancel : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 to-yellow-500" />
        <div className="p-6">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition disabled:opacity-40"
          >
            <FiX />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
            <FiAward className="text-2xl text-amber-500" />
          </div>

          <h2 className="text-lg font-bold text-gray-800">Distribute Prizes</h2>
          <p className="mt-1 text-sm text-gray-500">
            This will credit coins to the top 3 finishers. This action cannot be undone.
          </p>

          {/* Event info */}
          <div className="mt-4 p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Event</span>
              <span className="font-semibold text-gray-700 truncate max-w-[160px]">{event.title}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Ended</span>
              <span className="text-gray-700">{fmtDate(event.endDate)}</span>
            </div>
          </div>

          {/* Prize breakdown */}
          {prizes.length > 0 && (
            <div className="mt-3 space-y-2">
              {prizes.map(({ medal, label, coins }) => (
                <div
                  key={label}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-amber-50 border border-amber-100"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {medal} {label}
                  </span>
                  <span className="text-sm font-bold text-amber-700">
                    {coins.toLocaleString()} 🪙
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-start gap-2.5 p-3 rounded-lg bg-red-50 text-red-700 text-xs">
            <FiAlertTriangle className="shrink-0 mt-0.5" />
            <span>
              Prizes can only be distributed once. Make sure the event results are final before proceeding.
            </span>
          </div>

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
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 shadow-md shadow-amber-200 transition disabled:opacity-60"
            >
              {submitting
                ? <><FiRefreshCw className="animate-spin" /> Distributing…</>
                : <><FiAward /> Distribute Prizes</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── Leaderboard Modal ─────────────── */

const fmtTime = (secs) => {
  if (!secs) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const MEDAL = ["🥇", "🥈", "🥉"];

const LeaderboardModal = ({ event, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getLeaderboard(event.id);
        if (!cancelled) setData(res.data ?? res);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message ?? "Failed to load leaderboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [event.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-purple-600 shrink-0" />

        {/* header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <FiUsers className="text-indigo-500 text-lg" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">Leaderboard</h2>
              <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[280px]">{event.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition">
            <FiX />
          </button>
        </div>

        {/* body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
              <FiLoader className="text-3xl animate-spin" />
              <span className="text-sm">Loading leaderboard…</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-red-400">
              <FiAlertTriangle className="text-3xl" />
              <span className="text-sm">{error}</span>
            </div>
          ) : (
            <>
              {/* summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                  { label: "Total Participants", value: data.totalParticipants ?? 0 },
                  { label: "1st Prize", value: data.firstPrizeCoins ? `${data.firstPrizeCoins.toLocaleString()} 🪙` : "—" },
                  { label: "2nd Prize", value: data.secondPrizeCoins ? `${data.secondPrizeCoins.toLocaleString()} 🪙` : "—" },
                  { label: "3rd Prize", value: data.thirdPrizeCoins ? `${data.thirdPrizeCoins.toLocaleString()} 🪙` : "—" },
                ].map((s) => (
                  <div key={s.label} className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                    <div className="text-sm font-bold text-gray-800">{s.value}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* prizes distributed badge */}
              {data.prizeDistributed && (
                <div className="mb-4 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                  <FiAward /> Prizes have been distributed for this event
                </div>
              )}

              {/* leaderboard table */}
              {data.leaderboard?.length > 0 ? (
                <div className="rounded-xl overflow-hidden border border-gray-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide w-12">Rank</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">User</th>
                        <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Score</th>
                        <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                          <span className="flex items-center justify-center gap-1"><FiClock /> Time</span>
                        </th>
                        <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Coins</th>
                        {data.prizeDistributed && (
                          <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Prize</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.leaderboard.map((entry) => (
                        <tr key={entry.userId} className="hover:bg-gray-50/60 transition">
                          <td className="px-4 py-3 text-center">
                            {entry.rank <= 3
                              ? <span className="text-lg">{MEDAL[entry.rank - 1]}</span>
                              : <span className="text-xs font-bold text-gray-400">#{entry.rank}</span>
                            }
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              {entry.pictureUrl ? (
                                <img src={entry.pictureUrl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                  <span className="text-xs font-bold text-indigo-500">
                                    {entry.username?.[0]?.toUpperCase() ?? "?"}
                                  </span>
                                </div>
                              )}
                              <span className="font-medium text-gray-800 truncate max-w-[140px]">{entry.username}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-semibold text-gray-700">{entry.correctCount}</span>
                          </td>
                          <td className="px-4 py-3 text-center text-xs text-gray-500">
                            {fmtTime(entry.timeTakenSeconds)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-xs font-semibold text-amber-600">
                              {entry.coinsEarned > 0 ? `${entry.coinsEarned.toLocaleString()} 🪙` : "—"}
                            </span>
                          </td>
                          {data.prizeDistributed && (
                            <td className="px-4 py-3 text-center">
                              {entry.prizeCoins ? (
                                <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                  +{entry.prizeCoins.toLocaleString()} 🪙
                                </span>
                              ) : (
                                <span className="text-xs text-gray-300">—</span>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-14 text-gray-400 gap-2">
                  <FiUsers className="text-4xl text-gray-200" />
                  <span className="text-sm">No completed entries yet.</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─────────────── Main Page ─────────────── */

const DailyChallenge = () => {
  const [events, setEvents]             = useState([]);
  const [categories, setCategories]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showCreate, setShowCreate]     = useState(false);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [toggling, setToggling]         = useState(false);
  const [distributeTarget, setDistributeTarget] = useState(null);
  const [distributing, setDistributing] = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const [leaderboardTarget, setLeaderboardTarget] = useState(null);
  const [search, setSearch]             = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [evRes, catRes] = await Promise.allSettled([getAllEvents(), getAllCategories()]);
      if (evRes.status === "fulfilled" && evRes.value.success) setEvents(evRes.value.data ?? []);
      else toast.error("Failed to load events");
      if (catRes.status === "fulfilled" && catRes.value.success) setCategories(catRes.value.data ?? []);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── toggle handler ── */
  const handleToggleConfirm = async () => {
    if (!toggleTarget) return;
    setToggling(true);
    try {
      const res = await toggleEvent(toggleTarget.id);
      if (res.success) {
        toast.success(`Event ${res.data.active ? "activated" : "deactivated"} successfully`);
        setEvents((prev) =>
          prev.map((e) => (e.id === toggleTarget.id ? { ...e, active: res.data.active } : e))
        );
        setToggleTarget(null);
      } else {
        toast.error(res.message || "Toggle failed");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Toggle failed");
    } finally {
      setToggling(false);
    }
  };

  /* ── distribute prizes handler ── */
  const handleDistributeConfirm = async () => {
    if (!distributeTarget) return;
    setDistributing(true);
    try {
      const res = await distributePrizes(distributeTarget.id);
      if (res.success) {
        toast.success("Prizes distributed successfully to top 3 winners!");
        setEvents((prev) =>
          prev.map((e) => (e.id === distributeTarget.id ? { ...e, prizeDistributed: true } : e))
        );
        setDistributeTarget(null);
      } else {
        toast.error(res.message || "Distribution failed");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Distribution failed");
    } finally {
      setDistributing(false);
    }
  };

  /* ── delete handler ── */
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteEvent(deleteTarget.id);
      toast.success("Event deleted successfully");
      setEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to delete event");
    } finally {
      setDeleting(false);
    }
  };

  /* ── derived ── */
  const activeCount      = events.filter((e) => e.active).length;
  const inactiveCount    = events.filter((e) => !e.active).length;
  const distributedCount = events.filter((e) => e.prizeDistributed).length;

  const filtered = events.filter((e) => {
    const matchStatus =
      filterStatus === "ALL" ||
      (filterStatus === "ACTIVE"   && e.active) ||
      (filterStatus === "INACTIVE" && !e.active) ||
      (filterStatus === "ENDED"    && hasEnded(e.endDate));
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      e.title?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q) ||
      e.category?.name?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const FILTER_TABS = [
    { key: "ALL",      label: "All",     count: events.length },
    { key: "ACTIVE",   label: "Active",  count: activeCount },
    { key: "INACTIVE", label: "Inactive",count: inactiveCount },
    { key: "ENDED",    label: "Ended",   count: events.filter((e) => hasEnded(e.endDate)).length },
  ];

  return (
    <div>
      {/* modals */}
      {showCreate && (
        <CreateEventModal
          categories={categories}
          onClose={() => setShowCreate(false)}
          onCreated={(newEvent) => setEvents((prev) => [newEvent, ...prev])}
        />
      )}
      {editTarget && (
        <EditEventModal
          event={editTarget}
          categories={categories}
          onClose={() => setEditTarget(null)}
          onUpdated={(updated) =>
            setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
          }
        />
      )}
      <DeleteEventModal
        event={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => !deleting && setDeleteTarget(null)}
        submitting={deleting}
      />
      <ToggleModal
        event={toggleTarget}
        onConfirm={handleToggleConfirm}
        onCancel={() => !toggling && setToggleTarget(null)}
        submitting={toggling}
      />
      <DistributePrizesModal
        event={distributeTarget}
        onConfirm={handleDistributeConfirm}
        onCancel={() => !distributing && setDistributeTarget(null)}
        submitting={distributing}
      />
      {leaderboardTarget && (
        <LeaderboardModal
          event={leaderboardTarget}
          onClose={() => setLeaderboardTarget(null)}
        />
      )}

      {/* header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Daily Challenges</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage timed challenge events for your users
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAll}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-50 shadow-sm"
          >
            <FiRefreshCw className={`text-sm ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 rounded-xl shadow-md shadow-red-200 transition"
          >
            <FiPlus />
            New Event
          </button>
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Total Events",
            value: events.length,
            icon: <FiZap />,
            color: "text-indigo-500",
            bg: "bg-indigo-50",
          },
          {
            label: "Active Events",
            value: activeCount,
            icon: <FiCheckCircle />,
            color: "text-emerald-500",
            bg: "bg-emerald-50",
          },
          {
            label: "Inactive Events",
            value: inactiveCount,
            icon: <FiToggleLeft />,
            color: "text-gray-400",
            bg: "bg-gray-100",
          },
          {
            label: "Prizes Distributed",
            value: distributedCount,
            icon: <FiAward />,
            color: "text-amber-500",
            bg: "bg-amber-50",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-4 p-5 bg-white rounded-xl shadow-sm hover:-translate-y-0.5 hover:shadow-md transition"
          >
            <div className={`w-12 h-12 rounded-xl ${s.bg} ${s.color} flex items-center justify-center text-xl shrink-0`}>
              {s.icon}
            </div>
            <div className="min-w-0">
              <div className="text-xl font-bold text-gray-800">
                {loading ? "—" : s.value}
              </div>
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
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filterStatus === tab.key
                    ? "bg-[#1e1e2d] text-white shadow"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {tab.label}
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                  filterStatus === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
            <div className="ml-auto pl-3 shrink-0">
              <div className="relative">
                <FiHelpCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search events…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 w-36 sm:w-48 transition"
                />
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
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Title</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Category</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Date Range</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Reward</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Prizes</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Qs</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {[40, 160, 100, 150, 80, 110, 40, 90, 120].map((w, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: w }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center text-gray-400 text-sm">
                    <FiZap className="text-5xl mx-auto mb-3 text-gray-200" />
                    {search || filterStatus !== "ALL"
                      ? "No events match your current filter."
                      : "No daily challenge events yet. Create your first one!"}
                  </td>
                </tr>
              ) : (
                filtered.map((event) => {
                  const ended = hasEnded(event.endDate);
                  const hasPrizes = event.firstPrizeCoins || event.secondPrizeCoins || event.thirdPrizeCoins;
                  const canDistribute = ended && hasPrizes && !event.prizeDistributed;

                  return (
                    <tr key={event.id} className="hover:bg-gray-50/70 transition">
                      {/* ID */}
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                          #{event.id}
                        </span>
                      </td>

                      {/* Title + description */}
                      <td className="px-5 py-3.5 max-w-[180px]">
                        <div className="text-sm font-semibold text-gray-800 truncate">{event.title}</div>
                        {event.description && (
                          <div className="text-xs text-gray-400 mt-0.5 truncate">{event.description}</div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-5 py-3.5">
                        {event.category ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
                            style={{
                              backgroundColor: event.category.backgroundColor
                                ? `${event.category.backgroundColor}20`
                                : "#f3f4f6",
                              borderColor: event.category.color ?? "#e5e7eb",
                              color: event.category.color ?? "#6b7280",
                            }}
                          >
                            {event.category.icon && <span>{event.category.icon}</span>}
                            {event.category.name}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300 italic">—</span>
                        )}
                      </td>

                      {/* Date Range */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <FiCalendar className="text-gray-400 shrink-0" />
                          <span>{fmtDate(event.startDate)}</span>
                          <span className="text-gray-300">→</span>
                          <span className={ended ? "text-red-400 font-medium" : ""}>{fmtDate(event.endDate)}</span>
                        </div>
                        {ended && (
                          <span className="mt-1 inline-block text-[10px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                            Ended
                          </span>
                        )}
                      </td>

                      {/* Reward */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-gray-800">
                          <FiGift className="text-amber-400" />
                          {(event.rewardCoins ?? 0).toLocaleString()}
                          <span className="text-xs font-normal text-gray-400 ml-0.5">🪙</span>
                        </span>
                      </td>

                      {/* Prizes */}
                      <td className="px-5 py-3.5">
                        {hasPrizes ? (
                          <div className="flex flex-col gap-0.5 text-xs">
                            {event.firstPrizeCoins  && <span>🥇 {event.firstPrizeCoins.toLocaleString()}</span>}
                            {event.secondPrizeCoins && <span>🥈 {event.secondPrizeCoins.toLocaleString()}</span>}
                            {event.thirdPrizeCoins  && <span>🥉 {event.thirdPrizeCoins.toLocaleString()}</span>}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300 italic">—</span>
                        )}
                      </td>

                      {/* Question count */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                          <FiHelpCircle className="text-indigo-400" />
                          {event.questionCount ?? "—"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1">
                          <StatusBadge active={event.active} />
                          {event.prizeDistributed && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
                              <FiAward className="text-[10px]" /> Prizes Sent
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1.5">
                          <button
                            onClick={() => setToggleTarget(event)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                              event.active
                                ? "text-gray-600 bg-gray-100 hover:bg-gray-200"
                                : "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                            }`}
                          >
                            {event.active
                              ? <><FiToggleLeft /> Deactivate</>
                              : <><FiToggleRight /> Activate</>
                            }
                          </button>
                          <button
                            onClick={() => setLeaderboardTarget(event)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 transition"
                          >
                            <FiUsers /> Leaderboard
                          </button>
                          <button
                            onClick={() => setEditTarget(event)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition"
                          >
                            <FiEdit2 /> Edit
                          </button>
                          {canDistribute && (
                            <button
                              onClick={() => setDistributeTarget(event)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition"
                            >
                              <FiAward /> Distribute Prizes
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteTarget(event)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition"
                          >
                            <FiTrash2 /> Delete
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

        {/* footer */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 flex-wrap gap-2">
            <span>Showing {filtered.length} of {events.length} events</span>
            <span>
              Active:{" "}
              <strong className="text-emerald-600">{activeCount}</strong>
              {" · "}Inactive:{" "}
              <strong className="text-gray-500">{inactiveCount}</strong>
              {" · "}Prizes Sent:{" "}
              <strong className="text-amber-600">{distributedCount}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyChallenge;
