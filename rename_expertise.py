import re

def update_page():
    with open('src/app/portal/page.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # Change Label
    old_label = """<label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Expertise</label>"""
    new_label = """<label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Subject / Expertise</label>"""
    content = content.replace(old_label, new_label)
    
    # Change Placeholder
    old_placeholder = """placeholder="e.g. AI, React, Python"
                                  />"""
    new_placeholder = """placeholder="e.g. Mathematics, AI, Physics"
                                  />"""
    content = content.replace(old_placeholder, new_placeholder)

    with open('src/app/portal/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

update_page()
print("Renamed Expertise to Subject!")
