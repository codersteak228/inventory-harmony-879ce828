import { useState, useEffect } from "react";
import { dashboardApi, productApi, operationApi, moveHistoryApi } from "@/lib/api";
import type { DashboardData, Product, Operation, MoveHistory } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  TrendingUp,
  Package,
  Clock,
} from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

const PIE_COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(142, 71%, 45%)",
  "hsl(45, 93%, 47%)",
  "hsl(0, 84%, 60%)",
  "hsl(280, 65%, 60%)",
];

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [moves, setMoves] = useState<MoveHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const [dRes, pRes, oRes, mRes] = await Promise.all([
          dashboardApi.get(),
          productApi.list(),
          operationApi.list(),
          moveHistoryApi.list(),
        ]);
        setDashboard(dRes.data);
        setProducts(pRes.data.products);
        setOperations(oRes.data.operations);
        setMoves(mRes.data.history);
      } catch (err: any) {
        toast({ title: "Failed to load dashboard", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [toast]);

  const lowStockProducts = products.filter(
    (p) => p.minimumStock && p.onHand < p.minimumStock
  );

  // Build trend data from move history
  const trendData = buildTrendData(moves);

  // Stock by category
  const categoryData = buildCategoryData(products);

  // Warehouse distribution from operations
  const warehouseData = buildWarehouseData(operations, products);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Inventory Overview</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-ready/10">
              <ArrowDownToLine className="h-5 w-5 text-status-ready" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Receipts Ready</p>
              <p className="text-2xl font-semibold font-mono font-tabular">
                {dashboard?.receipts.operations ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-done/10">
              <ArrowUpFromLine className="h-5 w-5 text-status-done" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Deliveries Ready</p>
              <p className="text-2xl font-semibold font-mono font-tabular">
                {dashboard?.deliveries.operations ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-cancelled/10">
              <Clock className="h-5 w-5 text-status-cancelled" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Late Operations</p>
              <p className="text-2xl font-semibold font-mono font-tabular">
                {(dashboard?.receipts.late ?? 0) + (dashboard?.deliveries.late ?? 0)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-waiting/10">
              <AlertTriangle className="h-5 w-5 text-status-waiting" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Waiting (Stock Short)</p>
              <p className="text-2xl font-semibold font-mono font-tabular">
                {dashboard?.deliveries.waiting ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Inventory Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Inventory Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="in"
                  stackId="1"
                  stroke="hsl(142, 71%, 45%)"
                  fill="hsl(142, 71%, 45%)"
                  fillOpacity={0.1}
                  name="Incoming"
                />
                <Area
                  type="monotone"
                  dataKey="out"
                  stackId="2"
                  stroke="hsl(0, 84%, 60%)"
                  fill="hsl(0, 84%, 60%)"
                  fillOpacity={0.1}
                  name="Outgoing"
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stock by Category */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Stock Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                  label={(entry) => entry.name}
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Warehouse Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Stock per Warehouse</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={warehouseData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="stock" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Low Stock Alerts</CardTitle>
            {lowStockProducts.length > 0 && (
              <StatusBadge status="cancelled" className="text-[10px]" />
            )}
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                <Package className="mr-2 h-4 w-4" />
                All stock levels are healthy
              </div>
            ) : (
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {lowStockProducts.map((p) => (
                    <div
                      key={p._id}
                      className="flex items-center justify-between rounded-md border border-border bg-card p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Available: <span className="font-mono font-tabular">{p.onHand}</span> / Min:{" "}
                          <span className="font-mono font-tabular">{p.minimumStock}</span>
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigate(`/receipts/new?product=${p._id}&quantity=${(p.minimumStock ?? 0) - p.onHand}`)
                        }
                      >
                        Restock
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Operations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Reference</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Contact</th>
                  <th className="pb-2 font-medium">Scheduled</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">User</th>
                </tr>
              </thead>
              <tbody>
                {operations.slice(0, 10).map((op) => (
                  <tr key={op._id} className="border-b border-border last:border-0">
                    <td className="py-2 font-mono text-xs">{op.reference}</td>
                    <td className="py-2">
                      <span className={op.type === "IN" ? "text-status-done" : "text-status-cancelled"}>
                        {op.type === "IN" ? "Receipt" : "Delivery"}
                      </span>
                    </td>
                    <td className="py-2">{op.contact}</td>
                    <td className="py-2 font-mono text-xs">
                      {new Date(op.scheduleDate).toLocaleDateString()}
                    </td>
                    <td className="py-2">
                      <StatusBadge status={op.status} />
                    </td>
                    <td className="py-2 text-xs">{op.responsible?.loginId}</td>
                  </tr>
                ))}
                {operations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No operations yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function buildTrendData(moves: MoveHistory[]) {
  const map = new Map<string, { in: number; out: number }>();
  moves.forEach((m) => {
    const d = new Date(m.movedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const entry = map.get(d) || { in: 0, out: 0 };
    if (m.moveType === "IN") entry.in += m.quantity;
    else entry.out += m.quantity;
    map.set(d, entry);
  });
  return Array.from(map.entries())
    .map(([date, v]) => ({ date, ...v }))
    .slice(-14);
}

function buildCategoryData(products: Product[]) {
  const map = new Map<string, number>();
  products.forEach((p) => {
    const cat = p.category || "Uncategorized";
    map.set(cat, (map.get(cat) || 0) + p.onHand);
  });
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

function buildWarehouseData(operations: Operation[], _products: Product[]) {
  const map = new Map<string, number>();
  operations
    .filter((o) => o.status === "done")
    .forEach((o) => {
      const name = o.warehouse?.name || "Unknown";
      map.set(name, (map.get(name) || 0) + 1);
    });
  if (map.size === 0) return [{ name: "No data", stock: 0 }];
  return Array.from(map.entries()).map(([name, stock]) => ({ name, stock }));
}
