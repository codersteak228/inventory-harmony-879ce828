const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  errors?: { field: string; message: string }[];
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    const err = new Error(json.message) as Error & {
      status: number;
      errors?: { field: string; message: string }[];
    };
    err.status = json.statusCode;
    err.errors = json.errors;
    throw err;
  }

  return json;
}

// Auth
export const authApi = {
  login: (body: { loginId: string; password: string }) =>
    request<{ user: User }>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  signup: (body: { loginId: string; email: string; password: string; confirmPassword: string }) =>
    request<null>("/auth/signup", { method: "POST", body: JSON.stringify(body) }),
  logout: () => request<null>("/auth/logout", { method: "POST" }),
  me: () => request<{ user: User }>("/auth/me"),
  pendingUsers: () => request<{ users: User[] }>("/auth/pending-users"),
  approve: (userId: string) => request<null>(`/auth/approve/${userId}`, { method: "PATCH" }),
  reject: (userId: string) => request<null>(`/auth/reject/${userId}`, { method: "PATCH" }),
};

// Warehouses
export const warehouseApi = {
  list: () => request<{ warehouses: Warehouse[] }>("/warehouses"),
  get: (id: string) => request<{ warehouse: Warehouse }>(`/warehouses/${id}`),
  create: (body: Partial<Warehouse>) =>
    request<{ warehouse: Warehouse }>("/warehouses", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Warehouse>) =>
    request<{ warehouse: Warehouse }>(`/warehouses/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: string) => request<null>(`/warehouses/${id}`, { method: "DELETE" }),
};

// Locations
export const locationApi = {
  list: (warehouseId?: string) =>
    request<{ locations: Location[] }>(`/locations${warehouseId ? `?warehouse=${warehouseId}` : ""}`),
  get: (id: string) => request<{ location: Location }>(`/locations/${id}`),
  create: (body: Partial<Location>) =>
    request<{ location: Location }>("/locations", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Location>) =>
    request<{ location: Location }>(`/locations/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: string) => request<null>(`/locations/${id}`, { method: "DELETE" }),
};

// Products
export const productApi = {
  list: () => request<{ products: Product[] }>("/products"),
  get: (id: string) => request<{ product: Product }>(`/products/${id}`),
  create: (body: Partial<Product>) =>
    request<{ product: Product }>("/products", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Product>) =>
    request<{ product: Product }>(`/products/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  updateStock: (id: string, onHand: number) =>
    request<{ product: Product }>(`/products/${id}/stock`, {
      method: "PATCH",
      body: JSON.stringify({ onHand }),
    }),
  delete: (id: string) => request<null>(`/products/${id}`, { method: "DELETE" }),
};

// Operations
export const operationApi = {
  list: (params?: { type?: string; status?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.type) q.set("type", params.type);
    if (params?.status) q.set("status", params.status);
    if (params?.search) q.set("search", params.search);
    const qs = q.toString();
    return request<{ operations: Operation[] }>(`/operations${qs ? `?${qs}` : ""}`);
  },
  get: (id: string) => request<{ operation: Operation; lines: OperationLine[] }>(`/operations/${id}`),
  create: (body: CreateOperationBody) =>
    request<{ operation: Operation; lines: OperationLine[] }>("/operations", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: string, body: Partial<CreateOperationBody>) =>
    request<{ operation: Operation; lines: OperationLine[] }>(`/operations/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  todo: (id: string) =>
    request<{ operation: Operation; lines: OperationLine[] }>(`/operations/${id}/todo`, { method: "PATCH" }),
  validate: (id: string) =>
    request<{ operation: Operation; lines: OperationLine[] }>(`/operations/${id}/validate`, { method: "PATCH" }),
  cancel: (id: string) =>
    request<{ operation: Operation }>(`/operations/${id}/cancel`, { method: "PATCH" }),
};

// Move History
export const moveHistoryApi = {
  list: (params?: { type?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.type) q.set("type", params.type);
    if (params?.search) q.set("search", params.search);
    const qs = q.toString();
    return request<{ history: MoveHistory[] }>(`/move-history${qs ? `?${qs}` : ""}`);
  },
};

// Dashboard
export const dashboardApi = {
  get: () => request<DashboardData>("/dashboard"),
};

// Types
export interface User {
  _id: string;
  loginId: string;
  email: string;
  role: "admin" | "user";
  status?: "pending" | "approved" | "rejected";
  createdAt?: string;
  updatedAt?: string;
}

export interface Warehouse {
  _id: string;
  name: string;
  shortCode: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  _id: string;
  name: string;
  shortCode: string;
  fullCode: string;
  warehouse: { _id: string; name: string; shortCode: string };
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  _id: string;
  name: string;
  skuCode: string;
  unitCost: number;
  onHand: number;
  freeToUse: number;
  minimumStock?: number;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Operation {
  _id: string;
  reference: string;
  type: "IN" | "OUT";
  contact: string;
  scheduleDate: string;
  status: "draft" | "ready" | "waiting" | "done" | "cancelled";
  deliveryAddress?: string;
  responsible: { _id: string; loginId: string; email: string };
  warehouse: { _id: string; name: string; shortCode: string };
  createdAt: string;
  updatedAt: string;
}

export interface OperationLine {
  _id: string;
  operation: string;
  product: {
    _id: string;
    name: string;
    skuCode: string;
    unitCost: number;
    onHand: number;
  };
  quantity: number;
  isShort: boolean;
}

export interface CreateOperationBody {
  type: "IN" | "OUT";
  contact: string;
  scheduleDate: string;
  warehouse: string;
  deliveryAddress?: string;
  lines: { product: string; quantity: number }[];
}

export interface MoveHistory {
  _id: string;
  moveType: "IN" | "OUT";
  quantity: number;
  movedAt: string;
  operation: { _id: string; reference: string; contact: string };
  product: { _id: string; name: string };
  fromLocation: { _id: string; fullCode: string };
  toLocation: { _id: string; fullCode: string };
}

export interface DashboardData {
  receipts: { total: number; late: number; operations: number };
  deliveries: { total: number; late: number; waiting: number; operations: number };
}
