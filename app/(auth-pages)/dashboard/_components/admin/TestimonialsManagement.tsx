"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "react-hot-toast";
import { s3 } from "@/lib/s3";
import { apiFetch } from "@/lib/client-api";
import { MessageSquare, ArrowUpDown, Eye, Pencil } from "lucide-react";
import { DataTable } from "@/components/ui/data_table";
import { Loader } from "@/components/ui/loader";
import { ColumnDef } from "@tanstack/react-table";
import * as XLSX from "xlsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Small helpers to reduce duplication
const SortableHeader = ({ column, children }: { column: any; children: React.ReactNode }) => (
  <Button
    variant="ghost"
    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    className="px-0"
  >
    {children}
    <ArrowUpDown className="ml-2 h-4 w-4" />
  </Button>
);

const createTableCell = (content: string): string => {
  return `<td style="border:1px solid #ddd;padding:6px;font-size:10px;">${content}</td>`;
};

const createTableRow = (cells: string[]): string => {
  const cellsHtml = cells.map((c) => createTableCell(c)).join("");
  return `<tr>${cellsHtml}</tr>`;
};

type Testimonial = {
  id: string;
  name: string;
  role: string;
  text: string;
  imagePath: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  imageUrl?: string | null;
};

// Column definitions extracted to reduce cognitive complexity
const createColumns = (
  handleToggle: (id: string, next: boolean) => Promise<void>,
  handleEdit: (testimonial: Testimonial) => void,
  handleDelete: (id: string) => Promise<void>,
  setDetailsItem: (item: (Testimonial & { imageUrl?: string | null }) | null) => void,
  setShowDetailsModal: (show: boolean) => void
): ColumnDef<Testimonial>[] => [
  {
    accessorKey: "text",
    header: ({ column }) => (
      <SortableHeader column={column}>Text</SortableHeader>
    ),
    cell: ({ row }) => (
      <div className="truncate max-w-xs" title={row.original.text}>
        {row.original.text}
      </div>
    ),
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <SortableHeader column={column}>Name</SortableHeader>
    ),
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <SortableHeader column={column}>Role</SortableHeader>
    ),
  },
  {
    id: "active",
    header: "Active",
    cell: ({ row }) => (
      <Switch
        checked={row.original.isActive}
        onCheckedChange={(v) => handleToggle(row.original.id, v)}
      />
    ),
    enableSorting: false,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="border-purple-200 bg-purple-50 text-purple-600 hover:text-purple-700"
          onClick={async () => {
            try {
              const res = await apiFetch(`/api/admin/testimonials/${row.original.id}`, { logoutOn401: false });
              if (!res.ok) throw new Error("Failed to fetch details");
              const data = await res.json();
              setDetailsItem(data);
              setShowDetailsModal(true);
            } catch (e: any) {
              toast.error(e?.message || "Failed to load details");
            }
          }}
          title="View details"
        >
          <Eye className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-purple-200 bg-purple-50 text-purple-600 hover:text-purple-700"
          onClick={() => handleEdit(row.original)}
          title="Edit"
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-red-200 bg-red-50 text-red-600 hover:text-red-700"
          onClick={() => handleDelete(row.original.id)}
          title="Delete"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </Button>
      </div>
    ),
    enableSorting: false,
  },
];

