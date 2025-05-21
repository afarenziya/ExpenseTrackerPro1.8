import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export function BulkExpenseUploadButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        // Expecting CSV with headers matching expense fields
        const rows = text.split(/\r?\n/).filter(Boolean);
        const [header, ...lines] = rows;
        const keys = header.split(",").map((k) => k.trim());
        const expenses = lines.map((line) => {
          const values = line.split(",");
          const obj: any = {};
          keys.forEach((k, i) => {
            obj[k] = values[i];
          });
          return obj;
        });
        const res = await fetch("/api/expenses/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ expenses }),
        });
        if (!res.ok) throw new Error("Bulk upload failed");
        toast({ title: "Bulk upload successful" });
        queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      } catch (err) {
        toast({ title: "Bulk upload failed", description: String(err), variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
      >
        Bulk Upload Expenses (CSV)
      </Button>
    </>
  );
}
