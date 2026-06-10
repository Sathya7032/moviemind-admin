import { useState, useEffect, useCallback } from "react";
import {
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} from "../services/bannerService";
import { toast } from "react-toastify";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiImage,
  FiSearch,
  FiUpload,
} from "react-icons/fi";

const emptyForm = {
  title: "",
  description: "",
};

const Banners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const fetchBanners = useCallback(async () => {
    try {
      const res = await getAllBanners();
      if (res.success) {
        setBanners(res.data || []);
      }
    } catch {
      toast.error("Failed to load banners");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview("");
    setShowModal(true);
  };

  const openEdit = (banner) => {
    setEditing(banner.id);
    setForm({
      title: banner.title || "",
      description: banner.description || "",
    });
    setImageFile(null);
    setImagePreview(banner.imageUrl || "");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 5MB allowed.`);
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!editing && !imageFile) {
      toast.error("Image file is required");
      return;
    }

    setSubmitting(true);
    try {
      if (editing) {
        const res = await updateBanner(editing, form, imageFile);
        if (res.success) {
          toast.success("Banner updated successfully");
        }
      } else {
        const res = await createBanner(form, imageFile);
        if (res.success) {
          toast.success("Banner created successfully");
        }
      }
      closeModal();
      fetchBanners();
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.message;
      toast.error(serverMsg || (editing ? "Failed to update banner" : "Failed to create banner"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this banner?")) return;

    try {
      const res = await deleteBanner(id);
      if (res.success) {
        toast.success("Banner deleted successfully");
        fetchBanners();
      }
    } catch {
      toast.error("Failed to delete banner");
    }
  };

  const filteredBanners = banners.filter(banner =>
    (banner.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (banner.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-72 text-gray-500 text-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
          <span>Loading banners...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Promo Banners</h1>
          <p className="text-sm text-gray-500 mt-1">Manage interactive promotional banners displayed in the app</p>
        </div>
        <button
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/30 transition-all duration-200"
          onClick={openCreate}
        >
          <FiPlus />
          <span>Add Banner</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search banners by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition"
          />
        </div>
      </div>

      {/* Banners List */}
      {filteredBanners.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-150 text-gray-400 text-center px-4">
          <FiImage size={48} className="text-gray-300 mb-3" />
          <h3 className="text-gray-700 text-lg font-semibold">No banners found</h3>
          <p className="text-sm mt-1 mb-5">Create your first banner to display promotions to app users</p>
          <button
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-red-500/30 transition"
            onClick={openCreate}
          >
            <FiPlus />
            <span>Add Banner</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredBanners.map((banner) => (
            <div
              key={banner.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col h-full"
            >
              {/* Banner Image Area */}
              <div className="relative aspect-[21/9] w-full overflow-hidden bg-gray-50 border-b border-gray-100 shrink-0">
                {banner.imageUrl ? (
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=600"; // Fallback aesthetic background
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-400">
                    <FiImage size={32} />
                  </div>
                )}
              </div>

              {/* Banner Details */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-gray-800 line-clamp-1">{banner.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-3 leading-relaxed">{banner.description || "No description provided."}</p>
                </div>

                <div className="flex gap-2.5 pt-4 border-t border-gray-50 shrink-0">
                  <button
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors duration-150"
                    onClick={() => openEdit(banner)}
                  >
                    <FiEdit2 size={13} />
                    <span>Edit</span>
                  </button>
                  <button
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-red-50 text-red-500 hover:bg-red-100 transition-colors duration-150"
                    onClick={() => handleDelete(banner.id)}
                  >
                    <FiTrash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4 sm:p-5 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-150 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-800">
                {editing ? "Edit Banner" : "Add Banner"}
              </h2>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 text-lg transition shrink-0"
                onClick={closeModal}
              >
                <FiX />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
              {/* Title Input */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="title" className="text-xs font-semibold text-gray-700">
                  Banner Title *
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Summer Quiz Challenge"
                  className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition"
                />
              </div>

              {/* Description Input */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="description" className="text-xs font-semibold text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe what happens when users tap the banner..."
                  rows="3"
                  className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition resize-none"
                />
              </div>

              {/* Drag & Drop File Upload Container */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  Banner Image *
                </label>
                
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`relative aspect-[21/9] w-full border-2 border-dashed rounded-xl overflow-hidden flex flex-col items-center justify-center p-4 transition-all duration-200 ${
                    dragActive
                      ? "border-red-500 bg-red-50/50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                  }`}
                >
                  {imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity duration-200">
                        <button
                          type="button"
                          className="p-2 bg-white text-gray-800 rounded-full hover:bg-gray-100 transition shadow-md"
                          onClick={() => document.getElementById("bannerImageUpload").click()}
                        >
                          <FiUpload size={16} />
                        </button>
                        <button
                          type="button"
                          className="p-2 bg-white text-red-600 rounded-full hover:bg-gray-100 transition shadow-md"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview("");
                          }}
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => document.getElementById("bannerImageUpload").click()}
                      className="flex flex-col items-center gap-2 text-center"
                    >
                      <FiImage size={36} className="text-gray-300" />
                      <div>
                        <span className="text-xs font-bold text-red-500 hover:underline">Click to upload</span>
                        <span className="text-xs text-gray-500"> or drag and drop</span>
                      </div>
                      <span className="text-[10px] text-gray-400">PNG, JPG, JPEG (Max 5MB)</span>
                    </button>
                  )}
                  
                  <input
                    type="file"
                    accept="image/*"
                    id="bannerImageUpload"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) handleFileSelect(file);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-center gap-3 justify-end pt-3 mt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/30 disabled:opacity-50 disabled:transform-none disabled:shadow-none transition-all duration-200"
                >
                  {submitting ? "Saving..." : editing ? "Save Changes" : "Create Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Banners;
