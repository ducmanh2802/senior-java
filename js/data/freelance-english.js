/*
 * Freelance track (#/freelance): noi dung tieng Anh cho man hinh #/freelance (T2765).
 * Schema: docs/FREELANCE-TRACK.md (window.FREELANCE_EN = { screening, standup, phrases, videoScript }).
 * Kiem tra: node --check js/data/freelance-english.js ; node scripts/check-freelance.js ; node scripts/validate.js
 * Ghi chu: truong 'templates' (3 mau PR + 1 cover letter) trong Noi dung #4 chua them vi
 * scripts/check-freelance.js (so huu cua integrator) chi cho phep khoa screening/standup/phrases/videoScript
 * va se bao loi khoa la. Nhan vien tong hop nen bo sung 'templates' vao KEYS neu can.
 */
window.FREELANCE_EN = {
  screening: [
    {
      id: 'screening-001',
      question: 'Can you share a GitHub link, PR, or video showing how you work with an AI agent? How much did the agent write, and what did you review or rewrite?',
      tips_vi: 'Noi ro ty le code agent viet so voi ban review/viet lai. Dung vi du cu the tu duan thach. Goi y cac cum tu ben duoi khi tra loi.',
      outline: [
        'How long you have used the agent and on which project.',
        'Approximate split: agent writes, you review and rewrite.',
        'A concrete example: what the agent drafted and what you changed.',
        'Your rule: no merge without green test and full diff review.',
      ],
      modelAnswer: `I have used Claude Code as my primary coding agent for about [YOUR NUMBER] months. On senior-java - a web app with more than 5,000 interview questions - I ran an agent pipeline that handled more than 3,000 tasks through review, verify, then commit, with Playwright smoke tests after each deploy. My usual split: the agent writes around 70 percent of the boilerplate and tests, and I review every line of the diff. I rewrite about 20 percent for clarity, error handling, and naming. For example, in a recent PR that added JWT validation, the agent drafted the endpoint and its tests; I tightened the exception handling and rewrote the assertion messages. I never merge unless the tests are green and I have read the full diff. In a demo video, I narrate exactly this loop: task, agent draft, my review, my rewrite, CI, merge.`,
      keyPhrases: [
        { en: 'The agent wrote the draft; I reviewed and rewrote the diff.', vi: 'Agent viet nhap; toi review va viet lai diff.' },
        { en: 'I never merge without a green test and line-by-line diff review.', vi: 'Toi khong bao gio merge neu chua co kiem tra xanh va review tung dong diff.' },
        { en: 'around 70 percent agent, 30 percent me', vi: 'khoang 70 phan tram agent, 30 phan tram toi' },
        { en: 'review, verify, then commit', vi: 'review, verify, roi commit' },
      ],
    },
    {
      id: 'screening-002',
      question: 'Tell me about a production system you owned end to end: your role, what broke, and what you changed?',
      tips_vi: 'Tra loi theo cau truc: vai tro cua ban -> su co da xay ra -> ban thay doi gi. Co so lieu (ty loi, thoi gian) se tang do tin cay.',
      outline: [
        'The system you owned and your role on it.',
        'What broke: symptoms, metrics, and root cause.',
        'What you changed: fix, prevention, and result.',
      ],
      modelAnswer: `I own the senior-java-api service end to end. It is a Spring Boot 3 application on Java 17 that grades interview answers and fails over across multiple AI providers. My role covers schema, API design, deployment, and on-call. One incident: the grading endpoint started returning 502 under load because the primary AI provider rate-limited us and the fallback never triggered. The error rate jumped from 0.1 percent to 12 percent in five minutes. I investigated the logs, found the provider returned 429, and fixed it by adding a second provider, retry with exponential backoff, and a rate-limit alert. After the change, the error rate returned below 0.1 percent and failover passed in staging.`,
      keyPhrases: [
        { en: 'I own this service end to end.', vi: 'Toi so huu dich vu nay end to end.' },
        { en: 'the error rate jumped from 0.1 percent to 12 percent in five minutes', vi: 'ty loi nhay tu 0,1 phan tram len 12 phan tram trong nam phut' },
        { en: 'the fallback never triggered', vi: 'du phong khong bao gi kich hoat' },
        { en: 'retry with exponential backoff', vi: 'thu lai voi tang luuy ham mu' },
      ],
    },
    {
      id: 'screening-003',
      question: 'Guardrails when an agent touches payment code: test, review, secret, staging. Tell me about one process bug you caught before production.',
      tips_vi: 'Nue cac guardrail ro rang, roi ke 1 loi quy trinh ban bat duoc truoc khi len production. Co chi tiet ki thuat se tot.',
      outline: [
        'Your payment-code guardrails: test first, review diff, secrets in .env only, staging before production.',
        'The bug you caught: what the agent drafted and why it was unsafe.',
        'How you fixed it and how you verified it.',
      ],
      modelAnswer: `For payment code I follow strict guardrails: write the test first, let the agent draft, then I review every line of diff; secrets live only in dot env and dot gitignore, never in prompts or commits; gitleaks pre-commit blocks any real key; and we deploy to staging before production. One bug I caught before production: the agent drafted a wallet transfer that read the balance, then updated it, without select for update and without a check constraint balance greater than or equal to zero. In my diff review I spotted the race: two concurrent transfers could both succeed and drive the balance negative, a double spend. I made the agent add a transaction with select for update and a database check constraint, then we verified with Testcontainers running two threads against real Postgres. The unsafe version never reached staging.`,
      keyPhrases: [
        { en: 'write the test first, then review every line of diff', vi: 'viet kiem tra truoc, roi review tung dong diff' },
        { en: 'select for update', vi: 'select for update' },
        { en: 'double spend', vi: 'chi tieu kep' },
        { en: 'the unsafe version never reached staging', vi: 'ban khong an toan chua bao gi den staging' },
      ],
    },
    {
      id: 'screening-004',
      question: 'Tell me about a Stripe Connect integration you did: account type, onboarding, payouts or transfers, webhook retry and idempotency.',
      tips_vi: 'Tra loi trung thuc: day la duan ca nhan o Stripe test mode, chua xu ly tien thach. Nue loai tai khoan, onboarding, chuyen tien, webhook idempotent.',
      outline: [
        'Honest context: this is a personal project in Stripe test mode, not live production.',
        'Account type and onboarding: Express connected account with Account Links.',
        'Payouts or transfers: destination charge and how money moves.',
        'Webhook: signature verify, event id unique, idempotency key, out-of-order handling.',
      ],
      modelAnswer: `I have not processed real money in production with Stripe. What I built is club-payouts, a personal project in Stripe test mode: a Spring Boot API plus a Next.js frontend where a sports club collects membership fees and pays coaches. I used Express connected accounts with Account Links for coach onboarding, and destination charges so the platform holds the fee and transfers the rest to the coach. For webhooks I verify the signature with Webhook.constructEvent, store each event id as unique so a repeated event is ignored, and send idempotency key when creating transfers so retries cannot double pay. I also handle out-of-order events by storing updated at and skipping stale ones. I tested duplicate webhooks and reversed ordering locally with the Stripe CLI. This is test mode only: no live cards and no real payouts yet.`,
      keyPhrases: [
        { en: 'Stripe test mode only, no real money yet', vi: 'chi Stripe test mode, chua co tien thach' },
        { en: 'Express connected account with Account Links', vi: 'tai khoan ket noi Express voi Account Links' },
        { en: 'destination charge', vi: 'destination charge' },
        { en: 'event id as unique', vi: 'ma su ki la duy nhat' },
        { en: 'idempotency key', vi: 'khoa idempotency' },
      ],
    },
    {
      id: 'screening-005',
      question: 'Have you helped a careful team adopt AI agents? What changed, and how do you know it is durable?',
      tips_vi: 'Ke vie giup team dung agent cach than thuc: gi thay doi, va lam sao biet ben bur. Nhu quy tac chung va so lieu neu co.',
      outline: [
        'The team and the problem before shared rules existed.',
        'What you introduced: shared rules, review checklist, PR statement.',
        'Evidence of durability: PR count, zero leaks, new hires use it without reminders.',
      ],
      modelAnswer: `Yes. I helped a team of four adopt Claude Code safely by writing shared rules and a review checklist: test first, review every diff, no secrets in prompts or repo, staging before production, and every PR must state agent wrote, I reviewed, I rewrote. The rules live in the repo as AGENT-RULES.md and REVIEW-CHECKLIST.md under docs. Before this, each member used the agent differently and one PR almost committed a real API key. After the rules, more than [YOUR NUMBER] PRs were merged with zero secrets leaked and zero production rollbacks. I know it is durable because the rules live in the repo, new hires onboard with them, and the team now runs gitleaks and CI automatically without reminders. The checklist is part of the definition of done, so safety continues even when I am not in the room.`,
      keyPhrases: [
        { en: 'shared rules and review checklist', vi: 'quy tac chung va danh sach kiem tra' },
        { en: 'agent wrote, I reviewed, I rewrote', vi: 'agent viet, toi review, toi viet lai' },
        { en: 'zero secrets leaked and zero production rollbacks', vi: 'khong secret bi lo va khong khoi phuc production' },
        { en: 'part of the definition of done', vi: 'la mot phuan cua dinh nghia hoan thanh' },
      ],
    },
  ],
  standup: [
    {
      id: 'standup-001',
      context: 'Tuan 1: cai dat Claude Code, viet CLAUDE.md, lam quen plan mode.',
      yesterday: 'I read the Claude Code overview and quickstart docs. I installed Claude Code and tried it in an empty folder to see how the agent loop works.',
      today: 'I will write CLAUDE.md for senior-java-api: project description, test commands, and things the agent must not do.',
      blocker: 'I am not sure which rules belong in CLAUDE.md versus the project README.',
      vi: 'Hom qua: Toi doc tai lieu overview va quickstart cua Claude Code. Toi cai dat Claude Code va thu trong thu muc trong de xem vong lap cua agent hoat dong the nao. Hom nay: Toi se viet CLAUDE.md cho senior-java-api, bao gom mo ta duan, lenh kiem tra, va nhung viec agent khong duoc lam. Chan: Toi chua chac quy tac nao nen nam trong CLAUDE.md so voi README cua duan.'
    },
    {
      id: 'standup-002',
      context: 'Tuan 1: gui PR dau tien tren senior-java-api theo quy trinh kiem tra truoc -> agent viet code -> review diff.',
      yesterday: 'I wrote a failing JUnit test for a new endpoint. I asked the agent to write the code to make the test pass.',
      today: "I will read every line of the agent's diff, run the test, and open the PR with 'Agent wrote / I reviewed / I rewrote'.",
      blocker: "The agent's diff changes a file I did not ask it to touch.",
      vi: 'Hom qua: Toi viet mot kiem tra JUnit that bai cho mot endpoint moi. Toi yeu cau agent viet code de lam cho kiem tra dat. Hom nay: Toi se doc tung dong diff cua agent, chay kiem tra, va mo PR voi noi dung Agent wrote / I reviewed / I rewrote. Chan: Diff cua agent thay doi mot tep toi khong yeu cau no cham den.'
    },
    {
      id: 'standup-003',
      context: 'Tuan 2: cai gitleaks pre-commit de quet secret truoc khi commit.',
      yesterday: 'I added .env and .gitignore to block secrets from being committed. I created .env.example with variable names only.',
      today: 'I will install gitleaks as a pre-commit hook and test it with a fake key to confirm it blocks commits.',
      blocker: 'I need to confirm the gitleaks version works on Windows and macOS for the whole team.',
      vi: 'Hom qua: Toi them .env va .gitignore de chan secret bi commit. Toi tao .env.example chi chua ten bien, khong gia tri. Hom nay: Toi se cai dat gitleaks lam pre-commit hook va kiem tra bang mot khoa gia de xac nhận no chuan commit. Chan: Toi can xac nhan phien ban gitleaks hoat dong tren Windows va macOS cho toan bo team.'
    },
    {
      id: 'standup-004',
      context: 'Tuan 2: bat branch protection cho main va viet PR template.',
      yesterday: 'I wrote a GitHub Actions workflow that runs mvn test on every PR. I deliberately broke one test to see the red check block merge.',
      today: 'I will enable branch protection requiring PR, green checks, and review. I will also add a PR template with the agent review lines.',
      blocker: 'I do not have admin rights to enable branch protection on the repo yet.',
      vi: 'Hom qua: Toi viet mot luoi GitHub Actions chay mvn test tren moi PR. Toi co thiet phai mot test de thay kiem tra do chan merge. Hom nay: Toi se bat branch protection yeu cau PR, kiem tra xanh, va review. Toi cung se them PR template co dong review cua agent. Chan: Toi khong co quyen admin de bat branch protection tren repo chua.'
    },
    {
      id: 'standup-005',
      context: 'Tuan 3: Postgres, Flyway migration, khoi tao repo club-payouts.',
      yesterday: 'I installed Postgres and created the club_payouts database. I learned about tables, rows, primary keys, and foreign keys.',
      today: 'I will add Flyway to Spring Boot and write migration V1__init.sql to create members and coaches tables.',
      blocker: 'Flyway failed to run because the database username and password do not match application.properties.',
      vi: 'Hom qua: Toi cai dat Postgres va tao database club_payouts. Toi hoc ve bang, dong, khoa chinh, va khoa ngoai. Hom nay: Toi se them Flyway vao Spring Boot va viet migration V1__init.sql de tao bang members va coaches. Chan: Flyway khong chay duoc vi ten tai khoan va mat khau database khong khop voi application.properties.'
    },
    {
      id: 'standup-006',
      context: 'Tuan 4: so cai ghi so kep, so du khong am, kiem tra dong thoi bang Testcontainers.',
      yesterday: 'I designed the ledger entries and wallets tables with double entry bookkeeping: every transfer has a debit and a credit that sum to zero.',
      today: 'I will add select for update in the transfer transaction and a check constraint balance greater than or equal to zero. Then I will write a Testcontainers test with two threads transferring at the same time.',
      blocker: 'Testcontainers needs Docker, and Docker is not running on my machine yet.',
      vi: 'Hom qua: Toi thiet ke cac bang ledger entries va wallets voi ke toan so kep: moi chuyen tien co mot du va mot tong bang khong. Hom nay: Toi se them select for update trong giao dich chuyen tien va mot check constraint balance lon hon hoac bang khong. Sau do toi se viet kiem tra Testcontainers voi hai luong chuyen tien cung luc. Chan: Testcontainers can Docker, va Docker chua chay tren may cua toi.'
    },
    {
      id: 'standup-007',
      context: 'Tuan 5: khai niem Stripe Connect, Express account, onboarding qua Account Links.',
      yesterday: 'I read the Stripe Connect overview and drew the flow: platform, Stripe, and coach connected account. I learned the difference between platform account and connected account.',
      today: 'I will write the onboarding endpoint in Spring that creates an Account Link and returns the URL to the frontend.',
      blocker: 'I am not sure whether to use destination charges or separate charges and transfers for the club.',
      vi: 'Hom qua: Toi doc tai lieu Stripe Connect va ve luong: platform, Stripe, va tai khoan ket noi cua huong vien. Toi hieu biet giua tai khoan platform va tai khoan ket noi. Hom nay: Toi se viet endpoint onboarding trong Spring tao mot Account Link va tra URL ve frontend. Chan: Toi chua chac nen su dung destination charge hay separate charge va transfer cho club.'
    },
    {
      id: 'standup-008',
      context: 'Tuan 6: webhook Spring xac thuc chu ky, event.id UNIQUE, Idempotency-Key, xu ly su kien sai thu tu.',
      yesterday: 'I learned that webhooks must verify the signature so nobody can fake a Stripe request. I designed a stripe events table with unique event id.',
      today: 'I will add idempotency key when calling Stripe to create transfers, and handle out-of-order events using updated at.',
      blocker: 'The Stripe CLI is not forwarding webhooks to localhost, so I cannot test locally yet.',
      vi: 'Hom qua: Toi hieu webhook phai xac thuc chu ky de nguoi ta khong the gian lam mot yeu cau Stripe. Toi thiet ke mot bang su kien Stripe voi ma su kien duy nhat. Hom nay: Toi se them idempotency key khi goi Stripe de tao chuyen tien, va xu ly su kien sai thu tu su dung updated at. Chan: Stripe CLI khong chuyen webhook den localhost, nen toi chua the kiem tra o may chua.'
    },
    {
      id: 'standup-009',
      context: 'Tuan 7: Next.js App Router + TypeScript, trang onboarding va dashboard thu nhap.',
      yesterday: 'I created a Next.js app in club-payouts web and learned the difference between server components and client components.',
      today: 'I will build the earnings dashboard that calls the Spring API for balance and transaction history, using a TypeScript interface instead of any.',
      blocker: 'The Next.js dev server fails to start because of a port conflict with the Spring API.',
      vi: 'Hom qua: Toi tao mot app Next.js trong club-payouts/web va hieu biet giua server component va client component. Hom nay: Toi se xay dung bang board thu nhap goi API Spring de lay so du va lich su giao dich, su dung interface TypeScript thay vi any. Chan: Next.js dev server khong khoi duoc vi xung dot cong su voi API Spring.'
    },
    {
      id: 'standup-010',
      context: 'Tuan 8: staging: Next.js len Vercel, API len Fly/Render, CI deploy staging truoc production.',
      yesterday: 'I deployed Next.js to Vercel and the Spring API to Fly.io. I set secrets through the dashboard, not in code.',
      today: 'I will set up CI so every push builds, tests, and deploys to staging. Production deploy needs manual approval.',
      blocker: 'I do not know which region to choose for Fly.io to reduce latency for US Eastern clients.',
      vi: 'Hom qua: Toi trien khai Next.js len Vercel va API Spring len Fly.io. Toi dat secret qua dashboard, khong trong code. Hom nay: Toi se cai dat CI de moi push xay dung, kiem tra, va trien khai staging. Trien khai production can duyet thu cong. Chan: Toi chua biet vung nao de chon cho Fly.io giam do tre cho khach hang US Eastern.'
    },
  ],
  phrases: [
    { en: 'Could you clarify the acceptance criteria for this ticket?', vi: 'Ban co the giai thieu tieu tieu chap nhan cua ticket nay khong?', example: 'Could you clarify the acceptance criteria for this ticket? I want to make sure I test the right behavior.' },
    { en: 'Which Stripe account type should the coach use: Express or Custom?', vi: 'Huong vien nen su dung loai tai khoan Stripe nao: Express hay Custom?', example: 'Which Stripe account type should the coach use: Express or Custom? It affects onboarding.' },
    { en: 'Do you need the webhook to handle duplicate events?', vi: 'Ban co can webhook xu ly su kien trung lap khong?', example: 'Do you need the webhook to handle duplicate events, or is once enough?' },
    { en: 'What is the expected response time for the API under load?', vi: 'Thoi gian phan hoi mong doi cua API khi co tai la bao nhieu?', example: 'What is the expected response time for the API under load? We need an SLO.' },
    { en: 'Should refunds go through Stripe or a manual process?', vi: 'Hoan tien nen qua Stripe hay quy trinh thu cong?', example: 'Should refunds go through Stripe or a manual process? This changes the ledger design.' },
    { en: 'I will need one more day to finish the Stripe webhook review.', vi: 'Toi can them mot ngay de hoan tat kiem tra webhook Stripe.', example: 'I will need one more day to finish the Stripe webhook review because I found an edge case.' },
    { en: 'The staging deploy is delayed until Friday because of a failed test.', vi: 'Viec trien khai staging bi cham den thu Sau do kiem tra khong dat.', example: 'The staging deploy is delayed until Friday because of a failed test. I will keep you updated.' },
    { en: 'I am waiting for the client\'s answer on the account type before I can start onboarding.', vi: 'Toi dang cho tra loi cua khach hang ve loai tai khoan truoc khi co the bat dau onboarding.', example: 'I am waiting for the client\'s answer on the account type before I can start onboarding the coaches.' },
    { en: 'This will push the delivery to next week. Sorry for the delay.', vi: 'Dieu nay se day giao hang sang tiet theo. Xin loi vi suc cham.', example: 'This will push the delivery to next week. Sorry for the delay, and I will recover two hours.' },
    { en: 'Can we move our sync to tomorrow morning US Eastern?', vi: 'Chung ta co the di chuyen cuoc hen dong bo sang sang mai gio My Dong khong?', example: 'Can we move our sync to tomorrow morning US Eastern? I have a conflict at the usual time.' },
    { en: 'I see two options: destination charge or separate charge plus transfer. Which do you prefer?', vi: 'Toi thay hai lua chon: destination charge hoac separate charge cong transfer. Ban thich cai nao?', example: 'I see two options: destination charge or separate charge plus transfer. Which do you prefer for club payouts?' },
    { en: 'Option A is faster to build; Option B is safer for refunds.', vi: 'Lua chon A xay dung nhanh hon; lua chon B an toan hon cho hoan tien.', example: 'Option A is faster to build; Option B is safer for refunds. I recommend B for payment code.' },
    { en: 'Should we store Stripe events in Postgres or handle them in memory?', vi: 'Chung ta nen luu su kien Stripe trong Postgres hay xu ly trong bo nho?', example: 'Should we store Stripe events in Postgres or handle them in memory? Postgres gives us idempotency.' },
    { en: 'I suggest we test in Stripe test mode first, then move to live after review.', vi: 'Toi de xuat chung ta kiem tra o Stripe test mode truoc, sau do chuyen sang live sau khi review.', example: 'I suggest we test in Stripe test mode first, then move to live after review. No real money yet.' },
    { en: 'We can use Express accounts for quick onboarding or Custom accounts for full control.', vi: 'Chung ta co the su dung tai khoan Express de onboarding nhanh hoac Custom de kiem soat day du.', example: 'We can use Express accounts for quick onboarding or Custom accounts for full control. Express fits our coaches.' },
    { en: 'Please review this PR when you have a moment. It includes the Stripe webhook handler.', vi: 'Vui long xem PR nay khi ban co thoi gian. No bao gom trinh xu ly webhook Stripe.', example: 'Please review this PR when you have a moment. It includes the Stripe webhook handler and idempotency key.' },
    { en: 'Can you check the diff line by line before I merge?', vi: 'Ban co the kiem tra tung dong diff truoc khi toi merge khong?', example: 'Can you check the diff line by line before I merge? I want zero secrets in the change.' },
    { en: 'I marked this as ready for review. Tests pass and staging is updated.', vi: 'Toi danh dau day la da san sang review. Kiem tra dat va staging da cap nhat.', example: 'I marked this as ready for review. Tests pass and staging is updated with the new transfer flow.' },
    { en: 'Did you see any secret or key in the diff?', vi: 'Ban thay secret hoac key nao trong diff khong?', example: 'Did you see any secret or key in the diff? gitleaks should have caught it, but double check.' },
    { en: 'Please approve so I can deploy to staging before Friday.', vi: 'Vui long duyet de toi co the trien khai staging truoc thu Sau.', example: 'Please approve so I can deploy to staging before Friday and test with Stripe CLI.' },
    { en: 'We had a production incident: the grading endpoint returned 502 under load.', vi: 'Chung ta co su co production: endpoint kiem tra tra ve 502 khi co tai lon.', example: 'We had a production incident: the grading endpoint returned 502 under load, and the fallback did not trigger.' },
    { en: 'The error rate jumped from 0.1 percent to 12 percent in five minutes.', vi: 'Ty loi nhay tu 0,1 phan tram len 12 phan tram trong nam phut.', example: 'The error rate jumped from 0.1 percent to 12 percent in five minutes. I am investigating the logs.' },
    { en: 'The primary AI provider rate-limited us and the fallback never triggered.', vi: 'Nha cung cap AI chinh gioi han toc do cua chung va du phong khong bao gi kich hoat.', example: 'The primary AI provider rate-limited us and the fallback never triggered. I am adding a second provider.' },
    { en: 'I found a race condition in the wallet transfer: two transfers could both succeed.', vi: 'Toi tim loi tranh cap trong chuyen tien vi: hai chuyen co cung thanh cong.', example: 'I found a race condition in the wallet transfer: two transfers could both succeed and make the balance negative.' },
    { en: 'No real money was affected; this happened in Stripe test mode only.', vi: 'Khong tien thach bi anh huong; dieu nay xay ra chi o Stripe test mode.', example: 'No real money was affected; this happened in Stripe test mode only.' },
    { en: 'Good morning US Eastern. I am online from 9:00 to 17:00 New York time.', vi: 'Chao buoi sang gio My Dong. Toi lam viec tu 9:00 den 17:00 gio New York.', example: 'Good morning US Eastern. I am online from 9:00 to 17:00 New York time, which is 21:00 to 05:00 Vietnam time.' },
    { en: 'Let me summarize what changed, what I tested, and the remaining risks.', vi: 'Hay to toi tom tat gi thay doi, gi toi kiem tra, va rui ro con lai.', example: 'Let me summarize what changed, what I tested, and the remaining risks for the client.' },
    { en: 'I pushed the fix to staging. Can you verify it works?', vi: 'Toi da day ban sua len staging. Ban co the xac nhan no chay duoc khong?', example: 'I pushed the fix to staging. Can you verify it works with a test card?' },
    { en: 'Thanks for the quick review. I will address your comments now.', vi: 'Cam on ban da review nhanh. Toi se xu ly y tien cua ban ngay.', example: 'Thanks for the quick review. I will address your comments now and push a new commit.' },
    { en: 'Are we still on for the 21:00 Vietnam time sync?', vi: 'Chung ta con hen gio dong bo 21:00 gio Viet Nam dung khong?', example: 'Are we still on for the 21:00 Vietnam time sync? Let me know if you need to reschedule.' },
    { en: 'I will write the README in English so clients can understand the project.', vi: 'Toi se viet README bang tieng Anh de khach hang hieu duan.', example: 'I will write the README in English so clients can understand the architecture and guardrails.' },
    { en: 'This PR follows our guardrails: test first, review every diff, no secrets.', vi: 'PR nay tuan thu guardrail cua chung ta: kiem tra truoc, review tung diff, khong co secret.', example: 'This PR follows our guardrails: test first, review every diff, no secrets in the repo.' },
    { en: 'Can we record a short video showing the agent workflow?', vi: 'Chung ta co the quay video ngan trinh dien quy trinh lam viec voi agent khong?', example: 'Can we record a short video showing the agent workflow for the Upwork profile?' },
    { en: 'I am available for a mock interview this weekend.', vi: 'Toi co the tham gia phong van giap lap cuoi tien nay.', example: 'I am available for a mock interview this weekend to practice speaking English.' },
    { en: 'Please let me know if you need anything else from me.', vi: 'Vui long cho toi biet neu ban can them gi tu toi.', example: 'Please let me know if you need anything else from me before the trial week starts.' },
    { en: 'The agent wrote the draft; I reviewed and rewrote the diff.', vi: 'Agent viet nhap; toi review va viet lai diff.', example: 'The agent wrote the draft; I reviewed and rewrote the diff for clarity and safety.' },
    { en: 'I never merge without a green test and a full diff review.', vi: 'Toi khong bao gio merge neu chua co kiem tra xanh va review toan bo diff.', example: 'I never merge without a green test and a full diff review, especially for payment code.' },
    { en: 'Staging first, production second. No direct deploys to production.', vi: 'Staging truoc, production sau. Khong trien khai tiep tuc len production.', example: 'Staging first, production second. No direct deploys to production without client approval.' },
    { en: 'What is your timezone, and what hours overlap best for you?', vi: 'Mui gio cua ban la gi, va khoang gio chong chot tot nhat la khi nao?', example: 'What is your timezone, and what hours overlap best for you? I work US Eastern.' },
    { en: 'Here is the summary in English for the client.', vi: 'Duoi day la tom tat bang tieng Anh cho khach hang.', example: 'Here is the summary in English for the client: what changed, what I tested, next steps.' },
  ],
  videoScript: `OPENING (30 seconds)
Hi, I am [YOUR NAME], a Java backend engineer. I use AI agents like Claude Code to ship code faster and safer. In this three minute video, I will show you my agent workflow: test first, agent writes, I review, then CI and staging.

DEMO: TEST FIRST (45 seconds)
Step one: I write the test before the agent touches code. A failing test defines what done means. Here is a test for a wallet transfer that must not go negative.

DEMO: AGENT WRITES CODE (45 seconds)
Step two: I ask the agent to write the code that makes the test pass. The agent drafts the endpoint and the service. I do not merge yet.

DEMO: REVIEW THE DIFF (45 seconds)
Step three: I read every line of the diff. I check for secrets, logic errors, and missing error handling. I rewrite about twenty percent. The rule is: Agent wrote, I reviewed, I rewrote.

DEMO: CI AND STAGING (30 seconds)
Step four: CI runs the tests. If green, we deploy to staging. Production only after client approval. No direct deploys to production.

CLOSING (15 seconds)
That is my agent workflow: fast, but never reckless. Thanks for watching.`,
};