export default function TestimonialsManagement() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTestimonialId, setEditTestimonialId] = useState<string | null>(
    null
  );
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    role: "",
    text: "",
    isActive: true,
  });
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [text, setText] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image preview state removed; handled in details dialog directly

  // Details modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsItem, setDetailsItem] = useState<
    (Testimonial & { imageUrl?: string | null }) | null
  >(null);

  useEffect(() => {
    setLoading(true);
    apiFetch("/api/admin/testimonials", { logoutOn401: false })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load"))))
      .then((data: Testimonial[]) => setItems(data))
      .catch(() => toast.error("Failed to fetch testimonials"))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!name || !role || !text) {
      toast.error("Please fill in name, role and text");
      return;
    }
    setCreating(true);
    try {
      let imagePath: string | null = null;
      if (imageFile) {
        const filePath = s3.getTestimonialImagePath(imageFile.name);
        const res = await apiFetch("/api/s3/put", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filePath, contentType: imageFile.type }), logoutOn401: false });
        if (!res.ok) throw new Error("Failed to get signed URL");
        const { signedUrl } = await res.json();
        const upload = await fetch(signedUrl, {
          method: "PUT",
          body: imageFile,
          headers: {
            "Content-Type": imageFile.type || "application/octet-stream",
          },
        });
        if (!upload.ok) throw new Error("Failed to upload image to S3");
        imagePath = filePath;
      }

      const createRes = await apiFetch("/api/admin/testimonials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, role, text, imagePath, isActive }), logoutOn401: false });
      if (!createRes.ok) throw new Error("Failed to create testimonial");
      const created: Testimonial = await createRes.json();
      setItems((prev) => [created, ...prev]);
      setName("");
      setRole("");
      setText("");
      setIsActive(true);
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Testimonial created");
    } catch (e: any) {
      toast.error(e.message || "Failed to create testimonial");
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: string, next: boolean) => {
    try {
      const res = await apiFetch("/api/admin/testimonials/toggle", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, isActive: next }), logoutOn401: false });
      if (!res.ok) throw new Error("Failed to toggle");
      const updated: Testimonial = await res.json();
      setItems((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, isActive: updated.isActive } : t
        )
      );
      toast.success("Updated");
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(id);
  };

  const handleEdit = (testimonial: Testimonial) => {
    setEditTestimonialId(testimonial.id);
    setEditForm({
      name: testimonial.name,
      role: testimonial.role,
      text: testimonial.text,
      isActive: testimonial.isActive,
    });
    setEditImageFile(null);
    setEditImageUrl(null);
    if (editFileInputRef.current) editFileInputRef.current.value = "";
    setShowEditModal(true);
    // Load current signed image URL on opening edit
    if (testimonial.imagePath) {
      fetch(`/api/admin/testimonials/${testimonial.id}`)
        .then((r) =>
          r.ok ? r.json() : Promise.reject(new Error("Failed to fetch image"))
        )
        .then((data) => setEditImageUrl(data?.imageUrl || null))
        .catch(() => setEditImageUrl(null));
    } else {
      setEditImageUrl(null);
    }
  };

  // Export helpers
  const buildExportRows = () => {
    return items.map((t) => ({
      Name: t.name,
      Role: t.role,
      Text: t.text,
      ImagePath: t.imagePath || "",
      Active: t.isActive ? "Yes" : "No",
      CreatedAt: new Date(t.createdAt).toLocaleString(),
    }));
  };

  const toCSV = (rows: any[]) => {
    if (rows.length === 0) return "";
    const headers = Object.keys(rows[0]);
    const escape = (val: any) => {
      const s = String(val ?? "");
      if (s.includes(",") || s.includes("\n") || s.includes('"')) {
        return '"' + s.replaceAll('"', '""') + '"';
      }
      return s;
    };
    const lines = [headers.join(",")].concat(
      rows.map((r) => headers.map((h) => escape(r[h])).join(","))
    );
    return lines.join("\n");
  };

  const downloadBlob = (content: BlobPart, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const csv = toCSV(buildExportRows());
    downloadBlob(csv, "testimonials.csv", "text/csv;charset=utf-8;");
  };

  const handleExportExcel = () => {
    const rows = buildExportRows();
    if (rows.length === 0) {
      toast.error("No data to export");
      return;
    }

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Convert data to worksheet
    const ws = XLSX.utils.json_to_sheet(rows);

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Testimonials");

    // Generate the XLSX file
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    // Create blob and download
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "testimonials.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    toast.success("Excel file exported successfully");
  };

  const handleExportCopy = async () => {
    const csv = toCSV(buildExportRows());
    try {
      await navigator.clipboard.writeText(csv);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  const handleExportPDF = () => {
    const rows = buildExportRows();
    const headers = Object.keys(rows[0] || {});
    const tableRows = rows
      .map((r) => headers.map((h) => String((r as Record<string, any>)[h] ?? "")))
      .map((cells) => createTableRow(cells))
      .join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Testimonials Export</title></head><body style="font-family:Arial,Helvetica,sans-serif;">
      <h3 style="margin:8px 0;">Testimonials Export</h3>
      <table style="border-collapse:collapse;width:100%;">
        <thead><tr>${headers
          .map(
            (h) =>
              `<th style="border:1px solid #ddd;padding:6px;text-align:left;background:#f3f4f6;font-size:11px;">${h}</th>`
          )
          .join("")}</tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      <script>window.onload = () => { window.print(); }</script>
    </body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.open();
    w.document.body.innerHTML = html;
    w.document.close();
  };

  const columns: ColumnDef<Testimonial>[] = useMemo(
    () => createColumns(handleToggle, handleEdit, handleDelete, setDetailsItem, setShowDetailsModal),
    [handleToggle, items]
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-purple-100 rounded-lg">
          <MessageSquare className="w-5 h-5 text-purple-600" />
        </div>
        <h2 className="text-2xl font-semibold">Testimonials</h2>
      </div>

      <div className="border rounded-lg p-4 mb-8 bg-white">
        <h3 className="text-lg font-medium mb-3">Add new</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
          <div className="md:col-span-2">
            <Textarea
              rows={4}
              placeholder="Text"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:col-span-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="w-full max-w-full md:w-auto"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
            <div className="flex items-center gap-2">
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={(v) => setIsActive(v)}
              />
              <label htmlFor="active">Active</label>
            </div>
            <Button className="w-full md:w-auto" disabled={creating} onClick={handleCreate}>
              Add
            </Button>
          </div>
        </div>
      </div>

      <div className=" flex items-center justify-end gap-2 w-full mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="px-3 py-2 bg-white border-purple-300 hover:bg-purple-50 text-purple-700"
              title="Export testimonials"
            >
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={handleExportExcel}>
              Export Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportCSV}>
              Export CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF}>
              Export PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportCopy}>Copy</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="border rounded-lg bg-white p-3">
        {(() => {
          if (loading) {
            return (
              <div className="w-full h-[50vh] flex items-center justify-center">
                <div className="flex flex-col items-center text-gray-600">
                  <Loader size={48} className="mb-2 text-purple-600" />
                  Loading testimonials...
                </div>
              </div>
            );
          }
          
          if (items.length === 0) {
            return <div className="p-4">No testimonials</div>;
          }
          
          return (
            <DataTable
              columns={columns}
              data={items}
              searchAllColumns
              placeholder="Search..."
            />
          );
        })()}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => !open && !deleting && setConfirmDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this testimonial?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            This will permanently delete the testimonial. This action cannot be
            undone.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogAction
              disabled={deleting}
              onClick={async () => {
                if (!confirmDeleteId) return;
                setDeleting(true);
                try {
                  const res = await fetch(
                    `/api/admin/testimonials/${confirmDeleteId}`,
                    {
                      method: "DELETE",
                    }
                  );
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok)
                    throw new Error(data.error || "Failed to delete");
                  setItems((prev) =>
                    prev.filter((i) => i.id !== confirmDeleteId)
                  );
                  toast.success("Deleted");
                } catch (e: any) {
                  toast.error(e?.message || "Failed to delete");
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

      {/* Edit Testimonial Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Testimonial</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, name: e.target.value }))
                }
              />
              <Input
                placeholder="Role"
                value={editForm.role}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, role: e.target.value }))
                }
              />
              <div className="md:col-span-2">
                <Textarea
                  rows={4}
                  placeholder="Text"
                  value={editForm.text}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, text: e.target.value }))
                  }
                />
              </div>
              {/* Image preview (current or new) */}
              <div className="md:col-span-2 space-y-2">
                <div className="text-sm text-gray-500">Image</div>
                {(() => {
                  if (editImageFile) {
                    return (
                      <div className="w-full flex items-center justify-start">
                        <img
                          src={URL.createObjectURL(editImageFile)}
                          alt="New preview"
                          className="max-h-64 w-auto rounded border"
                        />
                      </div>
                    );
                  }
                  
                  if (editImageUrl) {
                    return (
                      <div className="w-full flex items-center justify-start">
                        <img
                          src={editImageUrl}
                          alt="Current testimonial"
                          className="max-h-64 w-auto rounded border"
                        />
                      </div>
                    );
                  }
                  
                  return (
                    <div className="text-xs text-gray-500">No image uploaded</div>
                  );
                })()}
              </div>
              <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:col-span-2">
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*"
                  className="
                    text-sm text-gray-700
                    file:inline-flex file:items-center file:justify-center
                    file:mr-3 file:px-4 file:py-2 file:font-medium
                    file:rounded-md file:border file:border-gray-300
                    file:bg-white file:text-gray-800
                    hover:file:bg-gray-50
                    file:transition file:duration-150
                    focus-visible:file:outline-none focus-visible:file:ring-2 focus-visible:file:ring-gray-400/60
                    file:cursor-pointer
                    w-full max-w-full md:w-auto
                  "
                  onChange={(e) =>
                    setEditImageFile(e.target.files?.[0] || null)
                  }
                />
                <div className="flex items-center gap-2">
                  <Switch
                    id="editActive"
                    checked={editForm.isActive}
                    onCheckedChange={(v) =>
                      setEditForm((p) => ({ ...p, isActive: v }))
                    }
                  />
                  <label htmlFor="editActive">Active</label>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={editLoading}
              onClick={async () => {
                if (!editTestimonialId) return;
                setEditLoading(true);
                try {
                  let imagePath: string | null = null;
                  if (editImageFile) {
                    const filePath = s3.getTestimonialImagePath(
                      editImageFile.name
                    );
                    const res = await apiFetch("/api/s3/put", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        filePath,
                        contentType: editImageFile.type,
                      }),
                      logoutOn401: false,
                    });
                    if (res.status === 401) {
                      const { signOut } = await import("next-auth/react");
                      signOut();
                      return;
                    }
                    if (!res.ok) throw new Error("Failed to get signed URL");
                    const { signedUrl } = await res.json();
                    const upload = await fetch(signedUrl, {
                      method: "PUT",
                      body: editImageFile,
                      headers: {
                        "Content-Type":
                          editImageFile.type || "application/octet-stream",
                      },
                    });
                    if (!upload.ok)
                      throw new Error("Failed to upload image to S3");
                    imagePath = filePath;
                  }

                  const updateRes = await fetch(
                    `/api/admin/testimonials/${editTestimonialId}`,
                    {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        ...editForm,
                        ...(imagePath && { imagePath }),
                      }),
                    }
                  );
                  if (!updateRes.ok)
                    throw new Error("Failed to update testimonial");
                  const updated: Testimonial = await updateRes.json();
                  setItems((prev) =>
                    prev.map((t) => (t.id === editTestimonialId ? updated : t))
                  );
                  toast.success("Testimonial updated");
                  setShowEditModal(false);
                } catch (e: any) {
                  toast.error(e.message || "Failed to update testimonial");
                } finally {
                  setEditLoading(false);
                }
              }}
            >
              {editLoading ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
              disabled={editLoading}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal removed; handled in Details Modal */}

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Testimonial Details</DialogTitle>
          </DialogHeader>
          {detailsItem ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Name</div>
                  <div className="font-medium">{detailsItem.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Role</div>
                  <div className="font-medium">{detailsItem.role}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Active</div>
                  <div className="font-medium">
                    {detailsItem.isActive ? "Yes" : "No"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Image Path</div>
                  <div className="font-mono text-xs break-all">
                    {detailsItem.imagePath || "-"}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">Text</div>
                <div className="whitespace-pre-wrap leading-relaxed">
                  {detailsItem.text}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="text-gray-500">Created:</span>{" "}
                  {new Date(detailsItem.createdAt as any).toLocaleString()}
                </div>
                {detailsItem.updatedAt ? (
                  <div>
                    <span className="text-gray-500">Updated:</span>{" "}
                    {new Date(detailsItem.updatedAt as any).toLocaleString()}
                  </div>
                ) : null}
              </div>

              {detailsItem.imagePath ? (
                <div className="space-y-3">
                  <div className="text-sm text-gray-500">Image</div>
                  {detailsItem.imageUrl ? (
                    <div className="w-full flex items-center justify-center">
                      <img
                        src={detailsItem.imageUrl}
                        alt="Testimonial author"
                        className="max-h-[60vh] w-auto rounded border"
                      />
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">
                      No image available
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowDetailsModal(false);
                setDetailsItem(null);
              }}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
