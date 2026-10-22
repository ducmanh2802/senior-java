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
    summary: 'Ngân hàng "cloud first": đã chuyển hệ thống Retail và Corporate Digital Banking từ on-premise lên AWS (EKS, Aurora MySQL, MSK/Kafka, ElastiCache, OpenSearch), hơn 8 triệu giao dịch/ngày theo case study AWS 2025. Các review phỏng vấn kỹ thuật công khai chủ yếu từ 2021–2022 nên quy trình có thể đã đổi.',
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
      'Tìm hiểu stack AWS (EKS, MSK/Kafka, Aurora) vì ngân hàng đã chuyển phần lớn hệ thống digital lên AWS.',
      'Lồng ghép yếu tố tuân thủ, bảo mật và quản trị rủi ro vào câu trả lời; chuẩn bị chứng chỉ tiếng Anh (TOEIC) vì từng được yêu cầu.'
    ],
    sources: [
      { title: 'voz.vn — [Review Phỏng Vấn] Các công ty CNTT, trang 78 (Techcombank Senior/Techlead Java, 2022)', url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-78' },
      { title: 'voz.vn — [Review công ty] CNTT bơi hết vào, trang 111 (Pass BE Techcombank, 2021)', url: 'https://voz.vn/t/review-cong-ty-cntt-boi-het-vao.34528/page-111' },
      { title: 'JobOKO — Kinh nghiệm phỏng vấn Techcombank 2026', url: 'https://vn.joboko.com/blog/phong-van-techcombank-nwi5737' },
      { title: 'AWS — Techcombank case study', url: 'https://aws.amazon.com/solutions/case-studies/techcombank-case-study/' },
      { title: 'ITviec — Techcombank company page', url: 'https://itviec.com/companies/techcombank' }
    ],
    confidence: 'medium'
  },

  {
    id: 'vpbank',
    name: 'VPBank',
    type: 'bank',
    icon: '🏦',
    summary: 'Core banking Temenos (dùng từ 2006) đã được container hóa trên Red Hat OpenShift trong private cloud on-premise, AWS hỗ trợ kiến trúc hybrid; đợt nâng cấp migrate hơn 18 triệu tài khoản. Hầu như không có review phỏng vấn công khai cho vị trí Java có kinh nghiệm, nên mục quy trình rất mỏng.',
    stack: ['Java', 'Spring Boot', 'Hibernate', 'MySQL', 'Oracle', 'Temenos core banking', 'Red Hat OpenShift', 'Kubernetes', 'AWS', 'GCP'],
    process: [
      { round: 'Chưa có dữ liệu tin cậy cho Senior Java', detail: 'Không tìm thấy review công khai mô tả vòng phỏng vấn kỹ thuật cho vị trí Java có kinh nghiệm. Hãy hỏi trực tiếp HR về số vòng và hình thức.' },
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
      'Đọc kỹ JD từng vị trí: các tin Senior Backend (Java) gần đây liệt kê Java, Spring Boot, Hibernate, MySQL, Oracle.',
      'Tìm hiểu bối cảnh core banking Temenos + OpenShift + hybrid AWS để trả lời câu hỏi về tích hợp và vận hành.',
      'Vì thiếu review công khai, hãy hỏi người quen nội bộ hoặc HR về format vòng kỹ thuật trước khi phỏng vấn.',
      'Chuẩn bị câu chuyện về làm việc với hệ thống legacy — một số người từng được offer cho biết có thể phải bảo trì công nghệ cũ.'
    ],
    sources: [
      { title: 'Temenos — VPBank success story', url: 'https://www.temenos.com/success-story/vpbank/' },
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
    summary: 'Trung tâm công nghệ của National Australia Bank tại TP.HCM và Hà Nội, tập trung cloud và microservices (AWS, Kubernetes, Kong, Java/Spring Boot, Node.js; gần đây tuyển thêm Golang và SRE GCP cho mảng Payments). Review Senior Java chi tiết nhất là từ 2022.',
    stack: ['Java', 'Spring Boot', 'Node.js', 'TypeScript', 'Golang', 'AWS (Lambda, ECS, S3, SNS/SQS, API Gateway)', 'PostgreSQL', 'Kubernetes', 'Kong', 'Terraform', 'Jenkins', 'GCP'],
    process: [
      { round: 'Vòng 1 — Recruiter call (tiếng Anh)', detail: 'Kiểm tra tiếng Anh và profile, sau đó gửi bài home assignment.' },
      { round: 'Vòng 2 — Home assignment trên Codility (70–80 phút)', detail: 'Review Senior Java (3/2022): 1 phần trắc nghiệm Java + 1 bài viết API nhỏ trên Spring MVC phải pass bộ test. Một review Java engineer khác (5/2022) kể có vòng live coding với 1 bài LeetCode hard.' },
      { round: 'Vòng 3 — Phỏng vấn kỹ thuật với Lead/Manager', detail: 'Hỏi rất sâu Java (JVM, memory, GC, concurrency, synchronization, collections), API design và database design. Có thể dùng tiếng Việt khi khó diễn đạt.' },
      { round: 'Vòng 4 — Culture fit / Engineering Manager và offer', detail: 'Với một số role có vòng culture fit với Engineering Manager (nhiều tiếng Anh), sau đó trao đổi offer.' }
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
      { title: 'ITviec — NAB Innovation Centre Vietnam company page', url: 'https://itviec.com/companies/nab-innovation-centre-vietnam' }
    ],
    confidence: 'medium'
  },

  {
    id: 'axon',
    name: 'Axon (Vietnam)',
    type: 'product',
    icon: '📹',
    summary: 'Công ty sản phẩm Mỹ (body camera và cloud quản lý bằng chứng cho cảnh sát) có trung tâm kỹ sư tại TP.HCM; backend dùng Java, Scala, Go, .NET, Python. Phỏng vấn kiểu product company: OA khó, vòng onsite dài nhiều phần. Review chi tiết từ 2022.',
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
  }
];
