"use client";

import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // On the login page, render the raw children without the dashboard layout framework
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Dashboard layout for all other /admin routes
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row font-sans text-slate-100 relative">
      <AdminSidebar />
      <main className="flex-1 p-4 md:p-10 md:pl-8 overflow-y-auto w-full max-w-[100vw]">
        <div className="max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
