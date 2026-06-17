import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import * as Icons from "lucide-react";
import { getRoles } from "../utils/roleLoader";

export const Navbar: React.FC = () => {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const roles = getRoles();

  // Load and apply theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("portfolio_theme") as "light" | "dark" | null;
    const initialTheme = savedTheme || "dark";
    setTheme(initialTheme);
    
    if (initialTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("portfolio_theme", nextTheme);
    if (nextTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  };

  const isActive = (path: string) => location.pathname === path;

  // Helper to render Lucide icons dynamically
  const DynamicIcon = ({ name, className = "w-4 h-4" }: { name: string; className?: string }) => {
    const IconComponent = (Icons as any)[name] || Icons.User;
    return <IconComponent className={className} />;
  };

  return (
    <nav className="sticky top-0 z-50 w-full px-6 py-4 glass-nav transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-foreground">
          <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent inline-block pb-1">
            Pranil Belge
          </span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground px-2 py-0.5 rounded-full border border-border">
            Portfolio
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              isActive("/") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Home
          </Link>

          {/* Dynamic Profiles List */}
          <div className="relative group">
            <button className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer">
              Roles <Icons.ChevronDown className="w-3.5 h-3.5" />
            </button>
            <div className="absolute top-full right-1/2 translate-x-1/2 mt-2 w-56 rounded-xl glass border border-border shadow-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              {roles.map((role) => (
                <Link
                  key={role.id}
                  to={`/role/${role.id}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-primary/10 hover:text-primary ${
                    isActive(`/role/${role.id}`) ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
                  }`}
                >
                  <DynamicIcon name={role.roleIcon} className="w-4 h-4 text-purple-400" />
                  <span>{role.title}</span>
                </Link>
              ))}
            </div>
          </div>

          <Link
            to="/recruiter"
            className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5 ${
              isActive("/recruiter") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icons.Briefcase className="w-4 h-4" /> Recruiter Mode
          </Link>

          <Link
            to="/admin"
            className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5 ${
              isActive("/admin") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icons.Settings className="w-4 h-4" /> Admin
          </Link>
        </div>

        {/* Theme Toggle & Mobile Menu */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-border hover:bg-secondary/40 text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Icons.Sun className="w-4 h-4" /> : <Icons.Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg border border-border hover:bg-secondary/40 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {isOpen ? <Icons.X className="w-5 h-5" /> : <Icons.Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden mt-4 rounded-xl glass border border-border p-4 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className={`text-sm font-medium py-1.5 border-b border-border/40 ${
              isActive("/") ? "text-primary font-bold" : "text-muted-foreground"
            }`}
          >
            Home
          </Link>

          <div className="flex flex-col gap-2.5">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Career Roles
            </span>
            {roles.map((role) => (
              <Link
                key={role.id}
                to={`/role/${role.id}`}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 py-1.5 text-sm ${
                  isActive(`/role/${role.id}`) ? "text-primary font-bold" : "text-muted-foreground"
                }`}
              >
                <DynamicIcon name={role.roleIcon} className="w-4 h-4 text-purple-400" />
                <span>{role.title}</span>
              </Link>
            ))}
          </div>

          <Link
            to="/recruiter"
            onClick={() => setIsOpen(false)}
            className={`text-sm font-medium py-1.5 border-t border-border/40 flex items-center gap-2 ${
              isActive("/recruiter") ? "text-primary font-bold" : "text-muted-foreground"
            }`}
          >
            <Icons.Briefcase className="w-4 h-4 text-purple-400" /> Recruiter Mode
          </Link>

          <Link
            to="/admin"
            onClick={() => setIsOpen(false)}
            className={`text-sm font-medium py-1.5 border-t border-border/40 flex items-center gap-2 ${
              isActive("/admin") ? "text-primary font-bold" : "text-muted-foreground"
            }`}
          >
            <Icons.Settings className="w-4 h-4 text-purple-400" /> Admin Panel
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
