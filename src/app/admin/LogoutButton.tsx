"use client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  
  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center w-full gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors"
    >
      <LogOut size={20} />
      Sign Out
    </button>
  );
}
