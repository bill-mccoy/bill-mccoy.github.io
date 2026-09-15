export interface Pillar {
  num: string;
  title: string;
  desc: string;
  accent: "glow" | "cad" | "steel";
}

export const pillars: Pillar[] = [
  {
    num: "01",
    title: "Software",
    desc: "Aplicaciones, bots y automatización con Python y APIs. Código limpio, documentado y listo para producción.",
    accent: "glow",
  },
  {
    num: "02",
    title: "Diseño 3D",
    desc: "Modelado, render y tours virtuales inmersivos con Blender, Revit y krpano. Visualización de espacios que nunca existieron.",
    accent: "cad",
  },
  {
    num: "03",
    title: "Ingeniería",
    desc: "CAD/CAM, estructuras metálicas y dibujo técnico. De la idea en el papel a la pieza construida en el taller.",
    accent: "steel",
  },
];