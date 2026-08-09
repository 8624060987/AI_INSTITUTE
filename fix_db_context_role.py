import re

with open("src/context/DatabaseContext.tsx", "r", encoding="utf-8") as f:
    content = f.read()

pattern = r"const { data: { subscription } } = supabase\.auth\.onAuthStateChange\(async \(event, session\) => \{(.*?)\} \);\s*return \(\) => \{"
replacement = r"""const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const oauthRole = localStorage.getItem('oauth_role');
          if (oauthRole) {
            // Force the role to what they clicked (mentor or student)
            await supabase.from('profiles').update({ role: oauthRole }).eq('id', session.user.id);
            localStorage.removeItem('oauth_role');
          }
        }\1} );

      return () => {"""

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open("src/context/DatabaseContext.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated DatabaseContext.tsx for oauth_role hook")
