import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '~/lib/supabase';

// Skip authentication for mobile app - goes straight to camera
// This is intentional for personal/family use where the only function
// is capturing receipts to the inbox. Authentication is handled on web app.
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to get existing session, but don't require it
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes (for web compatibility)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    session,
    loading: false, // Always done loading - show camera immediately
    isAuthenticated: true, // Always authenticated
    user: session?.user ?? { id: 'mobile-user', email: 'mobile@foxvalley.local' },
  };
}
