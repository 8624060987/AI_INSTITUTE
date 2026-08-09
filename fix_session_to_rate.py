import re

def fix():
    with open('src/app/portal/page.tsx', 'r', encoding='utf-8') as f:
        content = f.read()
        
    old = "const [activeTab, setActiveTab] = useState('dashboard');"
    new = "const [activeTab, setActiveTab] = useState('dashboard');\n  const [sessionToRate, setSessionToRate] = useState<any>(null);"
    
    if "setSessionToRate] = useState" not in content:
        content = content.replace(old, new)
        
    with open('src/app/portal/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
        
fix()
print("Fixed sessionToRate!")
