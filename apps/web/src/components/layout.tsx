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
import { cn } from '@/lib/utils';

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
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
          <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-2.5 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <span className="font-semibold text-lg tracking-tight">Fox Valley</span>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Finance</p>
          </div>
        </Link>
      </div>

      <div className="px-4">
        <Separator />
      </div>

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
                    className={cn(
                      "w-full justify-start gap-3 h-11",
                      isActive && "bg-primary/10 text-primary hover:bg-primary/15"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", isActive && "text-primary")} />
                    <span className="font-medium">{item.label}</span>
                    {item.path === '/inbox' && inboxCount > 0 && (
                      <span className="ml-auto bg-primary text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded-full">
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

      <div className="mt-auto p-4">
        <div className="bg-muted/50 rounded-xl p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Fox Valley Finance Tracker
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            v1.0
          </p>
        </div>
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
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card/50 backdrop-blur-sm">
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
        <header className="border-b bg-card/50 backdrop-blur-sm px-8 py-4 flex items-center justify-between md:justify-end sticky top-0 z-40">
          <h1 className="md:hidden text-lg font-semibold">Fox Valley</h1>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-full">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground truncate max-w-[180px]">
                {user?.email}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
