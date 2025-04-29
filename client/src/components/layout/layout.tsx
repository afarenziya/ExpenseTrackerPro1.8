import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Footer } from "./footer";

type LayoutProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
};

export function Layout({ children, title, subtitle }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          </div>
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
