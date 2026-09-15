export interface Experience {
  period: string;
  role: string;
  org: string;
  desc: string;
  tags?: string[];
}

export const experiences: Experience[] = [
  {
    period: "2024 — actualidad",
    role: "Diseñador 3D · Desarrollador de tours virtuales",
    org: "TerraWorks",
    desc: "Modelado 3D de interiores y desarrollo de tours virtuales inmersivos: del espacio diseñado en Blender al visor navegable en el navegador.",
    tags: ["Blender", "krpano", "Revit", "AutoCAD"],
  },
  {
    period: "PUCV",
    role: "Ingeniería Mecánica",
    org: "Pontificia Universidad Católica de Valparaíso",
    desc: "Formación orientada a simulación, diseño CAD/CAM y mecánica de sólidos, con trabajo de taller y proyectos multidisciplinarios.",
    tags: ["Simulación", "CAD/CAM", "Ingeniería de sólidos"],
  },
  {
    period: "PUCV",
    role: "Ayudante de dibujo técnico para mecánica",
    org: "Pontificia Universidad Católica de Valparaíso",
    desc: "Docencia y apoyo en taller de dibujo técnico: normalización, vistas, cortes y planimetría de piezas mecánicas entregada a las generaciones siguientes.",
    tags: ["Dibujo técnico", "Planimetría", "Normalización"],
  },
];