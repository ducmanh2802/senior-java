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
1. **Build the coalition:** I met 1:1 with each country's tech lead and the EMs and listened to their concerns (Singapore worried about latency, Indonesia about compliance). Then I wrote a **shared vision doc** with clear success criteria: onboarding a new acquirer in under two weeks, no more duplicate bug fixes, and a single on-call rotation.
2. **Design together:** I ran a two-day design workshop, followed by an RFC. We agreed on a shared library in Java 17, gRPC between the country services and the orchestrator, and feature flags for a gradual rollout. I wrote the RFC, got about 15 comments, and revised it twice.
3. **Slice the work:** We split it into three phases — (a) shared library + contract tests, (b) orchestrator service + Vietnam migration, (c) Singapore + Indonesia migration. Each phase had clear exit criteria and a rollback plan.
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
{
  id: 'english-032',
  topic: 'english',
  level: 'senior',
  q: 'Tell me about a project where you had measurable impact.',
  a: `**Tóm tắt:** Kể theo khung **vấn đề → phần việc của tôi → kết quả đo được → trade-off**. Số liệu phải thật, có baseline (trước/sau), khoảng thời gian và cách đo; tách rõ "I" (việc bạn làm) với "we" (việc cả team làm), và thành thật nếu kết quả còn bị yếu tố khác ảnh hưởng.

### Sample answer
Sure. Last year our checkout API had a p99 latency of about 1.8 seconds at peak, and the funnel data showed that slow checkouts lined up with abandoned carts. I owned the investigation. Profiling with JFR showed that most of the time went into three sequential calls — pricing, inventory and promotions.

I proposed running those calls in parallel with {{CompletableFuture}} on a dedicated, bounded executor, and caching promotion rules for 60 seconds, because they rarely change. I wrote the change and the load tests; a teammate handled cache invalidation on the admin side.

We rolled it out over two weeks behind a feature flag. p99 dropped to around 650 milliseconds, and checkout conversion went up by roughly 2 percent the following month. To be fair, marketing ran a campaign at the same time, so I'm confident about the latency gain but I'd only claim part of the conversion gain. The trade-off was that a promotion change could take up to a minute to show up, which the business was happy to accept.

### Useful phrases
- **I owned the investigation**: tôi chịu trách nhiệm chính phần điều tra
- **lined up with / correlated with**: trùng khớp, tương quan với
- **We rolled it out behind a feature flag**: triển khai dần sau cờ tính năng
- **dropped from X to Y / went up by X percent**: giảm từ X xuống Y / tăng thêm X%
- **To be fair, ...**: công bằng mà nói (dùng khi thừa nhận yếu tố khác)

### Lỗi người Việt hay mắc
- Nói chung chung "I improved performance a lot" → phải có con số: "from 1.8 seconds to 650 milliseconds".
- Sai giới từ: "increase 2%" → **"increased by 2 percent"**; "reduce from 10 to 5" → **"reduced from 10 to 5"** (nhớ đuôi -ed vì là quá khứ).
- Dùng "we" cho mọi thứ → interviewer không biết bạn làm gì. Dùng "I" cho phần của mình, "we" cho phần của team.

> Senior tip: Interviewer senior hay hỏi tiếp "How did you measure that?" và "What else could explain the change?". Chủ động nói trước như câu "To be fair, marketing ran a campaign..." khiến bạn đáng tin hơn hẳn so với khoe con số lớn. Chuẩn bị sẵn 2–3 câu chuyện có số liệu thật và ghi lại nguồn (dashboard nào, khoảng thời gian nào).`,
  follow: ['How did you measure the impact, and what else could explain the change?', 'What would you have done if the latency improvement had not moved the business metric?', 'What was the hardest part to get agreement on?'],
  tags: ['impact', 'metrics', 'star', 'speaking'],
  lang: 'en',
},
{
  id: 'english-033',
  topic: 'english',
  level: 'senior',
  q: 'How do you explain a recommendation clearly?',
  a: `**Tóm tắt:** Nói **khuyến nghị trước** (bottom line up front), rồi mới đến lý do chính, chi phí, phương án thay thế và bước tiếp theo. Người Việt hay kể bối cảnh dài rồi mới đến kết luận; trong phỏng vấn tiếng Anh, người nghe muốn biết ngay bạn đề xuất gì.

### Sample answer
I put the recommendation in the first sentence, and then I support it. For example:

"My recommendation is to move PDF report generation to a background job. The main reason is that our largest reports take around 40 seconds, which is longer than the gateway timeout, so users see an error even when the report is actually generated. The cost is a few extra moving parts: a queue, a job-status endpoint, and retry handling. I think that's worth it, because export failures are our second most common support ticket. The alternative would be to raise the timeout, but that just moves the problem and ties up threads. I'd suggest we try it with our three biggest customers first and watch the export success rate."

So the order is always the same: what I recommend, why, what it costs, what the alternative is, and how we'll know it worked.

### Useful phrases
- **My recommendation is to...**: tôi đề xuất...
- **The main reason is that...**: lý do chính là...
- **The cost is... / The downside is...**: cái giá phải trả là...
- **The alternative would be..., but...**: phương án khác là..., nhưng...
- **I'd suggest we start with...**: tôi đề nghị bắt đầu với...

### Lỗi người Việt hay mắc
- Kể bối cảnh 2–3 phút rồi mới nói đề xuất → người nghe mất kiên nhẫn.
- Rào đón quá nhiều: "Maybe we can possibly consider..." → nghe thiếu tự tin. Nói thẳng: **"I recommend..."**, "I'd suggest...".
- "I think" ở đầu mọi câu. Dùng một lần cho phần ý kiến cá nhân là đủ.

> Senior tip: Khi người nghe là manager, mỗi lý do nên gắn với một con số kinh doanh (số ticket, tỉ lệ lỗi, chi phí). Kết thúc bằng một **tiêu chí đo thành công** ("watch the export success rate") — đó là dấu hiệu bạn nghĩ như owner, không chỉ như người code.`,
  follow: ['What would you do if your manager chose the alternative instead?', 'How do you present a recommendation when you are not fully sure?', 'How do you adapt the explanation for an engineer versus a business stakeholder?'],
  tags: ['communication', 'recommendation', 'speaking'],
  lang: 'en',
},
{
  id: 'english-034',
  topic: 'english',
  level: 'senior',
  q: 'When would you choose synchronous or asynchronous processing?',
  a: `**Tóm tắt:** Đồng bộ (sync) khi người gọi **cần kết quả ngay** để đi tiếp; bất đồng bộ (async) khi việc có thể **làm sau**. Async giúp tách phụ thuộc và hấp thụ đỉnh tải nhưng kéo theo chi phí vận hành: at-least-once delivery, idempotency, dead-letter queue, theo dõi consumer lag, eventual consistency.

### Sample answer
I start from what the caller actually needs. If the user can't continue without the result — for example, checking whether a payment was authorized — I keep it synchronous. But I protect that call with a tight timeout, a small retry budget and a circuit breaker, so one slow dependency doesn't drag down the whole request.

If the work can wait — sending the receipt email, updating the search index, generating a report — I move it to a queue like Kafka or SQS. That decouples the services and smooths out traffic spikes, but it isn't free. Most setups give you at-least-once delivery, so consumers have to be idempotent; I usually store the processed message ID or use a unique key in the database. You also need a dead-letter queue, alerts on consumer lag, and a way for the user to see that something is still pending.

One more thing: if I publish an event after a database write, I use the transactional outbox pattern, so we don't lose the event if the service crashes between the commit and the publish.

So my rule of thumb is: synchronous for what the user is waiting on, asynchronous for the rest — as long as the team is ready to operate it.

### Useful phrases
- **I start from what the caller actually needs**: tôi bắt đầu từ nhu cầu thật của bên gọi
- **drag down / take down**: kéo chậm / làm sập
- **it isn't free**: không miễn phí, có cái giá
- **smooth out traffic spikes**: làm phẳng đỉnh tải
- **rule of thumb**: nguyên tắc kinh nghiệm

### Phát âm
- **asynchronous** /eɪˈsɪŋkrənəs/: nhấn âm thứ hai "SYN".
- **queue** /kjuː/: đọc như chữ "Q", không đọc "quây-ơ".
- **idempotent** /ˌaɪdəmˈpoʊtənt/ (phổ biến ở Mỹ) hoặc /ɪˈdempətənt/.

> Senior tip: Virtual threads (Java 21) làm lời gọi đồng bộ rẻ hơn về tài nguyên thread, nhưng **không** giải quyết vấn đề coupling: service B chết thì request vẫn lỗi. Đừng chọn async chỉ vì "nó nhanh hơn" — chọn vì việc đó thực sự có thể làm sau và team đủ sức vận hành queue.`,
  follow: ['How do you make a Kafka consumer idempotent?', 'How do you show the user the status of an asynchronous job?', 'What problem does the transactional outbox pattern solve?'],
  tags: ['async', 'kafka', 'system-design', 'speaking'],
  lang: 'en',
},
{
  id: 'english-035',
  topic: 'english',
  level: 'senior',
  q: 'How do you structure an answer when you need a moment?',
  a: `**Tóm tắt:** Dừng 3–5 giây là bình thường. Dùng một câu "mua thời gian" tự nhiên, nói trước **khung trả lời** (ví dụ "two angles"), rồi trả lời từng phần và dừng khi đã đủ. Im lặng ngắn tốt hơn nhiều so với "uhm... ờ..." kéo dài.

### Sample answer
If the question is complex, I'm comfortable taking a short pause. I'll say something like, "That's a good question — let me think about it for a second." Then I give a structure before the details, because that helps me and the interviewer.

For example, if someone asks, "How would you split a monolithic database?", I might say: "Let me look at it from two angles: first, how to find the boundaries, and second, how to migrate the data safely without downtime." Then I go through each part and stop when I've covered both.

If I lose my train of thought, I just say, "Sorry, let me go back to the main point," and continue. I'd rather have a three-second pause than fill the silence with "um" and "uh".

### Useful phrases
- **Let me think about that for a second.**: để tôi nghĩ một chút
- **Let me look at it from two angles.**: tôi sẽ nhìn từ hai góc độ
- **There are three things I'd consider.**: có ba điều tôi sẽ xem xét
- **Let me go back to the main point.**: quay lại ý chính
- **lose my train of thought**: quên mất mạch đang nói

### Lỗi người Việt hay mắc
- Lấp khoảng lặng bằng "ờ", "à" tiếng Việt hoặc "uhm" liên tục.
- Nói "Wait." hoặc "Wait a minute." → nghe cộc lốc như ra lệnh. Dùng **"Give me a second"** hoặc **"Let me think"**.
- Hứa "three points" nhưng chỉ nói hai → hãy đếm trên ngón tay khi nói.

> Senior tip: Câu "mua thời gian" chỉ dùng **một lần** mỗi câu hỏi; lặp lại nhiều lần nghe như né tránh. Luyện với đồng hồ: đặt khung trong 10 giây đầu, trả lời mỗi ý trong khoảng 30–45 giây. Câu hỏi system design lớn thì có thể xin thêm thời gian: "Could I take a minute to sketch my thoughts?" — hoàn toàn được chấp nhận.`,
  follow: ['What do you do if you completely blank on a question?', 'How long is too long for a pause in an interview?', 'How do you get back on track after going off topic?'],
  tags: ['fluency', 'structure', 'speaking'],
  lang: 'en',
},
{
  id: 'english-036',
  topic: 'english',
  level: 'senior',
  q: 'How do you keep a technical explanation easy to follow?',
  a: `**Tóm tắt:** Ba thói quen: **nói kết luận trước**, giải thích cơ chế theo **các bước đánh số** (first, then, finally), và **kiểm tra người nghe** bằng câu hỏi tự nhiên thay vì "Do you understand?". Giữ một mức độ chi tiết, đừng nhảy qua lại giữa tổng quan và chi tiết code.

### Sample answer
I try to keep three habits. First, I give the short version up front. Second, I walk through the mechanism step by step. And third, I check in with the listener before going deeper.

For example, if I'm explaining our product cache, I'd say: "The short version is: we put Redis in front of the product service, and it cut database reads by about 80 percent. Here's how it works. First, the service checks Redis. If the product is there — that's a cache hit — we return it in about a millisecond. If it isn't, we read it from Postgres, store it in Redis with a ten-minute TTL, and return it. The tricky part is freshness: when a price changes, we delete the key, so the next read loads the new value."

Then I ask, "Does that level of detail work, or should I go deeper into how we handle invalidation?" That way the interviewer decides where to zoom in.

### Useful phrases
- **The short version is...**: nói ngắn gọn thì...
- **Here's how it works.**: nó hoạt động thế này
- **The tricky part is...**: phần khó là...
- **Does that make sense so far?**: tới đây có rõ không?
- **Should I go deeper into...?**: tôi có nên đi sâu vào... không?

### Lỗi người Việt hay mắc
- Hỏi **"Do you understand?"** → nghe như đang kiểm tra người nghe, dễ bị coi là thiếu lịch sự. Dùng "Does that make sense?" hoặc "Is that clear so far?".
- Chồng nhiều thuật ngữ trong một câu ("we use write-behind cache-aside with TTL-based eviction").
- Không có từ nối → người nghe không biết bạn đang ở bước mấy. Dùng "First... Then... Finally...".

> Senior tip: Một con số cụ thể ("about 80 percent", "about a millisecond") giúp người nghe hình dung tốt hơn mọi tính từ ("very fast", "much better"). Với interviewer kỹ thuật, câu "The tricky part is..." là chỗ ghi điểm: nó cho thấy bạn hiểu pitfall, không chỉ happy path.`,
  follow: ['How would you explain the same cache to a product manager?', 'What happens if the cache delete fails after the price update?', 'How do you know when you are going into too much detail?'],
  tags: ['communication', 'explanation', 'caching', 'speaking'],
  lang: 'en',
},
{
  id: 'english-037',
  topic: 'english',
  level: 'senior',
  q: 'What would you say if you did not hear a question?',
  a: `**Tóm tắt:** Nói thẳng là bạn không nghe rõ, xin nhắc lại **đúng phần bị lỡ**, hoặc **diễn đạt lại** phần bạn nghe được để xác nhận. Đừng đoán rồi trả lời sai câu hỏi — điều đó mất điểm hơn nhiều so với hỏi lại một lần.

### Sample answer
It depends on what I missed. If the connection drops, I just say so: "Sorry, you cut out for a second — could you repeat the last part of the question?"

If I caught most of it, I paraphrase it to confirm: "I think I got most of that. Are you asking how I'd handle duplicate messages after a consumer restarts?" That's quicker than asking them to repeat everything, and it shows I was listening.

If it's just one word, I ask about that word: "Sorry, I didn't quite catch the last word — did you say 'rebalance'?"

And if the audio keeps breaking up, I suggest a fix rather than struggling through it: "The audio is a bit choppy on my side. Would it help if I turned off my video?"

### Useful phrases
- **You cut out / You broke up for a second.**: tiếng bạn bị mất một lúc
- **I didn't quite catch that.**: tôi chưa nghe rõ
- **Could you repeat the last part?**: bạn nhắc lại phần cuối được không?
- **Are you asking...?**: có phải bạn đang hỏi...?
- **The audio is a bit choppy.**: âm thanh bị ngắt quãng

### Lỗi người Việt hay mắc
- Nói **"What?"** hoặc "Huh?" → thiếu lịch sự. "Pardon?" đúng nhưng hơi trang trọng; "Sorry?" tự nhiên hơn.
- **"Can you repeat again?"** → thừa từ (repeat đã có nghĩa "again"). Nói **"Could you repeat that?"** hoặc **"Could you say that again?"**.
- Ngại hỏi lại, đoán ý rồi trả lời lạc đề.

> Senior tip: Trước buổi phỏng vấn online, kiểm tra tai nghe, micro và mạng; nên dùng tai nghe có dây. Hỏi lại **một lần** là hoàn toàn bình thường — người bản xứ cũng làm vậy. Nếu phải hỏi lại liên tục, hãy chủ động đề xuất đổi kênh (tắt video, gọi lại) thay vì cố đoán.`,
  follow: ['What if you still do not understand after they repeat the question?', 'How do you handle an interviewer with a strong accent?', 'How do you confirm a long, multi-part question?'],
  tags: ['clarify', 'listening', 'online-interview', 'speaking'],
  lang: 'en',
},
{
  id: 'english-038',
  topic: 'english',
  level: 'senior',
  q: 'How do you respond about a technology you have not used?',
  a: `**Tóm tắt:** Trả lời trung thực ngay câu đầu ("Not in production"), nối sang **kinh nghiệm gần nhất** bạn có, nói ngắn gọn bạn **hiểu khái niệm** thế nào, rồi mô tả **cách bạn sẽ học** (docs, proof of concept nhỏ, rủi ro cần chú ý). Đừng bịa, cũng đừng chỉ nói "I don't know" rồi dừng.

### Sample answer
*Interviewer: "Have you worked with Kubernetes operators?"*

"Not in production, no. I've deployed our services to Kubernetes with Helm charts and set up readiness and liveness probes, but I haven't written an operator myself.

From what I understand, an operator is a controller that watches a custom resource and keeps reconciling the actual state of the cluster toward the desired state — similar in spirit to how the Deployment controller manages ReplicaSets.

If I needed to build one, I'd start with the official docs and the Java Operator SDK, build a small proof of concept for one resource, and pay close attention to how it behaves when reconciliation fails halfway. I'd expect to be productive within a couple of weeks, and I'd ask someone who's run operators in production to review the design."

### Useful phrases
- **Not in production, no.**: chưa dùng trên production
- **The closest thing I've done is...**: việc gần nhất tôi từng làm là...
- **From what I understand, ...**: theo tôi hiểu thì...
- **The way I'd get up to speed is...**: cách tôi bắt nhịp nhanh là...
- **similar in spirit to...**: về ý tưởng thì giống với...

### Lỗi người Việt hay mắc
- "I don't know." rồi im lặng → mất cơ hội thể hiện tư duy.
- Bịa kinh nghiệm → interviewer hỏi thêm 2 câu là lộ, mất hết uy tín.
- Câu chung chung "I can learn anything quickly" → không có bằng chứng. Hãy nêu **kế hoạch học cụ thể**.

> Senior tip: Senior không cần biết mọi công nghệ, nhưng phải cho thấy cách **đánh giá rủi ro** khi áp dụng thứ mới: "what happens when it fails", "who will operate it", "how do we roll back". Câu "From what I understand..." vừa trung thực vừa để interviewer sửa nếu bạn hiểu sai.`,
  follow: ['How would you decide whether the team should adopt this technology?', 'Tell me about a time you had to learn a new technology quickly.', 'What are the risks of introducing a technology nobody on the team knows?'],
  tags: ['honesty', 'learning', 'speaking'],
  lang: 'en',
},
{
  id: 'english-039',
  topic: 'english',
  level: 'senior',
  q: 'What if you realize you misstated a technical detail?',
  a: `**Tóm tắt:** Sửa **ngay khi nhận ra**, ngắn gọn, không xin lỗi quá mức: nói bạn đã nói gì, đúng ra là gì, và kết luận có thay đổi không. Tự sửa sai là tín hiệu tốt về sự trung thực và hiểu biết sâu.

### Sample answer
I correct it as soon as I notice — briefly, and without making a big deal of it. For example:

"Sorry, let me correct something I said earlier. I said Kafka gives us exactly-once delivery by default — that's not accurate. On the consumer side, the default is effectively at-least-once: if a consumer crashes after processing a message but before committing the offset, it will get that message again. Kafka does support exactly-once semantics with idempotent producers and transactions, but that only covers reads and writes inside Kafka. Once the consumer writes to an external database, we still need idempotent processing.

The good news is that it doesn't change my design, because the consumer already uses an idempotency key — but I wanted to be precise."

### Useful phrases
- **Let me correct something I said earlier.**: cho tôi sửa lại một điều vừa nói
- **What I meant was...**: ý tôi là...
- **To be precise, ...**: nói cho chính xác thì...
- **That doesn't change my conclusion, because...**: điều này không thay đổi kết luận vì...
- **That changes things a bit — ...**: điều này làm thay đổi một chút...

### Lỗi người Việt hay mắc
- Lờ đi, mong interviewer không để ý → nếu họ để ý, bạn mất điểm gấp đôi.
- Xin lỗi quá mức: "I'm so sorry, I'm very bad at this" → làm giảm uy tín. Một chữ **"Sorry"** là đủ.
- Sửa nhưng không nói kết luận có đổi không → người nghe phải tự đoán.

> Senior tip: Ví dụ Kafka ở trên rất hay gặp: từ Kafka 3.0, producer bật idempotence mặc định (chống trùng do retry phía producer), nhưng điều đó **không** làm consumer hết nhận trùng. Nắm chắc những chỗ dễ nói nhầm như vậy giúp bạn tự sửa kịp thời và ghi điểm "deep understanding".`,
  follow: ['How does Kafka achieve exactly-once semantics inside a stream processing pipeline?', 'Tell me about a time you were wrong about a technical decision.', 'How do you handle it when a colleague misstates something in a meeting?'],
  tags: ['honesty', 'kafka', 'communication', 'speaking'],
  lang: 'en',
},
{
  id: 'english-040',
  topic: 'english',
  level: 'senior',
  q: 'How would you begin an English interview naturally?',
  a: `**Tóm tắt:** Mở đầu gồm hai phần: **small talk ngắn** (chào, cảm ơn, đáp "How are you?" tự nhiên) và **phần giới thiệu bản thân 60–90 giây**: bạn là ai, đang làm gì, một thành tích nổi bật, vì sao quan tâm vị trí này. Không đọc lại CV theo thứ tự thời gian.

### Sample answer
*Small talk:*
"Hi, nice to meet you. Thanks for taking the time today."
*"How are you?"* — "I'm good, thanks — a little excited, to be honest. How about you?"

*"So, tell me about yourself."*
"Sure. I'm a backend engineer with about six years of experience, mostly with Java and Spring Boot. For the last three years I've been at a fintech company, working on the payment platform. I own the settlement service, and I'm part of the on-call rotation for it.

Recently I've been focusing on reliability. I led the move from synchronous calls to an event-driven flow with Kafka, which cut our timeout errors by about 70 percent.

I'm now looking for a role where I can work on larger-scale distributed systems and spend more time mentoring, which is why this position caught my attention."

### Useful phrases
- **Thanks for taking the time today.**: cảm ơn anh/chị đã dành thời gian
- **a little excited, to be honest**: thật lòng thì hơi hồi hộp (tự nhiên, thân thiện)
- **I own the... service**: tôi chịu trách nhiệm chính service...
- **Recently I've been focusing on...**: gần đây tôi tập trung vào...
- **That's why this position caught my attention.**: đó là lý do vị trí này thu hút tôi

### Lỗi người Việt hay mắc
- **"I'm fine, thank you, and you?"** → nghe như sách giáo khoa. Tự nhiên hơn: "I'm good, thanks. How about you?" / "Doing well, thanks!"
- Bắt đầu bằng "My name is..., I'm 30 years old, I graduated from..." → tuổi và trường không cần thiết với senior.
- Nói quá 2 phút → interviewer chưa kịp hỏi gì đã mất hứng.

> Senior tip: Chuẩn bị bản giới thiệu theo công thức **present → past → future**: hiện tại làm gì, một thành tích có số liệu, vì sao muốn vị trí này. Luyện đến mức nói tự nhiên nhưng **đừng học thuộc từng chữ** — nghe như đọc bài sẽ mất điểm. Phát âm **experience** /ɪkˈspɪəriəns/, nhấn âm "SPEE".`,
  follow: ['Why are you interested in this role specifically?', 'Which part of your current job do you enjoy the most?', 'What is one achievement you are most proud of?'],
  tags: ['introduction', 'small-talk', 'speaking'],
  lang: 'en',
},
{
  id: 'english-041',
  topic: 'english',
  level: 'senior',
  q: 'How would you close an interview professionally?',
  a: `**Tóm tắt:** Cảm ơn, nhắc tới **một chủ đề cụ thể** trong buổi nói chuyện, khẳng định ngắn gọn sự quan tâm, hỏi **bước tiếp theo và thời gian** phản hồi. Ấm áp, chuyên nghiệp, không hỏi "Did I pass?". Sau buổi phỏng vấn, gửi email cảm ơn ngắn trong vòng 24 giờ.

### Sample answer
"Thank you so much for your time today. I really enjoyed the discussion about how you're splitting the order service — it's a problem I've worked on before, and it made me even more interested in the role.

Could you tell me what the next steps in the process look like, and roughly when I might hear back?"

*Interviewer: "We'll get back to you within a week."*

"Great, that sounds good. Thanks again, and have a good rest of your day."

*Follow-up email (same day):*
"Hi Anna, thank you for the conversation today. I especially enjoyed discussing the order service migration. I'm excited about the role and look forward to hearing about the next steps. Best regards, Minh"

### Useful phrases
- **I really enjoyed the discussion about...**: tôi rất thích phần trao đổi về...
- **It made me even more interested in the role.**: điều đó khiến tôi càng quan tâm vị trí này
- **What do the next steps look like?**: các bước tiếp theo thế nào?
- **roughly when I might hear back**: khoảng khi nào tôi nhận được phản hồi
- **Have a good rest of your day.**: chúc anh/chị một ngày tốt lành

### Lỗi người Việt hay mắc
- **"Thank you for your listening."** → sai. Đúng: **"Thank you for listening"** hoặc "Thank you for your time".
- **"So... did I pass?"** → đặt interviewer vào thế khó.
- **"I hope I will have a chance to work with you."** → đúng ngữ pháp nhưng hơi cứng. Tự nhiên hơn: "I'd love to work with the team" hoặc "I look forward to hearing from you."

> Senior tip: Câu nhắc lại chủ đề cụ thể ("the order service migration") cho thấy bạn thực sự lắng nghe và giúp interviewer nhớ đến bạn khi viết đánh giá. Chú ý ngữ pháp: **look forward to + V-ing** ("look forward to hearing"), không phải "look forward to hear".`,
  follow: ['What should you include in a follow-up email after the interview?', 'How do you follow up if you have not heard back after the promised date?', 'What would you say if the interviewer asks whether you have other offers?'],
  tags: ['closing', 'etiquette', 'speaking'],
  lang: 'en',
},
{
  id: 'english-042',
  topic: 'english',
  level: 'senior',
  q: 'What questions would you ask the interviewer?',
  a: `**Tóm tắt:** Ở level senior, câu hỏi ngược lại là một phần của đánh giá. Chọn 2–3 câu **mở** (không trả lời được bằng yes/no), **hợp với người đang phỏng vấn** (engineer, manager hay director), về thành công trong 6 tháng đầu, thách thức kỹ thuật thật, và cách team cân bằng feature với reliability. Hỏi thêm một câu nối tiếp dựa trên câu trả lời của họ.

### Sample answer
"Yes, I have a few. First, what would a successful first six months look like for someone in this role?

Second, what's the biggest technical challenge the team is dealing with right now — is it more about scale, reliability, or legacy code?

And how does the team balance feature work with tech debt and reliability work? Is there a dedicated budget for it, or is it negotiated sprint by sprint?"

*Interviewer: "Mostly legacy code — we're breaking up a monolith."*

"Interesting. How are you deciding which parts to extract first?"

If I'm talking to an engineer, I might also ask: "What does on-call look like, and how often do you get paged?" With a director, I'd rather ask about the team's priorities for the next year.

### Useful phrases
- **What would success look like in...?**: thành công trong... trông như thế nào?
- **What's the biggest challenge the team is dealing with?**: thách thức lớn nhất team đang gặp là gì?
- **Is it more about X, Y, or Z?**: chủ yếu là X, Y hay Z?
- **How are you deciding...?**: team quyết định... như thế nào?
- **What does on-call look like?**: on-call ở đây thế nào?

### Lỗi người Việt hay mắc
- "No, I think everything is clear." → bỏ lỡ cơ hội thể hiện sự quan tâm.
- Hỏi câu có sẵn trên website ("What does your company do?").
- Hỏi câu yes/no ("Do you use microservices?") → khó mở ra cuộc trò chuyện. Thay bằng "How do you...?".

> Senior tip: Câu hỏi nối tiếp ("How are you deciding which parts to extract first?") là phần ghi điểm nhất — nó biến buổi phỏng vấn thành cuộc trao đổi giữa hai đồng nghiệp. Câu trả lời của họ cũng giúp **bạn** đánh giá công ty: team có thời gian cho tech debt không, on-call có quá tải không.`,
  follow: ['What would you ask a hiring manager versus a peer engineer?', 'How do you use the answers to decide whether to accept an offer?', 'What red flags do you listen for in the answers?'],
  tags: ['questions-to-ask', 'closing', 'speaking'],
  lang: 'en',
},
{
  id: 'english-043',
  topic: 'english',
  level: 'senior',
  q: 'How would you discuss salary expectations?',
  a: `**Tóm tắt:** Ở vòng đầu (recruiter screen), hãy hỏi trước **khoảng ngân sách** của vị trí; nếu bị hỏi tiếp, đưa ra **khoảng lương đã tìm hiểu**, nói rõ **gross hay net**, theo tháng hay năm, và phụ thuộc vào **tổng gói đãi ngộ**. Không bịa con số, không nói "salary is not important to me".

### Sample answer
*Recruiter: "What are your salary expectations?"*

"That's a fair question. I'd like to understand the scope of the role a bit better before I give a precise number. Could you share the budgeted range for this position?"

*Recruiter: "We'd prefer to hear your number first."*

"Sure. Based on my research for senior backend roles in Ho Chi Minh City and on my current package, I'm looking for something in the range of X to Y million dong gross per month. That depends on the total package, of course — things like the bonus, the 13th-month salary, insurance, and remote flexibility. Is that roughly in line with your range?"

Notice that I say **gross** clearly. In Vietnam people often talk about net salary, while many international companies quote gross, so it's worth confirming that you're both talking about the same number.

### Useful phrases
- **Could you share the budgeted range?**: bạn có thể chia sẻ khoảng ngân sách không?
- **I'm looking for something in the range of...**: tôi mong muốn trong khoảng...
- **gross / net per month**: lương trước thuế / sau thuế mỗi tháng
- **depending on the total package**: tuỳ vào tổng gói đãi ngộ
- **Is that roughly in line with your range?**: con số đó có gần với khoảng của bạn không?

### Lỗi người Việt hay mắc
- "Salary is not important to me." → không ai tin, và bạn mất vị thế đàm phán.
- "How much can you pay?" → nghe thô. Dùng "Could you share the range?".
- Nói lương net trong khi công ty hiểu là gross (hoặc ngược lại) → chênh lệch rất lớn khi nhận offer.

> Senior tip: Chuẩn bị trước ba con số: **mức thấp nhất bạn chấp nhận**, **mức mục tiêu**, và **mức đưa ra** (cao hơn mục tiêu một chút). Khi nói khoảng, đặt mức mục tiêu ở **đầu dưới** của khoảng, vì công ty thường chốt gần đầu dưới. Đàm phán chi tiết sau khi có offer sẽ có lợi hơn — xem câu english-057.`,
  follow: ['What would you say if the offer is below your range?', 'How do you answer when asked about your current salary?', 'Which benefits besides base salary matter most to you?'],
  tags: ['salary', 'negotiation', 'speaking'],
  lang: 'en',
},
{
  id: 'english-044',
  topic: 'english',
  level: 'senior',
  q: 'How would you discuss your start date?',
  a: `**Tóm tắt:** Nói **notice period thật** theo hợp đồng, ngày sớm nhất có thể bắt đầu, và cam kết **bàn giao tử tế** cho công ty cũ. Nếu có thể linh hoạt, nói rõ điều kiện; đừng hứa "start immediately" khi chưa chắc.

### Sample answer
"My contract has a 30-day notice period, so if I sign this month, the earliest I could start would be around the beginning of next month.

I'd also like to leave my current team in good shape. I'm the main owner of our settlement service, so I want to do a proper handover — documentation and a couple of knowledge-transfer sessions.

If you need someone sooner, I can ask my manager whether a shorter notice period would be possible, but I don't want to promise that until I've talked to them. Is there a particular date you have in mind?"

### Useful phrases
- **notice period**: thời gian báo trước khi nghỉ việc
- **30 days' notice**: báo trước 30 ngày (chú ý dấu sở hữu **days'**)
- **the earliest I could start would be...**: ngày sớm nhất tôi có thể bắt đầu là...
- **a proper handover**: bàn giao đầy đủ
- **I don't want to promise that until...**: tôi không muốn hứa điều đó trước khi...

### Lỗi người Việt hay mắc
- "I can start immediately." trong khi vẫn đang đi làm → nếu không đúng, công ty mới sẽ mất niềm tin.
- "I will quit my job tomorrow." → nghe thiếu chuyên nghiệp, interviewer nghĩ bạn cũng sẽ bỏ họ như vậy.
- Giới từ: "start **on** March 3rd" (ngày cụ thể), "start **in** March" (tháng), "start **at the beginning of** next month".

> Senior tip: Việc bạn nhắc tới bàn giao là tín hiệu tốt: công ty mới hiểu rằng sau này bạn cũng sẽ rời đi một cách có trách nhiệm. Kiểm tra kỹ notice period trong hợp đồng hiện tại và ngày phép còn lại trước khi trả lời, đừng ước lượng.`,
  follow: ['What if we need you to start in two weeks?', 'How would you plan the handover at your current job?', 'Do you have any planned time off in the next few months?'],
  tags: ['start-date', 'notice-period', 'speaking'],
  lang: 'en',
},
{
  id: 'english-045',
  topic: 'english',
  level: 'senior',
  q: 'Could you walk me through a recent Java project?',
  a: `**Tóm tắt:** Theo thứ tự: **dự án làm gì, cho ai, quy mô** → **tech stack ngắn gọn** → **vai trò của bạn** → **một quyết định kỹ thuật** (vấn đề, phương án, trade-off) → **kết quả có số liệu** → mời interviewer hỏi sâu. Khoảng 2 phút.

### Sample answer
"Sure. The most recent one is a loyalty points service for an e-commerce platform with about two million active users. It's a Spring Boot 3 service on Java 21, running on EKS, with PostgreSQL and Kafka.

The team was four engineers. I was the most senior, so I drove the design and owned the points ledger.

The most interesting decision was how to store balances. The first idea was a single balance column that we update in place, but that makes auditing and fixing mistakes really hard. I proposed an append-only ledger table instead — every earn or spend is a row — with a balance column that's updated in the same transaction, and a version column for optimistic locking to handle concurrent spends.

It cost us a bit more storage and a more complex history query. But when a promotion rule had a bug, we recomputed the affected balances from the ledger in an afternoon instead of guessing.

Since launch, it's handled peaks of around 1,500 writes per second during flash sales, with p99 latency under 100 milliseconds. I'm happy to go deeper into the data model or how we tested it."

### Useful phrases
- **The most recent one is...**: dự án gần nhất là...
- **I drove the design and owned...**: tôi dẫn dắt thiết kế và chịu trách nhiệm...
- **The most interesting decision was...**: quyết định đáng chú ý nhất là...
- **It cost us... But...**: cái giá là... Nhưng...
- **I'm happy to go deeper into...**: tôi sẵn sàng đi sâu vào...

### Lỗi người Việt hay mắc
- Liệt kê tech stack dài 1 phút ("Java, Spring, Hibernate, Redis, Kafka, Docker, Jenkins...") → không ai nhớ. Nêu 3–4 thứ chính là đủ.
- Không có quyết định hay trade-off nào → nghe như người chỉ làm theo ticket.
- Lẫn thì: việc đã xong dùng quá khứ ("I proposed"), trạng thái hiện tại dùng hiện tại ("It's a Spring Boot service"), kết quả tính đến nay dùng present perfect ("it's handled peaks of...").

> Senior tip: Chọn một quyết định mà bạn **giải thích được cả phương án bị loại**. Interviewer senior gần như chắc chắn sẽ hỏi "Why not just use X?" — ví dụ ở đây: "Why not use a pessimistic lock?" hay "Why not event sourcing?". Chuẩn bị trước 2–3 câu trả lời đó.`,
  follow: ['Why did you choose optimistic locking instead of a pessimistic lock?', 'How did you test the concurrent spend scenario?', 'What would you change if you built it again?'],
  tags: ['project', 'java', 'architecture', 'speaking'],
  lang: 'en',
},
{
  id: 'english-046',
  topic: 'english',
  level: 'senior',
  q: 'Tell me about a production incident you helped resolve.',
  a: `**Tóm tắt:** Kể theo dòng thời gian: **ảnh hưởng tới người dùng → vai trò của bạn → bằng chứng tìm ra nguyên nhân → cách giảm thiệt hại (mitigation) → tín hiệu xác nhận đã phục hồi → sửa gốc và phòng ngừa**. Dùng thì quá khứ, nêu rõ phần việc của bạn, không tiết lộ thông tin mật.

### Sample answer
"One Friday evening, our order API started returning errors — about 15 percent of requests failed for roughly 40 minutes. I was the on-call engineer, so I was the first responder.

The first thing I checked was the database. It looked healthy — CPU was low — but the HikariCP metrics showed all 50 connections in use, and request threads were waiting for a connection until they timed out after 30 seconds. A thread dump confirmed it: most threads were inside a {{@Transactional}} method that called the fraud-check service over HTTP, and that service had slowed down to about eight seconds per call. So every slow call was holding a database connection the whole time.

To stop the bleeding, I lowered the HTTP client timeout to two seconds through our config and switched on the fallback that sends orders to manual fraud review. Errors dropped to almost zero within five minutes, and we confirmed recovery when the pending-connection count went back to zero.

The following week, I moved the remote call out of the transaction and added an alert for pool usage above 80 percent for five minutes. We wrote a blameless postmortem, and I presented it to the wider engineering team."

### Useful phrases
- **I was the first responder.**: tôi là người xử lý đầu tiên
- **The first thing I checked was...**: việc đầu tiên tôi kiểm tra là...
- **That pointed to... / A thread dump confirmed it.**: điều đó chỉ ra... / thread dump xác nhận
- **To stop the bleeding, ...**: để cầm máu (giảm thiệt hại ngay)
- **We confirmed recovery when...**: chúng tôi xác nhận đã phục hồi khi...

### Lỗi người Việt hay mắc
- Lẫn thì: "the API return error" → **"the API returned errors"**. Cả câu chuyện là quá khứ.
- "The system was die." → sai. Đúng: **"The system went down"** / "The service crashed".
- "I fixed the bug." mà không nói **làm sao biết** đó là nguyên nhân → thiếu phần bằng chứng, chỗ interviewer quan tâm nhất.

> Senior tip: Tách rõ **mitigation** (giảm thiệt hại ngay, ví dụ giảm timeout, bật fallback) và **root-cause fix** (đưa lời gọi HTTP ra khỏi transaction). Interviewer đánh giá cao người biết "cầm máu trước, chữa bệnh sau". Giữ một lời gọi mạng bên trong {{@Transactional}} là lỗi kinh điển làm cạn connection pool — rất đáng kể.`,
  follow: ['How did you communicate with stakeholders during the incident?', 'Why is calling a remote service inside a transaction dangerous?', 'What did you change in your monitoring afterwards?'],
  tags: ['incident', 'hikaricp', 'star', 'speaking'],
  lang: 'en',
},
{
  id: 'english-047',
  topic: 'english',
  level: 'senior',
  q: 'How would you explain an architecture decision to a business stakeholder?',
  a: `**Tóm tắt:** Dịch quyết định kiến trúc sang **tác động tới khách hàng và kinh doanh**: hôm nay đang có vấn đề gì, thay đổi gì người dùng sẽ thấy, tốn bao nhiêu, và đo thành công bằng **một con số**. Tránh thuật ngữ như queue, worker, Kafka.

### Sample answer
"Right now, when a customer clicks Export, the system builds the whole report while they wait. For our bigger customers that takes more than a minute, so the request times out. That's where the 'failed export' tickets come from — about 120 of them last month.

What we're proposing is to build the report in the background. The customer clicks Export, sees a message saying 'Your report is being prepared', and gets an email when it's ready — usually within a couple of minutes.

For the business, that means no more failed exports and fewer support tickets. The cost is about three weeks of engineering time, and one small change in the experience: customers wait for a notification instead of getting the file right away.

We'll track one number: the percentage of exports that finish successfully. Today it's about 92 percent, and our goal is 99.5 percent. Does that trade-off work for you?"

### Useful phrases
- **Right now, when a customer..., ...**: hiện tại, khi khách hàng...
- **That's where... come from.**: đó là nguồn gốc của...
- **What we're proposing is...**: điều chúng tôi đề xuất là...
- **For the business, that means...**: với kinh doanh, điều đó có nghĩa là...
- **We'll track one number: ...**: chúng tôi sẽ theo dõi một chỉ số...

### Lỗi người Việt hay mắc
- Nói "we will add a message queue and async workers" → stakeholder không biết điều đó có ý nghĩa gì với họ.
- Chỉ nói lợi ích, giấu chi phí (thời gian làm, thay đổi trải nghiệm).
- Không có chỉ số đo → không ai biết dự án thành công hay chưa.

> Senior tip: Bắt đầu từ **nỗi đau mà stakeholder đã biết** (ticket support, khách phàn nàn), không bắt đầu từ kiến trúc. Câu hỏi kết thúc "Does that trade-off work for you?" trao quyền quyết định cho họ — họ là người chịu trách nhiệm về trải nghiệm khách hàng.`,
  follow: ['What if the stakeholder asks why we cannot just make the export faster?', 'How would you explain a delay in this project to the same stakeholder?', 'How do you choose the success metric?'],
  tags: ['stakeholder', 'communication', 'architecture', 'speaking'],
  lang: 'en',
},
{
  id: 'english-048',
  topic: 'english',
  level: 'senior',
  q: 'How do you make plural and past tense endings clearer?',
  a: `**Tóm tắt:** Tiếng Việt không có phụ âm cuối dạng cụm (/sts/, /kst/), nên người Việt hay **nuốt đuôi -s và -ed** — "we deploy it last week" nghe như thì hiện tại. Học ba cách đọc của mỗi đuôi, luyện theo cặp, và ghi âm lại để tự nghe.

### Sample answer
"Since my first language is Vietnamese, where words don't end in consonant clusters, I used to drop endings. I'd say 'we deploy it last week', and it sounded like present tense.

What helped was learning the three sounds for each ending and practicing in pairs: 'one request — two requests', 'we deploy — we deployed'. I also record myself explaining a past project, because that's full of past tense, and I listen only for endings. Now I slow down slightly on the ending, finish the sound, and then go back to my normal pace."

### Ba cách đọc đuôi -s / -es
| Âm cuối của từ | Đọc là | Ví dụ |
|---|---|---|
| vô thanh /p t k f θ/ | /s/ | requests, locks, chips |
| hữu thanh, nguyên âm | /z/ | logs, deploys, nodes, servers |
| /s z ʃ tʃ dʒ/ | /ɪz/ | caches, services, branches, pages |

### Ba cách đọc đuôi -ed
| Âm cuối của từ | Đọc là | Ví dụ |
|---|---|---|
| vô thanh /p k f s ʃ tʃ/ | /t/ | fixed /fɪkst/, pushed, stopped |
| hữu thanh, nguyên âm | /d/ | deployed, logged, configured |
| /t/ hoặc /d/ | /ɪd/ | migrated, added, tested |

### Câu luyện tập
"Last week we **migrated** two **services**, **fixed** three **bugs**, and **deployed** the **changes** to all **regions**."

### Lỗi người Việt hay mắc
- Đọc "fixed" thành "fix-ed" /fɪksɪd/ → sai; chỉ thêm /ɪd/ sau /t/ và /d/.
- Nuốt hoàn toàn đuôi → "two request", "we test it yesterday".
- Đọc quá mạnh, kéo dài "requests-sss" → nghe gượng; chỉ cần **hoàn thành âm**, không cần nhấn.

> Senior tip: Interviewer bản xứ hiểu được giọng Việt, nhưng thiếu đuôi -ed làm họ **hiểu sai thời điểm**: "we deploy it" (thường xuyên) khác hẳn "we deployed it" (đã xong). Khi kể dự án đã xong, có thể thêm mốc thời gian ("last year", "in 2023") để người nghe hiểu đúng ngay cả khi bạn lỡ nuốt đuôi.`,
  follow: ['Which other sounds are hard for Vietnamese speakers in technical English?', 'How do you practice pronunciation without a teacher?', 'How do you keep your pace natural while finishing every ending?'],
  tags: ['pronunciation', 'grammar', 'speaking'],
  lang: 'en',
},
{
  id: 'english-049',
  topic: 'english',
  level: 'senior',
  q: 'How do you pronounce unfamiliar technical terms?',
  a: `**Tóm tắt:** Kiểm tra cách đọc chuẩn (từ điển, tài liệu hoặc talk chính thức của dự án), chú ý **âm được nhấn**, rồi luyện trong cả câu. Nếu team có cách đọc riêng, hỏi đồng nghiệp. Nói rõ ràng và nhất quán quan trọng hơn bắt chước giọng.

### Sample answer
"First, I check how the creators or the community say it — many projects mention it in their docs or in conference talks. For example, nginx is 'engine-x', not 'n-jinx'. For normal English words, I use a dictionary with audio and pay attention to the stressed syllable, because wrong stress is what usually makes a word hard to recognize.

Then I practice the word in a full sentence, like 'We put a cache in front of the database', so it feels natural when I say it under pressure.

And if a team has its own way of saying something — some people say 'sequel', some say 'S-Q-L' — I just follow what my colleagues use. Both are fine."

### Những từ hay đọc sai
| Từ | Cách đọc | Ghi chú |
|---|---|---|
| cache | /kæʃ/ | đọc giống hệt "cash", không phải "ca-shê" |
| queue | /kjuː/ | đọc giống chữ "Q" |
| architecture | /ˈɑːrkɪtektʃər/ | "ch" đọc là /k/ |
| Kubernetes | /ˌkuːbərˈnetiːz/ | nhấn "NET" |
| YAML | /ˈjæməl/ | vần với "camel" |
| JSON | /ˈdʒeɪsən/ | giống tên "Jason" |
| Linux | /ˈlɪnəks/ | không đọc "lai-nớt" |
| suite | /swiːt/ | giống "sweet", không phải "suit" |
| Hibernate | /ˈhaɪbərneɪt/ | nhấn âm đầu "HI" |
| PostgreSQL | "post-gres-Q-L" | hoặc gọi tắt "Postgres" |

### Lỗi người Việt hay mắc
- Đọc mọi âm tiết đều nhau, không có trọng âm → người bản xứ khó nhận ra từ.
- Bỏ phụ âm cuối: "cache" thành "ca", "queue" thành "kiu" ngắn.
- Ngại nói từ khó nên dùng từ khác lòng vòng → cứ nói, nếu sai interviewer vẫn hiểu từ ngữ cảnh.

> Senior tip: Làm một danh sách 20–30 thuật ngữ bạn hay dùng nhất khi kể dự án (tên công nghệ trong CV) và luyện cho đến khi đọc trơn. Interviewer sẽ nghe những từ này nhiều lần trong một buổi, nên sửa chúng mang lại hiệu quả lớn nhất.`,
  follow: ['How do you handle it when you realize you mispronounced a word?', 'Which word stress mistakes make you hardest to understand?', 'How would you ask a colleague how to pronounce a term without sounding awkward?'],
  tags: ['pronunciation', 'vocabulary', 'speaking'],
  lang: 'en',
},
{
  id: 'english-050',
  topic: 'english',
  level: 'senior',
  q: 'How do you describe completed work and current responsibilities?',
  a: `**Tóm tắt:** Dùng **hiện tại đơn** cho trách nhiệm thường xuyên, **quá khứ đơn** cho việc đã xong (có mốc thời gian), **hiện tại hoàn thành** cho kết quả tính đến nay (không có mốc cụ thể), **hiện tại tiếp diễn** cho việc đang làm. Dùng sai thì làm interviewer hiểu nhầm việc nào bạn đã làm xong.

### Sample answer
"At my current company, I'm responsible for the payment gateway integration. I maintain the adapters for three acquirers, and I'm on the on-call rotation.

Before that, I worked on the merchant onboarding service, where I built the document upload flow for identity checks.

Right now I'm leading our migration to Spring Boot 3. We've moved six of our nine services so far, and we're planning to finish by the end of the quarter."

### Chọn thì nào?
| Ý muốn nói | Thì | Ví dụ |
|---|---|---|
| Trách nhiệm thường xuyên | Present simple | I **maintain** the adapters. |
| Việc đã xong, có thời điểm | Past simple | In 2023 I **built** the upload flow. |
| Kết quả tính đến nay | Present perfect | We**'ve moved** six services so far. |
| Đang diễn ra | Present continuous | I**'m leading** the migration. |
| Bắt đầu trong quá khứ, vẫn tiếp tục | Present perfect continuous | I**'ve been working** here since 2021. |

### Lỗi người Việt hay mắc
- "I **have worked** on that project **in 2022**." → sai; có mốc thời gian cụ thể thì dùng quá khứ: **"I worked on that project in 2022."**
- "I **am working** here **since** 2021." → **"I've been working here since 2021."**
- "I responsible for..." / "I in charge of..." → thiếu động từ: **"I'm responsible for..."**, **"I'm in charge of..."**.

> Senior tip: Cẩn thận với việc **chưa xong**: nói "I migrated the system to Spring Boot 3" khi mới xong 6/9 service sẽ bị coi là phóng đại nếu interviewer hỏi sâu. "We've moved six of nine so far" vừa đúng ngữ pháp vừa trung thực.`,
  follow: ['What are you working on right now?', 'What is one thing you have achieved in your current role that you are proud of?', 'How has your role changed since you joined?'],
  tags: ['grammar', 'tenses', 'speaking'],
  lang: 'en',
},
{
  id: 'english-051',
  topic: 'english',
  level: 'senior',
  q: 'How do you avoid common article mistakes?',
  a: `**Tóm tắt:** Tiếng Việt không có mạo từ nên người Việt hay **bỏ a/an/the**. Tự hỏi hai câu: (1) danh từ có **đếm được, số ít** không? → phải có a/an hoặc the; (2) người nghe **đã biết** đó là cái nào chưa? → nếu rồi dùng the. Danh từ số nhiều hoặc không đếm được nói chung chung thì **không cần mạo từ**.

### Sample answer
"Vietnamese doesn't have articles, so I used to drop them — I'd say 'I fixed bug in payment service'. Now I ask myself two quick questions.

First: is it one countable thing? Then it needs an article. So it's 'I fixed **a** bug', not 'I fixed bug'.

Second: does the listener already know which one I mean? Then I use 'the'. For example: 'We added **a** cache last year. **The** cache cut our database load in half.' The first time it's 'a', because it's new information; after that it's 'the'.

If I'm talking about things in general, I usually don't need an article at all: 'Caches can return stale data', 'We store data in PostgreSQL'."

### Danh từ không đếm được hay gặp trong IT
Không dùng "a" và không thêm "-s": **information, feedback, advice, software, hardware, equipment, traffic, research, knowledge, documentation, code**.
- "some feedback" (không phải "some feedbacks")
- "a piece of code" hoặc "some code" (không phải "a code" hay "codes" khi nói về mã nguồn)

### Sửa lỗi nhanh
| Sai | Đúng |
|---|---|
| I am backend developer. | I'm **a** backend developer. |
| I fixed bug in payment service. | I fixed **a** bug in **the** payment service. |
| Can you give me some feedbacks? | Can you give me some **feedback**? |
| We had a high traffic. | We had high traffic. / We had **a** traffic spike. |
| We use the Kafka. | We use Kafka. (nhưng: **the** Kafka cluster) |

> Senior tip: Đừng cố hoàn hảo khi nói — thiếu mạo từ hiếm khi làm người nghe hiểu sai. Ưu tiên sửa **3 lỗi xuất hiện nhiều nhất** trong câu chuyện của bạn: "I'm **a** ... engineer", "**the** + tên service của bạn", và các danh từ không đếm được (feedback, code, information). Ghi âm phần giới thiệu bản thân rồi đếm lỗi mạo từ là cách luyện nhanh nhất.`,
  follow: ['When do you use "the" with technology or product names?', 'How do you practice grammar while speaking without slowing down too much?', 'Which grammar mistake do you most want to fix, and how?'],
  tags: ['grammar', 'articles', 'speaking'],
  lang: 'en',
},
{
  id: 'english-052',
  topic: 'english',
  level: 'senior',
  q: 'Walk me through a system you designed recently. (2-3 minutes)',
  a: `**Tóm tắt:** Theo thứ tự **vấn đề → ràng buộc chính (tải, latency, nhất quán) → kiến trúc → một trade-off → kết quả đo được**. Đừng kể theo dòng thời gian; dùng số liệu thật của bạn (ví dụ dưới đây chỉ là mẫu).

### Sample answer
"Sure. Last year I redesigned our order placement flow. The problem was that the order API called payment, inventory and fraud services one after another, synchronously. At peak — around 300 orders per second during sales — p99 latency went above three seconds, and if any one service was slow, the whole order failed.

The key constraint was that we couldn't lose or double-charge an order. So the API now does just one thing synchronously: it saves the order and an outbox record in the same database transaction, and returns 'order received'. A small publisher reads the outbox and sends an event to Kafka. Payment and inventory consumers process it idempotently, using the order ID as the key. A saga coordinates the steps, and if payment fails, it releases the reserved stock — that's a compensating action, not a real rollback.

We kept the fraud check synchronous, because the business wanted to reject risky orders before accepting them.

The trade-off is that customers now see a 'pending' state for a few seconds, and we have to operate retries, consumer lag alerts and a nightly reconciliation job. In return, p99 for the order API dropped to about 250 milliseconds, and a slow inventory service no longer fails orders."

### Cụm từ hữu ích
- "The main bottleneck was..."
- "The key constraint was..."
- "I traded X for Y because..."
- "The result was..."

### Lỗi người Việt hay mắc
- Nói theo thứ tự thời gian thay vì theo vấn đề → giải pháp → kết quả; người nghe mất mạch.
- Dùng "we did" cho mọi việc, không nêu rõ vai trò của bạn.
- Bỏ qua trade-off, nghe như quảng cáo.`,
  follow: ['What would you change if traffic doubled?', 'How did you test consistency?'],
  tags: ['system-design', 'speaking', 'interview'],
  lang: 'en',
},
{
  id: 'english-053',
  topic: 'english',
  level: 'senior',
  q: 'Tell me about a production incident you handled. (STAR, past tense)',
  a: `**Tóm tắt:** Kể theo STAR, **toàn bộ ở thì quá khứ**: Situation (ảnh hưởng tới người dùng) → Task (trách nhiệm của bạn) → Action (bằng chứng tìm ra nguyên nhân, vì sao chọn cách giảm thiệt hại đó) → Result (thời gian phục hồi, dữ liệu có bị ảnh hưởng không) + phòng ngừa. Mọi con số phải khớp với timeline thật của sự cố.

### Sample answer
"**Situation:** After a routine deployment on a Tuesday morning, our notification service fell behind. Consumer lag on the order-events topic grew from almost zero to about 400,000 messages in an hour, so customers got their order confirmations up to 50 minutes late.

**Task:** I owned that service, so I led the investigation.

**Action:** The logs showed the consumer group rebalancing every few minutes. The new release had added a call to a template service for each message, so processing a batch of 500 records now took longer than {{max.poll.interval.ms}}, which is five minutes by default. Kafka treated the consumer as dead, rebalanced, and the next consumer got the same batch again — so we were stuck in a loop. To mitigate, I rolled back the release, because that was the fastest safe option and the change was backward compatible. Lag started dropping within ten minutes.

**Result:** We were fully caught up after about 40 minutes. Because the consumer was idempotent, the reprocessed messages didn't send duplicate emails — we checked that against the email provider's logs. Afterwards I reduced {{max.poll.records}}, cached the templates, and added an alert on consumer lag and on rebalance rate."

### Cụm từ hữu ích
- "The symptom was..."
- "I first checked..."
- "The root cause turned out to be..."
- "To prevent recurrence, we..."

### Lỗi người Việt hay mắc
- Dùng hiện tại thay vì quá khứ cho sự cố đã xử lý.
- Nói "we fixed" mà không nói bạn làm gì cụ thể.
- Bỏ phần prevention, interviewer không thấy bạn học được gì.`,
  follow: ['How did you communicate during the incident?', 'What would you do differently?'],
  tags: ['incident', 'star', 'speaking'],
  lang: 'en',
},
{
  id: 'english-054',
  topic: 'english',
  level: 'senior',
  q: 'Explain the trade-off between Kafka and REST to a non-technical manager.',
  a: `**Tóm tắt:** So sánh bằng tác động kinh doanh — có cần câu trả lời ngay không, hai hệ thống phụ thuộc nhau đến đâu, lỗi được xử lý thế nào — kèm một phép so sánh đời thường dễ hiểu.

### Sample answer
REST is like asking a colleague a question and waiting for the reply: it fits when the caller needs an immediate result, but the caller depends on the other service being reachable and responsive. Kafka is closer to leaving a durable message for another team to process: the producer and consumer can work at different times, which can absorb bursts when the system is provisioned and monitored for them. It does not guarantee that either service cannot fail, and it adds operational work such as retries, duplicate handling, lag monitoring, and eventual consistency. I would choose based on whether the business needs an immediate answer and whether asynchronous processing is acceptable, not on traffic peaks alone.

### Cụm từ hữu ích
- "Think of it as..."
- "The benefit is...; the cost is..."
- "For this case, X fits because..."
- "We can revisit if..."

### Lỗi người Việt hay mắc
- Dùng thuật ngữ kỹ thuật (throughput, partition, consumer group) với người không chuyên.
- Chỉ nói ưu điểm, không nói chi phí.
- Không đưa ví dụ cụ thể từ hệ thống của công ty.`,
  follow: ['How do you monitor Kafka lag?', 'When would you switch back to REST?'],
  tags: ['communication', 'kafka', 'tradeoff'],
  lang: 'en',
},
{
  id: 'english-055',
  topic: 'english',
  level: 'senior',
  q: 'How would you politely disagree with your tech lead?',
  a: `**Tóm tắt:** Ghi nhận quan điểm của tech lead, nêu mối lo ngại kèm bằng chứng, rồi đề xuất một bước kiểm chứng nhỏ để cùng quyết định.

### Sample answer
I would say: "I see your point about shipping faster. My concern is that this migration may hold a lock on the orders table during peak traffic, based on the behavior we saw in testing. Could we check its lock behavior and duration on production-like data, then choose a rollout window or a safer migration plan? We could also put the application change behind a flag if that is compatible with the schema." This stays respectful, brings evidence, and offers concrete ways to reduce the risk — without pretending that a flag or a maintenance window removes it completely.

### Chi tiết và VÌ SAO
Việc bất đồng với tech lead là chuyện bình thường trong một môi trường kỹ thuật lành mạnh. Tech lead thường ưu tiên tính toàn vẹn của hệ thống, nhưng đôi khi họ cũng bị áp lực về tiến độ từ cấp quản lý hoặc khách hàng. Điểm mấu chốt là cách bạn trình bày sự bất đồng: không phải "tôi đúng - anh sai", mà là "tôi có một mối lo ngại về rủi ro kỹ thuật, chúng ta hãy cùng giải quyết nó".

Nếu bạn cảm thấy tech lead đang ra quyết định quá vội vàng hoặc thiếu bằng chứng, hãy sử dụng chiến thuật "Evidence-based disagreement":
- **Ghi nhận quan điểm (Acknowledge):** Bắt đầu bằng việc xác nhận rằng bạn hiểu lý do của họ (ví dụ: cần gấp tính năng, cần tiết kiệm chi phí). Điều này giúp tech lead cảm thấy họ được lắng nghe.
- **Nêu mối lo ngại (State concern):** Trình bày sự bất đồng dựa trên dữ liệu kỹ thuật, không phải cảm tính cá nhân.
- **Đề xuất thử nghiệm (Propose experiment):** Thay vì tranh luận kéo dài, hãy đề xuất một cách đo lường cụ thể hoặc một thử nghiệm nhỏ (spike) để kiểm chứng sự lo ngại của bạn.

Việc này giúp bảo vệ tiêu chuẩn kỹ thuật của team mà vẫn giữ được mối quan hệ tốt. Nếu tech lead vẫn kiên quyết, hãy yêu cầu ghi chú rủi ro đó vào thiết kế hoặc Jira để cùng theo dõi trong tương lai. Đó là cách bạn thể hiện trách nhiệm mà vẫn tôn trọng thẩm quyền của tech lead.

> Senior tip: Đừng bao giờ tranh luận gay gắt trong cuộc họp có nhiều stakeholder. Nếu bất đồng trở nên căng thẳng, hãy chủ động đề nghị thảo luận riêng sau đó: "Let's take this offline and compare the data."

### Cụm từ hữu ích
- "I see your point, and..."
- "My concern is..."
- "Based on..."
- "Could we try... and measure..."

### Lỗi người Việt hay mắc
- Nói "I disagree" thẳng thừng, nghe như thách thức.
- Chỉ nêu ý kiến, không có bằng chứng hoặc phương án thay thế.
- Im lặng rồi phàn nàn sau cuộc họp.`,
  follow: ['What if the lead insists?', 'How do you handle being wrong?'],
  tags: ['soft-skills', 'communication', 'teamwork'],
  lang: 'en',
},
{
  id: 'english-056',
  topic: 'english',
  level: 'mid',
  q: 'Why are you leaving your current role, and why this bank?',
  a: `**Tóm tắt:** Nối những gì bạn đã học được ở công ty hiện tại với một mục tiêu mà vị trí mới mang lại; nói tích cực, không phàn nàn. Phần "why this bank" phải dựa trên thông tin thật bạn đã tìm hiểu.

### Sample answer
"I've learned a lot in my current role, especially about building payment integrations and running services in production. But the product is quite stable now, and most of my work is maintenance. I'm looking for a place where I can work on larger-scale systems with stricter reliability requirements.

That's what attracted me to this bank. From the job description, the team is moving its core payment flows from a legacy platform to Spring Boot services, and that's exactly the kind of migration I'd like to contribute to — and I've done a smaller version of it before. I also like that the role includes mentoring. I'd be curious to hear how the team is planning that migration."

(Thay các chi tiết bằng thông tin thật của bạn và của công ty — đừng bịa dự án hay lộ trình bạn chưa kiểm chứng.)

### Chi tiết và VÌ SAO
Đây là câu hỏi về thái độ và tư duy phát triển của bạn. Interviewer không muốn nghe lý do "vì sếp khó tính" hay "vì lương thấp". Họ muốn một ứng viên có mục tiêu rõ ràng và tìm kiếm cơ hội để đóng góp giá trị cao hơn.
- **Lý do rời bỏ (Leaving):** Hãy tập trung vào việc bạn đã học được gì và tại sao bạn đã sẵn sàng cho bước tiếp theo. Nếu công ty hiện tại đã ổn định và không còn thách thức kỹ thuật lớn, hãy nói điều đó một cách trung tính.
- **Tại sao chọn công ty mới (Joining):** Đây là nơi bạn thể hiện mình đã nghiên cứu kỹ về công ty. Hãy chỉ ra một khía cạnh kỹ thuật, sản phẩm, hoặc văn hóa mà bạn thực sự ngưỡng mộ hoặc muốn chinh phục.
- **Tránh sai lầm:** Tuyệt đối không nói xấu sếp, đồng nghiệp cũ.

Việc chuẩn bị kỹ lưỡng cho câu hỏi này giúp bạn thể hiện sự chuyên nghiệp và định hướng rõ ràng.

### Cụm từ hữu ích
- "I have learned a lot, but..."
- "What excites me about this role is..."
- "I am looking for..."
- "This role fits because..."

### Lỗi người Việt hay mắc
- Phàn nàn sếp hoặc công ty cũ, nghe tiêu cực.
- Nói "for higher salary" là lý do chính.
- Không nghiên cứu công ty, trả lời chung chung.`,
  follow: ['What would make you stay at your current job?', 'Where do you see yourself in 3 years?'],
  tags: ['career', 'interview', 'motivation'],
  lang: 'en',
},
{
  id: 'english-057',
  topic: 'english',
  level: 'senior',
  q: 'How do you answer salary expectation and negotiation questions?',
  a: `**Tóm tắt:** Đưa ra khoảng lương đã tìm hiểu kỹ, nói theo tổng thu nhập (total compensation), và hỏi khoảng ngân sách của họ trước khi chốt.

### Sample answer
I would say: "Based on comparable roles, my experience, and the responsibilities we have discussed, I am targeting a total compensation range of [your researched range]. I am open to discussing the mix of base pay and any benefits or variable compensation that apply to this role. Could you share the budgeted range for the position?" Research the relevant location and level; do not assume equity or a bonus is part of the package.

### Chi tiết và VÌ SAO
Đàm phán lương là kỹ năng thể hiện sự tự tin và sự hiểu biết về giá trị của bản thân trên thị trường.
- **Nghiên cứu thị trường (Research):** Biết rõ mức lương của vị trí tương đương, trình độ tương đương ở khu vực đó trước khi đi phỏng vấn.
- **Tránh con số đơn nhất (Range):** Đưa ra một khoảng lương (range) thay vì một con số cố định để linh hoạt hơn.
- **Tập trung vào tổng đãi ngộ (Total compensation):** Lương cơ bản chỉ là một phần, hãy cân nhắc thêm bonus, cổ phiếu (equity), phụ cấp, và cơ hội phát triển.
- **Hỏi ngược lại (Turn around):** Nếu họ hỏi quá sớm, hãy hỏi lại khoảng budget của họ để hai bên biết có khớp nhau hay không, tránh mất thời gian.

Điều này không phải là mặc cả, mà là đàm phán dựa trên giá trị và thị trường. Luôn giữ thái độ hợp tác và chuyên nghiệp.

### Cụm từ hữu ích
- "Based on market data..."
- "I am targeting a range of..."
- "I am flexible on the mix..."
- "Could you share the band?"

### Lỗi người Việt hay mắc
- Đưa số quá thấp vì ngại, sau đó hối hận.
- Nói "whatever you think is fair" → mất đòn bẩy.
- Chỉ nói lương cơ bản, bỏ qua bonus, equity, remote allowance.`,
  follow: ['How do you handle a low offer?', 'When do you negotiate beyond salary?'],
  tags: ['negotiation', 'career', 'interview'],
  lang: 'en',
},
{
  id: 'english-058',
  topic: 'english',
  level: 'mid',
  q: 'What questions should you ask the interviewer at the end?',
  a: `**Tóm tắt:** Hỏi về tiêu chí thành công, sức khoẻ của team và thách thức thật; tránh những câu đã có câu trả lời trên website.

### Sample answer
Choose questions that are still unanswered and fit the interview stage. For example: "What would success look like in the first few months?" or "What technical challenge is the team prioritizing?" Ask about on-call expectations, compensation, or leave when the interviewer or process makes those topics appropriate; none is inherently off limits. You can close with: "Is there anything about my experience you would like me to clarify?" That invites useful discussion without pressuring the interviewer.

### Chi tiết và VÌ SAO
Đây là cơ hội cuối cùng để bạn ghi điểm. Đừng chỉ hỏi để cho có, hãy hỏi những câu cho thấy bạn thực sự muốn hiểu công việc và văn hóa của công ty.
- **Sự thành công (Success metrics):** Hỏi về kỳ vọng của họ trong 6 tháng tới giúp bạn hình dung được tiêu chuẩn của công ty.
- **Thử thách kỹ thuật (Challenges):** Hiểu được vấn đề lớn nhất của team giúp bạn thấy được thực trạng (nợ kỹ thuật, vấn đề hạ tầng...).
- **Cân bằng cuộc sống (Team health):** Hỏi về on-call và cân bằng công việc giúp bạn đánh giá xem đây có phải là môi trường lành mạnh hay không.

Câu hỏi cuối cùng phải thể hiện sự chuyên nghiệp, chuẩn bị kỹ lưỡng và tư duy của một người thực sự muốn đóng góp lâu dài.

### Cụm từ hữu ích
- "What does success look like..."
- "What is the biggest challenge..."
- "How do you measure..."
- "Is there anything that concerns you..."

### Lỗi người Việt hay mắc
- Nói "I have no questions" → thiếu chủ động.
- Hỏi lương/ngày nghỉ với technical interviewer khi họ không phụ trách chuyện đó → để dành cho recruiter hoặc khi được hỏi.
- Hỏi câu trả lời có sẵn trên website.`,
  follow: ['How do you close an interview professionally?', 'What follow-up email should you send?'],
  tags: ['interview', 'closing', 'soft-skills'],
  lang: 'en',
},
{
  id: 'english-059',
  topic: 'english',
  level: 'senior',
  q: 'How do you clarify an ambiguous requirement with a stakeholder?',
  a: `**Tóm tắt:** Nhắc lại mục tiêu bằng lời của mình, nêu các giả định, và đề xuất một bước kiểm chứng nhỏ trước khi bắt tay vào làm.

### Sample answer
I would say: "Let me make sure I understand. The goal is to reduce failed payments by 20 percent this quarter. I'm assuming we mean failures caused by timeouts, not fraud declines, and that we're allowed to change the retry policy. Before I build anything, I'd like to spend two days analyzing the failure reasons and then share a one-page proposal. Does that match what you had in mind?" This avoids building the wrong thing and shows ownership.

### Chi tiết và VÌ SAO
Sự mơ hồ là kẻ thù của hiệu suất. Đừng bắt tay vào làm khi yêu cầu chưa rõ ràng, vì chi phí để sửa lại sau này sẽ cao gấp nhiều lần.
- **Xác nhận mục tiêu (Restate goal):** Để chắc chắn bạn và stakeholder đang cùng nhìn về một hướng.
- **Nêu giả định (Assumptions):** Giả định giúp làm rõ các ranh giới của vấn đề.
- **Đề xuất bước kiểm chứng (Validation step):** Thay vì hỏi ngược lại "làm thế nào?", hãy đề xuất một cách giải quyết nhỏ để họ xác nhận.

Cách tiếp cận này thể hiện tư duy của một kỹ sư senior: không chỉ thực hiện công việc, mà còn tối ưu hóa giá trị kinh doanh.

### Cụm từ hữu ích
- "Let me make sure I understand..."
- "I assume that..."
- "Before I build, I will..."
- "Does that match..."

### Lỗi người Việt hay mắc
- Giả định rồi code luôn, sau đó làm lại.
- Hỏi "what do you want?" mà không đề xuất phương án.
- Không ghi lại quyết định, tranh cãi sau này.`,
  follow: ['How do you handle conflicting stakeholders?', 'What if requirements change mid-sprint?'],
  tags: ['requirements', 'communication', 'stakeholders'],
  lang: 'en',
},
{
  id: 'english-060',
  topic: 'english',
  level: 'senior',
  q: 'How do you give and receive code review feedback?',
  a: `**Tóm tắt:** Góp ý vào code và tác động của nó (không vào con người), dùng câu hỏi, và tách rõ góp ý bắt buộc sửa (blocking) với góp ý nhỏ (non-blocking).

### Sample answer
When giving feedback, focus on correctness, maintainability, and risk; let configured automation handle style where practical. Explain the impact and suggest a path forward, for example: "Could this query load more rows than expected? What does the plan look like for the largest tenant?" Mark severity using the team's review conventions rather than assuming every team uses the same labels. When receiving feedback, ask about the underlying concern, verify it, and explain your reasoning with evidence if you still disagree.

### Chi tiết và VÌ SAO
Code review là quá trình học tập chung, không phải là cuộc chiến giữa reviewer và author.
- **Góp ý (Giving feedback):** Hãy tập trung vào những thứ ảnh hưởng tới hệ thống như hiệu năng, bảo mật, tính dễ bảo trì. Dùng câu hỏi để người khác tự suy nghĩ, tránh áp đặt.
- **Nhận feedback:** Hãy cởi mở và coi đó là cơ hội để cải thiện bản thân và code. Đừng phòng thủ (defensive). Nếu không đồng ý, hãy đưa ra lý lẽ dựa trên kỹ thuật chứ không phải sở thích cá nhân.

Mục tiêu cuối cùng là chất lượng của sản phẩm, không phải việc ai là người chiến thắng.

### Cụm từ hữu ích
- "Could this... become an issue..."
- "Nit: ..."
- "Blocking: ..."
- "The reason I chose... is..."

### Lỗi người Việt hay mắc
- Comment "this is wrong" không giải thích.
- Nhận xét cá nhân thay vì code.
- Im lặng khi không đồng ý, rồi làm theo không vui.`,
  follow: ['How do you review a large PR?', 'How do you handle a stubborn reviewer?'],
  tags: ['code-review', 'teamwork', 'communication'],
  lang: 'en',
},
{
  id: 'english-061',
  topic: 'english',
  level: 'mid',
  q: 'Describe a weakness honestly in an interview.',
  a: `**Tóm tắt:** Nêu một điểm yếu có thật nhưng không chí mạng cho vị trí, cho thấy bạn đã làm gì để cải thiện và có bằng chứng tiến bộ; tránh kiểu khoe khéo (humble-brag).

### Sample answer
"One thing I've been working on is speaking up early in design discussions. I used to keep my concerns to myself in meetings and raise them later in code review. On one project, I noticed a problem with the data model during the design review but didn't say anything, and we had to rework two weeks of code later.

Since then, I've changed two things. I read the design doc before the meeting and write down my questions, and I make a point of raising at least one of them during the discussion. My manager has noticed the difference — in my last review, she mentioned that I'm contributing much more in design sessions. I'm still more comfortable writing than speaking, especially in English, but it's getting easier."

(Hãy chọn điểm yếu thật của bạn; ví dụ trên chỉ là mẫu cấu trúc.)

### Chi tiết và VÌ SAO
Interviewer hỏi câu này không phải để tìm lỗi, mà để xem bạn có khả năng tự nhận thức (self-awareness) và tinh thần cầu tiến hay không.
- **Điểm yếu thật (Real weakness):** Đừng nói "tôi quá hoàn hảo", hãy nói một điểm yếu thật nhưng không gây nguy hiểm cho vị trí ứng tuyển.
- **Hành động cải thiện (Improvement):** Đây là phần quan trọng nhất. Bạn đã làm gì để khắc phục nó?
- **Kết quả (Evidence):** Cho thấy tiến bộ cụ thể.

Tư duy này cho thấy bạn là một kỹ sư có tinh thần học hỏi và không ngừng tự hoàn thiện.

### Cụm từ hữu ích
- "I used to..."
- "The impact was..."
- "I now..."
- "Evidence of progress is..."

### Lỗi người Việt hay mắc
- Nói "I work too hard" → humble-brag, interviewer không tin.
- Chọn điểm yếu chí mạng cho vị trí (ví dụ backend nói không thích database).
- Không có hành động cải thiện.`,
  follow: ['What is your greatest strength?', 'How do you handle feedback about a weakness?'],
  tags: ['self-awareness', 'interview', 'soft-skills'],
  lang: 'en',
},
{
  id: 'english-062',
  topic: 'english',
  level: 'senior',
  q: 'Tell me about a time you mentored a junior developer.',
  a: `**Tóm tắt:** Mô tả khoảng trống của người được mentor, cách bạn hỗ trợ, và sự tiến bộ có thể thấy được của họ.

### Sample answer
"Last year a junior developer joined our team, and she was technically solid but nervous about anything touching production. She avoided on-call and asked someone else to deploy her changes.

First, I asked her what exactly worried her. It turned out she didn't know how to tell whether a deployment was healthy. So we paired on a few real releases, and I talked through what I was looking at — error rates, latency, and the logs — and why.

Next, I gave her a small, low-risk service to own, with a runbook, and I reviewed her first few deployments. After about two months, she joined the on-call rotation as a secondary, and by the end of the quarter she was handling incidents on that service on her own. She even updated the runbook herself.

What I learned is that the gap was confidence, not knowledge, so the right approach was safe practice, not more lectures."

### Chi tiết và VÌ SAO
Việc mentor không phải chỉ là "dạy kỹ thuật", mà là tạo ra môi trường để người khác phát triển.
- **Chẩn đoán (Diagnose):** Trước hết phải hiểu người kia thiếu gì (kiến thức nền, sự tự tin, hay khả năng quản lý thời gian).
- **Thiết kế trải nghiệm (Structure):** Đừng làm hộ, hãy tạo ra các "cơ hội an toàn" để họ tự trải nghiệm và rút ra bài học.
- **Đo lường (Measure):** Mentor hiệu quả là khi người được mentor có thể tự xử lý công việc mà không cần bạn.

Người mentor giỏi là người biết rút lui đúng lúc, nhường lại sân khấu cho người khác tỏa sáng.

### Cụm từ hữu ích
- "The gap was..."
- "I paired with them on..."
- "I gave them ownership of..."
- "The result was..."

### Lỗi người Việt hay mắc
- Nói "I taught them everything" → thiếu khiêm tốn.
- Không có số liệu chứng minh tiến bộ.
- Chỉ nói lý thuyết, không có ví dụ cụ thể.`,
  follow: ['How do you handle a mentee who resists feedback?', 'How do you balance mentoring with delivery?'],
  tags: ['mentoring', 'leadership', 'soft-skills'],
  lang: 'en',
},
{
  id: 'english-063',
  topic: 'english',
  level: 'senior',
  q: 'Describe a time you missed a deadline and how you handled it.',
  a: `**Tóm tắt:** Nhận trách nhiệm sớm, báo ngay khi có dấu hiệu trễ, đưa ra các phương án (giảm scope, đổi thứ tự, dời ngày), và bổ sung biện pháp phòng ngừa.

### Sample answer
"Last year I committed to integrating a new payment provider in three weeks. I underestimated it — I'd assumed their sandbox behaved like production, and it didn't.

At the end of the first week, I realized the date was at risk, because their webhook format was different from the documentation. I told my manager and the product owner that same day. I explained what was still uncertain and gave them three options: ship card payments on time and move e-wallets to the next sprint, delay everything by one week, or add another engineer — which I didn't recommend, because onboarding would take too long.

We chose the first option. Card payments went live on the original date, and e-wallets followed eight days later. No customer commitments were affected.

Since then, for any new external integration, I add a two-day spike to test the real API before I give an estimate."

### Cụm từ hữu ích
- "I realized early that..."
- "I communicated immediately..."
- "I proposed..."
- "To prevent this..."

### Lỗi người Việt hay mắc
- Giấu đến phút cuối rồi báo cáo.
- Đổ lỗi cho người khác hoặc yêu cầu.
- Không có hành động ngăn chặn lặp lại.

### Cấu trúc STAR gợi ý
| Phần | Nói gì | Thời lượng |
|---|---|---|
| Situation | Dự án, deadline, ai phụ thuộc vào nó | 15 giây |
| Task | Phần việc bạn chịu trách nhiệm, vì sao trễ | 15 giây |
| Action | Lúc nào phát hiện, báo ai, đưa phương án gì | 60 giây |
| Result | Kết quả thật, bài học, thay đổi quy trình | 30 giây |

### Interviewer muốn nghe gì
- **Ownership:** dùng "I" cho phần lỗi của mình, không "we" để né trách nhiệm.
- **Phát hiện sớm:** bạn có tín hiệu cảnh báo (burndown, spike kỹ thuật) chứ không bất ngờ ở ngày cuối.
- **Trade-off:** đưa lựa chọn có hệ quả rõ ràng, ví dụ "ship the core flow on time and move reporting to the next sprint".
- **Prevention có số liệu:** ví dụ "since then I add a one-day spike for unknown integrations, and our estimate error dropped from about 40% to 15%".

> Senior tip: Chọn câu chuyện mà hậu quả vừa phải và bạn đã kiểm soát được; tránh sự cố mất tiền khách hàng nếu không kể được phần khắc phục. Luyện nói thành tiếng dưới 2 phút.`,
  follow: ['How do you estimate work more accurately?', 'How do you push back on an unrealistic deadline?'],
  tags: ['delivery', 'communication', 'ownership'],
  lang: 'en',
},
{
  id: 'english-064',
  topic: 'english',
  level: 'senior',
  q: 'Explain how virtual threads work in Java 21. When would you use them, and what are the trade-offs compared to platform threads?',
  a: `**Tóm tắt:** Virtual threads (Project Loom) là thread nhẹ, do JVM quản lý thay vì OS. Khi bị block (ví dụ I/O), JVM tự unmount virtual thread khỏi carrier (platform thread) và mount lại khi I/O xong, nên carrier được giải phóng cho việc khác. Tốt cho high-concurrency I/O-bound; không giúp gì cho CPU-bound (số core không đổi), và trên Java 21 {{synchronized}} có thể pin carrier.

### Sample answer
Virtual threads, which became final in Java 21 through JEP 444, are lightweight threads managed by the JVM rather than the operating system. A platform thread maps one-to-one to an OS thread and usually reserves around a megabyte of stack, so you can only have a few thousand of them. A virtual thread's stack lives on the heap and starts at a few kilobytes, so you can easily have hundreds of thousands.

Here's how it works: virtual threads run on a small pool of carrier threads — a work-stealing ForkJoinPool, roughly one carrier per CPU core. When a virtual thread hits a blocking call, like a JDBC query or an HTTP request, the JVM unmounts it and saves its stack to the heap, and the carrier picks up another virtual thread. When the I/O completes, the virtual thread is scheduled again, possibly on a different carrier.

I'd use them for high-concurrency, I/O-bound services — for example, a Spring Boot 3.2 app that calls several downstream APIs; you just set {{spring.threads.virtual.enabled=true}}. The trade-offs: CPU-bound work doesn't get faster, because you still have the same number of cores. On Java 21, blocking inside a {{synchronized}} block pins the virtual thread to its carrier, so I'd use {{ReentrantLock}} on hot paths — this was fixed in JDK 24. And you shouldn't pool virtual threads or cache expensive objects in {{ThreadLocal}}, because each task gets a new thread. Finally, the bottleneck often moves to the database: a million virtual threads still share a connection pool of, say, 50.

### Useful phrases
- **managed by the JVM rather than the OS**: do JVM quản lý thay vì hệ điều hành
- **unmount from / mount on a carrier**: tháo khỏi / gắn vào carrier thread
- **pinned to its carrier**: bị ghim vào carrier (không nhả ra được khi block)
- **the bottleneck moves to the database**: nút thắt chuyển sang database

> Senior tip: Đừng chỉ nói "virtual threads nhanh hơn" — chúng tăng **throughput** khi chờ I/O, không làm một request nhanh hơn. Trên Java 21, {{synchronized}} bao quanh lời gọi blocking sẽ pin carrier; dùng {{ReentrantLock}} hoặc lên JDK 24+ (JEP 491). Theo dõi pinning bằng JFR event {{jdk.VirtualThreadPinned}}. Và nhớ giới hạn concurrency tới tài nguyên hữu hạn (DB pool, API bên ngoài) bằng {{Semaphore}}.

### Lỗi người Việt hay mắc
- Nhầm virtual thread với thread pool.
- Bỏ qua vấn đề pinned carrier.`,
  follow: [
    'How does a virtual thread interact with ThreadLocal variables?',
    'What is a "pinned" virtual thread, and how do you avoid it?',
    'Can you replace all platform threads in a Spring Boot service with virtual threads?',
  ],
  tags: ['java-21', 'virtual-threads', 'loom', 'jvm', 'concurrency'],
  lang: 'en',
},
{
  id: 'english-065',
  topic: 'english',
  level: 'lead',
  q: 'In a system design round, how do you politely clarify ambiguous requirements before you start designing?',
  a: `**Tóm tắt:** Đừng bắt đầu thiết kế khi chưa hiểu rõ yêu cầu. Cấu trúc: xác nhận lại bằng lời mình → hỏi 1-2 câu có lý do → nêu giả định → đề xuất bước tiếp theo.

### Sample answer
Before I draw any boxes, I play the problem back in my own words: "So we need a system that processes about a thousand orders per second, goes multi-region within six months, and stays under fifty thousand dollars a month — did I miss anything?" That buys me a few seconds and catches misunderstandings early.

Then I ask a few clarifying questions, each with a reason: "Do clients retry failed requests? If they do, I'll need idempotency keys to avoid duplicate orders." Or: "Is a thousand per second the average or the peak? That changes how much headroom I plan for."

Next, I state my assumptions out loud: "I'll assume the thousand is peak traffic, latency matters more than cost, and we already run on Kubernetes. Please stop me if any of that is wrong." Then I sketch a high-level design and check that we're aligned before going deeper.

### Useful phrases
- **play the problem back in my own words**: nhắc lại đề bài bằng lời của mình
- **That buys me a few seconds.**: giúp tôi có thêm vài giây suy nghĩ
- **each question comes with a reason**: mỗi câu hỏi đi kèm lý do
- **Please stop me if any of that is wrong.**: nếu có gì sai, anh/chị cứ ngắt lời tôi

> Senior tip: Đừng bắt đầu từ công cụ. Hỏi scope, scale, latency, budget, constraints trước. Nếu không hiểu, nói: "Could you clarify what you mean by 'scalable'?"

### Lỗi người Việt hay mắc
- Nói "Can you repeat again?" (thừa từ; nói "Could you say that again?").
- Hỏi 10 câu liền một lúc → nên hỏi 3–5 câu quan trọng nhất (scale, consistency, latency), phần còn lại nêu thành giả định.`,
  follow: [
    'What if the interviewer says "just design it"?',
    'How many clarifying questions is too many?',
    'How do you handle a wrong assumption?',
  ],
  tags: ['system-design', 'communication', 'interview-skills', 'clarify'],
  lang: 'en',
},
{
  id: 'english-066',
  topic: 'english',
  level: 'senior',
  q: 'How do you explain a trade-off between two technical options to a non-technical stakeholder?',
  a: `**Tóm tắt:** Đừng nói thuật ngữ kỹ thuật. Dùng ẩn dụ hoặc ví dụ từ đời sống + chi phí rõ ràng + đề xuất cụ thể. Kết thúc bằng một khuyến nghị, không phải "it depends" rồi dừng. Stakeholder cần ra quyết định, không học kiến trúc.

### Sample answer
I start with a concrete analogy: "A monolith is like one big restaurant kitchen; microservices are like a row of food trucks. Food trucks can grow independently, but you have to manage many more of them."

Then I put numbers on it: "We're a team of eight, and we deploy six times a week without problems. Splitting into services would mean extra infrastructure, monitoring and on-call — I'd estimate that takes a quarter or more of our time for the first few months, before we ship any new feature. Splitting pays off when you have several teams that block each other, or when one part of the system needs ten times more capacity than the rest. We're not there yet.

So I recommend we keep the monolith but enforce clear module boundaries. That way, if we do need to split later, it's a few weeks of work, not a two-year rewrite."

### Useful phrases
- **put numbers on it**
- **operational overhead**
- **clear module boundaries**
- **not a two-year rewrite**

> Senior tip: Đừng nói "it depends" rồi dừng — stakeholder cần một khuyến nghị. Nếu bạn thực sự không chắc, nói: "Based on the data I have, I recommend X. If the team size doubles, we should revisit Y." Cũng đừng dạy lại định nghĩa — họ đã thuê bạn để ra quyết định, không phải để học kiến trúc. Luôn kết thúc bằng câu hỏi: "Does that match your understanding of the business priority?"

### Lỗi người Việt hay mắc
- Dùng từ tiếng Việt xen lẫn tiếng Anh khi giải thích cho người nước ngoài.
- Chỉ nói ưu điểm, không nói chi phí rõ ràng.
- Kết thúc bằng "it depends" mà không đưa khuyến nghị.`,
  follow: [
    'How do you explain latency to a PM?',
    'What if the stakeholder insists on microservices?',
    'How do you handle a wrong technical term?',
  ],
  tags: ['communication', 'stakeholder', 'trade-off', 'system-design'],
  lang: 'en',
},
{
  id: 'english-067',
  topic: 'english',
  level: 'lead',
  q: 'How do you handle interviewer pushback or challenge during system design?',
  a: `**Tóm tắt:** Đừng phòng thủ. Cấu trúc: thừa nhận điểm hợp lý → hỏi rõ thách thức → điều chỉnh hoặc đưa bằng chứng → đề xuất kiểm tra. Điều này cho thấy bạn có thể hợp tác dưới áp lực và sẵn sàng điều chỉnh thiết kế dựa trên dữ liệu mới.

### Sample answer
First, I listen to the whole challenge and acknowledge what's valid: "That's a fair challenge — read replicas help with read load, but they don't help if the primary goes down." Then I ask what the concern really is: "Are you more worried about cost, complexity, or a specific failure mode? My answer would be different depending on the main risk."

Next, I either bring evidence or adjust the design: "If the main concern is cost, I'd keep one primary database and add a cache for the hot reads, with a short TTL. If it's availability, then a standby in a second availability zone with automatic failover is worth the extra cost — for example, Multi-AZ on RDS. With a 99.9 percent uptime target, I'd lean towards the standby, because a single-zone database makes that target hard to meet."

If they push further: "I see your point. Let me adjust: we start with a single region and a Multi-AZ database, add connection pool limits and circuit breakers, and write a runbook for failover. We revisit multi-region once we have real traffic data. Would that work?"

### Useful phrases
- **that is a fair challenge**
- **does that match your understanding of the risk?**
- **I will adjust the design**
- **revisit after real traffic data**
- **clear upgrade path**

> Senior tip: Đừng nói "you are wrong" hoặc "that will not work" — đó là cách nhanh nhất để mất điểm. Luôn dùng "That is a valid concern", "Let me think about that", hoặc "I had not considered that failure mode". Nếu bạn thực sự không biết, nói: "That is an interesting scenario. I would test it with a load test before committing, and note it as a risk." Interviewer đánh giá khả năng học và điều chỉnh.

### Lỗi người Việt hay mắc
- Nói "no, that is wrong" hoặc "you do not understand" (rất nguy hiểm)
- Phòng thủ quá nhiều, không điều chỉnh thiết kế
- Không đưa bằng chứng cụ thể khi bị thách thức`,
  follow: [
    'What if the interviewer keeps challenging every part?',
    'How do you know when to stand firm and when to adjust?',
    'What is the best way to say you do not know?',
  ],
  tags: ['system-design', 'interview-skills', 'pushback', 'communication'],
  lang: 'en',
},
{
  id: 'english-068',
  topic: 'english',
  level: 'senior',
  q: 'How do you politely say you do not understand the technical question or you do not know the answer?',
  a: `**Tóm tắt:** Đừng bịa, đừng im lặng. Dùng cấu trúc: thừa nhận + giải thích lý do ngắn + nêu cách bạn sẽ tìm ra + đưa hướng đi tạm thời (nếu có). Điều này thể hiện trung thực, khả năng giải quyết vấn đề và trách nhiệm.\n\n### Sample answer\nIf the question is unclear: "Could you clarify what you mean by 'scalable' here? Do you mean handling more traffic, more data, or more teams working on it? Once I know that, I can give you a more concrete answer."

If I don't know the technology: "I want to be honest — I haven't used eBPF in production, so I can't give you numbers I'm confident about. Here's how I'd approach it: read the docs, run a small benchmark against our current iptables setup, and talk to the platform team. In the meantime, I can walk you through how we handle it today. Would that be useful?"

Either way, I show a method — check the docs, measure, ask someone with experience, and offer a temporary answer. That turns a gap into evidence of how I solve problems.\n\n### Useful phrases\n- **could you please clarify**\n- **I want to be honest**\n- **here is how I would approach it**\n- **would that work for you?**\n- **in the meantime**\n\n> Senior tip: Đừng nói "I would Google it" — nghe thiếu chuyên nghiệp. Hãy nói các bước cụ thể và thời gian dự kiến: "Concrete answer by tomorrow morning." Nếu kiến thức cơ bản bạn nên biết (ví dụ "How does a HashMap work?"), đừng nói không biết — hãy nêu phần bạn nhớ và nói phần còn lại bạn sẽ kiểm tra lại: "I know the spread function and load factor; I will verify the exact treeify threshold and confirm with the Java 21 source."\n\n### Lỗi người Việt hay mắc\n- Nói "I do not know" rồi dừng, không nói thêm gì\n- Bịa câu trả lời rồi bị bắt — mất hoàn toàn uy tín\n- Dùng "Can you repeat again?" (thừa từ; nói "Could you say that again?")`,
  follow: [
    'How do you handle it when the interviewer insists you guess anyway?',
    'How do you handle a question about a fundamental concept you should know?',
    'Have you ever pretended to know something and got caught? What did you learn?',
  ],
  tags: ['interview-skills', 'communication', 'honesty', 'problem-solving'],
  lang: 'en',
},
{
  id: 'english-069',
  topic: 'english',
  level: 'senior',
  q: 'Walk me through how you explain the concept of eventual consistency to a product manager, using a concrete example.',
  a: `**Tóm tắt:** Tránh thuật ngữ phân tán. Dùng ví dụ từ đời sống (mua hàng online), giải thích cơ chế đơn giản (bản sao đồng bộ dần), nêu chi phí và lợi ích cụ thể, rồi kết thúc bằng câu hỏi xác nhận hiểu biết từ phía PM.\n\n### Sample answer\nI would start with a real-world analogy: "Imagine you and a friend both update the same shared shopping list from different phones at the same time. Your phone shows 'milk' and your friend's shows 'bread.' For a few seconds, each of you sees a slightly different list. But as soon as both phones sync, you both see 'milk and bread.' That is eventual consistency: everyone sees the same list eventually, but not instantly."\n\nThen I explain the business implication: "In our payment system, we have two data centers — one in Vietnam and one in Singapore. When a user updates their profile in Vietnam, the Singapore copy might lag by about two seconds. That means if the same user tries to log in from Singapore immediately after the update, they might see the old profile for a moment. The benefit is that the system stays available even if the network link between Vietnam and Singapore is temporarily down. The cost is that we must design features that can tolerate a brief delay."\n\nThen I make it concrete: "For a financial transaction, eventual consistency is dangerous — you never want a payment to appear completed in Vietnam but missing in Singapore. That is why we use a strong consistency model for payments, with a single source of truth database. But for user preferences, notifications, or analytics, eventual consistency is fine because a two-second delay does not affect the business."\n\nFinally, I ask: "Does that match the kind of delay your feature can tolerate?" This turns the explanation into a design decision rather than a lecture.\n\n### Useful phrases\n- **everyone sees the same list eventually**\n- **the system stays available even if**\n- **a brief delay does not affect the business**\n- **does that match the kind of delay**\n- **turn the explanation into a design decision**\n\n> Senior tip: Đừng nói "eventual consistency means data will be consistent eventually" rồi dừng — PM cần biết thời gian cụ thể, rủi ro nghiệp vụ, và phần nào của hệ thống dùng nó. Luôn nói rõ: "For payments, we need immediate consistency; for notifications, a 5-second delay is acceptable." Nếu PM hỏi "Can we make it faster?", đừng chỉ nói "yes" hoặc "no" — nói chi phí: "Yes, but every write would have to wait for the other region to confirm, which adds a cross-region round trip — roughly 30 to 50 milliseconds between Vietnam and Singapore — and the write fails if the link between regions is down."\n\n### Lỗi người Việt hay mắc\n- Dùng thuật ngữ "partition tolerance", "replica", "CAP theorem" với người không chuyên\n- Không nêu ví dụ cụ thể từ hệ thống công ty\n- Kết thúc bằng "it depends" mà không đưa khuyến nghị`,
  follow: [
    'How would you explain strong consistency to the same manager?',
    'What is the business cost if the consistency window is violated?',
    'How do you decide which parts of the system need strong consistency?',
  ],
  tags: ['communication', 'eventual-consistency', 'system-design', 'stakeholder'],
  lang: 'en',
},
{
  id: 'english-070',
  topic: 'english',
  level: 'lead',
  q: 'How do you estimate the number of servers or services needed for a new feature and explain the numbers to the team?',
  a: `**Tóm tắt:** Đừng đoán. Dùng số liệu thực tế từ hệ thống hiện tại (QPS, latency, data size) → tính toán theo công thức đơn giản → thêm buffer 30% → nêu giả định rõ ràng. Giải thích bằng ngôn ngữ dễ hiểu.\n\n### Sample answer\nFirst, I collect baseline numbers from a similar service we already run: peak requests per second, average latency, and — most importantly — how much traffic one instance can handle. I get that last number from a load test, not from a formula. Say one 4-core instance handles about 250 requests per second before CPU reaches 70 percent or p99 latency goes over our target.\n\nThen I do the math. If the new feature needs to handle 1,000 requests per second at peak, that's 1,000 divided by 250, so 4 instances. I add about 30 percent headroom for spikes, deployments and losing one instance: 4 times 1.3 is 5.2, so I'd round up to 6, spread across availability zones.\n\nI use Little's Law to check the database side. Concurrency equals throughput times time. If each request holds a database connection for about 10 milliseconds, then 1,000 per second times 0.01 seconds is about 10 connections busy on average. So a pool of 10 to 15 per instance is plenty, and 6 instances means at most 90 connections — well under our database limit of 500.\n\nThen I explain it to the team: "We need 6 instances, based on a load test and 30 percent headroom. If traffic grows 50 percent next quarter, we'll need about 8. If we cut the CPU cost per request in half, we could drop to 3 or 4. These are estimates — once we're in staging, I'll rerun the load test and adjust."\n\nThis shows the number comes from data, not guesswork, and it makes the assumptions easy to challenge.\n\n### Useful phrases\n- **peak requests per second**: số request mỗi giây lúc cao điểm\n- **headroom**: phần dư công suất để dự phòng\n- **round up to**: làm tròn lên\n- **concurrency equals throughput times time** (Little's Law)\n- **makes the assumptions easy to challenge**: giúp người khác dễ phản biện giả định\n\n> Senior tip: Đừng nói "we need 5 servers" mà không giải thích từ đâu ra. Interviewer muốn nghe công thức, giả định, và buffer. Nếu bạn không có dữ liệu thực tế, nói rõ: "Based on similar services in our system, I estimate 5 servers. Once we deploy to staging, I will measure actual CPU and latency and adjust within one week." Luôn có kế hoạch điều chỉnh sau khi có dữ liệu thực tế.\n\n### Lỗi người Việt hay mắc\n- Đưa số "5 servers" mà không giải thích từ đâu ra\n- Quên thêm buffer cho đột biến và bảo trì\n- Nói "it depends" mà không đưa con số tạm thời`,
  follow: [
    'How would you adjust the estimate if processing time improved by 50%?',
    'What if the database becomes the bottleneck before the servers?',
    'How do you explain this to a manager who only cares about cost?',
  ],
  tags: ['system-design', 'estimation', 'scaling', 'communication'],
  lang: 'en',
},
{
  id: 'english-071',
  topic: 'english',
  level: 'mid',
  q: 'How do you politely ask for clarification when you do not understand an English interview question?',
  a: `**Tóm tắt:** Đừng nói "What?" hoặc im lặng. Dùng câu hỏi lịch sự + lý do để cho interviewer thấy bạn đang cố gắng hiểu, không phải lười nghe. Luôn nhắc lại phần bạn hiểu trước để xác nhận.\n\n### Sample answer\nIf I miss part of the question, I say: "Could you please repeat the last part? I want to make sure I answer the right thing." If the vocabulary is unfamiliar, I say: "Could you clarify what you mean by 'idempotency'? My understanding is that repeating the same request has the same effect as sending it once — but are you asking about it from the API design side or the database side?"\n\nThen I repeat the full question back: "So just to make sure I understand: you want me to explain how I would make a POST endpoint idempotent, considering both the client-sent key and the server-side state. Is that correct?" That shows I listened, I am precise, and I value accuracy over speed.\n\nIf the interviewer uses an idiom I do not know, I ask politely: "I am not familiar with that phrase — could you explain what 'move the needle' means in this context?" This is better than pretending to understand and answering the wrong question.\n\n### Useful phrases\n- **could you please repeat the last part**\n- **I want to make sure I answer the right thing**\n- **could you clarify what you mean by**\n- **just to make sure I understand**\n- **I am not familiar with that phrase**\n\n> Senior tip: Đừng nói "Can you repeat again?" — lỗi thừa từ rất phổ biến ("repeat" đã có nghĩa là "nói lại"). Đúng là "Could you say that again?" hoặc "Could you repeat that?". Cũng đừng nói "Sorry, my English is not good" — điều đó làm giảm uy tín. Hãy nói: "Could you speak a little slower? I want to make sure I understand every detail."\n\n### Lỗi người Việt hay mắc\n- Nói "Can you repeat again?" (thừa từ)\n- Nói "Sorry, my English is bad" (giảm uy tín)\n- Im lặng rồi đoán và trả lời sai hoàn toàn`,
  follow: [
    'How do you handle a very fast-talking interviewer?',
    'What if the interviewer uses a lot of idioms?',
    'How do you confirm your understanding without sounding slow?',
  ],
  tags: ['interview-skills', 'communication', 'clarify', 'english'],
  lang: 'en',
},
);