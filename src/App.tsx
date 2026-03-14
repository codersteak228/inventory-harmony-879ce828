import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import LoginPage from "@/pages/Login";
import SignupPage from "@/pages/Signup";
import DashboardPage from "@/pages/Dashboard";
import ProductsPage from "@/pages/Products";
import OperationsPage from "@/pages/OperationsPage";
import StockLedgerPage from "@/pages/StockLedger";
import WarehousesPage from "@/pages/Warehouses";
import LocationsPage from "@/pages/Locations";
import PendingUsersPage from "@/pages/PendingUsers";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/receipts" element={<OperationsPage type="IN" title="Receipts" />} />
              <Route path="/receipts/new" element={<OperationsPage type="IN" title="Receipts" />} />
              <Route path="/delivery-orders" element={<OperationsPage type="OUT" title="Delivery Orders" />} />
              <Route path="/internal-transfers" element={<OperationsPage type="IN" title="Internal Transfers" />} />
              <Route path="/stock-ledger" element={<StockLedgerPage />} />
              <Route path="/warehouses" element={<WarehousesPage />} />
              <Route path="/locations" element={<LocationsPage />} />
              <Route path="/pending-users" element={<PendingUsersPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
