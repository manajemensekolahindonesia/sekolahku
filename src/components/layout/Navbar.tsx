import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AvatarDropdown } from "@/components/auth/AvatarDropdown";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { GraduationCap } from "lucide-react";

export default function Navbar() {
  const { isAuthenticated } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-gray-900">
            <GraduationCap className="w-7 h-7 text-primary" />
            SekolahKu
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#fitur" className="hover:text-primary transition-colors">Fitur</a>
            <a href="#harga" className="hover:text-primary transition-colors">Harga</a>
            <a href="#pembayaran" className="hover:text-primary transition-colors">Pembayaran</a>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <AvatarDropdown />
            ) : (
              <GoogleLoginButton />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
