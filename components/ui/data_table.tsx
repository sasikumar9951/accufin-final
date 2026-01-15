"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  placeholder?: string
  searchKey?: string
  showColumnToggle?: boolean
  // When true, the search input will filter across all visible/filterable columns
  searchAllColumns?: boolean
  // Optional explicit list of column ids to include in global search
  globalSearchColumns?: string[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
  placeholder = "Filter...",
  searchKey,
  showColumnToggle = true,
  searchAllColumns = false,
  globalSearchColumns,
}: Readonly<DataTableProps<TData, TValue>>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalSearch, setGlobalSearch] = React.useState("")

  const searchableColumnIds = React.useMemo(() => {
    if (globalSearchColumns && globalSearchColumns.length > 0) return globalSearchColumns
    // default to columns with accessorKey or id
    return (columns as any[])
      .map((c) => {
        if (typeof c?.accessorKey === "string") {
          return c.accessorKey as string
        }
        if (typeof c?.id === "string") {
          return c.id as string
        }
        return undefined
      })
      .filter((id): id is string => !!id)
  }, [columns, globalSearchColumns])

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalSearch,
    globalFilterFn: (row, filterValue) => {
      const query = String(filterValue ?? "").toLowerCase()
      if (!query) return true
      // OR across chosen columns; ignore columnId param
      for (const id of searchableColumnIds) {
        const v = row.getValue<any>(id)
        if (v === undefined || v === null) continue
        const s = String(v).toLowerCase()
        if (s.includes(query)) return true
      }
      return false
    },
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter: globalSearch,
    },
  })

  const renderSearchInput = () => {
    if (searchAllColumns) {
      return (
        <Input
          placeholder={placeholder}
          value={globalSearch}
          onChange={(event) => {
            const value = event.target.value
            setGlobalSearch(value)
            table.setGlobalFilter(value)
          }}
          className="max-w-sm"
        />
      )
    }
    if (searchKey) {
      return (
        <Input
          placeholder={placeholder}
          value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn(searchKey)?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      )
    }
    return null
  }

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        {renderSearchInput()}
        {showColumnToggle ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full table-auto">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <th key={header.id} className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-gray-50/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-3 px-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center py-8">
                  No results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div> */}
    </div>
  )
}

// Optional demo columns for quick usage in playgrounds
export type DemoPayment = {
  id: string
  amount: number
  status: "pending" | "processing" | "success" | "failed"
  email: string
}

export const demoColumns: ColumnDef<DemoPayment>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <div className="capitalize">{row.getValue("status")}</div>,
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Email
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue("amount"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
]

export function DataTableDemo() {
  const data: DemoPayment[] = React.useMemo(
    () => [
      { id: "m5gr84i9", amount: 316, status: "success", email: "ken99@example.com" },
      { id: "3u1reuv4", amount: 242, status: "success", email: "Abe45@example.com" },
      { id: "derv1ws0", amount: 837, status: "processing", email: "Monserrat44@example.com" },
      { id: "5kma53ae", amount: 874, status: "success", email: "Silas22@example.com" },
      { id: "bhqecj4p", amount: 721, status: "failed", email: "carmella@example.com" },
    ],
    []
  )
  return <DataTable columns={demoColumns} data={data} searchKey="email" placeholder="Filter emails..." />
}
