import { useState, useEffect } from "react";
import { productApi } from "@/lib/api";
import type { Product } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ViewSwitcher, type ViewMode } from "@/components/ViewSwitcher";
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
import { Plus, Pencil, Trash2, AlertTriangle, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", skuCode: "", unitCost: "" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const load = async () => {
    try {
      const res = await productApi.list();
      setProducts(res.data.products);
    } catch (err: any) {
      toast({ title: "Failed to load products", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.skuCode.toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = filtered.filter((p) => p.minimumStock && p.onHand < p.minimumStock);

  const handleCreate = async () => {
    if (!form.name || !form.skuCode || !form.unitCost) return;
    setSaving(true);
    try {
      await productApi.create({
        name: form.name.trim(),
        skuCode: form.skuCode.trim(),
        unitCost: parseFloat(form.unitCost),
      });
      toast({ title: "Product created" });
      setShowCreate(false);
      setForm({ name: "", skuCode: "", unitCost: "" });
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editProduct) return;
    setSaving(true);
    try {
      await productApi.update(editProduct._id, {
        name: form.name.trim(),
        skuCode: form.skuCode.trim(),
        unitCost: parseFloat(form.unitCost),
      });
      toast({ title: "Product updated" });
      setEditProduct(null);
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;
    try {
      await productApi.delete(deleteProduct._id);
      toast({ title: "Product deleted" });
      setDeleteProduct(null);
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const openEdit = (p: Product) => {
    setForm({ name: p.name, skuCode: p.skuCode, unitCost: String(p.unitCost) });
    setEditProduct(p);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <div className="flex items-center gap-3">
          <ViewSwitcher value={view} onChange={setView} />
          <Button onClick={() => { setForm({ name: "", skuCode: "", unitCost: "" }); setShowCreate(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            New Product
          </Button>
        </div>
      </div>

      {/* Low stock alert banner */}
      {lowStock.length > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-status-waiting/30 bg-status-waiting/5 p-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-status-waiting" />
          <span className="font-medium">{lowStock.length} products below minimum stock level</span>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table View */}
      {view === "table" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="p-3 font-medium text-muted-foreground">Name</th>
                    <th className="p-3 font-medium text-muted-foreground">SKU</th>
                    <th className="p-3 font-medium text-muted-foreground">Unit Cost</th>
                    <th className="p-3 font-medium text-muted-foreground">On Hand</th>
                    <th className="p-3 font-medium text-muted-foreground">Free to Use</th>
                    <th className="p-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p._id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="p-3 font-medium">
                        {p.name}
                        {p.minimumStock && p.onHand < p.minimumStock && (
                          <AlertTriangle className="ml-1 inline h-3 w-3 text-status-waiting" />
                        )}
                      </td>
                      <td className="p-3 font-mono text-xs">{p.skuCode}</td>
                      <td className="p-3 font-mono font-tabular">${p.unitCost.toFixed(2)}</td>
                      <td className="p-3 font-mono font-tabular">{p.onHand}</td>
                      <td className="p-3 font-mono font-tabular">{p.freeToUse}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteProduct(p)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          {p.minimumStock && p.onHand < p.minimumStock && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => navigate(`/receipts/new?product=${p._id}&quantity=${(p.minimumStock ?? 0) - p.onHand}`)}
                            >
                              Restock
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No products found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kanban View */}
      {view === "kanban" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <Card key={p._id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">{p.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-1">
                <p className="font-mono text-xs text-muted-foreground">{p.skuCode}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">On Hand</span>
                  <span className="font-mono font-tabular">{p.onHand}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Free</span>
                  <span className="font-mono font-tabular">{p.freeToUse}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cost</span>
                  <span className="font-mono font-tabular">${p.unitCost.toFixed(2)}</span>
                </div>
                {p.minimumStock && p.onHand < p.minimumStock && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-status-waiting">
                    <AlertTriangle className="h-3 w-3" />
                    Low Stock
                  </div>
                )}
                <div className="flex gap-1 pt-2">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteProduct(p)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Calendar View - simplified schedule view */}
      {view === "calendar" && (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              Calendar view displays products by creation date. For scheduled operations, use the Operations pages.
            </p>
            <div className="mt-4 space-y-2">
              {filtered.map((p) => (
                <div key={p._id} className="flex items-center justify-between rounded border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.skuCode}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-tabular">{p.onHand} units</p>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(p.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Product</DialogTitle>
            <DialogDescription>Add a new product to inventory</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label>SKU Code</Label>
              <Input value={form.skuCode} onChange={(e) => setForm((f) => ({ ...f, skuCode: e.target.value }))} maxLength={20} />
            </div>
            <div className="space-y-2">
              <Label>Unit Cost</Label>
              <Input type="number" min="0" step="0.01" value={form.unitCost} onChange={(e) => setForm((f) => ({ ...f, unitCost: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? "Creating..." : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editProduct} onOpenChange={(o) => !o && setEditProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label>SKU Code</Label>
              <Input value={form.skuCode} onChange={(e) => setForm((f) => ({ ...f, skuCode: e.target.value }))} maxLength={20} />
            </div>
            <div className="space-y-2">
              <Label>Unit Cost</Label>
              <Input type="number" min="0" step="0.01" value={form.unitCost} onChange={(e) => setForm((f) => ({ ...f, unitCost: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProduct(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteProduct} onOpenChange={(o) => !o && setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteProduct?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
