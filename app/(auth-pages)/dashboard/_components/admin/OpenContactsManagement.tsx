import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Calendar,
  Contact,
  ArrowUpDown,
} from "lucide-react";
import { Loader } from "@/components/ui/loader";
import toast from "react-hot-toast";
import { apiFetch } from "@/lib/client-api";
import { DataTable } from "@/components/ui/data_table";
import { ColumnDef } from "@tanstack/react-table";
import * as XLSX from "xlsx";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Link {
  id?: string;
  name: string;
  url: string;
}

interface ImportantDate {
  id?: string;
  title: string;
  description?: string;
  date: string;
}

interface OpenContact {
  id?: string;
  address?: string;
  phone1?: string;
  phone2?: string;
  email?: string;
  links: Link[];
  importantDates: ImportantDate[];
}

// Helper function to check if a date is expired
const isExpiredDate = (dateString: string): boolean => {
  const today = new Date();
  const date = new Date(dateString);
  return date < today;
};

// Format date for HTML date input (YYYY-MM-DD)
const formatDateForInput = (dateString: string) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
};

// Column header component for sortable columns
const SortableHeader = ({ 
  column, 
  children 
}: { 
  column: any; 
  children: React.ReactNode; 
}) => (
  <Button
    variant="ghost"
    onClick={() =>
      column.toggleSorting(column.getIsSorted() === "asc")
    }
    className="px-0"
  >
    {children}
    <ArrowUpDown className="ml-2 h-4 w-4" />
  </Button>
);

// Date cell component
const DateCell = ({ date }: { date: string }) => (
  <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full">
    {new Date(date).toLocaleDateString()}
  </span>
);

// Title cell component with expiry status
const TitleCellWithExpiry = ({ 
  title, 
  date 
}: { 
  title: string; 
  date: string; 
}) => {
  const expired = isExpiredDate(date);
  return (
    <div className="flex items-center gap-2">
      <span
        className={
          expired ? "text-gray-400" : "text-gray-900"
        }
      >
        {title || "—"}
      </span>
      {expired && (
        <span className="text-[10px] rounded-full px-2 py-0.5 bg-gray-200 text-gray-700">
          Expired
        </span>
      )}
    </div>
  );
};

// Description cell component
const DescriptionCell = ({ description }: { description?: string }) => {
  const text = description || "—";
  return (
    <div
      className="text-sm text-gray-700 max-w-xs truncate"
      title={description || ""}
    >
      {text}
    </div>
  );
};

// Actions cell component for dates
const DateActionsCell = ({ 
  contact, 
  index, 
  date, 
  onEdit, 
  onDelete 
}: { 
  contact: OpenContact; 
  index: number; 
  date: string; 
  onEdit: (contact: OpenContact, index: number) => void; 
  onDelete: (contact: OpenContact, index: number) => void; 
}) => {
  const expired = isExpiredDate(date);
  const commonDisabled = expired ? "opacity-50 cursor-not-allowed" : "";
  
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={expired}
        className={`border-purple-200 ${expired ? "bg-gray-100 text-gray-400 " + commonDisabled : "bg-purple-50 text-purple-600 hover:text-purple-700"}`}
        title={expired ? "This date is expired" : "Edit Important Date"}
        onClick={() => !expired && onEdit(contact, index)}
      >
        <Edit className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={expired}
        className={`border-red-200 ${expired ? "bg-gray-100 text-gray-400 " + commonDisabled : "bg-red-50 text-red-600 hover:text-red-700"}`}
        title={expired ? "This date is expired" : "Delete Important Date"}
        onClick={() => !expired && onDelete(contact, index)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
};

// Actions cell component for links
const LinkActionsCell = ({ 
  contact, 
  index, 
  onEdit, 
  onDelete 
}: { 
  contact: OpenContact; 
  index: number; 
  onEdit: (contact: OpenContact, index: number) => void; 
  onDelete: (contact: OpenContact, index: number) => void; 
}) => (
  <div className="flex items-center gap-2">
    <Button
      variant="outline"
      size="sm"
      className="border-emerald-200 bg-emerald-50 text-emerald-600 hover:text-emerald-700"
      title="Edit Link"
      onClick={() => onEdit(contact, index)}
    >
      <Edit className="w-4 h-4" />
    </Button>
    <Button
      variant="outline"
      size="sm"
      className="border-red-200 bg-red-50 text-red-600 hover:text-red-700"
      title="Delete Link"
      onClick={() => onDelete(contact, index)}
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  </div>
);

// Column definition functions
const createDateColumns = (
  contact: OpenContact,
  openDatesModal: (contact: OpenContact, index: number) => void,
  handleDeleteDate: (contact: OpenContact, index: number) => void
): ColumnDef<ImportantDate>[] => [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <SortableHeader column={column}>
        Title
      </SortableHeader>
    ),
    cell: ({ row }) => (
      <TitleCellWithExpiry 
        title={row.original.title} 
        date={row.original.date} 
      />
    ),
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <SortableHeader column={column}>
        Date
      </SortableHeader>
    ),
    cell: ({ row }) => (
      <DateCell date={row.original.date} />
    ),
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <SortableHeader column={column}>
        Description
      </SortableHeader>
    ),
    cell: ({ row }) => (
      <DescriptionCell description={row.original.description} />
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <DateActionsCell
        contact={contact}
        index={row.index}
        date={row.original.date}
        onEdit={openDatesModal}
        onDelete={handleDeleteDate}
      />
    ),
  },
];

