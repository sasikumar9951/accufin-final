"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Plus,
  Trash2,
  Edit,
  Type,
  CircleDot,
  CheckSquare,
  GripVertical,
  Save,
  Users,
  Search,
  User,
  Mail,
  Star,
  Table,
  BarChart3,
  SeparatorHorizontal,
} from "lucide-react";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/client-api";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import ShowTerms from "@/components/showTerms";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  inputType?: string; // For input fields
  options?: string[]; // For selection and multipleChoice
  maxChoices?: number; // For multipleChoice
  // For rating
  maxRating?: number;
  showLabels?: boolean;
  labels?: string[];
  // For matrix
  rows?: string[];
  columns?: string[];
  // For net promoter score
  leftLabel?: string;
  rightLabel?: string;
  maxScore?: number;
  // For separator
  description?: string;
}

type FieldType =
  | "input"
  | "selection"
  | "multipleChoice"
  | "rating"
  | "matrix"
  | "netPromoterScore"
  | "separator";

interface FormBuilderProps {
  mode: "create" | "edit";
  formId?: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
}

// Sortable Field Component
function SortableField({
  field,
  onEdit,
  onRemove,
  isEditing,
  editProps,
}: Readonly<{
  field: FormField;
  onEdit: (field: FormField) => void;
  onRemove: (fieldId: string) => void;
  isEditing: boolean;
  editProps: any;
}>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      // className="border rounded-lg p-4 bg-white shadow-sm"
      className="border rounded-lg p-4 bg-white shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          {field.type === "input" && <Type className="w-4 h-4 text-blue-500" />}
          {field.type === "selection" && (
            <CircleDot className="w-4 h-4 text-green-500" />
          )}
          {field.type === "multipleChoice" && (
            <CheckSquare className="w-4 h-4 text-purple-500" />
          )}
          {field.type === "rating" && (
            <Star className="w-4 h-4 text-yellow-500" />
          )}
          {field.type === "matrix" && (
            <Table className="w-4 h-4 text-indigo-500" />
          )}
          {field.type === "netPromoterScore" && (
            <BarChart3 className="w-4 h-4 text-orange-500" />
          )}
          {field.type === "separator" && (
            <SeparatorHorizontal className="w-4 h-4 text-gray-500" />
          )}
          <span className="font-medium text-gray-700">
            {field.type === "input" && "Text Input"}
            {field.type === "selection" && "Radio Button"}
            {field.type === "multipleChoice" && "Checkbox"}
            {field.type === "rating" && "Star Rating"}
            {field.type === "matrix" && "Matrix/Table"}
            {field.type === "netPromoterScore" && "Net Promoter Score"}
            {field.type === "separator" && "Section Separator"}
          </span>
          {field.required && <span className="text-red-500 text-sm">*</span>}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            title="Edit Field"
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(field);
            }}
            className="h-8 w-8 p-0"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title="Remove Field"
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(field.id);
            }}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-4 border-t pt-4">
          <div>
            <Label
              htmlFor="field-label"
              className="text-sm font-medium text-gray-700 mb-2"
            >
              Field Label
            </Label>
            <Input
              id="field-label"
              value={editProps.editLabel}
              onChange={(e) => editProps.setEditLabel(e.target.value)}
              placeholder="Enter field label"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={editProps.editRequired}
              onCheckedChange={editProps.setEditRequired}
            />
            <Label>Required field</Label>
          </div>

          {field.type === "input" && (
            <div>
              <Label
                htmlFor="input-type"
                className="text-sm font-medium text-gray-700 mb-2"
              >
                Input Type
              </Label>
              <Select
                value={editProps.editInputType}
                onValueChange={editProps.setEditInputType}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="tel">Phone</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="password">Password</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {(field.type === "selection" || field.type === "multipleChoice") && (
            <div>
              <Label
                htmlFor="options"
                className="text-sm font-medium text-gray-700 mb-2"
              >
                Options
              </Label>
              <div className="space-y-2">
                {editProps.editOptions.map((option: string, idx: number) => (
                  <div key={`option-${idx}-${option}`} className="flex items-center space-x-2">
                    <Input
                      value={option}
                      onChange={(e) =>
                        editProps.updateOption(idx, e.target.value)
                      }
                      placeholder={`Option ${idx + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => editProps.removeOption(idx)}
                      disabled={editProps.editOptions.length <= 1}
                      className="h-8 w-8 p-0 text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={editProps.addOption}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Option
                </Button>
              </div>
            </div>
          )}

          {field.type === "multipleChoice" && (
            <div>
              <Label
                htmlFor="max-choices"
                className="text-sm font-medium text-gray-700 mb-2"
              >
                Maximum Choices
              </Label>
              <Input
                id="max-choices"
                type="number"
                min="1"
                max={editProps.editOptions.length}
                value={editProps.editMaxChoices}
                onChange={(e) =>
                  editProps.setEditMaxChoices(Number.parseInt(e.target.value) || 1)
                }
              />
            </div>
          )}

          {field.type === "rating" && (
            <>
              <div>
                <Label
                  htmlFor="max-rating"
                  className="text-sm font-medium text-gray-700 mb-2"
                >
                  Maximum Rating
                </Label>
                <Input
                  id="max-rating"
                  type="number"
                  min="1"
                  max="10"
                  value={editProps.editMaxRating}
                  onChange={(e) =>
                    editProps.setEditMaxRating(Number.parseInt(e.target.value) || 5)
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editProps.editShowLabels}
                  onCheckedChange={editProps.setEditShowLabels}
                />
                <Label>Show labels under stars</Label>
              </div>
              {editProps.editShowLabels && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2">
                    Labels
                  </Label>
                  <div className="space-y-2">
                    {editProps.editLabels.map(
                      (label: string, idx: number) => (
                        <div
                          key={`label-${idx}-${label}`}
                          className="flex items-center space-x-2"
                        >
                          <Input
                            value={label}
                            onChange={(e) =>
                              editProps.updateLabel(idx, e.target.value)
                            }
                            placeholder={`Label ${idx + 1}`}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editProps.removeLabel(idx)}
                            disabled={editProps.editLabels.length <= 1}
                            className="h-8 w-8 p-0 text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={editProps.addLabel}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Label
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {field.type === "matrix" && (
            <>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">
                  Rows (Questions)
                </Label>
                <div className="space-y-2">
                  {editProps.editRows.map((row: string, idx: number) => (
                    <div key={`row-${idx}-${row}`} className="flex items-center space-x-2">
                      <Input
                        value={row}
                        onChange={(e) =>
                          editProps.updateRow(idx, e.target.value)
                        }
                        placeholder={`Row ${idx + 1}`}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editProps.removeRow(idx)}
                        disabled={editProps.editRows.length <= 1}
                        className="h-8 w-8 p-0 text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={editProps.addRow}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Row
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">
                  Columns (Options)
                </Label>
                <div className="space-y-2">
                  {editProps.editColumns.map(
                    (column: string, idx: number) => (
                      <div key={`column-${idx}-${column}`} className="flex items-center space-x-2">
                        <Input
                          value={column}
                          onChange={(e) =>
                            editProps.updateColumn(idx, e.target.value)
                          }
                          placeholder={`Column ${idx + 1}`}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => editProps.removeColumn(idx)}
                          disabled={editProps.editColumns.length <= 1}
                          className="h-8 w-8 p-0 text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={editProps.addColumn}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Column
                  </Button>
                </div>
              </div>
            </>
          )}

          {field.type === "netPromoterScore" && (
            <>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">
                  Left Label
                </Label>
                <Input
                  value={editProps.editLeftLabel}
                  onChange={(e) => editProps.setEditLeftLabel(e.target.value)}
                  placeholder="Not at all likely"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">
                  Right Label
                </Label>
                <Input
                  value={editProps.editRightLabel}
                  onChange={(e) => editProps.setEditRightLabel(e.target.value)}
                  placeholder="Extremely likely"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">
                  Maximum Score
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={editProps.editMaxScore}
                  onChange={(e) =>
                    editProps.setEditMaxScore(Number.parseInt(e.target.value) || 10)
                  }
                />
              </div>
            </>
          )}

          {field.type === "separator" && (
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </Label>
              <Textarea
                value={editProps.editDescription}
                onChange={(e) => editProps.setEditDescription(e.target.value)}
                placeholder="Enter section description"
                rows={3}
              />
            </div>
          )}

          <div className="flex items-center space-x-2 pt-2">
            <Button onClick={editProps.saveFieldEdit} size="sm">
              Save Changes
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editProps.setEditingField(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div>
            <Label className="text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          </div>

          {/* Preview of the field */}
          {field.type === "input" && (
            <Input
              type={field.inputType}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              disabled
              className="bg-gray-50"
            />
          )}

          {field.type === "selection" && (
            <div className="space-y-2">
              {field.options?.map((option) => (
                <div key={`selection-${field.id}-${option}`} className="flex items-center space-x-2">
                  <input type="radio" name={field.id} disabled />
                  <span className="text-sm text-gray-600">{option}</span>
                </div>
              ))}
            </div>
          )}

          {field.type === "multipleChoice" && (
            <div className="space-y-2">
              {field.options?.map((option) => (
                <div key={`checkbox-${field.id}-${option}`} className="flex items-center space-x-2">
                  <Checkbox disabled />
                  <span className="text-sm text-gray-600">{option}</span>
                </div>
              ))}
              <p className="text-xs text-gray-500">
                Maximum {field.maxChoices} choice(s) allowed
              </p>
            </div>
          )}

          {field.type === "rating" && (
            <div className="space-y-2">
              <div className="flex items-center space-x-1">
                {Array.from({ length: field.maxRating || 5 }).map(
                  (_, idx) => (
                    <Star
                      key={`star-${field.id}-${idx}`}
                      className="w-5 h-5 text-gray-300 fill-current"
                    />
                  )
                )}
              </div>
              {field.showLabels && field.labels && field.labels.length > 0 && (
                <div className="flex justify-between text-xs text-gray-500">
                  {field.labels.map((label) => (
                    <span key={`rating-label-${field.id}-${label}`} className="text-center">
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {field.type === "matrix" && (
            <div className="space-y-2">
              <div className="text-xs text-gray-500">
                {field.rows?.length || 0} rows × {field.columns?.length || 0}{" "}
                columns
              </div>
              <div className="border rounded p-2 bg-gray-50">
                <div className="text-xs text-gray-600">
                  Matrix table with {field.rows?.length || 0} questions and{" "}
                  {field.columns?.length || 0} options
                </div>
              </div>
            </div>
          )}

          {field.type === "netPromoterScore" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{field.leftLabel}</span>
                <span>{field.rightLabel}</span>
              </div>
              <div className="flex items-center space-x-1">
                {Array.from({ length: (field.maxScore || 10) + 1 }).map(
                  (_, idx) => (
                    <div
                      key={`nps-${field.id}-${idx}`}
                      className="w-4 h-4 border border-gray-300 rounded"
                    />
                  )
                )}
              </div>
              <div className="text-xs text-gray-500">
                Scale: 0 to {field.maxScore || 10}
              </div>
            </div>
          )}

          {field.type === "separator" && (
            <div className="border-t-2 border-gray-300 pt-4">
              <h3 className="font-medium text-gray-900">{field.label}</h3>
              {field.description && (
                <p className="text-sm text-gray-600 mt-1">
                  {field.description}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FormBuilder({ mode, formId }: Readonly<FormBuilderProps>) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [showTerms, setShowTerms] = useState(false);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Privacy checkbox settings (mandatory for all forms)
  const [privacyLabel, setPrivacyLabel] = useState(
    "I consent to the processing of my personal data and agree to the "
  );

  // Editing field state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editRequired, setEditRequired] = useState(false);
  const [editInputType, setEditInputType] = useState("text");
  const [editOptions, setEditOptions] = useState<string[]>([""]);
  const [editMaxChoices, setEditMaxChoices] = useState<number>(1);

  // New field types editing state
  const [editMaxRating, setEditMaxRating] = useState<number>(5);
  const [editShowLabels, setEditShowLabels] = useState<boolean>(false);
  const [editLabels, setEditLabels] = useState<string[]>([""]);
  const [editRows, setEditRows] = useState<string[]>([""]);
  const [editColumns, setEditColumns] = useState<string[]>([""]);
  const [editLeftLabel, setEditLeftLabel] =
    useState<string>("Not at all likely");
  const [editRightLabel, setEditRightLabel] =
    useState<string>("Extremely likely");
  const [editMaxScore, setEditMaxScore] = useState<number>(10);
  const [editDescription, setEditDescription] = useState<string>("");

  // Load form data if editing and fetch users
  useEffect(() => {
    fetchUsers();
    if (mode === "edit" && formId) {
      loadFormData();
    }
  }, [mode, formId]);

  // Filter users based on search query and prioritize selected users
  useEffect(() => {
    let filtered = users;

    if (searchQuery.trim() !== "") {
      filtered = users.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort users: selected users first, then unselected users
    const sortedUsers = filtered.toSorted((a, b) => {
      const aSelected = selectedUserIds.includes(a.id);
      const bSelected = selectedUserIds.includes(b.id);

      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });

    setFilteredUsers(sortedUsers);
  }, [users, searchQuery, selectedUserIds]);

  const addUserToSelection = (userId: string) => {
    setSelectedUserIds([...selectedUserIds, userId]);
  };

  const removeUserFromSelection = (userId: string) => {
    setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      try {
        const response = await apiFetch("/api/admin/get-assignable-users", { logoutOn401: false });
        if (response.status === 401) {
          const { signOut } = await import("next-auth/react");
          signOut();
          return;
        }
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadFormData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/forms/${formId}`);
      if (!response.ok) throw new Error("Failed to load form");

      const formData = await response.json();
      setTitle(formData.title);
      setDescription(formData.description || "");

      // Load privacy label if it exists in metadata (or use default)
      setPrivacyLabel(
        formData.privacyLabel ||
          "I consent to the processing of my personal data and agree to the privacy policy"
      );

      // Load assigned users
      if (formData.assignedUsers) {
        setSelectedUserIds(formData.assignedUsers.map((user: User) => user.id));
      }

      // Convert form data to fields
      const loadedFields: FormField[] = [];

      for (const fieldId of formData.sequence) {
        const input = formData.inputs?.find((i: any) => i.id === fieldId);
        const selection = formData.selections?.find(
          (s: any) => s.id === fieldId
        );
        const multipleChoice = formData.multipleChoice?.find(
          (m: any) => m.id === fieldId
        );
        const rating = formData.ratings?.find((r: any) => r.id === fieldId);
        const matrix = formData.matrices?.find((m: any) => m.id === fieldId);
        const netPromoterScore = formData.netPromoterScores?.find(
          (n: any) => n.id === fieldId
        );
        const separator = formData.separators?.find(
          (s: any) => s.id === fieldId
        );

        if (input) {
          loadedFields.push({
            id: input.id,
            type: "input",
            label: input.label || "",
            required: input.required,
            inputType: input.type || "text",
          });
        } else if (selection) {
          loadedFields.push({
            id: selection.id,
            type: "selection",
            label: selection.label || "",
            required: selection.required,
            options: selection.options,
          });
        } else if (multipleChoice) {
          loadedFields.push({
            id: multipleChoice.id,
            type: "multipleChoice",
            label: multipleChoice.label || "",
            required: multipleChoice.required,
            options: multipleChoice.options,
            maxChoices: multipleChoice.maxChoices || 1,
          });
        } else if (rating) {
          loadedFields.push({
            id: rating.id,
            type: "rating",
            label: rating.question || "",
            required: rating.required,
            maxRating: rating.maxRating || 5,
            showLabels: rating.showLabels || false,
            labels: rating.labels || [],
          });
        } else if (matrix) {
          loadedFields.push({
            id: matrix.id,
            type: "matrix",
            label: matrix.title || "",
            required: matrix.required,
            rows: matrix.rows || [],
            columns: matrix.columns || [],
          });
        } else if (netPromoterScore) {
          loadedFields.push({
            id: netPromoterScore.id,
            type: "netPromoterScore",
            label: netPromoterScore.question || "",
            required: netPromoterScore.required,
            leftLabel: netPromoterScore.leftLabel || "Not at all likely",
            rightLabel: netPromoterScore.rightLabel || "Extremely likely",
            maxScore: netPromoterScore.maxScore || 10,
          });
        } else if (separator) {
          loadedFields.push({
            id: separator.id,
            type: "separator",
            label: separator.title || "",
            required: false, // Separators are never required
            description: separator.description || "",
          });
        }
      }

      setFields(loadedFields);
    } catch (error) {
      console.error("Error loading form data:", error);
      toast.error("Failed to load form data");
      router.push("/dashboard?tab=forms");
    } finally {
      setLoading(false);
    }
  };

  const getFieldTypeName = (type: FieldType): string => {
    const typeNames: Record<FieldType, string> = {
      input: "Input",
      selection: "Radio Button",
      multipleChoice: "Checkbox",
      rating: "Star Rating",
      matrix: "Matrix/Table",
      netPromoterScore: "Net Promoter Score",
      separator: "Section Separator",
    };
    return typeNames[type];
  };

  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: Date.now().toString(),
      type,
      label: `New ${getFieldTypeName(type)} Field`,
      required: false,
      ...(type === "input" && { inputType: "text" }),
      ...(type === "selection" && { options: ["Option 1", "Option 2"] }),
      ...(type === "multipleChoice" && {
        options: ["Option 1", "Option 2"],
        maxChoices: 2,
      }),
      ...(type === "rating" && {
        maxRating: 5,
        showLabels: false,
        labels: [],
      }),
      ...(type === "matrix" && {
        rows: ["Question 1"],
        columns: ["Option 1", "Option 2"],
      }),
      ...(type === "netPromoterScore" && {
        leftLabel: "Not at all likely",
        rightLabel: "Extremely likely",
        maxScore: 10,
      }),
      ...(type === "separator" && {
        description: "",
      }),
    };
    setFields([...fields, newField]);
  };

  const removeField = (fieldId: string) => {
    setFields(fields.filter((f) => f.id !== fieldId));
    if (editingField === fieldId) {
      setEditingField(null);
    }
  };

  const startEditField = (field: FormField) => {
    setEditingField(field.id);
    setEditLabel(field.label);
    setEditRequired(field.required);
    setEditInputType(field.inputType || "text");
    setEditOptions(field.options || [""]);
    setEditMaxChoices(field.maxChoices || 1);

    // New field types
    setEditMaxRating(field.maxRating || 5);
    setEditShowLabels(field.showLabels || false);
    setEditLabels(field.labels || [""]);
    setEditRows(field.rows || [""]);
    setEditColumns(field.columns || [""]);
    setEditLeftLabel(field.leftLabel || "Not at all likely");
    setEditRightLabel(field.rightLabel || "Extremely likely");
    setEditMaxScore(field.maxScore || 10);
    setEditDescription(field.description || "");
  };

  const saveFieldEdit = () => {
    if (!editingField) return;

    setFields(
      fields.map((field) => {
        if (field.id === editingField) {
          return {
            ...field,
            label: editLabel,
            required: editRequired,
            ...(field.type === "input" && { inputType: editInputType }),
            ...(field.type === "selection" && {
              options: editOptions.filter((opt) => opt.trim()),
            }),
            ...(field.type === "multipleChoice" && {
              options: editOptions.filter((opt) => opt.trim()),
              maxChoices: editMaxChoices,
            }),
            ...(field.type === "rating" && {
              maxRating: editMaxRating,
              showLabels: editShowLabels,
              labels: editShowLabels
                ? editLabels.filter((label) => label.trim())
                : [],
            }),
            ...(field.type === "matrix" && {
              rows: editRows.filter((row) => row.trim()),
              columns: editColumns.filter((column) => column.trim()),
            }),
            ...(field.type === "netPromoterScore" && {
              leftLabel: editLeftLabel,
              rightLabel: editRightLabel,
              maxScore: editMaxScore,
            }),
            ...(field.type === "separator" && {
              description: editDescription,
            }),
          };
        }
        return field;
      })
    );

    setEditingField(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFields((fields) => {
        const oldIndex = fields.findIndex((field) => field.id === active.id);
        const newIndex = fields.findIndex((field) => field.id === over.id);

        return arrayMove(fields, oldIndex, newIndex);
      });
    }
  };

  const addOption = () => {
    setEditOptions([...editOptions, ""]);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...editOptions];
    newOptions[index] = value;
    setEditOptions(newOptions);
  };

  const removeOption = (index: number) => {
    if (editOptions.length > 1) {
      setEditOptions(editOptions.filter((_, i) => i !== index));
    }
  };

  // Helper functions for new field types
  const addLabel = () => {
    setEditLabels([...editLabels, ""]);
  };

  const updateLabel = (index: number, value: string) => {
    const newLabels = [...editLabels];
    newLabels[index] = value;
    setEditLabels(newLabels);
  };

  const removeLabel = (index: number) => {
    if (editLabels.length > 1) {
      setEditLabels(editLabels.filter((_, i) => i !== index));
    }
  };

  const addRow = () => {
    setEditRows([...editRows, ""]);
  };

  const updateRow = (index: number, value: string) => {
    const newRows = [...editRows];
    newRows[index] = value;
    setEditRows(newRows);
  };

  const removeRow = (index: number) => {
    if (editRows.length > 1) {
      setEditRows(editRows.filter((_, i) => i !== index));
    }
  };

  const addColumn = () => {
    setEditColumns([...editColumns, ""]);
  };

  const updateColumn = (index: number, value: string) => {
    const newColumns = [...editColumns];
    newColumns[index] = value;
    setEditColumns(newColumns);
  };

  const removeColumn = (index: number) => {
    if (editColumns.length > 1) {
      setEditColumns(editColumns.filter((_, i) => i !== index));
    }
  };

  const saveForm = async () => {
    if (!title.trim()) {
      toast.error("Form title is required");
      return;
    }

    if (fields.length === 0) {
      toast.error("At least one field is required");
      return;
    }

    try {
      setSaving(true);

      const formData = {
        title: title.trim(),
        description: description.trim() || null,
        privacyLabel: privacyLabel.trim(),
        assignedUserIds: selectedUserIds,
        fields: fields.map((field) => ({
          type: field.type,
          label: field.label,
          required: field.required,
          ...(field.type === "input" && { inputType: field.inputType }),
          ...(field.type === "selection" && { options: field.options }),
          ...(field.type === "multipleChoice" && {
            options: field.options,
            maxChoices: field.maxChoices,
          }),
          ...(field.type === "rating" && {
            maxRating: field.maxRating,
            showLabels: field.showLabels,
            labels: field.labels,
          }),
          ...(field.type === "matrix" && {
            rows: field.rows,
            columns: field.columns,
          }),
          ...(field.type === "netPromoterScore" && {
            leftLabel: field.leftLabel,
            rightLabel: field.rightLabel,
            maxScore: field.maxScore,
          }),
          ...(field.type === "separator" && {
            description: field.description,
          }),
        })),
      };

      const url =
        mode === "create" ? "/api/admin/forms" : `/api/admin/forms/${formId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save form");
      }

      toast.success(
        `Form ${mode === "create" ? "created" : "updated"} successfully!`
      );
      router.push("/dashboard?tab=forms");
    } catch (error) {
      console.error("Error saving form:", error);
      toast.error(`Failed to ${mode === "create" ? "create" : "update"} form`);
    } finally {
      setSaving(false);
    }
  };

  const toggleTerms = () => {
    setShowTerms(!showTerms);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 overflow-x-hidden">
      {/* Floating Back Button */}
      <button
        onClick={() => router.push("/dashboard?tab=forms")}
        aria-label="Back to Forms"
        className="fixed top-23 left-6 z-30 inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors shadow-sm"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Forms
      </button>
      {/* Floating Save/Update Button (Right) */}
      <button
        onClick={saveForm}
        aria-label="Save Form"
        disabled={saving}
        className="fixed top-23 right-6 z-30 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 border border-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-70"
      >
        <Save className="w-5 h-5 mr-2" />
        {(() => {
          if (saving) return "Saving...";
          return mode === "create" ? "Create Form" : "Update Form";
        })()}
      </button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Settings */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Form Settings</CardTitle>
              <CardDescription>Configure your form details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Form Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter form title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter form description"
                  rows={3}
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Privacy Consent</h3>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      Mandatory Privacy Checkbox
                    </span>
                  </div>
                  <p className="text-xs text-yellow-700 mb-3">
                    This checkbox is automatically added to every form and
                    cannot be removed. Users must check this to submit the form.
                  </p>
                  <div>
                    <Label htmlFor="privacy-label" className="text-sm">
                      Privacy Consent Label
                    </Label>
                    <Textarea
                      id="privacy-label"
                      value={privacyLabel}
                      onChange={(e) => setPrivacyLabel(e.target.value)}
                      placeholder="Enter privacy consent text"
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">User Assignment</h3>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Assign Users to Form
                    </span>
                  </div>
                  <p className="text-xs text-blue-700 mb-3">
                    Select which users can see and fill this form. Leave empty
                    to make it available to all users.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">
                        {selectedUserIds.length} user
                        {selectedUserIds.length === 1 ? "" : "s"} assigned
                      </span>
                      <Dialog
                        open={isUserModalOpen}
                        onOpenChange={setIsUserModalOpen}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Users className="w-4 h-4 mr-2" />
                            Select Users
                          </Button>
                        </DialogTrigger>
                        <DialogContent
                          className="max-w-2xl max-h-[90vh] h-full flex flex-col overflow-y-scroll"
                          showCloseButton={false}
                          onPointerDownOutside={(e) => e.preventDefault()}
                        >
                          <DialogHeader>
                            <DialogTitle className="text-xl font-semibold">
                              Assign Users to Form
                            </DialogTitle>
                          </DialogHeader>

                          <div className="flex-1 space-y-4">
                            {/* Search Bar */}
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <Input
                                placeholder="Search users by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                              />
                            </div>

                            {/* Selected Users Count */}
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <span>
                                {selectedUserIds.length} user
                                {selectedUserIds.length === 1 ? "" : "s"}{" "}
                                selected
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedUserIds([])}
                                className="text-xs"
                              >
                                Clear all
                              </Button>
                            </div>

                            {/* User List */}
                            <div className="border rounded-lg lg:max-h-96 max-h-70 overflow-auto">
                              {usersLoading && (
                                <div className="p-8 flex flex-col items-center justify-center text-gray-500">
                                  {/* Modal-scoped loading */}
                                  <p>Loading users...</p>
                                </div>
                              )}
                              {!usersLoading && filteredUsers.length === 0 && (
                                <div className="p-8 text-center text-gray-500">
                                  <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                  <p>No users found</p>
                                </div>
                              )}
                              {!usersLoading && filteredUsers.length > 0 && (
                                <div className="divide-y">
                                  {filteredUsers.map((user) => (
                                    <label
                                      key={user.id}
                                      htmlFor={`user-${user.id}`}
                                      className="flex items-center space-x-3 p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                    >
                                        <Checkbox
                                          id={`user-${user.id}`}
                                          checked={selectedUserIds.includes(user.id)}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              addUserToSelection(user.id);
                                            } else {
                                              removeUserFromSelection(user.id);
                                            }
                                          }}
                                        />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center space-x-2">
                                            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                            <span className="font-medium text-gray-900">
                                              {user.name || "No name"}
                                            </span>
                                          </div>
                                          <div className="flex items-center space-x-2 mt-1">
                                            <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                            <span className="text-sm text-gray-500 truncate">
                                              {user.email}
                                            </span>
                                          </div>
                                        </div>
                                      </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex justify-end space-x-2 pt-4 border-t">
                            <Button
                              onClick={() => {
                                setIsUserModalOpen(false);
                                setSearchQuery("");
                              }}
                              className="min-w-20"
                            >
                              Done
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsUserModalOpen(false);
                                setSearchQuery("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              </div>

              {/* <>
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">Add Fields</h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      onClick={() => addField("input")}
                      className="w-full justify-start"
                    >
                      <Type className="w-4 h-4 mr-2" />
                      Add Text Input
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => addField("selection")}
                      className="w-full justify-start"
                    >
                      <CircleDot className="w-4 h-4 mr-2" />
                      Add Radio Button
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => addField("multipleChoice")}
                      className="w-full justify-start"
                    >
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Add Checkbox
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => addField("rating")}
                      className="w-full justify-start"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Add Star Rating
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => addField("matrix")}
                      className="w-full justify-start"
                    >
                      <Table className="w-4 h-4 mr-2" />
                      Add Matrix/Table
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => addField("netPromoterScore")}
                      className="w-full justify-start"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Add Net Promoter Score
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => addField("separator")}
                      className="w-full justify-start"
                    >
                      <SeparatorHorizontal className="w-4 h-4 mr-2" />
                      Add Section Separator
                    </Button>
                  </div>
                </div>
              </> */}
            </CardContent>
          </Card>
        </div>

        {/* Form Builder */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{"Form Builder"}</CardTitle>
              {/* <CardDescription>
                {"Drag and drop fields to build your form"}
              </CardDescription> */}
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 min-h-96 bg-gray-50">
                {fields.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="border-t py-4">
                      <h3 className="font-medium mb-3">Add Fields</h3>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          onClick={() => addField("input")}
                          className="w-full justify-start"
                        >
                          <Type className="w-4 h-4 mr-2" />
                          Add Text Input
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => addField("selection")}
                          className="w-full justify-start"
                        >
                          <CircleDot className="w-4 h-4 mr-2" />
                          Add Radio Button
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => addField("multipleChoice")}
                          className="w-full justify-start"
                        >
                          <CheckSquare className="w-4 h-4 mr-2" />
                          Add Checkbox
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => addField("rating")}
                          className="w-full justify-start"
                        >
                          <Star className="w-4 h-4 mr-2" />
                          Add Star Rating
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => addField("matrix")}
                          className="w-full justify-start"
                        >
                          <Table className="w-4 h-4 mr-2" />
                          Add Matrix/Table
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => addField("netPromoterScore")}
                          className="w-full justify-start"
                        >
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Add Net Promoter Score
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => addField("separator")}
                          className="w-full justify-start"
                        >
                          <SeparatorHorizontal className="w-4 h-4 mr-2" />
                          Add Section Separator
                        </Button>
                      </div>
                    </div>
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                      <Plus className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No fields added yet
                    </h3>
                    <p className="text-gray-500">
                      Add fields from the left panel to start building your form
                    </p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="space-y-4">
                      <div className="mb-6 p-4 bg-white rounded-lg border">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2 break-words">
                          {title || "Form Title"}
                        </h2>
                        {description && (
                          <p className="text-gray-600 break-words">{description}</p>
                        )}
                        <div className="border-t pt-4">
                          <h3 className="font-medium mb-3">Add Fields</h3>
                          <div className="space-y-2">
                            <Button
                              variant="outline"
                              onClick={() => addField("input")}
                              className="w-full justify-start"
                            >
                              <Type className="w-4 h-4 mr-2" />
                              Add Text Input
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => addField("selection")}
                              className="w-full justify-start"
                            >
                              <CircleDot className="w-4 h-4 mr-2" />
                              Add Radio Button
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => addField("multipleChoice")}
                              className="w-full justify-start"
                            >
                              <CheckSquare className="w-4 h-4 mr-2" />
                              Add Checkbox
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => addField("rating")}
                              className="w-full justify-start"
                            >
                              <Star className="w-4 h-4 mr-2" />
                              Add Star Rating
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => addField("matrix")}
                              className="w-full justify-start"
                            >
                              <Table className="w-4 h-4 mr-2" />
                              Add Matrix/Table
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => addField("netPromoterScore")}
                              className="w-full justify-start"
                            >
                              <BarChart3 className="w-4 h-4 mr-2" />
                              Add Net Promoter Score
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => addField("separator")}
                              className="w-full justify-start"
                            >
                              <SeparatorHorizontal className="w-4 h-4 mr-2" />
                              Add Section Separator
                            </Button>
                          </div>
                        </div>
                      </div>

                      <SortableContext
                        items={fields.map((field) => field.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-4">
                          {fields.map((field) => (
                            <SortableField
                              key={field.id}
                              field={field}
                              onEdit={startEditField}
                              onRemove={removeField}
                              isEditing={editingField === field.id}
                              editProps={{
                                editLabel,
                                setEditLabel,
                                editRequired,
                                setEditRequired,
                                editInputType,
                                setEditInputType,
                                editOptions,
                                setEditOptions,
                                editMaxChoices,
                                setEditMaxChoices,
                                addOption,
                                updateOption,
                                removeOption,
                                // New field types
                                editMaxRating,
                                setEditMaxRating,
                                editShowLabels,
                                setEditShowLabels,
                                editLabels,
                                setEditLabels,
                                addLabel,
                                updateLabel,
                                removeLabel,
                                editRows,
                                setEditRows,
                                addRow,
                                updateRow,
                                removeRow,
                                editColumns,
                                setEditColumns,
                                addColumn,
                                updateColumn,
                                removeColumn,
                                editLeftLabel,
                                setEditLeftLabel,
                                editRightLabel,
                                setEditRightLabel,
                                editMaxScore,
                                setEditMaxScore,
                                editDescription,
                                setEditDescription,
                                saveFieldEdit,
                                setEditingField,
                              }}
                            />
                          ))}
                        </div>
                      </SortableContext>

                      {/* Mandatory Privacy Checkbox */}
                      <div className="border-2 border-yellow-300 rounded-lg p-4 bg-yellow-50">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                          <div className="flex items-center space-x-2">
                            <Shield className="w-4 h-4 text-yellow-600" />
                            <span className="font-medium text-yellow-800">
                              Privacy Consent (Mandatory)
                            </span>
                            <span className="text-red-500 text-sm">*</span>
                          </div>
                          <Badge variant="secondary" className="hidden md:block md:text-xs md:self-start">
                            Cannot be removed
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-start space-x-2">
                            <Checkbox disabled className="mt-1" />
                            <span className="text-sm text-gray-700 leading-relaxed break-words">
                              {privacyLabel} 
                              <button
                                type="button"
                                onClick={() => setShowTerms(true)}
                                className="text-red-600 hover:underline text-md focus:outline-none ml-1"
                                // className={`${agreedToTerms ? "text-[#007399]" : "text-red-600"} hover:underline focus:outline-none text-sm`}
                              >
                                Privacy Policy
                              </button>
                            </span>
                          </div>
                          <p className="text-xs text-yellow-700 italic">
                            This checkbox must be checked for users to submit
                            the form
                          </p>
                        </div>
                      </div>
                    </div>
                  </DndContext>
                )}
              </div>

              {/* Create/Update Form Button */}
              {/* <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-end">
                  <Button
                    onClick={saveForm}
                    disabled={saving}
                    size="lg"
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-8 py-3"
                  >
                    <Save className="w-5 h-5" />
                    <span>
                      {saving
                        ? "Saving..."
                        : mode === "create"
                          ? "Create Form"
                          : "Update Form"}
                    </span>
                  </Button>
                </div>
              </div> */}
            </CardContent>
          </Card>
        </div>
      </div>
      {showTerms && <ShowTerms toggleTerms={toggleTerms} />}
    </div>
  );
}
