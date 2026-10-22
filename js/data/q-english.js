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
{
  id: 'english-020',
  topic: 'english',
  level: 'senior',
  q: 'Explain the CAP theorem and eventual consistency to the interviewer with a concrete example from a system you have worked on.',
  a: `**Tóm tắt:** CAP nói rằng khi mạng bị chia cắt (partition), hệ thống phân tán phải chọn giữa Consistency (mọi lần đọc thấy bản ghi mới nhất — linearizable) và Availability (mọi request tới node còn sống đều nhận phản hồi). Partition là không tránh được, nên lựa chọn thực tế là CP hay AP **trong lúc có partition**. Eventual consistency là chọn AP: dữ liệu sẽ nhất quán sau một khoảng thời gian, không phải ngay lập tức.

### Sample answer
The CAP theorem says that when a network partition happens, a distributed system has to choose between consistency and availability. Since partitions **will** happen in production, the real choice is CP, where some requests fail so that nobody reads stale data, or AP, where every node keeps answering even if some answers are stale.

Eventual consistency means that if no new writes come in, all replicas will eventually converge to the same value. There is no fixed bound on how long that takes, and the trade-off is that readers may see stale data in the meantime.

In our payment gateway, we had a service that routed transactions to acquirers based on a rules engine stored in PostgreSQL and cached in Redis across two regions. We chose AP for the rules cache: reads from Redis were always available even if the cross-region link was down. If a rule changed in region A, it propagated to region B via a Kafka topic with at-least-once delivery. The cache TTL was five seconds, so the maximum inconsistency window was about five seconds plus replication lag.

One incident showed the cost: a rule disabling a high-risk acquirer was updated in region A, but the cache in region B still served the old rule for four seconds. During those four seconds, twenty transactions were routed to the disabled acquirer and failed. We fixed it by adding a synchronous invalidation webhook for critical rules, and by making the acquirer adapter idempotent so retries did not double-charge.

### Useful phrases
- **the real choice is CP or AP**: lựa chọn thực tế là CP hay AP
- **partition tolerance is mandatory**: chịu đựng partition là bắt buộc
- **stale data during that window**: dữ liệu cũ trong khoảng thời gian đó
- **at-least-once delivery**: giao ít nhất một lần (có thể trùng)
- **maximum inconsistency window**: cửa sổ không nhất quán tối đa
- **synchronous invalidation**: vô hiệu hóa đồng bộ

> Senior tip: Đừng giải thích CAP bằng hình vẽ tam giác rồi dừng — interviewer muốn nghe **bạn đã chọn gì và tại sao**. Cảnh báo: "eventually consistent" **không** có nghĩa là "sẽ nhất quán trong 1 giây"; có thể là phút, thậm chí giờ nếu bị lỗi. Luôn hỏi: "What is the maximum staleness your business can tolerate?" rồi thiết kế theo con số đó.`,
  follow: [
    'How would you handle a financial transaction that cannot tolerate any inconsistency?',
    'What happens if the eventual consistency window is violated — say, the replica is down for an hour?',
    'Can you give an example where you chose CP over AP and why?',
  ],
  tags: ['cap-theorem', 'eventual-consistency', 'distributed-systems', 'system-design'],
  lang: 'en',
},
{
  id: 'english-021',
  topic: 'english',
  level: 'lead',
  q: 'Walk me through how you would design a URL shortener. Explain your choices for storage, encoding, and scaling.',
  a: `**Tóm tắt:** URL shortener cần: **mapping key → URL gốc** (độc nhất), **redirect nhanh** (p99 < 50ms), **tạo key không trùng**, **hệ thống scale ngang**. Cốt lõi là thiết kế key space, chọn storage, và xử lý hot key.

### Sample answer
**Functional requirements:** shorten a long URL to a short key (e.g., short.ly/abc123), redirect with {{301/302}}, optionally track clicks. **Non-functional:** high read throughput (100M+ redirects/day), low latency, durable, custom aliases optional.

**Key generation:** I would use base62 (a-z, A-Z, 0-9) with length 7, giving {{62^7}} ≈ 3.5 trillion combinations — enough for years. Two approaches: (1) generate random keys and rely on the unique index, retrying on the rare collision; (2) use a distributed ID generator like Snowflake and encode the ID in base62. I prefer (1) because it is simpler, the keys are not guessable, and with a good random source collisions are rare enough that a single retry handles them. For custom aliases, validate uniqueness at write time.

**Storage:** The mapping table is simple ({{key}}, {{long_url}}, {{created_at}}, {{owner_id}}, {{expires_at}}). A single PostgreSQL instance with a unique index on {{key}} easily handles hundreds of millions of rows. For the read-heavy redirect path, I would put a Redis cache in front with a 24-hour TTL. Cache key = short key, value = long URL. On cache miss, query Postgres and populate cache. Write path: insert to Postgres, invalidate cache (or rely on TTL).

**Scaling reads:** Redis Cluster shards by key (CRC16 of the key, mapped to 16,384 hash slots), so normal traffic is spread evenly across shards. If a specific URL goes viral (hot key), add a local in-memory cache (Caffeine) on the API instances for the top 1000 keys — this absorbs the spike without touching Redis.

**Scaling writes:** The write QPS is low (creating short URLs). Single Postgres writer with connection pooling is fine. If needed, shard by {{owner_id}}.

**Analytics:** Fire click events to Kafka, aggregate in Flink/Spark to a time-series DB (TimescaleDB) or OLAP (ClickHouse). Do not update a counter on every redirect — that creates a hot row and lock contention.

**Failure modes:** If Redis is down, fall back to Postgres directly (slightly higher latency but available). If Postgres is down, creating new short URLs fails, but redirects for links that are already cached keep working.

### Useful phrases
- **base62 encoding**: mã hóa base62
- **collision probability**: xác suất va chạm
- **cache aside pattern**: mẫu cache aside
- **hot key problem**: vấn đề hot key
- **write path vs read path**: đường ghi vs đường đọc
- **time-series database**: cơ sở dữ liệu chuỗi thời gian

> Senior tip: Câu hỏi này kiểm tra **system design communication** — hãy nói theo cấu trúc: Requirements → API contract → Data model → Storage → Scaling → Failure handling. Đừng chỉ nêu công nghệ. Phân biệt **301 (Moved Permanently)** — browser cache redirect, phù hợp URL ngắn bền vững — và **302 (Found)** — không cache, dùng khi cần tracking chính xác mỗi click.`,
  follow: [
    'How would you handle a custom alias that a user wants but is already taken?',
    'What if the short URL needs to expire after a certain number of clicks or a date?',
    'How do you prevent abuse (spam, phishing) without slowing down legitimate users?',
  ],
  tags: ['system-design', 'url-shortener', 'scaling', 'caching'],
  lang: 'en',
},
{
  id: 'english-022',
  topic: 'english',
  level: 'senior',
  q: 'Explain how Kafka guarantees ordering and what happens when a consumer crashes.',
  a: `**Tóm tắt:** Kafka đảm bảo ordering **trong một partition** bằng offset tăng dần. Producer gửi cùng key → cùng partition → thứ tự được bảo toàn (với {{enable.idempotence=true}}, mặc định từ Kafka 3.0, retry không làm đảo thứ tự). Consumer crash: group rebalance xảy ra, partition được assign lại cho consumer khác, tiếp tục từ offset đã commit. Message đã xử lý nhưng chưa commit offset sẽ bị xử lý lại (at-least-once). Cần idempotent consumer hoặc Kafka transactions để tránh duplicate.

### Sample answer
Kafka ordering guarantee is per partition. When you send messages with the same key, Kafka hashes the key to determine the partition, so all messages for that key go to the same partition and are appended in order. The broker assigns a monotonically increasing offset to each message within that partition, and consumers read the partition in offset order. On the producer side, idempotence (enabled by default since Kafka 3.0) makes sure retries do not reorder or duplicate messages.

If a consumer crashes, the group coordinator (a broker) detects it when heartbeats stop arriving within {{session.timeout.ms}} (45 seconds by default since Kafka 3.0; heartbeats are sent every 3 seconds). A consumer that is alive but stuck is kicked out when it exceeds {{max.poll.interval.ms}} (5 minutes by default). It triggers a rebalance: the partitions owned by the crashed consumer are reassigned to the remaining consumers in the group. The new consumer starts reading from the last committed offset of that partition.

The critical question is: **when do you commit offsets?** With {{enable.auto.commit=true}} (the default in the plain Kafka client, while Spring Kafka turns it off and commits for you), offsets are committed periodically during {{poll()}}, every 5 seconds by default. If the consumer crashes between processing and auto-commit, the new consumer will reprocess those messages — this is at-least-once delivery. If you commit before processing and the consumer crashes after commit but before finishing, you lose messages — at-most-once.

To get effectively-once processing, you have two options: (1) make the consumer idempotent — store processed message IDs in the database with a unique constraint and skip duplicates; (2) if the output goes back to Kafka, use Kafka transactions: produce the output and commit the consumed offsets in one transaction, and have downstream consumers read with {{isolation.level=read_committed}}. Note that Kafka transactions do not cover writes to an external database.

In our payment system, we used the idempotent approach: each payment event has a unique {{event_id}}. The consumer writes the payment record with {{event_id}} as a unique key. When a duplicate arrives, the insert hits the unique constraint ({{ON CONFLICT DO NOTHING}} in Postgres), so we skip it and just increment a metric. This is simpler than transactions and works well for high-throughput event processing.

### Useful phrases
- **per-partition ordering**: đảm bảo thứ tự theo partition
- **consumer group rebalance**: cân bằng lại nhóm consumer
- **heartbeat timeout**: thời gian chờ heartbeat
- **at-least-once vs at-most-once**: ít nhất một lần vs nhiều nhất một lần
- **effectively-once processing**: xử lý coi như đúng một lần
- **idempotent consumer**: consumer lũy đẳng (nhận trùng vẫn cho cùng kết quả)

> Senior tip: Đừng nói "Kafka đảm bảo ordering" mà quên thêm **"trong một partition"**. Đó là bẫy kinh điển. Cũng nhớ: **tăng số partition** sẽ đổi ánh xạ key → partition, nên thứ tự của một key có thể bị phá trong lúc chuyển. Và nếu mỗi consumer là một group riêng thì mỗi consumer nhận **toàn bộ** message — không chia tải được. Về offset: **commit sau khi xử lý xong + idempotent** là an toàn nhất cho hầu hết use case. Spring Kafka mặc định {{AckMode.BATCH}} (commit sau khi listener xử lý xong batch); {{RECORD}} commit sau từng record; {{MANUAL_IMMEDIATE}} thì bạn tự gọi {{Acknowledgment.acknowledge()}} trong {{@KafkaListener}}.
`,
  follow: [
    'How would you handle ordering across multiple partitions for the same business entity?',
    'What is the difference between {{enable.auto.commit}} and manual commit with {{AckMode.MANUAL_IMMEDIATE}}?',
    'How does Kafka exactly-once-semantics (EOS) work internally with the transaction coordinator?',
  ],
  tags: ['kafka', 'messaging', 'ordering', 'consumer-group'],
  lang: 'en',
},
{
  id: 'english-023',
  topic: 'english',
  level: 'senior',
  q: 'Explain transaction isolation levels and a bug you saw because of them.',
  a: `**Tóm tắt:** SQL định nghĩa 4 mức isolation: Read Uncommitted, Read Committed, Repeatable Read, Serializable. Mức càng cao càng an toàn nhưng càng kém throughput do lock/contention. PostgreSQL mặc định Read Committed, MySQL/InnoDB mặc định Repeatable Read. Bug thường gặp: lost update (Read Committed), phantom read (Repeatable Read theo chuẩn SQL), write skew (snapshot isolation như Repeatable Read của Postgres vẫn cho phép; chỉ Serializable hoặc lock tường minh mới ngăn được).

### Sample answer
The four standard isolation levels, from weakest to strongest:
1. **Read Uncommitted** — can read uncommitted changes from other transactions (dirty reads). Rarely used.
2. **Read Committed** (Postgres default) — only reads committed data. Prevents dirty reads, but allows non-repeatable reads (reading the same row twice returns different values) and phantom reads (a re-run query returns new rows).
3. **Repeatable Read** (MySQL default) — the SQL standard only requires it to prevent non-repeatable reads. In practice, **PostgreSQL implements it as snapshot isolation**, which also prevents phantom reads but still allows write skew. MySQL InnoDB uses a snapshot for plain reads and next-key locks for locking reads.
4. **Serializable** — fully serializable execution, typically via predicate locking or serializable snapshot isolation (SSI). Highest contention.

The bug I saw: we had a **wallet balance** table with {{user_id}}, {{balance}}, {{version}} (for optimistic locking). A transfer service did: {{SELECT balance FROM wallet WHERE user_id = ?}} (check sufficient funds), then {{UPDATE wallet SET balance = balance - amount WHERE user_id = ? AND version = ?}}. This ran at Read Committed.

Under load, two concurrent transfers of 60 from the same wallet both read a balance of 100, both passed the check, and both tried to update with the same version. One succeeded; the other updated zero rows, which we treated as an optimistic-lock failure and retried. On retry, the balance was 40, so the second transfer should have been rejected. **But** the retry logic had a bug: it re-read the balance and version but did not re-run the sufficient-funds check. So the second transfer went through and the balance ended up at -20.

The fix: move the business rule check **inside** the retry loop, or better, use a single {{UPDATE ... SET balance = balance - ? WHERE user_id = ? AND balance >= ?}} which is atomic and needs no retry. We also added a database check constraint {{balance >= 0}} as a safety net.

Another case: **write skew** at Repeatable Read in PostgreSQL. A user had two sub-accounts with 50 each, and the rule was that their combined balance must not go below zero. Two transactions each read the total (100) from their own snapshot; one withdrew 60 from account A, the other withdrew 60 from account B. They updated different rows, so there was no conflict, both committed, and the total became -20. Serializable would have aborted one of them, at the cost of retries. We fixed it by locking all of the user's account rows with {{SELECT ... FOR UPDATE}} before computing the total.

### Useful phrases
- **dirty read / non-repeatable read / phantom read**: đọc bẩn / đọc không lặp lại / đọc ảo
- **write skew**: ghi chéo
- **optimistic locking with version**: khóa lạc quan với version
- **atomic update**: cập nhật nguyên tử
- **check constraint**: ràng buộc kiểm tra
- **select for update**: khóa các dòng ngay khi đọc

> Senior tip: Đừng chỉ liệt kê 4 mức — interviewer muốn nghe **bạn chọn mức nào cho use case nào và tại sao**. Quy tắc tay: Read Committed cho hầu hết OLTP, Repeatable Read khi cần snapshot nhất quán (reporting), Serializable dùng có chọn lọc vì contention cao hơn và ứng dụng phải retry khi gặp serialization failure. Luôn có **check constraint** ở DB cho quy tắc nghiệp vụ quan trọng (balance >= 0, quantity >= 0) — đó là lớp phòng thủ cuối cùng.`,
  follow: [
    'How does PostgreSQL Repeatable Read differ from MySQL Repeatable Read regarding phantom reads?',
    'When would you use {{SELECT FOR UPDATE}} vs optimistic locking?',
    'Can you explain write skew with a concrete example where Serializable would help?',
  ],
  tags: ['database', 'transaction', 'isolation', 'concurrency', 'bug'],
  lang: 'en',
},
{
  id: 'english-024',
  topic: 'english',
  level: 'senior',
  q: 'Tell me about a difficult bug you fixed. How did you find the root cause?',
  a: `**Tóm tắt:** Dùng cấu trúc STAR nhưng tập trung vào **quy trình debug có hệ thống**: tái tạo → thu thập bằng chứng → giả thuyết → kiểm chứng → sửa → phòng ngừa. Nêu công cụ cụ thể (log, trace, metric, heap dump) và một bài học về quy trình.

### Sample answer
**Situation:** In our payment reconciliation job, we started seeing duplicate settlement records for the same transaction — about 0.1% of volume but financially unacceptable. The job runs nightly, reads from Kafka, and writes to PostgreSQL.

**Task:** Find why duplicates occur and fix it without delaying the month-end close.

**Action:** First, I checked whether it was a Kafka redelivery issue. The consumer commits offsets after processing each batch, so a crash mid-batch could cause reprocessing. But there had been no consumer restarts or rebalances on the nights the duplicates appeared, so I ruled that out.

I added correlation IDs to the logs and traced a specific duplicate pair. Both had the same {{payment_id}} but different {{reconciliation_id}}. The timestamps were 3 seconds apart. The application logs showed that two instances of the reconciliation service had processed the same payment event. We had recently scaled to two replicas for throughput, and **because of a bug in our Helm chart, each replica got a different {{group.id}}**, so they were not in the same consumer group. Each replica consumed the whole topic independently.

I confirmed it by listing the consumer groups in Kafka: there were two groups, each with one member, and both were consuming every partition. I fixed the Helm chart to use a shared {{group.id}}. Then I wrote a one-time cleanup script to delete duplicates based on {{payment_id}} + {{settlement_date}}, keeping the earliest {{reconciliation_id}}.

**Result:** Duplicates stopped immediately. We added a unique constraint on ({{payment_id}}, {{settlement_date}}) as a safety net. I also added an integration test that starts two consumers with the same group.id and verifies that each event is processed only once.

**Root cause analysis method:** I used the **5 Whys** — why duplicates? Two consumers. Why two consumers? Different group.id. Why different group.id? The Helm template built it from the pod name instead of using a fixed value. Why? It was copied from another chart where each pod really did need its own group, and nobody questioned it in review.

### Useful phrases
- **reproduce the issue**: tái tạo vấn đề
- **correlation ID**: ID tương quan
- **consumer group lag**: độ trễ nhóm consumer
- **exactly-once processing**: xử lý đúng một lần
- **safety net**: lưới an toàn
- **5 Whys technique**: kỹ thuật 5 cái tại sao

> Senior tip: Đừng chỉ nói "tôi đọc log và tìm ra bug". Interviewer muốn nghe **bạn dùng công cụ gì, theo thứ tự nào, và loại trừ giả thuyết như thế nào**. Một kỹ sư giỏi debug có **checklist**: 1) Tái tạo được không? 2) Log/trace có correlation ID không? 3) Metric/alert có bắt được không? 4) Có phải race condition / config / data không? 5) Fix xong có test hồi quy không? Cũng hãy nhắc **postmortem** — viết tài liệu chia sẻ cho team để tránh lặp lại.`,
  follow: [
    'What would you do if you could not reproduce the bug in staging?',
    'How do you distinguish between a data bug and a logic bug?',
    'Have you ever spent days debugging only to find it was a config error?',
  ],
  tags: ['debugging', 'behavioral', 'star', 'root-cause'],
  lang: 'en',
},
{
  id: 'english-025',
  topic: 'english',
  level: 'mid',
  q: 'Give a daily stand-up update, including a blocker, in clear English.',
  a: `**Tóm tắt:** Stand-up update chuẩn: **hôm qua làm gì → hôm nay làm gì → blocker (có hỏi giúp cụ thể)**. Ngắn gọn (< 60 giây), tập trung vào **kết quả bàn giao (outcome)** chứ không phải hoạt động. Blocker nêu rõ **ai có thể giúp** và **hạn chót**.

### Sample answer
"Yesterday I finished the idempotency key validation for the refund API and opened PR #3421. Today I'll finish the webhook retry with exponential backoff. The code is done, but I can't test it end to end in staging until the dead-letter topic exists.

**Blocker:** The DLQ topic doesn't exist in the staging cluster yet. I need the platform team to create it with a 7-day retention period and monitoring alerts. @platform-team, could you pick this up today? We need it by tomorrow morning to unblock the deployment."

### Useful phrases
- **yesterday I finished**: hôm qua tôi hoàn thành
- **today I will focus on**: hôm nay tôi tập trung vào
- **blocker**: điểm chặn / trở ngại
- **waiting on**: đang chờ
- **unblock the deployment**: gỡ chặn việc deploy
- **pick this up**: nhận việc này

> Senior tip: Đừng biến stand-up thành **báo cáo trạng thái chi tiết** ("tôi đã mở file, đọc code, chạy test..."). Chỉ nói **outcome** và **blocker**. Nếu blocker cần quyết định, nói rõ: "I need a decision from @PO by 2pm on whether to cut scope or delay." Nếu không có blocker, nói "No blockers" — đừng im lặng. Phát âm **blocker** /ˈblɒkə/ (Anh) hoặc /ˈblɑːkər/ (Mỹ), nhấn âm đầu.`,
  follow: [
    'How do you handle a blocker that the team cannot resolve internally?',
    'What do you do when a stand-up runs long because someone starts a technical discussion?',
    'How would you give a stand-up update if you spent the whole day in meetings?',
  ],
  tags: ['standup', 'communication', 'agile', 'blocker'],
  lang: 'en',
},
{
  id: 'english-026',
  topic: 'english',
  level: 'mid',
  q: 'How do you explain a delay to a foreign client or product owner?',
  a: `**Tóm tắt:** Nguyên tắc: **trung thực, sớm, có phương án, không đổ lỗi**. Cấu trúc: sự thật (delay bao lâu) → nguyên nhân gốc (ngắn gọn, không kỹ thuật quá sâu) → tác động → phương án khắc phục (có timeline) → cam kết báo cáo tiến độ. Luôn chủ động liên lạc trước khi deadline.

### Sample answer
"Hi [Client Name], I want to give you an early heads-up. The payment reconciliation feature we planned to release this Friday will be delayed by approximately one week.

**Root cause:** During load testing, we found a race condition in the idempotency layer that could cause duplicate settlements under high concurrency. It does not show up in functional tests, only when many requests for the same payment arrive at the same time.

**Impact:** The new target date is next Friday, January 19. No other deliverables are affected.

**Mitigation:** We have identified the fix — adding a database-level unique constraint and making the consumer idempotent. The code change is ready and in review (PR #3456). We will deploy to staging by Wednesday, run a 48-hour soak test, and release on Friday. I will send you a daily status update at 4 PM UTC until release.

We take reliability seriously, especially for financial features, and we would rather ship a week late than risk incorrect settlements. Please let me know if you have questions or need to adjust downstream plans."

### Useful phrases
- **early heads-up**: cảnh báo sớm
- **root cause**: nguyên nhân gốc
- **race condition**: điều kiện đua
- **soak test**: kiểm tra ngâm (chạy lâu để bắt lỗi ngẫu nhiên)
- **take reliability seriously**: coi trọng độ tin cậy
- **downstream plans**: kế hoạch của các bên liên quan

> Senior tip: Đừng gửi email "we are delayed" rồi im lặng. Khách hàng quốc tế đánh giá cao **proactive communication**: báo trước, cho timeline cụ thể, cam kết update hằng ngày. Nếu delay do thay đổi requirement từ phía khách, hãy nói thẳng nhưng lịch sự: "The scope change requested on January 10 added three days to the critical path." Không dùng từ "fault" hay "blame" — dùng "root cause" hoặc "contributing factor".`,
  follow: [
    'What if the client pushes back and demands the original date?',
    'How do you communicate a delay when the root cause is a third-party vendor?',
    'How do you handle a delay that keeps growing (unknown unknowns)?',
  ],
  tags: ['communication', 'client', 'delay', 'stakeholder'],
  lang: 'en',
},
{
  id: 'english-027',
  topic: 'english',
  level: 'mid',
  q: 'How do you write and respond to code review comments politely in English?',
  a: `**Tóm tắt:** Code review không phải chỉ trích cá nhân — là **cải tiến code cùng nhau**. Nguyên tắc: hỏi thay vì chỉ trích, giải thích lý do, đề xuất thay vì ra lệnh, cảm ơn reviewer. Khi nhận review: không phản ứng phòng thủ, hỏi rõ nếu mơ hồ, công nhận điểm tốt.

### Sample answer
**Writing comments (as reviewer):**
- Instead of: "This is wrong. Fix it." → **Say:** "I think this might have a race condition if two requests come in simultaneously. Could we use a {{ConcurrentHashMap}} or add synchronization here?"
- Instead of: "Variable name is bad." → **Say:** "Would {{paymentId}} be clearer than {{pid}}? It reads better in the logs."
- Instead of: "Why did you do it this way?" → **Say:** "I am curious about the design choice here — was there a reason to use composition over inheritance?"
- Always add: "Thanks for the PR!" or "Good catch on the edge case!"

**Responding to comments (as author):**
- Agree: "Great point. I will update to use {{ConcurrentHashMap}}."
- Disagree politely: "I considered that, but this map is only written once at startup and is read-only afterwards, so there are no concurrent writes. I'll add a comment to make that explicit. What do you think?"
- Clarify: "I am not sure I follow — could you elaborate on the race condition scenario?"
- Partial: "Good catch on the null check. I will add that. For the naming, I prefer {{pid}} because it matches the database column, but happy to change if the team has a convention."

**Useful templates:**
- "Nit: {{...}}" — minor style suggestion (non-blocking)
- "Question: {{...}}" — asking for clarification
- "Suggestion: {{...}}" — optional improvement
- "Blocking: {{...}}" — must fix before merge

### Useful phrases
- **nitpick / nit**: góp ý nhỏ về style
- **blocking comment**: ý kiến bắt buộc sửa
- **trade-off**: đánh đổi
- **elaborate**: giải thích chi tiết hơn
- **happy to change**: sẵn sàng thay đổi
- **thanks for catching that**: cảm ơn đã bắt lỗi đó

> Senior tip: Nhiều người Việt hay viết comment kiểu **"You should..."** — nghe như ra lệnh. Hãy dùng **"Could we..."**, **"Would it be better to..."**, **"Have you considered..."**. Khi phản biện, tránh **"I agree, but..."** — người nghe chỉ nhớ phần sau chữ "but". Hãy tách thành hai câu: **"That makes sense. One concern I have is..."** hoặc **"Good point. Have we also considered...?"**. Luôn kết thúc bằng **"Thanks!"** hoặc **"Appreciate the review!"**.`,
  follow: [
    'How do you handle a reviewer who is consistently rude or dismissive?',
    'What do you do when you strongly disagree with a senior engineer\'s comment?',
    'How do you review code in a language or framework you are not familiar with?',
  ],
  tags: ['code-review', 'communication', 'teamwork', 'english'],
  lang: 'en',
},
{
  id: 'english-028',
  topic: 'english',
  level: 'mid',
  q: 'How do you answer when you do not know the answer to a technical question?',
  a: `**Tóm tắt:** Đừng bịa, đừng im lặng. Cấu trúc: **thừa nhận không biết → nêu cách bạn sẽ tìm ra → đưa ra hướng đi tạm thời (nếu có) → cam kết follow-up**. Điều này thể hiện sự trung thực, tư duy giải quyết vấn đề và trách nhiệm.

### Sample answer
"That is a great question, and I want to be honest — I have not worked directly with {{eBPF}} in production, so I cannot give you a confident answer on the performance overhead.

Here is how I would approach it: First, I would check our internal wiki and the team's architecture decision records to see if anyone has evaluated it. Second, I would run a quick benchmark in a test environment with our workload profile. Third, I would reach out to the platform team — they have experience with {{Cilium}} which uses eBPF under the hood.

In the meantime, if we need to unblock the design discussion, I can share what I know about the setup we use today, iptables-based kube-proxy, and its trade-offs. I can have a concrete answer with data by the end of the day tomorrow. Would that work for you?"

### Useful phrases
- **that is a great question**: đó là một câu hỏi hay
- **I want to be honest**: tôi muốn nói thật
- **I have not worked directly with**: tôi chưa từng làm việc trực tiếp với
- **here is how I would approach it**: đây là cách tôi sẽ tiếp cận
- **in the meantime**: trong lúc chờ đợi
- **unblock the design discussion**: gỡ chặn cuộc thảo luận thiết kế
- **I can have a concrete answer by**: tôi có thể có câu trả lời cụ thể vào lúc

> Senior tip: Interviewer hỏi câu này để test **integrity** và **problem-solving**, không phải knowledge. Tuyệt đối **không nói "I don't know" rồi dừng**. Cũng đừng nói "I would Google it" — quá lười. Hãy nêu **các bước cụ thể**: tài liệu nào, ai để hỏi, benchmark như thế nào, khi nào có kết quả. Nếu có kiến thức lân cận, hãy chia sẻ ngắn gọn để cho thấy bạn không hoàn toàn mù. **follow-up** (có gạch nối) là danh từ/tính từ, nhấn âm đầu /ˈfɒləʊ ʌp/; động từ viết rời **follow up** ("I will follow up tomorrow"). Đừng đọc thành "fô-lô-úp".`,
  follow: [
    'What if the interviewer pressures you to guess anyway?',
    'How do you handle a question about a fundamental concept you should know (e.g., "How does HashMap work?")?',
    'Have you ever pretended to know something and got caught? What did you learn?',
  ],
  tags: ['interview-skills', 'honesty', 'problem-solving', 'communication'],
  lang: 'en',
},
{
  id: 'english-029',
  topic: 'english',
  level: 'senior',
  q: 'Explain how garbage collection works in the JVM to a junior developer.',
  a: `**Tóm tắt:** Giải thích theo mô hình **generational hypothesis**: object trẻ chết sớm, object già sống lâu. Heap chia thành Young (Eden + 2 Survivor) và Old. Minor GC (Young) nhanh, thường xuyên; Major/Full GC (Old) chậm, hiếm. G1/ZGC/Shenandoah dùng region-based, concurrent marking để giảm pause.

### Sample answer
Think of the heap as two generations: **Young** and **Old**. The generational hypothesis says: most objects die young, so we should collect the young generation often and the old generation rarely.

**Young Generation:** Split into Eden (where new objects are born) and two Survivor spaces (S0, S1). When Eden fills up, a **Minor GC** runs: live objects are copied to a Survivor space, dead objects are discarded. Objects that survive several Minor GCs (the tenuring threshold, at most 15) are **promoted** to the Old Generation.

**Old Generation:** Holds long-lived objects. When it fills up, the old generation has to be collected too. A **Full GC** is the worst case: it stops the application and compacts the whole heap, which can take seconds on a large heap.

**GC Algorithms:**
- **Serial/Parallel (throughput collectors):** Stop-the-world, single or multi-threaded. Good for batch, bad for low-latency.
- **CMS (Concurrent Mark Sweep):** Deprecated in Java 9 and removed in Java 14. It marked concurrently but did not compact, so the old generation fragmented over time.
- **G1 (Garbage First, default since Java 9):** Heap divided into ~2000 regions. Prioritizes regions with most garbage. Concurrent marking, stop-the-world evacuation pauses. Target pause time configurable (default 200ms).
- **ZGC / Shenandoah (low-latency, production-ready since Java 15):** They move objects concurrently using load barriers (ZGC also uses colored pointers). Pauses are typically around a millisecond, even for multi-terabyte heaps. Generational ZGC arrived in Java 21. Trade-off: more CPU and memory overhead.

**Key concepts for a junior:**
- **Allocation is fast** (a pointer bump in Eden). **Freeing dead young objects is almost free**, because a copying collector only touches the live ones.
- **Finalizers are evil** — unpredictable, delay GC. Use {{try-with-resources}} or {{Cleaner}} API.
- **Memory leak in Java** = unintentional object retention (static collections, listeners not removed, ThreadLocal). GC cannot collect reachable objects.

**Production tips:** Monitor {{GC pause time (p99)}}, {{allocation rate}}, {{promotion rate}}. A high promotion rate often means medium-lived objects are promoted too early and then die in the Old Gen; give the Young Gen more room or reduce those allocations. Use {{-Xlog:gc*}} for unified logging (Java 9+).

### Useful phrases
- **generational hypothesis**: giả thuyết thế hệ
- **pointer bump**: cấp phát bằng cách dịch con trỏ (rất nhanh)
- **promotion**: thăng cấp (sang Old Gen)
- **stop-the-world**: dừng thế giới (pause tất cả thread)
- **colored pointers**: con trỏ có màu (ZGC)
- **allocation rate**: tốc độ cấp phát bộ nhớ

> Senior tip: Đừng liệt kê tên GC (Serial, Parallel, CMS, G1, ZGC) rồi dừng. Giải thích **tại sao chọn cái nào cho use case nào**: Low-latency trading → ZGC/Shenandoah; High-throughput batch → Parallel/G1; General web app → G1 (default). Cảnh báo: với G1, **humongous object** (≥ 50% kích thước region) được cấp phát thẳng vào các region liên tiếp và không được di chuyển khi evacuation — nhiều object kiểu này gây phân mảnh và có thể dẫn tới Full GC; cân nhắc tăng {{-XX:G1HeapRegionSize}} hoặc giảm mảng/buffer lớn. Luôn test với production-like data size, không chỉ hello world.`,
  follow: [
    'How does G1 decide which regions to collect first?',
    'What is a "humongous object" in G1 and why is it problematic?',
    'When would you choose ZGC over G1, and what is the CPU cost?',
  ],
  tags: ['jvm', 'garbage-collection', 'g1', 'zgc', 'shenandoah'],
  lang: 'en',
},
{
  id: 'english-030',
  topic: 'english',
  level: 'senior',
  q: 'Describe your role in Agile/Scrum ceremonies and how you improve the process.',
  a: `**Tóm tắt:** Không chỉ liệt kê các buổi meeting. Hãy nói: **bạn đóng vai trò gì** (facilitator, contributor, challenger), **bạn cải tiến gì** (cắt meeting, đổi format, đưa metric), **kết quả đo được**. Senior engineer chủ động cải tiến quy trình, không chỉ tuân thủ.

### Sample answer
In my current team of eight (5 devs, 1 QA, 1 PO, 1 SM), I act as the **tech lead**. My role in each ceremony:

**Sprint Planning:** I prepare the technical breakdown *before* the meeting — each story has a design note, API contract draft, and effort estimate. During planning, I challenge scope: "This story has two independent parts; can we split so we deliver value earlier?" I also flag dependencies on other teams early. As a result, planning went down from three hours to about an hour and a half, and we commit to fewer but clearer stories.

**Daily Stand-up (15 min):** I keep it strictly to the three prompts. If a technical discussion starts, I say "Let's take it offline after stand-up" and note it on the board. I also surface blockers proactively: "I see the API contract with the fraud team is not finalized — I will sync with their tech lead today."

**Sprint Review (1h):** I demo the *behavior*, not the code. I prepare a one-pager: what changed, how to test, known limitations. I invite stakeholders to try the feature in staging during the review. This catches UX issues early.

**Retrospective (1h):** I bring data — cycle time, bug count, deployment frequency, team happiness survey. Last quarter, the data showed that PRs spent more than half of our cycle time waiting for review. We agreed on three things: (1) keep PRs under 400 lines, (2) a reviewer picks up every PR within two working hours, and (3) pair programming for complex stories. Cycle time dropped from 3.2 days to 1.8 days.

**Backlog Refinement (weekly, 1h):** I write spike tickets for technical unknowns *before* refinement, so the team discusses solutions, not questions. I also push for **Definition of Ready** — a story must have acceptance criteria, a design note, and no unresolved external dependencies.

**Process improvements I initiated:**
1. **Async stand-up twice a week** (Tue/Thu) via a Slack bot, which gave people longer blocks of focus time.
2. **Definition of Done** includes: unit test coverage > 80%, integration test for happy path, runbook updated, feature flag documented.
3. **Tech debt Friday** — last Friday of sprint, 2h dedicated to refactoring, no feature work. Paid down 40% of high-priority tech debt in 6 months.

### Useful phrases
- **tech lead**: dẫn dắt kỹ thuật
- **challenge scope**: đặt câu hỏi về phạm vi
- **flag dependencies**: nêu rõ sự phụ thuộc
- **take it offline**: thảo luận riêng sau
- **cycle time**: thời gian chu kỳ (từ bắt đầu code đến deploy)
- **definition of ready / done**: định nghĩa sẵn sàng / xong
- **tech debt Friday**: thứ sáu trả nợ kỹ thuật

> Senior tip: Interviewer muốn nghe **bạn chủ động cải tiến**, không chỉ "tôi tham gia đầy đủ". Hãy nêu **metric trước/sau** (cycle time, bug rate, meeting hours). Cũng đừng sùng bái Scrum — nói thẳng: "We dropped estimation in story points because it was noisy; we use throughput (stories/week) instead." Điều đó thể hiện **pragmatism**.`,
  follow: [
    'How do you handle a PO who keeps adding scope mid-sprint?',
    'What would you do if the team resists a process change you propose?',
    'How do you measure whether a retrospective action item actually worked?',
  ],
  tags: ['agile', 'scrum', 'process-improvement', 'tech-lead', 'leadership'],
  lang: 'en',
},
{
  id: 'english-031',
  topic: 'english',
  level: 'lead',
  q: 'Tell me about a time you led a technical initiative across teams.',
  a: `**Tóm tắt:** Dẫn dắt across-team: **xây dựng consensus → thiết kế chung → chia nhỏ task → theo dõi tiến độ → giao tiếp liên tục**. Cần thể hiện influence without authority, xử lý conflict ưu tiên, và deliver kết quả.

### Sample answer
**Context:** Our company ran three separate payment services (Vietnam, Singapore, Indonesia), each with its own reconciliation logic, acquirer adapters, and settlement flow. The same bugs had to be fixed three times, onboarding a new acquirer took six weeks per country, and each country team had almost no visibility into the other two codebases.

**Initiative:** I proposed a **Payment Platform Unification** — extract common domain (reconciliation, settlement, idempotency, webhook delivery) into a shared library, and build a **Payment Orchestrator** service that all three countries call. The orchestrator handles routing, retry, and settlement; country-specific logic stays in thin adapters.

**How I led it:**
1. **Build the coalition:** I met 1:1 with each country's tech lead and the EMs and listened to their concerns (Singapore worried about latency, Indonesia about compliance). Documented a **shared vision doc** with success criteria: onboarding time < 2 weeks, zero duplicate bugs, single on-call rotation.
2. **Design together:** Ran a 2-day design workshop (RFC process). We agreed on: shared library in Java 17, gRPC for orchestrator communication, feature flags for gradual rollout. I wrote the RFC, received 15 comments, and revised it twice.
3. **Slice the work:** Broke into 3 phases — (a) shared library + contract tests, (b) orchestrator service + Vietnam migration, (c) Singapore + Indonesia migration. Each phase had clear exit criteria and a rollback plan.
4. **Governance:** We held a weekly sync with all tech leads. A Jira epic tracked migration progress, and a shared Grafana dashboard showed error rate and p99 latency. If a country team was blocked for more than a week, I escalated to the EMs with data.
5. **Communication:** We ran a demo for stakeholders every two weeks and sent a monthly update to all engineers with progress and lessons learned.

**Result:** Nine months later, all three countries had migrated. Onboarding a new acquirer dropped from six weeks to ten days. We no longer fixed the same reconciliation bug three times, and on-call was consolidated into a single rotation with shared runbooks.

**What I learned:** I'd say technical design was maybe 30% of the work; **alignment and trust were the other 70%**. If I had pushed the design without 1:1s, Singapore would have blocked. The feature flag strategy let us prove value incrementally without big-bang risk.

### Useful phrases
- **influence without authority**: ảnh hưởng không cần quyền lực
- **consensus building**: xây dựng sự đồng thuận
- **feature flag**: cờ tính năng
- **gradual rollout**: triển khai dần
- **rollback plan**: kế hoạch quay lui
- **big-bang risk**: rủi ro triển khai một lần

> Senior tip: Across-team initiative thất bại thường do **không có executive sponsor** hoặc **không có exit criteria rõ ràng**. Luôn có: (1) sponsor từ VP/CTO, (2) success metrics có số, (3) rollback plan cho từng phase. Đừng cố gắng "chuẩn hóa mọi thứ" — để từng team giữ autonomy ở adapter, chỉ thống nhất core domain. Phát âm **initiative** /ɪˈnɪʃətɪv/ nhấn âm thứ hai (-ni-).`,
  follow: [
    'How did you handle a team that refused to migrate?',
    'What would you do differently if you had to do it again?',
    'How do you balance standardization with team autonomy?',
  ],
  tags: ['leadership', 'cross-team', 'initiative', 'influence', 'technical-strategy'],
  lang: 'en',
},
);
