import { useState, useEffect } from "react";
import { moveHistoryApi, productApi, warehouseApi } from "@/lib/api";
import type { MoveHistory } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function StockLedgerPage() {
  const [history, setHistory] = useState<MoveHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 20;
  const { toast } = useToast();

  const load = async () => {
    try {
      const params: { type?: string; search?: string } = {};
      if (typeFilter !== "all") params.type = typeFilter;
      if (search.trim()) params.search = search.trim();
      const res = await moveHistoryApi.list(params);
      setHistory(res.data.history);
    } catch (err: any) {
      toast({ title: "Failed to load ledger", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [search, typeFilter]);

  const paginated = history.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(history.length / perPage);

  const exportCSV = () => {
    const headers = ["Date", "Product", "Move Type", "Quantity", "From", "To", "Reference"];
    const rows = history.map((m) => [
      new Date(m.movedAt).toISOString(),
      m.product.name,
      m.moveType,
      m.quantity,
      m.fromLocation?.fullCode || "",
      m.toLocation?.fullCode || "",
      m.operation?.reference || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stock-ledger.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported" });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Stock Ledger</h1>
        <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Stock Ledger</h1>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by reference or contact..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="IN">Incoming</SelectItem>
            <SelectItem value="OUT">Outgoing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="p-3 font-medium text-muted-foreground">Date</th>
                  <th className="p-3 font-medium text-muted-foreground">Product</th>
                  <th className="p-3 font-medium text-muted-foreground">Type</th>
                  <th className="p-3 font-medium text-muted-foreground">From</th>
                  <th className="p-3 font-medium text-muted-foreground">To</th>
                  <th className="p-3 font-medium text-muted-foreground">Quantity</th>
                  <th className="p-3 font-medium text-muted-foreground">Reference</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((m) => (
                  <tr
                    key={m._id}
                    className={`border-b border-border last:border-0 transition-colors ${
                      m.moveType === "IN" ? "hover:bg-status-done/5" : "hover:bg-status-cancelled/5"
                    }`}
                  >
                    <td className="p-3 font-mono text-xs">{new Date(m.movedAt).toLocaleString()}</td>
                    <td className="p-3">{m.product.name}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
                          m.moveType === "IN"
                            ? "bg-status-done/10 text-status-done"
                            : "bg-status-cancelled/10 text-status-cancelled"
                        }`}
                      >
                        {m.moveType}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-xs">{m.fromLocation?.fullCode || "—"}</td>
                    <td className="p-3 font-mono text-xs">{m.toLocation?.fullCode || "—"}</td>
                    <td className="p-3 font-mono font-tabular">
                      <span className={m.moveType === "IN" ? "text-status-done" : "text-status-cancelled"}>
                        {m.moveType === "IN" ? "+" : "-"}{m.quantity}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-xs">{m.operation?.reference}</td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No movements found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, history.length)} of {history.length}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
