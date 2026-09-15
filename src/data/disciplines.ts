export type Discipline = "development" | "3d" | "engineering";

export const DISCIPLINE_ORDER: Discipline[] = [
  "development",
  "3d",
  "engineering",
];

interface DisciplineMeta {
  label: string;
  text: string;
  chip: string;
  dot: string;
}

export const DISCIPLINES: Record<Discipline, DisciplineMeta> = {
  development: {
    label: "Desarrollo",
    text: "text-glow",
    chip: "border-glow/30 bg-glow/10 text-glow",
    dot: "bg-glow",
  },
  "3d": {
    label: "Diseño 3D",
    text: "text-cad",
    chip: "border-cad/30 bg-cad/10 text-cad",
    dot: "bg-cad",
  },
  engineering: {
    label: "Ingeniería",
    text: "text-steel",
    chip: "border-steel/30 bg-steel/10 text-steel",
    dot: "bg-steel",
  },
};

export function sortDisciplines(
  list: Discipline[],
  order: Discipline[] = DISCIPLINE_ORDER,
): Discipline[] {
  return [...list].sort(
    (a, b) => order.indexOf(a) - order.indexOf(b),
  );
}