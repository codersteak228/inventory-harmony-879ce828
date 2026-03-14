import { useState, useEffect } from "react";
import { warehouseApi } from "@/lib/api";
import type { Warehouse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<Warehouse | null>(null);
  const [deleteItem, setDeleteItem] = useState<Warehouse | null>(null);
  const [form, setForm] = useState({ name: "", shortCode: "", address: "" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    try {
      const res = await warehouseApi.list();
      setWarehouses(res.data.warehouses);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await warehouseApi.create({ name: form.name.trim(), shortCode: form.shortCode.trim(), address: form.address.trim() });
      toast({ title: "Warehouse created" });
      setShowCreate(false);
      setForm({ name: "", shortCode: "", address: "" });
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleEdit = async () => {
    if (!editItem) return;
    setSaving(true);
    try {
      await warehouseApi.update(editItem._id, { name: form.name.trim(), shortCode: form.shortCode.trim(), address: form.address.trim() });
      toast({ title: "Warehouse updated" });
      setEditItem(null);
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await warehouseApi.delete(deleteItem._id);
      toast({ title: "Warehouse deleted" });
      setDeleteItem(null);
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (loading) return <div className="space-y-6"><h1 className="text-2xl font-semibold tracking-tight">Warehouses</h1><Skeleton className="h-48" /></div>;

  const formContent = (
    <div className="space-y-4">
      <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} maxLength={100} /></div>
      <div className="space-y-2"><Label>Short Code (2-5 chars)</Label><Input value={form.shortCode} onChange={(e) => setForm(f => ({ ...f, shortCode: e.target.value }))} maxLength={5} /></div>
      <div className="space-y-2"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} maxLength={200} /></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Warehouses</h1>
        <Button onClick={() => { setForm({ name: "", shortCode: "", address: "" }); setShowCreate(true); }}>
          <Plus className="mr-2 h-4 w-4" />New Warehouse
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left">
              <th className="p-3 font-medium text-muted-foreground">Name</th>
              <th className="p-3 font-medium text-muted-foreground">Code</th>
              <th className="p-3 font-medium text-muted-foreground">Address</th>
              <th className="p-3 font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody>
              {warehouses.map((w) => (
                <tr key={w._id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="p-3 font-medium">{w.name}</td>
                  <td className="p-3 font-mono text-xs">{w.shortCode}</td>
                  <td className="p-3 text-sm text-muted-foreground">{w.address || "—"}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setForm({ name: w.name, shortCode: w.shortCode, address: w.address || "" }); setEditItem(w); }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteItem(w)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {warehouses.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No warehouses</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent><DialogHeader><DialogTitle>Create Warehouse</DialogTitle></DialogHeader>{formContent}
          <DialogFooter><Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button><Button onClick={handleCreate} disabled={saving}>{saving ? "Creating..." : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>Edit Warehouse</DialogTitle></DialogHeader>{formContent}
          <DialogFooter><Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button><Button onClick={handleEdit} disabled={saving}>{saving ? "Saving..." : "Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Warehouse</AlertDialogTitle>
          <AlertDialogDescription>Delete "{deleteItem?.name}"? This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
