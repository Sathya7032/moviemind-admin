import { useState, useEffect, useCallback } from "react";
import {
  getAllQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  addQuestionsBulk,
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
  FiLayers,
  FiKey,
  FiEye,
  FiEyeOff,
  FiCpu,
  FiBookOpen,
} from "react-icons/fi";
import {
  generateQuestion
} from "../services/aiService";
import {
  generateQuestionsFromContent,
  getSavedApiKey,
  saveApiKey,
  clearSavedApiKey,
} from "../services/localAiService";

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

const compressImage = (file, targetSizeInBytes = 1024 * 1024) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        let quality = 0.8;
        let scale = 1.0;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const attemptCompression = () => {
          const currentWidth = Math.round(width * scale);
          const currentHeight = Math.round(height * scale);

          canvas.width = currentWidth;
          canvas.height = currentHeight;

          ctx.clearRect(0, 0, currentWidth, currentHeight);
          ctx.drawImage(img, 0, 0, currentWidth, currentHeight);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Canvas to Blob conversion failed"));
                return;
              }

              if (blob.size <= targetSizeInBytes) {
                const compressedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                if (quality > 0.3) {
                  quality -= 0.15;
                  attemptCompression();
                } else if (scale > 0.3) {
                  scale -= 0.2;
                  quality = 0.7;
                  attemptCompression();
                } else {
                  const compressedFile = new File([blob], file.name, {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                }
              }
            },
            "image/jpeg",
            quality
          );
        };

        const maxLimit = 1920;
        if (width > maxLimit || height > maxLimit) {
          scale = maxLimit / Math.max(width, height);
        }

        attemptCompression();
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
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
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkList, setBulkList] = useState([]);
  const [bulkForm, setBulkForm] = useState(emptyForm);
  const [bulkEditingIndex, setBulkEditingIndex] = useState(null);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // AI "generate from content" — runs entirely client-side against Gemini,
  // never touches our backend. Results get queued into bulkList for review.
  const [showAIContentModal, setShowAIContentModal] = useState(false);
  const [aiContentApiKey, setAiContentApiKey] = useState("");
  const [aiContentShowKey, setAiContentShowKey] = useState(false);
  const [aiContentRememberKey, setAiContentRememberKey] = useState(false);
  const [aiContentCategory, setAiContentCategory] = useState("");
  const [aiContentGameMode, setAiContentGameMode] = useState("TAGLINE");
  const [aiContentDifficulty, setAiContentDifficulty] = useState("medium");
  const [aiContentQuestionCount, setAiContentQuestionCount] = useState(5);
  const [aiContentText, setAiContentText] = useState("");
  const [aiContentCustomPrompt, setAiContentCustomPrompt] = useState("");
  const [aiContentGenerating, setAiContentGenerating] = useState(false);

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

  const handleFileSelect = async (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }

    const targetSize = 1024 * 1024; // 1MB
    console.log(
      "Selected file size:",
      (file.size / 1024 / 1024).toFixed(2),
      "MB",
    );

    if (file.size > targetSize) {
      const toastId = toast.info("Compressing image to under 1MB...", { autoClose: false });
      try {
        const compressedFile = await compressImage(file, targetSize);
        console.log(
          "Compressed file size:",
          (compressedFile.size / 1024 / 1024).toFixed(2),
          "MB",
        );
        setImageFile(compressedFile);
        setImagePreview(URL.createObjectURL(compressedFile));
        toast.dismiss(toastId);
        toast.success(`Image compressed successfully to ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
      } catch (err) {
        console.error("Compression error:", err);
        toast.dismiss(toastId);
        toast.error("Failed to compress image. Using original image.");
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 5MB allowed.`);
          return;
        }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
      }
    } else {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const openBulkModal = () => {
    setBulkList([]);
    setBulkForm({ ...emptyForm, categoryId: filterCategory || "" });
    setBulkEditingIndex(null);
    setShowBulkModal(true);
  };

  const closeBulkModal = () => {
    setShowBulkModal(false);
    setBulkList([]);
    setBulkForm(emptyForm);
    setBulkEditingIndex(null);
  };

  const handleBulkChange = (e) => {
    const { name, value, type } = e.target;
    setBulkForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleBulkOptionChange = (index, field, value) => {
    setBulkForm((prev) => {
      const options = [...prev.options];
      options[index] = { ...options[index], [field]: value };
      return { ...prev, options };
    });
  };

  const addBulkOption = () => {
    setBulkForm((prev) => ({
      ...prev,
      options: [...prev.options, { ...emptyOption }],
    }));
  };

  const removeBulkOption = (index) => {
    setBulkForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  // Adds the current form to the list (or saves edits to an existing entry),
  // then resets the form for the next question — keeping category/format/mode
  // and bumping the question number so entry stays fast.
  const addQuestionToBulkList = () => {
    if (!bulkForm.movieName.trim() || !bulkForm.questionText.trim()) {
      toast.error("Movie name and question text are required");
      return;
    }
    if (!bulkForm.categoryId) {
      toast.error("Please select a category");
      return;
    }

    const item = {
      ...bulkForm,
      categoryId: Number(bulkForm.categoryId),
      options: bulkForm.options.filter((o) => o.optionText.trim()),
    };

    if (bulkEditingIndex !== null) {
      setBulkList((prev) => prev.map((q, i) => (i === bulkEditingIndex ? item : q)));
      toast.success("Question updated in list");
    } else {
      setBulkList((prev) => [...prev, item]);
      toast.success("Question added to list");
    }

    setBulkForm({
      ...emptyForm,
      categoryId: bulkForm.categoryId,
      questionType: bulkForm.questionType,
      gameMode: bulkForm.gameMode,
      rewardCoins: bulkForm.rewardCoins,
      questionNumber: (Number(bulkForm.questionNumber) || 0) + 1,
    });
    setBulkEditingIndex(null);
  };

  const editBulkListItem = (index) => {
    setBulkForm({
      ...emptyForm,
      ...bulkList[index],
      options: bulkList[index].options?.length
        ? bulkList[index].options
        : [emptyOption, emptyOption, emptyOption, emptyOption],
    });
    setBulkEditingIndex(index);
  };

  const removeBulkListItem = (index) => {
    setBulkList((prev) => prev.filter((_, i) => i !== index));
    if (bulkEditingIndex === index) {
      setBulkForm({ ...emptyForm, categoryId: filterCategory || "" });
      setBulkEditingIndex(null);
    }
  };

  const submitBulkList = async () => {
    if (bulkList.length === 0) {
      toast.error("Add at least one question to the list first");
      return;
    }

    setBulkSubmitting(true);
    try {
      const res = await addQuestionsBulk(bulkList);
      if (res.success) {
        toast.success(res.message || `${bulkList.length} questions created successfully`);
        closeBulkModal();
        fetchData();
      } else {
        toast.error(res.message || "Failed to add questions");
      }
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.message;
      toast.error(serverMsg || "Failed to add questions");
    } finally {
      setBulkSubmitting(false);
    }
  };

  const openAIContentModal = () => {
    setAiContentApiKey(getSavedApiKey());
    setAiContentCategory(filterCategory || "");
    setAiContentText("");
    setAiContentCustomPrompt("");
    setAiContentQuestionCount(5);
    setShowAIContentModal(true);
  };

  const closeAIContentModal = () => {
    if (aiContentGenerating) return;
    setShowAIContentModal(false);
  };

  const handleGenerateFromContent = async () => {
    if (!aiContentCategory) {
      toast.error("Please select a category");
      return;
    }
    if (!aiContentText.trim()) {
      toast.error("Paste some movie content to generate questions from");
      return;
    }

    const category = categories.find((c) => String(c.id) === String(aiContentCategory));

    // Continue numbering after whatever's already queued for this category.
    const queuedForCategory = bulkList.filter(
      (q) => String(q.categoryId) === String(aiContentCategory)
    );
    const startingQuestionNumber =
      queuedForCategory.length > 0
        ? Math.max(...queuedForCategory.map((q) => Number(q.questionNumber) || 0)) + 1
        : 1;

    setAiContentGenerating(true);
    try {
      const generated = await generateQuestionsFromContent({
        apiKey: aiContentApiKey,
        content: aiContentText,
        categoryName: category?.name || "",
        gameMode: aiContentGameMode,
        difficulty: aiContentDifficulty,
        questionCount: aiContentQuestionCount,
        customPrompt: aiContentCustomPrompt,
        startingQuestionNumber,
      });

      if (aiContentRememberKey) {
        saveApiKey(aiContentApiKey);
      } else {
        clearSavedApiKey();
      }

      const withCategory = generated.map((q) => ({
        ...q,
        categoryId: Number(aiContentCategory),
      }));

      setBulkList((prev) => [...prev, ...withCategory]);
      toast.success(`Generated ${withCategory.length} question${withCategory.length === 1 ? "" : "s"} — review them in the queue`);
      setShowAIContentModal(false);
      setShowBulkModal(true);
    } catch (err) {
      toast.error(err.message || "Failed to generate questions");
    } finally {
      setAiContentGenerating(false);
    }
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
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg hover:border-gray-300 transition"
            onClick={openBulkModal}
          >
            <FiLayers />
            <span>Bulk Add</span>
          </button>
          <button
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/30 transition"
            onClick={openAIContentModal}
          >
            <FiCpu />
            <span>Generate from Content (AI)</span>
          </button>
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
      {/* Bulk Add Modal */}
      {showBulkModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[250] p-5"
          onClick={() => !bulkSubmitting && closeBulkModal()}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-6xl max-h-[92vh] shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-800">
                <FiLayers className="text-xl text-indigo-600" />
                <h2 className="text-lg font-bold">Bulk Add Questions</h2>
                <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-600">
                  {bulkList.length} queued
                </span>
              </div>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 text-lg transition disabled:opacity-40"
                onClick={closeBulkModal}
                disabled={bulkSubmitting}
              >
                <FiX />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              {/* Left: form for the question currently being entered */}
              <div className="flex-1 overflow-y-auto p-6 border-b lg:border-b-0 lg:border-r border-gray-100 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-700">
                    {bulkEditingIndex !== null ? `Editing Question #${bulkEditingIndex + 1} in list` : "New Question"}
                  </h3>
                  {bulkEditingIndex !== null && (
                    <button
                      type="button"
                      onClick={() => {
                        setBulkForm({ ...emptyForm, categoryId: filterCategory || "" });
                        setBulkEditingIndex(null);
                      }}
                      className="text-[11px] font-semibold text-gray-400 hover:text-gray-600"
                    >
                      Cancel edit
                    </button>
                  )}
                </div>

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
                            bulkForm.questionType === t ? "bg-red-600 text-white shadow-md shadow-red-200" : "text-gray-500 hover:text-red-600"
                          }`}
                          onClick={() => setBulkForm((p) => ({ ...p, questionType: t }))}
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
                            bulkForm.gameMode === m ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-gray-500 hover:text-indigo-600"
                          }`}
                          onClick={() => setBulkForm((p) => ({ ...p, gameMode: m }))}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 ml-1">Movie / Sequence Name</label>
                    <input
                      name="movieName"
                      value={bulkForm.movieName}
                      onChange={handleBulkChange}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-500/5 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 ml-1">Category</label>
                    <select
                      name="categoryId"
                      value={bulkForm.categoryId}
                      onChange={handleBulkChange}
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
                    value={bulkForm.questionText}
                    onChange={handleBulkChange}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-500/5 outline-none transition-all text-sm resize-none"
                  />
                </div>

                {/* Context fields based on mode */}
                {bulkForm.gameMode === "TAGLINE" && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-amber-600">Tagline Context</label>
                    <input name="tagline" value={bulkForm.tagline} onChange={handleBulkChange} className="w-full px-4 py-2 bg-white border border-amber-200 rounded-lg outline-none text-sm" />
                  </div>
                )}
                {bulkForm.gameMode === "DIALOGUE" && (
                  <div className="p-4 bg-cyan-50 rounded-xl border border-cyan-100 space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-cyan-600">Dialogue Context</label>
                    <textarea name="dialogue" value={bulkForm.dialogue} onChange={handleBulkChange} className="w-full px-4 py-2 bg-white border border-cyan-200 rounded-lg outline-none text-sm resize-none" />
                  </div>
                )}
                {bulkForm.gameMode === "SCENE" && (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-emerald-600">Scene Description</label>
                    <textarea rows={2} name="sceneDescription" value={bulkForm.sceneDescription} onChange={handleBulkChange} className="w-full px-4 py-2 bg-white border-emerald-200 rounded-lg outline-none text-sm resize-none" />
                  </div>
                )}
                {bulkForm.gameMode === "IMAGE" && (
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-purple-600">Image URL</label>
                    <input
                      name="imageUrl"
                      value={bulkForm.imageUrl}
                      onChange={handleBulkChange}
                      placeholder="https://..."
                      className="w-full px-4 py-2 bg-white border border-purple-200 rounded-lg outline-none text-sm"
                    />
                    <p className="text-[10px] text-purple-400">
                      Bulk add is JSON-only on the server side — paste an image URL rather than uploading a file.
                    </p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-xs font-bold text-gray-600">Correct Answer</label>
                    <span className="text-[10px] text-gray-400 uppercase tracking-tighter">Required for validation</span>
                  </div>
                  <input name="correctAnswer" value={bulkForm.correctAnswer} onChange={handleBulkChange} className="w-full px-4 py-3 bg-emerald-50/30 border border-emerald-100 rounded-xl focus:border-emerald-500 outline-none transition-all text-sm font-bold text-emerald-700" />
                </div>

                {bulkForm.questionType === "MCQ" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-xs font-bold text-gray-600">Response Options</label>
                      <button type="button" onClick={addBulkOption} className="text-[10px] font-bold text-indigo-600 hover:underline">+ ADD CUSTOM OPTION</button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {bulkForm.options.map((opt, i) => (
                        <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${opt.correct ? "bg-emerald-50 border-emerald-200" : "bg-white border-gray-100 hover:border-gray-200"}`}>
                          <span className={`w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-black ${opt.correct ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-500"}`}>{String.fromCharCode(65 + i)}</span>
                          <input value={opt.optionText} onChange={(e) => handleBulkOptionChange(i, "optionText", e.target.value)} className="flex-1 bg-transparent border-none outline-none text-sm font-medium" />
                          <button type="button" onClick={() => handleBulkOptionChange(i, "correct", !opt.correct)} className={`text-[10px] font-bold px-3 py-1 rounded-full ${opt.correct ? "bg-emerald-500 text-white" : "text-gray-400 hover:text-emerald-600"}`}>{opt.correct ? "CORRECT" : "SET CORRECT"}</button>
                          <button type="button" onClick={() => removeBulkOption(i)} className="text-gray-300 hover:text-red-500"><FiX size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 ml-1">Reward Coins</label>
                    <div className="flex bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <span className="px-3 py-2 bg-gray-50 border-r border-gray-100 flex items-center">🪙</span>
                      <input
                        type="number"
                        name="rewardCoins"
                        value={bulkForm.rewardCoins}
                        onChange={handleBulkChange}
                        className="w-full px-3 py-2 text-sm outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 ml-1">Position</label>
                    <div className="flex bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <span className="px-3 py-2 bg-gray-50 border-r border-gray-100 flex items-center text-[10px] font-bold">#</span>
                      <input
                        type="text"
                        name="questionNumber"
                        value={bulkForm.questionNumber ?? ""}
                        onChange={handleBulkChange}
                        className="w-full px-3 py-2 text-sm outline-none"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addQuestionToBulkList}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition active:scale-95"
                >
                  <FiPlus />
                  {bulkEditingIndex !== null ? "Save Changes to List" : "Add New Question"}
                </button>
              </div>

              {/* Right: running list of questions queued for submission */}
              <div className="w-full lg:w-96 shrink-0 overflow-y-auto p-6 bg-gray-50 space-y-3">
                <h3 className="text-sm font-bold text-gray-700">Queued Questions ({bulkList.length})</h3>
                {bulkList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-gray-400 text-center gap-2">
                    <FiLayers className="text-3xl text-gray-200" />
                    <span className="text-xs">Fill the form and click "Add New Question" to queue it here.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bulkList.map((q, i) => (
                      <div
                        key={i}
                        className={`bg-white rounded-xl border p-3.5 ${bulkEditingIndex === i ? "border-indigo-400 ring-2 ring-indigo-100" : "border-gray-100"}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-gray-400">#{i + 1}</div>
                            <div className="text-sm font-semibold text-gray-800 truncate">{q.movieName || "Untitled"}</div>
                            <div className="text-xs text-gray-500 truncate">{q.questionText}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-600">{q.questionType}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700">{q.gameMode}</span>
                        </div>
                        <div className="flex gap-2 mt-2.5">
                          <button
                            type="button"
                            onClick={() => editBulkListItem(i)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[11px] font-semibold hover:bg-indigo-100 transition"
                          >
                            <FiEdit2 size={11} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => removeBulkListItem(i)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-500 rounded-lg text-[11px] font-semibold hover:bg-red-100 transition"
                          >
                            <FiX size={11} /> Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Submitting is atomic — if any queued question is invalid, none are saved.
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeBulkModal}
                  disabled={bulkSubmitting}
                  className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitBulkList}
                  disabled={bulkSubmitting || bulkList.length === 0}
                  className="px-8 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition active:scale-95 disabled:opacity-50"
                >
                  {bulkSubmitting ? "Submitting…" : `Submit ${bulkList.length || ""} Question${bulkList.length === 1 ? "" : "s"}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* AI Generate-from-Content Modal — runs entirely client-side, never hits our backend */}
      {showAIContentModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[260] p-5"
          onClick={closeAIContentModal}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-purple-50 to-indigo-50">
              <div className="flex items-center gap-2 text-indigo-700">
                <FiCpu className="text-xl" />
                <h2 className="text-lg font-bold">Generate Questions from Content</h2>
              </div>
              {!aiContentGenerating && (
                <button onClick={closeAIContentModal} className="text-gray-400 hover:text-gray-600">
                  <FiX size={20} />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-indigo-50 text-indigo-700 text-xs">
                <FiKey className="shrink-0 mt-0.5" />
                <span>
                  This calls the Gemini API directly from your browser using the key below. Your key and the pasted
                  content are never sent to our backend.
                </span>
              </div>

              {/* API key */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Your Gemini API Key</label>
                <div className="relative">
                  <FiKey className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={aiContentShowKey ? "text" : "password"}
                    value={aiContentApiKey}
                    onChange={(e) => setAiContentApiKey(e.target.value)}
                    disabled={aiContentGenerating}
                    placeholder="AIza..."
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition disabled:bg-gray-50 text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setAiContentShowKey((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {aiContentShowKey ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-500">
                  <input
                    type="checkbox"
                    checked={aiContentRememberKey}
                    onChange={(e) => setAiContentRememberKey(e.target.checked)}
                    disabled={aiContentGenerating}
                  />
                  Remember this key on this device (stored only in this browser's local storage)
                </label>
              </div>

              {/* Category + Game mode */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">Category</label>
                  <select
                    value={aiContentCategory}
                    onChange={(e) => setAiContentCategory(e.target.value)}
                    disabled={aiContentGenerating}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition disabled:bg-gray-50 text-sm"
                  >
                    <option value="">Choose category...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">Questions to Generate</label>
                  <input
                    type="number"
                    min="1"
                    max="25"
                    value={aiContentQuestionCount}
                    onChange={(e) => setAiContentQuestionCount(e.target.value)}
                    disabled={aiContentGenerating}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition disabled:bg-gray-50 text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Game Mode</label>
                <div className="grid grid-cols-4 gap-2">
                  {["TAGLINE", "DIALOGUE", "SCENE", "IMAGE"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      disabled={aiContentGenerating}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold transition ${
                        aiContentGameMode === m
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "border-gray-200 text-gray-600 hover:border-indigo-500 hover:text-indigo-600"
                      }`}
                      onClick={() => setAiContentGameMode(m)}
                    >
                      {m.charAt(0) + m.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Difficulty</label>
                <div className="flex gap-2 p-1 bg-gray-50 rounded-xl border border-gray-100">
                  {["easy", "medium", "hard"].map((d) => (
                    <button
                      key={d}
                      type="button"
                      disabled={aiContentGenerating}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        aiContentDifficulty === d
                          ? d === "easy" ? "bg-green-600 text-white shadow-sm" :
                            d === "medium" ? "bg-amber-500 text-white shadow-sm" :
                            "bg-red-600 text-white shadow-sm"
                          : "text-gray-500 hover:bg-white hover:text-gray-700"
                      }`}
                      onClick={() => setAiContentDifficulty(d)}
                    >
                      {d.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <FiBookOpen /> Movie Content / Encyclopedia Text
                </label>
                <textarea
                  value={aiContentText}
                  onChange={(e) => setAiContentText(e.target.value)}
                  disabled={aiContentGenerating}
                  placeholder="Paste the movie's plot summary, cast, trivia, wiki entry, etc. here — questions will be grounded in this content."
                  rows={8}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition disabled:bg-gray-50 resize-none text-sm"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">
                  Custom Prompt <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                </label>
                <textarea
                  value={aiContentCustomPrompt}
                  onChange={(e) => setAiContentCustomPrompt(e.target.value)}
                  disabled={aiContentGenerating}
                  placeholder="e.g. Focus on the songs and music director, or 'make 2 of them hard trick questions'"
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition disabled:bg-gray-50 resize-none text-sm"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={handleGenerateFromContent}
                disabled={aiContentGenerating || !aiContentCategory || !aiContentText.trim()}
                className={`w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-3 ${
                  aiContentGenerating || !aiContentCategory || !aiContentText.trim()
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-[1.02] active:scale-[0.98]"
                }`}
              >
                {aiContentGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Generating Questions...</span>
                  </>
                ) : (
                  <>
                    <FiCpu />
                    <span>Generate & Queue Questions</span>
                  </>
                )}
              </button>
              <p className="text-center text-[11px] text-gray-400 mt-3 italic">
                * Generated questions are added to the Bulk Add queue for you to review and edit before saving.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Questions;
