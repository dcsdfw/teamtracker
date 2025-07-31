import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import type { User } from '@supabase/supabase-js';

interface Session {
  user: User | null;
  role?: string;
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession?.user) {
          // Get user profile to determine role
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', currentSession.user.id)
            .single();

          setSession({
            user: currentSession.user,
            role: profile?.role
          });
        } else {
          setSession(null);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (currentSession?.user) {
          try {
            // Get user profile to determine role
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', currentSession.user.id)
              .single();

            setSession({
              user: currentSession.user,
              role: profile?.role
            });
          } catch (error) {
            console.error('Error getting profile:', error);
            setSession({
              user: currentSession.user,
              role: undefined
            });
          }
        } else {
          setSession(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { session, loading };
} 