"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      setError("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="max-w-md w-full p-8 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30 transform rotate-3">
            <Lock className="w-10 h-10 text-white transform -rotate-3" />
          </div>
          <h1 className="text-3xl font-extrabold dark:text-white mb-2">Admin Portal</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium tracking-wide">Secure access to the CMS</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-200 dark:border-red-800/50 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all duration-300"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {isLoading ? "Authenticating..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
