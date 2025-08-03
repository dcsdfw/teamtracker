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
    let mounted = true;
    console.log('🚀 useSession effect started');

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔄 Getting initial session...');
        setLoading(true);
        
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log('📡 Initial session response:', currentSession?.user?.id || 'no user');
        
        if (!mounted) {
          console.log('⚠️ Component unmounted during initial session fetch');
          return;
        }
        
        if (currentSession?.user) {
          console.log('👤 User found, getting role from metadata...');
          
          // Get role from user metadata instead of database query
          const role = currentSession.user.user_metadata?.role || 'cleaner';
          console.log('📋 Role from metadata:', role);

          if (mounted) {
            setSession({
              user: currentSession.user,
              role: role
            });
            console.log('✅ Session set with role:', role);
          }
        } else {
          console.log('❌ No user session found');
          if (mounted) {
            setSession(null);
          }
        }
      } catch (error) {
        console.error('💥 Error getting initial session:', error);
        if (mounted) {
          setSession(null);
        }
      } finally {
        if (mounted) {
          console.log('🏁 Initial session loading complete');
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('🔄 Auth state changed:', event, currentSession?.user?.id || 'no user');
        
        if (!mounted) {
          console.log('⚠️ Component unmounted during auth state change');
          return;
        }
        
        setLoading(true);
        
        try {
          if (currentSession?.user) {
            console.log('👤 Auth change: User found, getting role from metadata...');
            
            // Get role from user metadata instead of database query
            const role = currentSession.user.user_metadata?.role || 'cleaner';
            console.log('📋 Auth change role from metadata:', role);

            if (mounted) {
              setSession({
                user: currentSession.user,
                role: role
              });
              console.log('✅ Auth change: Session updated with role:', role);
            }
          } else {
            console.log('❌ Auth change: No user');
            if (mounted) {
              setSession(null);
            }
          }
        } catch (error) {
          console.error('💥 Error on auth change:', error);
          if (mounted && currentSession?.user) {
            setSession({
              user: currentSession.user,
              role: 'cleaner'
            });
          } else if (mounted) {
            setSession(null);
          }
        } finally {
          if (mounted) {
            console.log('🏁 Auth change loading complete');
            setLoading(false);
          }
        }
      }
    );

    return () => {
      console.log('🧹 useSession cleanup');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  console.log('🔍 useSession current state:', { loading, hasUser: !!session?.user, role: session?.role });

  return { session, loading };
}