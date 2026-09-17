const formateurFcfa = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

export function formaterFcfa(montant: number): string {
  return `${formateurFcfa.format(montant)} FCFA`;
}

const formateurDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export function formaterDate(iso: string): string {
  return formateurDate.format(new Date(iso));
}

const formateurDateHeure = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formaterDateHeure(iso: string): string {
  return formateurDateHeure.format(new Date(iso));
}
