import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Inbox,
  Search,
  Menu,
  Receipt,
  LogOut,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';
import { getReceipts } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/vendors', label: 'Vendors', icon: Building2 },
  { path: '/inbox', label: 'Inbox', icon: Inbox },
  { path: '/search', label: 'Search', icon: Search },
];

function SidebarContent({ inboxCount }: { inboxCount: number }) {
  const location = useLocation();
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="bg-primary text-primary-foreground p-2 rounded-lg">
            <Receipt className="h-5 w-5" />
          </div>
          <span className="font-semibold text-lg">Fox Valley</span>
        </Link>
      </div>
      
      <Separator />
      
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            
            return (
              <li key={item.path}>
                <Link to={item.path}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className="w-full justify-start gap-3"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {item.path === '/inbox' && inboxCount > 0 && (
                      <span className="ml-auto bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                        {inboxCount}
                      </span>
                    )}
                  </Button>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <Separator />
      
      <div className="p-4">
        <p className="text-xs text-muted-foreground">
          Fox Valley Finance Tracker
        </p>
      </div>
    </div>
  );
}

export function Layout() {
  const [inboxCount, setInboxCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();

  // Fetch inbox count
  useEffect(() => {
    async function fetchInboxCount() {
      try {
        const inboxReceipts = await getReceipts({ status: 'inbox' });
        setInboxCount(inboxReceipts.length);
      } catch (err) {
        console.error('Failed to fetch inbox count:', err);
        setInboxCount(0);
      }
    }

    fetchInboxCount();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-background">
        <SidebarContent inboxCount={inboxCount} />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-50"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent inboxCount={inboxCount} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="border-b px-6 py-4 flex items-center justify-between md:justify-end">
          <h1 className="md:hidden text-lg font-semibold">Fox Valley</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                {user?.email}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
