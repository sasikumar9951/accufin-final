import FileBrowser from "@/app/_component/FileBrowser";
import { ManagedFile } from "@/types/files";

type Folder = {
  id: string;
  name: string;
};

type ClipboardItem = {
  id: string;
  name: string;
  type: "file" | "folder";
  parentFolderId: string | null;
};

type ArchiveTabProps = {
  readonly archivedFiles: ManagedFile[];
  readonly folders: Folder[];
  readonly isLoading: boolean;
  readonly currentFolderId: string | null;
  readonly onFolderChange: (folderId: string | null) => void;
  readonly onFileUnarchive: (fileId: string) => void;
  readonly onFolderUnarchive?: (folderId: string) => void;
  readonly onDeleteFile?: (fileId: string) => void;
  readonly breadcrumbPath: { id: string; name: string }[];
  readonly onRefresh?: () => void | Promise<void>;
  readonly isRefreshing?: boolean;
  // Clipboard props
  readonly clipboardItems?: ClipboardItem[];
  readonly clipboardOperation?: "copy" | "cut" | null;
  readonly onCopyItems?: (items: ClipboardItem[]) => void;
  readonly onCutItems?: (items: ClipboardItem[]) => void;
  readonly onPasteItems?: (targetFolderId: string | null) => void;
  readonly onClearClipboard?: () => void;
  readonly selectedItemsForClipboard?: string[];
  readonly onToggleItemSelection?: (itemId: string, itemType: "file" | "folder") => void;
  readonly onSelectAllItems?: () => void;
  readonly onClearSelection?: () => void;
  readonly showClipboardActions?: boolean;
  readonly isPasting?: boolean;
};

export default function ArchiveTab({
  archivedFiles,
  folders,
  isLoading,
  currentFolderId,
  onFolderChange,
  onFileUnarchive,
  onFolderUnarchive,
  onDeleteFile,
  breadcrumbPath,
  onRefresh,
  isRefreshing,
  // Clipboard props
  clipboardItems = [],
  clipboardOperation = null,
  onCopyItems,
  onCutItems,
  onPasteItems,
  onClearClipboard,
  selectedItemsForClipboard = [],
  onToggleItemSelection,
  onSelectAllItems,
  onClearSelection,
  showClipboardActions = false,
  isPasting = false,
}: ArchiveTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center rounded-md bg-cyan-600 p-2 text-white shadow hover:bg-cyan-700 disabled:opacity-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-3.51-7.07" />
            <polyline points="22 3 21 7 17 6" />
          </svg>
        </button>
      </div>
      <FileBrowser
        files={archivedFiles}
        folders={folders}
        isLoading={isLoading}
        currentFolderId={currentFolderId}
        onFolderChange={onFolderChange}
        breadcrumbPath={breadcrumbPath}
        onRefresh={onRefresh}
        onFileUnarchive={onFileUnarchive}
        onFolderUnarchive={onFolderUnarchive}
        onDeleteFile={onDeleteFile}
        isRefreshing={isRefreshing}
        // Read-only mode for most actions
        showUploadButton={false}
        showAddFolderButton={false}
        showUploadFolderButton={false}
        isUploading={false}
        handleFileSelect={() => {}}
        handleFileUpload={() => {}}
        selectedFiles={[]}
        onRemoveSelectedFile={() => {}}
        theme="archive"
        // Clipboard props
        clipboardItems={clipboardItems}
        clipboardOperation={clipboardOperation}
        onCopyItems={onCopyItems}
        onCutItems={onCutItems}
        onPasteItems={onPasteItems}
        onClearClipboard={onClearClipboard}
        selectedItemsForClipboard={selectedItemsForClipboard}
        onToggleItemSelection={onToggleItemSelection}
        onSelectAllItems={onSelectAllItems}
        onClearSelection={onClearSelection}
        showClipboardActions={showClipboardActions}
        isPasting={isPasting}
      />
    </div>
  );
}
