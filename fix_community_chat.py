import re

def fix_context():
    with open('src/context/DatabaseContext.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Change sort order for community_posts
    content = content.replace(
        ".order('created_at', { ascending: false });",
        ".order('created_at', { ascending: true });",
        1 # Only replace the first occurrence (which is community_posts)
    )

    # 2. Change optimistic insertion to append at end
    content = content.replace(
        "return [newPost, ...prev];",
        "return [...prev, newPost];"
    )
    content = content.replace(
        "setCommunityPosts([newPost, ...communityPosts]);",
        "setCommunityPosts([...communityPosts, newPost]);"
    )

    with open('src/context/DatabaseContext.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

fix_context()
