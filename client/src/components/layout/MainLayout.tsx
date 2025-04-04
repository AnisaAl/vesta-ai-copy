import React from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Home, 
  User, 
  TrendingUp, 
  ShoppingBag,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const navItems = [
    { 
      href: '/', 
      label: 'Chat', 
      icon: <Home className="w-4 h-4 mr-2" /> 
    },
    { 
      href: '/profile', 
      label: 'User Profile', 
      icon: <User className="w-4 h-4 mr-2" /> 
    },
    { 
      href: '/recommendations', 
      label: 'Recommendations', 
      icon: <ShoppingBag className="w-4 h-4 mr-2" /> 
    },
    { 
      href: '/trends', 
      label: 'Trends', 
      icon: <TrendingUp className="w-4 h-4 mr-2" /> 
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main navigation header */}
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent flex items-center cursor-pointer">
                Fashion AI
              </span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <nav className="hidden md:flex space-x-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <span className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium flex items-center cursor-pointer",
                    location === item.href
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/70 hover:bg-muted hover:text-foreground"
                  )}>
                    {item.icon}
                    {item.label}
                  </span>
                </Link>
              ))}
            </nav>
          )}
          
          {/* Mobile menu button */}
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
        </div>
        
        {/* Mobile Navigation */}
        {isMobile && mobileMenuOpen && (
          <nav className="bg-background border-b py-2">
            <div className="container mx-auto px-4 flex flex-col space-y-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <span 
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium flex items-center cursor-pointer",
                      location === item.href
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/70 hover:bg-muted hover:text-foreground"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.icon}
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>
      
      {/* Main content */}
      <main className="flex-1 bg-background">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-background border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Fashion AI Companion. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}