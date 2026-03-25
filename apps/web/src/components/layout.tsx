import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Inbox,
  Search,
  Menu,
  Home,
  LogOut,
  User,
  FileText,
  Download
} from 'lucide-react';
import { getReceipts, generateCSVReceipts, downloadCSV } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/vendors', label: 'Vendors', icon: Building2 },
  { path: '/documents', label: 'Documents', icon: FileText },
  { path: '/inbox', label: 'Inbox', icon: Inbox },
  { path: '/search', label: 'Search', icon: Search },
];

function SidebarContent({ inboxCount, user, onLogout }: { inboxCount: number; user: { email?: string } | null; onLogout: () => void }) {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
          <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-2.5 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
            <Home className="h-5 w-5" />
          </div>
          <span className="font-semibold text-lg tracking-tight">Fox Valley Tracker</span>
        </Link>
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

      {/* Profile Section */}
      <div className="mt-auto p-4">
        <Popover>
          <PopoverTrigger>
            <div className="w-full flex items-center gap-3 h-auto p-3 bg-muted/50 rounded-xl hover:bg-muted cursor-pointer transition-colors">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Fox Valley Tracker
                </p>
                <p className="text-[10px] text-muted-foreground/60 truncate">
                  v1.0
                </p>
              </div>
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                <span className="text-xs">⋯</span>
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-64 p-0">
            <div className="p-4 border-b">
              <p className="text-sm font-medium truncate">{user?.email || 'Guest'}</p>
              <p className="text-xs text-muted-foreground">Signed in</p>
            </div>
            <div className="p-2 space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3"
                onClick={async () => {
                  try {
                    const receipts = await getReceipts();
                    const csv = generateCSVReceipts(receipts);
                    downloadCSV(csv, `receipts-export-${new Date().toISOString().split('T')[0]}.csv`);
                  } catch (err) {
                    console.error('Export failed:', err);
                    alert('Failed to export receipts');
                  }
                }}
              >
                <Download className="h-4 w-4" />
                Export Receipts
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={onLogout}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </PopoverContent>
        </Popover>
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
        <SidebarContent inboxCount={inboxCount} user={user} onLogout={handleLogout} />
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
          <SidebarContent inboxCount={inboxCount} user={user} onLogout={handleLogout} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="border-b bg-card/50 backdrop-blur-sm px-8 py-4 flex items-center justify-between md:justify-end sticky top-0 z-40">
          <h1 className="md:hidden text-lg font-semibold">Fox Valley</h1>
        </header>

        <div className="flex-1 p-8 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
