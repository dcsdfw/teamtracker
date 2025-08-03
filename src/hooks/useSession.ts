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
    let mounted = true; // Prevent state updates if component unmounted

    // Get initial session
    const getInitialSession = async () => {
      try {
        setLoading(true);
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!mounted) return; // Component unmounted, don't update state
        
        if (currentSession?.user) {
          // Get user profile to determine role
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', currentSession.user.id)
            .single();

          if (mounted) {
            setSession({
              user: currentSession.user,
              role: profile?.role
            });
          }
        } else {
          if (mounted) {
            setSession(null);
          }
        }
      } catch (error) {
        console.error('Error getting session:', error);
        if (mounted) {
          setSession(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state changed:', event, currentSession?.user?.id);
        
        if (!mounted) return; // Component unmounted, don't update state
        
        setLoading(true); // Set loading true when auth changes
        
        try {
          if (currentSession?.user) {
            // Get user profile to determine role
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', currentSession.user.id)
              .single();

            if (mounted) {
              setSession({
                user: currentSession.user,
                role: profile?.role || 'cleaner' // Default role if profile fetch fails
              });
            }
          } else {
            if (mounted) {
              setSession(null);
            }
          }
        } catch (error) {
          console.error('Error getting profile on auth change:', error);
          if (mounted && currentSession?.user) {
            // Still set session even if profile fetch fails
            setSession({
              user: currentSession.user,
              role: 'cleaner' // Default role
            });
          } else if (mounted) {
            setSession(null);
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false; // Prevent state updates after cleanup
      subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}