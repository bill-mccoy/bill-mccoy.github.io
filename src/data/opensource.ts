export interface Repo {
  name: string;
  description: string;
  lang: string;
  href: string;
}

export const repos: Repo[] = [
  {
    name: "UniGuard",
    description:
      "Bot de Discord para whitelist en Catolicraft: verifica que solo estudiantes universitarios puedan ingresar al servidor de Minecraft.",
    lang: "Python",
    href: "https://github.com/bill-mccoy/UniGuard",
  },
];