const createLinkColumns = (
  contact: OpenContact,
  openLinksModal: (contact: OpenContact, index: number) => void,
  handleDeleteLink: (contact: OpenContact, index: number) => void
): ColumnDef<Link>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <SortableHeader column={column}>
        Name
      </SortableHeader>
    ),
    cell: ({ row }) => (
      <span className="font-medium text-gray-900">
        {row.original.name || "—"}
      </span>
    ),
  },
  {
    accessorKey: "url",
    header: ({ column }) => (
      <SortableHeader column={column}>
        URL
      </SortableHeader>
    ),
    cell: ({ row }) => (
      <a
        href={row.original.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline max-w-xs truncate block"
        title={row.original.url}
      >
        {row.original.url}
      </a>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <LinkActionsCell
        contact={contact}
        index={row.index}
        onEdit={openLinksModal}
        onDelete={handleDeleteLink}
      />
    ),
  },
];

// Export helper functions
const exportToExcel = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    toast.error("No data to export");
    return;
  }
  
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, filename);
};

const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    toast.error("No data to export");
    return;
  }
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header] ?? "";
        const escaped = String(value).replaceAll('"', '""');
        return `"${escaped}"`;
      }).join(",")
    )
  ].join(String.raw`
`);
  
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const createTableCell = (content: string): string => {
  return `<td style="border:1px solid #ddd;padding:6px;font-size:10px;">${content}</td>`;
};

const createTableRow = (cells: string[]): string => {
  const cellsHtml = cells.map(cell => createTableCell(cell)).join("");
  return `<tr>${cellsHtml}</tr>`;
};

const exportToPrint = (data: any[], title: string) => {
  if (!data || data.length === 0) {
    toast.error("No data to export");
    return;
  }
  
  const headers = Object.keys(data[0]);
  const tableRows = data.map(row => {
    const cells = headers.map(h => row[h] ?? "");
    return createTableRow(cells);
  });
  
  const headerCells = headers.map(h => `<th style="border:1px solid #ddd;padding:8px;background:#f5f5f5;">${h}</th>`).join("");
  
  const htmlContent = `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
</head>
<body style="font-family:Arial,Helvetica,sans-serif;">
  <h1>${title}</h1>
  <table style="border-collapse:collapse;width:100%;">
    <thead>
      <tr>
        ${headerCells}
      </tr>
    </thead>
    <tbody>
      ${tableRows.join("")}
    </tbody>
  </table>
</body>
</html>`;
  
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (w) {
    w.onload = () => {
      w.print();
      URL.revokeObjectURL(url);
    };
  } else {
    URL.revokeObjectURL(url);
  }
};

