import type { ReactNode } from "react";
import type { Section } from "./AppLayout";

type IconName = Section | "logout" | "menu" | "close";

const paths: Record<IconName, ReactNode> = {
  inicio: (
    <>
      <path d="M3 10.8 12 3l9 7.8" />
      <path d="M5.5 9.5V21h13V9.5M9 21v-7h6v7" />
    </>
  ),
  alumnos: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  clases: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <path d="M8 2v4M16 2v4M3 9h18M8 13h3M8 17h3M14 13h2" />
    </>
  ),
  pagos: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M2.5 10h19M6.5 15h3" />
    </>
  ),
  examenes: (
    <>
      <path d="m12 3 8 4-8 4-8-4 8-4Z" />
      <path d="M7 9.5V15c0 1.7 2.2 3 5 3s5-1.3 5-3V9.5M20 7v6" />
    </>
  ),
  calendario: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M8 2v4M16 2v4M3 9h18M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01" />
    </>
  ),
  reportes: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
  configuracion: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1 1.55V21h-4v-.08a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3v-4h.08a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3h4v.08a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.55 1H21v4h-.08a1.7 1.7 0 0 0-1.52 1Z" />
    </>
  ),
  logout: (
    <>
      <path d="M10 17l5-5-5-5M15 12H3M15 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
};

export function NavIcon({ name }: { name: IconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
