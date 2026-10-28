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
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var saved=JSON.parse(localStorage.getItem('orquestria-storage-v1')||'null');if(saved&&saved.state&&saved.state.theme==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();` }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
