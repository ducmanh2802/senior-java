/* Topics: english — owner: task T8. Format: see AGENTS.md */
(window.QUESTIONS = window.QUESTIONS || []).push(
{
  id: 'english-001',
  topic: 'english',
  level: 'mid',
  q: 'Tell me about yourself. Give the short version you would use at the start of a Senior Java backend interview.',
  a: `**Tóm tắt:** Interviewer không cần lý lịch đầy đủ; họ muốn biết bạn là ai, mạnh ở đâu và vì sao ngồi ở đây. Công thức 60–90 giây: **hiện tại (vai trò + domain + scale) → quá khứ (1–2 thành tựu có số) → vì sao ứng tuyển**. Đừng kể từ lúc tốt nghiệp đại học.

### Sample answer
Thanks for having me. I am a backend engineer with seven years of experience, and for the last three years I have been working on a payments platform at a fintech company here in Vietnam. The platform handles about two million transactions a day across roughly twenty Spring Boot services, and I own the payment orchestration and reconciliation services end to end, from design and code review to running them on Kubernetes.

Before that I was a Java developer on a logistics product, where I led the migration of a legacy monolith from Java 8 and Spring 3 to Java 17 and Spring Boot 3. That project removed about forty percent of our old XML configuration and cut deployment time from forty minutes to eight.

What I enjoy most is the part where correctness and performance meet: idempotency, retries, reconciliation. That is exactly why I am interested in this role. Your team is moving into multi-region payments, and that is the problem I want to spend the next few years on. I am also comfortable working in English, since my current team has engineers in Singapore and India, and all our design reviews are in English.

### Useful phrases
- **I specialize in**: tôi chuyên về
- **end-to-end ownership**: sở hữu trọn vẹn từ thiết kế đến vận hành
- **I led the migration of**: tôi dẫn dắt việc chuyển đổi
- **which brings me to why I am here**: và đó là lý do tôi có mặt ở đây
- **hands-on**: trực tiếp làm, không chỉ quản lý
- **I own the service end to end**: tôi chịu trách nhiệm toàn bộ service

> Tip: Người Việt hay viết "I have 7 years experiences" — sai, vì **experience** khi nói kinh nghiệm là uncountable: "seven years of experience". Cũng đừng dịch nguyên văn "em rất vui được phỏng vấn" thành "I am very happy to be interviewed" nghe cứng; dùng "Thanks for having me" tự nhiên hơn nhiều. Tập nói thành tiếng và bấm giờ: dài quá 2 phút là mất điểm.`,
  follow: [
    'Which part of that payments platform did you personally design, and which part did you inherit?',
    'You mentioned the migration to Java 17 — what was the hardest technical risk there?',
    'Why did you choose the payments domain in the first place?',
  ],
  tags: ['introduction', 'self-pitch', 'senior-java'],
  lang: 'en',
},
{
  id: 'english-002',
  topic: 'english',
  level: 'senior',
  q: 'Walk me through your current project and its architecture. How would you explain it to another backend engineer?',
  a: `**Tóm tắt:** Trả lời theo lớp, không liệt kê công nghệ: **business problem → thành phần chính + luồng request → dữ liệu/hạ tầng → scale + điểm đau**. Nêu 2–3 con số (QPS, data size, p99) và một quyết định kiến trúc bạn trực tiếp chịu trách nhiệm.

### Sample answer
Sure. The product is a B2B payment gateway. A merchant calls our API to charge a customer, and we route that charge to one of several acquirers depending on card network, currency and success-rate history.

Architecturally we have three layers. The edge is an API gateway that terminates TLS, applies rate limits per merchant and forwards to our payment API. The payment API is a Spring Boot 3 service that validates the request, writes a payment record with status PENDING, and publishes an event to Kafka. Downstream, orchestration workers consume that event and call the acquirer adapter; each adapter is a thin module with its own retry and circuit-breaker policy via Resilience4j. The result is written back and a second event drives webhooks and reconciliation.

Data-wise, PostgreSQL is the source of truth for payment state, Redis holds idempotency keys for twenty-four hours, and we keep an immutable audit trail in S3 through a Debezium change-data-capture pipeline. We run about 400 requests per second at peak, p99 of the synchronous path is around 180 milliseconds, and the whole system is on EKS across two availability zones.

The part I own is the orchestration layer. The key design decision was to make every state transition idempotent and append-only, because with money you cannot rely on exactly-once delivery. The main pain point today is that webhook retries can storm a small merchant after an outage, which we are fixing with per-merchant backpressure.

### Useful phrases
- **at a high level**: ở mức tổng quan
- **the source of truth is**: nguồn dữ liệu chuẩn là
- **the synchronous path**: luồng xử lý đồng bộ
- **the main pain point**: điểm đau chính
- **we are fixing that with**: chúng tôi đang khắc phục bằng
- **per-merchant rate limiting**: giới hạn tần suất theo từng merchant

> Tip: Đừng đọc tên công nghệ như một bản CV ("we use Kafka, Redis, Postgres, Kubernetes, Grafana..."). Interviewer sẽ hỏi "why" ngay. Mỗi công nghệ nêu ra phải kèm **lý do** và **đánh đổi**. Cẩn thận về thì: dự án hiện tại dùng thì hiện tại ("we run", "we have"), dự án cũ dùng quá khứ ("we ran", "we had"); đừng trộn hai thì khi nói về cùng một hệ thống.`,
  follow: [
    'Why did you use Kafka between the API and the orchestration workers instead of a synchronous call?',
    'How do you keep the database and the event stream consistent if the broker is briefly unavailable?',
    'If traffic grew ten times, which component would break first?',
  ],
  tags: ['project', 'architecture', 'system-design'],
  lang: 'en',
},
{
  id: 'english-003',
  topic: 'english',
  level: 'mid',
  q: 'Why are you leaving your current job, and why do you want to join us?',
  a: `**Tóm tắt:** Câu này kiểm tra **thái độ** chứ không phải lý do. Công thức: lý do trung tính, hướng tới tương lai (**muốn học/gánh vác lớn hơn**), rồi nối sang điều cụ thể ở công ty mới. Tuyệt đối không nói xấu sếp, đồng nghiệp hay sản phẩm cũ.

### Sample answer
I am not leaving because of a problem with my team. I have learned a lot there, and I am genuinely grateful for the trust they gave me. But the platform has reached a stable phase. Most of my work now is maintenance and small improvements, and the architecture is unlikely to change in the next two years.

I want to be in the room when the hard decisions are made again: choosing a consistency model, designing for multi-region, owning a service that is still growing. That is the kind of work I do best, and I miss it.

I am also specifically interested in your company because of the way you handle payment reliability. I read your engineering blog post about idempotency keys and webhook delivery, and the approach is very close to what I built, but at a much larger scale. I think I can contribute quickly on the orchestration side, and I would learn a lot from the multi-region work you are starting. So it is a good match in both directions: you get someone who has already made these mistakes, and I get to work on problems I have not solved yet.

### Useful phrases
- **I am not leaving because of a problem with**: tôi không rời đi vì vấn đề với
- **the platform has reached a stable phase**: nền tảng đã bước vào giai đoạn ổn định
- **I want to be in the room when**: tôi muốn có mặt khi
- **that is the kind of work I do best**: đó là kiểu việc tôi làm tốt nhất
- **a good match in both directions**: phù hợp từ cả hai phía
- **I would learn a lot from**: tôi sẽ học được nhiều từ

> Tip: Câu "I want to leave because my manager is toxic" là tự sát trong phỏng vấn, kể cả khi đúng. Người Việt cũng hay dùng "I want to find a new challenge" quá chung chung — hãy thay bằng **một loại công việc cụ thể** (multi-region, platform scale, leading a team). Chú ý giới từ: "interested **in**", "grateful **for**", không phải "interested on".`,
  follow: [
    'What would make you stay if your current company offered you a counter-offer?',
    'What do you know about our engineering culture?',
    'What kind of work do you explicitly not want to do?',
  ],
  tags: ['motivation', 'why-leave', 'why-join'],
  lang: 'en',
},
{
  id: 'english-004',
  topic: 'english',
  level: 'mid',
  q: 'What are your strengths and weaknesses? Please give a concrete example for each.',
  a: `**Tóm tắt:** Chọn **1 strength gắn với vai trò** (kèm bằng chứng có số) và **1 weakness thật nhưng không phá vai trò**, cộng với hành động đang sửa. Đừng dùng weakness giả như "I work too hard" — interviewer nghe mỗi tuần.

### Sample answer
My main strength is turning a vague reliability problem into something measurable. For example, our payment callback had a one percent failure rate that nobody could explain. I added structured logging with a correlation ID across three services, built a dashboard, and within two weeks we found that a specific acquirer was timing out at exactly five seconds because of a client-side default. We changed the timeout and the failure rate dropped to under 0.1 percent. I like that kind of work: instrument first, then guess.

My weakness is that I used to take too much on myself. In my previous team I would rather fix a flaky test at midnight than ask for help, because I thought asking would slow the team down. It did the opposite: I became a bottleneck, and one release slipped by a week because only I understood the reconciliation job. Since then I have deliberately paired with juniors on that area, written runbooks, and now I ask for help earlier. I still catch myself doing it, but I have a rule: if a task blocks someone else for more than half a day, I ask.

### Useful phrases
- **my main strength is**: điểm mạnh chính của tôi là
- **turning a vague problem into something measurable**: biến vấn đề mơ hồ thành thứ đo được
- **instrument first, then guess**: đo trước, rồi mới đoán
- **I became a bottleneck**: tôi trở thành nút thắt
- **I have deliberately paired with**: tôi chủ động pair với
- **I catch myself doing it**: tôi vẫn nhận ra mình đang làm vậy

> Tip: Đừng nói weakness mà không có **hành động sửa** và **kết quả**. Cũng đừng chọn weakness chí mạng với vị trí ("I am bad at debugging", "I don't like code review"). Về phát âm: **strength** có cụm /str/ + /ŋθ/ rất khó, người Việt hay đọc thành "s-tren"; luyện chậm từng âm hoặc dùng "what I do well" nếu sợ vấp.`,
  follow: [
    'Can you give me an example where that weakness actually caused a problem?',
    'What feedback did you receive in your last performance review?',
    'Which strength would your teammates mention first?',
  ],
  tags: ['strengths', 'weaknesses', 'self-awareness'],
  lang: 'en',
},
{
  id: 'english-005',
  topic: 'english',
  level: 'mid',
  q: 'Where do you see yourself in five years?',
  a: `**Tóm tắt:** Interviewer muốn biết bạn có **ở lại lâu không** và hướng phát triển có khớp với con đường của công ty không. Trả lời theo **năng lực muốn đạt được** (technical leadership, depth) thay vì chức danh cụ thể; thể hiện bạn đầu tư vào nơi đang phỏng vấn.

### Sample answer
In five years I would like to be the person other engineers come to for the hardest reliability problems in this domain. Technically, that means going deeper than I am now: I want to understand distributed transactions and consensus well enough to make trade-offs without guessing, and I want to have designed at least one system that runs across regions.

In terms of role, I expect to be leading a small team or to be the tech lead of one service area, but I want to keep writing code. I have seen tech leads who stop coding and slowly lose credibility in design reviews, and I do not want that. I would rather lead by being the most useful engineer in the room.

I am also realistic: five years is long, and plans change. What I can promise is that I will keep going deeper in backend and distributed systems rather than jumping between stacks. This company is a good place for that because the problems here are real: money, latency, correctness. So the short answer is: more depth, some leadership, and still hands-on.

### Useful phrases
- **the person other engineers come to for**: người mà đồng nghiệp tìm đến vì
- **going deeper than I am now**: đi sâu hơn hiện tại
- **make trade-offs without guessing**: đánh đổi mà không phải đoán
- **tech lead of one service area**: tech lead của một mảng service
- **lead by being the most useful engineer**: dẫn dắt bằng việc là người hữu ích nhất
- **I am realistic: plans change**: tôi thực tế: kế hoạch sẽ thay đổi

> Tip: Tránh "I want to be a manager in two years" nếu JD là IC, và tránh "I want your job" — nghe thiếu tinh tế. Người Việt hay nói "in 5 years I will be manager" (thiếu **a**): đúng là "a manager" khi nói một vai trò. Cũng chú ý **five years** đọc /faɪv jɪərz/, nối âm "five-years" nghe như "faiv-iearz".`,
  follow: [
    'Would you rather grow as an individual contributor or as a manager?',
    'What skill are you actively working on right now?',
    'What would make you consider leaving this company in the future?',
  ],
  tags: ['career', 'five-years', 'motivation'],
  lang: 'en',
},
{
  id: 'english-006',
  topic: 'english',
  level: 'senior',
  q: 'Tell me about a time you handled a production incident. What happened, what did you do, and what did you change afterwards?',
  a: `**Tóm tắt:** Dùng **STAR** nhưng dồn trọng tâm vào **A (action) và R (result + follow-up)**. Nêu mức độ ảnh hưởng bằng số, vai trò cụ thể của bạn (không nói "we" suốt câu), một quyết định khó trong lúc sự cố, và **hành động phòng ngừa sau đó**.

### Sample answer
**Situation:** On a Friday evening our payment API started returning 500s for about thirty percent of card payments. Roughly twelve thousand transactions failed in twenty minutes, and the on-call engineer was a junior who had joined three months earlier.

**Task:** I was the senior on call for the week. My job was to stop the bleeding first, then find the cause.

**Action:** I joined the incident bridge, took the communication role so the junior could focus on debugging, and posted updates every five minutes in the incident channel. We saw that errors started right after a config rollout, so I made the call to roll back the config rather than debug forward. That was a judgement call: rollback meant losing the new routing rule for a few hours, but it was clearly safer than continuing to fail payments. Rollback took four minutes and the error rate went back to normal.

**Result:** We lost about twelve thousand transactions, but we replayed them from Kafka the next morning, so no merchant actually lost money. In the postmortem I found the root cause: a new routing rule matched an empty currency field. I added a validation test for every rule and a canary step that sends one percent of traffic for ten minutes before full rollout. We have not had a config-related incident since.

### Useful phrases
- **stop the bleeding first**: cầm máu trước đã
- **I took the communication role**: tôi nhận vai trò liên lạc
- **I made the call to roll back**: tôi quyết định rollback
- **we replayed them from Kafka**: chúng tôi replay từ Kafka
- **no merchant actually lost money**: không merchant nào thực sự mất tiền
- **we have not had an incident since**: từ đó chưa có sự cố nào

> Tip: Đừng kể incident mà **bạn chỉ là người quan sát**; interviewer sẽ đào ngay "what did **you** do?". Cũng đừng giấu thiệt hại — nêu số liệu thật rồi cho thấy bạn kiểm soát được. Thì quá khứ là bắt buộc: "we **saw**", "I **made** the call", không dùng hiện tại. Tập nói cụm "twelve thousand" trôi chảy, đừng đọc từng số.`,
  follow: [
    'What would you have done differently if the rollback had not worked?',
    'Who else was involved, and how did you divide the work?',
    'How do you decide when to roll back versus debug forward?',
  ],
  tags: ['behavioral', 'star', 'incident'],
  lang: 'en',
},
{
  id: 'english-007',
  topic: 'english',
  level: 'senior',
  q: 'Tell me about a disagreement with a teammate or a manager. How did you handle it?',
  a: `**Tóm tắt:** Chọn xung đột **về kỹ thuật/ưu tiên**, không phải xung đột cá nhân. Cấu trúc: bối cảnh → hai quan điểm → **cách bạn tìm dữ liệu để giải quyết** → kết quả → bạn học được gì. Điểm cộng là bạn giữ được quan hệ và vẫn bảo vệ được tiêu chuẩn kỹ thuật.

### Sample answer
We had a disagreement about whether to introduce a shared library for our service-to-service authentication. My tech lead wanted every team to copy a small filter class into each service; I wanted a versioned shared library. His argument was speed and autonomy: teams would not be blocked by library releases. Mine was consistency and security: a copied filter means a security patch has to be applied in nine places.

It got a bit tense in the design review, and I could feel myself pushing too hard. So I stopped arguing in the meeting and asked for one week to collect data. I checked our git history and found that the copied filter already existed in nine services with four slightly different implementations, and one of them had a bug that skipped token expiry. That was the evidence I needed.

I wrote a short document with three options, the cost of each, and a recommendation: a shared library with a documented upgrade path, plus an automated check that fails the build if a service uses a copied filter. My lead agreed, mainly because the bug made the risk concrete. The library shipped two weeks later.

What I took from it is that arguing about principles rarely works; arguing about evidence usually does. And I should have brought data to the first meeting instead of debating.

### Useful phrases
- **we had a disagreement about**: chúng tôi bất đồng về
- **his argument was**: lập luận của anh ấy là
- **it got a bit tense**: mọi thứ hơi căng
- **I stopped arguing and asked for time to collect data**: tôi ngừng tranh luận và xin thời gian thu thập dữ liệu
- **the bug made the risk concrete**: bug đó khiến rủi ro trở nên cụ thể
- **what I took from it is**: điều tôi rút ra là

> Tip: Đừng chọn phe "tôi đúng, sếp sai" — interviewer sẽ nghi bạn khó làm việc nhóm. Cũng đừng nói "I disagreed with my manager" mà không nêu **cách bạn nói chuyện riêng** trước. Ngữ pháp hay sai: "discuss about" là sai, đúng là "discuss" + tân ngữ trực tiếp; "disagree with someone **about/on** something".`,
  follow: [
    'What would you have done if your lead had still said no?',
    'How do you disagree with someone more senior than you without damaging the relationship?',
    'Have you ever changed your mind after a disagreement?',
  ],
  tags: ['behavioral', 'conflict', 'star'],
  lang: 'en',
},
{
  id: 'english-008',
  topic: 'english',
  level: 'lead',
  q: 'Describe a time you mentored someone. How did you structure it, and what was the outcome?',
  a: `**Tóm tắt:** Mentor không phải "dạy kiến thức" mà là **thiết kế trải nghiệm học + trao ownership có kiểm soát**. Kể theo: người được mentor ở đâu → bạn chẩn đoán thiếu gì → kế hoạch cụ thể → kết quả định lượng → bạn học được gì về leadership.

### Sample answer
I mentored a mid-level engineer, Linh, who joined my team with strong Java but almost no production experience. She was smart and fast, but her first on-call week went badly: she escalated everything and apologised for it. The problem was not knowledge, it was confidence and a mental model of the system.

We agreed on a twelve-week plan. First, I had her draw the service topology from memory every week; the gaps in her drawing told us exactly what to explain. Second, I paired with her on two incidents, but with reversed roles: she led, I only asked questions and never touched the keyboard. Third, I gave her a small but real ownership area, the reconciliation report, including talking to the finance team directly.

The turning point was week six, when she found a bug in the retry logic that I had missed in review. That did more for her confidence than any feedback I gave.

By the end of the quarter she was handling on-call alone, and her escalation rate dropped from roughly eight per week to two. She is now the person who onboards new joiners on that service. For me the lesson was that mentoring is mostly about removing yourself at the right pace, not about explaining more.

### Useful phrases
- **I mentored someone**: tôi từng mentor một người
- **a mental model of the system**: mô hình tư duy về hệ thống
- **we agreed on a twelve-week plan**: chúng tôi thống nhất kế hoạch 12 tuần
- **with reversed roles**: đổi vai
- **the turning point was**: bước ngoặt là
- **removing yourself at the right pace**: rút lui đúng nhịp

> Tip: Đừng kể mentor như "tôi chỉ bảo họ đọc tài liệu". Cần **kế hoạch**, **cách đo tiến bộ**, và **kết quả**. **mentor** khi là động từ thì đi thẳng với tân ngữ: "I mentored her", không nói "I mentored for her" hay "mentored to her" (chỉ khi là danh từ mới dùng "a mentor to someone"); cũng đừng dùng "teach" cho toàn bộ quá trình — teach là dạy kỹ năng cụ thể, mentor rộng hơn.`,
  follow: [
    'How did you measure whether the mentoring was working?',
    'What would you do differently with a mentee who was not improving?',
    'How do you balance mentoring with your own delivery work?',
  ],
  tags: ['behavioral', 'mentoring', 'leadership'],
  lang: 'en',
},
{
  id: 'english-009',
  topic: 'english',
  level: 'senior',
  q: 'Tell me about a technical decision you regret. What did you learn from it?',
  a: `**Tóm tắt:** Chọn một quyết định **thật, có hậu quả đo được**, nhưng không phải thảm hoạ. Cấu trúc: bối cảnh + quyết định → giả định sai → hậu quả → bạn sửa thế nào → **nguyên tắc bạn áp dụng từ đó**. Điều interviewer đánh giá là khả năng tự phản tỉnh, không phải việc bạn từng sai.

### Sample answer
About three years ago we had to add full-text search to an internal order tool. The obvious choice was Elasticsearch, but I argued for Postgres full-text search because we already ran Postgres and I did not want another stateful system to operate. On paper that was a reasonable trade-off: fewer moving parts, no sync pipeline, one source of truth.

The mistake was that I made the decision based on our current volume, about two hundred thousand orders, and did not model growth. Within a year we were at four million orders, and the queries started taking two to three seconds because our GIN index no longer fit comfortably in memory. Worse, the ranking quality was poor for Vietnamese text, and fixing it meant custom dictionaries and a lot of tuning.

We eventually moved to Elasticsearch anyway, which meant we paid both the migration cost and the operational cost I had tried to avoid. The migration took six weeks.

What I learned is to write down the assumption behind a decision and the number at which it breaks. Now, in design docs, I always add a section called "when this stops working", with concrete thresholds. It is a small habit, but it has caught two bad decisions since then.

### Useful phrases
- **the obvious choice was**: lựa chọn hiển nhiên là
- **on paper that was a reasonable trade-off**: trên giấy thì đó là đánh đổi hợp lý
- **I made the decision based on our current volume**: tôi ra quyết định dựa trên khối lượng hiện tại
- **which meant we paid both costs**: nghĩa là chúng tôi trả cả hai loại chi phí
- **the assumption behind a decision**: giả định đằng sau một quyết định
- **when this stops working**: khi nào cách này hết hiệu quả

> Tip: Đừng chọn "regret" là lỗi người khác gây ra, và đừng chọn lỗi quá nhỏ ("I used the wrong variable name"). Cũng đừng nói "I regret **to** choose" — sau regret là V-ing khi nói về việc đã làm: "I regret choosing Postgres full-text search" hoặc đơn giản "I regret that decision". Phát âm **regret** nhấn âm tiết thứ hai.`,
  follow: [
    'At what point did you realise the decision was wrong?',
    'How did you convince the team to migrate after arguing against Elasticsearch?',
    'How do you make decisions when you cannot predict growth?',
  ],
  tags: ['behavioral', 'regret', 'decision-making'],
  lang: 'en',
},
{
  id: 'english-010',
  topic: 'english',
  level: 'senior',
  q: 'How do you handle tight deadlines and changing requirements?',
  a: `**Tóm tắt:** Đừng trả lời "tôi làm thêm giờ". Interviewer muốn thấy **quy trình**: làm rõ phạm vi, cắt nhỏ, nói rủi ro sớm, thương lượng trade-off. Kể một ví dụ có **bảng ưu tiên** hoặc **con số** để chứng minh bạn không chỉ chịu đựng mà điều khiển tình huống.

### Sample answer
My first move is always to separate the deadline from the scope, because usually only one of them is truly fixed. If the deadline is a regulatory date, it is fixed and scope has to move. If it is a demo date, maybe we can ship a narrower slice.

On my last project we had six weeks to deliver a merchant onboarding flow before a partner launch. Two weeks in, the partner added a requirement: support for three document types instead of one. My instinct was to say yes and work harder, but instead I did a quick impact estimate: the extra types added about nine days, which we did not have.

So I went to the product owner with three options: drop the reporting dashboard from the release, delay the launch by two weeks, or support one extra document type now and the others three weeks later. I also showed which option carried the most risk for the partner. We chose the third one, and I wrote it down in the release notes so nobody was surprised.

We shipped on time. The part I am proudest of is not the delivery, it is that nobody worked a weekend. The way I see it, a deadline is a constraint to design around, not a reason to skip the conversation.

### Useful phrases
- **my first move is to**: việc đầu tiên tôi làm là
- **separate the deadline from the scope**: tách deadline khỏi phạm vi
- **added about nine days**: thêm khoảng chín ngày công
- **I went to the product owner with three options**: tôi đến gặp PO với ba phương án
- **nobody was surprised**: không ai bị bất ngờ
- **a constraint to design around**: một ràng buộc để thiết kế xoay quanh

> Tip: Tránh câu "I work well under pressure" mà không có ví dụ — sáo rỗng. Người Việt hay dịch "chạy deadline" thành "run deadline" (sai); đúng là "meet a deadline" hoặc "work to a tight deadline". Cũng chú ý phát âm **deadline** /ˈdedlaɪn/, không phải "đét-lai".`,
  follow: [
    'What do you do when the product owner refuses to cut scope?',
    'How do you communicate a slipping deadline without losing trust?',
    'Have you ever said no to a deadline? What happened?',
  ],
  tags: ['behavioral', 'deadline', 'requirements'],
  lang: 'en',
},
{
  id: 'english-011',
  topic: 'english',
  level: 'senior',
  q: 'Explain how HashMap works internally in Java. Why is the average lookup O(1), and what happens when two keys collide?',
  a: `**Tóm tắt:** Đi theo chuỗi: **hash → spread → index → bucket → collision → treeify → resize**. Nêu các con số then chốt (load factor 0.75, treeify 8, untreeify 6, min capacity 64) và giải thích **vì sao** từng cơ chế tồn tại. Kết thúc bằng worst case và ảnh hưởng tới lựa chọn ban đầu.

### Sample answer
A HashMap is an array of buckets. When you call put, Java takes the key hash, applies a spread function that XORs the high bits into the low bits, and computes the index as the hash AND the array length minus one. That AND works because capacity is always a power of two, making it a cheaper modulo. That is the O(1) path: compute an index and look in one bucket.

Collisions happen when two different keys land in the same bucket. Java 8 and later store them first in a linked list. When a bucket reaches eight entries **and** the table has at least sixty-four buckets, it converts that bucket into a red-black tree, so lookup degrades to O(log n) instead of O(n). If the table is smaller than sixty-four, it resizes instead of treeifying, because resizing is the cheaper fix at that size.

The other important mechanism is resizing. The default load factor is 0.75, so when the map is 75 percent full, capacity doubles and every entry is redistributed. In Java 8 that redistribution is clever: each entry either stays at the same index or moves to index plus the old capacity, so you do not need to recompute hashes.

The worst case is still O(n) if all keys have the same hash and do not implement Comparable, because the tree cannot order them and a lookup may have to search both subtrees. So if you know the size, create the map with the right initial capacity to avoid repeated resizing.

### Useful phrases
- **an array of buckets**: một mảng các bucket
- **the spread function**: hàm trải hash
- **equivalent to a modulo but cheaper**: tương đương modulo nhưng rẻ hơn
- **collisions happen when**: xung đột xảy ra khi
- **degrades to O(log n)**: giảm xuống O(log n)
- **redistributed**: được phân bổ lại

> Tip: Đừng nói "HashMap dùng hashCode để tìm index" rồi dừng — thiếu spread function và power-of-two là mất điểm. Cũng đừng nhầm **load factor** với **capacity**. Tiếng Anh: "hash" đọc /hæʃ/, và **collision** nhấn âm thứ hai /kəˈlɪʒn/; nhiều bạn đọc "co-li-sion" nghe rất lạ.`,
  follow: [
    'What happens if two keys have the same hashCode but are not equal?',
    'Why is the initial capacity of a HashMap not just set to the expected size?',
    'How does ConcurrentHashMap differ internally from HashMap?',
  ],
  tags: ['java', 'collections', 'hashmap'],
  lang: 'en',
},
{
  id: 'english-012',
  topic: 'english',
  level: 'senior',
  q: 'Explain the difference between optimistic and pessimistic locking. When would you choose one over the other?',
  a: `**Tóm tắt:** Nói rõ **cơ chế** (version check vs giữ lock ở DB), **chi phí** (retry vs chờ/block), **khi nào dùng** (contention thấp vs cao, nghiệp vụ có thể retry vs không), và **bẫy** (lost update, deadlock, lock escalation). Ví dụ nên gắn với JPA/Hibernate vì đó là môi trường thật.

### Sample answer
Pessimistic locking means you take a lock in the database before you read the row, for example with SELECT FOR UPDATE. In JPA you use LockModeType.PESSIMISTIC_WRITE. Other transactions that try to update the same row block until you commit, so you are guaranteed that nobody changes the data under you. The cost is waiting, and under high contention you get long queues and sometimes deadlocks.

Optimistic locking does not lock anything. You read the row with a version column, and when you update, you include the version in the WHERE clause. If someone else updated the row in between, zero rows are affected and Hibernate throws an OptimisticLockException; your application retries or asks the user to reload. With JPA you just annotate a field with @Version. The cost is that you must handle retries, and retries can be expensive if they hit external systems.

My rule of thumb: optimistic by default, because most rows are not contended and locks are a scalability tax. I switch to pessimistic when the operation cannot be retried safely or when contention is genuinely high, for example decrementing a limited inventory counter or generating a sequential number. I also keep transactions short, because a pessimistic lock is only as short as the transaction holding it.

One pitfall: optimistic locking does not protect you across multiple rows unless you design it that way, and a retry that replays a payment can double-charge unless the operation is idempotent.

### Useful phrases
- **take a lock in the database**: giữ lock trong database
- **other transactions block until you commit**: giao dịch khác bị chặn đến khi bạn commit
- **under high contention**: khi tranh chấp cao
- **zero rows are affected**: không dòng nào bị ảnh hưởng
- **my rule of thumb**: nguyên tắc kinh nghiệm của tôi
- **a lock is only as short as the transaction**: lock chỉ ngắn bằng giao dịch giữ nó

> Tip: Đừng nói optimistic locking "nhanh hơn" một cách tuyệt đối — nó nhanh khi contention thấp, nhưng retry storm có thể tệ hơn. Cũng đừng nhầm **optimistic** (lạc quan) với **optimal** (tối ưu) — hai từ khác nghĩa, phát âm cũng khác. Dùng đúng giới từ: "lock **on** a row", "contend **for** a row".`,
  follow: [
    'How do you implement retry with optimistic locking in Spring without duplicating side effects?',
    'What causes a deadlock with pessimistic locking, and how do you reduce it?',
    'How would you protect a counter that thousands of requests update per second?',
  ],
  tags: ['database', 'locking', 'jpa', 'concurrency'],
  lang: 'en',
},
{
  id: 'english-013',
  topic: 'english',
  level: 'lead',
  q: 'How would you design a scalable REST API? And how do you make a create endpoint idempotent?',
  a: `**Tóm tắt:** Trả lời hai phần. **Thiết kế:** stateless, resource-oriented, pagination, versioning, rate limit, cache, async cho tác vụ dài. **Idempotency:** client gửi Idempotency-Key, server lưu key + fingerprint + response trong bảng có unique constraint, trả lại response cũ khi trùng. Nêu cả race condition và TTL.

### Sample answer
I would start with the contract, not the framework. Resources are nouns, verbs come from HTTP methods, and errors are consistent: a problem-details body with a stable error code, so clients do not parse English messages. Every list endpoint needs cursor pagination rather than offset, because offset gets slower and inconsistent as the table grows.

For scalability, the API tier stays stateless so it can scale horizontally. Rate limiting is per client and per endpoint at the gateway. Read-heavy endpoints get caching with clear invalidation, and long-running operations return 202 with a status URL instead of holding the connection. Versioning is in the path for breaking changes only; additive changes do not need it.

For idempotency, the client sends an Idempotency-Key header, usually a UUID. On the first request the server inserts a row with that key, a hash of the request body, and the status IN_PROGRESS, using a unique constraint on the key. If the insert fails because the key exists, we inspect the stored row: a different body hash means 422; a stored response is replayed exactly; in-progress means 409 and the client retries later. When the operation finishes, we store the response body and status, and expire the row after twenty-four hours.

The subtle part is that the insert and the business transaction must not leave a half-written state, so we use the same transaction or a state machine with recovery. The key must also be scoped per client, or one tenant can block another.

### Useful phrases
- **I would start with the contract, not the framework**: tôi bắt đầu từ hợp đồng API, không phải framework
- **cursor pagination rather than offset**: phân trang bằng cursor thay vì offset
- **the API tier stays stateless**: tầng API không giữ trạng thái
- **additive changes**: thay đổi kiểu bổ sung
- **replay it exactly**: trả lại đúng response cũ
- **scoped per client**: giới hạn theo từng client

> Tip: Đừng nói "idempotent" mà chỉ giải thích bằng ví dụ PUT; interviewer hỏi POST vì đó mới là chỗ khó. Cũng đừng bỏ qua **race condition** — hai request cùng key đến đồng thời là câu hỏi tiếp gần như chắc chắn. Phát âm **idempotent** /ˌaɪdəmˈpoʊtənt/ (không phải "i-đem-po-tent"), và **pagination** /ˌpædʒɪˈneɪʃn/.`,
  follow: [
    'What happens if the first request with an idempotency key crashes before it stores the result?',
    'How would you handle idempotency across two services in a saga?',
    'Why not just use a database unique constraint on a business key instead?',
  ],
  tags: ['api-design', 'idempotency', 'system-design'],
  lang: 'en',
},
{
  id: 'english-014',
  topic: 'english',
  level: 'lead',
  q: 'A non-technical stakeholder asks why we should not split everything into microservices. How would you explain the trade-offs without jargon?',
  a: `**Tóm tắt:** Đây là bài kiểm tra **giao tiếp**, không phải kiến trúc. Tránh thuật ngữ; dùng **ẩn dụ + chi phí + điều kiện**. Nêu monolith tốt khi nào, microservices đáng giá khi nào (nhiều team, scale khác nhau, deploy độc lập), và luôn quy ra **tiền/thời gian/rủi ro**.

### Sample answer
I would use a building analogy. A monolith is one office with one front door, one security desk and one electricity bill. Everybody works in the same building, so it is cheap to run and easy to change the layout. Microservices are separate buildings, each with its own front door, security desk and utility bill. That is great when you have many teams that need to enter and leave without waiting for each other, but you now pay for every door, every guard and every connection between buildings.

Then I would put numbers on it. Today we have one team of eight engineers and about six deployments a week. Splitting into ten services would give us ten pipelines, ten sets of alerts, ten on-call rotations and a network hop between every step. In my experience that adds roughly twenty to thirty percent operational overhead before we write a single feature, and it makes debugging slower because one request crosses five systems.

I would also be clear about when the split does pay off: when one part needs to scale very differently, when releases block each other every week, or when separate teams keep stepping on each other's code. We are not there yet. So my recommendation is to keep the monolith but enforce clear module boundaries, so that when we do need to split, it is a two-week change rather than a two-year rewrite.

### Useful phrases
- **I would use a building analogy**: tôi sẽ dùng phép so sánh với toà nhà
- **put numbers on it**: gắn con số cụ thể vào
- **operational overhead**: chi phí vận hành tăng thêm
- **before we write a single feature**: trước khi viết được tính năng nào
- **when the split does pay off**: khi việc tách thực sự có lợi
- **enforce clear module boundaries**: giữ ranh giới module rõ ràng

> Tip: Người Việt hay dùng "microservice" như một từ tiếng Việt và nói "chia ra microservice" — khi nói tiếng Anh phải là "split into microservices" (số nhiều). Tránh nói "it depends" rồi dừng; stakeholder cần **một khuyến nghị**. Và đừng dạy lại định nghĩa — họ hỏi để ra quyết định, không phải để học kiến trúc.`,
  follow: [
    'How would you know the moment has come to split the monolith?',
    'What would you say if the stakeholder had already promised microservices to the board?',
    'How do you explain the cost of a network call to someone who only thinks in money?',
  ],
  tags: ['communication', 'microservices', 'stakeholder'],
  lang: 'en',
},
{
  id: 'english-015',
  topic: 'english',
  level: 'senior',
  q: 'An API is slow in production. Walk me through how you would troubleshoot it.',
  a: `**Tóm tắt:** Trình bày theo thứ tự **đo → khoanh vùng → xác nhận → sửa → phòng ngừa**. Bắt đầu từ triệu chứng và số liệu (p50/p95/p99, error rate, traffic), rồi đi qua các tầng: gateway, app (GC, thread pool, connection pool), downstream, database. Nêu công cụ cụ thể và một quy tắc an toàn khi thao tác trên production.

### Sample answer
First I would define "slow" with numbers. Is it p99 or the average? Is it every request or one endpoint? Did it start suddenly or drift over weeks? I would pull the dashboard: latency percentiles, error rate, request rate, and the deploy timeline. The deploy timeline alone solves a surprising number of incidents.

Then I would localise the layer. If latency is high but CPU is low, we are waiting on something: a downstream call, a database lock, or a connection pool. If CPU is high, I look at GC logs and thread dumps. A few full thread dumps ten seconds apart tell me whether threads are blocked on a socket, waiting on a lock, or spinning. I use distributed tracing to find which span owns the time; that usually narrows five services down to one in a couple of minutes.

If it is the database, I check the slow query log, the execution plan, and whether the plan changed after a statistics update. I have seen a query go from ten milliseconds to two seconds because an index stopped being used once the data became skewed.

While investigating I keep production safe: read-only commands, no profiling on every node, and if the impact is severe I roll back first and investigate after. After the fix I add an alert on the actual symptom, for example p99 above one second for five minutes, not just on CPU.

### Useful phrases
- **define "slow" with numbers**: định nghĩa "chậm" bằng số
- **the deploy timeline alone solves a surprising number of incidents**: chỉ riêng timeline deploy đã giải quyết nhiều sự cố
- **we are waiting on something**: chúng ta đang chờ thứ gì đó
- **a few full thread dumps**: vài thread dump đầy đủ
- **which span owns the time**: span nào đang chiếm thời gian
- **roll back first and investigate after**: rollback trước, điều tra sau

> Tip: Đừng nhảy ngay vào "I would add more servers" — đó là che triệu chứng. Cũng đừng nói "I would restart the service" mà không giải thích rủi ro. Tiếng Anh: **latency** /ˈleɪtənsi/ không phải "la-tên-si"; phân biệt **p99** đọc "p ninety-nine". Dùng "slow query log" chứ không phải "slow query logs" khi nói về công cụ.`,
  follow: [
    'How do you tell whether the bottleneck is the JVM or the database?',
    'What would you do if the problem only happens under load you cannot reproduce?',
    'Which metrics would you put on the dashboard to catch this earlier next time?',
  ],
  tags: ['troubleshooting', 'performance', 'production'],
  lang: 'en',
},
{
  id: 'english-016',
  topic: 'english',
  level: 'senior',
  q: 'How do you use AI tools in your daily development work? What do you trust them with, and what do you not?',
  a: `**Tóm tắt:** Trả lời cân bằng: **dùng thật, cụ thể, có kiểm chứng**. Nêu việc phù hợp (viết test, đọc code lạ, chuyển đổi cú pháp, gợi ý regex, viết docs), việc không giao (quyết định kiến trúc, logic tiền bạc, secrets, dữ liệu khách hàng), và **quy trình xác minh**. Tránh thái độ "AI thay được dev".

### Sample answer
I use AI tools every day, but as a fast junior assistant, not as an authority. My most common use is tests: I give it a class and ask for edge cases I might have missed, then I rewrite the ones that do not fit. It is very good at generating the boring eighty percent, which frees me for the twenty percent that needs judgement.

I also use it to read unfamiliar code. When I join a new service, I ask it to summarise a package or explain a complex JPQL query, then I verify by reading the actual code. For boilerplate like mapping DTOs or writing a Dockerfile, it saves maybe thirty to forty minutes a day.

What I do not do is paste production data, customer information, credentials or proprietary business logic into a public model, and I do not let it make architectural decisions. It does not know our constraints, our traffic profile or our team. I also never merge generated code without reading every line, because the failure mode is confident, plausible code that passes a quick look and fails at the boundary.

The rule I follow is simple: AI can propose, but I am still the one who signs the commit. If I cannot explain a line to a reviewer, it does not go in.

### Useful phrases
- **as a fast junior assistant, not as an authority**: như một trợ lý nhanh, không phải chuyên gia có thẩm quyền
- **edge cases I might have missed**: các trường hợp biên tôi có thể bỏ sót
- **it saves maybe thirty minutes a day**: tiết kiệm khoảng ba mươi phút mỗi ngày
- **confident, plausible code**: code trông tự tin và hợp lý
- **I never merge generated code without reading every line**: tôi không bao giờ merge code sinh ra mà không đọc từng dòng
- **I am the one who signs the commit**: tôi là người chịu trách nhiệm commit

> Tip: Đừng trả lời "I don't use AI" (nghe lạc hậu) hoặc "AI writes all my code" (nghe thiếu trách nhiệm). Nêu **ranh giới dữ liệu** là điểm cộng lớn với công ty nước ngoài, vì họ lo compliance. Phát âm **authority** /əˈθɒrəti/ nhấn âm hai, và **proprietary** /prəˈpraɪətri/ — hai từ này người Việt hay đọc sai trọng âm.`,
  follow: [
    'Can you give an example where AI gave you a wrong answer? How did you catch it?',
    'Does your company have a policy on AI tools and customer data?',
    'Do you think AI changes what a senior engineer should be good at?',
  ],
  tags: ['ai', 'workflow', 'tooling'],
  lang: 'en',
},
{
  id: 'english-017',
  topic: 'english',
  level: 'mid',
  q: 'In a live coding or system design round, how do you politely buy time and clarify the question? And how do you think aloud without rambling?',
  a: `**Tóm tắt:** Đây là câu hỏi **meta**: interviewer muốn nghe bạn có chiến lược giao tiếp khi bí. Trả lời bằng cấu trúc **3 bước**: xác nhận lại đề bằng lời của mình → hỏi 1–2 câu làm rõ có mục đích → nói ra giả định rồi mới code. Kèm các câu mẫu thật và cách kiểm soát độ dài khi think aloud.

### Sample answer
I use a three-step habit. First, I repeat the problem in my own words: "So just to make sure I understand, you want me to return the top K merchants by volume, and K can be larger than the number of merchants." That buys me ten seconds and catches misunderstandings early, which is worth more than ten seconds.

Second, I ask at most two clarifying questions, and I explain why I am asking: "Is the input already sorted? That decides whether I need a heap or can just take the first K." A question with a reason sounds senior; a stream of questions sounds unprepared.

Third, I state my assumptions before writing code: "I will assume the list fits in memory and that we care about time more than space." Then I talk through the approach in three sentences, and only after that do I start typing. While coding I narrate decisions, not syntax: "I am using a map here because I need O(1) lookup by ID."

When I get stuck, I say so directly: "Let me think about the edge case for thirty seconds." Silence for half a minute is fine if I announced it; silence for three minutes is not. If I truly do not know something, I say "I have not used that API, but here is how I would find out" — that is a better answer than inventing one.

### Useful phrases
- **just to make sure I understand**: để chắc là tôi hiểu đúng
- **let me repeat that in my own words**: để tôi nhắc lại bằng lời của mình
- **that buys me ten seconds**: như vậy tôi có thêm mười giây
- **I will state my assumptions first**: tôi sẽ nêu giả định trước
- **let me think about the edge case for thirty seconds**: cho tôi nghĩ về edge case khoảng ba mươi giây
- **here is how I would find out**: đây là cách tôi sẽ tìm ra

> Tip: Đừng im lặng quá lâu rồi đột ngột viết code — interviewer không biết bạn đang nghĩ hay đang bí. Cũng đừng xin nhắc lại bằng "What?" hay "Sorry, I don't understand" mãi; dùng "Could you clarify what you mean by...?" Người Việt hay nói "Can you repeat again?" — sai, đúng là "Could you repeat that?" hoặc "Could you say that again?".`,
  follow: [
    'What do you do if the interviewer gives you a hint you do not understand?',
    'How do you handle it when you realise halfway through that your approach is wrong?',
    'Do you prefer to write pseudocode first or code directly? Why?',
  ],
  tags: ['interview-skills', 'communication', 'live-coding'],
  lang: 'en',
},
{
  id: 'english-018',
  topic: 'english',
  level: 'senior',
  q: 'What questions do you ask the interviewer at the end? Give me three you would actually use for a senior backend role.',
  a: `**Tóm tắt:** Câu hỏi cuối là **cơ hội cuối để ghi điểm** — hỏi về công việc thật, đội ngũ, cách ra quyết định, chứ không hỏi lương/benefit ở vòng kỹ thuật. Chọn 3 câu thể hiện bạn nghĩ như người sẽ **làm việc ở đó**: on-call, tech debt, cách đo thành công, quyền quyết định kỹ thuật.

### Sample answer
I usually prepare five and ask three, depending on how the conversation went.

The first is about the reality of the work: "What does a typical on-call week look like for this team, and what caused the last incident?" That tells me more about engineering health than any architecture diagram. If the answer is "we get paged every night", I know what I am signing up for.

The second is about decisions: "Who decides when there is a disagreement about architecture, and can you give me an example from the last six months?" I want to know whether engineers have real influence or whether decisions come from above.

The third is about success: "How would you know in six months that you had hired the right person for this role?" That question is useful for me too, because it tells me exactly what they will evaluate me on.

If the interview went well, I might also ask why the previous person left and what the team's biggest technical debt is. Those are direct, but a good interviewer respects directness. I avoid salary, holidays and remote policy in the technical round; those belong to HR and asking them early can make the conversation feel transactional.

### Useful phrases
- **I usually prepare five and ask three**: tôi thường chuẩn bị năm câu và hỏi ba
- **the reality of the work**: thực tế công việc
- **engineering health**: sức khoẻ kỹ thuật của đội
- **what I am signing up for**: điều tôi đang nhận lấy
- **the team's biggest technical debt**: món nợ kỹ thuật lớn nhất của đội
- **that belongs to HR**: việc đó thuộc về HR

> Tip: Đừng nói "I have no questions" — interviewer đọc đó là thiếu quan tâm. Cũng đừng hỏi câu mà câu trả lời có sẵn trên website ("What does your company do?"). Chú ý **on-call** đọc /ˈɒn kɔːl/, và câu hỏi đuôi không cần thiết; hỏi trực tiếp ngắn gọn nghe chuyên nghiệp hơn.`,
  follow: [
    'What would you ask if the interviewer seemed rushed?',
    'How do you evaluate whether a team has a healthy on-call culture?',
    'Is it appropriate to ask about the previous person who held the role?',
  ],
  tags: ['interview-skills', 'questions', 'culture'],
  lang: 'en',
},
{
  id: 'english-019',
  topic: 'english',
  level: 'senior',
  q: 'What are your salary expectations, and when could you start? How do you handle the notice period conversation?',
  a: `**Tóm tắt:** Đừng nêu một con số duy nhất và đừng nói "up to you". Cách an toàn: **hỏi khoảng budget của vị trí → đưa range dựa trên thị trường → tách lương khỏi phúc lợi → nói rõ notice period theo hợp đồng**. Giữ giọng hợp tác, không đối đầu, và luôn xác nhận bằng văn bản sau đó.

### Sample answer
I usually answer with a range and a reason, not a single number. Something like: "Based on my research for senior backend roles in Ho Chi Minh City with this level of ownership, I am targeting a range of fifty-five to sixty-five million VND gross per month. I am flexible depending on the whole package, especially the bonus and the learning opportunity, but that is the range where I can say yes quickly."

If they ask first, I politely turn it around once: "Could you share the budgeted range for the role? That would help me tell you honestly whether we are aligned." That is not a trick; it avoids wasting both sides' time.

On notice, I am transparent: "My contract requires forty-five days, and I would not leave before handing over properly. So if we sign this week, I could start in about seven weeks." I also mention that I would rather not use my remaining leave to shorten it, because a clean handover matters to me.

If the offer is below my range, I do not negotiate emotionally. I say what would make it work: a higher base, a signing bonus, or a review after six months. And I always ask for the offer in writing before I resign.

### Useful phrases
- **I am targeting a range of**: tôi đang nhắm khoảng
- **depending on the whole package**: tuỳ vào toàn bộ gói đãi ngộ
- **could you share the budgeted range**: anh/chị có thể chia sẻ khoảng ngân sách không
- **that would help me tell you honestly**: điều đó giúp tôi trả lời trung thực
- **my contract requires forty-five days**: hợp đồng của tôi yêu cầu 45 ngày
- **a clean handover matters to me**: bàn giao sạch sẽ quan trọng với tôi

> Tip: Đừng nói "I want salary negotiable" — nghe như chưa chuẩn bị. Cũng đừng nêu **net** khi công ty hỏi **gross** (hoặc ngược lại) — chênh 10–20% và làm lệch cả cuộc đàm phán. Tiếng Anh: **notice period** (không phải "notice time"), **probation** (thử việc), **gross/net salary**. Phát âm **salary** /ˈsæləri/ nhấn âm đầu, không phải "sa-la-ry" đều nhau.`,
  follow: [
    'What if they offer below your range but promise a review in six months?',
    'How do you value equity or a bonus against base salary?',
    'Would you resign before signing the new contract? Why or why not?',
  ],
  tags: ['salary', 'negotiation', 'notice-period'],
  lang: 'en',
},
);
