/*
 * English translation of js/data/q-soft.js — task T220. Format: js/core/i18n.js (content overlay).
 * ids: behavioral-020
 */
App.i18n.content({
  'behavioral-020': {
    q: `Describe a time you proactively took on work outside your assigned scope, with no one asking. What did you do, what was the outcome, and how did you know it was worth doing rather than taking over someone else's ownership?`,
    a: `**Summary:** "Proactively taking on work" is a **good** behavior, but the real question is whether you understand the **boundary** between spotting a gap and taking over someone else's ownership. A strong answer shows three things: **report before acting**, **limit scope** to the exact gap that needs filling, and **hand back** so the work becomes the team's capability.

### What the interviewer wants to assess
- Do you **proactively spot problems** outside your assigned scope?
- Do you **consider the consequences** of going beyond boundaries, or just act on instinct?
- Do you know how to **communicate** with those affected by your action, and turn a personal effort into a **shared team capability**?
- Are you **not** the type who says "I do everything alone"?

### Three types of out-of-scope work
| Type | Example | Risk if done carelessly |
|---|---|---|
| Gap no one noticed | release process known by only one person, missing monitoring | changing production infrastructure on your own |
| Work dropped between two boundaries | contract between mobile and backend that no one owns | doing part of another team's job |
| Unblocking others | another team waiting for data you can create faster | wrong-product outcome because you misunderstood |

### Five principles to avoid being seen as overstepping
1. **Report before acting**: say clearly what you see, what you plan to do, the scope, and how long it will take.
2. **Limit scope**: fill only the gap, don't turn it into a refactor when no one asked.
3. **Don't decide for others**: if the change is in another team's system, they must agree.
4. **Hand back**: after finishing, hand over ownership and document so others can continue.
5. **Embed in process**: turn a personal effort into the team's — add to backlog, release checklist, runbook.

### Sample answer
> "After each big sale period, the operations team had to run a script manually to mark orders with loyalty points that needed recalculation. The script was in internal docs; only one operations teammate knew how to run it. Over 6 months I saw it missed twice, and each time customer point data was wrong for 2 full days.
> This was not assigned to me, and it wasn't in the sprint backlog. I still proposed taking it because it met three conditions: I found the problem, the operations lead (owner of this process) agreed, and I could do it without conflicting with any running priority.
> I followed this order: (1) **propose first** to my lead and the operations lead — ask who wants to own it, I'm happy to support; no one had time, so I asked to do it in about 2 days with a ticket and clearly written scope. (2) **limit the work** to the exact gap: turn the script run into an automatic cron job after each sale period ends, with result notifications to operations — I didn't touch the loyalty-calculation logic or modify schema. (3) **hand back**: write a runbook and guide the operations teammate on how to monitor and rerun when the job fails; the job belongs to operations.
> Result: 8 consecutive months with no incorrect point calculations; manual work reduced by about 3 hours per sale period; and what mattered most was that the operations teammate later became the person consulted when automating other things — meaning I didn't take anyone's role away.
> Lesson: 'proactively taking on work' does not mean 'do everything for others'. It means see the gap, report first, do just enough to fill it, then return it to the right owner."

### Things to avoid
- **Report after finishing**: turns a good action into a trust-destroying one.
- **Expand scope into a big refactor**: wastes time of other teams.
- **Take over another team's technical ownership**: even with a good idea, the result is conflict.
- **Change production config or deploy without authority**.
- **No one knows you did it**, or **treating symptoms instead of root cause**: others redo it, or you only add a manual check step.

> Senior tip: this question has a common trap — "I did everything myself and the whole team was surprised". A good answer acknowledges **boundaries**. Prepare two versions: one where you took on work and succeeded, and one where you took it on but finally **handed it back** to someone more appropriate — with the lesson you learned. The second version shows you understand the difference between initiative and overstepping.`,
    follow: [
      `How do you say "I see this problem and I will handle it" without sounding like you're overstepping?`,
      `Have you ever had to drop work you had taken on because you realized you were going beyond your boundaries?`,
      `How do you turn something you did alone into something shared by the team?`
    ]
  }
});