// Helper functions for export operations
const exportLinksToExcel = (links: Link[]) => {
  const rows = links.map((l) => ({ Name: l.name, URL: l.url }));

  if (rows.length === 0) {
    toast.error("No data to export");
    return;
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Links");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "links.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast.success("Excel file exported successfully");
};

const exportLinksToCSV = (links: Link[], toCSV: (rows: any[]) => string, downloadBlob: (content: BlobPart, filename: string, mime: string) => void) => {
  const rows = links.map((l) => ({ Name: l.name, URL: l.url }));
  const csv = toCSV(rows);
  downloadBlob(csv, "links.csv", "text/csv;charset=utf-8;");
};

const exportLinksToPrint = (links: Link[]) => {
  const rows = links.map((l) => ({ Name: l.name, URL: l.url }));
  const headers = Object.keys(rows[0] || {});

  const tableRows = rows
    .map((r) => headers.map((h) => String((r as Record<string, any>)[h] ?? "")))
    .map((cells) => createTableRow(cells))
    .join("");
  const headerRow = headers.map((h) => `<th style="border:1px solid #ddd;padding:6px;text-align:left;background:#f3f4f6;font-size:11px;">${h}</th>`).join("");
  
  const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Links</title></head><body style="font-family:Arial,Helvetica,sans-serif;"><h3 style="margin:8px 0;">Links</h3><table style="border-collapse:collapse;width:100%;"><thead><tr>${headerRow}</tr></thead><tbody>${tableRows}</tbody></table><script>window.onload = () => { window.print(); }</script></body></html>`;
  
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (w) {
    w.onload = () => URL.revokeObjectURL(url);
  } else {
    URL.revokeObjectURL(url);
  }
};

const copyLinksToClipboard = async (links: Link[], toCSV: (rows: any[]) => string) => {
  const rows = links.map((l) => ({ Name: l.name, URL: l.url }));
  const csv = toCSV(rows);
  try {
    await navigator.clipboard.writeText(csv);
    toast.success("Copied to clipboard");
  } catch {
    toast.error("Copy failed");
  }
};

// Event handler helpers
const handleExportDatesExcel = (filteredDates: ImportantDate[]) => {
  const rows = filteredDates.map((d) => ({
    Title: d.title,
    Description: d.description || "",
    Date: d.date ? new Date(d.date).toLocaleDateString() : "",
  }));
  exportToExcel(rows, "important-dates.xlsx");
  toast.success("Excel file exported successfully");
};

const handleExportDatesCSV = (filteredDates: ImportantDate[]) => {
  const rows = filteredDates.map((d) => ({
    Title: d.title,
    Description: d.description || "",
    Date: d.date ? new Date(d.date).toLocaleDateString() : "",
  }));
  exportToCSV(rows, "important-dates.csv");
};

const handleExportDatesPrint = (filteredDates: ImportantDate[]) => {
  const rows = filteredDates.map((d) => ({
    Title: d.title,
    Description: d.description || "",
    Date: d.date ? new Date(d.date).toLocaleDateString() : "",
  }));
  exportToPrint(rows, "Important Dates");
};

const handleCopyDatesToClipboard = async (filteredDates: ImportantDate[]) => {
  const rows = filteredDates.map((d) => ({
    Title: d.title,
    Description: d.description || "",
    Date: d.date ? new Date(d.date).toLocaleDateString() : "",
  }));
  
  if (rows.length === 0) {
    toast.error("No data to copy");
    return;
  }
  
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(","),
    ...rows.map(row => 
      headers.map(header => {
        const value = (row as any)[header] ?? "";
        return `"${String(value).replaceAll('"', '""')}"`;
      }).join(",")
    )
  ].join(String.raw`
`);
  
  try {
    await navigator.clipboard.writeText(csvContent);
    toast.success("Copied to clipboard");
  } catch {
    toast.error("Copy failed");
  }
};

