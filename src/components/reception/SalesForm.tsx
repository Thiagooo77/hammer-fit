import * as React from "react";
import { Button } from "@/components/ui/button";

export function SalesForm() {
  return (
    <div className="p-4 border rounded-lg bg-card/50 border-primary/20">
      <h4 className="font-bold mb-4">Nova Venda (Placeholder)</h4>
      <div className="space-y-4">
        <div className="h-10 bg-secondary/50 rounded animate-pulse" />
        <div className="h-10 bg-secondary/50 rounded animate-pulse" />
        <Button className="w-full">Registrar</Button>
      </div>
    </div>
  );
}
