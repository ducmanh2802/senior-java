/* Câu chuyện STAR mẫu theo tình huống dự án Java phổ biến (#/career → "Mẫu câu chuyện").
   Người học chọn mẫu gần với dự án của mình → "Dùng mẫu này" → sửa số liệu/chi tiết thành chuyện THẬT của mình.
   Schema (scripts/validate.js kiểm tra):
   { id: 'star-NNN', theme: một trong THEMES của career.js ('Sự cố production' | 'Xung đột' | 'Dẫn dắt' | 'Thất bại' |
       'Deadline gấp' | 'Thuyết phục' | 'Mentoring' | 'Hiệu năng' | 'Thiết kế' | 'Chủ động'),
     level: 'mid' | 'senior' | 'lead', title, project: 'loại dự án/bối cảnh, 1 câu',
     situation, task, action, result,        // văn bản thuần tiếng Việt (không markup), action có thể nhiều câu
     spoken: 'bản nói tiếng Việt 150–260 từ, ngôi thứ nhất, ~2 phút',
     spoken_en: 'English spoken version 130–220 words, first person, simple sentences',
     adapt: ['chỗ cần thay bằng chi tiết thật của bạn', …],   // 3–5 mục
     follow: ['câu interviewer hay hỏi tiếp', …],           // 2–4 mục
     tags: ['…'] }                                           // tuỳ chọn
   Chuỗi dùng dấu nháy kép (tiếng Anh có I'm, don't…); không backtick, không ${ … }. */
(window.STAR_STORIES = window.STAR_STORIES || []).push(
{
  id: 'star-001',
  theme: 'Sự cố production',
  level: 'senior',
  title: 'API thanh toán treo vì cạn connection pool',
  project: 'Hệ thống thanh toán / ví điện tử, Spring Boot + PostgreSQL, khoảng 2 triệu giao dịch mỗi ngày',
  situation: "Tối thứ Sáu, sau đợt khuyến mãi, API tạo giao dịch bắt đầu trả lỗi timeout. Tỉ lệ lỗi lên khoảng 18%, p99 latency từ 300 ms lên hơn 30 giây. Bộ phận CSKH nhận hàng trăm phản ánh trong 20 phút.",
  task: "Tôi là người on-call của team backend (5 người). Việc của tôi là khôi phục dịch vụ nhanh nhất có thể, tìm nguyên nhân gốc và đảm bảo không lặp lại.",
  action: "Đầu tiên tôi xem dashboard: CPU và memory bình thường, nhưng metric hikaricp_connections_pending tăng vọt và active connection luôn bằng max (20). Tôi lấy thread dump và thấy khoảng 180 thread đang chờ getConnection. Truy ngược lại, tôi phát hiện một hàm @Transactional gọi API chống gian lận của đối tác ở bên trong transaction; API đó đang chậm 25 giây, nên mỗi request giữ connection suốt thời gian chờ. Để cầm máu, tôi bật feature flag chuyển kiểm tra gian lận sang chế độ bất đồng bộ cho giao dịch dưới 2 triệu đồng (đã được nghiệp vụ duyệt từ trước) và rolling restart. Sau đó tôi sửa code: gọi API đối tác ngoài transaction, thêm timeout 2 giây và circuit breaker. Tôi viết postmortem, thêm alert khi pending connection > 5 trong 1 phút.",
  result: "Dịch vụ phục hồi sau 35 phút kể từ alert đầu tiên. Sau bản sửa, p99 trở về 280 ms; trong 6 tháng tiếp theo không còn sự cố cạn pool. Quy tắc 'không gọi HTTP bên trong transaction' được đưa vào checklist code review của cả phòng.",
  spoken: "Một sự cố tôi nhớ nhất là tối thứ Sáu sau đợt khuyến mãi, API tạo giao dịch thanh toán bị timeout hàng loạt, tỉ lệ lỗi khoảng 18 phần trăm. Tôi là người on-call. Tôi xem dashboard thì CPU, memory đều ổn, nhưng connection pool của Hikari luôn đầy 20 trên 20 và số request chờ connection tăng liên tục. Thread dump cho thấy gần 180 thread đang chờ lấy connection. Tôi lần ra một hàm có @Transactional gọi API chống gian lận của đối tác ngay bên trong transaction. Đối tác đang chậm 25 giây, nên mỗi request giữ chặt một connection trong suốt thời gian đó. Để cầm máu, tôi bật feature flag cho phép kiểm tra gian lận bất đồng bộ với giao dịch nhỏ, việc này nghiệp vụ đã duyệt từ trước, rồi restart lần lượt. Dịch vụ hồi phục sau 35 phút. Sau đó tôi đưa lời gọi đối tác ra ngoài transaction, thêm timeout 2 giây và circuit breaker, thêm alert khi có connection chờ. p99 về lại 280 mili giây và 6 tháng sau không lặp lại. Bài học lớn nhất của tôi là transaction phải ngắn và không bao giờ chờ mạng bên trong nó.",
  spoken_en: "One incident I remember well happened on a Friday night after a big promotion. Our payment API started timing out, and about 18 percent of requests failed. I was on call. CPU and memory looked fine, but the Hikari connection pool was always full, 20 out of 20, and the number of waiting requests kept growing. A thread dump showed around 180 threads waiting for a connection. I traced it to a method with @Transactional that called a partner's fraud-check API inside the transaction. The partner was taking 25 seconds, so every request held a database connection the whole time. To stop the damage, I turned on a feature flag for asynchronous fraud checks on small payments, which the business had approved before, and did a rolling restart. The service recovered in 35 minutes. Then I moved the partner call outside the transaction and added a 2-second timeout, a circuit breaker and an alert on pending connections. p99 went back to 280 milliseconds, and it has not happened again. My main lesson: keep transactions short and never wait on the network inside them.",
  adapt: [
    "Thay hệ thống thanh toán bằng hệ thống bạn làm thật; giữ quy mô (giao dịch/ngày, số người trong team) đúng sự thật",
    "Thay nguyên nhân gốc bằng nguyên nhân thật của sự cố bạn từng gặp (slow query, deadlock, memory leak, retry storm…)",
    "Ghi đúng vai trò của bạn: nếu bạn chỉ hỗ trợ người on-call thì nói rõ phần nào chính bạn làm",
    "Các con số (18%, 35 phút, p99) phải là số bạn nhớ được hoặc ước lượng hợp lý; interviewer sẽ hỏi bạn đo bằng gì",
  ],
  follow: [
    "Vì sao không tăng maximum-pool-size lên cho nhanh?",
    "Nếu không có feature flag sẵn thì bạn cầm máu bằng cách nào?",
    "Postmortem của bạn gồm những mục gì, và ai theo dõi các action item?",
  ],
  tags: ['HikariCP', 'transaction', 'on-call', 'circuit breaker'],
},
);
