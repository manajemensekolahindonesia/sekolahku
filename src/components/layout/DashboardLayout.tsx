import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";
import { cn } from "@/lib/utils";

function DashboardContent() {
  const { isAuthenticated } = useAuth();
  const { collapsed } = useSidebar();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className={cn("flex flex-col min-h-screen transition-all duration-200", collapsed ? "ml-14" : "ml-60")}>
        <DashboardHeader />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <DashboardContent />
    </SidebarProvider>
  );
}
