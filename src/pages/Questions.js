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
  FiZap,
} from "react-icons/fi";
import { 
  generateQuestion
} from "../services/aiService";

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
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiCategory, setAiCategory] = useState("");
  const [aiGameMode, setAiGameMode] = useState("TAGLINE");
  const [aiDifficulty, setAiDifficulty] = useState("medium");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [sortOrder, setSortOrder] = useState("asc");

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

  useEffect(() => {
    if (showAIModal && filterCategory) {
      setAiCategory(filterCategory);
    }
  }, [showAIModal, filterCategory]);

  const getCategoryName = (catId) => {
    const cat = categories.find((c) => c.id === catId);
    return cat?.name || "Unknown";
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      categoryId: filterCategory || "",
    });
    setImageFile(null);
    setImagePreview("");
    setIsAiGenerated(false);
    setShowModal(true);
  };

  const openEdit = (q) => {
    setEditing(q.id);
    setImageFile(null);
    setImagePreview("");
    setIsAiGenerated(false);
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
      questionNumber: q.questionNumber || "",
      categoryId: q.categoryId || "",
      options: q.options?.length
        ? q.options.map((o) => ({
            optionText: o.optionText,
            correct: o.correct,
          }))
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
      toast.error(
        serverMsg ||
          (editing ? "Failed to update question" : "Failed to create question"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this question?"))
      return;
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

  const handleAIGenerate = async () => {
    if (!aiCategory) {
      toast.error("Please select a category");
      return;
    }

    setIsGenerating(true);
    const category = categories.find((c) => String(c.id) === aiCategory);

    // Calculate the next question number for THIS category
    const categoryQuestions = questions.filter(q => String(q.categoryId) === aiCategory);
    const lastNum = categoryQuestions.length > 0 
      ? Math.max(...categoryQuestions.map(q => Number(q.questionNumber) || 0))
      : 0;
    const nextNum = lastNum + 1;

    try {
      toast.info(`Generating ${aiDifficulty} difficulty Question ${nextNum} with AI...`);
      const q = await generateQuestion(category.name, aiGameMode, nextNum, aiDifficulty, aiPrompt);

      // Reset image states for fresh AI generation
      setImageFile(null);
      setImagePreview("");

      setForm({
        ...emptyForm,
        ...q,
        movieName: `Question ${nextNum}`, // Set movieName to Question X as requested
        categoryId: aiCategory,
        questionNumber: nextNum,
      });

      setIsAiGenerated(true);
      toast.success(`AI generated Question ${nextNum}! You can now preview and save it.`);
      setShowAIModal(false);
      setShowModal(true);
    } catch (err) {
      toast.error(err.message || "Failed to generate question");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    const maxSize = 5 * 1024 * 1024; // 5MB
    console.log(
      "Selected file size:",
      (file.size / 1024 / 1024).toFixed(2),
      "MB",
    );
    if (file.size > maxSize) {
      toast.error(
        `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 5MB allowed.`,
      );
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const activeFilterCount = [
    filterCategory,
    filterGameMode,
    filterQuestionType,
  ].filter(Boolean).length;

  const filtered = questions
    .filter((q) => {
      const matchSearch =
        !search ||
        q.movieName?.toLowerCase().includes(search.toLowerCase()) ||
        q.questionText?.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        !filterCategory || String(q.categoryId) === filterCategory;
      const matchGameMode = !filterGameMode || q.gameMode === filterGameMode;
      const matchQuestionType =
        !filterQuestionType || q.questionType === filterQuestionType;
      return matchSearch && matchCategory && matchGameMode && matchQuestionType;
    })
    .sort((a, b) => {
      const numA = Number(a.questionNumber) || 0;
      const numB = Number(b.questionNumber) || 0;
      if (numA !== numB) {
        return sortOrder === "asc" ? numA - numB : numB - numA;
      }
      return sortOrder === "asc" ? a.id - b.id : b.id - a.id;
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
          <p className="text-sm text-gray-500 mt-1">
            Manage movie guess questions &amp; options
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30 transition"
            onClick={() => setShowAIModal(true)}
          >
            <FiZap />
            <span>AI Add Question</span>
          </button>
          <button
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/30 transition"
            onClick={openCreate}
          >
            <FiPlus />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-thin border-b border-gray-100">
        <button
          onClick={() => setFilterCategory("")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
            filterCategory === ""
              ? "bg-red-600 text-white shadow-md shadow-red-200"
              : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
          }`}
        >
          All Categories
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setFilterCategory(String(c.id))}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              filterCategory === String(c.id)
                ? "bg-red-600 text-white shadow-md shadow-red-200"
                : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Filters & Sort */}
      <div className="flex gap-3 mb-5 flex-wrap items-center">
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

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white cursor-pointer min-w-[180px] focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none"
        >
          <option value="asc">Question No: Low to High</option>
          <option value="desc">Question No: High to Low</option>
        </select>
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
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
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
          <h3 className="mt-4 text-gray-700 text-lg font-semibold">
            No questions found
          </h3>
          <p className="text-sm mt-1 mb-5">
            {questions.length === 0
              ? "Create your first question to get started"
              : "Try adjusting your filters"}
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
            <div
              key={q.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition"
            >
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer gap-4"
                onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-50 text-indigo-500 text-xs font-bold shrink-0">
                    Q{q.questionNumber}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-gray-800 truncate">
                      {q.movieName}
                    </h4>
                    <p className="text-xs text-gray-500 truncate max-w-[400px] mt-0.5">
                      {q.questionText}
                    </p>
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
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                          Tagline
                        </span>
                        <p className="italic text-sm text-gray-600 mt-1">
                          {q.tagline}
                        </p>
                      </div>
                    )}
                    {q.gameMode === "DIALOGUE" && q.dialogue && (
                      <div className="col-span-full bg-gray-50 p-3 rounded-lg border-l-[3px] border-indigo-500">
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                          Dialogue
                        </span>
                        <p className="italic text-sm text-gray-600 mt-1">
                          "{q.dialogue}"
                        </p>
                      </div>
                    )}
                    {q.gameMode === "SCENE" && q.sceneDescription && (
                      <div className="col-span-full bg-gray-50 p-3 rounded-lg border-l-[3px] border-indigo-500">
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                          Scene Description
                        </span>
                        <p className="text-sm text-gray-600 mt-1">
                          {q.sceneDescription}
                        </p>
                      </div>
                    )}
                    {q.gameMode === "IMAGE" && (
                      <div className="col-span-full bg-gray-50 p-3 rounded-lg border-l-[3px] border-indigo-500">
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                          Image
                        </span>
                        {q.imageUrl ? (
                          <img
                            src={q.imageUrl}
                            alt={q.movieName}
                            className="max-w-[200px] max-h-[140px] rounded-lg object-cover mt-1"
                          />
                        ) : (
                          <span className="text-gray-400 text-sm">
                            No image uploaded
                          </span>
                        )}
                      </div>
                    )}
                    {q.correctAnswer && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                          Correct Answer
                        </span>
                        <span className="text-emerald-600 font-semibold text-sm">
                          {q.correctAnswer}
                        </span>
                      </div>
                    )}
                  </div>

                  {q.questionType === "MCQ" && q.options?.length > 0 && (
                    <div className="pb-3">
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                        Options (MCQ)
                      </span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {q.options.map((opt, i) => (
                          <span
                            key={opt.id || i}
                            className={`px-3.5 py-1.5 rounded-full text-xs ${
                              opt.correct
                                ? "bg-green-100 text-green-800 font-semibold"
                                : "bg-gray-100 text-gray-700"
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
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                        Fill in the Blank
                      </span>
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
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-5"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">
                {editing ? "Edit Question" : "Add Question"}
              </h2>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 text-lg transition"
                onClick={closeModal}
              >
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Sidebar - Settings & Media */}
                  <div className="w-full lg:w-80 shrink-0 space-y-6">
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 shadow-sm">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-4 block">
                        Media Asset
                      </label>
                      
                      <div className="space-y-4">
                        {/* Image Preview Area */}
                        <div className="relative aspect-video bg-white rounded-xl border-2 border-dashed border-gray-200 overflow-hidden group">
                          {imagePreview || form.imageUrl ? (
                            <>
                              <img
                                src={imagePreview || form.imageUrl}
                                alt="Preview"
                                crossOrigin="anonymous"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                                <button
                                  type="button"
                                  className="p-2 bg-white text-gray-800 rounded-full hover:bg-gray-100 transition"
                                  onClick={() => document.getElementById("imageUpload").click()}
                                >
                                  <FiUpload size={16} />
                                </button>
                                <button
                                  type="button"
                                  className="p-2 bg-white text-red-600 rounded-full hover:bg-gray-100 transition"
                                  onClick={() => {
                                    setImageFile(null);
                                    setImagePreview("");
                                    setForm((prev) => ({ ...prev, imageUrl: "" }));
                                  }}
                                >
                                  <FiX size={16} />
                                </button>
                              </div>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => document.getElementById("imageUpload").click()}
                              className="w-full h-full flex flex-col items-center justify-center gap-2 hover:bg-gray-100 transition"
                            >
                              <FiImage size={32} className="text-gray-300" />
                              <span className="text-[10px] font-bold text-gray-400 uppercase">
                                Click to Upload
                              </span>
                            </button>
                          )}
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
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Reward</label>
                        <div className="flex bg-white rounded-xl border border-gray-200 overflow-hidden">
                          <span className="px-3 py-2 bg-gray-50 border-r border-gray-100 flex items-center">🪙</span>
                          <input
                            type="number"
                            name="rewardCoins"
                            value={form.rewardCoins}
                            onChange={handleChange}
                            className="w-full px-3 py-2 text-sm outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Position</label>
                        <div className="flex bg-white rounded-xl border border-gray-200 overflow-hidden">
                          <span className="px-3 py-2 bg-gray-50 border-r border-gray-100 flex items-center text-[10px] font-bold">#</span>
                          <input
                            type="text"
                            name="questionNumber"
                            value={form.questionNumber ?? ""}
                            onChange={handleChange}
                            className="w-full px-3 py-2 text-sm outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Form Content */}
                  <div className="flex-1 space-y-6">
                    {/* Mode bar */}
                    <div className="bg-gray-50 rounded-2xl p-4 flex flex-wrap gap-6 border border-gray-100">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Question Format</label>
                        <div className="flex p-1 bg-white border border-gray-200 rounded-full">
                          {["MCQ", "FILL_BLANK"].map((t) => (
                            <button
                              key={t}
                              type="button"
                              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                form.questionType === t ? "bg-red-600 text-white shadow-md shadow-red-200" : "text-gray-500 hover:text-red-600"
                              }`}
                              onClick={() => setForm((p) => ({ ...p, questionType: t }))}
                            >
                              {t === "MCQ" ? "Multiple Choice" : "Fill Blank"}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Game Variant</label>
                        <div className="flex p-1 bg-white border border-gray-200 rounded-full gap-1">
                          {["TAGLINE", "DIALOGUE", "SCENE", "IMAGE"].map((m) => (
                            <button
                              key={m}
                              type="button"
                              className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                                form.gameMode === m ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-gray-500 hover:text-indigo-600"
                              }`}
                              onClick={() => setForm((p) => ({ ...p, gameMode: m }))}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 ml-1">Sequence Name</label>
                        <input
                          name="movieName"
                          value={form.movieName}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-500/5 outline-none transition-all text-sm font-medium"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 ml-1">Category</label>
                        <select
                          name="categoryId"
                          value={form.categoryId}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-500/5 outline-none transition-all text-sm font-medium"
                        >
                          <option value="">Choose Category...</option>
                          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 ml-1">Question Content</label>
                      <textarea
                        rows={3}
                        name="questionText"
                        value={form.questionText}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-500/5 outline-none transition-all text-sm resize-none"
                      />
                    </div>

                    {/* Context fields based on mode */}
                    {form.gameMode === "TAGLINE" && (
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-amber-600">Tagline Context</label>
                        <input name="tagline" value={form.tagline} onChange={handleChange} className="w-full px-4 py-2 bg-white border border-amber-200 rounded-lg outline-none text-sm" />
                      </div>
                    )}
                    {form.gameMode === "DIALOGUE" && (
                      <div className="p-4 bg-cyan-50 rounded-xl border border-cyan-100 space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-cyan-600">Dialogue Context</label>
                        <textarea name="dialogue" value={form.dialogue} onChange={handleChange} className="w-full px-4 py-2 bg-white border border-cyan-200 rounded-lg outline-none text-sm resize-none" />
                      </div>
                    )}
                    {form.gameMode === "SCENE" && (
                      <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-emerald-600">Scene Description</label>
                        <textarea rows={2} name="sceneDescription" value={form.sceneDescription} onChange={handleChange} className="w-full px-4 py-2 bg-white border-emerald-200 rounded-lg outline-none text-sm resize-none" />
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-xs font-bold text-gray-600">Correct Answer</label>
                        <span className="text-[10px] text-gray-400 uppercase tracking-tighter">Required for validation</span>
                      </div>
                      <input name="correctAnswer" value={form.correctAnswer} onChange={handleChange} className="w-full px-4 py-3 bg-emerald-50/30 border border-emerald-100 rounded-xl focus:border-emerald-500 outline-none transition-all text-sm font-bold text-emerald-700" />
                    </div>

                    {form.questionType === "MCQ" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between ml-1">
                          <label className="text-xs font-bold text-gray-600">Response Options</label>
                          <button type="button" onClick={addOption} className="text-[10px] font-bold text-indigo-600 hover:underline">+ ADD CUSTOM OPTION</button>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {form.options.map((opt, i) => (
                            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${opt.correct ? "bg-emerald-50 border-emerald-200" : "bg-white border-gray-100 hover:border-gray-200"}`}>
                              <span className={`w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-black ${opt.correct ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-500"}`}>{String.fromCharCode(65+i)}</span>
                              <input value={opt.optionText} onChange={(e) => handleOptionChange(i, "optionText", e.target.value)} className="flex-1 bg-transparent border-none outline-none text-sm font-medium" />
                              <button type="button" onClick={() => handleOptionChange(i, "correct", !opt.correct)} className={`text-[10px] font-bold px-3 py-1 rounded-full ${opt.correct ? "bg-emerald-500 text-white" : "text-gray-400 hover:text-emerald-600"}`}>{opt.correct ? "CORRECT" : "SET CORRECT"}</button>
                              <button type="button" onClick={() => removeOption(i)} className="text-gray-300 hover:text-red-500"><FiX size={14}/></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <button type="button" onClick={closeModal} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition">Discard Changes</button>
                <div className="flex gap-3">
                  {isAiGenerated && !editing && (
                    <button type="button" disabled={isGenerating} onClick={handleAIGenerate} className="flex items-center gap-2 px-6 py-2.5 bg-white border border-indigo-200 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-50 transition shadow-sm">
                      {isGenerating ? <div className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" /> : <FiZap />}
                      Regenerate
                    </button>
                  )}
                  <button type="submit" disabled={submitting || isGenerating} className="px-8 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition active:scale-95 disabled:opacity-50">
                    {submitting ? "Processing..." : editing ? "Update Question" : "Publish Question"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* AI Generation Modal */}
      {showAIModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[250] p-5"
          onClick={() => !isGenerating && setShowAIModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-indigo-50">
              <div className="flex items-center gap-2 text-indigo-700">
                <FiZap className="text-xl" />
                <h2 className="text-lg font-bold">AI Magic Generator</h2>
              </div>
              {!isGenerating && (
                <button
                  onClick={() => setShowAIModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX size={20} />
                </button>
              )}
            </div>

            <div className="p-6 space-y-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">
                  Select Category
                </label>
                <select
                  value={aiCategory}
                  onChange={(e) => setAiCategory(e.target.value)}
                  disabled={isGenerating}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition disabled:bg-gray-50"
                >
                  <option value="">Choose category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">
                  Select Game Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["TAGLINE", "DIALOGUE", "SCENE", "IMAGE"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      disabled={isGenerating}
                      className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition ${
                        aiGameMode === m
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "border-gray-200 text-gray-600 hover:border-indigo-500 hover:text-indigo-600"
                      }`}
                      onClick={() => setAiGameMode(m)}
                    >
                      {m.charAt(0) + m.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">
                  Select Difficulty
                </label>
                <div className="flex gap-2 p-1 bg-gray-50 rounded-xl border border-gray-100">
                  {["easy", "medium", "hard"].map((d) => (
                    <button
                      key={d}
                      type="button"
                      disabled={isGenerating}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        aiDifficulty === d
                          ? d === "easy" ? "bg-green-600 text-white shadow-sm" :
                            d === "medium" ? "bg-amber-500 text-white shadow-sm" :
                            "bg-red-600 text-white shadow-sm"
                          : "text-gray-500 hover:bg-white hover:text-gray-700"
                      }`}
                      onClick={() => setAiDifficulty(d)}
                    >
                      {d.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">
                  Custom Prompt <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  disabled={isGenerating}
                  placeholder="e.g. A question about the movie 'Inception' or 'Make it a trick question'"
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition disabled:bg-gray-50 resize-none text-sm"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleAIGenerate}
                  disabled={isGenerating || !aiCategory}
                  className={`w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-3 ${
                    isGenerating || !aiCategory
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98]"
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Generating Question...</span>
                    </>
                  ) : (
                    <>
                      <FiZap />
                      <span>Generate & Preview Question</span>
                    </>
                  )}
                </button>
                <p className="text-center text-[11px] text-gray-400 mt-3 italic">
                  * This will generate 1 question for you to preview and save.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Questions;
