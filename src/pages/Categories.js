import { useState, useEffect, useCallback } from "react";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/categoryService";
import { toast } from "react-toastify";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiGrid,
} from "react-icons/fi";

const emptyForm = {
  name: "",
  subtitle: "",
  icon: "",
  color: "#6366f1",
  backgroundColor: "#eef2ff",
  active: true,
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await getAllCategories();
      if (res.success) {
        setCategories(res.data);
      }
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditing(cat.id);
    setForm({
      name: cat.name,
      subtitle: cat.subtitle || "",
      icon: cat.icon || "",
      color: cat.color || "#6366f1",
      backgroundColor: cat.backgroundColor || "#eef2ff",
      active: cat.active,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    setSubmitting(true);
    try {
      if (editing) {
        const res = await updateCategory(editing, form);
        if (res.success) {
          toast.success("Category updated successfully");
        }
      } else {
        const res = await createCategory(form);
        if (res.success) {
          toast.success("Category created successfully");
        }
      }
      closeModal();
      fetchCategories();
    } catch {
      toast.error(editing ? "Failed to update category" : "Failed to create category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;

    try {
      const res = await deleteCategory(id);
      if (res.success) {
        toast.success("Category deleted successfully");
        fetchCategories();
      }
    } catch {
      toast.error("Failed to delete category");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-72 text-gray-500 text-base">
        Loading categories...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Manage movie guess categories</p>
        </div>
        <button
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/30 transition"
          onClick={openCreate}
        >
          <FiPlus />
          <span>Add Category</span>
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl text-gray-400 text-center">
          <FiGrid size={48} />
          <h3 className="mt-4 text-gray-700 text-lg font-semibold">No categories yet</h3>
          <p className="text-sm mt-1 mb-5">Create your first category to get started</p>
          <button
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-red-500/30 transition"
            onClick={openCreate}
          >
            <FiPlus />
            <span>Add Category</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3.5 px-5 py-4 bg-white rounded-xl shadow-sm hover:-translate-y-0.5 hover:shadow-md transition"
            >
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center text-xl font-bold shrink-0"
                style={{
                  backgroundColor: cat.backgroundColor || "#eef2ff",
                  color: cat.color || "#6366f1",
                }}
              >
                {cat.icon || cat.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-800 truncate">{cat.name}</h3>
                {cat.subtitle && (
                  <p className="text-xs text-gray-400 truncate mt-0.5">{cat.subtitle}</p>
                )}
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${
                  cat.active
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {cat.active ? "Active" : "Inactive"}
              </span>
              <div className="flex gap-1.5 shrink-0">
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 text-sm transition"
                  onClick={() => openEdit(cat)}
                  title="Edit"
                >
                  <FiEdit2 />
                </button>
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-sm transition"
                  onClick={() => handleDelete(cat.id)}
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
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-5"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {editing ? "Edit Category" : "Add Category"}
              </h2>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 text-lg transition"
                onClick={closeModal}
              >
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-xs font-semibold text-gray-700">Name *</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Bollywood"
                  className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="subtitle" className="text-xs font-semibold text-gray-700">Subtitle</label>
                <input
                  id="subtitle"
                  name="subtitle"
                  type="text"
                  value={form.subtitle}
                  onChange={handleChange}
                  placeholder="e.g. Hindi Movies"
                  className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="icon" className="text-xs font-semibold text-gray-700">Icon (emoji or letter)</label>
                <input
                  id="icon"
                  name="icon"
                  type="text"
                  value={form.icon}
                  onChange={handleChange}
                  placeholder="e.g. 🎬 or B"
                  className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="color" className="text-xs font-semibold text-gray-700">Color</label>
                  <div className="flex items-center gap-2.5 px-3 py-1.5 border border-gray-200 rounded-lg">
                    <input
                      id="color"
                      name="color"
                      type="color"
                      value={form.color}
                      onChange={handleChange}
                      className="w-7 h-7 border-none rounded-md cursor-pointer p-0 bg-transparent"
                    />
                    <span className="text-xs text-gray-500 font-mono">{form.color}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="backgroundColor" className="text-xs font-semibold text-gray-700">Background</label>
                  <div className="flex items-center gap-2.5 px-3 py-1.5 border border-gray-200 rounded-lg">
                    <input
                      id="backgroundColor"
                      name="backgroundColor"
                      type="color"
                      value={form.backgroundColor}
                      onChange={handleChange}
                      className="w-7 h-7 border-none rounded-md cursor-pointer p-0 bg-transparent"
                    />
                    <span className="text-xs text-gray-500 font-mono">{form.backgroundColor}</span>
                  </div>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-sm text-gray-700">
                <input
                  name="active"
                  type="checkbox"
                  checked={form.active}
                  onChange={handleChange}
                  className="w-4.5 h-4.5 accent-red-600 cursor-pointer"
                />
                <span>Active</span>
              </label>

              {/* Preview */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-gray-700">Preview</span>
                <div
                  className="flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-semibold"
                  style={{
                    backgroundColor: form.backgroundColor,
                    color: form.color,
                  }}
                >
                  <span className="text-xl">
                    {form.icon || form.name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                  <span>{form.name || "Category"}</span>
                </div>
              </div>

              <div className="flex gap-2.5 justify-end pt-2">
                <button
                  type="button"
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-red-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition"
                  disabled={submitting}
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

export default Categories;
