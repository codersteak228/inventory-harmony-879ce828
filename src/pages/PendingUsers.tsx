import { useState, useEffect } from "react";
import { authApi } from "@/lib/api";
import type { User } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PendingUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    try {
      const res = await authApi.pendingUsers();
      setUsers(res.data.users);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id: string) => {
    try {
      await authApi.approve(id);
      toast({ title: "User approved" });
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await authApi.reject(id);
      toast({ title: "User rejected" });
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (loading) return <div className="space-y-6"><h1 className="text-2xl font-semibold tracking-tight">Pending Users</h1><Skeleton className="h-48" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Pending Users</h1>
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left">
              <th className="p-3 font-medium text-muted-foreground">Login ID</th>
              <th className="p-3 font-medium text-muted-foreground">Email</th>
              <th className="p-3 font-medium text-muted-foreground">Requested</th>
              <th className="p-3 font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-border last:border-0">
                  <td className="p-3 font-medium">{u.loginId}</td>
                  <td className="p-3 text-sm">{u.email}</td>
                  <td className="p-3 text-xs text-muted-foreground">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button size="sm" className="h-7" onClick={() => handleApprove(u._id)}>
                        <Check className="mr-1 h-3 w-3" />Approve
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-destructive" onClick={() => handleReject(u._id)}>
                        <X className="mr-1 h-3 w-3" />Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No pending users</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
