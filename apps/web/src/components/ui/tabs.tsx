"use client";

import { useState, type ReactNode } from "react";

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

export function Tabs({ items, defaultId }: { items: TabItem[]; defaultId?: string }) {
  const [actif, setActif] = useState(defaultId ?? items[0]?.id);
  const onglet = items.find((i) => i.id === actif);

  return (
    <div>
      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-border">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === actif}
            onClick={() => setActif(item.id)}
            className={`-mb-px shrink-0 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors ${
              item.id === actif ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="pt-5">
        {onglet?.content}
      </div>
    </div>
  );
}
