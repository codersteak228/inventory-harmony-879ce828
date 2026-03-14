import { useState, useEffect } from "react";
import { operationApi, warehouseApi, productApi } from "@/lib/api";
import type { Operation, Warehouse, Product, OperationLine } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ViewSwitcher, type ViewMode } from "@/components/ViewSwitcher";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search, Check, X, Clock, GripVertical } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useSearchParams } from "react-router-dom";

interface OperationsPageProps {
  type: "IN" | "OUT";
  title: string;
}

const STATUSES = ["draft", "waiting", "ready", "done", "cancelled"] as const;

function DraggableCard({ operation, onAction }: { operation: Operation; onAction: (action: string, op: Operation) => void }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: operation._id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="mb-2 cursor-default border bg-card shadow-sm hover:border-primary/50 transition-colors">
        <CardContent className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="font-mono text-xs font-medium">{operation.reference}</p>
              <p className="mt-1 text-sm">{operation.contact}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {operation.warehouse?.name} • {new Date(operation.scheduleDate).toLocaleDateString()}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div {...listeners} className="cursor-grab">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <StatusBadge status={operation.status} />
            </div>
          </div>
          <div className="mt-2 flex gap-1">
            {operation.status === "draft" && (
              <>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onAction("edit", operation)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onAction("todo", operation)}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onAction("cancel", operation)}>
                  <X className="h-3 w-3" />
                </Button>
              </>
            )}
            {operation.status === "ready" && (
              <>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onAction("validate", operation)}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onAction("cancel", operation)}>
                  <X className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DroppableColumn({
  status,
  operations,
  onAction,
}: {
  status: string;
  operations: Operation[];
  onAction: (action: string, op: Operation) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`min-w-[220px] flex-1 rounded-lg border border-border p-3 transition-colors ${
        isOver ? "bg-accent" : "bg-muted/30"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium capitalize">{status}</h3>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">
          {operations.length}
        </span>
      </div>
      <div className="space-y-0">
        {operations.map((op) => (
          <DraggableCard key={op._id} operation={op} onAction={onAction} />
        ))}
      </div>
    </div>
  );
}

export default function OperationsPage({ type, title }: OperationsPageProps) {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editOp, setEditOp] = useState<Operation | null>(null);
  const [cancelOp, setCancelOp] = useState<Operation | null>(null);
  const [form, setForm] = useState({
    contact: "",
    scheduleDate: "",
    warehouse: "",
    deliveryAddress: "",
    lines: [{ product: "", quantity: "1" }],
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const load = async () => {
    try {
      const [oRes, wRes, pRes] = await Promise.all([
        operationApi.list({ type }),
        warehouseApi.list(),
        productApi.list(),
      ]);
      setOperations(oRes.data.operations);
      setWarehouses(wRes.data.warehouses);
      setProducts(pRes.data.products);
    } catch (err: any) {
      toast({ title: "Failed to load", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [type]);

  // Handle prefilled restock from query params
  useEffect(() => {
    const productId = searchParams.get("product");
    const quantity = searchParams.get("quantity");
    if (productId && type === "IN") {
      setForm((f) => ({
        ...f,
        lines: [{ product: productId, quantity: quantity || "1" }],
      }));
      setShowCreate(true);
    }
  }, [searchParams, type]);

  const filtered = operations.filter((op) => {
    const matchSearch =
      !search ||
      op.reference.toLowerCase().includes(search.toLowerCase()) ||
      op.contact.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || op.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreate = async () => {
    setSaving(true);
    try {
      await operationApi.create({
        type,
        contact: form.contact.trim(),
        scheduleDate: form.scheduleDate,
        warehouse: form.warehouse,
        deliveryAddress: form.deliveryAddress,
        lines: form.lines
          .filter((l) => l.product && parseInt(l.quantity) > 0)
          .map((l) => ({ product: l.product, quantity: parseInt(l.quantity) })),
      });
      toast({ title: "Operation created" });
      setShowCreate(false);
      resetForm();
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editOp) return;
    setSaving(true);
    try {
      await operationApi.update(editOp._id, {
        type,
        contact: form.contact.trim(),
        scheduleDate: form.scheduleDate,
        warehouse: form.warehouse,
        deliveryAddress: form.deliveryAddress,
        lines: form.lines
          .filter((l) => l.product && parseInt(l.quantity) > 0)
          .map((l) => ({ product: l.product, quantity: parseInt(l.quantity) })),
      });
      toast({ title: "Operation updated" });
      setEditOp(null);
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (action: string, op: Operation) => {
    try {
      switch (action) {
        case "todo":
          await operationApi.todo(op._id);
          toast({ title: "Operation confirmed" });
          break;
        case "validate":
          await operationApi.validate(op._id);
          toast({ title: "Operation validated and done" });
          break;
        case "cancel":
          setCancelOp(op);
          return;
        case "edit":
          setForm({
            contact: op.contact,
            scheduleDate: op.scheduleDate.split("T")[0],
            warehouse: op.warehouse._id,
            deliveryAddress: op.deliveryAddress || "",
            lines: [{ product: "", quantity: "1" }],
          });
          // Load lines
          try {
            const detail = await operationApi.get(op._id);
            setForm((f) => ({
              ...f,
              lines: detail.data.lines.map((l) => ({
                product: l.product._id,
                quantity: String(l.quantity),
              })),
            }));
          } catch {}
          setEditOp(op);
          return;
      }
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleCancel = async () => {
    if (!cancelOp) return;
    try {
      await operationApi.cancel(cancelOp._id);
      toast({ title: "Operation cancelled" });
      setCancelOp(null);
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const opId = active.id as string;
    const newStatus = over.id as string;
    const op = operations.find((o) => o._id === opId);
    if (!op || op.status === newStatus) return;

    // Map drag to valid transitions
    if (op.status === "draft" && (newStatus === "ready" || newStatus === "waiting")) {
      await handleAction("todo", op);
    } else if (op.status === "ready" && newStatus === "done") {
      await handleAction("validate", op);
    } else if ((op.status === "draft" || op.status === "ready") && newStatus === "cancelled") {
      setCancelOp(op);
    }
  };

  const resetForm = () => {
    setForm({ contact: "", scheduleDate: "", warehouse: "", deliveryAddress: "", lines: [{ product: "", quantity: "1" }] });
  };

  const addLine = () => setForm((f) => ({ ...f, lines: [...f.lines, { product: "", quantity: "1" }] }));
  const removeLine = (i: number) => setForm((f) => ({ ...f, lines: f.lines.filter((_, idx) => idx !== i) }));
  const updateLine = (i: number, field: string, value: string) =>
    setForm((f) => ({ ...f, lines: f.lines.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)) }));

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
      </div>
    );
  }

  const formDialog = (isEdit: boolean) => (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit" : "Create"} {title.slice(0, -1)}</DialogTitle>
        <DialogDescription>{isEdit ? "Update operation details" : "Create a new operation"}</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        <div className="space-y-2">
          <Label>Contact</Label>
          <Input value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} maxLength={100} />
        </div>
        <div className="space-y-2">
          <Label>Schedule Date</Label>
          <Input type="date" value={form.scheduleDate} onChange={(e) => setForm((f) => ({ ...f, scheduleDate: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Warehouse</Label>
          <Select value={form.warehouse} onValueChange={(v) => setForm((f) => ({ ...f, warehouse: v }))}>
            <SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger>
            <SelectContent>
              {warehouses.map((w) => (
                <SelectItem key={w._id} value={w._id}>{w.name} ({w.shortCode})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {type === "OUT" && (
          <div className="space-y-2">
            <Label>Delivery Address</Label>
            <Input value={form.deliveryAddress} onChange={(e) => setForm((f) => ({ ...f, deliveryAddress: e.target.value }))} maxLength={200} />
          </div>
        )}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Lines</Label>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>Add Line</Button>
          </div>
          {form.lines.map((line, i) => (
            <div key={i} className="flex gap-2 items-end">
              <div className="flex-1">
                <Select value={line.product} onValueChange={(v) => updateLine(i, "product", v)}>
                  <SelectTrigger><SelectValue placeholder="Product" /></SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p._id} value={p._id}>{p.name} ({p.skuCode})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-20">
                <Input type="number" min="1" value={line.quantity} onChange={(e) => updateLine(i, "quantity", e.target.value)} />
              </div>
              {form.lines.length > 1 && (
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => removeLine(i)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => isEdit ? setEditOp(null) : setShowCreate(false)}>Cancel</Button>
        <Button onClick={isEdit ? handleUpdate : handleCreate} disabled={saving}>
          {saving ? "Saving..." : isEdit ? "Update" : "Create"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <div className="flex items-center gap-3">
          <ViewSwitcher value={view} onChange={setView} />
          <Button onClick={() => { resetForm(); setShowCreate(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Create
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table View */}
      {view === "table" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="p-3 font-medium text-muted-foreground">Reference</th>
                    <th className="p-3 font-medium text-muted-foreground">Contact</th>
                    <th className="p-3 font-medium text-muted-foreground">Warehouse</th>
                    <th className="p-3 font-medium text-muted-foreground">Scheduled</th>
                    <th className="p-3 font-medium text-muted-foreground">Status</th>
                    <th className="p-3 font-medium text-muted-foreground">User</th>
                    <th className="p-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((op) => (
                    <tr key={op._id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="p-3 font-mono text-xs">{op.reference}</td>
                      <td className="p-3">{op.contact}</td>
                      <td className="p-3 text-xs">{op.warehouse?.name}</td>
                      <td className="p-3 font-mono text-xs">{new Date(op.scheduleDate).toLocaleDateString()}</td>
                      <td className="p-3"><StatusBadge status={op.status} /></td>
                      <td className="p-3 text-xs">{op.responsible?.loginId}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          {op.status === "draft" && (
                            <>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleAction("edit", op)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleAction("todo", op)}>
                                Confirm
                              </Button>
                            </>
                          )}
                          {op.status === "ready" && (
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleAction("validate", op)}>
                              Validate
                            </Button>
                          )}
                          {(op.status === "draft" || op.status === "ready") && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleAction("cancel", op)}>
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No operations found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kanban View */}
      {view === "kanban" && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STATUSES.map((status) => (
              <DroppableColumn
                key={status}
                status={status}
                operations={filtered.filter((op) => op.status === status)}
                onAction={handleAction}
              />
            ))}
          </div>
        </DndContext>
      )}

      {/* Calendar View */}
      {view === "calendar" && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              {filtered
                .sort((a, b) => new Date(a.scheduleDate).getTime() - new Date(b.scheduleDate).getTime())
                .map((op) => (
                  <div key={op._id} className="flex items-center justify-between rounded border border-border p-3">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <p className="text-lg font-semibold font-mono font-tabular">
                          {new Date(op.scheduleDate).getDate()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(op.scheduleDate).toLocaleDateString("en-US", { month: "short" })}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-sm">{op.reference}</p>
                        <p className="text-xs text-muted-foreground">{op.contact} • {op.warehouse?.name}</p>
                      </div>
                    </div>
                    <StatusBadge status={op.status} />
                  </div>
                ))}
              {filtered.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No scheduled operations</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>{formDialog(false)}</Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editOp} onOpenChange={(o) => !o && setEditOp(null)}>{formDialog(true)}</Dialog>

      {/* Cancel Confirmation */}
      <AlertDialog open={!!cancelOp} onOpenChange={(o) => !o && setCancelOp(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Operation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel "{cancelOp?.reference}"? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep it</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Cancel Operation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
