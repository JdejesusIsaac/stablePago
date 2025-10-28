"use client";

import { useAuth } from "@crossmint/client-sdk-react-ui";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/landing");
  };

  return (
    <button
      className="w-full rounded-md border bg-gray-50 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
      onClick={handleLogout}
    >
      Log out
    </button>
  );
}
