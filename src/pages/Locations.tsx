import { useState, useEffect } from "react";
import { locationApi, warehouseApi } from "@/lib/api";
import type { Location, Warehouse } from "@/lib/api";
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<Location | null>(null);
  const [deleteItem, setDeleteItem] = useState<Location | null>(null);
  const [form, setForm] = useState({ name: "", shortCode: "", warehouse: "" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    try {
      const [lRes, wRes] = await Promise.all([locationApi.list(), warehouseApi.list()]);
      setLocations(lRes.data.locations);
      setWarehouses(wRes.data.warehouses);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await locationApi.create({ name: form.name.trim(), shortCode: form.shortCode.trim(), warehouse: form.warehouse as any });
      toast({ title: "Location created" });
      setShowCreate(false);
      setForm({ name: "", shortCode: "", warehouse: "" });
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleEdit = async () => {
    if (!editItem) return;
    setSaving(true);
    try {
      await locationApi.update(editItem._id, { name: form.name.trim(), shortCode: form.shortCode.trim(), warehouse: form.warehouse as any });
      toast({ title: "Location updated" });
      setEditItem(null);
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await locationApi.delete(deleteItem._id);
      toast({ title: "Location deleted" });
      setDeleteItem(null);
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (loading) return <div className="space-y-6"><h1 className="text-2xl font-semibold tracking-tight">Locations</h1><Skeleton className="h-48" /></div>;

  const formContent = (
    <div className="space-y-4">
      <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} maxLength={100} /></div>
      <div className="space-y-2"><Label>Short Code</Label><Input value={form.shortCode} onChange={(e) => setForm(f => ({ ...f, shortCode: e.target.value }))} maxLength={20} /></div>
      <div className="space-y-2">
        <Label>Warehouse</Label>
        <Select value={form.warehouse} onValueChange={(v) => setForm(f => ({ ...f, warehouse: v }))}>
          <SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger>
          <SelectContent>
            {warehouses.map((w) => <SelectItem key={w._id} value={w._id}>{w.name} ({w.shortCode})</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Locations</h1>
        <Button onClick={() => { setForm({ name: "", shortCode: "", warehouse: "" }); setShowCreate(true); }}>
          <Plus className="mr-2 h-4 w-4" />New Location
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left">
              <th className="p-3 font-medium text-muted-foreground">Name</th>
              <th className="p-3 font-medium text-muted-foreground">Full Code</th>
              <th className="p-3 font-medium text-muted-foreground">Warehouse</th>
              <th className="p-3 font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody>
              {locations.map((l) => (
                <tr key={l._id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="p-3 font-medium">{l.name}</td>
                  <td className="p-3 font-mono text-xs">{l.fullCode}</td>
                  <td className="p-3 text-sm">{l.warehouse?.name}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setForm({ name: l.name, shortCode: l.shortCode, warehouse: l.warehouse._id }); setEditItem(l); }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteItem(l)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {locations.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No locations</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent><DialogHeader><DialogTitle>Create Location</DialogTitle></DialogHeader>{formContent}
          <DialogFooter><Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button><Button onClick={handleCreate} disabled={saving}>{saving ? "Creating..." : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>Edit Location</DialogTitle></DialogHeader>{formContent}
          <DialogFooter><Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button><Button onClick={handleEdit} disabled={saving}>{saving ? "Saving..." : "Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Location</AlertDialogTitle>
          <AlertDialogDescription>Delete "{deleteItem?.name}"? This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
