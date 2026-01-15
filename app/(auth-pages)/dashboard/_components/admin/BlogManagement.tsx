"use client";
import { useEffect, useState, useMemo, useCallback, memo } from "react";
import dynamic from "next/dynamic";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader as AlertHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import {
  FileText,
  Plus,
  Pencil,
  X,
  Calendar,
  Tag,
  Eye,
  EyeOff,
  BookOpen,
  Save,
  Edit3,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { formatTextWithLinks } from "@/lib/utils";
import { apiFetch } from "@/lib/client-api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import type { Components } from "react-markdown";

// Markdown components for blog description rendering
const markdownComponents: Components = {
  p: ({ children }: any) => (
    <span className="text-gray-600 text-sm">{children}</span>
  ),
  strong: ({ children }: any) => (
    <strong className="font-bold text-gray-800">{children}</strong>
  ),
  em: ({ children }: any) => (
    <em className="italic text-gray-700">{children}</em>
  ),
  a: ({ href, children }: any) => (
    <a
      href={href}
      className="text-orange-500 hover:text-orange-600 underline hover:no-underline transition-colors"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  code: ({ children }: any) => (
    <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono text-gray-700">
      {children}
    </code>
  ),
};

// Dynamically import SimpleMDE to avoid SSR issues
const SimpleMDE = dynamic(() => import("react-simplemde-editor"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[300px] bg-gray-50 rounded-md border border-gray-300 animate-pulse flex items-center justify-center text-gray-500">
      Loading editor...
    </div>
  ),
});

// Memoized editor component to prevent re-renders
const MemoizedEditor = memo(
  ({
    value,
    onChange,
    options,
    editorKey,
  }: {
    value: string;
    onChange: (value: string) => void;
    options: any;
    editorKey: string;
  }) => {
    return (
      <SimpleMDE
        key={editorKey}
        value={value}
        onChange={onChange}
        options={options}
      />
    );
  }
);

MemoizedEditor.displayName = "MemoizedEditor";

interface Blog {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  tags: string[];
}
export default function BlogManagement() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Memoized editor configurations to prevent re-creation
  const editorOptions = useMemo(
    () => ({
      spellChecker: false,
      placeholder: "Write your blog content here...",
      status: false,
      toolbar: [
        "bold",
        "italic",
        "heading",
        "|",
        "quote",
        "unordered-list",
        "ordered-list",
        "|",
        "link",
        "image",
        "|",
        "preview",
        "side-by-side",
        "fullscreen",
        "|",
        "guide",
      ] as const,
      previewClass: ["editor-preview", "prose", "prose-orange"],
      minHeight: "300px",
    }),
    []
  );

  // Stable callback for content updates
  const handleContentChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, content: value }));
  }, []);

  // Helper function to reset form data
  const resetFormData = useCallback(() => {
    setFormData({ title: "", content: "", tags: [] });
  }, []);

  // Fetch blogs on component mount
  useEffect(() => {
    fetchBlogs();
  }, []);

  // Reset form when add modal closes
  useEffect(() => {
    if (!isAddModalOpen) {
      resetFormData();
      setTagInput("");
    }
  }, [isAddModalOpen, resetFormData]);

  // Reset form when edit modal closes
  useEffect(() => {
    if (!isEditModalOpen) {
      setSelectedBlog(null);
      setTagInput("");
    }
  }, [isEditModalOpen]);

  const fetchBlogs = async () => {
    try {
      const response = await apiFetch("/api/admin/blogs", { logoutOn401: false });
      if (!response.ok) throw new Error("Failed to fetch blogs");
      const data = await response.json();
      setBlogs(data);
    } catch (err) {
      let errorMessage = "Failed to load blogs";
      if (err instanceof Error) {
        errorMessage = err.message;
        console.error("Error fetching blogs:", err);
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleAddBlog = async (isDraft = false) => {
    try {
      const blogData = { ...formData, isActive: !isDraft }; // isActive: false for draft, true for published
      const response = await apiFetch("/api/admin/blogs/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(blogData), logoutOn401: false });
      if (!response.ok) throw new Error("Failed to add blog");
      toast.success(
        isDraft ? "Blog saved as draft" : "Blog published successfully"
      );
      setIsAddModalOpen(false);
      resetFormData();
      fetchBlogs();
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error adding blog:", err);
        toast.error(err.message || "Failed to add blog");
      } else {
        toast.error("Failed to add blog");
      }
    }
  };

  const handleEditBlog = async (isDraft = false) => {
    if (!selectedBlog) return;
    try {
      const blogData = {
        id: selectedBlog.id,
        ...formData,
        isActive: !isDraft, // isActive: false for draft, true for published
      };
      const response = await apiFetch("/api/admin/blogs/edit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(blogData), logoutOn401: false });
      if (!response.ok) throw new Error("Failed to update blog");
      toast.success(
        isDraft ? "Blog saved as draft" : "Blog updated successfully"
      );
      setIsEditModalOpen(false);
      setSelectedBlog(null);
      resetFormData();
      fetchBlogs();
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error updating blog:", err);
        toast.error(err.message || "Failed to update blog");
      } else {
        toast.error("Failed to update blog");
      }
    }
  };

  const handleToggleStatus = async (blogId: string, currentStatus: boolean) => {
    try {
      const response = await apiFetch("/api/admin/blogs/edit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: blogId, isActive: !currentStatus }), logoutOn401: false });
      if (!response.ok) throw new Error("Failed to update blog status");
      toast.success("Blog status updated successfully");
      fetchBlogs();
    } catch (err) {
      console.error("Error updating blog status:", err);
      toast.error("Failed to update blog status");
    }
  };

  const handleDeleteBlog = async (blogId: string) => {
    setConfirmDeleteId(blogId);
  };

  const openEditModal = (blog: Blog) => {
    setSelectedBlog(blog);
    setFormData({
      title: blog.title,
      content: blog.content,
      tags: blog.tags || [],
    });
    setIsEditModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <BookOpen className="w-5 h-5 text-orange-600" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Blogs Management
          </h2>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Create, edit, and manage your blog posts with tags and content
          formatting
        </p>
      </div>

      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-orange-50">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-orange-100 via-orange-200 to-red-200 border-b border-orange-300 p-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-orange-600" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold text-gray-800">
                Blogs
              </CardTitle>
              <CardDescription className="text-gray-700 font-medium">
                Manage your blog content and publications
              </CardDescription>
            </div>
          </div>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-9 w-9 p-2 sm:h-auto sm:w-auto sm:px-4">
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Blog</span>
              </Button>
            </DialogTrigger>
            <DialogContent
              className="max-w-4xl max-h-[90vh] bg-gradient-to-br from-white to-orange-50 overflow-hidden"
              onPointerDownOutside={(e) => e.preventDefault()}
              onEscapeKeyDown={(e) => e.preventDefault()}
            >
              <DialogHeader className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg -m-4 mb-4">
                <DialogTitle className="text-xl text-gray-800 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-orange-600" />
                  Add New Blog Post
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4 overflow-y-auto max-h-[60vh]">
                <div className="space-y-2">
                  <label
                    htmlFor="add-blog-title"
                    className="text-sm font-medium text-gray-700"
                  >
                    Blog Title
                  </label>
                  <Input
                    id="add-blog-title"
                    placeholder="Enter blog title..."
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="add-blog-content"
                    className="text-sm font-medium text-gray-700"
                  >
                    Blog Content
                  </label>
                  <div className="relative">
                    <MemoizedEditor
                      editorKey="add-blog-editor"
                      value={formData.content}
                      onChange={handleContentChange}
                      options={editorOptions}
                      // @ts-ignore
                      id="add-blog-content"
                    />
                    {/* <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-12 bg-white/80 hover:bg-white border border-gray-200 z-10"
                        >
                          <Info className="w-4 h-4 text-orange-600" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-800 flex items-center">
                            <Info className="w-4 h-4 mr-2 text-orange-600" />
                            Link Format Guide
                          </h4>
                          <p className="text-sm text-gray-600">
                            To add links in your content, use this format:
                          </p>
                          <div className="bg-white p-3 rounded-lg border border-orange-200 text-sm font-mono text-orange-700">
                            {`[[Link Text]]{{https://example.com}}`}
                          </div>
                          <p className="text-sm text-gray-600">
                            Example:{" "}
                            <span className="text-orange-600 font-medium">
                              {`[[Click here]]{{http://localhost:3000/dashboard}}`}
                            </span>
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover> */}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <Tag className="w-4 h-4 mr-2 text-orange-600" />
                    Tags
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    />
                    <Button
                      type="button"
                      onClick={handleAddTag}
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0"
                    >
                      Add Tag
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 border border-orange-200 hover:from-orange-200 hover:to-red-200 flex items-center gap-1"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleAddBlog(true)}
                    className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white border-0 shadow-md"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save as Draft
                  </Button>
                  <Button
                    onClick={() => handleAddBlog(false)}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-md"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Publish Blog
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-6">
          {(() => {
            let contentToRender;
            if (loading) {
              contentToRender = (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader size={48} className="mb-4 text-orange-500" />
                  <p className="text-gray-500">Loading blogs...</p>
                </div>
              );
            } else if (error) {
              contentToRender = (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-red-100 to-orange-100 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-red-500 text-lg">{error}</p>
                </div>
              );
            } else {
              contentToRender = (
                <div className="space-y-4">
                  {blogs.length > 0 ? (
                    blogs.map((blog) => (
                      <div
                        key={blog.id}
                        className="bg-white rounded-lg border border-orange-200 p-6 hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-800">
                                {blog.title}
                              </h3>
                              {!blog.isActive && (
                                <Badge className="bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border border-yellow-200 text-xs">
                                  Draft
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1 text-orange-500" />
                                {new Date(blog.createdAt).toLocaleDateString()}
                              </div>
                              <div className="flex items-center">
                                <Tag className="w-4 h-4 mr-1 text-orange-500" />
                                {blog.tags?.length || 0} tags
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleToggleStatus(blog.id, blog.isActive)
                              }
                              className={`${
                                blog.isActive
                                  ? "text-green-600 hover:bg-green-50"
                                  : "text-gray-400 hover:bg-gray-50"
                              } h-9 w-9 p-0 sm:h-auto sm:w-auto sm:px-2`}
                            >
                              {blog.isActive ? (
                                <Eye className="w-4 h-4 sm:mr-1" />
                              ) : (
                                <EyeOff className="w-4 h-4 sm:mr-1" />
                              )}
                              <span className="hidden sm:inline text-xs">
                                {blog.isActive ? "Published" : "Draft"}
                              </span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(blog)}
                              className="border-purple-200 bg-purple-50 text-purple-600 hover:text-purple-700 h-9 w-9 p-0 sm:h-auto sm:w-auto sm:px-2"
                              title="Edit Blog"
                            >
                              <Pencil className="w-4 h-4 sm:mr-1" />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteBlog(blog.id)}
                              className="border-red-200 bg-red-50 text-red-600 hover:text-red-700 h-9 w-9 p-0 sm:h-auto sm:w-auto sm:px-2"
                              title="Delete Blog"
                            >
                              <Trash2 className="w-4 h-4 sm:mr-1" />
                              <span className="hidden sm:inline">Delete</span>
                            </Button>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="text-gray-600 text-sm line-clamp-3">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeRaw]}
                              components={markdownComponents}
                            >
                              {blog.content || ""}
                            </ReactMarkdown>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {blog.tags?.map((tag) => (
                            <Badge
                              key={tag}
                              className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 border border-orange-200"
                            >
                              {formatTextWithLinks(tag, "orange-500")}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-orange-100 to-red-100 rounded-full flex items-center justify-center">
                        <FileText className="w-8 h-8 text-orange-500" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No Blogs Found
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Start creating your first blog post to engage with your
                        audience
                      </p>
                      <Button
                        className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white border-0 shadow-md"
                        onClick={() => setIsAddModalOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Blog
                      </Button>
                    </div>
                  )}
                </div>
              );
            }
            return contentToRender;
          })()}
        </CardContent>
      </Card>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent
          className="max-w-7xl max-h-[90vh] bg-gradient-to-br from-white to-orange-50"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg -m-4 mb-4">
            <DialogTitle className="text-xl text-gray-800 flex items-center">
              <Pencil className="w-5 h-5 mr-2 text-orange-600" />
              Edit Blog Post
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4 overflow-y-auto max-h-[60vh]">
            <div className="space-y-2">
              <label
                htmlFor="edit-blog-title"
                className="text-sm font-medium text-gray-700"
              >
                Blog Title
              </label>
              <Input
                id="edit-blog-title"
                placeholder="Enter blog title..."
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="edit-blog-content"
                className="text-sm font-medium text-gray-700"
              >
                Blog Content
              </label>
              <MemoizedEditor
                editorKey="edit-blog-editor"
                value={formData.content}
                onChange={handleContentChange}
                options={editorOptions}
                // @ts-ignore
                id="edit-blog-content"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Tag className="w-4 h-4 mr-2 text-orange-600" />
                Tags
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0"
                >
                  Add Tag
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 border border-orange-200 hover:from-orange-200 hover:to-red-200 flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => handleEditBlog(true)}
                className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white border-0 shadow-md"
              >
                <Save className="w-4 h-4 mr-2" />
                Save as Draft
              </Button>
              <Button
                onClick={() => handleEditBlog(false)}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-md"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Update & Publish
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog - Delete first, then Cancel */}
      <AlertDialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => !open && !deleting && setConfirmDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertHeader>
            <AlertDialogTitle>Delete this blog?</AlertDialogTitle>
          </AlertHeader>
          <AlertDialogDescription>
            This will permanently delete the blog post. This action cannot be
            undone.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogAction
              disabled={deleting}
              onClick={async () => {
                if (!confirmDeleteId) return;
                setDeleting(true);
                  try {
                  const res = await apiFetch("/api/admin/blogs/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: confirmDeleteId }), logoutOn401: false });
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok)
                    throw new Error(data.error || "Failed to delete blog");
                  toast.success("Blog deleted successfully");
                  await fetchBlogs();
                } catch (e: any) {
                  toast.error(e?.message || "Failed to delete blog");
                } finally {
                  setDeleting(false);
                  setConfirmDeleteId(null);
                }
              }}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
