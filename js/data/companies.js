/* Company interview tracks — written by research agent (researched Oct 2026).
 * Every round / question below is paraphrased from a public source listed in that entry.
 * Most first-hand technical reports are from 2020–2025 forum posts (voz.vn, note8, Viblo);
 * processes change, so treat them as patterns, not a fixed script.
 * focus ids map to js/data/topics.js ('design' = System Design, 'architecture' = Design Patterns & Clean Arch).
 */
window.COMPANIES = [
  {
    id: 'techcombank',
    name: 'Techcombank',
    type: 'bank',
    icon: '🏦',
    summary: 'Ngân hàng công khai định hướng cloud-first; case study của AWS mô tả việc đưa các hệ thống digital banking lên AWS (container, managed database, Kafka). Stack bên dưới tổng hợp từ nguồn công khai và JD, có thể khác theo team. Chia sẻ phỏng vấn Java công khai chủ yếu từ 2021–2022, nên chỉ coi là mẫu thường gặp; quy trình hiện tại cần xác nhận với recruiter.',
    stack: ['Java', 'Spring Boot', 'Microservices', 'Kafka (Amazon MSK)', 'Amazon EKS', 'Aurora MySQL', 'ElastiCache (Redis)', 'Oracle', 'PostgreSQL', 'AWS'],
    process: [
      { round: 'Vòng 1 — Bài test online', detail: 'Một review vị trí Senior/Techlead Java (2022) kể vòng đầu là bài test trên iMocha: Java core (exception, thread, collections), Spring (bean, DI/IoC, JPA) và design pattern.' },
      { round: 'Vòng 2 — Phỏng vấn kỹ thuật với hội đồng', detail: 'Phỏng vấn online với 3 Solution Architect: kiến thức nền (heap/stack, GC, IoC, SOLID), đào sâu dự án tâm đắc trên CV, đặt tình huống giả định cho dự án đó, unit test và (với vị trí lead) quản lý team.' },
      { round: 'Vòng 3 — Lãnh đạo khối (tùy vị trí)', detail: 'Bài JobOKO 2026 mô tả quy trình chung của ngân hàng: phỏng vấn cá nhân với hội đồng, sau đó một số vị trí gặp thêm lãnh đạo khối hoặc chuyên gia.' }
    ],
    focus: ['core', 'jvm', 'spring', 'microservices', 'design', 'db', 'architecture'],
    algoWeight: 0.2,
    englishRequired: true,
    questions: [
      'Phân biệt heap và stack; Garbage Collector hoạt động thế nào?',
      'IoC/DI trong Spring là gì, bean được quản lý ra sao?',
      'Giải thích các nguyên tắc SOLID và cho ví dụ áp dụng trong dự án.',
      'Dự án bạn tâm đắc nhất là gì, vì sao, tech stack ra sao và bạn đã xử lý vấn đề concurrency/realtime thế nào?',
      'Dự án có áp dụng design pattern nào? Nó giải quyết vấn đề gì và bạn triển khai ra sao?',
      'Database recovery hoạt động thế nào? Làm sao trao đổi dữ liệu giữa các database trong hệ phân tán?',
      'Bạn viết unit test thế nào (Mockito, JMockit...)?',
      'Câu hỏi system design tập trung vào microservices và database (một ứng viên backend 2021 cho biết gần như không hỏi về ngôn ngữ/framework).',
      'Khi trong team có thành viên yếu kỹ thuật hoặc có mâu thuẫn, bạn xử lý và phân chia việc thế nào?'
    ],
    tips: [
      'Ôn chắc Java core (exception, thread, collections) và Spring core vì có thể có bài test trắc nghiệm trước vòng phỏng vấn.',
      'Chuẩn bị 1–2 dự án kể theo mạch bối cảnh → vấn đề → giải pháp → kết quả, sẵn sàng bị hỏi tình huống giả định xoay quanh dự án đó.',
      'Đọc sách System Design Interview (Alex Xu) và kiến thức hệ phân tán — ứng viên từng phỏng vấn khuyên như vậy.',
      'Tìm hiểu kiến thức cloud/AWS cơ bản (container, managed database, Kafka) vì ngân hàng công khai định hướng cloud; hỏi recruiter stack cụ thể của team.',
      'Lồng ghép yếu tố tuân thủ, bảo mật và quản trị rủi ro vào câu trả lời; một số vị trí ngân hàng có thể hỏi chứng chỉ tiếng Anh, hãy xác nhận trong JD.'
    ],
    sources: [
      { title: 'voz.vn — [Review Phỏng Vấn] Các công ty CNTT, trang 78 (Techcombank Senior/Techlead Java, 2022)', url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-78' },
      { title: 'voz.vn — [Review công ty] CNTT bơi hết vào, trang 111 (Pass BE Techcombank, 2021)', url: 'https://voz.vn/t/review-cong-ty-cntt-boi-het-vao.34528/page-111' },
      { title: 'JobOKO — Kinh nghiệm phỏng vấn Techcombank 2026', url: 'https://vn.joboko.com/blog/phong-van-techcombank-nwi5737' },
      { title: 'AWS — Techcombank case study', url: 'https://aws.amazon.com/solutions/case-studies/techcombank-case-study/' },
      { title: 'Techcombank — Annual Report 2024 (published 2025)', url: 'https://techcombank.com/content/dam/techcombank/public-site/documents/bao-cao-thuong-nien-nam-2024-04042025-vie.pdf' },
      { title: 'ITviec — Techcombank company page', url: 'https://itviec.com/companies/techcombank' }
    ],
    confidence: 'medium'
  },

  {
    id: 'vpbank',
    name: 'VPBank',
    type: 'bank',
    icon: '🏦',
    summary: 'Theo success story công khai của Temenos, VPBank dùng core banking Temenos và đã nâng cấp, container hóa nền tảng này. Stack bên dưới lấy từ JD tuyển dụng, có thể khác theo team. Hầu như không có review phỏng vấn công khai cho vị trí Java có kinh nghiệm, nên mục quy trình rất mỏng; hãy coi phần dưới là mẫu chung của ngân hàng, không phải kịch bản cố định.',
    stack: ['Java', 'Spring Boot', 'Spring Cloud', 'MS SQL', 'MySQL', 'Oracle', 'MongoDB', 'Microservices', 'REST API', 'CI/CD'],
    process: [
      { round: 'Chưa có dữ liệu review tin cậy về vòng phỏng vấn Senior Java', detail: 'Chưa tìm thấy chia sẻ ứng viên 2025–2026 đủ chi tiết để xác nhận quy trình. Trang tuyển dụng chính thức đăng Senior Backend Developer (Java/Spring Boot), yêu cầu kinh nghiệm banking/fintech, Java frameworks, MS SQL/Oracle và đọc viết tiếng Anh; đây là yêu cầu tuyển dụng, không phải mô tả phỏng vấn.' },
      { round: 'Tham khảo — Chương trình Talent IT 2024 (fresher)', detail: 'Ứng viên chọn 1 trong 3 đề thử thách, làm trong 72 giờ với tài khoản AWS được cấp, nộp tài liệu ý tưởng + slide + video demo; kèm bài test IQ và culture fit. Đây là chương trình fresher, không phải quy trình senior.' }
    ],
    focus: ['spring', 'jpa', 'db', 'microservices', 'aws', 'scenario'],
    algoWeight: 0.2,
    englishRequired: false,
    questions: [
      'Chưa có câu hỏi phỏng vấn Senior Java nào được chia sẻ công khai đủ tin cậy. Hãy ôn theo JD: Spring Boot, Hibernate/JPA, tối ưu SQL trên MySQL/Oracle.',
      'Với vị trí core banking: chuẩn bị giải thích cách tích hợp với hệ thống core (Temenos) và đảm bảo tính nhất quán giao dịch.'
    ],
    tips: [
      'Dùng JD chính thức mới làm nguồn ưu tiên: Java/Spring Boot, MS SQL/Oracle và kiến thức quy trình banking; stack có thể khác theo domain.',
      'Chuẩn bị tình huống microservice/API, hỗ trợ production và xử lý incident vì JD senior nêu rõ thiết kế, triển khai và vận hành dịch vụ.',
      'Vì thiếu review công khai, hãy hỏi người quen nội bộ hoặc HR về format vòng kỹ thuật trước khi phỏng vấn.',
      'Chuẩn bị câu chuyện về làm việc với hệ thống legacy, vì ngân hàng nói chung thường vừa phát triển mới vừa bảo trì hệ thống cũ.'
    ],
    sources: [
      { title: 'Temenos — VPBank success story', url: 'https://www.temenos.com/success-story/vpbank/' },
      { title: 'VPBank Careers — Senior Backend Developer (Java/Spring Boot)', url: 'https://tuyendung.vpbank.com.vn/job/Senior-Backend-Developer-%28JavaSpringboot%29-TA171/10696-vi_VN/' },
      { title: 'VPBank IT Careers — Java Developer and microservices roles, 2025', url: 'https://hr.vpbank.com.vn/ta/Tuyendung_IT/index.html' },
      { title: 'ITviec — VPBank company page', url: 'https://itviec.com/companies/vpbank' },
      { title: 'voz.vn — Thử thách tuyển dụng Talent IT của VPBank 2024', url: 'https://voz.vn/t/co-hinh-thu-thach-tuyen-dung-talent-it-cua-vp-bank-2024.984836/' },
      { title: 'voz.vn — Mong nhận góp ý Nashtech vs VPBank (2020)', url: 'https://voz.vn/t/mong-nhan-gop-y-nashtech-vs-vp-bank.171662/' }
    ],
    confidence: 'low'
  },

  {
    id: 'mb-bank',
    name: 'MB Bank',
    type: 'bank',
    icon: '🏦',
    summary: 'Khối CNTT lớn ở Hà Nội, tuyển nhiều Backend Java/Go; trang công ty trên ITviec nêu backend dùng Spring Boot, Golang, GraphQL, MongoDB, Oracle, microservices, chạy trên AWS/Google Cloud/Viettel Cloud, Kubernetes, multi-DC. Review phỏng vấn công khai từ 2024–2025.',
    stack: ['Java', 'Spring Boot', 'Golang', 'Kafka', 'Oracle', 'PostgreSQL', 'MongoDB', 'Redis', 'GraphQL', 'Kubernetes', 'Docker', 'GitLab CI'],
    process: [
      { round: 'Vòng 1 — Phỏng vấn kỹ thuật', detail: 'Lịch hẹn thường gửi qua email (không gọi điện). Hỏi tối ưu database, microservices, xác thực bằng JWT và công việc khó nhất bạn từng làm. Một buổi khác (2024) có 2 người phỏng vấn + HR, hỏi thuật toán, bảo mật, SQL, cấu trúc và SOLID.' },
      { round: 'Vòng 2 — Phỏng vấn với cấp phó giám đốc', detail: 'Đào sâu hơn kiến thức cốt lõi và câu hỏi tình huống, ví dụ thiết kế hệ thống để người dùng không phải chờ khi lượng request tăng mạnh.' }
    ],
    focus: ['spring', 'db', 'microservices', 'design', 'scenario', 'architecture'],
    algoWeight: 0.25,
    englishRequired: false,
    questions: [
      'Bạn tối ưu một truy vấn/database chậm như thế nào?',
      'Giải thích kiến trúc microservices bạn đã làm và các vấn đề gặp phải.',
      'Xác thực bằng JWT hoạt động thế nào, ưu nhược điểm và rủi ro bảo mật?',
      'Công việc/kỹ thuật khó nhất bạn từng giải quyết là gì?',
      'Thiết kế hệ thống sao cho người dùng không bị chờ khi lượng request tăng đột biến.',
      'Các nguyên tắc SOLID; một vài câu thuật toán và câu hỏi bảo mật cơ bản.',
      'Viết/giải thích câu SQL theo yêu cầu.'
    ],
    tips: [
      'Theo dõi email sát sao sau khi nộp CV vì HR thường gửi lịch phỏng vấn qua mail.',
      'Ôn kỹ tối ưu SQL (index, execution plan) trên Oracle/PostgreSQL và bảo mật API (JWT, OAuth2).',
      'Chuẩn bị bài toán chịu tải cao: queue/async, cache, rate limiting, scale ngang — đây là dạng câu tình huống được nhắc tới.',
      'Ôn cả Golang ở mức đọc hiểu nếu ứng tuyển các tin Java/Go.'
    ],
    sources: [
      { title: 'voz.vn — Xin quy trình phỏng vấn Dev tại MB Bank HN (2024)', url: 'https://voz.vn/t/xin-quy-trinh-phong-van-dev-tai-mb-bank-hn.986276/' },
      { title: 'voz.vn — Review môi trường làm việc MB Bank (trang 2–3, 2024–2025)', url: 'https://voz.vn/t/review-moi-truong-lam-viec-mb-bank.1026012/page-3' },
      { title: 'ITviec — MB Bank company page', url: 'https://itviec.com/companies/mb-bank' }
    ],
    confidence: 'medium'
  },

  {
    id: 'momo',
    name: 'MoMo',
    type: 'fintech',
    icon: '💳',
    summary: 'Ví điện tử / siêu ứng dụng tài chính lớn; tin tuyển Software Engineer trên ITviec yêu cầu Java, Spring Boot, Kafka, microservices, Redis, MongoDB, MySQL, Kubernetes. Review phỏng vấn backend chi tiết nhất là từ 2023.',
    stack: ['Java', 'Spring Boot', 'Python', 'Kafka', 'Microservices', 'MySQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes'],
    process: [
      { round: 'Vòng 1 — HR call', detail: 'Trao đổi với HR, có kiểm tra tiếng Anh (review Backend Engineer, 2023).' },
      { round: 'Vòng 2 — Kỹ thuật với 2 Software Engineer', detail: 'Hỏi về các dự án trên CV và 1 bài thuật toán: đưa lời giải brute force trước rồi tối ưu dần.' },
      { round: 'Vòng 3 — Tech Lead + Senior Engineer', detail: 'Tiếp tục hỏi CV, một câu system design nhỏ và các câu problem solving mở. Một ứng viên Java năm 2026 kể vòng technical online kéo dài khoảng 2 giờ.' }
    ],
    focus: ['spring', 'microservices', 'db', 'design', 'concurrency', 'scenario'],
    algoWeight: 0.35,
    englishRequired: true,
    questions: [
      'Trình bày các dự án trên CV: vai trò, kiến trúc, khó khăn đã xử lý.',
      'Một bài thuật toán: đưa ra cách brute force, phân tích độ phức tạp rồi tối ưu.',
      'Một bài system design quy mô nhỏ (ví dụ một service trong hệ thống thanh toán).',
      'Các câu hỏi problem solving mở: bạn tiếp cận một vấn đề chưa rõ yêu cầu thế nào?'
    ],
    tips: [
      'Luyện thuật toán mức easy–medium và thói quen nói to cách tối ưu từ brute force.',
      'Ôn Kafka, Redis, microservices và các vấn đề của hệ thống thanh toán (idempotency, retry, nhất quán dữ liệu).',
      'Chuẩn bị phần giới thiệu và trao đổi bằng tiếng Anh cho vòng HR.',
      'Chuẩn bị tinh thần quy trình có thể chậm phản hồi — vài review 2024–2026 phàn nàn về việc báo kết quả muộn.'
    ],
    sources: [
      { title: 'note8.vn — Phỏng vấn MOMO Vietnam (review Backend Engineer 2023)', url: 'https://note8.vn/phong-van-dn/cong-ty-co-phan-vien-thong-momo-viet-nam-1392' },
      { title: 'voz.vn — Xin review phỏng vấn Software Engineer II Java MoMo (2026)', url: 'https://voz.vn/t/xin-review-phong-van-software-engineer-ii-java-momo.1258526/' },
      { title: 'ITviec — M_Service (MoMo) company page', url: 'https://itviec.com/companies/m_service-momo' }
    ],
    confidence: 'medium'
  },

  {
    id: 'vnpay',
    name: 'VNPay',
    type: 'fintech',
    icon: '💸',
    summary: 'Công ty thanh toán điện tử phục vụ hơn 40 ngân hàng và tổ chức thanh toán (QR, mobile banking, ví). Chỉ có một review phỏng vấn Java công khai và đã cũ (2020), nên dùng như tham khảo.',
    stack: ['Java', 'Spring Boot', 'Vert.x', 'Oracle', 'MS SQL', 'PostgreSQL', 'Kafka', 'RabbitMQ', 'ActiveMQ', 'Redis', '.NET'],
    process: [
      { round: 'Vòng duy nhất — 2 Technical Lead', detail: 'Review năm 2020 cho vị trí Software Engineer (Java): một vòng duy nhất với 2 technical lead, hỏi kiến thức nền Java/Spring, đào sâu tech stack trên CV và một câu thiết kế; ứng viên không nhớ có câu thuật toán.' }
    ],
    focus: ['core', 'jvm', 'spring', 'db', 'microservices', 'design'],
    algoWeight: 0.15,
    englishRequired: false,
    questions: [
      'Heap và stack khác nhau thế nào; GC hoạt động ra sao?',
      'IoC trong Spring, các nguyên tắc SOLID.',
      'Database recovery hoạt động thế nào?',
      'Dự án của bạn dùng Kafka để giải quyết bài toán gì? Vì sao team chọn công nghệ đó?',
      'Làm sao xây dựng báo cáo dữ liệu realtime mà không phải query database nhiều?'
    ],
    tips: [
      'Chuẩn bị lý do chọn từng công nghệ trong dự án (vì sao Kafka, vì sao Redis...).',
      'Ôn message queue (Kafka/RabbitMQ) và cache (Redis) vì JD nhấn mạnh.',
      'Thái độ tự tin, chủ động đưa giải pháp được người review cho là có tính điểm.'
    ],
    sources: [
      { title: 'voz.vn — [Review Phỏng Vấn] Các công ty CNTT, trang 3 (VNPay Software Engineer Java, 2020)', url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-3' },
      { title: 'ITviec — VNPAY company page', url: 'https://itviec.com/companies/vnpay' }
    ],
    confidence: 'low'
  },

  {
    id: 'vng-zalo',
    name: 'VNG (Zalo)',
    type: 'bigtech',
    icon: '💬',
    summary: 'Tập đoàn công nghệ (game, Zalo, Zalopay, cloud/data center). Vòng backend của Zalo được chia sẻ gần đây nặng live coding, CS fundamentals và system design; ngôn ngữ phỏng vấn có thể không phải Java.',
    stack: ['Java', 'C++', 'Kubernetes', 'Cloud'],
    process: [
      { round: 'Vòng 1 — Kỹ thuật (~2 giờ)', detail: 'Theo bài chia sẻ offer mid-level Zalo (Viblo): live coding 2 bài, một phần system design, rồi kiến thức backend + CS fundamentals (mạng, OS, database) và review CV — được hỏi rất sâu.' },
      { round: 'Vòng 2 — Online assessment', detail: 'Bài test tiếng Anh và toán theo dạng GMAT. Một review năm 2021 cũng kể có bài trắc nghiệm 100 câu (logic, xã hội, tiếng Anh).' },
      { round: 'Vòng 3 — Kỹ thuật + culture fit (~1,5 giờ)', detail: 'Nửa kỹ thuật, nửa behavioral/culture fit; không khí khá thoải mái.' }
    ],
    focus: ['design', 'db', 'concurrency', 'microservices', 'english', 'behavioral'],
    algoWeight: 0.6,
    englishRequired: true,
    questions: [
      'Live coding: Merge K Sorted Lists.',
      'Thiết kế một class có các thao tác add, addToAll, get đều chạy O(1).',
      'Một bài graph khó (mức medium–hard).',
      'CS fundamentals: networking, OS, database — hỏi sâu.',
      'Một bài system design (dùng làm yếu tố quyết định level).',
      'Kiến thức HTTP/HTTPS, WebSocket, REST (review Zalo 2021).'
    ],
    tips: [
      'Luyện LeetCode medium–hard (heap, linked list, graph, thiết kế cấu trúc dữ liệu O(1)).',
      'Ôn CS fundamentals bài bản: TCP/HTTP, process/thread, index và transaction trong database.',
      'Chuẩn bị system design kỹ vì người chia sẻ cho rằng đây là vòng quyết định level.',
      'Luyện đọc hiểu tiếng Anh và toán logic cho bài online assessment.',
      'Nói rõ suy nghĩ khi code — người chia sẻ cho biết điều này được cộng điểm.'
    ],
    sources: [
      { title: 'Viblo — Từ cú trượt Caladan đến offer mid-level tại Zalo', url: 'https://viblo.asia/p/tu-cu-truot-caladan-den-offer-mid-level-tai-zalo-1QLxnya04Aw' },
      { title: 'voz.vn — [Review Phỏng Vấn] Các công ty CNTT, trang 7 (Zalo Senior SE, 2021)', url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-7' },
      { title: 'ITviec — VNG Corporation company page', url: 'https://itviec.com/companies/vng-corporation' }
    ],
    confidence: 'medium'
  },

  {
    id: 'shopee',
    name: 'Shopee (Vietnam engineering)',
    type: 'bigtech',
    icon: '🛒',
    summary: 'Một ứng viên Shopee VN cho biết quy trình ở Việt Nam không khác Singapore: nặng thuật toán và CS fundamentals. Review chi tiết chủ yếu từ 2021 (cũ); người trong cuộc nêu stack chính là Go (backend) và React/TypeScript, nên Java không phải lợi thế lớn.',
    stack: ['Golang', 'React / TypeScript'],
    process: [
      { round: 'Vòng 1 — Screening', detail: 'Bài coding online kiểm tra khả năng lập trình cơ bản, kèm vài cuộc gọi với HR.' },
      { round: 'Vòng 2 — Technical 1', detail: 'Hỏi CS fundamentals rồi 2 bài LeetCode mức medium (review Shopee VN, 2021).' },
      { round: 'Vòng 3 — Technical 2', detail: 'Lý thuyết DB, network, OS và một bài code; format dự kiến khoảng 15 phút hỏi + 45 phút code.' },
      { round: 'Vòng cuối — Team lead / manager', detail: 'Theo review Shopee Singapore: vòng cuối với team lead vẫn có code/thuật toán và system design; kết quả có trong khoảng vài ngày đến hơn một tuần.' }
    ],
    focus: ['concurrency', 'core', 'db', 'design', 'english'],
    algoWeight: 0.75,
    englishRequired: true,
    questions: [
      'Phân biệt thread và process.',
      'Pass by reference và pass by value khác nhau thế nào?',
      'Shallow copy và deep copy.',
      'Hai bài LeetCode mức medium trong một vòng 60 phút.',
      'Câu hỏi về database và mạng máy tính (TCP/UDP, HTTP).',
      'Thiết kế schema SQL cho tập dữ liệu lớn, sau đó cài đặt chính sách cache eviction (báo cáo trên Glassdoor, không riêng Việt Nam).'
    ],
    tips: [
      'Ưu tiên luyện LeetCode medium đều tay và tốc độ — có ứng viên bị đánh trượt vì code chậm.',
      'Ôn CS fundamentals (OS, network, DB) ngang với thuật toán.',
      'Sẵn sàng code bằng ngôn ngữ bạn mạnh nhất; nhiều team dùng Go nhưng phỏng vấn thường không bắt buộc ngôn ngữ.',
      'Tiếng Anh nghe nói ổn là đủ — người chia sẻ cho rằng kỹ thuật quan trọng hơn.'
    ],
    sources: [
      { title: 'voz.vn — [Review công ty] Shopee Singapore, trang 2 (bình luận về phỏng vấn Shopee VN, 2021)', url: 'https://voz.vn/t/review-cong-ty-shopee-singapore.384029/page-2' },
      { title: 'voz.vn — [Review công ty] Shopee Singapore, trang 1 (quy trình phỏng vấn, 2021)', url: 'https://voz.vn/t/review-cong-ty-shopee-singapore.384029/' },
      { title: 'Glassdoor — Shopee Backend Engineer interview questions (đa văn phòng)', url: 'https://www.glassdoor.com/Interview/Shopee-Backend-Engineer-Interview-Questions-EI_IE1263091.0,6_KO7,23.htm' }
    ],
    confidence: 'low'
  },

  {
    id: 'grab-vietnam',
    name: 'Grab Vietnam',
    type: 'bigtech',
    icon: '🚗',
    summary: 'Văn phòng kỹ sư tại TP.HCM thuộc Grab; backend chủ yếu viết bằng Go, nền tảng streaming dùng Kafka/Flink. Phỏng vấn theo chuẩn regional: online assessment, coding, system design, behavioral bằng tiếng Anh.',
    stack: ['Golang', 'Kafka', 'Flink', 'MySQL', 'Redis', 'AWS', 'Terraform', 'Kubernetes'],
    process: [
      { round: 'Vòng 0 — Online assessment (Codility)', detail: 'Review 2022: trắc nghiệm (có phần SQL) + 2–3 bài thuật toán mức medium.' },
      { round: 'Vòng 1 — Technical coding (60 phút)', detail: '1–2 bài coding mức easy/medium và kiến thức ngôn ngữ; có ứng viên được hỏi thêm microservices, cache, database, logging/tracing/monitoring.' },
      { round: 'Vòng 2 — System design (tiếng Anh)', detail: 'Phỏng vấn với lead và thành viên team (có thể ở Singapore), bao quát schema, cache, authentication, các lựa chọn thiết kế và scale.' },
      { round: 'Vòng 3 — Hiring manager / culture fit (tiếng Anh)', detail: 'Có thể thêm một bài coding medium, câu hỏi REST, DNS, TCP/UDP và behavioral. Một review Senior SE TP.HCM (10/2025, Glassdoor) mô tả: CV screen → live coding medium + kinh nghiệm → system design → culture fit với engineering manager.' }
    ],
    focus: ['design', 'microservices', 'db', 'concurrency', 'behavioral', 'english'],
    algoWeight: 0.6,
    englishRequired: true,
    questions: [
      'Thiết kế service C đứng giữa service A (phát X message/giây) và service B (xử lý Y message/giây), rồi viết code xử lý.',
      'Làm sao đảm bảo dữ liệu nhất quán và mức isolation trong database ở dự án cũ?',
      'Kiến thức về REST, DNS, TCP và UDP.',
      'Microservices: cache, database, logging, tracing, monitoring.',
      'Behavioral: vì sao đổi việc, bug lớn nhất bạn từng sửa, vấn đề khó nhất từng giải, điều bạn tự hào nhất.',
      'System design đầy đủ: schema, cache, authentication, scale.'
    ],
    tips: [
      'Luyện LeetCode medium trên nền tảng có giới hạn thời gian (Codility/HackerRank) và ôn SQL cho phần trắc nghiệm.',
      'Luyện system design bằng tiếng Anh, chú ý backpressure/queue khi producer nhanh hơn consumer.',
      'Chuẩn bị câu chuyện theo bộ giá trị 4H của Grab (Heart, Hunger, Honour, Humility) cho vòng behavioral.',
      'Backend chủ yếu là Go — thể hiện sẵn sàng học Go và nắm vững concurrency nói chung.'
    ],
    sources: [
      { title: 'voz.vn — [Review Phỏng Vấn] Các công ty CNTT, trang 48 (Grab Backend middle, 4/2022)', url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-48' },
      { title: 'voz.vn — [Review Phỏng Vấn] Các công ty CNTT, trang 56 (Grab middle SE, 2022)', url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-56' },
      { title: 'Glassdoor — Grab interview questions in Vietnam', url: 'https://www.glassdoor.com/Interview/Grab-Vietnam-Interview-Questions-EI_IE958580.0,4_IL.5,12_IN251.htm' },
      { title: 'TechInterview.org — Grab interview guide (2026, tổng hợp chung)', url: 'https://www.techinterview.org/companies/grab-interview-guide/' }
    ],
    confidence: 'medium'
  },

  {
    id: 'nab-vietnam',
    name: 'NAB Innovation Centre Vietnam',
    type: 'bank',
    icon: '🏛️',
    summary: 'NAB Innovation Centre Vietnam làm sản phẩm công nghệ ngân hàng với Java/Spring và nền tảng cloud. Review Java/Senior cụ thể nhất vẫn là chia sẻ cũ; review 2026 của các role khác ghi nhận technical, peer/manager và culture rounds, có ứng viên đánh giá quy trình nhanh, chuyên nghiệp và interviewer thân thiện. Không áp dụng tự động cho Java role; stack bên dưới tổng hợp từ JD công khai và khác nhau theo team.',
    stack: ['Java', 'Spring Boot', 'Node.js', 'AWS', 'PostgreSQL', 'Kubernetes', 'Terraform'],
    process: [
      { round: 'Vòng 1 — Recruiter call (tiếng Anh)', detail: 'Kiểm tra tiếng Anh và profile, sau đó gửi bài home assignment.' },
      { round: 'Vòng 2 — Home assignment trên Codility (70–80 phút)', detail: 'Review Senior Java (3/2022): 1 phần trắc nghiệm Java + 1 bài viết API nhỏ trên Spring MVC phải pass bộ test. Một review Java engineer khác (5/2022) kể có vòng live coding với 1 bài LeetCode hard.' },
      { round: 'Vòng 3 — Phỏng vấn kỹ thuật với Lead/Manager', detail: 'Hỏi rất sâu Java (JVM, memory, GC, concurrency, synchronization, collections), API design và database design. Có thể dùng tiếng Việt khi khó diễn đạt.' },
      { round: 'Vòng 4 — Peer/manager hoặc culture interview (tùy role)', detail: 'Một review ứng viên Fullstack tháng 4/2026 ghi nhận 3 vòng: technical với team leader, peer interview với engineering managers và culture interview có thành viên Australia. Ứng viên nhận xét quy trình nhanh, chuyên nghiệp, recruiter cập nhật đều và interviewer thân thiện nhưng đặt câu hỏi thử thách. Đây không phải xác nhận cho Java role.' }
    ],
    focus: ['jvm', 'concurrency', 'collections', 'spring', 'db', 'english', 'behavioral'],
    algoWeight: 0.4,
    englishRequired: true,
    questions: [
      'JVM memory model: heap, stack, metaspace; GC hoạt động thế nào?',
      'Concurrency và synchronization trong Java.',
      'Cấu trúc và cách chọn các Java Collections.',
      'Thiết kế API: đặt URL, xử lý và trả lỗi (exception handling).',
      'Database: ACID, lock, isolation level, index.',
      'Viết một REST API nhỏ bằng Spring MVC sao cho pass bộ test có sẵn (home assignment).',
      'Câu hỏi thực tế: giữ branch luôn cập nhật thế nào, refactor chưa xong mà đến ngày release thì xử lý ra sao?',
      'Giới thiệu bản thân, điểm mạnh/yếu, mục tiêu — bằng tiếng Anh.'
    ],
    tips: [
      'Ôn sâu JVM, GC, concurrency và Collections — đây là trọng tâm vòng kỹ thuật Java.',
      'Luyện viết Spring REST API nhanh trong IDE và chạy test trong giới hạn thời gian.',
      'Ôn transaction isolation, locking, indexing kèm ví dụ thực tế.',
      'Luyện tiếng Anh nói cho vòng recruiter và culture fit; tìm hiểu AWS vì trung tâm định hướng cloud.'
    ],
    sources: [
      { title: 'voz.vn — [Review Phỏng Vấn] Các công ty CNTT, trang 41 (NAB Senior Java Developer, 3/2022)', url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-41' },
      { title: 'voz.vn — Xin review dev tại NAB (2022)', url: 'https://voz.vn/t/xin-review-dev-tai-nab.543106/' },
      { title: 'voz.vn — Java Technical Interview NAB StarCamp (2024)', url: 'https://voz.vn/t/java-technial-interview-nab-starcamp.1034064/' },
      { title: 'Note8 — NAB Innovation Centre Vietnam interview reviews (2026)', url: 'https://note8.vn/phong-van-dn/nab-innovation-centre-vietnam-399' },
      { title: 'ITviec — NAB Innovation Centre Vietnam company page', url: 'https://itviec.com/companies/nab-innovation-centre-vietnam' }
    ],
    confidence: 'medium'
  },

  {
    id: 'axon',
    name: 'Axon (Vietnam)',
    type: 'product',
    icon: '📹',
    summary: 'Công ty sản phẩm Mỹ (body camera và cloud quản lý bằng chứng cho cảnh sát) có trung tâm kỹ sư tại TP.HCM; backend dùng Java, Scala, Go, .NET, Python. Theo các review ứng viên năm 2022, phỏng vấn theo kiểu product company: có bài online assessment và vòng kỹ thuật dài nhiều phần. Quy trình có thể đã đổi, hãy coi đây là mẫu thường gặp.',
    stack: ['Java', 'Scala', 'Golang', '.NET', 'Python', 'ReactJS'],
    process: [
      { round: 'Vòng 0 — Recruiter screen', detail: 'Giới thiệu công ty/role, kiểm tra tiếng Anh qua vài câu behavioral.' },
      { round: 'Vòng 1 — Online assessment hoặc screening 1 giờ', detail: 'OA: trắc nghiệm + 3 bài thuật toán mức medium–hard. Hoặc screening: kinh nghiệm, database/index, 1 bài coding easy/medium có mở rộng.' },
      { round: 'Vòng 2 — Technical onsite (3–4 giờ)', detail: 'Chia nhiều phần: CS fundamentals (cấu trúc dữ liệu, DB, OS, network, OOP/SOLID), coding trên bảng, 1 bài SQL nhỏ, system design (high-level, schema, scale).' },
      { round: 'Vòng 3 — Culture fit (tiếng Anh)', detail: 'Với head/manager người nước ngoài: kỳ vọng, lý do đổi việc, điểm mạnh/yếu, kế hoạch phát triển.' }
    ],
    focus: ['design', 'db', 'jvm', 'concurrency', 'core', 'english', 'behavioral'],
    algoWeight: 0.6,
    englishRequired: true,
    questions: [
      'Thiết kế dịch vụ rút gọn link kiểu bit.ly: scale, tối ưu đọc/ghi, throughput database.',
      'ACID và BASE; index và cách database hoạt động bên dưới; B-tree.',
      'Stack và heap, Java GC, thread/process.',
      'TCP/UDP, REST và gRPC, HTTP/HTTPS.',
      'Bốn tính chất OOP, SOLID; áp dụng tracing/logging/monitoring trong thực tế.',
      'Bài coding trên bảng, sau đó mở rộng: input quá lớn không vừa bộ nhớ, dữ liệu chưa sắp xếp.',
      'Một bài SQL nhỏ.'
    ],
    tips: [
      'Luyện LeetCode medium–hard cho vòng OA — người review nói vòng này khó nhất.',
      'Ôn CS fundamentals rộng (DS, DB internals, OS, network) vì một phần 45 phút hỏi liên tục.',
      'Luyện các bài system design kinh điển (URL shortener...) và cách mở rộng khi dữ liệu lớn.',
      'Chuẩn bị behavioral bằng tiếng Anh và kể kỹ các dự án đã làm.'
    ],
    sources: [
      { title: 'voz.vn — [Review Phỏng Vấn] Các công ty CNTT, trang 48 (Axon Software Engineer, 2022)', url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-48' },
      { title: 'voz.vn — [Review Phỏng Vấn] Các công ty CNTT, trang 56 (Axon middle SE, 2022)', url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-56' },
      { title: 'ITviec — AXON company page', url: 'https://itviec.com/companies/axon' }
    ],
    confidence: 'medium'
  },
  {
    id: 'gotymex',
    name: 'GoTymeX',
    type: 'fintech',
    icon: '🏦',
    summary: 'GoTyme mô tả Việt Nam là Technology & Product Development Hub, xây dựng digital bank cho các thị trường mới nổi. Trang tuyển dụng công khai nêu quy trình application review, technical interview, culture fit; chưa có review Java Senior Việt Nam đủ chi tiết để khẳng định câu hỏi cụ thể.',
    stack: ['Java', 'Spring Boot', 'Microservices', 'Cloud'],
    process: [
      { round: 'Vòng 1 — Application review', detail: 'Sàng lọc CV theo role và kinh nghiệm.' },
      { round: 'Vòng 2 — Technical interview', detail: 'Được công ty xác nhận là một bước chính thức; nội dung và bài coding tùy vị trí/team. Hỏi recruiter về ngôn ngữ, thời lượng và system design.' },
      { round: 'Vòng 3 — Culture fit', detail: 'Trang tuyển dụng nêu culture-fit interview, sau đó onboarding nếu phù hợp.' }
    ],
    focus: ['spring', 'microservices', 'db', 'design', 'security', 'scenario'],
    algoWeight: 0.25,
    englishRequired: true,
    questions: [
      'Bạn thiết kế API chuyển tiền idempotent thế nào khi client retry sau timeout?',
      'Làm sao giữ nhất quán trạng thái giao dịch khi database commit nhưng publish Kafka thất bại?',
      'Hãy mô tả một incident production bạn xử lý và cách bạn chứng minh nguyên nhân gốc.'
    ],
    tips: [
      'Xem câu hỏi gợi ý là bài luyện theo lĩnh vực digital banking, không phải câu hỏi đã được ứng viên xác nhận.',
      'Chuẩn bị giải thích idempotency, ledger, audit trail, retry, reconciliation và bảo mật dữ liệu tài chính.',
      'Luyện trình bày ngắn gọn bằng tiếng Anh; hỏi recruiter trước về format coding và ngôn ngữ phỏng vấn.'
    ],
    sources: [
      { title: 'GoTymeX Vietnam — Recruitment Process and career information', url: 'https://vietnam.tyme.com/' }
    ],
    confidence: 'low'
  },
  {
    id: 'epam-vietnam',
    name: 'EPAM Vietnam',
    type: 'service',
    icon: '🌐',
    summary: 'Tin tuyển Senior Java Engineer tại EPAM Vietnam yêu cầu Java, Spring Boot, JUnit, Git, Maven, design patterns và SOLID. Quy trình tuyển dụng chính thức thường gồm recruiter, technical, manager và client interview; vị trí cụ thể có thể thêm entry test. Chia sẻ ứng viên 2025 quốc tế cho thấy Java fundamentals, Spring, SQL và coding, nhưng không đại diện riêng Vietnam.',
    stack: ['Java', 'Spring Boot', 'JUnit', 'Maven', 'Microservices', 'SQL', 'AWS', 'Kafka'],
    process: [
      { round: 'Vòng 1 — Talent attraction', detail: 'Trao đổi với recruiter về kinh nghiệm, tiếng Anh và yêu cầu dự án.' },
      { round: 'Vòng 2 — Technical interview', detail: 'Đánh giá chuyên môn; một số vị trí yêu cầu entry test theo client/project. Các chia sẻ 2025 nêu Java core, Spring, SQL, Java streams và bài coding.' },
      { round: 'Vòng 3 — Hiring manager và client', detail: 'Quy trình chuẩn EPAM có trao đổi với manager rồi client/project interview; số vòng thực tế tùy vị trí.' }
    ],
    focus: ['core', 'collections', 'spring', 'jpa', 'db', 'microservices', 'english'],
    algoWeight: 0.35,
    englishRequired: true,
    questions: [
      'Giải thích lựa chọn thiết kế trong một dự án Java/Spring của bạn và trade-off vận hành.',
      'Giải bài coding rồi phân tích độ phức tạp thời gian và bộ nhớ.',
      'Khi nào dùng CompletableFuture thay vì Future; xử lý exception và timeout ra sao?',
      'Thiết kế giao dịch phân tán cho service Spring Boot tích hợp Kafka thế nào?'
    ],
    tips: [
      'Ôn Java core, collections, streams, concurrency, Spring Boot, SQL và unit testing; từng vòng có thể phụ thuộc client.',
      'Chuẩn bị kể sâu dự án và trao đổi bằng tiếng Anh với interviewer/client quốc tế.',
      'Hỏi trước về assessment, project stack và số vòng vì EPAM xác nhận quy trình có thể thêm bước theo dự án.'
    ],
    sources: [
      { title: 'EPAM Careers — Senior Java Engineer, Vietnam vacancy and hiring process', url: 'https://careers.epam.com/en/vacancy/senior-java-engineer-blttpn84g6zmt6ll3c7_en' },
      { title: 'AmbitionBox — EPAM Software Engineer interview experiences, 2025', url: 'https://www.ambitionbox.com/interviews/epam-systems-interview-questions/software-engineer' },
      { title: 'Glassdoor — EPAM Senior Java Developer interview experience, 2025', url: 'https://www.glassdoor.ca/Interview/EPAM-Systems-Interview-RVW95534424.htm' }
    ],
    confidence: 'medium'
  },
  {
    id: 'money-forward-vietnam',
    name: 'Money Forward Vietnam',
    type: 'fintech',
    icon: '💴',
    summary: 'Money Forward Vietnam tuyển Principal Java/Kotlin cho banking và công bố quy trình tuyển dụng bốn bước: phone screen, competency interview, final interview và offer; công ty nói sẽ phản hồi sau mỗi giai đoạn. Một bài chia sẻ techlead 2025 ghi nhận hai vòng với team Việt Nam và manager Nhật cho một role khác, nên quy trình thay đổi theo vị trí.',
    stack: ['Java', 'Kotlin', 'Spring Boot', 'Banking', 'Microservices', 'AWS'],
    process: [
      { round: 'Vòng 1 — Application review & phone screen', detail: 'Talent Acquisition trao đổi kinh nghiệm, kỹ năng và kỳ vọng.' },
      { round: 'Vòng 2 — Competency interview', detail: 'Chuyên gia Money Forward đánh giá kiến thức kỹ thuật liên quan và năng lực khác.' },
      { round: 'Vòng 3 — Final interview', detail: 'Trao đổi với management về kỳ vọng và hướng phát triển. Một bài chia sẻ ứng viên Principal năm 2025 kể hai vòng với team Việt Nam và manager Nhật; đó là trải nghiệm role cụ thể.' }
    ],
    focus: ['core', 'spring', 'microservices', 'db', 'design', 'architecture', 'behavioral', 'english'],
    algoWeight: 0.2,
    englishRequired: true,
    questions: [
      'Kể một quyết định kỹ thuật khó bạn đã đưa ra, dữ kiện nào khiến bạn chọn phương án đó?',
      'Ở vai trò senior/principal, bạn xử lý bất đồng về kiến trúc và giúp team đi đến quyết định ra sao?',
      'Bạn thiết kế backend banking bảo đảm auditability và xử lý lỗi giao dịch thế nào?'
    ],
    tips: [
      'Chuẩn bị các câu chuyện theo bối cảnh, lựa chọn, kết quả đo được và điều bạn rút kinh nghiệm; nguồn ứng viên nhấn mạnh câu hỏi kể chuyện.',
      'Principal Java/Kotlin banking là role đang được tuyển; xác nhận stack và phạm vi trách nhiệm trong JD cụ thể.',
      'Trang chính thức hứa phản hồi sau từng giai đoạn; hỏi rõ timeline và người phỏng vấn ở competency/final round.'
    ],
    sources: [
      { title: 'Money Forward Vietnam Careers — current vacancies and recruitment process', url: 'https://careers.moneyforward.com.vn/' },
      { title: 'Viblo — Góc nhìn từ một techlead trải nghiệm phỏng vấn tại Money Forward, 2025', url: 'https://viblo.asia/p/goc-nhin-tu-mot-techlead-trai-nghiem-phong-van-tai-money-forward-gdJzvpNjJz5' },
      { title: 'Note8 — Money Forward Vietnam interview reviews, 2025', url: 'https://note8.vn/tong-quan/money-forward-vietnam-co-ltd-393' }
    ],
    confidence: 'medium'
  },
  {
    id: 'gft-technologies-vietnam',
    name: 'GFT Technologies Vietnam',
    type: 'service',
    icon: '🏦',
    summary: 'Công ty dịch vụ công nghệ chuyên mảng tài chính, ngân hàng; JD công khai trên ITviec tuyển Senior Java/Spring với Kafka, AWS, microservices. Chưa có review phỏng vấn đủ tin cậy, nên phần dưới chỉ là mẫu chung cho công ty outsourcing mảng banking (thường có vòng tiếng Anh và có thể có vòng với khách hàng).',
    stack: ['Java', 'Spring Boot', 'JPA', 'Kafka', 'AWS', 'Microservices', 'JUnit', 'Mockito'],
    process: [{ round: 'Quy trình chưa được xác minh', detail: 'Không tìm được review phỏng vấn Java Việt Nam mới đủ chi tiết. Hỏi recruiter về các vòng technical, tiếng Anh và bài coding.' }],
    focus: ['spring', 'jpa', 'microservices', 'aws', 'db', 'english', 'architecture'],
    algoWeight: 0.25,
    englishRequired: true,
    questions: ['Bạn thiết kế một luồng giao dịch banking dùng Kafka thế nào để tránh mất hoặc xử lý lặp message?', 'Bạn chọn Spring transaction boundary và chiến lược retry ra sao khi gọi service ngoài?'],
    tips: ['JD Java banking yêu cầu tiếng Anh; luyện giải thích kiến trúc, testing và production trade-off bằng tiếng Anh.', 'Điểm ITviec phản ánh review nơi làm việc, không phải review phỏng vấn.'],
    sources: [
      { title: 'ITviec — GFT Technologies Vietnam reviews and rating', url: 'https://itviec.com/companies/gft-technologies-vietnam/review' },
      { title: 'ITviec — Senior Backend Engineer Java/Spring job description', url: 'https://itviec.com/it-jobs/senior-backend-engineer-java-spring-english-gft-technologies-vietnam-1523' }
    ],
    confidence: 'medium'
  },
  {
    id: 'naver-vietnam',
    name: 'NAVER VIETNAM',
    type: 'bigtech',
    icon: '🔎',
    summary: 'Chi nhánh tại Việt Nam của tập đoàn công nghệ Hàn Quốc NAVER; có đăng tin tuyển Backend Engineer Java/Spring trên ITviec. Chưa tìm được review phỏng vấn Java Việt Nam công khai đủ tin cậy, nên phần dưới chỉ là mẫu thường gặp ở công ty sản phẩm quy mô lớn (coding, system design, Java nền tảng).',
    stack: ['Java', 'Spring', 'Backend', 'Large-scale systems'],
    process: [{ round: 'Quy trình chưa được xác minh', detail: 'Ứng tuyển theo JD Java/Spring hiện hành và xác nhận với recruiter về coding, system design, tiếng Anh và số vòng.' }],
    focus: ['core', 'jvm', 'spring', 'microservices', 'design', 'db', 'concurrency'],
    algoWeight: 0.4,
    englishRequired: true,
    questions: ['Thiết kế backend service chịu tải cao: bạn tìm bottleneck và xác định điểm scale như thế nào?', 'Hãy giải thích một quyết định tối ưu hiệu năng Java có số đo trước và sau.'],
    tips: ['Ôn Java/Spring và system design dựa trên yêu cầu cụ thể của job description.', 'Rating và recommend trên ITviec là đánh giá nơi làm việc, không đại diện cho ứng viên phỏng vấn.'],
    sources: [
      { title: 'ITviec — NAVER VIETNAM reviews and rating', url: 'https://itviec.com/companies/naver-vietnam/review' },
      { title: 'ITviec — NAVER VIETNAM Java/Spring openings', url: 'https://itviec.com/nha-tuyen-dung/naver-vietnam' }
    ],
    confidence: 'medium'
  },
  {
    id: 'rakuten-fintech-vietnam',
    name: 'Rakuten Fintech Vietnam',
    type: 'fintech',
    icon: '💳',
    summary: 'Đơn vị phát triển phần mềm cho các dịch vụ fintech của tập đoàn Rakuten (Nhật Bản). ITviec có tin tuyển Java; chưa có nguồn phỏng vấn Java tại Việt Nam đủ cụ thể, nên phần dưới chỉ là mẫu thường gặp ở công ty fintech: Java/Spring, giao dịch, bảo mật dữ liệu.',
    stack: ['Java', 'Spring', 'Fintech', 'SQL'],
    process: [{ round: 'Quy trình chưa được xác minh', detail: 'Các trang công khai đã tìm được không mô tả nhất quán interview rounds cho Java. Xác nhận với recruiter trước khi chuẩn bị theo format cụ thể.' }],
    focus: ['core', 'spring', 'db', 'security', 'microservices', 'scenario'],
    algoWeight: 0.3,
    englishRequired: true,
    questions: ['Bạn bảo vệ dữ liệu thẻ và thông tin nhạy cảm trong backend service thế nào?', 'Thiết kế xử lý thanh toán chống duplicate khi gateway gửi lại callback ra sao?'],
    tips: ['Ôn Java/Spring và thiết kế giao dịch tài chính; các câu hỏi trên là bài luyện domain, không phải câu được xác nhận từ review.', 'Đánh giá ITviec phản ánh nhân viên, không đo trải nghiệm phỏng vấn.'],
    sources: [
      { title: 'ITviec — Rakuten Fintech Vietnam rating and company profile', url: 'https://itviec.com/companies/rakuten-fintech-vietnam-co-ltd' },
      { title: 'ITviec — Rakuten Fintech Vietnam reviews', url: 'https://itviec.com/companies/rakuten-fintech-vietnam-co-ltd/review' }
    ],
    confidence: 'low'
  }
];
