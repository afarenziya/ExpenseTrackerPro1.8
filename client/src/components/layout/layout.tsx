import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

type LayoutProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
};

export function Layout({ children, title, subtitle }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <Header title={title} subtitle={subtitle} />
        {children}
      </main>
    </div>
  );
}
