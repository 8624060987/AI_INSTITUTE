import re

def fix_ui():
    with open('src/app/portal/page.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    start_pattern = r"\(\(\) => \{\n\s*const filtered = communityPosts"
    end_pattern = r"\}\)\(\)"
    
    match = re.search(start_pattern, content)
    if not match:
        print("Start pattern not found")
        return
        
    start_idx = match.start()
    
    # find the `})()` after start_idx
    end_idx = content.find("})()", start_idx)
    if end_idx == -1:
        print("End pattern not found")
        return
        
    replacement_jsx = r"""(() => {
                        const filtered = communityPosts.filter(p => p.channelId === activeChannel && p.courseId === activeCourseId);
                        const grouped: { [key: string]: typeof filtered } = {};
                        filtered.forEach(post => {
                          const d = new Date(post.createdAt);
                          const dateKey = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                          if(!grouped[dateKey]) grouped[dateKey] = [];
                          grouped[dateKey].push(post);
                        });
                        return Object.entries(grouped).map(([date, posts]) => (
                          <div key={date} className="space-y-4">
                            <div className="flex justify-center my-6">
                              <span className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] rounded-lg font-medium shadow-sm">{date}</span>
                            </div>
                            {posts.map(post => {
                              const isMe = post.userId === currentUser?.id;
                              return (
                                <div key={post.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group mb-4`}>
                                  <span className="text-[10px] text-slate-400 mb-1 px-1 flex items-center gap-2">
                                    {isMe ? (
                                      <>
                                        <span className="text-[8px] uppercase font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">{post.userRole}</span>
                                        {post.userName}
                                      </>
                                    ) : (
                                      <>
                                        {post.userName}
                                        <span className="text-[8px] uppercase font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">{post.userRole}</span>
                                      </>
                                    )}
                                  </span>
                                  <div className={`flex gap-3 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end`}>
                                    <img src={post.userAvatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 mb-1 shadow-sm" />
                                    <div className={`p-3 text-sm relative ${isMe ? 'bg-[#005c4b] dark:bg-blue-600 text-white rounded-2xl rounded-br-sm shadow-md' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl rounded-bl-sm border border-slate-100 dark:border-slate-800/50 shadow-sm'}`}>
                                      <p className="whitespace-pre-line leading-relaxed text-[13px]">{post.content}</p>
                                      
                                      {post.imageUrl && (
                                        <img src={post.imageUrl} alt="" className="w-64 max-h-48 object-cover rounded-xl mt-2 border border-black/10" />
                                      )}
                                      
                                      <div className={`flex items-center gap-2 mt-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <span className={`text-[9px] ${isMe ? 'text-white/70' : 'text-slate-400'}`}>
                                          {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>

                                      {/* Reactions & Actions below bubble */}
                                      <div className={`flex flex-wrap gap-1.5 mt-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        {post.reactions?.map((rx, rIdx) => (
                                          <button
                                            key={rIdx}
                                            onClick={() => reactToPost(post.id, rx.emoji)}
                                            className={`flex items-center gap-1 bg-black/5 dark:bg-white/5 border ${rx.users.includes(currentUser?.id || '') ? 'border-blue-500 text-blue-500' : 'border-transparent text-current'} px-2 py-0.5 rounded-full text-[10px] transition-all`}
                                          >
                                            <span>{rx.emoji}</span>
                                            <span>{rx.count}</span>
                                          </button>
                                        ))}
                                        
                                        <button
                                          onClick={() => reactToPost(post.id, '??')}
                                          className={`text-[10px] opacity-0 group-hover:opacity-100 transition-all cursor-pointer ${isMe ? 'text-white hover:text-red-300' : 'text-slate-400 hover:text-red-500'}`}
                                        >
                                          + React
                                        </button>

                                        {(currentUser?.role === 'admin' || currentUser?.role === 'mentor') && (
                                          <div className="flex gap-2 text-[10px] opacity-0 group-hover:opacity-100 transition-all ml-2">
                                            <button onClick={() => pinCommunityPost(post.id)} className="text-amber-500 hover:underline">Pin</button>
                                            <button onClick={() => deleteCommunityPost(post.id)} className="text-rose-500 hover:underline">Delete</button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ));
                      })()"""

    new_content = content[:start_idx] + replacement_jsx + content[end_idx+4:]
    
    with open('src/app/portal/page.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("UI updated.")

fix_ui()
