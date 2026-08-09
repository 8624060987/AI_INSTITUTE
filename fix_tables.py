import re

with open('src/app/portal/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix mentor table
content = content.replace(
'''                          <tr className="border-b border-slate-100 dark:border-slate-900 text-[10px] uppercase font-bold text-slate-400">
                            <th className="py-3 px-4">Contact Detail</th>
                            <th className="py-3 px-4">Interest Course</th>
                            <th className="py-3 px-4">Message Prompt</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaderboard.map((student) => (''',
'''                          <tr className="border-b border-slate-100 dark:border-slate-900 text-[10px] uppercase font-bold text-slate-400">
                            <th className="py-3 px-4">Rank</th>
                            <th className="py-3 px-4">Student Name</th>
                            <th className="py-3 px-4">Attendance Rate</th>
                            <th className="py-3 px-4">Average Quiz Score</th>
                            <th className="py-3 px-4">Level Experience (XP)</th>
                            <th className="py-3 px-4">Active Badges Awarded</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaderboard
                            .filter(s => s.studentId.length > 20)
                            .sort((a, b) => b.xp - a.xp)
                            .map((student, index) => ('''
)

# Fix mentor table body (add rank td)
content = content.replace(
'''                            <tr key={student.studentId} className="border-b border-slate-55 dark:border-slate-900 text-slate-600 dark:text-slate-300">
                              <td className="py-4 px-4 flex items-center gap-3">''',
'''                            <tr key={student.studentId} className="border-b border-slate-55 dark:border-slate-900 text-slate-600 dark:text-slate-300">
                              <td className="py-4 px-4 font-bold text-slate-800 dark:text-white">#{index + 1}</td>
                              <td className="py-4 px-4 flex items-center gap-3">'''
)

with open('src/app/portal/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
