import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      status: {
        draft: "bg-status-draft text-status-draft-foreground",
        waiting: "bg-status-waiting text-status-waiting-foreground",
        ready: "bg-status-ready text-status-ready-foreground",
        done: "bg-status-done text-status-done-foreground",
        cancelled: "bg-status-cancelled text-status-cancelled-foreground",
      },
    },
    defaultVariants: {
      status: "draft",
    },
  }
);

interface StatusBadgeProps {
  status: "draft" | "waiting" | "ready" | "done" | "cancelled";
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ status }), className)}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
