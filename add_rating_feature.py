import re

def update_context():
    with open('src/context/DatabaseContext.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # Add mentorId to interface
    content = content.replace("mentorName: string;", "mentorName: string;\n  mentorId?: string;")
    
    # Add rateMentor to context interface
    content = content.replace("sendLiveChatMessage: (sessionId: string, message: string) => Promise<void>;", "sendLiveChatMessage: (sessionId: string, message: string) => Promise<void>;\n  rateMentor: (mentorId: string, rating: number) => Promise<void>;")

    # In createLiveSession
    content = content.replace(
        "platform: 'in_app',",
        "mentorId: currentUser.id,\n        platform: 'in_app',"
    )
    
    # In fetching liveSessions
    content = content.replace(
        "courseId: s.course_id,",
        "courseId: s.course_id,\n            mentorId: s.mentor_id,"
    )
    
    # Add rateMentor function implementation
    rate_mentor_func = """
  const rateMentor = async (mentorId: string, rating: number) => {
    const supabase = createClient();
    try {
      await supabase.rpc('rate_mentor', { p_mentor_id: mentorId, p_rating: rating });
    } catch(err) {
      console.error("Failed to rate mentor", err);
    }
  };
"""
    # Insert before sendLiveChatMessage
    content = content.replace("const sendLiveChatMessage = async", rate_mentor_func + "\n  const sendLiveChatMessage = async")
    
    # Add rateMentor to context value
    content = content.replace("sendLiveChatMessage,", "sendLiveChatMessage,\n        rateMentor,")
    
    with open('src/context/DatabaseContext.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

def update_page():
    with open('src/app/portal/page.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Destructure rateMentor
    content = content.replace("sendLiveChatMessage,", "sendLiveChatMessage,\n      rateMentor,")
    
    # 2. Add state
    content = content.replace("const [activeLiveSessionId, setActiveLiveSessionId] = useState", "const [sessionToRate, setSessionToRate] = useState<any>(null);\n    const [ratingValue, setRatingValue] = useState(0);\n    const [isSubmittingRating, setIsSubmittingRating] = useState(false);\n    const [activeLiveSessionId, setActiveLiveSessionId] = useState")

    # 3. Add useEffect to catch completed sessions
    use_effect_code = """
    // Monitor session completion
    useEffect(() => {
      if (activeLiveSessionId && currentUser?.role === 'student') {
        const session = liveSessions.find(s => s.id === activeLiveSessionId);
        if (session && session.status === 'completed') {
          setSessionToRate(session);
          setActiveLiveSessionId(null);
        }
      }
    }, [liveSessions, activeLiveSessionId, currentUser]);
"""
    content = content.replace("const currentXP = currentUserLeaderboard?.xp || 0;", use_effect_code + "\n    const currentXP = currentUserLeaderboard?.xp || 0;")

    # 4. Update "Leave Session" button
    leave_button_old = """<button 
                  onClick={() => setActiveLiveSessionId(null)}
                  className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl font-bold text-sm shadow-md transition-all text-white"
                >
                  Leave Session
                </button>"""
    leave_button_new = """<button 
                  onClick={() => {
                    if (currentUser?.role === 'student') setSessionToRate(activeSession);
                    setActiveLiveSessionId(null);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl font-bold text-sm shadow-md transition-all text-white"
                >
                  Leave Session
                </button>"""
    content = content.replace(leave_button_old, leave_button_new)

    # 5. Add Modal JSX
    modal_jsx = """

      {/* RATING MODAL */}
      {sessionToRate && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
          <div className="bg-[#0f1420] border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                <Star className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Rate Your Experience</h2>
              <p className="text-slate-400 text-sm">
                How was the live session hosted by <strong className="text-white">{sessionToRate.mentorName}</strong>?
              </p>
            </div>
            
            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRatingValue(star)}
                  onMouseEnter={(e) => {
                    const stars = e.currentTarget.parentElement?.children;
                    if(stars) {
                      for(let i=0; i<stars.length; i++) {
                        if(i < star) stars[i].classList.add('text-amber-400', 'fill-amber-400');
                        else stars[i].classList.remove('text-amber-400', 'fill-amber-400');
                      }
                    }
                  }}
                  onMouseLeave={(e) => {
                    const stars = e.currentTarget.parentElement?.children;
                    if(stars) {
                      for(let i=0; i<stars.length; i++) {
                        if(i < ratingValue) stars[i].classList.add('text-amber-400', 'fill-amber-400');
                        else stars[i].classList.remove('text-amber-400', 'fill-amber-400');
                      }
                    }
                  }}
                  className={`p-2 transition-all cursor-pointer ${ratingValue >= star ? 'text-amber-400 fill-amber-400 scale-110' : 'text-slate-600 hover:text-slate-400'}`}
                >
                  <Star className="w-8 h-8" />
                </button>
              ))}
            </div>

            <button
              disabled={ratingValue === 0 || isSubmittingRating}
              onClick={async () => {
                setIsSubmittingRating(true);
                if (sessionToRate.mentorId) {
                  await rateMentor(sessionToRate.mentorId, ratingValue);
                }
                setTimeout(() => {
                  setSessionToRate(null);
                  setRatingValue(0);
                  setIsSubmittingRating(false);
                }, 1000);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmittingRating ? 'Submitting...' : 'Submit Rating'}
            </button>
            
            <button 
              onClick={() => {
                setSessionToRate(null);
                setRatingValue(0);
              }}
              className="w-full mt-4 text-slate-500 hover:text-white text-xs font-semibold transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      )}
"""
    # Insert modal at the end before closing div of the main component
    content = content.replace("    </div>\n  );\n}\n\n// Helper to", modal_jsx + "\n    </div>\n  );\n}\n\n// Helper to")
    
    with open('src/app/portal/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

update_context()
update_page()
print("Rating logic injected!")
