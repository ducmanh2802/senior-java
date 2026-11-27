/*
 * Cẩm nang Freelance & Upwork (#/upwork, tab Cẩm nang). Schema + luật nội dung: docs/UPWORK-GUIDE.md.
 * Kiểm tra: node scripts/check-upwork.js. Chương mẫu: uw-ch-01 (đọc kỹ trước khi viết chương mới).
 * Số liệu của nền tảng thay đổi theo thời gian: chỉ ghi khi chắc chắn, kèm "(tại thời điểm viết)".
 */
(window.UPWORK_GUIDE = window.UPWORK_GUIDE || []).push(
{
  id: 'uw-ch-01',
  order: 1,
  title: 'Cơ chế Upwork: tiền đi đâu và khi nào bạn được bảo vệ',
  icon: '⚙️',
  summary: 'Hiểu hai loại hợp đồng (hourly, fixed-price), dòng tiền qua escrow và điều kiện để Upwork bảo vệ bạn. Mọi case khó phía sau đều dựa trên chương này.',
  body: `**Tóm tắt:** Upwork chỉ bảo vệ tiền của bạn khi bạn làm đúng "đường ray" của nó: hourly thì giờ phải được ghi bằng Work Diary, fixed-price thì chỉ làm phần việc đã có milestone được nạp tiền (funded) và nộp bài bằng nút submit trên hợp đồng. Ra khỏi đường ray (nhận tiền ngoài, làm trước khi nạp tiền, ghi giờ thủ công) là tự bỏ bảo hiểm.

### Vì sao phải hiểu cơ chế trước khi nhận việc
Phần lớn freelancer mới mất tiền không phải vì code dở mà vì **làm việc ngoài vùng được bảo vệ**: giao toàn bộ source code trước khi khách nạp tiền milestone, đồng ý "làm thử 2 ngày rồi tính", hoặc nhận chuyển khoản riêng. Khi có tranh chấp, bộ phận hỗ trợ của Upwork chỉ nhìn vào những gì nằm trên nền tảng: hợp đồng, milestone, Work Diary, tin nhắn trong Upwork Messages, file đã nộp. Thứ gì nằm ngoài (Telegram, email riêng, cuộc gọi không ghi lại) gần như không có giá trị làm bằng chứng.

### Hai loại hợp đồng
| | Hourly | Fixed-price |
|---|---|---|
| Trả theo | giờ làm, tính theo tuần | milestone (mốc bàn giao) |
| Bạn được bảo vệ khi | giờ ghi bằng Upwork desktop app (Work Diary có ảnh chụp màn hình + memo), đúng phạm vi hợp đồng, trong giới hạn giờ/tuần khách đặt | milestone đã **funded** (tiền nằm trong escrow) trước khi bạn làm, và bạn nộp bài bằng submit work |
| Rủi ro chính | khách tranh chấp giờ ghi tay (manual time), giờ vượt weekly limit | scope creep, khách không duyệt, khách đòi hoàn tiền |
| Hợp với | việc khó ước lượng, bảo trì, hỗ trợ dài hạn | việc có đầu ra rõ, khách mới chưa tin nhau |

**Escrow** là tài khoản trung gian: khách nạp tiền milestone vào đó trước, Upwork giữ hộ, chỉ chuyển cho bạn khi milestone được duyệt (hoặc tự động giải ngân khi hết thời gian review mà khách không phản hồi). Ví dụ đời thường: giống mua hàng trên sàn thương mại điện tử, tiền nằm ở sàn cho tới khi người mua bấm "đã nhận hàng" hoặc hết hạn khiếu nại.

### Dòng tiền của một milestone fixed-price
~~~seq
title: Một milestone fixed-price đi đúng đường ray
actors: Client | Upwork | Freelancer
Client -> Upwork: Nạp tiền milestone 1 (funded, vào escrow)
Upwork --> Freelancer: Thông báo milestone đã funded
Freelancer -> Freelancer: Bắt đầu làm (chỉ sau bước này)
Freelancer -> Upwork: Submit work kèm file/link + mô tả
Upwork --> Client: Yêu cầu review trong thời hạn
Client -> Upwork: Approve hoặc request changes
Upwork --> Freelancer: Giải ngân (hoặc tự giải ngân khi quá hạn review)
~~~

Ba điểm hay bị bỏ qua:
1. **"Funded" khác "đã thỏa thuận".** Khách nhắn "ok bắt đầu đi" nhưng chưa nạp tiền thì milestone chưa được bảo vệ. Kiểm tra trạng thái trên trang hợp đồng, không tin lời nhắn.
2. **Nộp bài phải qua submit work.** Gửi link GitHub trong tin nhắn không làm đồng hồ review chạy. Không submit thì không có mốc tự giải ngân.
3. **Request changes không phải từ chối.** Khách được yêu cầu sửa; bạn sửa trong phạm vi đã thoả thuận rồi submit lại. Yêu cầu ngoài phạm vi thì đề xuất milestone mới (xem case scope creep).

### Hourly: giờ nào được bảo vệ
Hourly protection dựa trên **Work Diary**: Upwork desktop app chụp màn hình ngẫu nhiên theo từng khoảng 10 phút và ghi mức hoạt động bàn phím/chuột, kèm memo bạn viết. Khách xem lại giờ trong một khoảng thời gian review sau khi tuần kết thúc và có thể tranh chấp giờ trong khoảng đó. Giờ được bảo vệ khi: ghi bằng app, ảnh chụp cho thấy đúng việc của hợp đồng, memo mô tả rõ, không vượt giới hạn giờ/tuần. **Manual time** (giờ nhập tay) thường không được bảo vệ, chỉ dùng khi khách đã đồng ý bằng tin nhắn trên Upwork.

Ví dụ: hợp đồng 30 USD/giờ, limit 20 giờ/tuần. Bạn làm 24 giờ vì "khách gấp". 4 giờ vượt limit không được tính tiền. Muốn làm thêm thì nhờ khách nâng limit trên hợp đồng **trước**, xác nhận bằng tin nhắn.

### Phí và rút tiền (mức cơ chế)
Upwork thu phí dịch vụ trên mỗi khoản bạn nhận và mức phí đã đổi nhiều lần; xem trang Fees trên Upwork Help trước khi báo giá. Khi tính giá, luôn tính **tiền thực nhận** = giá × (1 − phí) − phí rút tiền − chênh lệch tỷ giá. Tiền vừa giải ngân thường qua một khoảng thời gian chờ (security period) rồi mới rút được, nên đừng hứa trả nợ hay chi tiêu theo ngày khách approve.

### Điều khoản dễ vi phạm nhất
- **Lôi khách ra ngoài:** khách bạn gặp qua Upwork thì trong 24 tháng không được chuyển sang làm/nhận tiền ngoài nền tảng, trừ khi trả conversion fee theo quy định. Vi phạm có thể bị khoá tài khoản vĩnh viễn, mất luôn số dư.
- **Chia sẻ thông tin liên lạc trước khi có hợp đồng:** hệ thống quét tin nhắn; khách lạ đòi chuyển sang Telegram/WhatsApp ngay là dấu hiệu lừa đảo kinh điển.
- **Cho người khác dùng tài khoản / đứng tên hộ:** vi phạm và là đường tắt bị khoá tài khoản.

### Pitfall thực tế
- Làm milestone 2 trong khi milestone 2 chưa funded vì "khách quen rồi" → khách hết ngân sách, bạn mất trắng một tuần.
- Dùng hourly nhưng quên bật app một buổi, nhập manual 5 giờ → khách tranh chấp, giờ đó không được bảo vệ.
- Gửi source code đầy đủ qua tin nhắn trước khi submit → khách có sản phẩm, không còn động lực approve.

> Senior tip: Trước mỗi hợp đồng, tự hỏi một câu: "Nếu ngày mai khách biến mất, phần nào trong công sức của mình đang được Upwork bảo vệ?". Câu trả lời phải là "tất cả những gì đã làm". Nếu không, dừng lại và yêu cầu fund milestone hoặc chuyển sang hourly có Work Diary trước khi làm tiếp.`,
  checklist: [
    'Mở một hợp đồng bất kỳ (hoặc xem trang Help) và chỉ ra trạng thái funded của từng milestone.',
    'Cài Upwork desktop app, thử bật/tắt ghi giờ và viết memo cho một phiên làm việc.',
    'Đọc trang Fees và Payment Protection trên Upwork Help, ghi lại tỷ lệ phí hiện tại vào ghi chú của bạn.',
    'Tính tiền thực nhận cho một milestone 500 USD theo phí hiện tại và phí rút tiền của phương thức bạn dùng.',
    'Viết sẵn một câu trả lời lịch sự khi khách đề nghị chuyển sang làm ngoài Upwork.',
  ],
  related: ['remote-010', 'remote-011', 'remote-012', 'remote-016'],
},
{
  id: 'uw-ch-02',
  order: 2,
  title: 'Hồ sơ đạt chuẩn cho dev Java',
  icon: '👤',
  summary: 'Xây profile Upwork khiến khách muốn mời phỏng vấn: title, overview, portfolio khi chưa có review, rate khởi điểm và lộ trình tăng giá, xác minh danh tính, tránh các lỗi khiến profile bị từ chối.',
  body: `**Tóm tắt:** Profile Upwork là "bản bán hàng" tự động làm việc 24/7. Title phải chứa từ khóa khách tìm (Java, Spring Boot, AWS, Microservices), Overview kể câu chuyện "vấn đề khách gặp → bạn giải quyết như thế nào → kết quả số", Portfolio 2–3 dự án cá nhân thay review khi mới bắt đầu, Rate khởi điểm đủ sống sót tại Việt Nam nhưng chưa quá cao để không bị lọc, Identity verification bật sớm để lấy badge và tăng uy tín. Tránh: title chung chung, overview tự ngợi, portfolio chỉ link GitHub không có mô tả, rate quá thấp (bị coi là junior) hoặc quá cao (không khớp kinh nghiệm), bỏ qua verification.
 
### Title: dòng chữ quan trọng nhất
Title hiển thị ở kết quả tìm kiếm, invitation, proposal preview. Khách tìm "Java Spring Boot AWS" — title không có từ khóa này sẽ không xuất hiện.
 
**Cấu trúc khuyến nghị:** [Vị trí] + [Tech stack cốt lõi] + [Đặc thù mạnh] + [Kết quả tiêu biểu]
 
Ví dụ:
- ❌ "Java Developer"
- ❌ "Senior Backend Developer - Java, Spring, Microservices"
- ✅ "Senior Java Backend Engineer | Spring Boot, AWS, Kafka | Payment Systems & High-Load APIs"
- ✅ "Java Backend Developer | Spring Boot, PostgreSQL, Docker | E-commerce & Fintech APIs"
 
**Từ khóa bắt buộc (tại thời điểm viết, kiểm tra lại trên Upwork Help):** Java, Spring Boot, REST API, Microservices, AWS/GCP/Azure, Docker, Kubernetes, PostgreSQL/MySQL, Kafka/RabbitMQ, CI/CD. Chọn 4–6 từ khóa phù hợp nhất với bạn, nhét đầy 100 ký tự cho title.
 
### Overview: kể chuyện, không liệt kê kỹ năng
Overview có 5000 ký tự nhưng khách chỉ đọc 2–3 dòng đầu. Cấu trúc 4 đoạn:
 
1. **Hook (dòng 1–2):** Nêu vấn đề đau của khách bạn giải quyết. "Giúp startup fintech scale API từ 1k → 100k req/giây mà không downtime."
2. **Chứng minh (3–5 dòng):** 2–3 dự án cụ thể có số liệu. "Xây hệ thống thanh toán xử lý 50k giao dịch/ngày, latency p99 < 200ms, zero-downtime deployment với Blue-Green trên AWS ECS."
3. **Cách làm việc (2–3 dòng):** Async communication, weekly demo, test coverage ≥ 80%, documentation-first. Khách thuê senior muốn người tự chủ, không phải người chờ ticket.
4. **Call to action (dòng cuối):** "Mở để hợp tác dài hạn với team Java cần scale backend. Hãy nhắn tin để thảo luận yêu cầu của bạn."
 
**Sai lầm hay gặp:**
- Viết "Tôi có 4 năm kinh nghiệm Java, biết Spring, Hibernate, MySQL..." — khách không quan tâm bạn biết gì, quan tâm bạn **làm được gì**.
- Copy paste job description của công ty cũ.
- Không có số liệu cụ thể.
- Viết tiếng Việt (overview phải tiếng Anh, trừ khi bạn chỉ target khách Việt — rất hiếm).
 
### Portfolio khi chưa có review
Khách mới vào profile nhìn: Title → Overview → Portfolio → Reviews (trống) → Rate. Portfolio là cơ hội duy nhất chứng minh kỹ năng trước khi có review.
 
**2–3 dự án mẫu (mỗi dự án 1 card):**
| Dự án | Mô tả 1–2 câu | Tech stack | Link demo / repo | Vai trò của bạn |
|---|---|---|---|---|
| E-commerce API | REST API cho sàn TMĐT 10k đơn/ngày, tích hợp VNPAY, MoMo | Spring Boot 3, PostgreSQL, Redis, Kafka, Docker, AWS ECS | github.com/you/ecom-api (private, cho xem khi chat) | Sole backend dev: thiết kế DB, API, CI/CD, deploy |
| Real-time Notification | Hệ thống push thông báo real-time 1M user, WebSocket + SSE | Java 21, Spring WebFlux, Redis Pub/Sub, Kubernetes | github.com/you/notif-svc | Lead backend: architecture, load test, monitoring |
| Legacy Migration | Di chuyển monolith Java 8 → microservices Spring Boot 3, Strangler Fig | Java 8/17, Spring Boot, PostgreSQL, Flyway, GitLab CI | (mô tả case study chi tiết trong overview) | Tech lead: planning, code review, stakeholder sync |
 
**Mẹo:** Nếu repo private, ghi "Private repo — happy to walk through in a call". Không để trống link.
 
### Chọn hourly rate khởi điểm và lộ trình tăng giá
Rate trên Upwork công khai, khách nhìn trước khi đọc proposal. Rate quá thấp → bị lọc bởi filter "Expert only" hoặc bị coi là junior. Rate quá cao → không khớp kinh nghiệm, khách không mời.
 
**Cơ chế phí Upwork (tại thời điểm viết, kiểm tra lại):**
- 10% phí dịch vụ trên từng khoản nhận (đã thay đổi nhiều lần, xem trang Fees).
- Phí rút tiền: Payoneer ~$1.5/lần, Wise ~0.5–1%, chuyển ngân hàng VN ~$30/lần (tùy ngân hàng).
- Tiền thực nhận ≈ Rate × 0.9 − phí rút − chênh lệch tỷ giá.
 
**Lộ trình gợi ý cho dev Java 4 năm ở Việt Nam (tại thời điểm viết):**
| Giai đoạn | Rate đề xuất (USD/h) | Lý do | Mục tiêu |
|---|---|---|---|
| Tháng 1–3 (0 review) | 25–35 | Đủ sống sót VN, cạnh tranh với junior khu vực khác, dễ lấy job đầu | 3–5 job, JSS ≥ 90%, 5-star reviews |
| Tháng 4–9 (JSS 90%+, 3+ review) | 40–55 | Đã có bằng chứng, vào được filter "Expert", khách mời chủ động | 8–10 job, Top Rated badge |
| Tháng 10–18 (Top Rated, portfolio mạnh) | 60–85 | Senior thực sự, khách trả cao cho yên tâm | Hợp đồng dài hạn, rate ổn định |
| 18+ tháng (Chuyên gia ngách) | 90–150+ | Payment/Fintech, High-load, Legacy modernization — ngách ít người làm | Chọn khách, đề xuất scope, upsell |
 
**Quy tắc tăng giá:**
- Chỉ tăng trên hợp đồng **mới**. Hợp đồng cũ giữ rate cũ trừ khi renegotiate (hiếm được đồng ý).
- Tăng 10–15% mỗi lần, kèm lý do: "Từ hợp đồng trước tôi đã tối ưu query giảm 60% chi phí cloud, rate mới phản ánh giá trị đó".
- Không tăng vì "muốn kiếm nhiều hơn" — khách không quan tâm chi phí sống của bạn.
 
### Xác minh danh tính (Identity Verification)
Badge "Verified ✓" hiển thị ngay trên avatar, tăng tỷ lệ được mời phỏng vấn (Upwork công bố verified freelancer có tỷ lệ hire cao hơn).
 
**Quy trình (tại thời điểm viết):**
1. Settings → Identity Verification → Start Verification.
2. Chụp mặt trước/sau CMND/CCCD hoặc hộ chiếu (màu, không chụp màn hình điện thoại).
3. Chụp selfie cầm giấy tờ (hệ thống so khớp khuôn mặt).
4. Chờ 1–3 ngày duyệt. Nếu bị từ chối: kiểm tra ánh sáng, góc chụp, giấy tờ còn hạn, tên khớp với tên tài khoản Upwork.
 
**Lợi ích:** Badge Verified, có thể xin Video Verified (badge camera), khách tin tưởng hơn, một số job chỉ accept verified freelancer.
 
### Lý do profile bị từ chối (Rejected) và cách sửa
Upwork duyệt profile thủ công (tự động + nhân viên). Lý do thường gặp:
 
| Lý do | Dấu hiệu | Cách sửa |
|---|---|---|
| **Title/Overview quá chung chung** | "Java Developer", "I am hardworking" | Viết cụ thể: tech stack, domain, kết quả số |
| **Không có portfolio** | Tab Portfolio trống | Thêm 2–3 dự án cá nhân như mẫu trên |
| **Kỹ năng không khớp** | Tag "Python", "React" nhưng overview chỉ nói Java | Chỉ giữ skill Java backend, xóa skill không liên quan |
| **Ảnh đại diện không chuyên nghiệp** | Selfie, ảnh nhóm, logo công ty | Ảnh chân dung rõ mặt, nền đơn giản, mặc áo sơ mi/polo |
| **Tên không khớp giấy tờ** | Upwork: "Nguyen Van A", CMND: "NGUYEN VAN B" | Đổi tên Upwork khớp giấy tờ (Settings → Personal Info) |
| **Địa chỉ/VN không xác thực được** | Điền địa chỉ ngẫu nhiên | Dùng địa chỉ thật, Upwork có thể yêu cầu utility bill |
| **Vi phạm chính sách** | Đã từng bị ban, dùng VPN đổi IP liên tục | Đừng dùng VPN, một tài khoản một người, tuân thủ ToS |
 
**Nếu bị reject:** Đọc email từ Upwork (thường ghi lý do cụ thể). Sửa → Submit lại. Không tạo tài khoản mới — Upwork liên kết thiết bị/IP, multi-account bị ban vĩnh viễn.
 
### Checklist thực hành
 
> Senior tip: Profile không phải "xong là xong". Cứ 3 tháng cập nhật lại: thêm dự án mới, cập nhật rate, chỉnh overview theo ngách bạn muốn đi sâu (payment, high-load, legacy...). Khách tìm "Java Spring Boot Kafka" — nếu overview bạn không nhắc Kafka, bạn không xuất hiện.`,
  checklist: [
    'Viết lại title theo cấu trúc: Vị trí + Tech stack cốt lõi + Đặc thù mạnh + Kết quả tiêu biểu (≤ 100 ký tự).',
    'Viết overview 4 đoạn: Hook → Chứng minh có số liệu → Cách làm việc → Call to action (tiếng Anh).',
    'Tạo 2–3 portfolio card: tên, mô tả 1–2 câu, tech stack, link demo/repo, vai trò của bạn.',
    'Tính rate khởi điểm: tiền thực nhận = rate × 0.9 − phí rút − chênh lệch tỷ giá, đảm bảo ≥ mức sống sót VN.',
    'Lập lộ trình tăng giá 18 tháng: 3 tháng review → 6 tháng Top Rated → 9 tháng chuyên gia ngách.',
    'Bật Identity Verification: chụp CMND/CCCD/hộ chiếu + selfie cầm giấy tờ, chờ duyệt 1–3 ngày.',
    'Kiểm tra profile với checklist từ chối: title cụ thể, portfolio có, skill khớp, ảnh chuyên nghiệp, tên khớp giấy tờ.',
  ],
  related: ['remote-001', 'remote-002', 'remote-008', 'remote-009', 'remote-026', 'remote-053', 'uw-ch-01'],
},
{
  id: 'uw-ch-03',
  order: 3,
  title: 'Tìm job và viết proposal',
  icon: '🔍',
  summary: 'Lọc job hiệu quả, đọc tín hiệu khách (payment verified, hire rate, spend), quản lý Connects có chiến lược, cấu trúc proposal 5 phần, trả lời screening questions, theo dõi phễu chuyển đổi.',
  body: `**Tóm tắt:** Không phải apply nhiều là được việc — phải apply **đúng** job, proposal **đúng** người, Connects **đúng** chỗ. Lọc job bằng từ khóa + filter (Payment verified, Hourly/Fixed, Budget, Client history). Đọc tín hiệu: Payment verified = tiền thật, Total spent > $10k = khách nghiêm túc, Hire rate > 30% = khách dễ thuê. Connects là tiền: không lãng phí vào job "ghost", job quá cạnh tranh, job không khớp skill. Proposal 5 phần: Hook → Hiểu bài toán → Chứng minh liên quan → Cách làm việc → Call to action. Trả lời screening questions ngắn gọn, chứng minh đã đọc job post. Theo dõi phễu: Gửi → Được xem → Phỏng vấn → Thuê — tối ưu từng bước.
 
### Lọc job: không apply tất cả
Mỗi Connects tốn tiền (tại thời điểm viết: ~$0.15/Connect, gói 10/60/120 connects/tháng). 50 connects/tháng = ~$7.5. Nếu apply 50 job, được 1 phỏng vấn → CAC (cost per interview) = $7.5. Nếu apply 10 job chọn lọc, được 3 phỏng vấn → CAC = $0.5.
 
**Filter bắt buộc (tại thời điểm viết, kiểm tra lại):**
- **Payment Verified: Yes** — khách đã thêm thẻ/tài khoản, tiền ở escrow thực tế.
- **Job type:** Hourly (dài hạn, khó ước lượng) hoặc Fixed-price (rõ scope). Chọn theo sở thích.
- **Budget:** Hourly ≥ $25/h (dev 4 năm), Fixed-price ≥ $500 (tránh job $50–100 — thường scope creep).
- **Client history:** Total spent > $1,000 (có tiền), Hires ≥ 3 (quen thuê), Hire rate ≥ 20% (dễ thuê), Average rating ≥ 4.5.
- **Posted:** < 7 ngày (job cũ thường đã có freelancer hoặc khách không gấp).
- **Connects required:** ≤ 6 (job > 6 connects thường là enterprise, cạnh tranh khốc liệt).
 
**Từ khóa tìm kiếm cho Java backend:**
- Core: "Java Spring Boot", "Spring Boot REST API", "Java Microservices"
- Domain: "Payment integration", "Fintech backend", "E-commerce API", "High load system"
- Cloud/Infra: "AWS Java", "Kubernetes Spring Boot", "Docker Java", "CI/CD Java"
- Legacy: "Java 8 to 17 migration", "Legacy modernization", "Strangler Fig pattern"
 
**Kết hợp:** "Spring Boot AWS payment" + Payment Verified + Hourly $30+ + Posted < 3 days.
 
### Đọc tín hiệu khách (Client Signals)
Trước khi apply, vào profile khách (click tên khách trên job post). Nhìn 5 chỉ số:
 
| Chỉ số | Tốt | Cảnh báo | Đỏ |
|---|---|---|---|
| **Payment Verified** | ✅ Yes | ❌ No | — |
| **Total Spent** | > $10,000 | $1,000–10,000 | < $1,000 (hoặc 0) |
| **Hires / Job Posts** | > 30% | 10–30% | < 10% (ghost client) |
| **Avg Rating Given** | ≥ 4.7 | 4.0–4.7 | < 4.0 (khó tính) |
| **Reviews từ freelancer** | "Great communication", "Clear requirements" | "Scope creep", "Slow payment", "Micromanage" | "Dispute", "Non-payment", "Ghosted" |
 
**Ví dụ đọc review:** Khách có review "Client asked for 3x original scope without extra pay" → **bỏ qua**. Khách có review "Clear specs, fast approval, paid on time" → **ưu tiên**.
 
### Quản lý Connects có chiến lược
**Quy tắc vàng:** Connects là ngân sách marketing. Không apply job:
- Không Payment Verified (trừ khi job cực khớp và bạn sẵn sàng rủi ro).
- Budget thấp bất thường ($100 cho "full e-commerce backend").
- Description viết lóng ngóng, không có tech stack cụ thể.
- Khách mới đăng ký (Joined < 30 days, 0 hires, 0 spent) — exception: startup có funding, description chi tiết.
- Job > 14 ngày không hire (ghost job).
 
**Phân bổ connects/tháng (ví dụ 60 connects):**
- 30 connects: Job khớp 90%+ skill, Payment Verified, client good history → apply ngay.
- 20 connects: Job khớp 70%, client decent, cần customize proposal nhiều hơn → chọn lọc.
- 10 connects: "Long shot" — job dream company, rate cao, skill hơi thiếu nhưng bạn tự tin học nhanh.
- Giữ 10 connects dự phòng cho invitation (khách mời bạn apply — không tốn connects).
 
**Mẹo:** Upwork cho phép "Save job" (lưu job). Lưu 20–30 job/ngày, cuối tuần review và apply 5–10 job tốt nhất. Không apply ngay khi thấy — dễ apply cảm xúc.
 
### Cấu trúc Proposal 5 Phần (Proposal Framework)
Proposal được cắt ngang sau ~200 ký tự đầu (client thấy preview). Phần mở đầu quyết định client có click "Read more" không.
 
~~~seq
title: Phễu chuyển đổi Proposal
actors: Freelancer | Upwork | Client
Freelancer -> Upwork: Gửi proposal (tiêu đề + 200 ký tự đầu)
Upwork --> Client: Hiển thị trong danh sách ứng viên
Client -> Client: Đọc preview 3 giây → Click "Read more" hoặc Next
Client -> Freelancer: Mời phỏng vấn (Invitation to interview)
Freelancer -> Client: Phỏng vấn → Chốt hợp đồng
~~~
 
**5 phần (mỗi phần 2–4 câu):**
 
1. **Hook (dòng 1–2, hiển thị trong preview):** Nêu bạn hiểu bài toán + một kết quả liên quan.
   > "Hi [Tên khách], I saw you need a Spring Boot API for payment processing with VNPAY/MoMo integration. I recently built a similar system handling 50k transactions/day with p99 latency < 200ms."
 
2. **Hiểu bài toán (Understanding):** Tóm tắt yêu cầu khách bằng lời bạn — chứng minh đã đọc kỹ job post.
   > "You need: (1) REST API for checkout flow, (2) VNPAY + MoMo webhook handling, (3) Idempotency for retry safety, (4) Deploy on AWS ECS with CI/CD. Correct me if I missed anything."
 
3. **Chứng minh liên quan (Relevant Proof):** 1–2 dự án gần nhất khớp nhất, có số liệu.
   > "Relevant experience: (a) Fintech payment gateway: Spring Boot 3, PostgreSQL, Kafka, VNPAY/MoMo, 50k txn/day, zero-downtime deploy. (b) E-commerce order service: idempotency keys, saga pattern for distributed transactions. Happy to share code walkthrough."
 
4. **Cách làm việc (How I Work):** Đặt kỳ vọng sớm — async comm, weekly demo, test coverage, documentation.
   > "My workflow: (1) Kickoff call align scope, (2) Weekly demo on staging, (3) PR + test coverage ≥ 80%, (4) Documentation in Notion/Confluence, (5) Async updates via Slack/Upwork, available for calls in your timezone (UTC+7, flexible 7–11 PM your time)."
 
5. **Call to Action (CTA):** Mời bước tiếp theo cụ thể.
   > "Available for a 15-min call this week to discuss scope and timeline. What time works for you? Best, [Tên bạn]"
 
**Template proposal (copy-paste, chỉnh 5 phút/job):**
~~~text
Hi [Client Name],

I saw you need [1-sentence summary of the problem]. I recently [1-sentence relevant result with metrics].

You need: [bullet 1], [bullet 2], [bullet 3]. Correct me if I missed anything.

Relevant experience:
- [Project 1]: [tech stack], [metric 1], [metric 2]
- [Project 2]: [tech stack], [metric 1]

My workflow: Kickoff → Weekly demo → PR + tests ≥ 80% → Docs → Async updates. Available for calls in your timezone (UTC+7, flexible evenings).

Available for a 15-min call [day range] to discuss scope. What time works?

Best,
[Your Name]
~~~
 
### Trả lời Screening Questions (Câu hỏi sàng lọc)
Nhiều job có 3–5 câu hỏi bắt buộc. Khách dùng để lọc bot và freelancer không đọc job post.
 
**Nguyên tắc:**
- Trả lời **ngắn**, **cụ thể**, **có bằng chứng**.
- Không copy-paste câu trả lời chung cho mọi job.
- Nếu không biết: thành thực nói "I haven't used X but I've done Y which is similar; I can ramp up in 1–2 days."
 
**Ví dụ:**
- Q: "Have you integrated VNPAY before?" → A: "Yes, integrated VNPAY Checkout & QR in a Spring Boot project (50k txn/day). Handled webhook idempotency with Redis distributed lock. Code reference: github.com/you/vnpay-demo (private, can share in call)."
- Q: "What's your availability for calls?" → A: "UTC+7 (Vietnam). Available 7–11 PM EST / 6–10 PM PST / 1–5 AM CET on weekdays. Flexible for kickoff and weekly demo."
- Q: "Expected hourly rate?" → A: "35–45 USD/h depending on scope and contract length. Open to discuss fixed-price for well-defined milestones."
 
### Theo dõi Phễu (Funnel Tracking)
Không đoán — đo. Tạo spreadsheet đơn giản:
 
| Tuần | Job apply | Connects dùng | Được xem | Phỏng vấn | Thuê | Tỷ lệ xem/apply | Tỷ lệ phỏng vấn/xem | Tỷ lệ thuê/phỏng vấn |
|---|---|---|---|---|---|---|---|---|
| 1 | 10 | 42 | 6 | 3 | 1 | 60% | 50% | 33% |
| 2 | 8 | 36 | 5 | 2 | 1 | 63% | 40% | 50% |
 
**Chuẩn tốt (benchmark tại thời điểm viết):**
- Được xem / Apply: ≥ 50% (preview hook tốt)
- Phỏng vấn / Được xem: ≥ 30% (proposal body tốt, profile tốt)
- Thuê / Phỏng vấn: ≥ 40% (phỏng vấn tốt, rate hợp lý)
 
**Nếu tỷ lệ thấp:**
- Thấp ở "Được xem": Sửa Hook + Title proposal + Profile title/overview.
- Thấp ở "Phỏng vấn": Sửa phần Understanding/Proof/Workflow trong proposal, hoặc Profile portfolio.
- Thấp ở "Thuê": Rate quá cao, komunikasi kém khi phỏng vấn, không hỏi đủ scope → xem chương 4.
 
> Senior tip: Đừng apply job "dễ" (budget thấp, client mới, mô tả mơ hồ) chỉ để có review. Review 5-sao cho job $100 làm hại profile hơn là không có review — khách sau này nhìn rate history thấy $100 sẽ neo thấp. Chỉ apply job bạn thực sự muốn làm và rate xứng đáng.`,
  checklist: [
    'Tạo 3–5 saved search với filter: Payment Verified + Budget phù hợp + Tech stack Java/Spring Boot + Posted < 7 ngày.',
    'Mỗi tuần review 20–30 job đã lưu, chọn 5–8 job tốt nhất apply (tiết kiệm connects, tăng chất lượng).',
    'Viết template proposal 5 phần, chuẩn bị sẵn 3–4 bullet "Relevant experience" xoay vòng cho từng ngách.',
    'Điền spreadsheet funnel tracking: Apply → Viewed → Interview → Hired, cập nhật hàng tuần.',
    'Phân tích tỷ lệ chuyển đổi: thấp ở bước nào → sửa bước đó (Hook, Profile, Phỏng vấn, Rate).',
    'Tổng connects/tháng và ngân sách: không vượt 10% thu nhập freelance dự kiến.',
  ],
  related: ['remote-003', 'remote-004', 'remote-005', 'remote-006', 'remote-027', 'remote-028', 'remote-055', 'uw-ch-01', 'uw-ch-02'],
},
{
  id: 'uw-ch-04',
  order: 4,
  title: 'Phỏng vấn và chốt hợp đồng',
  icon: '🤝',
  summary: 'Chuẩn bị cuộc gọi Upwork, câu hỏi phải hỏi khách để tránh scope creep, chọn hourly vs fixed-price, viết milestone có tiêu chí nghiệm thu rõ ràng, đọc offer kỹ trước khi chấp nhận, nhận biết điều kiện phải từ chối.',
  body: `**Tóm tắt:** Phỏng vấn Upwork không phải để "bán hàng" — là để **đồng thuận scope, timeline, rate, cách làm việc** trước khi cam kết. Chuẩn bị: research khách, đọc lại job post, chuẩn bị 5–7 câu hỏi thăm dò scope. Phỏng vấn: hỏi kỹ requirements, xác nhận tech stack, điều tra rủi ro (scope creep, client chưa rõ yêu cầu, deadline bất hợp lý). Chọn hợp đồng: Hourly cho việc khó ước lượng/bảo trì; Fixed-price cho scope rõ, milestone funded trước khi làm. Milestone phải có: deliverable cụ thể, tiêu chí nghiệm thu (acceptance criteria), deadline, giá. Đọc offer: kiểm tra rate, weekly limit, payment terms, IP ownership, confidentiality. Từ chối: làm trước khi funded, manual time only, scope không giới hạn, IP assignment trước khi trả tiền, NDA quá rộng.
 
### Chuẩn bị trước cuộc gọi (Pre-call Prep)
**15–30 phút trước call:**
1. **Đọc lại job post** — highlight mọi yêu cầu kỹ thuật, deadline, budget hint.
2. **Xem profile khách** — Total spent, Hires, Reviews từ freelancer trước (tìm "scope creep", "slow to respond", "unclear requirements").
3. **Research domain** — nếu khách làm fintech: đọc về PCI-DSS, 3D Secure; e-commerce: inventory, cart, checkout flow; healthcare: HIPAA basics.
4. **Chuẩn bị 5–7 câu hỏi** (xem phần dưới).
5. **Kiểm tra kỹ thuật** — mic, camera, network, background gọn gàng, Upwork app mở sẵn (để note ngay).
6. **Mindset:** Bạn là **chuyên gia tư vấn**, không phải "người xin việc". Khách cần bạn giải quyết vấn đề, bạn đánh giá xem có hợp tác được không.
 
### 7 Câu hỏi BẮT BUỘC phải hỏi khách
Mỗi câu hỏi phục vụ mục đích: làm rõ scope, phát hiện rủi ro, đặt ranh giới.
 
| # | Câu hỏi | Mục đích | Dấu hiệu đỏ (Red flag) |
|---|---|---|---|
| 1 | "Could you walk me through the exact user flow for the most critical feature?" | Làm rõ scope, độ phức tạp thực tế | Khách không giải thích được, "you figure it out" |
| 2 | "What does 'done' look like for this milestone? Any acceptance criteria documented?" | Ép khách định nghĩa nghiệm thu | "Just make it work", "I'll know when I see it" |
| 3 | "Are there any existing codebase, API specs, or design docs I should review before starting?" | Đánh giálegacy, dependency | "No docs, you explore yourself", codebase spaghetti không test |
| 4 | "What's the timeline for this milestone? Is there a hard deadline or event driving it?" | Kiểm tra deadline realistic | "ASAP", "yesterday", "investor demo next week" mà scope to |
| 5 | "How do you prefer to communicate? Weekly demo? Daily standup? Async updates?" | Đồng thuận nhịp làm việc | "I'll ping you when I need something" (ghost client) |
| 6 | "Will there be any third-party integrations (payment, SMS, email) that need sandbox access?" | Phát hiện dependency bên ngoài | "You handle everything, get API keys yourself" |
| 7 | "What's your process for change requests? How do we handle scope changes mid-contract?" | Đặt ranh giới scope creep | "We'll figure it out", "Small changes are free" |
 
**Câu hỏi thêm tùy ngữ cảnh:**
- Fixed-price: "Is the first milestone already funded? When will milestone 2 be funded?"
- Hourly: "What's the weekly hour limit? Is there flexibility if we need more?"
- Team: "Who will be the single point of contact for approvals? Any other stakeholders?"
 
### Hourly vs Fixed-price: chọn loại nào
 
| Tiêu chí | Hourly | Fixed-price |
|---|---|---|
| **Scope** | Mơ hồ, thay đổi thường, bảo trì, support | Rõ ràng, deliverable cụ thể, lần đầu làm với khách |
| **Ưu điểm** | Bảo vệ bằng Work Diary, linh hoạt thay đổi, phù hợp long-term | Khách biết trước chi phí, bạn kiểm soát scope qua milestone |
| **Rủi ro** | Khách tranh chấp giờ, weekly limit chặn thu nhập | Scope creep, khách không duyệt, refund request |
| **Khuyên dùng khi** | Bạn chưa hiểu rõ full scope, khách muốn Ongoing, việc R&D | MVP rõ ràng, migration có scope cố định, integration cụ thể |
 
**Quy tắc an toàn:**
- Khách mới (0 review, < 3 hires): **Fixed-price milestone nhỏ** (1 tuần, $300–500) làm phép thử. Sau 1–2 milestone thành công → chuyển Hourly nếu phù hợp.
- Khách cũ, long-term: **Hourly** với weekly limit rõ ràng, Work Diary chăm chỉ.
- Không bao giờ: Fixed-price không chia milestone (all-or-nothing), Hourly không có weekly limit.
 
### Viết Milestone Có Tiêu Chí Nghiệm Thu (Acceptance Criteria)
Milestone fixed-price **phải** có 4 thành phần:
 
| Thành phần | Ví dụ tốt | Ví dụ kém |
|---|---|---|
| **Deliverable** | "REST API checkout flow: POST /orders, GET /orders/{id}, webhook handler for VNPAY/MoMo" | "Payment integration" |
| **Acceptance Criteria** | "1) Tạo đơn hàng thành công → return order_id. 2) Webhook VNPAY verify signature → update status. 3) Idempotency key防重复支付. 4) Unit + integration test coverage ≥ 80%. 5) Deploy staging, Swagger docs." | "Code works" |
| **Deadline** | "7 calendar days from milestone funded date" | "ASAP", "1 week" |
| **Price** | "$400 (funded before work starts)" | "Discuss later" |
 
**Template Milestone Description (copy vào Upwork):**
~~~text
Milestone 1: Checkout API & Payment Webhooks ($400)

Deliverables:
1. POST /api/v1/orders - Create order with idempotency key
2. GET /api/v1/orders/{id} - Get order status
3. POST /api/v1/webhooks/vnpay - Handle VNPAY IPN (verify signature, update order)
4. POST /api/v1/webhooks/momo - Handle MoMo IPN
5. Unit tests (JUnit 5, Mockito) + Integration tests (Testcontainers) - coverage ≥ 80%
6. OpenAPI/Swagger documentation
7. Deploy to staging (AWS ECS), provide staging URL + credentials

Acceptance Criteria:
- All endpoints return correct HTTP status and JSON schema per OpenAPI spec
- VNPAY/MoMo sandbox transactions processed correctly (test with provided test cards)
- Idempotency: duplicate requests with same key return same order, no double charge
- Tests pass in CI pipeline (GitHub Actions/GitLab CI)
- Staging accessible, API documented

Timeline: 7 calendar days from milestone funded date
Out of scope: Frontend integration, production deploy, load testing, other payment gateways
~~~
 
**Lưu ý quan trọng:**
- **"Out of scope"** liệt kê rõ gì KHÔNG làm — bảo vệ bạn khi khách đòi thêm.
- **Funded before work** — ghi rõ trong mô tả hoặc nhắn khách: "I'll start once milestone shows Funded status."
- **Chia nhỏ** — milestone > 1 tuần hoặc > $1000 rủi ro cao. Chia thành milestone 3–5 ngày, $300–800.
 
### Đọc Offer (Hợp đồng) Trước Khi Chấp Nhận
Khi khách gửi offer, Upwork hiển thị bản tóm tắt. Click "View full terms" đọc kỹ:
 
**Checklist đọc offer:**
- [ ] **Rate:** Khớp với thỏa thuận phỏng vấn? (Hourly: $/h, Fixed: total per milestone)
- [ ] **Weekly limit (Hourly):** Đủ cho scope? Có thể xin tăng không?
- [ ] **Payment terms:** Fixed-price — milestone funded trước khi làm? Hourly — tự động bill tuần?
- [ ] **IP Ownership:** "Work product belongs to client upon payment" (chuẩn). Cảnh báo: "Client owns all IP upon creation" (chưa trả tiền đã mất quyền) — **từ chối**.
- [ ] **Confidentiality/NDA:** Chỉ cover thông tin dự án. Không cover "general knowledge", "skills learned", "public info". Không ký NDA vô thời hạn.
- [ ] **Termination:** Có thể terminate any time với notice (chuẩn 3–5 ngày). Không bị phạt terminate.
- [ ] **Non-compete/Exclusivity:** **Tuyệt đối từ chối** — bạn không thể làm cho khách khác cùng ngách.
- [ ] **Upwork ToS:** Hợp đồng phải tuân thủ Upwork ToS. Bất kỳ điều khoản nào xung đột (làm ngoài, chia sẻ contact trước hợp đồng) → từ chối.
 
**Nếu offer sai lệch thỏa thuận:** Đừng accept. Nhắn khách: "The offer shows $35/h but we agreed $40/h. Could you update the offer?" Chỉ accept khi offer chính xác.
 
### Những Điều Kiện Phải Từ Chối (Deal Breakers)
 
| Điều kiện | Lý do | Cách từ chối lịch sự |
|---|---|---|
| **Làm trước khi milestone funded** | Không có Payment Protection | "I start work once milestone shows Funded status on Upwork. This protects both of us." |
| **Chỉ dùng Manual Time (Hourly)** | Không được bảo vệ Upwork | "I use Upwork Desktop App for Work Diary (screenshots + activity). This is required for Payment Protection." |
| **Scope không giới hạn / "whatever needed"** | Scope creep chắc chắn | "I need clear deliverables and acceptance criteria per milestone. Can we define those?" |
| **IP assignment trước khi thanh toán** | Mất quyền sở hữu code chưa được trả tiền | "Standard term: IP transfers upon payment for each milestone. Happy to confirm in contract." |
| **Non-compete / Exclusivity** | Không thể làm freelance khác | "I can't sign exclusivity as a freelancer. I can sign project-specific NDA." |
| **NDA vô thời hạn / quá rộng** | Rủi ro pháp lý lâu dài | "I'm happy to sign NDA covering project confidential info for 2–3 years. Not indefinite." |
| **Khách yêu cầu chia sẻ contact (email/phone/Telegram) TRƯỚC hợp đồng** | Vi phạm Upwork ToS, dấu hiệu scam | "Upwork policy keeps communication on platform until contract starts. Let's proceed with the offer." |
| **Rate thấp bất thường so với market** | Không bền vững, khách có thể khó tính | "My rate for this scope is $X. I can't go lower but I can adjust scope to fit your budget." |
 
**Mẫu từ chối chung:**
> "Thanks for the offer. I noticed [điều khoản]. This doesn't work for me because [lý do ngắn]. Standard practice is [chuẩn ngành]. Could we update to [đề xuất]? Happy to proceed once aligned."
 
> Senior tip: Phỏng vấn là **hai chiều**. Bạn cũng đang interview khách. Nếu khách lúng túng trả lời 7 câu hỏi trên, chậm phản hồi, ép bạn accept điều kiện bất hợp lý — **walk away**. Một hợp đồng xấu tốn nhiều thời gian, năng lượng, JSS, tiền hơn là không có hợp đồng.`,
  checklist: [
    'Chuẩn bị 7 câu hỏi bắt buộc trước mỗi phỏng vấn, in ra giấy để note khi khách trả lời.',
    'Quyết định Hourly vs Fixed-price dựa trên độ rõ scope và lịch sử khách.',
    'Viết milestone template có: Deliverable, Acceptance Criteria (5–7 mục), Deadline, Price, Out of scope.',
    'Checklist đọc offer: Rate, Weekly limit, Payment terms, IP, NDA, Termination, Non-compete.',
    'Danh sách 8 deal-breaker: làm trước funded, manual time only, scope không giới hạn, IP trước thanh toán, non-compete, NDA vô thời hạn, share contact trước hợp đồng, rate quá thấp.',
    'Luyện nói từ chối lịch sự: nêu vấn đề → lý do → chuẩn ngành → đề xuất sửa đổi.',
  ],
  related: ['remote-006', 'remote-010', 'remote-011', 'remote-012', 'remote-031', 'remote-032', 'uw-ch-01', 'uw-ch-02', 'uw-ch-03'],
},
{
  id: 'uw-ch-05',
  order: 5,
  title: 'Thực hiện hợp đồng',
  icon: '🚀',
  summary: 'Kickoff hiệu quả, nhịp báo cáo daily/weekly mẫu, dùng Work Diary và memo đúng cách, quản lý thay đổi qua change request → milestone mới, bàn giao chuẩn (submit work, tài liệu, video demo), đóng hợp đồng và xin feedback 5 sao.',
  body: `**Tóm tắt:** Hợp đồng bắt đầu khi milestone funded (fixed-price) hoặc khi bắt đầu ghi giờ (hourly). Kickoff đồng thuận scope, timeline, communication, access. Báo cáo: daily standup async (3 câu), weekly demo + written update. Work Diary: ghi bằng app, memo cụ thể ("Implemented VNPAY webhook + unit tests"), không manual time. Scope thay đổi: change request → milestone mới funded → mới làm. Bàn giao: submit work trên Upwork kèm link repo, staging URL, tài liệu API, video demo 2–5 phút. Đóng hợp đồng: xin feedback, ending contract đúng cách, giữ liên lạc cho long-term.
 
### Kickoff: Cuộc Hôi Gặp Quan Trọng Nhất
Kickoff không phải "chào hỏi" — là **đồng thuận vận hành**. Thời gian: 30–45 phút. Kết quả: một document (Notion/Google Doc/Confluence) ghi lại:
 
| Chủ đề | Nội dung đồng thuận | Ví dụ |
|---|---|---|
| **Scope & Milestone** | Deliverable, acceptance criteria, deadline, out of scope | "Milestone 1: Checkout API, 7 days, criteria: 5 items (xem milestone description)" |
| **Timeline & Buffer** | Ngày bắt đầu, milestone dates, buffer cho review | "Start Monday, Milestone 1 submit Friday, Client review 3 days, buffer 2 days" |
| **Communication** | Kênh chính, tần suất, timezone, emergency contact | "Upwork Messages chính, Slack cho urgent (response < 2h), Weekly demo Thu 10 AM EST" |
| **Access & Env** | Repo, staging, sandbox keys, CI/CD, monitoring | "GitHub private repo (add collaborator), AWS ECS staging, VNPAY/MoMo sandbox keys" |
| **Definition of Done** | Code review, test coverage, docs, deploy staging | "PR approved by client/lead, coverage ≥ 80%, Swagger updated, deployed staging" |
| **Change Process** | Change request form → estimate → new milestone funded → work | "Google Form change request → I estimate hours/price → new milestone funded → start" |
| **Risks & Blockers** | Dependency bên ngoài, holiday, key person | "VNPAY sandbox rate limit 100 req/min, Client provides prod keys week 3" |
 
**Mẫu Kickoff Notes (gửi sau call):**
~~~text
Hi [Client],

Thanks for the kickoff call. Here's what we agreed:

**Scope (Milestone 1 - $400, 7 days):**
- POST /orders, GET /orders/{id}, VNPAY/MoMo webhooks
- Acceptance: 5 criteria per milestone description
- Out of scope: Frontend, production deploy, load testing

**Timeline:**
- Start: Mon Nov 10
- Submit: Fri Nov 14
- Your review: 3 business days (auto-approve Nov 19)
- Buffer: 2 days for fixes

**Communication:**
- Primary: Upwork Messages
- Urgent: Slack (I respond < 2h during work hours)
- Weekly demo: Thursday 10 AM EST / 10 PM VN
- Async update: Daily standup format (see below)

**Access:**
- GitHub repo: github.com/client/project (added as collaborator)
- Staging: https://staging.client.com (credentials in 1Password/LastPass)
- VNPAY/MoMo sandbox keys: provided

**Definition of Done:**
- PR approved, tests pass, coverage ≥ 80%
- Swagger/OpenAPI updated
- Deployed to staging, URL shared

**Change Process:**
- Fill change request form → I estimate → New milestone funded → Work starts

**Risks:**
- VNPAY sandbox rate limit
- Prod keys available week 3

Please confirm or correct by EOD tomorrow.

Best,
[Your Name]
~~~
 
### Nhịp Báo Cáo (Reporting Cadence)
Khách không theo dõi code hàng ngày. Báo cáo giúp khách **yên tâm** và tạo **giấy tờ** cho dispute sau này.
 
**1. Daily Standup (Async, 2–3 phút, gửi Upwork Messages/Slack):**
~~~text
Daily Update - Nov 11 (Day 2)

✅ Done: Set up Spring Boot 3 project, PostgreSQL, Docker Compose. Designed DB schema (orders, payments, idempotency_keys). Created GitHub repo + CI pipeline.
🔄 In progress: Implementing POST /orders with idempotency key check (Redis SETNX).
🚫 Blockers: Waiting for VNPAY sandbox credentials (you mentioned today).
📅 Tomorrow: Finish POST /orders, start GET /orders/{id}, write unit tests.
~~~
 
**Format 3 phần:** Done / In progress / Blockers. **Không** viết nhật ký chi tiết ("debugged 2 hours").
 
**2. Weekly Demo + Written Update (30 phút call + 1 trang doc):**
- **Demo (15–20 phút):** Chạy qua staging, show API response, Swagger UI, test results.
- **Written Update (gửi sau demo):**
~~~text
Weekly Update - Week 1 (Nov 10–14)

**Milestone 1 Progress: 85%**
✅ Completed: POST /orders (idempotency), GET /orders/{id}, DB schema, CI pipeline, 45 unit tests (coverage 82%)
🔄 In Progress: VNPAY webhook handler (signature verification done, order update pending)
⏳ Pending: MoMo webhook, integration tests, Swagger polish

**Metrics:**
- Commits: 12
- Lines changed: +1,240 / -45
- Test coverage: 82% (target ≥ 80%)
- Staging: https://staging.client.com/api (deployed Fri 4 PM)

**Risks/Blockers:**
- VNPAY sandbox credentials received late (Wed) → webhook 1 day behind. Catching up Sat.
- MoMo sandbox needs business verification → may need prod keys for full test.

**Next Week:**
- Complete MoMo webhook (Mon)
- Integration tests with Testcontainers (Tue)
- Swagger + README (Wed)
- Submit Milestone 1 (Thu morning) → Your review starts Thu

**Decision Needed:**
- MoMo prod keys timeline? (Affects integration test completeness)
~~~
 
### Work Diary & Memo (Hourly Contracts)
**Work Diary** là bằng chứng duy nhất Upwork chấp nhận cho hourly. Desktop app chụp màn hình ngẫu nhiên 6 lần/giờ (10 phút/lần) + đo hoạt động chuột/bàn phím.
 
**Quy tắc ghi giờ an toàn:**
1. **Chỉ dùng Desktop App** — không manual time trừ khi khách đồng ý bằng tin nhắn Upwork.
2. **Memo mỗi segment (10 phút):** Mô tả công cụ cụ thể.
   - ❌ "Working on API"
   - ❌ "Coding"
   - ✅ "Implemented VNPAY webhook signature verification (HMAC-SHA256), added unit tests for valid/invalid signatures"
   - ✅ "Code review PR #23: fixed N+1 query in OrderService, added integration test"
   - ✅ "Debugged staging deploy failure: missing env var in ECS task definition, fixed and redeployed"
3. **Không làm việc cá nhân trong giờ ghi** — app chụp màn hình, thấy Facebook/YouTube → khách tranh chấp, Upwork không bảo vệ.
4. **Tuân thủ Weekly Limit** — vượt limit = không được trả tiền. Cần tăng limit → nhờ khách update contract **trước**.
5. **Ghi chú blocker** — nếu chờ khách 2 tiếng, ghi "Waiting for client: VNPAY sandbox credentials" → khách thấy bạn không lười, đang chờ họ.
 
**Mẫu memo cho các hoạt động thường gặp:**
| Hoạt động | Memo mẫu |
|---|---|
| Viết code feature | "Implemented [feature]: [file/class], added [unit/integration] tests" |
| Code review | "Reviewed PR #[num]: [tóm tắt thay đổi], approved/requested changes" |
| Debug/fix bug | "Fixed [bug]: [root cause], added regression test" |
| Deploy/DevOps | "Deployed to staging: [service], fixed [issue], verified [endpoint]" |
| Meeting/call | "Weekly demo call with client: showed [features], discussed [decisions]" |
| Research/spike | "Researched [topic]: evaluated [options], decision: [choice], rationale" |
| Chờ khách | "Blocked: waiting for [client to provide credentials/approval/feedback]" |
 
### Quản Lý Thay Đổi (Change Request → Milestone Mới)
Scope creep là nguyên nhân #1 thất bại fixed-price. Quy trình bắt buộc:
 
1. **Khách yêu cầu thay đổi** (thêm feature, đổi logic, tích hợp mới).
2. **Bạn phân tích:** Có trong milestone hiện tại không? (Check acceptance criteria).
3. **Nếu KHÔNG trong scope:**
   - Tạo **Change Request** (Google Form/Notion/Upwork Message có format).
   - Ước lượng: effort (giờ/ngày), price, timeline, risk.
   - Gửi khách: "This is out of scope for Milestone 1. Here's a change request: [details]. Estimated: 3 days, $300. Requires new milestone funded before I start."
4. **Khách đồng ý** → Tạo milestone mới trên Upwork → **Chờ Funded** → Mới làm.
5. **Khách không đồng ý** → Giữ scope gốc, hoàn thành milestone hiện tại.
 
**Change Request Template:**
~~~text
Change Request #CR-001
Date: Nov 12
Requested by: [Client Name]
Related Milestone: Milestone 1 (Checkout API)

**Description:**
Add Stripe Checkout integration alongside VNPAY/MoMo for international cards.

**Impact Analysis:**
- New dependency: Stripe Java SDK
- New endpoints: POST /checkout/stripe, webhook /webhooks/stripe
- Database: add stripe_session_id, stripe_payment_intent_id to orders table
- Tests: +15 unit tests, +5 integration tests
- Docs: Swagger update

**Estimate:**
- Effort: 3 working days
- Price: $300 (fixed-price milestone)
- Timeline: Can start after Milestone 1 submit, deliver 3 days after new milestone funded

**Risk:**
- Stripe account setup requires client business verification (may take 3–5 days)
- Adds complexity to idempotency handling (multiple payment providers)

**Action Required:**
Please create "Milestone 2: Stripe Integration ($300)" and fund it. I'll start once funded.
~~~
 
**Quy tắc cứng:** **Không làm bất kỳ việc nào ngoài scope trước khi milestone mới Funded.** Không ngoại lệ.
 
### Bàn Giao Chuẩn (Submit Work)
Submit work trên Upwork là **mốc chính thức** bắt đầu thời hạn review. Không submit = không có auto-release, khó dispute.
 
**Submit Work phải kèm (theo thứ tự quan trọng):**
1. **Link repo/commit/tag** — GitHub/GitLab, tag {{milestone-1-submit}}.
2. **Staging URL + credentials** — khách test ngay không cần hỏi.
3. **Tài liệu API** — Swagger/OpenAPI link, hoặc file Markdown/PDF.
4. **Video demo 2–5 phút** — quay màn hình: tạo đơn hàng → gọi API → check DB → test webhook sandbox. Tool: Loom, OBS, Zoom record.
5. **Checklist nghiệm thu** — copy acceptance criteria từ milestone, tick ✅ từng mục, note nếu có known issue.
6. **Hướng dẫn chạy local** (tuỳ chọn) — Docker Compose up, test command.
 
**Mẫu Submit Work Description:**
~~~text
**Milestone 1 Submission - Checkout API & Payment Webhooks**

**Deliverables:**
✅ POST /api/v1/orders - Idempotency key (Redis SETNX), validation, returns order_id
✅ GET /api/v1/orders/{id} - Returns order with payment status
✅ POST /api/v1/webhooks/vnpay - HMAC-SHA256 verification, order status update
✅ POST /api/v1/webhooks/momo - Signature verification, order status update
✅ Unit + Integration tests (JUnit 5, Testcontainers) - Coverage 83% (target ≥ 80%)
✅ OpenAPI/Swagger: https://staging.client.com/swagger-ui.html
✅ Staging deployed: https://staging.client.com/api

**Access:**
- Repo: github.com/client/project (tag: milestone-1-submit)
- Staging: https://staging.client.com/api (Swagger at /swagger-ui.html)
- Credentials: test_user / TestPass123 (in 1Password shared vault)

**Demo Video (3 min):** [Loom link]

**Acceptance Criteria Checklist:**
✅ 1. Create order returns order_id
✅ 2. VNPAY webhook verifies signature, updates status
✅ 3. MoMo webhook verifies signature, updates status
✅ 4. Idempotency: duplicate key returns same order, no double charge
✅ 5. Test coverage ≥ 80% (actual 83%)
✅ 6. Swagger documentation complete
✅ 7. Staging accessible

**Known Issues:**
- MoMo sandbox requires business verification for full flow. Tested with mock webhook payload. Prod keys needed for end-to-end test.

**Instructions to Test:**
1. Open Swagger UI, try POST /orders with idempotency-key header
2. Call GET /orders/{id} to verify
3. Use VNPAY sandbox test card (provided in staging env)

**Review Period:** 3 business days (auto-approves Nov 19 if no action)

Please review and let me know if any criteria not met. Happy to fix within scope.
~~~
 
**Sau khi submit:**
- Khách có 3–14 ngày review (mặc định 14 ngày, có thể set ít hơn khi tạo milestone).
- Khách **Approve** → tiền giải ngân sau security period (thường 5–10 ngày).
- Khách **Request Changes** → bạn sửa trong scope → submit lại.
- Khách **không phản hồi** → auto-approve khi hết hạn.
- Khách **Dispute** → mediation → arbitration (xem case uw-case-001).
 
### Đóng Hợp Đồng & Xin Feedback
Khi hoàn thành tất cả milestone hoặc một bên muốn dừng:
 
**1. Ending Contract đúng cách:**
- Fixed-price: Tất cả milestone đã approved/paid → "End Contract" trên Upwork.
- Hourly: Đảm bảo Work Diary tuần cuối đã submitted, không còn giờ pending review → "End Contract".
- **Không** để hợp đồng "dangling" (không ai end) — Upwork tự close sau 30–90 ngày inactive, nhưng feedback có thể bị ảnh hưởng.
 
**2. Xin Feedback (Review) 5 sao:**
Feedback hai chiều: khách rate bạn, bạn rate khách. JSS (Job Success Score) phụ thuộc mạnh vào **private feedback** (khách có recommend bạn không — không hiển thị công khai).
 
**Mẫu xin feedback:**
~~~text
Hi [Client],

All milestones completed and approved. I'll end the contract now.

It was great working with you! If you're happy with the work, I'd really appreciate a 5-star review — it helps a lot on Upwork. I'll leave you a 5-star review as well.

If you have any future backend needs (API, microservices, cloud, payment integrations), feel free to reach out. I'm also open to a retainer arrangement for ongoing support.

Thanks again!
[Your Name]
~~~
 
**3. Giữ liên lạc Long-term:**
- Thêm khách vào CRM (Notion/Airtable/Spreadsheet): Tên, công ty, email, domain, tech stack, rate, kết quả dự án.
- Mỗi 3–6 tháng: gửi email cập nhật "Still available for [tech stack], rate now $X, recent project: [brief]".
- Referral: "Nếu biết ai cần Java backend, hãy giới thiệu giúp. Tôi trả referral fee / discount cho project tiếp theo."
 
> Senior tip: **Submit work là lúc bạn có leverage nhất**. Trước submit: khách muốn code. Sau submit: khách đã có code, muốn approve để lấy code production. Gửi submit đầy đủ (repo + staging + docs + video + checklist) khiến khách **khó từ chối** — họ phải chỉ ra cụ thể criteria nào fail. Video demo 2 phút mạnh hơn 100 email giải thích. Luôn quay video.`,
  checklist: [
    'Tạo Kickoff Notes template, gửi sau 30 phút call, yêu cầu khách confirm bằng tin nhắn Upwork.',
    'Thiết lập nhịp báo cáo: Daily standup async (3 phần), Weekly demo + Written update (1 trang).',
    'Cài Upwork Desktop App, tập viết memo chi tiết cho mỗi segment 10 phút (feature, fix, review, deploy, wait).',
    'Tạo Change Request form/template, quy trình: Request → Estimate → New Milestone Funded → Work.',
    'Chuẩn bị Submit Work package: Repo tag + Staging URL + Swagger + Demo Video 2–5 phút + Checklist AC.',
    'Quy trình đóng hợp đồng: End Contract → Xin feedback 5★ → Ghi vào CRM → Follow-up 3–6 tháng/lần.',
  ],
  related: ['remote-010', 'remote-011', 'remote-012', 'remote-031', 'remote-032', 'remote-039', 'uw-ch-01', 'uw-ch-02', 'uw-ch-03', 'uw-ch-04'],
},
{
  id: 'uw-ch-06',
  order: 6,
  title: 'Tiền: tính đúng thực nhận, rút về Việt Nam, quỹ dự phòng và thuế',
  icon: '💰',
  summary: 'Học cách tính tiền thực nhận sau phí dịch vụ, phí rút và tỷ giá; hiểu cơ chế rút tiền về Việt Nam, khoảng chờ giải ngân (security period), quỹ dự phòng 3–6 tháng và nguyên tắc thuế để không vỡ kế hoạch tài chính.',
  body: `**Tóm tắt:** Số tiền trong hợp đồng không phải số tiền về ví bạn. Thực nhận = giá hợp đồng − phí dịch vụ của Upwork − phí rút tiền − chênh lệch tỷ giá, và còn phải qua một khoảng chờ (security period) mới rút được. Chương này dạy bạn tính đúng từ dưới lên, chọn cách rút về Việt Nam ở mức cơ chế, giữ quỹ dự phòng sống sót và hiểu nguyên tắc thuế (không ghi thuế suất, luôn hỏi chuyên gia).

### Vì sao "giá hợp đồng" không phải "tiền về ví"
Người mới hay thấy hợp đồng ghi 30 USD/giờ rồi tưởng mỗi giờ cầm 30 USD. Thực tế có ít nhất bốn lớp làm số tiền teo lại:
1. Phí dịch vụ của Upwork (freelancer service fee).
2. Phí rút tiền của cổng thanh toán.
3. Chênh lệch tỷ giá khi đổi USD sang VND.
4. Khoảng chờ giải ngân — không mất tiền, nhưng tiền chưa dùng được ngay.

Ví dụ đời thường: đi làm công ty lương offer 30 triệu nhưng thực nhận 26 triệu sau bảo hiểm, thuế, và một phần bị giữ tới kỳ sau. Freelance cũng vậy, chỉ khác là bạn tự phải tính.

### Phí dịch vụ (freelancer service fee)
(tại thời điểm viết, kiểm tra lại trên Upwork Help) Upwork thu một tỷ lệ phần trăm trên mỗi khoản bạn nhận. Mức này đã đổi nhiều lần trong lịch sử: có thời là bậc thang giảm dần theo tổng quan hệ với một khách, sau chuyển sang một mức phẳng áp cho mọi hợp đồng. Vì nó thay đổi theo thời gian, **đừng học thuộc một con số** — hãy mở trang Fees, đọc mức hiện hành và ghi vào sổ tay của bạn trước khi báo giá.

Công thức nhanh: nếu phí là p (ví dụ 0,10 nghĩa là 10%), thì tiền sau phí = giá × (1 − p).

### Phí rút tiền và tỷ giá
Upwork không chuyển thẳng USD vào tài khoản VND của bạn. Tiền đi qua một cổng trung gian, mỗi cổng có cơ chế và phí khác nhau (mức phí thay đổi, kiểm tra lại trước khi dùng):
- Ví/tài khoản toàn cầu (Payoneer, Wise…): nhận USD hoặc VND, tính phí theo lần rút hoặc theo phần trăm.
- Chuyển khoản thẳng về ngân hàng Việt Nam: Upwork quy đổi USD sang VND theo tỷ giá của họ, thường kèm một khoản phí cố định.
- Giữ tài khoản USD ở nước ngoài (nếu bạn có): tránh chênh lệch tỷ giá, nhưng thêm ràng buộc pháp lý và khai báo.

Ví dụ số cụ thể, milestone 1.000 USD:
- Phí dịch vụ 10% → còn 900 USD.
- Cổng rút tính 1% cộng 2 USD cố định → 900 × 0,99 − 2 = 889 USD.
- Quy đổi 1 USD = 25.000 VND, cổng trừ thêm 0,5% chênh lệch → 889 × 25.000 × 0,995 ≈ 22.113.000 VND.

Con số thực nhận khác xa 1.000 USD ban đầu. Luôn tính từ đáy lên, đừng tính từ giá hợp đồng trừ đi một cảm giác.

### Security period (khoảng chờ giải ngân)
Sau khi milestone được approve hoặc tuần hourly chốt, tiền **không rút được ngay**. Upwork giữ một khoảng an toàn (thường vài ngày, kiểm tra lại mốc hiện hành) để khách còn thời gian khiếu nại. Hết khoảng đó tiền mới ở trạng thái rút được. Hệ quả thực tế: đừng tiêu tiền theo ngày khách bấm approve; hãy coi tiền là của bạn khi nó đã nằm trong ví ngân hàng.

### Quỹ dự phòng 3–6 tháng
Thu nhập freelance không đều: tháng có ba khách, tháng không ai. Nguyên tắc sống sót: giữ quỹ chi phí sinh hoạt **3–6 tháng** (tính bằng VND) ở tài khoản thanh khoản, không dồn hết vào các hợp đồng đang chờ thanh toán. Quỹ này cho bạn dũng khí từ chối khách ép giá, dám dừng hợp đồng độc hại, và không phải nhận job bấp bênh chỉ vì "đang cần tiền". Người có quỹ dự phòng làm việc ở vị thế người đi thuê, không phải người xin việc.

### Nguyên tắc thuế (không ghi thuế suất)
- Thu nhập freelance là thu nhập chịu thuế; nghĩa vụ khai và nộp thuộc về bạn, không ai khấu trừ hộ như lương công ty.
- Tỷ lệ, ngưỡng miễn thuế, và cách khai (thuế thu nhập cá nhân, hay đăng ký hộ kinh doanh/khoán) thay đổi theo luật và theo tình trạng cư trú — **không có một con số đúng cho tất cả mọi người**.
- Hãy hỏi một chuyên gia thuế hoặc kế toán ở Việt Nam, nhất là khi bạn nhận USD đều đặn, có hợp đồng dài hạn, hoặc sắp làm cho công ty nước ngoài.
- Giữ chứng từ đầy đủ: hợp đồng, bảng payout của Upwork, sao kê cổng thanh toán. Đây là bằng chứng thu nhập khi khai thuế, và cũng cần khi vay mua nhà hay chứng minh tài chính.

### Đọc bảng payout và đối soát hằng tháng
Trong mục thanh toán/báo cáo, Upwork ghi rõ: tổng (gross), phí dịch vụ, các điều chỉnh (tranh chấp, hoàn tiền), và thực nhận (net). Mỗi tháng hãy đối chiếu net với sổ tay. Nếu lệch, kiểm tra ngay trong tháng — tranh chấp sau nhiều tháng gần như không còn cơ hội.

> Senior tip: Trước khi nhận bất kỳ hợp đồng nào, hãy viết ra một dòng: "Giá X, phí còn Y, rút về khoảng Z VND, tiền dùng được sau N ngày". Nếu Z không đủ sống và quỹ dự phòng dưới 3 tháng, bạn đang nhận việc vì sợ chứ không vì nó tốt — đó là lúc dễ bị ép giá và dễ nhận hợp đồng độc hại nhất.`,
  checklist: [
    'Mở trang Fees trên Upwork Help, ghi lại tỷ lệ phí dịch vụ và phí rút hiện hành vào sổ tay.',
    'Tính thử thực nhận cho một milestone 1.000 USD theo đúng công thức từ đáy lên.',
    'Chọn một cổng rút về Việt Nam, ghi rõ phí theo lần và theo phần trăm của cổng đó.',
    'Lập quỹ dự phòng 3–6 tháng chi phí, để riêng khỏi tiền đang chờ thanh toán.',
    'Đặt lịch đối soát payout Upwork với sổ tay vào cuối mỗi tháng.',
    'Liệt kê 5 loại chứng từ cần giữ và nơi lưu (hợp đồng, payout, sao kê cổng).',
  ],
  related: ['remote-002', 'remote-015', 'remote-037', 'uw-case-001', 'uw-case-003', 'uw-ch-01'],
},
{
  id: 'uw-ch-07',
  order: 7,
  title: 'Review, Job Success Score và badge: cơ chế và cách giữ điểm',
  icon: '⭐',
  summary: 'Phân biệt public feedback và private feedback, hiểu Job Success Score (JSS) ở mức nguyên lý, nhận ra những hợp đồng âm thầm kéo JSS xuống, cách đóng hợp đồng chủ động và cách phản hồi một review xấu công khai.',
  body: `**Tóm tắt:** Trên Upwork, hai thứ quyết định bạn có được mời việc hay không là review công khai (số sao ai cũng đọc) và Job Success Score (JSS) — điểm thành công chỉ bạn và Upwork thấy. JSS không chỉ dựa trên số sao: nó nhìn kết quả hợp đồng, private feedback (khách có muốn làm việc lại với bạn không), tranh chấp và những hợp đồng "chết". Chương này giải thích cơ chế, chỉ ra các hợp đồng âm thầm kéo điểm xuống, cách đóng hợp đồng chủ động và cách phản hồi review xấu.

### Hai loại phản hồi: công khai và riêng tư
- **Public feedback:** khách để lại số sao (1–5) kèm nhận xét ai cũng đọc được. Bạn cũng để lại đánh giá cho khách.
- **Private feedback:** sau khi hợp đồng đóng, khách trả lời vài câu hỏi riêng (có muốn recommend bạn không, kỹ năng, giao tiếp, đúng hạn…). **Không ai ngoài Upwork đọc được**, nhưng đây là đầu vào mạnh nhất của JSS.

Hệ quả ít người biết: một khách để 5 sao công khai nhưng private feedback ghi "sẽ không thuê lại" vẫn kéo JSS xuống. Ngược lại, 4 sao công khai cộng private "muốn làm lại" đỡ hại hơn nhiều. Đừng chỉ chạy theo số sao — hãy chạy theo việc khách có thật sự muốn làm việc với bạn lần nữa.

### JSS hoạt động ở mức nguyên lý
JSS là điểm thành công tổng hợp trên một cửa sổ thời gian trượt (thường lấy các tháng gần nhất, kiểm tra lại mốc hiện hành), có trọng số theo:
- Kết quả hợp đồng: thành công hay có vấn đề.
- Private feedback.
- Quy mô hợp đồng: giá trị và độ dài, hợp đồng lớn ảnh hưởng nhiều hơn.
- Tranh chấp, hoàn tiền, hủy hợp đồng.
- Độ gần: chuyện gần đây ảnh hưởng nhiều hơn chuyện cũ.

Công thức chính xác không được công bố và thay đổi theo thời gian, nên **đừng cố "lách hệ thống"**. Cách duy nhất bền vững là hợp đồng nào cũng đóng đúng cách.

### Những hợp đồng âm thầm kéo JSS xuống
1. **Hợp đồng không hoạt động lâu:** mở hợp đồng rồi cả hai im lặng hàng tháng, hệ thống coi là không có kết quả.
2. **Hợp đồng đóng mà không có private feedback:** đóng quá sớm, không ai chấm.
3. **Có dispute hoặc refund**, dù khoản nhỏ.
4. **Hợp đồng bị hủy** trước khi có kết quả (khách hủy, hoặc bạn hủy).
5. **Nhiều hợp đồng nhỏ chết yểu** cộng dồn lại thành một vết kéo điểm.

### Cách đóng hợp đồng chủ động
- Đóng khi đã giao xong và khách hài lòng, kèm xin private feedback tốt.
- Hợp đồng hourly dài hạn sắp nghỉ: báo trước, hoàn tất tuần cuối, end contract lịch sự.
- Hợp đồng "chết" (khách biến mất): khi đã giao phần dở và không còn khả năng tiếp, đóng chủ động thay vì để treo; cân nhắc hoàn phần chưa làm để giữ private feedback.
- Tuyệt đối không mở hợp đồng "cho có" rồi bỏ — mỗi cái là một gạch trừ ngầm.

### Badge và ngưỡng
Các badge (ví dụ Top Rated, Top Rated Plus, và chương trình Expert-Vetted) có điều kiện về JSS tối thiểu, số hợp đồng, thu nhập, tỷ lệ hoàn thành, xác minh danh tính… (ngưỡng thay đổi, kiểm tra lại trên Upwork Help). Hãy coi badge là **kết quả** của việc làm tốt đều đặn, không phải mục tiêu để lách. Riêng Expert-Vetted do Upwork chủ động mời, bạn không apply được.

### Phản hồi một review xấu công khai
- Chỉ trả lời **một lần**, bình tĩnh, bằng sự kiện.
- Không tranh cãi cảm tính, không tiết lộ thông tin khách (vi phạm NDA và điều khoản).
- Nêu cách bạn đã khắc phục hoặc làm rõ, để người đọc sau tự đánh giá.
- Nếu review vi phạm chính sách (đe doạ, xúc phạm, đòi tiền để đổi sao) thì báo Upwork, đừng tự xử.

Mẫu trả lời ngắn (tiếng Anh, dùng khi cần):
~~~text
Thanks for the feedback. I take it seriously. For context, the scope agreed for this milestone was X and Y, both delivered and accepted on [date]. The additional request that came after delivery was outside that scope, and I offered a separate milestone for it. I wish the project had ended on a clearer note and I am happy to clarify anything for future clients reading this.
~~~

> Senior tip: Coi JSS như điểm tín dụng: nó đi theo bạn nhiều tháng và mở hoặc đóng nhiều cánh cửa. Một hợp đồng 200 USD làm tốt và đóng đúng cách có giá trị hơn năm hợp đồng 50 USD bỏ dở. Khi phân vân giữa "nhận thêm một job rác" và "giữ điểm sạch", hãy chọn giữ điểm — JSS 95% với ít hợp đồng luôn thắng JSS 88% với nhiều hợp đồng.`,
  checklist: [
    'Đọc lại 3 hợp đồng đã đóng gần nhất, kiểm tra private feedback và JSS hiện tại.',
    'Lập quy tắc đóng hợp đồng: giao xong, xin feedback, end contract, ghi vào CRM.',
    'Soạn sẵn một mẫu phản hồi review xấu bằng tiếng Anh, bình tĩnh và bằng sự kiện.',
    'Kiểm tra điều kiện badge hiện hành trên Upwork Help và ghi lại khoảng cách của bạn.',
    'Dọn các hợp đồng "chết" đang treo: đóng chủ động hoặc hoàn phần chưa làm.',
  ],
  related: ['remote-013', 'remote-032', 'uw-case-104', 'uw-ch-05'],
},
{
  id: 'uw-ch-08',
  order: 8,
  title: 'Tranh chấp và an toàn tài khoản: quy trình và điều khoản dễ vi phạm',
  icon: '🛡️',
  summary: 'Hiểu quy trình hourly dispute, fixed-price refund, mediation và arbitration; nhận biết các điều khoản dễ khiến tài khoản bị khoá (circumvention, chia sẻ tài khoản, đăng nhập bất thường); cách kháng nghị và nguyên tắc lưu bằng chứng.',
  body: `**Tóm tắt:** Tranh chấp và an toàn tài khoản là hai mặt của một nguyên tắc: chỉ những gì nằm trên Upwork mới được bảo vệ. Bạn cần hiểu quy trình hourly dispute, fixed-price refund, mediation và arbitration (có phí); biết điều khoản nào dễ làm bạn bị khoá tài khoản như circumvention (lôi khách ra ngoài), chia sẻ tài khoản, đăng nhập bất thường; và luôn lưu bằng chứng có tổ chức.

### Hourly dispute (tranh chấp giờ)
- Sau khi một tuần chốt, khách có một khoảng thời gian để xem Work Diary và tranh chấp giờ trong tuần đó.
- Khi có tranh chấp, Upwork xem Work Diary (ảnh chụp màn hình, memo, mức hoạt động chuột/bàn phím) và trao đổi với hai bên.
- Giờ được bảo vệ khi: ghi bằng desktop app, đúng phạm vi hợp đồng, memo mô tả rõ, không vượt weekly limit.
- **Manual time** (giờ nhập tay) thường không được bảo vệ — đây là lý do lớn nhất khiến freelancer mất giờ khi tranh chấp.

### Fixed-price refund và dispute
- Khách có thể yêu cầu hoàn tiền một milestone trong thời hạn cho phép.
- Bạn có ba lựa chọn: đồng ý hoàn, hoàn một phần, hoặc từ chối và mở dispute.
- Nếu từ chối, vụ việc đi vào mediation; không xong thì có thể lên arbitration.

### Mediation và arbitration
- **Mediation:** bộ phận hỗ trợ của Upwork đọc bằng chứng và đề xuất giải pháp. Thường không tốn phí đáng kể.
- **Arbitration:** bên thứ ba độc lập phân xử, **có phí** (thường bên thua chịu), mất nhiều tuần.
- Với khoản vài trăm USD, arbitration thường không đáng. Hãy tính: số tiền đang tranh chấp so với phí arbitration cộng thời gian cộng rủi ro review xấu.

Luồng một vụ tranh chấp fixed-price:
~~~seq
title: Tranh chấp fixed-price đi tới đâu
actors: Freelancer | Upwork | Client
Client -> Upwork: Yêu cầu hoàn tiền milestone
Upwork --> Freelancer: Mở dispute, yêu cầu bằng chứng
Freelancer -> Upwork: Nộp submit work và đối chiếu phạm vi
Upwork --> Client: Mediation đề xuất phương án
Client -> Upwork: Không đồng ý phương án
Upwork --> Freelancer: Arbitration có phí nếu theo đuổi
~~~

### Điều khoản dễ vi phạm (dễ bị khoá tài khoản)
- **Circumvention:** lôi khách bạn gặp qua Upwork ra ngoài để tránh phí. Khách gặp trên Upwork thì trong 24 tháng không được chuyển sang làm hoặc nhận tiền ngoài nền tảng, trừ khi trả conversion fee theo quy định.
- **Chia sẻ tài khoản / đứng tên hộ / cho người khác dùng:** vi phạm nặng, là đường tắt bị khoá vĩnh viễn.
- **Đăng nhập bất thường:** dùng VPN đổi IP liên tục, đăng nhập từ nhiều nơi cùng lúc, hoặc thiết bị lạ — hệ thống dễ nghi ngờ xâm phạm hoặc gian lận.
- **Nhận tiền ngoài nền tảng** cho hợp đồng Upwork, hoặc chia sẻ email/số điện thoại/Telegram trước khi có hợp đồng.
- **Tạo nhiều tài khoản** để né khoá: Upwork liên kết thiết bị và IP, multi-account bị coi là trốn ban.

### Tài khoản bị khoá và kháng nghị
- Khi bị khoá, bạn thường nhận email nêu lý do. Đọc kỹ, phản hồi qua kênh hỗ trợ chính thức.
- Cung cấp bằng chứng: danh tính, lịch sử hợp đồng, giải thích rõ nếu là đăng nhập bất thường (ví dụ đổi nhà mạng, đi công tác).
- Kháng nghị lịch sự, có bằng chứng, **một lần**; không tạo tài khoản mới (bị coi là trốn ban).
- Nếu bị nhầm ở khâu xác minh: gửi lại giấy tờ rõ nét, đúng tên với tài khoản.

### Lưu bằng chứng (làm trước khi cần)
- Giữ mọi trao đổi trên Upwork Messages; không chuyển sang Telegram/email cho việc của hợp đồng.
- Lưu submit work, commit/tag, video demo, memo Work Diary.
- Lưu mô tả milestone, hợp đồng, bảng payout.
- Khi có dispute, người có bằng chứng gọn gàng, đúng dòng thời gian gần như luôn thắng người chỉ có cảm tính.

> Senior tip: Hãy chuẩn bị "hộp bằng chứng" cho mỗi hợp đồng ngay từ ngày đầu: một thư mục chứa mô tả milestone, các lần submit, link commit, video demo và ảnh chụp trao đổi quan trọng. Khi tranh chấp xảy ra, bạn chỉ mất 10 phút để nộp, thay vì cuống cuồng vét lại lịch sử. Và nhớ: không có bằng chứng nào mạnh bằng việc đã làm đúng đường ray ngay từ đầu — funded trước khi làm, submit trước khi báo xong.`,
  checklist: [
    'Đọc trang dispute và payment protection trên Upwork Help, ghi lại các mốc thời gian hiện hành.',
    'Tạo cấu trúc thư mục "hộp bằng chứng" cho hợp đồng hiện tại và các hợp đồng sau.',
    'Kiểm tra Work Diary tuần gần nhất: mọi giờ đều bằng app, memo rõ, không vượt limit.',
    'Viết sẵn câu trả lời lịch sự khi khách rủ chuyển sang Telegram hoặc làm ngoài Upwork.',
    'Liệt kê 4 điều khoản dễ vi phạm và một việc cụ thể để tránh mỗi điều khoản.',
    'Ghi lại quy trình kháng nghị khi bị khoá: kênh chính thức, bằng chứng, không tạo tài khoản mới.',
  ],
  related: ['remote-004', 'remote-016', 'remote-025', 'uw-case-002', 'uw-case-105', 'uw-case-201', 'uw-case-203', 'uw-ch-01'],
},
{
  id: 'uw-ch-09',
  order: 9,
  title: 'Phát triển dài hạn: khách lặp lại, tăng giá, chọn ngách và ra ngoài Upwork',
  icon: '📈',
  summary: 'Biến khách một lần thành khách dài hạn, tăng giá với khách cũ kèm mẫu tin nhắn, chuyên môn hoá một ngách để được trả cao, mô hình hợp đồng retainer, và ranh giới pháp lý khi mở rộng ra ngoài Upwork.',
  body: `**Tóm tắt:** Freelance bền vững không đến từ việc luôn phải đi tìm khách mới, mà từ việc biến khách một lần thành khách dài hạn, tăng giá có lý do, chọn một ngách để được trả cao, và biết khi nào cùng làm thế nào để mở rộng ra ngoài Upwork mà không vi phạm điều khoản. Chương này cho bạn mẫu tin nhắn tăng giá, mô hình retainer và ranh giới pháp lý khi rời nền tảng.

### Biến khách một lần thành khách dài hạn
- Sau khi giao tốt, đề nghị gói hỗ trợ hoặc bảo trì (retainer) thay vì để khách "nghỉ".
- Giữ liên lạc định kỳ 3–6 tháng bằng một cập nhật ngắn, không spam.
- Chủ động đề xuất việc tiếp theo dựa trên hệ thống bạn vừa làm: "API đã ổn định, giờ mình có thể thêm caching để giảm 40% chi phí, bạn có muốn xem không?".
- Trở thành "người trong team": hiểu domain của khách, nhớ ngữ cảnh, nhớ tên hệ thống. Khách rất ngại đi tìm và đào tạo người mới.

### Tăng giá với khách cũ (mẫu tin nhắn)
Nguyên tắc: chỉ tăng trên hợp đồng mới hoặc phần việc mới, kèm lý do giá trị, không xin lỗi, không kể khó khăn cá nhân. Mẫu tiếng Anh:
~~~text
Hi [Name], I have really enjoyed working on [project] with you. As the scope has grown and I have taken on more ownership (design, reviews, on-call), I would like to update my rate to [X] USD/h for new work starting next month. This reflects the additional responsibility and the results we have shipped together. Happy to keep the current rate for anything already in progress. Let me know if that works for you.
~~~

### Chuyên môn hoá ngách
- Chọn một ngách ít người làm mà khách cần: payment/fintech, hệ thống tải cao, nâng cấp hệ thống cũ (legacy), hoặc cứu các app do AI viết.
- Ngách giúp bạn được khách **mời** (invite) thay vì phải apply, và được trả cao hơn.
- Xây bằng chứng trong ngách: case study có số liệu, bài viết kỹ thuật, demo nhỏ. Người ta trả cao cho người giải được đúng vấn đề của họ, không cho người "biết nhiều thứ".

### Hợp đồng retainer
- **Retainer** là thoả thuận khách trả một khoản cố định định kỳ (thường theo tháng) để bạn cam kết một số giờ hoặc một đầu ra.
- Lợi ích: thu nhập ổn định, đỡ phải tìm khách liên tục.
- Rủi ro: phụ thuộc một khách quá lớn — hãy đa dạng hoá, đừng để một retainer chiếm quá nửa thu nhập.
- Phải định nghĩa rõ: bao nhiêu giờ, phạm vi gì, phản hồi trong bao lâu, phần vượt giờ tính thế nào.

### Khi nào và làm thế nào mở rộng ra ngoài Upwork
- **Được phép** khi: khách không phải người bạn gặp qua Upwork, hoặc đã qua mốc 24 tháng theo quy định, hoặc bạn trả conversion fee theo quy định.
- **Không được** lôi khách gặp trên Upwork trong thời gian cấm ra ngoài để tránh phí, và không nhận tiền ngoài cho hợp đồng đang chạy trên Upwork.
- Cách an toàn: hoàn tất hợp đồng trên Upwork trước, rồi minh bạch trao đổi về nhu cầu mới; nếu khách chủ động tìm bạn qua kênh khác thì càng rõ ràng. Khi nghi ngờ, hỏi thẳng bộ phận hỗ trợ của Upwork thay vì tự suy đoán.

> Senior tip: Mục tiêu 18–24 tháng không phải "làm thật nhiều job" mà là "có 3–5 khách quay lại và 1–2 ngách bạn là chuyên gia". Thu nhập ổn định đến từ khách cũ và retainer, không đến từ việc mỗi tháng lại đốt Connects đi săn job. Mỗi hợp đồng, hãy hỏi: việc này có đưa tôi gần hơn tới việc được mời thay vì phải apply không? Nếu câu trả lời là không, cân nhắc lại giá hoặc ngách của bạn.`,
  checklist: [
    'Lập danh sách khách cũ và chọn 3 người để nhắn lại cập nhật trong tháng này.',
    'Soạn mẫu tin nhắn tăng giá bằng tiếng Anh, kèm lý do giá trị cụ thể.',
    'Chọn một ngách bạn muốn theo và liệt kê 3 bằng chứng cần xây (case study, bài viết, demo).',
    'Thiết kế một gói retainer mẫu: số giờ, phạm vi, thời gian phản hồi, cách tính giờ vượt.',
    'Đọc lại điều khoản circumvention và conversion fee, ghi ranh giới khi mở rộng ngoài Upwork.',
  ],
  related: ['remote-016', 'remote-017', 'remote-040', 'remote-058', 'uw-case-103', 'uw-ch-04'],
},
);
