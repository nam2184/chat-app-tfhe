import type { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Toggle } from "../ui/toggle";
import { cn } from "~/lib/utils";

export default function ColumnHeaderSortable<_T>({
  children,
  column,
}: {
  children?: React.ReactNode;
  column: Column<_T>;
}) {
  const sortState = column.getIsSorted();
  return (
    <Toggle
      pressed={sortState != false}
      onClick={() => column.toggleSorting(sortState === "asc")}
    >
      {children}
      {/* <ArrowUpDown className={cn("ml-2 h-4 w-4", sortState !== false && "hidden")} /> */}
      <ArrowUp
        className={cn("ml-2 h-4 w-4", sortState !== "desc" && "hidden")}
      />
      <ArrowDown
        className={cn("ml-2 h-4 w-4", sortState !== "asc" && "hidden")}
      />
    </Toggle>
  );
}
