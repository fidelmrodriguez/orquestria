import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/app/Providers/Providers";

export const metadata: Metadata = {
  title: "Orquestria",
  description: "Plataforma de gestão de tarefas, projetos e colaboração para equipes."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
