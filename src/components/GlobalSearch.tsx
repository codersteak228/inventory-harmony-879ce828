import { useState, useEffect, useCallback } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { productApi, operationApi, moveHistoryApi } from "@/lib/api";
import type { Product, Operation, MoveHistory } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { Package, FileText, ArrowLeftRight } from "lucide-react";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [moves, setMoves] = useState<MoveHistory[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setProducts([]);
      setOperations([]);
      setMoves([]);
      return;
    }
    try {
      const [pRes, oRes, mRes] = await Promise.all([
        productApi.list(),
        operationApi.list({ search: q }),
        moveHistoryApi.list({ search: q }),
      ]);
      const lq = q.toLowerCase();
      setProducts(
        pRes.data.products.filter(
          (p) => p.name.toLowerCase().includes(lq) || p.skuCode.toLowerCase().includes(lq)
        )
      );
      setOperations(oRes.data.operations);
      setMoves(mRes.data.history);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search products, SKU, receipts, deliveries..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {products.length > 0 && (
          <CommandGroup heading="Products">
            {products.slice(0, 5).map((p) => (
              <CommandItem
                key={p._id}
                onSelect={() => {
                  navigate("/products");
                  setOpen(false);
                }}
              >
                <Package className="mr-2 h-4 w-4" />
                <span>{p.name}</span>
                <span className="ml-auto font-mono text-xs text-muted-foreground">{p.skuCode}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {operations.length > 0 && (
          <CommandGroup heading="Operations">
            {operations.slice(0, 5).map((op) => (
              <CommandItem
                key={op._id}
                onSelect={() => {
                  const path = op.type === "IN" ? "/receipts" : "/delivery-orders";
                  navigate(path);
                  setOpen(false);
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                <span>{op.reference}</span>
                <span className="ml-auto text-xs text-muted-foreground">{op.contact}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {moves.length > 0 && (
          <CommandGroup heading="Stock Movements">
            {moves.slice(0, 5).map((m) => (
              <CommandItem
                key={m._id}
                onSelect={() => {
                  navigate("/stock-ledger");
                  setOpen(false);
                }}
              >
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                <span>{m.product.name}</span>
                <span className="ml-auto font-mono text-xs text-muted-foreground">
                  {m.moveType === "IN" ? "+" : "-"}{m.quantity}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
