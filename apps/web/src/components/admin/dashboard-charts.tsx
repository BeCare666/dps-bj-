"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface PointStatutReservation {
  statut: string;
  nombre: number;
  couleur: string;
}

export interface PointCatalogue {
  categorie: string;
  actives: number;
  inactives: number;
}

export function ReservationsParStatutChart({ donnees }: { donnees: PointStatutReservation[] }) {
  const total = donnees.reduce((s, d) => s + d.nombre, 0);
  if (total === 0) {
    return <p className="flex h-64 items-center justify-center text-sm text-text-muted">Aucune réservation pour l'instant.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={donnees}
          dataKey="nombre"
          nameKey="statut"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={2}
          strokeWidth={0}
        >
          {donnees.map((d) => (
            <Cell key={d.statut} fill={d.couleur} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: 10,
            border: "1px solid #e3e8f0",
            fontSize: 13,
            fontFamily: "var(--font-body)",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function CatalogueChart({ donnees }: { donnees: PointCatalogue[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={donnees} barGap={6}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e3e8f0" vertical={false} />
        <XAxis dataKey="categorie" tick={{ fontSize: 12, fill: "#5b6472" }} axisLine={{ stroke: "#e3e8f0" }} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#5b6472" }} axisLine={false} tickLine={false} width={28} />
        <Tooltip
          contentStyle={{
            borderRadius: 10,
            border: "1px solid #e3e8f0",
            fontSize: 13,
            fontFamily: "var(--font-body)",
          }}
        />
        <Bar dataKey="actives" name="Actives" fill="#1657cc" radius={[6, 6, 0, 0]} />
        <Bar dataKey="inactives" name="Inactives" fill="#e3e8f0" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
