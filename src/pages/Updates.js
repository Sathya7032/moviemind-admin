import { useState, useEffect, useCallback } from "react";
import {
  getAllUpdates,
  createUpdate,
  updateUpdate,
  deleteUpdate,
} from "../services/updatesService";
import { toast } from "react-toastify";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiBell,
  FiSearch,
} from "react-icons/fi";

const emptyForm = {
  title: "",
  description: "",
};

const Updates = () => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUpdates = useCallback(async () => {
    try {
      const res = await getAllUpdates();
      if (res.success) {
        setUpdates(res.data);
      }
    } catch {
      toast.error("Failed to load updates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (update) => {
    setEditing(update.id);
    setForm({
      title: update.title || "",
      description: update.description || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!form.description.trim()) {
      toast.error("Description is required");
      return;
    }

    setSubmitting(true);
    try {
      if (editing) {
        const res = await updateUpdate(editing, form);
        if (res.success) {
          toast.success("Update updated successfully");
          fetchUpdates();
        }
      } else {
        const res = await createUpdate(form);
        if (res.success) {
          toast.success("Update created successfully");
          fetchUpdates();
        }
      }
      closeModal();
    } catch {
      toast.error(editing ? "Failed to update" : "Failed to create update");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this update?")) return;

    try {
      const res = await deleteUpdate(id);
      if (res.success) {
        toast.success("Update deleted successfully");
        fetchUpdates();
      }
    } catch {
      toast.error("Failed to delete update");
    }
  };

  const filteredUpdates = updates.filter(update =>
    update.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    update.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-72 text-gray-500 text-base">
        Loading updates...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Updates</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage app notifications and updates</p>
        </div>
        <button
          className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/30 transition"
          onClick={openCreate}
        >
          <FiPlus />
          <span>Add Update</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search updates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition"
          />
        </div>
      </div>

      {/* Updates List */}
      {filteredUpdates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 bg-white rounded-xl text-gray-400 text-center px-4">
          <FiBell size={40} className="sm:size-[48px]" />
          <h3 className="mt-4 text-gray-700 text-base sm:text-lg font-semibold">No updates yet</h3>
          <p className="text-xs sm:text-sm mt-1 mb-5">Create your first update to get started</p>
          <button
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-red-500/30 transition"
            onClick={openCreate}
          >
            <FiPlus />
            <span>Add Update</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredUpdates.map((update) => (
            <div
              key={update.id}
              className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 bg-white rounded-xl shadow-sm hover:-translate-y-0.5 hover:shadow-md transition"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center text-lg shrink-0 bg-amber-50 text-amber-600 font-semibold">
                🔔
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-800 line-clamp-2">{update.title}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{update.description}</p>
              </div>
              <div className="flex gap-1.5 shrink-0 w-full sm:w-auto">
                <button
                  className="flex-1 sm:flex-none w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 text-sm transition"
                  onClick={() => openEdit(update)}
                  title="Edit"
                >
                  <FiEdit2 />
                </button>
                <button
                  className="flex-1 sm:flex-none w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-sm transition"
                  onClick={() => handleDelete(update.id)}
                  title="Delete"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4 sm:p-5"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="text-base sm:text-lg font-bold text-gray-800">
                {editing ? "Edit Update" : "Add Update"}
              </h2>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 text-lg transition shrink-0"
                onClick={closeModal}
              >
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="title" className="text-xs font-semibold text-gray-700">
                  Title *
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. New Feature Announcement"
                  className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="description" className="text-xs font-semibold text-gray-700">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Enter update description..."
                  rows="5"
                  className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition resize-none"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:shadow-lg hover:shadow-red-500/30 disabled:opacity-50 transition"
                >
                  {submitting ? "Saving..." : editing ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Updates;
