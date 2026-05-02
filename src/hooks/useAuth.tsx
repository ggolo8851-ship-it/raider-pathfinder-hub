import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthCtx {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isBlocked: boolean;
  loading: boolean;
}

const Ctx = createContext<AuthCtx>({
  session: null, user: null, isAdmin: false, isBlocked: false, loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        // Defer DB calls
        setTimeout(async () => {
          const email = sess.user.email ?? "";
          const { data: bl } = await supabase
            .from("email_blacklist").select("id").ilike("email", email).maybeSingle();
          if (bl) {
            setIsBlocked(true);
            await supabase.auth.signOut();
            return;
          }
          setIsBlocked(false);
          const { data: roles } = await supabase
            .from("user_roles").select("role").eq("user_id", sess.user.id);
          setIsAdmin(!!roles?.some(r => r.role === "admin"));
        }, 0);
      } else {
        setIsAdmin(false);
        setIsBlocked(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Ctx.Provider value={{ session, user: session?.user ?? null, isAdmin, isBlocked, loading }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
