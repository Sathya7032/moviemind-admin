import { useState, useEffect, useCallback } from "react";
import {
  getAllVideos,
  createVideo,
  updateVideo,
  deleteVideo,
} from "../services/homepageVideoService";
import { toast } from "react-toastify";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiVideo,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

const emptyForm = {
  title: "",
  videoUrl: "",
  serialNumber: 1,
  active: true,
};

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

const HomepageVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  /* --- Pagination State --- */
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllVideos();
      if (res.success && res.data) {
        setVideos(res.data || []);
      } else {
        toast.error("Failed to load homepage videos");
      }
    } catch {
      toast.error("Failed to load homepage videos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const openCreate = () => {
    setEditingId(null);
    // Suggest the next serial number automatically
    const maxSerial = videos.reduce((max, v) => (v.serialNumber > max ? v.serialNumber : max), 0);
    setForm({
      ...emptyForm,
      serialNumber: maxSerial + 1,
    });
    setShowModal(true);
  };

  const openEdit = (video) => {
    setEditingId(video.id);
    setForm({
      title: video.title || "",
      videoUrl: video.videoUrl || "",
      serialNumber: video.serialNumber ?? 1,
      active: video.active ?? true,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }));
  };

  const handleToggleActive = async (video) => {
    const originalVideos = [...videos];
    const newActiveState = !video.active;

    // Optimistically update UI
    setVideos((prev) =>
      prev.map((v) => (v.id === video.id ? { ...v, active: newActiveState } : v))
    );

    try {
      const res = await updateVideo(video.id, { active: newActiveState });
      if (res.success) {
        toast.success(`Video "${video.title}" ${newActiveState ? "activated" : "deactivated"}`);
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Failed to update status");
      setVideos(originalVideos); // Revert on failure
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!form.videoUrl.trim()) {
      toast.error("Video URL is required");
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        const res = await updateVideo(editingId, form);
        if (res.success) {
          toast.success("Homepage video updated successfully");
          setVideos((prev) =>
            prev.map((v) => (v.id === editingId ? { ...v, ...res.data } : v))
          );
        }
      } else {
        const res = await createVideo(form);
        if (res.success) {
          toast.success("Homepage video created successfully");
          setVideos((prev) => [...prev, res.data]);
        }
      }
      closeModal();
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.message;
      toast.error(serverMsg || (editingId ? "Failed to update video" : "Failed to create video"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (video) => {
    if (!window.confirm(`Are you sure you want to delete "${video.title}"?`)) return;

    try {
      const res = await deleteVideo(video.id);
      if (res.success) {
        toast.success("Homepage video deleted successfully");
        setVideos((prev) => prev.filter((v) => v.id !== video.id));
      }
    } catch {
      toast.error("Failed to delete video");
    }
  };

  /* --- Client-Side Search & Sort by Serial Number --- */
  const filtered = videos
    .filter((v) => {
      const q = search.toLowerCase();
      return (
        v.title?.toLowerCase().includes(q) ||
        v.videoUrl?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => (a.serialNumber || 0) - (b.serialNumber || 0));

  const totalElements = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  /* --- Truncated Pagination helper --- */
  const renderPageNumbers = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
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
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                page === p ? "bg-red-600 text-white shadow" : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              {p}
            </button>
          );
        })}
      </>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Homepage Videos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage promotional/introductory videos displayed on the homepage slider
          </p>
        </div>
        <button
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/30 transition-all duration-200"
          onClick={openCreate}
        >
          <FiPlus />
          <span>Add Video</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 mb-5 items-center max-w-sm">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
          <input
            type="text"
            placeholder="Search by title or video URL..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:border-red-500 outline-none transition"
          />
        </div>
      </div>

      {/* Videos List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
            <span className="text-gray-500 text-sm">Loading homepage videos...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-center">
            <FiVideo size={48} className="text-gray-200 mb-3" />
            <h3 className="text-gray-700 text-base font-semibold">No videos found</h3>
            <p className="text-xs mt-1">Try adjusting your search or add a new video.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left border-b border-gray-100">
                    <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">#</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Seq No</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Title</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Video URL</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Created At</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map((video, idx) => (
                    <tr key={video.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-5 py-3.5 text-sm text-gray-400">
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-sm text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md">
                          #{video.serialNumber}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-gray-800">
                        {video.title}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-indigo-600 font-mono select-all truncate max-w-[240px]">
                        <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {video.videoUrl}
                        </a>
                      </td>
                      <td className="px-5 py-3.5 text-sm">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={video.active}
                            onChange={() => handleToggleActive(video)}
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
                          <span className={`ml-2 text-xs font-bold ${video.active ? "text-emerald-600" : "text-gray-400"}`}>
                            {video.active ? "Active" : "Inactive"}
                          </span>
                        </label>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 font-mono">
                        {formatDate(video.createdTime)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(video)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition"
                          >
                            <FiEdit2 /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(video)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition"
                          >
                            <FiTrash2 /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {totalElements > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-4 border-t border-gray-100 text-sm text-gray-500 gap-4 bg-gray-50/20">
                <span>
                  Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalElements)} of {totalElements} entries
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition"
                  >
                    <FiChevronLeft /> Prev
                  </button>
                  {renderPageNumbers()}
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
          </>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Colour Strip */}
            <div className="h-1.5 w-full bg-red-600" />

            <form onSubmit={handleSubmit} className="p-6">
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                <FiX />
              </button>

              <h2 className="text-lg font-bold text-gray-800 mb-4">
                {editingId ? "Edit Homepage Video" : "Add Homepage Video"}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Enter video title"
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Video URL</label>
                  <input
                    type="url"
                    name="videoUrl"
                    value={form.videoUrl}
                    onChange={handleChange}
                    placeholder="Enter video URL (e.g. YouTube or MP4 Link)"
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-300"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Serial Number</label>
                    <input
                      type="number"
                      name="serialNumber"
                      value={form.serialNumber}
                      onChange={handleChange}
                      placeholder="Sequence Order"
                      min={1}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                      required
                    />
                  </div>

                  <div className="flex items-end pb-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="active"
                        checked={form.active}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
                      <span className="ml-2 text-xs font-semibold text-gray-700">Active</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/30 active:scale-[0.99] transition disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Save Video"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomepageVideos;
