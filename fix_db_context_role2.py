import re

with open("src/context/DatabaseContext.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_code = """      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (cleanupFn) {"""

new_code = """      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const oauthRole = localStorage.getItem('oauth_role');
          if (oauthRole) {
            await supabase.from('profiles').update({ role: oauthRole }).eq('id', session.user.id);
            localStorage.removeItem('oauth_role');
          }
        }
        if (cleanupFn) {"""

if old_code in content:
    content = content.replace(old_code, new_code)
    with open("src/context/DatabaseContext.tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("Successfully injected SIGNED_IN logic")
else:
    print("Could not find the target code to replace")
