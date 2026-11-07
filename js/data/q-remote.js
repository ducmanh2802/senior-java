/* Topics: remote — Remote & Freelance (Upwork, làm remote cho công ty nước ngoài). Format: see AGENTS.md.
 * Giải thích bằng tiếng Việt; mẫu câu/email/proposal tiếng Anh đặt trong ~~~text.
 * Số liệu của nền tảng (phí, giá Connects, ngưỡng badge) thay đổi thường xuyên: chỉ ghi khi đã kiểm tra trang chính thức,
 * kèm "(tại thời điểm viết)"; không chắc thì mô tả cơ chế, không ghi con số. */
(window.QUESTIONS = window.QUESTIONS || []).push(
{
  id: 'remote-001',
  topic: 'remote',
  level: 'mid',
  q: 'Bạn là Java backend dev 4 năm kinh nghiệm, mới tạo tài khoản Upwork, chưa có review nào. Bạn làm profile và viết proposal thế nào để có hợp đồng đầu tiên trong 1–2 tháng?',
  a: `**Tóm tắt:** Khách trên Upwork chọn người **ít rủi ro nhất cho đúng vấn đề của họ**, không phải người giỏi nhất. Không có review, bạn bù lại rủi ro bằng một profile hẹp, có bằng chứng (portfolio, GitHub, con số), và proposal ngắn, chứng minh đã đọc kỹ job, mở đầu bằng cách giải quyết vấn đề của khách thay vì giới thiệu bản thân.

### 1. Vì sao người mới khó có job đầu tiên
Khách (client) nhìn danh sách proposal và tự hỏi: "Người này có làm xong việc của tôi mà không làm tôi mất tiền và thời gian không?". Thứ họ dùng để đoán là review, Job Success Score và số giờ đã làm. Người mới chưa có cả ba, nên mọi thứ khác phải trả lời câu hỏi đó thay cho chúng.

### 2. Profile: hẹp và có bằng chứng
- **Title** nói rõ bạn giải quyết việc gì, không liệt kê công nghệ: "Java Spring Boot Backend Engineer | REST APIs, PostgreSQL, AWS" tốt hơn "Software Developer".
- **Overview**: 2 dòng đầu là thứ khách thấy trong kết quả tìm kiếm, nên nói luôn bạn giúp được gì, đừng mở đầu bằng "Hello, my name is…".
- **Portfolio**: 2–3 dự án có ảnh chụp kiến trúc hoặc API docs, mỗi dự án 3 dòng: vấn đề → bạn làm gì → kết quả có số. Dự án cá nhân trên GitHub vẫn được, miễn là có README tử tế.
- **Specialized profile**: nếu Upwork cho tạo nhiều profile chuyên biệt, hãy làm riêng một profile cho backend Java, đừng gộp với "làm cả mobile".
- Xác minh danh tính, ảnh thật, tài khoản thanh toán đầy đủ: đây là các tín hiệu tin cậy rẻ nhất.

~~~text
Title: Java / Spring Boot Backend Engineer | REST APIs, PostgreSQL, AWS
Overview (first 2 lines):
I build and fix Java backends that need to stay fast and reliable under real traffic.
4 years shipping Spring Boot services for e-commerce and fintech teams: APIs, payments, performance tuning.
~~~

### 3. Chọn job để gửi proposal
Mỗi proposal tốn **Connects** (mua bằng tiền), nên chọn kỹ:
| Nên gửi | Nên bỏ qua |
|---|---|
| Job đăng trong 24 giờ, ít proposal | Đã có rất nhiều proposal |
| Client đã xác minh thanh toán, có lịch sử thuê và review tốt | Client chưa xác minh thanh toán |
| Mô tả cụ thể (stack, vấn đề, đầu ra) | Mô tả mơ hồ, "simple task, small budget" |
| Việc nhỏ, rõ phạm vi (fix bug, thêm endpoint, tối ưu query) | Dự án lớn cần nhiều review mới được chọn |

Job nhỏ, rõ phạm vi là cách thực tế nhất để có review đầu tiên.

### 4. Proposal: mở đầu bằng vấn đề của khách
Khách thường chỉ đọc 2–3 dòng đầu trong danh sách. Cấu trúc tốt:
1. Một câu cho thấy bạn hiểu vấn đề (nhắc chi tiết cụ thể trong job).
2. Bạn sẽ làm thế nào (2–3 bước), kèm một rủi ro bạn đã thấy trước.
3. Bằng chứng ngắn: việc tương tự đã làm, kèm link.
4. Một câu hỏi làm rõ, để mở đầu cuộc trò chuyện.

~~~text
Hi Mark, the timeouts you see on /orders after 10k rows look like an N+1 query in the
order-items mapping rather than a server sizing issue.
I would: 1) enable SQL logging to confirm the query count, 2) switch to a fetch join or
@BatchSize, 3) add an index on order_items(order_id) and measure p95 before/after.
I fixed the same pattern for an e-commerce API last year (p95 1.8 s -> 120 ms): <link>
Quick question: are you on Spring Data JPA or plain Hibernate?
~~~

### 5. Sai lầm hay gặp
- Gửi proposal copy-paste dài cho mọi job: khách nhận ra ngay.
- Báo giá quá thấp để "mua review": thu hút khách khó tính, và bạn bị neo ở mức giá đó.
- Trao đổi hoặc nhận thanh toán ngoài nền tảng khi khách đề nghị: vi phạm điều khoản, mất bảo vệ thanh toán, và là dấu hiệu lừa đảo phổ biến.
- Không theo dõi tỉ lệ được phản hồi: gửi khoảng 20 proposal mà không ai trả lời thì phải sửa profile hoặc cách viết, chứ không phải gửi thêm.

> Senior tip: theo dõi proposal bằng một bảng đơn giản (job, ngày gửi, Connects, có phản hồi không, lý do). Sau 20–30 proposal, mẫu số liệu sẽ cho biết loại job và kiểu mở đầu nào hiệu quả. Phí, giá Connects và chính sách của Upwork thay đổi theo thời gian, nên luôn kiểm tra trang trợ giúp chính thức trước khi tính giá.`,
  follow: [
    'Bạn đặt giá giờ (hourly rate) khởi điểm thế nào khi chưa có review, và khi nào thì tăng?',
    'Khách nhắn: "Let us continue on Telegram, I will pay you via crypto". Bạn trả lời thế nào?',
    'Sau hợp đồng đầu tiên, bạn làm gì để có review tốt và được thuê lại?'
  ],
  tags: ['Upwork', 'freelance', 'proposal', 'profile']
}
);