export default function OpenContactsManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openContacts, setOpenContacts] = useState<OpenContact[]>([]);
  const [editingContact, setEditingContact] = useState<OpenContact | null>(
    null
  );
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [dateStatusFilter, setDateStatusFilter] = useState<
    "All" | "Active" | "Expired"
  >("All");

  // Modal states
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [datesModalOpen, setDatesModalOpen] = useState(false);
  const [linksModalOpen, setLinksModalOpen] = useState(false);
  const [editingDateIndex, setEditingDateIndex] = useState<number | null>(null);
  const [editingLinkIndex, setEditingLinkIndex] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState<OpenContact>({
    address: "",
    phone1: "",
    phone2: "",
    email: "",
    links: [],
    importantDates: [],
  });

  // Modal form states
  const [contactFormData, setContactFormData] = useState({
    address: "",
    phone1: "",
    phone2: "",
    email: "",
  });

  const [dateFormData, setDateFormData] = useState({
    title: "",
    description: "",
    date: "",
  });

  const [linkFormData, setLinkFormData] = useState({
    name: "",
    url: "",
  });

  // Fetch open contacts
  const fetchOpenContacts = async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/api/admin/open-contacts", { logoutOn401: false });
      if (!response.ok) throw new Error("Failed to fetch contacts");
      const data = await response.json();
      setOpenContacts(data);
    } catch (error) {
      toast.error("Failed to load contacts");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpenContacts();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = "/api/admin/open-contacts";
      const method = editingContact ? "PUT" : "POST";
      const payload = editingContact
        ? { ...formData, id: editingContact.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save contact");

      toast.success(
        editingContact
          ? "Contact updated successfully!"
          : "Contact created successfully!"
      );

      resetForm();
      fetchOpenContacts();
    } catch (error) {
      toast.error("Failed to save contact");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    try {
      const response = await fetch(`/api/admin/open-contacts?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete contact");

      toast.success("Contact deleted successfully!");
      fetchOpenContacts();
    } catch (error) {
      toast.error("Failed to delete contact");
      console.error(error);
    }
  };

  // Helpers
  // Form helpers
  const resetForm = () => {
    setFormData({
      address: "",
      phone1: "",
      phone2: "",
      email: "",
      links: [],
      importantDates: [],
    });
    setEditingContact(null);
    setIsAddingNew(false);
  };

  const startAddNew = () => {
    setFormData({
      address: "",
      phone1: "",
      phone2: "",
      email: "",
      links: [],
      importantDates: [],
    });
    setEditingContact(null);
    setIsAddingNew(true);
  };

  // Link management
  const addLink = () => {
    setFormData({
      ...formData,
      links: [...formData.links, { name: "", url: "" }],
    });
  };

  const updateLink = (index: number, field: keyof Link, value: string) => {
    const updatedLinks = formData.links.map((link, i) =>
      i === index ? { ...link, [field]: value } : link
    );
    setFormData({ ...formData, links: updatedLinks });
  };

  const removeLink = (index: number) => {
    const updatedLinks = formData.links.filter((_, i) => i !== index);
    setFormData({ ...formData, links: updatedLinks });
  };

  // Important dates management
  const addImportantDate = () => {
    setFormData({
      ...formData,
      importantDates: [
        ...formData.importantDates,
        { title: "", description: "", date: "" },
      ],
    });
  };

  const updateImportantDate = (
    index: number,
    field: keyof ImportantDate,
    value: string
  ) => {
    const updatedDates = formData.importantDates.map((date, i) =>
      i === index ? { ...date, [field]: value } : date
    );
    setFormData({ ...formData, importantDates: updatedDates });
  };

  const removeImportantDate = (index: number) => {
    const updatedDates = formData.importantDates.filter((_, i) => i !== index);
    setFormData({ ...formData, importantDates: updatedDates });
  };

  // Modal handlers
  const openContactModal = (contact: OpenContact) => {
    setContactFormData({
      address: contact.address || "",
      phone1: contact.phone1 || "",
      phone2: contact.phone2 || "",
      email: contact.email || "",
    });
    setEditingContact(contact);
    setContactModalOpen(true);
  };

  const openDatesModal = (contact: OpenContact, dateIndex?: number) => {
    if (dateIndex === undefined) {
      setDateFormData({
        title: "",
        description: "",
        date: "",
      });
      setEditingDateIndex(null);
    } else {
      const date = contact.importantDates[dateIndex];
      setDateFormData({
        title: date?.title || "",
        description: date?.description || "",
        date: formatDateForInput(date?.date || ""),
      });
      setEditingDateIndex(dateIndex);
    }
    setEditingContact(contact);
    setDatesModalOpen(true);
  };

  const openLinksModal = (contact: OpenContact, linkIndex?: number) => {
    if (linkIndex === undefined) {
      setLinkFormData({
        name: "",
        url: "",
      });
      setEditingLinkIndex(null);
    } else {
      const link = contact.links[linkIndex];
      setLinkFormData({
        name: link?.name || "",
        url: link?.url || "",
      });
      setEditingLinkIndex(linkIndex);
    }
    setEditingContact(contact);
    setLinksModalOpen(true);
  };

  const handleContactSave = async () => {
    if (!editingContact) return;

    setSaving(true);
    try {
      try {
        const response = await apiFetch("/api/admin/open-contacts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingContact.id,
            ...contactFormData,
            links: editingContact.links,
            importantDates: editingContact.importantDates,
          }),
          logoutOn401: false,
        });

        if (response.status === 401) {
          const { signOut } = await import("next-auth/react");
          signOut();
          return;
        }

        if (!response.ok) throw new Error("Failed to update contact");

        toast.success("Contact information updated successfully!");
        setContactModalOpen(false);
        fetchOpenContacts();
      } catch (error) {
        toast.error("Failed to update contact");
        console.error(error);
      } finally {
        setSaving(false);
      }
    } catch (error) {
      toast.error("Failed to update contact");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDateSave = async () => {
    if (!editingContact) return;

    setSaving(true);
    try {
      const updatedDates = [...(editingContact.importantDates || [])];

      if (editingDateIndex === null) {
        // Add new date
        updatedDates.push(dateFormData);
      } else {
        // Edit existing date
        updatedDates[editingDateIndex] = dateFormData;
      }

      const response = await apiFetch("/api/admin/open-contacts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingContact.id,
          address: editingContact.address,
          phone1: editingContact.phone1,
          phone2: editingContact.phone2,
          email: editingContact.email,
          links: editingContact.links,
          importantDates: updatedDates,
        }),
      });

      if (!response.ok) throw new Error("Failed to update dates");

      toast.success(
        editingDateIndex === null
          ? "Date added successfully!"
          : "Date updated successfully!"
      );
      setDatesModalOpen(false);
      fetchOpenContacts();
    } catch (error) {
      toast.error("Failed to update dates");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleLinkSave = async () => {
    if (!editingContact) return;

    setSaving(true);
    try {
      const updatedLinks = [...(editingContact.links || [])];

      if (editingLinkIndex === null) {
        // Add new link
        updatedLinks.push(linkFormData);
      } else {
        // Edit existing link
        updatedLinks[editingLinkIndex] = linkFormData;
      }

      const response = await apiFetch("/api/admin/open-contacts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingContact.id,
          address: editingContact.address,
          phone1: editingContact.phone1,
          phone2: editingContact.phone2,
          email: editingContact.email,
          links: updatedLinks,
          importantDates: editingContact.importantDates,
        }),
      });

      if (!response.ok) throw new Error("Failed to update links");

      toast.success(
        editingLinkIndex === null
          ? "Link added successfully!"
          : "Link updated successfully!"
      );
      setLinksModalOpen(false);
      fetchOpenContacts();
    } catch (error) {
      toast.error("Failed to update links");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDate = async (contact: OpenContact, dateIndex: number) => {
    if (!confirm("Are you sure you want to delete this date?")) return;

    setSaving(true);
    try {
      const updatedDates = (contact.importantDates || []).filter(
        (_, i) => i !== dateIndex
      );

      const response = await apiFetch("/api/admin/open-contacts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: contact.id,
          address: contact.address,
          phone1: contact.phone1,
          phone2: contact.phone2,
          email: contact.email,
          links: contact.links,
          importantDates: updatedDates,
        }),
      });

      if (!response.ok) throw new Error("Failed to delete date");

      toast.success("Date deleted successfully!");
      fetchOpenContacts();
    } catch (error) {
      toast.error("Failed to delete date");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLink = async (contact: OpenContact, linkIndex: number) => {
    if (!confirm("Are you sure you want to delete this link?")) return;

    setSaving(true);
    try {
      const updatedLinks = (contact.links || []).filter(
        (_, i) => i !== linkIndex
      );

      try {
        const response = await apiFetch("/api/admin/open-contacts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: contact.id,
            address: contact.address,
            phone1: contact.phone1,
            phone2: contact.phone2,
            email: contact.email,
            links: updatedLinks,
            importantDates: contact.importantDates,
          }),
          logoutOn401: false,
        });

        if (response.status === 401) {
          const { signOut } = await import("next-auth/react");
          signOut();
          return;
        }

        if (!response.ok) throw new Error("Failed to delete link");

        toast.success("Link deleted successfully!");
        fetchOpenContacts();
      } catch (error) {
        toast.error("Failed to delete link");
        console.error(error);
      } finally {
        setSaving(false);
      }
    } catch (error) {
      toast.error("Failed to delete link");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // Client-side export helpers
  const toCSV = (rows: any[]) => {
    if (!rows.length) return "";
    const headers = Object.keys(rows[0]);
    const escape = (v: any) => {
      const s = String(v ?? "");
      return s.includes(",") || s.includes("\n") || s.includes('"')
        ? '"' + s.replaceAll('"', '""') + '"'
        : s;
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader size={48} className="mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900">Loading Contact Information</h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Contact className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Public Contact Information
          </h2>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Manage public contact information, important dates, and external links
          for your organization
        </p>
      </div>

      {/* Add New Contact Form */}
      {isAddingNew && (
        <Card className="border-2 border-blue-300 shadow-lg shadow-blue-100">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center space-x-2">
                Add New Contact Information
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleSubmit}
                  disabled={saving}
                  size="sm"
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-md"
                >
                  {saving ? (
                    <>
                      <Loader size={16} className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                  disabled={saving}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Add New Contact Form */}
            <div className="space-y-6">
              {/* Contact Information Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Phone className="w-5 h-5 mr-2 text-blue-600" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="phone1"
                      className="flex items-center space-x-2 text-sm font-medium"
                    >
                      <Phone className="w-4 h-4 text-blue-500" />
                      <span>Primary Phone</span>
                    </Label>
                    <Input
                      id="phone1"
                      type="tel"
                      value={formData.phone1 || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone1: e.target.value,
                        })
                      }
                      placeholder="Enter primary phone number"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="phone2"
                      className="flex items-center space-x-2 text-sm font-medium"
                    >
                      <Phone className="w-4 h-4 text-blue-500" />
                      <span>Secondary Phone</span>
                    </Label>
                    <Input
                      id="phone2"
                      type="tel"
                      value={formData.phone2 || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone2: e.target.value,
                        })
                      }
                      placeholder="Enter secondary phone number"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label
                    htmlFor="email"
                    className="flex items-center space-x-2 text-sm font-medium"
                  >
                    <Mail className="w-4 h-4 text-blue-500" />
                    <span>Email</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="Enter email address"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2 mt-4">
                  <Label
                    htmlFor="address"
                    className="flex items-center space-x-2 text-sm font-medium"
                  >
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span>Address</span>
                  </Label>
                  <Textarea
                    id="address"
                    value={formData.address || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: e.target.value,
                      })
                    }
                    placeholder="Enter address"
                    rows={3}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Important Dates Section */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
                <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                    Important Dates
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addImportantDate}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-md whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Add Date</span>
                  </Button>
                </div>

                {formData.importantDates.map((date, index) => (
                  <div
                    key={`important-date-${index}`}
                    className="space-y-3 p-4 bg-white rounded-lg border border-purple-200 mb-3"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Title
                        </Label>
                        <Input
                          value={date.title}
                          onChange={(e) =>
                            updateImportantDate(index, "title", e.target.value)
                          }
                          placeholder="Event title"
                          className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Date
                        </Label>
                        <Input
                          type="date"
                          value={date.date}
                          onChange={(e) =>
                            updateImportantDate(index, "date", e.target.value)
                          }
                          className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Description
                      </Label>
                      <Textarea
                        value={date.description || ""}
                        onChange={(e) =>
                          updateImportantDate(
                            index,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="Event description"
                        rows={2}
                        className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeImportantDate(index)}
                        className="border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Links Section */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <ExternalLink className="w-5 h-5 mr-2 text-emerald-600" />
                    External Links
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addLink}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 shadow-md"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Link
                  </Button>
                </div>

                {formData.links.map((link, index) => (
                  <div
                    key={`external-link-${index}`}
                    className="flex space-x-2 items-end bg-white p-3 rounded-lg border border-emerald-200 mb-3"
                  >
                    <div className="flex-1">
                      <Label className="text-sm font-medium text-gray-700">
                        Name
                      </Label>
                      <Input
                        value={link.name}
                        onChange={(e) =>
                          updateLink(index, "name", e.target.value)
                        }
                        placeholder="Link name"
                        className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-sm font-medium text-gray-700">
                        URL
                      </Label>
                      <Input
                        value={link.url}
                        onChange={(e) =>
                          updateLink(index, "url", e.target.value)
                        }
                        placeholder="https://..."
                        className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeLink(index)}
                      className="flex-shrink-0 border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contacts List */}
      <div className="space-y-4">
        {openContacts.length > 0 && openContacts.map((contact) => (
            <Card
              key={contact.id}
              className={`transition-all duration-300 ${
                editingContact?.id === contact.id
                  ? "border-2 border-blue-300 shadow-lg shadow-blue-100"
                  : "hover:shadow-md hover:border-gray-300"
              }`}
            >
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-5 h-5 mr-2 text-blue-600" />
                    Contact Information
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => contact.id && handleDelete(contact.id)}
                      title="Delete Contact"
                      className="border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Display View */}
                <div className="space-y-6">
                  {/* Contact Information Display */}
                  <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-800 flex items-center justify-between">
                        <div className="flex items-center">
                          <Phone className="w-5 h-5 mr-2 text-blue-600" />
                          Contact Information
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openContactModal(contact)}
                            title="Edit Contact Information"
                            className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200 hover:from-purple-100 hover:to-violet-100 text-purple-700"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center space-x-2 text-sm font-medium">
                            <Phone className="w-4 h-4 text-blue-500" />
                            <span>Primary Phone</span>
                          </Label>
                          <div className="p-3 bg-white rounded-md border border-blue-200 min-h-[40px] flex items-center">
                            {contact.phone1 ? (
                              <span className="text-sm text-gray-700">
                                {contact.phone1}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">
                                Not provided
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="flex items-center space-x-2 text-sm font-medium">
                            <Phone className="w-4 h-4 text-blue-500" />
                            <span>Secondary Phone</span>
                          </Label>
                          <div className="p-3 bg-white rounded-md border border-blue-200 min-h-[40px] flex items-center">
                            {contact.phone2 ? (
                              <span className="text-sm text-gray-700">
                                {contact.phone2}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">
                                Not provided
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mt-4">
                        <Label className="flex items-center space-x-2 text-sm font-medium">
                          <Mail className="w-4 h-4 text-blue-500" />
                          <span>Email</span>
                        </Label>
                        <div className="p-3 bg-white rounded-md border border-blue-200 min-h-[40px] flex items-center">
                          {contact.email ? (
                            <span className="text-sm text-gray-700">
                              {contact.email}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">
                              Not provided
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 mt-4">
                        <Label className="flex items-center space-x-2 text-sm font-medium">
                          <MapPin className="w-4 h-4 text-blue-500" />
                          <span>Address</span>
                        </Label>
                        <div className="p-3 bg-white rounded-md border border-blue-200 min-h-[76px] flex items-start">
                          {contact.address ? (
                            <span className="text-sm text-gray-700 whitespace-pre-wrap">
                              {contact.address}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">
                              Not provided
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Important Dates Display */}
                  <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
                        <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                        Important Dates
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const dateColumns = createDateColumns(
                          contact,
                          openDatesModal,
                          handleDeleteDate
                        );
                        const filteredDates = (
                          contact.importantDates || []
                        ).filter((d) => {
                          const expired = isExpiredDate(d.date);
                          if (dateStatusFilter === "All") return true;
                          if (dateStatusFilter === "Expired") return expired;
                          return !expired; // Active
                        });
                        return filteredDates && filteredDates.length > 0 ? (
                          <div className="bg-white rounded-lg border border-purple-200 p-4">
                            <div className="flex flex-wrap items-center justify-between mb-3 gap-6">
                              <div className="flex items-center gap-2 order-2 sm:order-1 w-full sm:w-auto">
                                <Select
                                  value={dateStatusFilter}
                                  onValueChange={(v) =>
                                    setDateStatusFilter(v as "All" | "Active" | "Expired")
                                  }
                                >
                                  <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Filter" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="All">All</SelectItem>
                                    <SelectItem value="Active">
                                      Active
                                    </SelectItem>
                                    <SelectItem value="Expired">
                                      Expired
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex items-center gap-2 w-full justify-end sm:w-auto order-1 sm:order-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className="px-3 py-2 bg-white border-purple-300 hover:bg-purple-50 text-purple-700"
                                      title="Export important dates"
                                    >
                                      Export
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-40"
                                  >
                                    <DropdownMenuItem
                                      onClick={() => handleExportDatesExcel(filteredDates)}
                                    >
                                      Export Excel
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleExportDatesCSV(filteredDates)}
                                    >
                                      Export CSV
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleExportDatesPrint(filteredDates)}
                                    >
                                      Export PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleCopyDatesToClipboard(filteredDates)}
                                    >
                                      Copy
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openDatesModal(contact)}
                                  title="Add Important Date"
                                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-md whitespace-nowrap shrink-0"
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  <span className="sm:inline">Add Date</span>
                                </Button>
                              </div>
                            </div>
                            <DataTable
                              columns={dateColumns}
                              data={filteredDates}
                              searchAllColumns
                              placeholder="Search dates..."
                            />
                          </div>
                        ) : (
                          <div className="p-4 bg-white rounded-lg border border-purple-200 text-center">
                            <Calendar className="w-8 h-8 mx-auto mb-2 text-purple-300" />
                            <span className="text-sm text-gray-400 mb-4 block">
                              No important dates added
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDatesModal(contact)}
                              title="Add Important Date"
                              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-md"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Date
                            </Button>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  {/* Links Display */}
                  <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
                        <ExternalLink className="w-5 h-5 mr-2 text-emerald-600" />
                        External Links
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const linkColumns = createLinkColumns(
                          contact,
                          openLinksModal,
                          handleDeleteLink
                        );
                        return contact.links && contact.links.length > 0 ? (
                          <div className="bg-white rounded-lg border border-emerald-200 p-4">
                            <div className="flex items-center justify-end mb-3 gap-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="px-3 py-2 bg-white border-emerald-300 hover:bg-emerald-50 text-emerald-700"
                                    title="Export links"
                                  >
                                    Export
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-40"
                                >
                                  <DropdownMenuItem
                                    onClick={() => exportLinksToExcel(contact.links || [])}
                                  >
                                    Export Excel
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => exportLinksToCSV(contact.links || [], toCSV, downloadBlob)}
                                  >
                                    Export CSV
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => exportLinksToPrint(contact.links || [])}
                                  >
                                    Export PDF
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={async () => await copyLinksToClipboard(contact.links || [], toCSV)}
                                  >
                                    Copy
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openLinksModal(contact)}
                                title="Add External Link"
                                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 shadow-md"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Link
                              </Button>
                            </div>
                            <DataTable
                              columns={linkColumns}
                              data={contact.links}
                              searchAllColumns
                              placeholder="Search links..."
                            />
                          </div>
                        ) : (
                          <div className="p-4 bg-white rounded-lg border border-emerald-200 text-center">
                            <ExternalLink className="w-8 h-8 mx-auto mb-2 text-emerald-300" />
                            <span className="text-sm text-gray-400 mb-4 block">
                              No links added
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openLinksModal(contact)}
                              title="Add External Link"
                              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 shadow-md"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Link
                            </Button>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          ))}
        {openContacts.length === 0 && !isAddingNew && (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                <MapPin className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Contacts Added
              </h3>
              <p className="text-gray-500 mb-4">
                Contact information will appear here once added
              </p>
              <Button
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-md"
                onClick={startAddNew}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Contact Information
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Contact Information Modal */}
      <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Phone className="w-5 h-5 mr-2 text-blue-600" />
              Edit Contact Information
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Contact Information Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Phone className="w-5 h-5 mr-2 text-blue-600" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="modal-phone1" className="text-sm font-medium">
                    Primary Phone
                  </Label>
                  <Input
                    id="modal-phone1"
                    type="tel"
                    value={contactFormData.phone1}
                    onChange={(e) =>
                      setContactFormData({
                        ...contactFormData,
                        phone1: e.target.value,
                      })
                    }
                    placeholder="Enter primary phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modal-phone2" className="text-sm font-medium">
                    Secondary Phone
                  </Label>
                  <Input
                    id="modal-phone2"
                    type="tel"
                    value={contactFormData.phone2}
                    onChange={(e) =>
                      setContactFormData({
                        ...contactFormData,
                        phone2: e.target.value,
                      })
                    }
                    placeholder="Enter secondary phone number"
                  />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="modal-email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="modal-email"
                  type="email"
                  value={contactFormData.email}
                  onChange={(e) =>
                    setContactFormData({
                      ...contactFormData,
                      email: e.target.value,
                    })
                  }
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="modal-address" className="text-sm font-medium">
                  Address
                </Label>
                <Textarea
                  id="modal-address"
                  value={contactFormData.address}
                  onChange={(e) =>
                    setContactFormData({
                      ...contactFormData,
                      address: e.target.value,
                    })
                  }
                  placeholder="Enter address"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                onClick={handleContactSave}
                disabled={saving}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                {saving ? (
                  <>
                    <Loader size={16} className="mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setContactModalOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Important Dates Modal */}
      <Dialog open={datesModalOpen} onOpenChange={setDatesModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-purple-600" />
              {editingDateIndex === null
                ? "Add Important Date"
                : "Edit Important Date"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="modal-date-title" className="text-sm font-medium">
                Title
              </Label>
              <Input
                id="modal-date-title"
                value={dateFormData.title}
                onChange={(e) =>
                  setDateFormData({ ...dateFormData, title: e.target.value })
                }
                placeholder="Event title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modal-date-date" className="text-sm font-medium">
                Date
              </Label>
              <Input
                id="modal-date-date"
                type="date"
                value={dateFormData.date}
                onChange={(e) =>
                  setDateFormData({ ...dateFormData, date: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="modal-date-description"
                className="text-sm font-medium"
              >
                Description
              </Label>
              <Textarea
                id="modal-date-description"
                value={dateFormData.description}
                onChange={(e) =>
                  setDateFormData({
                    ...dateFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Event description"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                onClick={handleDateSave}
                disabled={saving}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                {saving ? (
                  <>
                    <Loader size={16} className="mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingDateIndex === null ? "Add Date" : "Update Date"}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setDatesModalOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* External Links Modal */}
      <Dialog open={linksModalOpen} onOpenChange={setLinksModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <ExternalLink className="w-5 h-5 mr-2 text-emerald-600" />
              {editingLinkIndex === null
                ? "Add External Link"
                : "Edit External Link"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="modal-link-name" className="text-sm font-medium">
                Link Name
              </Label>
              <Input
                id="modal-link-name"
                value={linkFormData.name}
                onChange={(e) =>
                  setLinkFormData({ ...linkFormData, name: e.target.value })
                }
                placeholder="Enter link name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modal-link-url" className="text-sm font-medium">
                URL
              </Label>
              <Input
                id="modal-link-url"
                value={linkFormData.url}
                onChange={(e) =>
                  setLinkFormData({ ...linkFormData, url: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                onClick={handleLinkSave}
                disabled={saving}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
              >
                {saving ? (
                  <>
                    <Loader size={16} className="mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingLinkIndex === null ? "Add Link" : "Update Link"}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setLinksModalOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
