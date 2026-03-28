import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export async function Topbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email ?? "";
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <header className="h-14 border-b border-border flex items-center justify-end px-6 gap-3 bg-card">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-xs bg-primary/20 text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm text-muted-foreground">{email}</span>
      <form action={logout}>
        <Button variant="ghost" size="icon" type="submit" title="Cerrar sesión">
          <LogOut className="h-4 w-4" />
        </Button>
      </form>
    </header>
  );
}
