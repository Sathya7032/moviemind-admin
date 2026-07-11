import { useState, useEffect, useCallback } from "react";
import {
  getAllPosts,
  createPost,
  updatePost,
  deletePost,
  getPostComments,
} from "../services/postService";
import { toast } from "react-toastify";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiImage,
  FiSearch,
  FiUpload,
  FiMessageSquare,
  FiList,
  FiHeart,
  FiEye,
} from "react-icons/fi";

const emptyForm = {
  postType: "POST",
  author: "",
  authorSubtitle: "",
  description: "",
  options: [{ optionText: "" }, { optionText: "" }],
};

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [postComments, setPostComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await getAllPosts();
      if (res.success) {
        const rawData = res.data?.content || res.data || [];
        setPosts(Array.isArray(rawData) ? rawData : []);
      }
    } catch {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview("");
    setShowModal(true);
  };

  const openEdit = (post) => {
    setEditing(post.id);
    setForm({
      postType: post.postType || "POST",
      author: post.author || "",
      authorSubtitle: post.authorSubtitle || "",
      description: post.description || "",
      options: post.options?.length > 0 ? post.options : [{ optionText: "" }, { optionText: "" }],
    });
    setImageFile(null);
    setImagePreview(post.imageUrl || "");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview("");
  };

  const openDetails = async (post) => {
    setSelectedPost(post);
    setShowDetailsModal(true);
    setCommentsLoading(true);
    setPostComments([]);

    try {
      const response = await getPostComments(post.id);
      const rawComments = response?.data?.content || response?.data || [];
      setPostComments(Array.isArray(rawComments) ? rawComments : []);
    } catch (error) {
      console.error("Failed to load comments", error);
      setPostComments([]);
      toast.error("Failed to load post comments");
    } finally {
      setCommentsLoading(false);
    }
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedPost(null);
    setPostComments([]);
    setCommentsLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...form.options];
    newOptions[index].optionText = value;
    setForm({ ...form, options: newOptions });
  };

  const addOption = () => {
    setForm({ ...form, options: [...form.options, { optionText: "" }] });
  };

  const removeOption = (index) => {
    if (form.options.length <= 2) {
      toast.error("A poll must have at least 2 options.");
      return;
    }
    const newOptions = [...form.options];
    newOptions.splice(index, 1);
    setForm({ ...form, options: newOptions });
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

    if (!form.author.trim()) {
      toast.error("Author name is required");
      return;
    }
    if (!form.description.trim() && !imageFile && !imagePreview) {
      toast.error("Either description or image is required");
      return;
    }

    if (form.postType === "POLL") {
      const validOptions = form.options.filter(o => o.optionText.trim() !== "");
      if (validOptions.length < 2) {
        toast.error("Polls require at least 2 valid options");
        return;
      }
    }

    setSubmitting(true);
    try {
      if (editing) {
        const res = await updatePost(editing, form, imageFile);
        if (res.success) {
          toast.success("Post updated successfully");
        }
      } else {
        const res = await createPost(form, imageFile);
        if (res.success) {
          toast.success("Post created successfully");
        }
      }
      closeModal();
      fetchPosts();
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.message;
      toast.error(serverMsg || (editing ? "Failed to update post" : "Failed to create post"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await deletePost(id);
      if (res.success) {
        toast.success("Post deleted successfully");
        fetchPosts();
      }
    } catch {
      toast.error("Failed to delete post");
    }
  };

  const filteredPosts = Array.isArray(posts) ? posts.filter(post =>
    (post.author || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (post.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-72 text-gray-500 text-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
          <span>Loading posts...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Posts & Polls</h1>
          <p className="text-sm text-gray-500 mt-1">Manage community posts and interactive polls</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3 py-2 rounded-full bg-red-50 text-red-700 text-sm font-semibold">
            Total posts: {posts.length}
          </div>
          <button
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/30 transition-all duration-200"
            onClick={openCreate}
          >
            <FiPlus />
            <span>Add Post</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search by author or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition"
          />
        </div>
      </div>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-150 text-gray-400 text-center px-4">
          <FiMessageSquare size={48} className="text-gray-300 mb-3" />
          <h3 className="text-gray-700 text-lg font-semibold">No posts found</h3>
          <p className="text-sm mt-1 mb-5">Create your first post or poll for the community</p>
          <button
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-red-500/30 transition"
            onClick={openCreate}
          >
            <FiPlus />
            <span>Add Post</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col h-full"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">
                    {post.author ? post.author.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 leading-tight">{post.author}</h4>
                    <span className="text-xs text-gray-500">{post.authorSubtitle || "Admin"}</span>
                  </div>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${post.postType === 'POLL' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {post.postType}
                </div>
              </div>

              {post.description && (
                <div className="px-5 pt-4 pb-2 text-sm text-gray-700 line-clamp-3">
                  {post.description}
                </div>
              )}

              {post.imageUrl && (
                <div className="px-5 py-2">
                  <div className="relative rounded-xl overflow-hidden bg-gray-50">
                    <img
                      src={post.imageUrl}
                      alt="Post content"
                      className="w-full h-auto max-h-48 object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                </div>
              )}

              {post.postType === "POLL" && post.options && post.options.length > 0 && (
                <div className="px-5 py-3 flex-1">
                  <div className="flex flex-col gap-2">
                    {post.options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-lg border border-gray-100 bg-gray-50/50">
                        <div className="w-5 h-5 rounded-full border border-gray-300 shrink-0" />
                        <span className="text-xs text-gray-700 truncate">{opt.optionText}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="px-5 py-3 mt-2 flex items-center gap-4 text-gray-500 text-xs">
                <div className="flex items-center gap-1.5">
                  <FiHeart className={post.likedByMe ? "text-red-500 fill-red-500" : ""} /> 
                  <span>{post.likesCount || 0} Likes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FiMessageSquare />
                  <span>{post.commentsCount || 0} Comments</span>
                </div>
              </div>

              <div className="mt-auto p-4 flex flex-wrap gap-2.5 pt-2 border-t border-gray-50">
                <button
                  className="flex-1 min-w-[100px] inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors duration-150"
                  onClick={() => openDetails(post)}
                >
                  <FiEye size={13} />
                  <span>View Details</span>
                </button>
                <button
                  className="flex-1 min-w-[100px] inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors duration-150"
                  onClick={() => openEdit(post)}
                >
                  <FiEdit2 size={13} />
                  <span>Edit</span>
                </button>
                <button
                  className="flex-1 min-w-[100px] inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-red-50 text-red-500 hover:bg-red-100 transition-colors duration-150"
                  onClick={() => handleDelete(post.id)}
                >
                  <FiTrash2 size={13} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDetailsModal && selectedPost && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4 sm:p-5 backdrop-blur-sm"
          onClick={closeDetailsModal}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-150 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Post Details</h2>
                <p className="text-sm text-gray-500">Full payload and comments from the posts API</p>
              </div>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 text-lg transition shrink-0"
                onClick={closeDetailsModal}
              >
                <FiX />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  ["ID", selectedPost.id],
                  ["Post Type", selectedPost.postType],
                  ["Author", selectedPost.author],
                  ["Subtitle", selectedPost.authorSubtitle || "—"],
                  ["Likes", selectedPost.likesCount ?? 0],
                  ["Comments", selectedPost.commentsCount ?? 0],
                  ["Liked by me", selectedPost.likedByMe ? "Yes" : "No"],
                  ["Created", selectedPost.createdTime || "—"],
                  ["Updated", selectedPost.updatedTime || "—"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">{label}</p>
                    <p className="mt-1 text-sm text-gray-800 break-words">{value ?? "—"}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-gray-100 bg-white p-4">
                <p className="text-sm font-semibold text-gray-800">Description</p>
                <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                  {selectedPost.description || "—"}
                </p>
              </div>

              <div className="rounded-xl border border-gray-100 bg-slate-950 p-4 text-slate-100">
                <p className="text-sm font-semibold text-slate-200">Full post payload</p>
                <pre className="mt-3 overflow-x-auto text-xs leading-6 whitespace-pre-wrap">
                  {JSON.stringify(selectedPost, null, 2)}
                </pre>
              </div>

              {selectedPost.imageUrl && (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-sm font-semibold text-gray-800">Image URL</p>
                  <a href={selectedPost.imageUrl} target="_blank" rel="noreferrer" className="mt-2 block text-sm text-red-600 break-all">
                    {selectedPost.imageUrl}
                  </a>
                </div>
              )}

              {selectedPost.options && selectedPost.options.length > 0 && (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-800">Options</p>
                  <ul className="mt-3 space-y-2">
                    {selectedPost.options.map((option, index) => (
                      <li key={index} className="text-sm text-gray-700">
                        • {option.optionText || option.option || "Untitled option"}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800">Comments</p>
                  <span className="text-xs text-gray-500">{selectedPost.comments?.length || 0} available</span>
                </div>
                {commentsLoading ? (
                  <div className="mt-3 text-sm text-gray-500">Loading comments...</div>
                ) : postComments.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {postComments.map((comment, index) => (
                      <li key={comment.id || index} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">
                              {comment.commenterName || comment.userName || "Unknown user"}
                            </p>
                            <p className="mt-1 text-gray-700">
                              {comment.commentText || comment.text || comment.comment || JSON.stringify(comment)}
                            </p>
                          </div>
                          {comment.createdTime && (
                            <span className="text-[11px] text-gray-400 whitespace-nowrap">
                              {comment.createdTime}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-gray-500">No comments were returned for this post.</p>
                )}
              </div>
            </div>
          </div>
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
                {editing ? "Edit Post" : "Add Post"}
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
              
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="flex-1 flex flex-col gap-1.5">
                  <label htmlFor="postType" className="text-xs font-semibold text-gray-700">
                    Post Type *
                  </label>
                  <select
                    id="postType"
                    name="postType"
                    value={form.postType}
                    onChange={handleChange}
                    className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition bg-white"
                  >
                    <option value="POST">Standard Post</option>
                    <option value="POLL">Poll</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="author" className="text-xs font-semibold text-gray-700">
                    Author Name *
                  </label>
                  <input
                    id="author"
                    name="author"
                    type="text"
                    required
                    value={form.author}
                    onChange={handleChange}
                    placeholder="e.g. MovieMind Admin"
                    className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="authorSubtitle" className="text-xs font-semibold text-gray-700">
                    Author Subtitle
                  </label>
                  <input
                    id="authorSubtitle"
                    name="authorSubtitle"
                    type="text"
                    value={form.authorSubtitle}
                    onChange={handleChange}
                    placeholder="e.g. Official Team"
                    className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="description" className="text-xs font-semibold text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="What's on your mind?..."
                  rows="3"
                  className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition resize-none"
                />
              </div>

              {form.postType === "POLL" && (
                <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                    <FiList /> Poll Options
                  </label>
                  
                  {form.options.map((opt, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={opt.optionText}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(idx)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                  
                  {form.options.length < 5 && (
                    <button
                      type="button"
                      onClick={addOption}
                      className="mt-2 text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 w-fit"
                    >
                      <FiPlus /> Add another option
                    </button>
                  )}
                </div>
              )}

              {/* Drag & Drop File Upload Container */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  Post Image
                </label>
                
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`relative aspect-[16/9] w-full border-2 border-dashed rounded-xl overflow-hidden flex flex-col items-center justify-center p-4 transition-all duration-200 ${
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
                          onClick={() => document.getElementById("postImageUpload").click()}
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
                      onClick={() => document.getElementById("postImageUpload").click()}
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
                    id="postImageUpload"
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
                  {submitting ? "Saving..." : editing ? "Save Changes" : "Create Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Posts;
