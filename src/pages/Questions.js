import { useState, useEffect, useCallback } from "react";
import {
  getAllQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
} from "../services/questionService";
import { getAllCategories } from "../services/categoryService";
import { toast } from "react-toastify";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiHelpCircle,
  FiChevronDown,
  FiChevronUp,
  FiSearch,
  FiFilter,
  FiUpload,
  FiImage,
} from "react-icons/fi";

const emptyOption = { optionText: "", correct: false };

const emptyForm = {
  movieName: "",
  questionText: "",
  tagline: "",
  dialogue: "",
  sceneDescription: "",
  imageUrl: "",
  correctAnswer: "",
  questionType: "MCQ",
  gameMode: "TAGLINE",
  rewardCoins: 10,
  questionNumber: 1,
  categoryId: "",
  options: [
    { optionText: "", correct: false },
    { optionText: "", correct: false },
    { optionText: "", correct: false },
    { optionText: "", correct: false },
  ],
};

const Questions = () => {
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterGameMode, setFilterGameMode] = useState("");
  const [filterQuestionType, setFilterQuestionType] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [qRes, cRes] = await Promise.all([
        getAllQuestions(),
        getAllCategories(),
      ]);
      if (qRes.success) setQuestions(qRes.data);
      if (cRes.success) setCategories(cRes.data);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getCategoryName = (catId) => {
    const cat = categories.find((c) => c.id === catId);
    return cat?.name || "Unknown";
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (q) => {
    setEditing(q.id);
    setImageFile(null);
    setImagePreview("");
    setForm({
      movieName: q.movieName || "",
      questionText: q.questionText || "",
      tagline: q.tagline || "",
      dialogue: q.dialogue || "",
      sceneDescription: q.sceneDescription || "",
      imageUrl: q.imageUrl || "",
      correctAnswer: q.correctAnswer || "",
      questionType: q.questionType || "MCQ",
      gameMode: q.gameMode || "CLASSIC",
      rewardCoins: q.rewardCoins || 10,
      questionNumber: q.questionNumber || 1,
      categoryId: q.categoryId || "",
      options: q.options?.length
        ? q.options.map((o) => ({ optionText: o.optionText, correct: o.correct }))
        : [emptyOption, emptyOption, emptyOption, emptyOption],
    });
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
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleOptionChange = (index, field, value) => {
    setForm((prev) => {
      const options = [...prev.options];
      options[index] = { ...options[index], [field]: value };
      return { ...prev, options };
    });
  };

  const addOption = () => {
    setForm((prev) => ({
      ...prev,
      options: [...prev.options, { ...emptyOption }],
    }));
  };

  const removeOption = (index) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.movieName.trim() || !form.questionText.trim()) {
      toast.error("Movie name and question text are required");
      return;
    }
    if (!form.categoryId) {
      toast.error("Please select a category");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        categoryId: Number(form.categoryId),
        options: form.options.filter((o) => o.optionText.trim()),
      };

      if (editing) {
        const res = await updateQuestion(editing, payload, imageFile);
        if (res.success) toast.success("Question updated successfully");
      } else {
        const res = await addQuestion(payload, imageFile);
        if (res.success) toast.success("Question created successfully");
      }
      closeModal();
      fetchData();
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.message;
      console.error("Question save error:", err.response?.data || err);
      toast.error(serverMsg || (editing ? "Failed to update question" : "Failed to create question"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      const res = await deleteQuestion(id);
      if (res.success) {
        toast.success("Question deleted successfully");
        fetchData();
      }
    } catch {
      toast.error("Failed to delete question");
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    const maxSize = 5 * 1024 * 1024; // 5MB
    console.log("Selected file size:", (file.size / 1024 / 1024).toFixed(2), "MB");
    if (file.size > maxSize) {
      toast.error(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 5MB allowed.`);
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const activeFilterCount = [filterCategory, filterGameMode, filterQuestionType].filter(Boolean).length;

  const filtered = questions.filter((q) => {
    const matchSearch =
      !search ||
      q.movieName?.toLowerCase().includes(search.toLowerCase()) ||
      q.questionText?.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      !filterCategory || String(q.categoryId) === filterCategory;
    const matchGameMode =
      !filterGameMode || q.gameMode === filterGameMode;
    const matchQuestionType =
      !filterQuestionType || q.questionType === filterQuestionType;
    return matchSearch && matchCategory && matchGameMode && matchQuestionType;
  });

  const clearAllFilters = () => {
    setFilterCategory("");
    setFilterGameMode("");
    setFilterQuestionType("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-72 text-gray-500 text-base">
        Loading questions...
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Questions</h1>
          <p className="text-sm text-gray-500 mt-1">Manage movie guess questions &amp; options</p>
        </div>
        <button
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/30 transition"
          onClick={openCreate}
        >
          <FiPlus />
          <span>Add Question</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
          <input
            type="text"
            placeholder="Search by movie or question..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition"
          />
        </div>
        <button
          className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition ${
            showFilters || activeFilterCount > 0
              ? "border-red-500 bg-red-50 text-red-600"
              : "border-gray-200 bg-white text-gray-700 hover:border-red-500 hover:text-red-600"
          }`}
          onClick={() => setShowFilters((prev) => !prev)}
        >
          <FiFilter />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-[11px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-5 shadow-sm">
          <div className="flex gap-3 flex-wrap items-center">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white cursor-pointer min-w-[160px] focus:border-red-500 outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={filterGameMode}
              onChange={(e) => setFilterGameMode(e.target.value)}
              className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white cursor-pointer min-w-[160px] focus:border-red-500 outline-none"
            >
              <option value="">All Game Modes</option>
              <option value="TAGLINE">Tagline</option>
              <option value="DIALOGUE">Dialogue</option>
              <option value="SCENE">Scene</option>
              <option value="IMAGE">Image</option>
            </select>
            <select
              value={filterQuestionType}
              onChange={(e) => setFilterQuestionType(e.target.value)}
              className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white cursor-pointer min-w-[160px] focus:border-red-500 outline-none"
            >
              <option value="">All Question Types</option>
              <option value="MCQ">MCQ</option>
              <option value="FILL_BLANK">Fill in the Blank</option>
            </select>
            {activeFilterCount > 0 && (
              <button
                className="flex items-center gap-1 px-4 py-2.5 bg-red-50 text-red-500 rounded-lg text-xs font-semibold hover:bg-red-100 transition"
                onClick={clearAllFilters}
              >
                <FiX /> Clear All
              </button>
            )}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl text-gray-400 text-center">
          <FiHelpCircle size={48} />
          <h3 className="mt-4 text-gray-700 text-lg font-semibold">No questions found</h3>
          <p className="text-sm mt-1 mb-5">
            {questions.length === 0 ? "Create your first question to get started" : "Try adjusting your filters"}
          </p>
          {questions.length === 0 && (
            <button
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-sm font-semibold transition"
              onClick={openCreate}
            >
              <FiPlus />
              <span>Add Question</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((q) => (
            <div key={q.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer gap-4"
                onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-50 text-indigo-500 text-xs font-bold shrink-0">
                    Q{q.questionNumber}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-gray-800 truncate">{q.movieName}</h4>
                    <p className="text-xs text-gray-500 truncate max-w-[400px] mt-0.5">{q.questionText}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-gray-400">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-600 whitespace-nowrap">
                    {q.questionType}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 whitespace-nowrap">
                    {q.gameMode}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-green-50 text-green-700 whitespace-nowrap hidden sm:inline">
                    {getCategoryName(q.categoryId)}
                  </span>
                  <span className="text-xs font-semibold text-amber-600 whitespace-nowrap hidden sm:inline">
                    🪙 {q.rewardCoins}
                  </span>
                  {expandedId === q.id ? <FiChevronUp /> : <FiChevronDown />}
                </div>
              </div>

              {expandedId === q.id && (
                <div className="px-5 pb-5 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-4">
                    {q.gameMode === "TAGLINE" && q.tagline && (
                      <div className="col-span-full bg-gray-50 p-3 rounded-lg border-l-[3px] border-indigo-500">
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Tagline</span>
                        <p className="italic text-sm text-gray-600 mt-1">{q.tagline}</p>
                      </div>
                    )}
                    {q.gameMode === "DIALOGUE" && q.dialogue && (
                      <div className="col-span-full bg-gray-50 p-3 rounded-lg border-l-[3px] border-indigo-500">
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Dialogue</span>
                        <p className="italic text-sm text-gray-600 mt-1">"{q.dialogue}"</p>
                      </div>
                    )}
                    {q.gameMode === "SCENE" && q.sceneDescription && (
                      <div className="col-span-full bg-gray-50 p-3 rounded-lg border-l-[3px] border-indigo-500">
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Scene Description</span>
                        <p className="text-sm text-gray-600 mt-1">{q.sceneDescription}</p>
                      </div>
                    )}
                    {q.gameMode === "IMAGE" && (
                      <div className="col-span-full bg-gray-50 p-3 rounded-lg border-l-[3px] border-indigo-500">
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Image</span>
                        {q.imageUrl ? (
                          <img src={q.imageUrl} alt={q.movieName} className="max-w-[200px] max-h-[140px] rounded-lg object-cover mt-1" />
                        ) : (
                          <span className="text-gray-400 text-sm">No image uploaded</span>
                        )}
                      </div>
                    )}
                    {q.correctAnswer && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Correct Answer</span>
                        <span className="text-emerald-600 font-semibold text-sm">{q.correctAnswer}</span>
                      </div>
                    )}
                  </div>

                  {q.questionType === "MCQ" && q.options?.length > 0 && (
                    <div className="pb-3">
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Options (MCQ)</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {q.options.map((opt, i) => (
                          <span
                            key={opt.id || i}
                            className={`px-3.5 py-1.5 rounded-full text-xs ${
                              opt.correct ? "bg-green-100 text-green-800 font-semibold" : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {String.fromCharCode(65 + i)}. {opt.optionText}
                            {opt.correct && " ✓"}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {q.questionType === "FILL_BLANK" && (
                    <div className="pb-3">
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Fill in the Blank</span>
                      <div className="mt-2">
                        <span className="inline-block px-6 py-2 border-2 border-dashed border-indigo-400 rounded-lg bg-indigo-50 text-indigo-600 font-semibold text-sm tracking-wide">
                          {q.correctAnswer || "_______"}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium hover:bg-indigo-100 transition"
                      onClick={() => openEdit(q)}
                    >
                      <FiEdit2 /> Edit
                    </button>
                    <button
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-500 rounded-lg text-xs font-medium hover:bg-red-100 transition"
                      onClick={() => handleDelete(q.id)}
                    >
                      <FiTrash2 /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-5" onClick={closeModal}>
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">
                {editing ? "Edit Question" : "Add Question"}
              </h2>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 text-lg transition" onClick={closeModal}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              {/* Mode bar */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 block">Question Type</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {["MCQ", "FILL_BLANK"].map((t) => (
                        <button
                          key={t}
                          type="button"
                          className={`px-4 py-1.5 rounded-full border text-xs font-medium transition ${
                            form.questionType === t
                              ? "bg-red-600 border-red-600 text-white font-semibold"
                              : "border-gray-200 bg-white text-gray-500 hover:border-red-500 hover:text-red-500"
                          }`}
                          onClick={() => setForm((p) => ({ ...p, questionType: t }))}
                        >
                          {t === "MCQ" ? "Multiple Choice" : "Fill in the Blank"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 block">Game Mode</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {["TAGLINE", "DIALOGUE", "SCENE", "IMAGE"].map((m) => (
                        <button
                          key={m}
                          type="button"
                          className={`px-4 py-1.5 rounded-full border text-xs font-medium transition ${
                            form.gameMode === m
                              ? "bg-red-600 border-red-600 text-white font-semibold"
                              : "border-gray-200 bg-white text-gray-500 hover:border-red-500 hover:text-red-500"
                          }`}
                          onClick={() => setForm((p) => ({ ...p, gameMode: m }))}
                        >
                          {m.charAt(0) + m.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <hr className="my-4 border-gray-100" />

              {/* Basic info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700">Movie Name <span className="text-red-500">*</span></label>
                  <input
                    name="movieName"
                    value={form.movieName}
                    onChange={handleChange}
                    placeholder="e.g. Inception"
                    className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700">Category <span className="text-red-500">*</span></label>
                  <select
                    name="categoryId"
                    value={form.categoryId}
                    onChange={handleChange}
                    className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition"
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 mb-4">
                <label className="text-xs font-semibold text-gray-700">Question Text <span className="text-red-500">*</span></label>
                <textarea
                  rows={2}
                  name="questionText"
                  value={form.questionText}
                  onChange={handleChange}
                  placeholder="e.g. Which movie has this dialogue?"
                  className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition resize-none"
                />
              </div>

              {/* Game-mode specific fields */}
              {form.gameMode === "TAGLINE" && (
                <div className="mb-4 bg-blue-50/50 rounded-lg p-4 border-l-[3px] border-red-500">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-2 mb-1.5">
                    <span className="bg-amber-400 text-amber-900 px-2 py-0.5 rounded text-[10px] font-bold">Tagline</span>
                    Movie Tagline
                  </label>
                  <input
                    name="tagline"
                    value={form.tagline}
                    onChange={handleChange}
                    placeholder="Enter the movie's tagline"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition"
                  />
                </div>
              )}

              {form.gameMode === "DIALOGUE" && (
                <div className="mb-4 bg-blue-50/50 rounded-lg p-4 border-l-[3px] border-red-500">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-2 mb-1.5">
                    <span className="bg-cyan-400 text-cyan-900 px-2 py-0.5 rounded text-[10px] font-bold">Dialogue</span>
                    Famous Dialogue
                  </label>
                  <textarea
                    rows={2}
                    name="dialogue"
                    value={form.dialogue}
                    onChange={handleChange}
                    placeholder="Enter the famous dialogue"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition resize-none"
                  />
                </div>
              )}

              {form.gameMode === "SCENE" && (
                <div className="mb-4 bg-blue-50/50 rounded-lg p-4 border-l-[3px] border-red-500">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-2 mb-1.5">
                    <span className="bg-emerald-400 text-emerald-900 px-2 py-0.5 rounded text-[10px] font-bold">Scene</span>
                    Scene Description
                  </label>
                  <textarea
                    rows={3}
                    name="sceneDescription"
                    value={form.sceneDescription}
                    onChange={handleChange}
                    placeholder="Describe the scene in detail..."
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition resize-none"
                  />
                </div>
              )}

              {form.gameMode === "IMAGE" && (
                <div className="mb-4 bg-blue-50/50 rounded-lg p-4 border-l-[3px] border-red-500">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-2 mb-1.5">
                    <span className="bg-red-400 text-white px-2 py-0.5 rounded text-[10px] font-bold">Image</span>
                    Question Image
                  </label>
                  <div className="mt-2">
                    <input
                      type="file"
                      accept="image/*"
                      id="imageUpload"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) handleFileSelect(file);
                        e.target.value = "";
                      }}
                    />
                    {(imagePreview || form.imageUrl) ? (
                      <div className="relative inline-block rounded-xl overflow-hidden">
                        <img src={imagePreview || form.imageUrl} alt="Preview" className="block max-w-full max-h-[200px] object-cover rounded-xl" />
                        <div className="absolute bottom-0 left-0 right-0 flex gap-2 justify-center p-2.5 bg-gradient-to-t from-black/60 to-transparent rounded-b-xl">
                          <button
                            type="button"
                            className="flex items-center gap-1 px-3 py-1.5 border border-white/70 text-white rounded-md text-xs hover:bg-white/20 transition"
                            onClick={() => document.getElementById("imageUpload").click()}
                          >
                            <FiUpload /> Replace
                          </button>
                          <button
                            type="button"
                            className="flex items-center gap-1 px-3 py-1.5 border border-white/70 text-white rounded-md text-xs hover:bg-white/20 transition"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview("");
                              setForm((prev) => ({ ...prev, imageUrl: "" }));
                            }}
                          >
                            <FiX /> Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="flex flex-col items-center justify-center gap-2 py-8 px-5 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 cursor-pointer hover:border-red-500 hover:bg-red-50 hover:text-red-500 text-gray-400 transition"
                        onClick={() => document.getElementById("imageUpload").click()}
                      >
                        <FiImage size={32} />
                        <span className="text-sm font-medium">Click to upload an image</span>
                        <span className="text-xs text-gray-400">JPG, PNG or WebP (max 5MB)</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Correct Answer */}
              <div className="flex flex-col gap-1.5 mb-4">
                <label className="text-xs font-semibold text-gray-700">
                  Correct Answer
                  {form.questionType === "FILL_BLANK" && <span className="text-red-500"> *</span>}
                </label>
                <input
                  name="correctAnswer"
                  value={form.correctAnswer}
                  onChange={handleChange}
                  placeholder={form.questionType === "FILL_BLANK" ? "The answer the user must type" : "Correct answer text"}
                  className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition"
                />
                {form.questionType === "FILL_BLANK" && (
                  <span className="text-xs text-gray-400">This is what the user needs to type to answer correctly.</span>
                )}
              </div>

              {/* MCQ Options */}
              {form.questionType === "MCQ" && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-semibold text-gray-700">Options <span className="text-red-500">*</span></label>
                    <button
                      type="button"
                      className="flex items-center gap-1 px-3 py-1.5 border border-red-300 text-red-600 rounded-md text-xs font-medium hover:bg-red-50 transition"
                      onClick={addOption}
                    >
                      <FiPlus /> Add Option
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {form.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2.5 bg-white px-3 py-2 rounded-lg border border-gray-100 hover:border-gray-300 transition">
                        <span className="w-7 h-7 flex items-center justify-center rounded-md bg-gray-500 text-white text-xs font-bold shrink-0">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <input
                          placeholder={`Option ${i + 1}`}
                          value={opt.optionText}
                          onChange={(e) => handleOptionChange(i, "optionText", e.target.value)}
                          className="flex-1 text-sm text-gray-800 border-none outline-none bg-transparent"
                        />
                        <label className="flex items-center gap-1.5 text-xs whitespace-nowrap cursor-pointer">
                          <input
                            type="checkbox"
                            checked={opt.correct}
                            onChange={(e) => handleOptionChange(i, "correct", e.target.checked)}
                            className="accent-red-600"
                          />
                          Correct
                        </label>
                        <button
                          type="button"
                          className="w-7 h-7 flex items-center justify-center rounded-md text-red-400 hover:bg-red-50 hover:text-red-600 transition shrink-0"
                          onClick={() => removeOption(i)}
                        >
                          <FiX />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <hr className="my-4 border-gray-100" />

              {/* Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700">Reward Coins</label>
                  <div className="flex">
                    <span className="px-3 py-2.5 bg-gray-100 border border-r-0 border-gray-200 rounded-l-lg text-sm">🪙</span>
                    <input
                      type="number"
                      min="0"
                      name="rewardCoins"
                      value={form.rewardCoins}
                      onChange={handleChange}
                      className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-r-lg text-sm text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700">Question Number</label>
                  <div className="flex">
                    <span className="px-3 py-2.5 bg-gray-100 border border-r-0 border-gray-200 rounded-l-lg text-sm">#</span>
                    <input
                      type="number"
                      min="1"
                      name="questionNumber"
                      value={form.questionNumber}
                      onChange={handleChange}
                      className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-r-lg text-sm text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-red-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {submitting ? "Saving..." : editing ? "Update Question" : "Create Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Questions;
