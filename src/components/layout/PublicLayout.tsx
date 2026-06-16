import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-white pt-16">
      <Navbar />
      <Outlet />
    </div>
  );
}
