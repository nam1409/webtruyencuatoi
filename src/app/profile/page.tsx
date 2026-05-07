import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/actions/settings";
import { Navbar } from "@/components/layout/Navbar";
import { redirect } from "next/navigation";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const settings = await getSiteSettings();

  if (!authUser) {
    redirect("/login");
  }

  // Fetch full profile with role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single();
  
  const user = profile ? { ...authUser, ...profile } : authUser;

  const primaryColor = settings?.primary_color || "#8b5cf6";

  return (
    <div className="flex flex-col min-h-screen bg-background" style={{ "--primary": primaryColor } as any}>
      <Navbar user={user} settings={settings} />
      
      <main className="flex-1">
        <ProfileForm initialProfile={user} />
      </main>

      <footer className="py-12 border-t border-border bg-accent/30 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">© 2026 {settings?.site_name || "ZenStory"} Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
