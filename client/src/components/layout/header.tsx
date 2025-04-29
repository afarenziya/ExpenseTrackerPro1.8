import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Menu, Home, DollarSign, PieChart, Tag, Settings, LogOut, UserCheck, Users, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useLocation } from "wouter";

export function Header() {
  const { user, logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();
  
  // Close mobile menu when location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);
  
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Don't show the header on the auth page
  if (location === "/auth" || location.startsWith("/reset-password")) {
    return null;
  }
  
  return (
    <header className="bg-background border-b border-border sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/">
            <div className="text-lg md:text-xl font-bold text-primary hover:text-primary/90 transition-colors cursor-pointer">
              ExpenseTracker Made By Ajay Farenziya
            </div>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {user && (
            <>
              <div className="flex items-center gap-4">
                <Link href="/dashboard">
                  <div>
                    <Button variant="ghost" className="flex items-center gap-1">
                      <Home className="h-4 w-4 mr-1" />
                      Dashboard
                    </Button>
                  </div>
                </Link>
                
                <Link href="/expenses">
                  <div>
                    <Button variant="ghost" className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 mr-1" />
                      Expenses
                    </Button>
                  </div>
                </Link>
                
                <Link href="/categories">
                  <div>
                    <Button variant="ghost" className="flex items-center gap-1">
                      <Tag className="h-4 w-4 mr-1" />
                      Categories
                    </Button>
                  </div>
                </Link>
                
                <Link href="/reports">
                  <div>
                    <Button variant="ghost" className="flex items-center gap-1">
                      <PieChart className="h-4 w-4 mr-1" />
                      Reports
                    </Button>
                  </div>
                </Link>
                
                {user.role === "admin" && (
                  <Link href="/users">
                    <div>
                      <Button variant="ghost" className="flex items-center gap-1">
                        <UserCheck className="h-4 w-4 mr-1" />
                        User Management
                      </Button>
                    </div>
                  </Link>
                )}
                
                <Link href="/settings">
                  <div>
                    <Button variant="ghost" className="flex items-center gap-1">
                      <Settings className="h-4 w-4 mr-1" />
                      Settings
                    </Button>
                  </div>
                </Link>
                
                <Button variant="ghost" onClick={toggleTheme} size="icon">
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                  className="flex items-center gap-1"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </Button>
              </div>
            </>
          )}
        </nav>
        
        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <div className="container mx-auto px-4 py-2 flex flex-col gap-2">
            {user && (
              <>
                <Link href="/dashboard">
                  <div>
                    <Button variant="ghost" className="w-full flex items-center justify-start gap-1">
                      <Home className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </div>
                </Link>
                
                <Link href="/expenses">
                  <div>
                    <Button variant="ghost" className="w-full flex items-center justify-start gap-1">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Expenses
                    </Button>
                  </div>
                </Link>
                
                <Link href="/categories">
                  <div>
                    <Button variant="ghost" className="w-full flex items-center justify-start gap-1">
                      <Tag className="h-4 w-4 mr-2" />
                      Categories
                    </Button>
                  </div>
                </Link>
                
                <Link href="/reports">
                  <div>
                    <Button variant="ghost" className="w-full flex items-center justify-start gap-1">
                      <PieChart className="h-4 w-4 mr-2" />
                      Reports
                    </Button>
                  </div>
                </Link>
                
                {user.role === "admin" && (
                  <Link href="/users">
                    <div>
                      <Button variant="ghost" className="w-full flex items-center justify-start gap-1">
                        <UserCheck className="h-4 w-4 mr-2" />
                        User Management
                      </Button>
                    </div>
                  </Link>
                )}
                
                <Link href="/settings">
                  <div>
                    <Button variant="ghost" className="w-full flex items-center justify-start gap-1">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                  </div>
                </Link>
                
                <div className="flex gap-2 mt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 flex items-center justify-center"
                    onClick={toggleTheme}
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun className="h-4 w-4 mr-2" />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <Moon className="h-4 w-4 mr-2" />
                        Dark Mode
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="flex-1 flex items-center justify-center"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}