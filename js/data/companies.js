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
    pay: [
      { role: 'Senior Backend (Java)', yoe: '4–6 năm', amount: 'lương cao, không rõ số (không rõ gross/net)', year: '2025', note: 'chia sẻ voz, không có con số cụ thể', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-816#post-35934382' }
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
      'Nói rõ suy nghĩ khi code — người chia sẻ cho biết điều này được cộng điểm.',
      'Review ZaloPay 2023 (voz #48, sản phẩm trong hệ sinh thái VNG) có vòng behavior nhẹ nhàng về lý do đổi việc và định hướng; đây là tham chiếu gián tiếp, không thay cho quy trình team Zalo.'
    ],
    sources: [
      { title: 'Viblo — Từ cú trượt Caladan đến offer mid-level tại Zalo', url: 'https://viblo.asia/p/tu-cu-truot-caladan-den-offer-mid-level-tai-zalo-1QLxnya04Aw' },
      { title: 'voz.vn — [Review Phỏng Vấn] Các công ty CNTT, trang 7 (Zalo Senior SE, 2021)', url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-7' },
      { title: 'voz.vn — Review phỏng vấn ZaloPay/VNG, vòng behavior (10/2023, voz #48)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-34#post-34282956' },
            { title: 'ITviec — VNG Corporation company page', url: 'https://itviec.com/companies/vng-corporation' }
    ],
    confidence: 'medium'
  },

  {
    id: 'shopee',
    name: 'Shopee (Vietnam engineering)',
    type: 'bigtech',
    icon: '🛒',
    summary: 'Một ứng viên Shopee VN cho biết quy trình ở Việt Nam không khác Singapore: nặng thuật toán và CS fundamentals. Review chi tiết chủ yếu từ 2021 (cũ); người trong cuộc nêu stack chính là Go (backend) và React/TypeScript, nên Java không phải lợi thế lớn. Một chia sẻ 2026 (voz #117) so sánh môi trường làm việc Shopee/TikTok (đa quốc gia, scale lớn, công cụ nội bộ) — đây là nhận xét trải nghiệm, không phải mô tả quy trình phỏng vấn.',
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
      { title: 'Glassdoor — Shopee Backend Engineer interview questions (đa văn phòng)', url: 'https://www.glassdoor.com/Interview/Shopee-Backend-Engineer-Interview-Questions-EI_IE1263091.0,6_KO7,23.htm' },
      { title: 'voz.vn — So sánh trải nghiệm TikTok/Shopee (7/2026, không phải review phỏng vấn)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-122#post-42849257' }
    ],
    confidence: 'low'
  },

  {
    id: 'grab-vietnam',
    name: 'Grab Vietnam',
    type: 'bigtech',
    icon: '🚗',
summary: 'Văn phòng kỹ sư tại TP.HCM thuộc Grab; backend chủ yếu viết bằng Go, nền tảng streaming dùng Kafka/Flink. Phỏng vấn theo chuẩn regional: online assessment, coding, system design, behavioral bằng tiếng Anh. Review 2022, 2025 (Glassdoor) và 2026 cho thấy quy trình 4 round tương đối ổn định, interviewer công nghiệp và có test case thực tế.',
    stack: ['Golang', 'Kafka', 'Flink', 'MySQL', 'Redis', 'AWS', 'Terraform', 'Kubernetes'],
    process: [
      { round: 'Vòng 0 — Online assessment (Codility)', detail: 'Review 2022: trắc nghiệm (có phần SQL) + 2–3 bài thuật toán mức medium. Review 2026 (SDET): screening 15–30 phút, TA giới thiệu project/team và quy trình, test tiếng Anh.' },
      { round: 'Vòng 1 — Technical coding (60 phút)', detail: '1–2 bài coding mức easy/medium và kiến thức ngôn ngữ; có ứng viên được hỏi thêm microservices, cache, database, logging/tracing/monitoring.' },
      { round: 'Vòng 2 — System design (tiếng Anh)', detail: 'Phỏng vấn với lead và thành viên team (có thể ở Singapore), bao quát schema, cache, authentication, các lựa chọn thiết kế và scale.' },
      { round: 'Vòng 3 — Hiring manager / culture fit (tiếng Anh)', detail: 'Có thể thêm một bài coding medium, câu hỏi REST, DNS, TCP/UDP và behavioral. Một review Senior SE TP.HCM (10/2025, Glassdoor) mô tả: CV screen → live coding medium + kinh nghiệm → system design → culture fit với engineering manager.' },
      { round: 'Vòng 1 (SDET, 2026) — Technical skill', detail: 'Live coding leetcode easy, round 2 là process (quy trình làm việc).' },
      { round: 'Vòng 3 (SDET, 2026) — Cultural fit', detail: 'Trao đổi bằng tiếng Anh.' }
    ],
    focus: ['design', 'microservices', 'db', 'concurrency', 'behavioral', 'english', 'testing'],
    algoWeight: 0.65,
    englishRequired: true,
    questions: [
      'Thiết kế service C đứng giữa service A (phát X message/giây) và service B (xử lý Y message/giây), rồi viết code xử lý.',
      'Làm sao đảm bảo dữ liệu nhất quán và mức isolation trong database ở dự án旧?',
      'Kiến thức về REST, DNS, TCP và UDP.',
      'Microservices: cache, database, logging, tracing, monitoring.',
      'Behavioral: vì sao đổi việc, bug lớn nhất bạn từng sửa, vấn đề khó nhất từng giải, điều bạn tự hào nhất.',
      'System design đầy đủ: schema, cache, authentication, scale.',
      'Testcase cho function login: happy case, negative case, edge case (review SDET 2026)?',
      'Tối ưu backpressure/queue khi producer nhanh hơn consumer (review 2022)?'
    ],
    tips: [
      'Luyện LeetCode medium trên nền tảng có giới hạn thời gian (Codility/HackerRank) và ôn SQL cho phần trắc nghiệm.',
      'Luyện system design bằng tiếng Anh, chú ý backpressure/queue khi producer nhanh hơn consumer.',
      'Chuẩn bị câu chuyện theo bộ giá trị 4H của Grab (Heart, Hunger, Honour, Humility) cho vòng behavioral.',
      'Backend chủ yếu là Go — thể hiện sẵn sàng học Go và nắm vững concurrency nói chung.',
      'Interviewer Grab rất công nghiệp: giới thiệu project/team/process đúng 3p, không bắt buộc introduce tên tuổi/chức vụ (review 2026).',
      'Review SDET 2026 (voz #100) ghi nhận vòng screening rất ngắn và tập trung: interviewer giới thiệu project/team/quy trình rồi chuyển sang test case và trao đổi tiếng Anh. Khi trả lời test case, nên hỏi phạm vi (chỉ username/password hay gồm SSO/SAML), phân nhóm rõ (happy/negative/edge) và nêu thêm hướng nghĩ nếu bị gợi ý, tránh tranh luận dài về cách phân loại.'
    ],
    sources: [
      { title: 'voz.vn — [Review Phỏng Vấn] Các công ty CNTT, trang 48 (Grab Backend middle, 4/2022)', url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-48' },
      { title: 'voz.vn — [Review Phỏng Vấn] Các công ty CNTT, trang 56 (Grab middle SE, 2022)', url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-56' },
      { title: 'Glassdoor — Grab interview questions in Vietnam', url: 'https://www.glassdoor.com/Interview/Grab-Vietnam-Interview-Questions-EI_IE958580.0,4_IL.5,12_IN251.htm' },
      { title: 'TechInterview.org — Grab interview guide (2026, tổng hợp chung)', url: 'https://www.techinterview.org/companies/grab-interview-guide/' },
      { title: 'voz.vn — Review Grab SDET (2/2026)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-88#post-40705655' },
      { title: 'voz.vn — Review Grab Software Engineer (3/2026)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-90#post-41112715' },
      { title: 'voz.vn — Review Grab SDET screening (2/2026)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-88#post-40705655' }
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
      { round: 'Vòng 4 — Peer/manager hoặc culture interview (tùy role)', detail: 'Một review ứng viên Fullstack tháng 4/2026 ghi nhận 3 vòng: technical với team leader, peer interview với engineering managers và culture interview có thành viên Australia. Ứng viên nhận xét quy trình nhanh, chuyên nghiệp, recruiter cập nhật đều và interviewer thân thiện nhưng đặt câu hỏi thử thách. Đây không phải xác nhận cho Java role.' },
      { round: 'Tham khảo voz — NAB Hà Nội Senior Java (2/2023)', detail: 'Review 2023 kể 3 bài Codility (chia để trị, đệ quy vét cạn; đạt khoảng 75% nhờ tối ưu sau), rồi phỏng vấn online gần 3 giờ với 2 interviewer: Java core/Java 8 + collections, Spring Security (luồng request, filter, Authentication header), Spring Boot (thứ tự ưu tiên application.yml), DB (index, isolation level), git conflict. Cuối buổi là HR call; đây là chia sẻ cá nhân, không phải quy trình cố định.' },
      { round: 'Tham khảo voz — NICV Medior Engineer (9/2024)', detail: 'Review 2024 mô tả Codility 3 câu mức medium (110 phút), technical với 2 Senior Engineer (Java core, microservices patterns, DB optimization, isolation levels, threading, Spring Boot, CI/CD, Kubernetes, AWS), phỏng vấn với team Úc (1 Engineering Manager, 1 Consultant: Java core, problem solving, culture fit) và live coding.' },
      { round: 'Tham khảo voz — NAB StarCamp (7/2025)', detail: 'Review 2025 kể Codility 2 câu easy + 1 câu medium-easy, bài test tiếng Anh nói chuyện với native speaker (giới thiệu bản thân, định hướng), rồi technical: OOP, database cơ bản, giải thuật đơn giản; chương trình có ghi nhận trường hợp bị on hold (khác reject, có thể được gọi lại).' }
    ],
    focus: ['jvm', 'concurrency', 'collections', 'spring', 'db', 'english', 'behavioral', 'microservices', 'devops', 'aws'],
    algoWeight: 0.5,
    englishRequired: true,
    questions: [
      'JVM memory model: heap, stack, metaspace; GC hoạt động thế nào?',
      'Concurrency và synchronization trong Java.',
      'Cấu trúc và cách chọn các Java Collections.',
      'Thiết kế API: đặt URL, xử lý và trả lỗi (exception handling).',
      'Database: ACID, lock, isolation level, index.',
      'Viết một REST API nhỏ bằng Spring MVC sao cho pass bộ test có sẵn (home assignment).',
      'Câu hỏi thực tế: giữ branch luôn cập nhật thế nào, refactor chưa xong mà đến ngày release thì xử lý ra sao?',
      'Giới thiệu bản thân, điểm mạnh/yếu, mục tiêu — bằng tiếng Anh.',
      'Java 8 và Collections: các cấu trúc thường dùng, cách chọn và đánh đổi (review NAB Hà Nội 2023, voz #15).',
      'Spring Security: một request HTTP đi qua filter chain như thế nào, header xác thực được chuyển thành đối tượng gì trong ứng dụng? (review NAB Hà Nội 2023, voz #15).',
      'Spring Boot đọc cấu hình application.yml theo thứ tự ưu tiên ra sao? (review NAB Hà Nội 2023, voz #15).',
      'Khi xảy ra git conflict, bạn xử lý thế nào? (review NAB Hà Nội 2023, voz #15).',
      'Microservices patterns, tối ưu database, isolation level, threading, CI/CD, Kubernetes, AWS ở mức vận dụng (review NICV Medior 2024, voz #42).',
      'Bài live coding để đánh giá code thực tế (review NICV Medior 2024, voz #42).',
      'StarCamp 2025: OOP và database cơ bản, một bài giải thuật đơn giản, nói chuyện tiếng Anh với native speaker về giới thiệu bản thân và định hướng (voz #81).',
      'Spring security: request HTTP chạy qua filter chain như thế nào, Authentication header được parse thành object gì (review NAB Hà Nội 2/2023)?',
      'Thứ tự loading của file application.yml trong Spring Boot (review NAB Hà Nội 2/2023)?',
      'Giải quyết conflict khi git (review NAB Hà Nội 2/2023)?',
      'Java 8 + collections: hỏi sâu theo danh sách chủ đề (review NAB Hà Nội 2/2023)?',
      'Medior Engineer (2024): microservices patterns, DB optimization, isolation levels, threading, Spring boot, CI/CD, K8s, AWS (review 9/2024)?',
      'Medior Engineer (2024): Java core cơ bản, problem solving, culture fit với team Úc (review 9/2024)?',
      'StarCamp (2025): OOP, database cơ bản, giải thuật đơn giản, nói tiếng Anh với native speaker (review 7/2025)?'
    ],
    tips: [
      'Ôn sâu JVM, GC, concurrency và Collections — đây là trọng tâm vòng kỹ thuật Java.',
      'Luyện viết Spring REST API nhanh trong IDE và chạy test trong giới hạn thời gian.',
      'Ôn transaction isolation, locking, indexing kèm ví dụ thực tế.',
      'Luyện tiếng Anh nói cho vòng recruiter và culture fit; tìm hiểu AWS vì trung tâm định hướng cloud.',
      'Khi trả lời, nên đặt câu hỏi vào bối cảnh dự án cụ thể và chủ động giải thích lựa chọn; một review 2023 cho biết thái độ trình bày mạch lạc giúp buổi phỏng vấn dài vẫn hiệu quả (voz #15).',
      'NAB có nhiều recruiter đăng tuyển ở nhiều nguồn: nếu hồ sơ bị bỏ lỡ, có thể ứng tuyển lại qua kênh/recruiter khác (kinh nghiệm ứng viên 2025, voz #73). Vào vòng culture fit có thể được lưu profile để duyệt team phù hợp; từ vòng technical trở về trước profile thường do HR giữ (voz #73).',
      'Với StarCamp, trường hợp bị on hold khác với bị từ chối và có thể được gọi lại; chuẩn bị tinh thần chờ phản hồi (review 2025, voz #81).'
    ],
    sources: [
      { title: 'voz.vn — [Review Phỏng Vấn] Các công ty CNTT, trang 41 (NAB Senior Java Developer, 3/2022)', url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-41' },
      { title: 'voz.vn — Xin review dev tại NAB (2022)', url: 'https://voz.vn/t/xin-review-dev-tai-nab.543106/' },
      { title: 'voz.vn — Java Technical Interview NAB StarCamp (2024)', url: 'https://voz.vn/t/java-technial-interview-nab-starcamp.1034064/' },
      { title: 'voz.vn — Review NAB Hà Nội, Senior Java Developer (2/2023)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-7#post-23679302' },
      { title: 'voz.vn — Review NICV Medior Engineer (9/2024)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-32#post-34051405' },
      { title: 'voz.vn — Review NAB StarCamp (7/2025)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-67#post-37818878' },
      { title: 'voz.vn — Góp ý apply NAB mid/sen (4/2025)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-59#post-36680021' },
      { title: 'Note8 — NAB Innovation Centre Vietnam interview reviews (2026)', url: 'https://note8.vn/phong-van-dn/nab-innovation-centre-vietnam-399' },
      { title: 'voz.vn — NAB Hà Nội Senior Java Developer (2/2023)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-7#post-23679302' },
      { title: 'voz.vn — NICV Medior Engineer (9/2024)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-32#post-34051405' },
      { title: 'voz.vn — NAB StarCamp (7/2025)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-67#post-37818878' },
      { title: 'voz.vn — Kinh nghiệm apply NAB mid/sen (4/2025)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-59#post-36680021' },
      { title: 'ITviec — NAB Innovation Centre Vietnam company page', url: 'https://itviec.com/companies/nab-innovation-centre-vietnam' }
    ],
    confidence: 'high'
  },

  {
    id: 'axon',
    name: 'Axon (Vietnam)',
    type: 'product',
    icon: '📹',
    summary: 'Công ty sản phẩm Mỹ (body camera và cloud quản lý bằng chứng cho cảnh sát) có trung tâm kỹ sư tại TP.HCM; backend dùng Java, Scala, Go, .NET, Python. Review 2022–2026 cho thấy phỏng vấn kiểu product company: có thể có online assessment, coding, CS fundamentals, system design và culture fit; độ sâu khác theo role/level. Một review Senior SE 2026 (voz #105) mô tả 4 vòng với buổi onsite 4 giờ nhiều panel; interviewers được đánh giá chuyên môn tốt và HR phản hồi rõ. Chia sẻ cá nhân, cần xác nhận format hiện tại với recruiter.',
    stack: ['Java', 'Scala', 'Golang', '.NET', 'Python', 'ReactJS'],
    process: [
      { round: 'Vòng 0 — Recruiter screen', detail: 'Giới thiệu công ty/role, kiểm tra tiếng Anh qua vài câu behavioral (review 2022, 2025).' },
      { round: 'Vòng 1 — Online assessment hoặc screening kỹ thuật (tham khảo 2022, 2026)', detail: 'Review 2022: OA có trắc nghiệm + 3 bài thuật toán mức medium–hard, hoặc screening 1 giờ về kinh nghiệm, database/index và 1 bài coding easy/medium có mở rộng. Review Senior SE 2026 (voz #105): technical nhẹ với Engineering Manager, có live coding liên quan mutex/locking (không phải LeetCode) và hỏi sâu kinh nghiệm trong CV.' },
      { round: 'Vòng 2 — Technical nhiều panel (tham khảo 2022, 2025, 2026)', detail: 'Review 2022: 3–4 giờ chia phần CS fundamentals (cấu trúc dữ liệu, DB, OS, network, OOP/SOLID), coding trên bảng, SQL nhỏ, system design (high-level, schema, scale). Review 2025 (voz #67, #68): trao đổi với EM/manager về kinh nghiệm, CS fundamentals và coding có follow-up. Review Senior SE 2026 (voz #105): buổi 4 giờ gồm 4 panel — coding (thuật toán medium, nhiều edge case), CS/OS/ngôn ngữ mức thấp (thread model, GC, cách Java/Go chạy), system design mở (giải thích vì sao chọn A/B) và culture fit; phỏng vấn bằng tiếng Anh và tiếng Việt.' },
      { round: 'Vòng 3/4 — Culture fit hoặc trao đổi với quản lý dự kiến (tham khảo)', detail: 'Có thể gặp head/manager nước ngoài về kỳ vọng, lý do đổi việc, điểm mạnh/yếu, kế hoạch phát triển. Review Senior SE 2026 (voz #105) kể vòng cuối chủ yếu trao đổi/deal với quản lý dự kiến và cho biết sau vòng đó có offer letter; tổng thời gian từ vòng đầu đến có offer khoảng 2 tháng.' }
    ],
    focus: ['design', 'db', 'jvm', 'concurrency', 'core', 'english', 'behavioral', 'microservices', 'devops'],
    algoWeight: 0.65,
    englishRequired: true,
    questions: [
      'Thiết kế dịch vụ rút gọn link kiểu bit.ly: scale, tối ưu đọc/ghi, throughput database (review 2022).',
      'ACID và BASE; index và cách database hoạt động bên dưới; B-tree (review 2022).',
      'Stack và heap, Java GC, thread/process; thread model và cách runtime ngôn ngữ quản lý bộ nhớ (review 2022, 2026 voz #105).',
      'TCP/UDP, REST và gRPC, HTTP/HTTPS (review 2022).',
      'Bốn tính chất OOP, SOLID; tracing/logging/monitoring trong thực tế (review 2022, 2025).',
      'Bài coding trên bảng hoặc live coding có follow-up: mở rộng khi input quá lớn không vừa bộ nhớ, dữ liệu chưa sắp xếp, hoặc edge case (review 2022, 2025).',
      'Live coding về mutex/locking trong hệ thống throughput cao (review Senior SE 2026, voz #105).',
      'System design mở: nêu lựa chọn kiến trúc và giải thích vì sao chọn A thay vì B (review 2026, voz #105).',
      'Behavioral: kỳ vọng, lý do đổi việc, điểm mạnh/yếu, kế hoạch phát triển (review 2022, 2025).'
    ],
    tips: [
      'Luyện LeetCode medium–hard nếu role có OA; đồng thời chuẩn bị concurrency thực tế (mutex/locking) vì có review Senior gặp câu không phải LeetCode (voz #105).',
      'Ôn CS fundamentals rộng và sâu: cấu trúc dữ liệu, DB internals, OS, network, thread model, GC và cách runtime hoạt động.',
      'Luyện system design kinh điển và thói quen giải thích trade-off (vì sao chọn giải pháp A/B), kể cả khi input lớn hoặc dữ liệu chưa sắp xếp.',
      'Chuẩn bị behavioral bằng tiếng Anh và kể kỹ các dự án đã làm; nhiều review đánh giá interviewers thân thiện, sẵn sàng kéo dài trao đổi khi phù hợp (voz #67, #105).'
    ],
    sources: [
      { title: 'voz.vn — [Review Phỏng Vấn] Các công ty CNTT, trang 48 (Axon Software Engineer, 2022)', url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-48' },
      { title: 'voz.vn — [Review Phỏng Vấn] Các công ty CNTT, trang 56 (Axon middle SE, 2022)', url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-56' },
      { title: 'voz.vn — Review Axon (2/2025)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-46#post-35682791' },
      { title: 'voz.vn — Review Axon fresher interview (3/2025)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-46#post-35680327' },
      { title: 'voz.vn — Review Axon Senior Software Engineer (3/2026)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-91#post-41118587' },
      { title: 'ITviec — AXON company page', url: 'https://itviec.com/companies/axon' }
    ],
    confidence: 'high'
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
    summary: 'Tin tuyển Senior Java Engineer tại EPAM Vietnam yêu cầu Java, Spring Boot, JUnit, Git, Maven, design patterns và SOLID. Quy trình tuyển dụng chính thức thường gồm recruiter, technical, manager và client interview; vị trí cụ thể có thể thêm entry test. Review 2025–2026 (quốc tế và EPAM Anywhere) cho thấy EPAM phỏng vấn khá dễ để lụm lương, tập trung vào framework và ngôn ngữ, không cần fancy như leetcode hay system design quá căng thẳng; HR rất nhiệt tình support, phản hồi từng round khoảng 2 ngày và luôn cố deal lương sát expectation.',
    stack: ['Java', 'Spring Boot', 'JUnit', 'Maven', 'Microservices', 'SQL', 'AWS', 'Kafka'],
    process: [
      { round: 'Vòng 1 — Talent attraction', detail: 'Trao đổi với recruiter về kinh nghiệm, tiếng Anh và yêu cầu dự án.' },
      { round: 'Vòng 2 — Technical interview', detail: 'Đánh giá chuyên môn; một số vị trí yêu cầu entry test theo client/project. Các chia sẻ 2025 nêu Java core, Spring, SQL, Java streams và bài coding.' },
      { round: 'Vòng 3 — Hiring manager và client', detail: 'Quy trình chuẩn EPAM có trao đổi với manager rồi client/project interview; số vòng thực tế tùy vị trí.' },
      { round: 'Vòng 1 (EPAM Anywhere, 2022)', detail: 'Technical với 2 người (1 VN 1 Trung Quốc): hỏi lý thuyết nhiều (bind/apply/call, arrow function, scope binding, this, css/html, định nghĩa API tốt), live coding 1–2 câu dễ.' },
      { round: 'Vòng 2–3 (EPAM Anywhere, 2022)', detail: 'Technical manager hỏi định hướng, sau đó pv lại technical với kết quả round 1 chưa đạt expectation (1 người Ấn Độ, live coding siêu dễ), cuối cùng hiring manager (Belarus) không hỏi gì đánh đố.' },
      { round: 'Vòng 1–3 (Mid Software Engineer, 2026)', detail: 'HR giới thiệu công ty, test tiếng Anh và clarify CV. Technical 1:1 hỏi nội dung trong CV, dự án đã làm, Java core, Spring annotations, bean lifecycle, authn/authz, database isolation levels, transactions. Technical với 1 Lead + 1 Manager: thêm microservices, manager hỏi agile/scrum, assign task, tiêu chí dự án.' }
    ],
    focus: ['core', 'collections', 'spring', 'jpa', 'db', 'microservices', 'english', 'architecture', 'testing'],
    algoWeight: 0.35,
    englishRequired: true,
    questions: [
      'Giải thích lựa chọn thiết kế trong một dự án Java/Spring của bạn và trade-off vận hành.',
      'Giải bài coding rồi phân tích độ phức tạp thời gian và bộ nhớ.',
      'Khi nào dùng CompletableFuture thay vì Future; xử lý exception và timeout ra sao?',
      'Thiết kế giao dịch phân tán cho service Spring Boot tích hợp Kafka thế nào?',
      'Java core: bind/apply/call, arrow function, scope binding, this (review 2022)?',
      'Spring: annotations, bean lifecycle, DI/IoC, application.yml loading order (review 2026)?',
      'Database: isolation levels, transactions, indexing (review 2026)?',
      'Microservices: agile/scrum, assign task, cách chọn design pattern để refactor (review 2026)?'
    ],
    tips: [
      'Ôn Java core, collections, streams, concurrency, Spring Boot, SQL và unit testing; từng vòng có thể phụ thuộc client.',
      'Chuẩn bị kể sâu dự án và trao đổi bằng tiếng Anh với interviewer/client quốc tế.',
      'Hỏi trước về assessment, project stack và số vòng vì EPAM xác nhận quy trình có thể thêm bước theo dự án.',
      'EPAM phỏng vấn khá dễ để lụm lương: tập trung vào framework và ngôn ngữ, không cần leetcode hay system design quá căng thẳng (review 2022, 2026).',
      'HR rất nhiệt tình, phản hồi từng round khoảng 2 ngày, luôn cố deal lương sát expectation (review 2026).'
    ],
    sources: [
      { title: 'EPAM Careers — Senior Java Engineer, Vietnam vacancy and hiring process', url: 'https://careers.epam.com/en/vacancy/senior-java-engineer-blttpn84g6zmt6ll3c7_en' },
      { title: 'AmbitionBox — EPAM Software Engineer interview experiences, 2025', url: 'https://www.ambitionbox.com/interviews/epam-systems-interview-questions/software-engineer' },
      { title: 'Glassdoor — EPAM Senior Java Developer interview experience, 2025', url: 'https://www.glassdoor.ca/Interview/EPAM-Systems-Interview-RVW95534424.htm' },
      { title: 'voz.vn — Review EPAM Anywhere (2/2022)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-1#post-22638823' },
      { title: 'voz.vn — Review EPAM Mid Software Engineer (1/2026)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-85#post-40443979' }
    ],
    confidence: 'high'
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
    summary: 'Chi nhánh tại Việt Nam của tập đoàn công nghệ Hàn Quốc NAVER; có đăng tin tuyển Backend Engineer Java/Spring trên ITviec. Review phỏng vấn công khai 2022–2026 (frontend/backend) cho thấy quy trình thường có online assessment, technical và vòng culture/CEO, full tiếng Anh hoặc có phiên dịch; interviewers đánh giá cao về chuyên môn và HR phản hồi nhanh. Stack, ngôn ngữ và độ khó khác nhau theo team/role — phần dưới tổng hợp từ JD và chia sẻ cá nhân, cần xác nhận với recruiter.',
    stack: ['Java', 'Spring', 'Backend', 'Large-scale systems', 'Kubernetes', 'AWS'],
    process: [
      { round: 'Vòng 0 — Online assessment (tham khảo 2022–2026)', detail: 'Review frontend 2022 (voz #26) kể 3–5 bài DSA (4 easy, 1 medium) và khoảng 20 câu trắc nghiệm bám CV bằng tiếng Anh trên HackerRank, có thể tra cứu. Review backend 2025 (voz #103) kể 120 phút: 1 LeetCode medium (cài đặt cấu trúc dữ liệu), 1 bài SQL khó (nhiều join/subquery/aggregate) và 1 phần thực chiến Java.' },
      { round: 'Vòng 1 — Technical (tham khảo 2022–2026)', detail: 'Review frontend 2022: 2 buổi 60 phút (live coding cơ bản + kiến thức nền như React/Redux; buổi sau hỏi theo CV). Review Senior FE 2024 (voz #37): hỏi sâu JavaScript/React và có live coding nhẹ; có buổi với tech lead người Hàn qua phiên dịch, thảo luận lựa chọn kiến trúc (ví dụ micro frontend). Review backend 2025 (voz #103): 2 buổi cùng ngày với lead rồi manager, hỏi sâu theo CV đến cơ chế hệ điều hành/distributed systems, Java/Spring (annotation, IoC, bean), design patterns, SOLID, microservices, distributed locking.' },
      { round: 'Vòng 2 — CEO/CTO hoặc culture fit (tham khảo 2022–2026)', detail: 'Review backend 2025 (voz #103) là behavioral, có thể hỏi kỹ thuật liên quan. Review frontend 2022/2024 nhắc vòng culture fit/trao đổi với management về định hướng, giải quyết xung đột và team dự kiến. Mức offer có thể phụ thuộc kết quả phỏng vấn (review 2022).' }
    ],
    focus: ['core', 'jvm', 'spring', 'microservices', 'design', 'db', 'concurrency', 'english', 'behavioral', 'devops'],
    algoWeight: 0.5,
    englishRequired: true,
    questions: [
      'Thiết kế backend service chịu tải cao: bạn tìm bottleneck và xác định điểm scale như thế nào?',
      'Hãy giải thích một quyết định tối ưu hiệu năng Java có số đo trước và sau.',
      'Implement 1 cấu trúc dữ liệu (LeetCode Medium, review 2025)?',
      'Viết SQL phức tạp: nhiều join, subquery, aggregate (review 2025)?',
      'Thực chiến Java: câu hỏi về annotation, IOC, bean lifecycle trong Spring (review 2025)?',
      'SOLID, why microservices, distributed locking, microservices communication patterns (review 2025)?',
      'OS level mechanisms: thread model, GC, memory (review 2025–2026)?',
      'Fundamental distributed systems mechanisms (review 2025–2026)?',
      'Design patterns trong dự án (review 2025–2026)?',
      'Behavioral: resolve conflict, định hướng 3–4 năm, tại sao nghỉ công ty cũ (review 2025–2026)?',
      'Online assessment frontend 2022 (voz #26): DSA easy/medium và câu trắc nghiệm bám CV bằng tiếng Anh; có thể tra cứu trong lúc làm bài.',
      'Live coding nền tảng (voz #26, #37): kiểm tra tư duy lập trình cơ bản; với frontend có thể hỏi hành vi JavaScript/React, với backend có thể hỏi cài đặt cấu trúc dữ liệu hoặc API.',
      'Hỏi sâu theo CV và dự án: đóng góp, quyết định kỹ thuật, khó khăn và cách giải quyết (voz #26, #37, #103).',
      'Backend 2025 (voz #103): distributed locking, giao tiếp giữa microservices, networking/hệ điều hành và cơ chế hệ phân tán cơ bản.'
    ],
    tips: [
      'Ôn Java/Spring và system design dựa trên yêu cầu cụ thể của job description.',
      'Rating và recommend trên ITviec là đánh giá nơi làm việc, không đại diện cho ứng viên phỏng vấn.',
      'Chuẩn bị online assessment nghiêm túc (DSA, SQL, kiến thức theo CV) vì nhiều review xem đây là vòng sàng lọc quan trọng (voz #26, #103).',
      'Technical thường xác minh bạn thực sự hiểu những gì ghi trong CV: nói rõ vai trò, trade-off và giới hạn; đừng liệt kê công nghệ bạn không giải thích được (voz #37, #103).',

      'Technical chỉ mang tính verification: tự tin, không lóng ngóng là được (review 2024).',
      'Benefits rất ngon, culture, WLB tuyệt vời, đang expanding (review 2025).'
    ],
    sources: [
      { title: 'ITviec — NAVER VIETNAM reviews and rating', url: 'https://itviec.com/companies/naver-vietnam/review' },
      { title: 'ITviec — NAVER VIETNAM Java/Spring openings', url: 'https://itviec.com/nha-tuyen-dung/naver-vietnam' },
      { title: 'voz.vn — Review Naver Frontend Engineer (9/2022)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-12#post-25219976' },
      { title: 'voz.vn — Review Naver Senior Frontend Engineer (7/2024)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-27#post-32860002' },
      { title: 'voz.vn — Review Naver Frontend Engineer (9/2022)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-12#post-25219976' },
      { title: 'voz.vn — Review Naver Senior Frontend Engineer (7/2024)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-27#post-32860002' },
      { title: 'voz.vn — Review Naver Backend Software Engineer (2025)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-91#post-41113722' }
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
    tips: ['Ôn Java/Spring và thiết kế giao dịch tài chính; các câu hỏi trên là bài luyện domain, không phải câu được xác nhận từ review.', 'Đánh giá ITviec phản ánh nhân viên, không đo trải nghiệm phỏng vấn.', 'Lưu ý: digest voz 2023–2026 có review mang tên Rakuten (2022, 2023) nhưng có thể thuộc pháp nhân/vị trí khác (ví dụ Rakuten Nhật, role iOS) — không suy ra đây là quy trình của Rakuten Fintech Vietnam; xác nhận với recruiter.'],
    sources: [
      { title: 'ITviec — Rakuten Fintech Vietnam rating and company profile', url: 'https://itviec.com/companies/rakuten-fintech-vietnam-co-ltd' },
      { title: 'ITviec — Rakuten Fintech Vietnam reviews', url: 'https://itviec.com/companies/rakuten-fintech-vietnam-co-ltd/review' },
      { title: 'voz.vn — Review Rakuten (2/2022, có thể là pháp nhân/vị trí khác)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-2#post-22789323' },
      { title: 'voz.vn — Review Rakuten coding interview (3/2023, có thể là pháp nhân/vị trí khác)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-9#post-23825116' }
    ],
    confidence: 'low'
  }
,
  {
    id: 'ninja-van',
    name: 'Ninja Van',
    type: 'product',
    icon: '📦',
    summary: 'Công ty logistics/công nghệ giao vận hoạt động tại nhiều thị trường Đông Nam Á. Một review backend 2022 (voz #2) mô tả quy trình 3 vòng: bài thuật toán online, technical với thuật toán + system design + kiến thức CS, rồi vòng refactor/optimize với CTO. Reviewer cho biết vị trí senior kỳ vọng nền tảng microservices/system design và quen nhiều công cụ; đây là chia sẻ cá nhân từ 2022, cần xác nhận stack và level hiện tại với recruiter.',
    stack: ['Java', 'Golang', 'JavaScript', 'Microservices', 'Kafka', 'Docker', 'Kubernetes', 'RabbitMQ', 'Elasticsearch'],
    process: [
      { round: 'Vòng 1 — Liên hệ HR và bài test thuật toán (review 2022, voz #2)', detail: 'HR hỏi sơ về kinh nghiệm trong CV rồi gửi bài test online gồm 3 câu thuật toán (HackerRank).' },
      { round: 'Vòng 2 — Thuật toán, system design và kiến thức CS (review 2022, voz #2)', detail: 'Phỏng vấn online với 1 lead và 1 senior. Có câu thuật toán (review kể Next Permutation, mức medium; có thể chấp nhận hướng brute force nếu trao đổi tốt), bài system design (ví dụ feature flags bật/tắt theo tập người dùng: thiết kế DB, chọn SQL/NoSQL, tối ưu hiệu năng) và câu hỏi CS như isolation level, threading, microservices, Docker, Kubernetes, Kafka.' },
      { round: 'Vòng 3 — Refactor code và CS với CTO (review 2022, voz #2)', detail: 'CTO (người nước ngoài) đưa đoạn code và yêu cầu refactor/optimize theo kiểu pair, sau đó hỏi DB indexing, networking, microservices (RPC vs message queue). Reviewer nhận xét vòng này thân thiện và không quá sâu như vòng trước.' }
    ],
    focus: ['design', 'microservices', 'db', 'concurrency', 'devops', 'core', 'architecture'],
    algoWeight: 0.45,
    englishRequired: true,
    questions: [
      'Giải bài thuật toán (ví dụ Next Permutation): trình bày cách brute force, phân tích rồi tối ưu nếu có thể (review 2022, voz #2).',
      'Thiết kế Feature Flags cho phép bật/tắt tính năng trên một tập người dùng: mô hình dữ liệu, chọn SQL hay NoSQL, cách tối ưu hiệu năng khi kiểm tra flag (review 2022, voz #2).',
      'Isolation level trong database là gì, chọn mức nào cho bài toán nào? (review 2022, voz #2).',
      'Threading/concurrency cơ bản và các vấn đề thường gặp (review 2022, voz #2).',
      'Microservices: khi nào dùng RPC, khi nào dùng message queue? (review 2022, voz #2).',
      'DB indexing và networking cơ bản (review 2022, voz #2).',
      'Cho một đoạn code: bạn refactor và tối ưu theo hướng nào, vì sao? (review 2022, voz #2).'
    ],
    tips: [
      'Luyện thuật toán medium và tập giao tiếp cách giải (kể cả khi chưa ra đáp án tối ưu), vì reviewer 2022 cho biết interviewer đánh giá cách trao đổi/cùng code.',
      'Ôn system design có trọng tâm dữ liệu và hiệu năng (feature flag, cấu hình theo user segment), chuẩn bị lý do chọn SQL/NoSQL.',
      'Ôn microservices và hạ tầng ở mức sử dụng: Docker, Kubernetes, Kafka/RabbitMQ, Elasticsearch; review 2022 cho biết senior được kỳ vọng biết rộng về công cụ/ngôn ngữ.',
      'Luyện refactor đoạn code: đặt tên, tách trách nhiệm, xử lý lỗi, độ phức tạp và testability; vòng CTO có thể theo kiểu pair.'
    ],
    sources: [
      { title: 'voz.vn — Review Ninja Van backend (2022)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-1#post-22629633' }
    ],
    confidence: 'low'
  },
  {
    id: 'thoughtworks',
    name: 'Thoughtworks',
    type: 'service',
    icon: '🧠',
    summary: 'Công ty tư vấn/phát triển phần mềm toàn cầu, nổi bật với engineering practices (pair programming, TDD, CI/CD, kiến trúc tiến hóa). Review voz 2025 (Graduate/Associate, #85, #107) mô tả quy trình có HackerRank, nói chuyện với HR, pair programming trên codebase/API có sẵn, câu hỏi CS fundamentals và cultural alignment; không tập trung LeetCode ở các vòng sau OA. Ngôn ngữ/stack có thể linh hoạt theo vị trí.',
    stack: ['Java', '.NET', 'JavaScript', 'TDD', 'Pair Programming', 'CI/CD', 'Microservices', 'REST API'],
    process: [
      { round: 'Vòng 1 — HackerRank/OA (review 2025, voz #85, #107)', detail: 'Review Graduate 2025 (voz #85) kể 4 bài, có 1 easy và 1 medium; review Associate 2025 (voz #107) kể 2 câu medium.' },
      { round: 'Vòng 2 — Trao đổi với HR (review 2025, voz #85, #107)', detail: 'Hỏi hiểu biết về công ty, định hướng nghề nghiệp, mức lương mong muốn và kiểm tra tiếng Anh.' },
      { round: 'Vòng 3/4 — Pair programming và technical (review 2025, voz #85, #107)', detail: 'Graduate 2025 (voz #85): nửa buổi pair programming bằng ngôn ngữ ứng viên chọn, nửa buổi hỏi technical theo CV (có thể hỏi rộng về NoSQL, Redis, microservices, .NET). Associate 2025 (voz #107): pair programming trên codebase có sẵn, viết API và business logic; đánh giá khả năng xử lý edge case và lý do chọn cách viết, sau đó hỏi CS fundamentals nhẹ (DSA/DB).' },
      { round: 'Vòng 5 — Cultural alignment (review 2025, voz #85, #107)', detail: 'Review 2025 mô tả chọn ngẫu nhiên 2–3 câu/thẻ từ bộ câu hỏi (khoảng 20) để trả lời về giá trị, cách làm việc và tình huống.' }
    ],
    focus: ['core', 'design', 'architecture', 'microservices', 'db', 'testing', 'english', 'behavioral'],
    algoWeight: 0.35,
    englishRequired: true,
    questions: [
      'Pair programming: viết API/business logic trên codebase có sẵn; giải thích vì sao chọn cách cài đặt và xử lý edge case ra sao (review 2025, voz #107).',
      'CS fundamentals nhẹ sau pair programming: cấu trúc dữ liệu/giải thuật cơ bản và database (review 2025, voz #107).',
      'Câu hỏi theo CV: NoSQL, Redis, microservices hoặc stack bạn đã dùng (review 2025, voz #85).',
      'Cultural alignment: trả lời tình huống/giá trị được chọn ngẫu nhiên từ bộ câu hỏi; cần thể hiện cách suy nghĩ và hợp tác (review 2025, voz #85, #107).'
    ],
    tips: [
      'Luyện pair programming: nói to suy nghĩ, viết code nhỏ chạy được, thêm test/edge case, và sẵn sàng giải thích trade-off; reviewer 2025 nhấn mạnh họ đánh giá cách bạn cân nhắc edge case và lý do chọn giải pháp.',
      'Ôn CS fundamentals và dự án trong CV thay vì chỉ luyện pattern LeetCode, vì các vòng sau OA thiên về thực hành và hiểu biết (voz #107).',
      'Chuẩn bị tiếng Anh và câu chuyện về hợp tác, phản hồi, học hỏi; cultural alignment có thể là yếu tố quyết định (voz #85).',
      'Tìm hiểu engineering practices của Thoughtworks (TDD, refactoring, CI/CD, evolutionary architecture) để trả lời sát văn hóa công ty.'
    ],
    sources: [
      { title: 'voz.vn — Review Thoughtworks Graduate Software Developer (9/2025)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-75#post-38713082' },
      { title: 'voz.vn — Review Thoughtworks Associate Software Developer (3/2026)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-96#post-41305363' }
    ],
    confidence: 'medium'
  },
  {
    id: 'sap',
    name: 'SAP',
    type: 'product',
    icon: '🧩',
    summary: 'Tập đoàn phần mềm doanh nghiệp toàn cầu (ERP, cloud, dữ liệu). Hai review voz 2024 (#51, #53, cùng bối cảnh chia sẻ cá nhân) mô tả quy trình nhiều vòng với HR và các Engineering Manager ở nhiều khu vực (China/India/Canada), thiên về background, cách xử lý tình huống và giới thiệu team/công việc; mức độ technical sâu có thể tập trung ở vòng đầu. Quy trình thực tế thay đổi theo team/vị trí.',
    stack: ['Java', 'Cloud', 'Enterprise Software', 'Microservices', 'SQL'],
    process: [
      { round: 'Vòng 0 — Trao đổi với HR/TA (review 2024, voz #51, #53)', detail: 'Trao đổi thông tin cơ bản, background và kỳ vọng.' },
      { round: 'Vòng 1 — Engineering Manager (technical/background) (review 2024, voz #53)', detail: 'Một review 2024 kể vòng với Engineering Manager (China office) kiểm tra technical và background, trao đổi việc phải làm cho vị trí; đây là vòng technical sâu hơn trong chuỗi.' },
      { round: 'Vòng 2/3 — Trao đổi với Engineering Manager các khu vực (review 2024, voz #53)', detail: 'Review 2024 kể thêm các vòng với Engineering Manager (India/Canada office) để giới thiệu team/công việc hằng ngày và đánh giá cách xử lý tình huống; không khí trao đổi vui vẻ.' },
      { round: 'Ghi chú từ review 2024 (voz #51)', detail: 'Một chia sẻ khác nhận xét quy trình SAP dài nhưng được hỗ trợ tốt; cũng lưu ý cùng vị trí/tổ chức có thể có biến thể (ví dụ vòng system design có/không tùy case). Hãy hỏi recruiter cấu trúc vòng hiện tại.' }
    ],
    focus: ['english', 'behavioral', 'scenario', 'design', 'core'],
    algoWeight: 0.2,
    englishRequired: true,
    questions: [
      'Giới thiệu kinh nghiệm, dự án đã làm và vai trò của bạn trong team (review 2024, voz #51, #53).',
      'Bạn xử lý tình huống kỹ thuật/cộng tác như thế nào (review 2024, voz #53 mô tả các vòng sau thiên về tình huống)?',
      'Bạn hiểu gì về công việc hằng ngày của team/vị trí này, và bạn mong đợi đóng góp ra sao? (review 2024, voz #53).',
      'Câu hỏi technical/background tùy role, có thể tập trung ở vòng Engineering Manager đầu (review 2024, voz #53).'
    ],
    tips: [
      'Chuẩn bị kể dự án và tình huống làm việc rõ ràng bằng tiếng Anh; review 2024 cho thấy nhiều vòng là trao đổi với manager ở các khu vực.',
      'Hỏi recruiter trước: số vòng, có coding/system design hay không, manager/team nào tham gia, vì trải nghiệm voz 2024 cho thấy có biến thể.',
      'Chuẩn bị câu hỏi ngược về team, cách phối hợp đa khu vực, kỳ vọng 3–6 tháng đầu và tiêu chí đánh giá.'
    ],
    sources: [
      { title: 'voz.vn — Chia sẻ phỏng vấn ShopBack/SAP (2024)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-35#post-34416208' },
      { title: 'voz.vn — Review SAP process (11/2024)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-36#post-34521359' }
    ],
    confidence: 'low'
  },
  {
    id: 'samsung-rd-vietnam',
    name: 'Samsung R&D Vietnam',
    type: 'bigtech',
    icon: '📱',
    summary: 'Trung tâm nghiên cứu và phát triển của Samsung tại Việt Nam, tuyển nhiều vị trí phần mềm/firmware/AI theo mùa. Một review Fresh Staff Backend 2025 (voz #74) mô tả vòng thi lập trình (đọc đề kỹ, không nhất thiết cần thuật toán phức tạp) và vòng phỏng vấn nhóm hỏi dự án, OOP, SQL/Redis, công cụ (Postman, Git) và định hướng. Dữ liệu chỉ từ góc nhìn fresher một bài, level cao hơn có thể khác.',
    stack: ['Java', 'Backend', 'SQL', 'Redis', 'Git', 'REST API'],
    process: [
      { round: 'Vòng 1 — Thi lập trình (review 2025, voz #74)', detail: 'Review 2025 (vị trí Fresh Staff Backend) kể thi 1 ngày, mỗi buổi 1 bài, đề dài 1–2 trang. Ứng viên nhận xét cần đọc kỹ đề; pass một trong hai bài có thể được vào phỏng vấn.' },
      { round: 'Vòng 2 — Phỏng vấn nhóm (review 2025, voz #74)', detail: 'Khoảng 5 interviewer phỏng vấn vài ứng viên trong khoảng 1 giờ. Ứng viên giới thiệu bằng tiếng Anh, sau đó hỏi về dự án/công nghệ/case xử lý, công việc cũ, lý do nghỉ, công cụ và định hướng; không khí được mô tả thoải mái.' }
    ],
    focus: ['core', 'db', 'english', 'behavioral'],
    algoWeight: 0.35,
    englishRequired: true,
    questions: [
      'Giới thiệu bản thân bằng tiếng Anh (học vấn, sở thích, định hướng) (review 2025, voz #74).',
      'OOP: khác nhau giữa abstract class và interface, khi nào dùng? (review 2025, voz #74).',
      'SQL và Redis: khác biệt, dùng Redis để cache dữ liệu gì, xử lý cache miss ra sao? (review 2025, voz #74).',
      'Công cụ: Postman dùng để làm gì, chạy nhiều test thế nào; Git/GitHub dùng để cộng tác ra sao? (review 2025, voz #74).',
      'Hỏi theo dự án/CV: công nghệ đã dùng, case có thể xảy ra và hướng giải quyết (review 2025, voz #74).',
      'Câu hỏi định hướng: vị trí mong muốn, lý do chọn backend/frontend, mục tiêu vài năm tới (review 2025, voz #74).'
    ],
    tips: [
      'Khi thi lập trình, đọc đề thật kỹ trước khi chọn hướng giải; review 2025 cho biết có thí sinh bị overthinking dù đề không bắt buộc thuật toán phức tạp.',
      'Chỉ ghi công nghệ/công cụ bạn thực sự hiểu vào CV; vòng phỏng vấn có thể hỏi sâu vào từng mục bạn liệt kê (voz #74).',
      'Chuẩn bị giới thiệu ngắn bằng tiếng Anh và câu chuyện dự án theo cấu trúc: làm gì, dùng công nghệ gì, gặp vấn đề gì, xử lý ra sao.',
      'Ôn lại OOP, SQL cơ bản, cache (Redis) và cách làm việc nhóm với Git; nếu không chắc câu trả lời, nên nói rõ phần mình biết và phần cần kiểm tra.'
    ],
    sources: [
      { title: 'voz.vn — Review Samsung R&D Vietnam Fresh Staff Backend (5/2025)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-61#post-37003768' }
    ],
    confidence: 'low'
  },
  {
    id: 'optimizely',
    name: 'Optimizely',
    type: 'product',
    icon: '🧪',
    summary: 'Công ty sản phẩm quốc tế (trải nghiệm số, A/B testing, CMS/commerce) có đội ngũ kỹ sư tại Việt Nam. Một review Senior .NET Engineer 2024 (voz #65) mô tả bài test trên coderpad.io và buổi phỏng vấn offline dài (khoảng 2,5 giờ) với 3 người: làm quen/tính cách, kiểm tra tiếng Anh, hỏi kỹ thuật theo dự án trong CV, cách review code và xử lý tình huống trong team. Dữ liệu từ role .NET, cần xác nhận với JD Java nếu ứng tuyển backend Java.',
    stack: ['.NET', 'C#', 'Backend', 'Testing', 'Code Review'],
    process: [
      { round: 'Vòng 1 — Bài test (review 2024, voz #65)', detail: 'Review Senior .NET Engineer 2024 kể làm bài test trên coderpad.io.' },
      { round: 'Vòng 2 — Phỏng vấn onsite dài (review 2024, voz #65)', detail: 'Buổi khoảng 2,5 giờ với 3 interviewer: trao đổi làm quen/tính cách, kiểm tra tiếng Anh, hỏi kỹ thuật về các dự án trong CV, cách review code và xử lý một số tình huống trong team; không khí được mô tả vui vẻ.' }
    ],
    focus: ['core', 'design', 'testing', 'behavioral', 'english', 'architecture'],
    algoWeight: 0.3,
    englishRequired: true,
    questions: [
      'Đi sâu vào từng dự án trong CV: bạn làm gì, thiết kế ra sao, quyết định kỹ thuật và kết quả (review 2024, voz #65).',
      'Bạn review code như thế nào? Khi phát hiện vấn đề về thiết kế/chất lượng, bạn phản hồi ra sao? (review 2024, voz #65).',
      'Xử lý tình huống trong team: bất đồng kỹ thuật, ưu tiên công việc, phối hợp khi có rủi ro (review 2024, voz #65).',
      'Câu hỏi coding/technical test trên coderpad.io (review 2024, voz #65).',
      'Trao đổi bằng tiếng Anh trong buổi phỏng vấn (review 2024, voz #65).'
    ],
    tips: [
      'Chuẩn bị kể chi tiết mọi dự án bạn ghi trong CV; review 2024 cho biết interviewers hỏi tất cả những gì có trong CV.',
      'Luyện giải thích cách review code và đưa feedback mang tính xây dựng; đây là tín hiệu quan trọng cho level senior.',
      'Chuẩn bị ví dụ tình huống teamwork (xung đột, chất lượng, deadline) theo cấu trúc bối cảnh → hành động → kết quả.',
      'Luyện coding trên môi trường online editor (coderpad) và nói rõ cách bạn kiểm tra kết quả.'
    ],
    sources: [
      { title: 'voz.vn — Review Optimizely Senior .NET Engineer (12/2024)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-44#post-35307511' }
    ],
    confidence: 'low'
  },
  {
    id: 'chotot',
    name: 'Chợ Tốt',
    type: 'product',
    icon: '🛍️',
    summary: 'Nền tảng rao vặt/trade-in thuộc Carousell Group tại Việt Nam, có đội ngũ kỹ thuật xây dựng sản phẩm marketplace. Review Backend Engineer 2024 (voz #52, JD Java/Golang/Python) mô tả 4 bước: online assessment, technical interview dài (CS foundation + backend knowledge), culture fit và gặp HR/team; ứng viên ở HCM có thể được mời ăn trưa từ vòng technical. Chia sẻ cá nhân, quy trình có thể đổi theo team.',
    stack: ['Java', 'Golang', 'Python', 'Microservices', 'Docker', 'CI/CD', 'SQL', 'Backend'],
    process: [
      { round: 'Vòng 1 — Online assessment (review 2024, voz #52)', detail: 'Bài trên HackerRank gồm 2 câu thuật toán và 1 câu SQL; reviewer 2024 đánh giá mức easy.' },
      { round: 'Vòng 2 — Technical interview (khoảng 1h45, review 2024, voz #52)', detail: 'Phỏng vấn với interviewer nước ngoài (expat). Câu hỏi trải dài CS foundation (hệ điều hành, mạng) và kiến thức backend (database, microservices, Docker, CI/CD). Reviewer 2024 cho biết ứng viên HCM có thể được mời ăn trưa từ vòng này.' },
      { round: 'Vòng 3 — Culture fit (review 2024, voz #52)', detail: 'Trao đổi với hiring manager về dự án đã làm, hỏi sâu công nghệ đã tiếp xúc và các câu hỏi behavior.' },
      { round: 'Vòng 4 — HR và gặp team (review 2024, voz #52)', detail: 'Phần 1 trao đổi với HR Director về benefit; phần 2 nói chuyện với đại diện team dự kiến join (BE/FE/PO) về behavior và sản phẩm (ví dụ đánh đổi release nhanh nhưng chưa ổn định hay chậm nhưng ổn định).' }
    ],
    focus: ['core', 'db', 'microservices', 'devops', 'design', 'behavioral', 'english'],
    algoWeight: 0.35,
    englishRequired: true,
    questions: [
      'CS foundation: hệ điều hành và mạng máy tính (review 2024, voz #52).',
      'Backend knowledge: database, microservices, Docker, CI/CD (review 2024, voz #52).',
      'Đi sâu vào dự án đã làm: bạn dùng công nghệ gì, giải quyết vấn đề gì, trade-off ra sao? (review 2024, voz #52).',
      'Behavior/sản phẩm: khi phải chọn giữa release nhanh nhưng tính năng chưa ổn định và release chậm nhưng ổn định, bạn quyết định thế nào? (review 2024, voz #52).',
      'Online assessment: thuật toán và SQL (review 2024, voz #52).'
    ],
    tips: [
      'Ôn đều CS nền (OS, network), backend (DB, microservices, container, CI/CD) và SQL/thuật toán cơ bản; review 2024 cho thấy technical interview hỏi khá rộng.',
      'Chuẩn bị trả lời behavior bằng ví dụ thực tế và có góc nhìn sản phẩm, vì vòng culture fit/gặp team có câu hỏi trade-off.',
      'Luyện giao tiếp tiếng Anh nếu vòng technical có interviewer nước ngoài (review 2024).',
      'Hỏi recruiter về ngôn ngữ chính của team (Java/Golang/Python) và format coding để ôn đúng stack.'
    ],
    sources: [
      { title: 'voz.vn — Review Chợ Tốt Backend Engineer (10/2024)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-35#post-34469141' },
      { title: 'Chợ Tốt Careers — Backend Software Engineer (Java/Go/NodeJS/Python)', url: 'https://careers.chotot.com/jobs/backend-software-engineer-go-nodejs-python/' }
    ],
    confidence: 'medium'
  },

  {
    id: 'shopback',
    name: 'ShopBack',
    type: 'fintech',
    icon: '💳',
    summary: 'Công ty sản phẩm tiền điện tử / cashback có mặt ở nhiều thị trường Đông Nam Á, bao gồm Việt Nam. Có hai review phỏng vấn Backend/Software Engineer chi tiết từ 2024 và cuối 2024, quy trình nhiều vòng và hoàn toàn bằng tiếng Anh. Stack side backend nhắc tới microservices và thiết kế hệ thống phân tán; Java không được nêu rõ là ngôn ngữ duy nhất nên ứng viên Java nên xác nhận ngôn ngữ phỏng vấn với recruiter.',
    stack: ['Java', 'Microservices', 'System Design', 'HackerRank', 'Tiếng Anh'],
    process: [
      { round: 'Vòng 0 — Initial chat với TA/HR (review 2024)', detail: 'Trao đổi típ về kinh nghiệm, mức lương mong muốn và thời gian onboard (ShopBack, review 11/2024).' },
      { round: 'Vòng 1 — Chat với Engineering Manager (review 2024)', detail: 'Kiểm tra background và xem ứng viên có hiểu rõ những gì đã làm hay không (ShopBack, review 11/2024).' },
      { round: 'Vòng 2 — Domain Knowledge Assessment (review 2024)', detail: 'Làm trên HackerRank, chỉ về system design, khá dễ nếu đã từng tự thiết kế và triển khai microservices (ShopBack, review 11/2024).' },
      { round: 'Vòng 3 — Technical Assessment / live coding (review 2024)', detail: 'Live coding 1 câu easy–medium trên HackerRank, code ngôn ngữ nào cũng được, sau làm xong có thêm điều kiện để tăng độ khó (ShopBack, review 11/2024).' },
      { round: 'Vòng 4 — Cultural & behavioral (review 2024)', detail: 'Câu hỏi về behavior để hiểu mindset của ứng viên (ShopBack, review 11/2024).' },
      { round: 'Vòng 5 — Nhận offer (review 2024)', detail: 'Họp với TA nhận offer, có thêm 5–10 phút với người vòng 4 để giải đáp khúc mắc (ShopBack, review 11/2024).' },
      { round: 'Quy trình Review 2024/2025 (review 12/2024–1/2025)', detail: 'Tất cả vòng phỏng vấn bằng tiếng Anh: HR call, chat với Engineering Manager về behavior, tech assessment live coding mức medium–hard, domain knowledge về system design, behavioral với Head of Engineering; vòng 3–5 cùng ngày và khá đuối (ShopBack, review 12/2024–1/2025).' }
    ],
    focus: ['design', 'microservices', 'english', 'behavioral', 'scenario'],
    algoWeight: 0.4,
    englishRequired: true,
    questions: [
      'Thiết kế hệ thống microservices và đưa ra trade-off của từng lựa chọn kiến trúc.',
      'Live coding một bài easy–medium, sau đó mở rộng độ khó theo yêu cầu của interviewer.',
      'Câu hỏi behavior về mindset, lý do đổi việc và định hướng nghề nghiệp (tiếng Anh).',
      'Domain knowledge về hệ thống thanh toán / ví điện tử: idempotency, nhất quán dữ liệu, xử lý giao dịch.'
    ],
    tips: [
      'Quy trình ShopBack nhiều vòng và hoàn toàn tiếng Anh, hãy luyện trình bày kỹ thuật bằng tiếng Anh trước.',
      'Ôn system design và thiết kế microservices vì đây là trọng tâm vòng domain knowledge.',
      'Luyện live coding mức easy–medium và sẵn sàng giải thích cách tối ưu khi interviewer tăng độ khó.',
      'Chuẩn bị câu chuyện behavior theo cấu trúc bối cảnh → hành động → kết quả cho vòng culture fit.'
    ],
    sources: [
      { title: 'voz.vn — Review phỏng vấn ShopBack (11/2024, 5 vòng)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-35#post-34416208' },
      { title: 'voz.vn — Review phỏng vấn ShopBack Software Engineer (12/2024–1/2025, toàn tiếng Anh)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-43#post-35289130' }
    ],
    confidence: 'medium'
  },

  {
    id: 'garena',
    name: 'Garena',
    type: 'bigtech',
    icon: '🎮',
    summary: 'Công ty game và công nghệ số lớn tại Việt Nam (Free Fire, Shopee thuộc cùng hệ sinh thái Sea trước đây). Có review vị trí Frontend Engineer năm 2022 quy trình 3 vòng, không phải review Backend/Java chi tiết nên chỉ coi là tham khảo quy trình chung; ứng viên Java backend nên xác nhận stack và vòng kỹ thuật với recruiter.',
    stack: ['JavaScript', 'React', 'CSS', 'Algorithm', 'Tiếng Anh'],
    process: [
      { round: 'Vòng 1 — HR call (review 2022)', detail: 'Nói chuyện với HR (Garena, review 2022).' },
      { round: 'Vòng 2 — Technical (review 2022)', detail: 'Dùng laptop mãi code CSS, JS, giải bài Two Sum và bài tìm người được giải thưởng, khá dễ; sau đó hỏi về Promise (Garena, review 2022).' },
      { round: 'Vòng 3 — Head of Country (review 2022)', detail: 'Nói chuyện về culture, lý do rời công ty cũ, yếu tố quan trọng khi chọn công ty mới (Garena, review 2022).' }
    ],
    focus: ['core', 'api', 'english', 'behavioral'],
    algoWeight: 0.25,
    englishRequired: false,
    questions: [
      'Giải bài Two Sum và bài tìm người được giải thưởng trong mảng.',
      'Promise trong JavaScript hoạt động như thế nào?',
      'Tại sao rời công ty cũ và yếu tố gì quan trọng khi chọn công ty mới?'
    ],
    tips: [
      'Review này là vị trí Frontend nên không phản ánh quy trình Backend/Java của Garena; hãy hỏi recruiter về stack và vòng kỹ thuật cụ thể.',
      'Luyện algorith cơ bản (Two Sum, mảng) và hiểu sâu Promise / event loop nếu apply vị trí liên quan JavaScript.',
      'Chuẩn bị trả lời lý do đổi việc và tiêu chí chọn công ty mới cho vòng với cấp lãnh đạo.'
    ],
    sources: [
      { title: 'voz.vn — Review Garena Frontend Engineer (2022)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-9#post-23826009' }
    ],
    confidence: 'low'
  },

  {
    id: 'one-mount-group',
    name: 'One Mount Group',
    type: 'product',
    icon: '🏦',
    summary: 'Tập đoàn công nghệ giáo dục trực tuyến có hệ sinh thái thanh toán và ngân hàng số. Có review vị trí Junior Backend (Golang) năm 2022, quy trình ngắn, không phải review Java chi tiết nên chỉ coi là tham khảo; ứng viên Java xác nhận ngôn ngữ và stack với recruiter.',
    stack: ['Golang', 'Backend', 'Algorithm', 'SQL'],
    process: [
      { round: 'Vòng 1 — HR call (review 2022)', detail: 'HR hỏi sơ về kinh nghiệm và nội dung CV (One Mount Group, review 2022).' },
      { round: 'Vòng 2 — Onsite với Team Lead (review 2022)', detail: 'Hỏi về những thứ đã biết và đã làm, giải thích công việc đã thực hiện; có hỏi tại sao dùng channel truyền data trong goroutine thay vì truyền trực tiếp, và một bài LeetCode tìm vị trí số trong mảng (One Mount Group, review 2022).' }
    ],
    focus: ['concurrency', 'core', 'db', 'scenario'],
    algoWeight: 0.25,
    englishRequired: false,
    questions: [
      'Tại sao dùng channel để truyền data trong goroutine thay vì truyền trực tiếp?',
      'Bài LeetCode tìm vị trí của một số cho trước trong mảng.',
      'Giải thích công việc đã làm và công nghệ đã sử dụng trong dự án.'
    ],
    tips: [
      'Review này là vị trí Golang Junior nên không phản ánh quy trình Java Senior của One Mount; xác nhận stack và vòng kỹ thuật với recruiter.',
      'Ôn kiến thức concurrency (goroutine, channel) và algorith mảng cơ bản.',
      'Chuẩn bị kể lại dự án đã làm và lý do chọn từng công nghệ.'
    ],
    sources: [
      { title: 'voz.vn — Review One Mount Group Junior Backend (2022)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-3#post-22790283' }
    ],
    confidence: 'low'
  },

  {
    id: 'viettel-tech-center',
    name: 'Viettel (Trung tâm công nghệ)',
    type: 'service',
    icon: '📶',
    summary: 'Trung tâm công nghệ của Viettel Telecom, tuyển nhiều vị trí kỹ thuật liên quan dữ liệu và hệ thống lớn. Có review vị trí Kỹ sư dữ liệu tháng 8/2025, quy trình 4 vòng, tập trung vào kiến trúc dữ liệu, Spark, lakehouse và hỏi sâu theo CV; đây là vị trí dữ liệu không phải Backend Java nên chỉ dùng làm tham khảo quy trình chung.',
    stack: ['Spark', 'SQL', 'Data Warehouse', 'Lakehouse', 'Tiếng Anh'],
    process: [
      { round: 'Vòng 1 — HR call qua Zalo (review 8/2025)', detail: 'HR nhắn qua Zalo, hỏi trường đại học, năm tốt nghiệp và thông tin cơ bản (Viettel Trung tâm công nghệ, review 8/2025).' },
      { round: 'Vòng 2 — Phỏng vấn với 3 anh (review 8/2025)', detail: 'Gặp phó giám đốc trung tâm và 2 dev, hỏi theo CV rồi đào sâu vào kiến trúc lakehouse medalion, luồng đẩy dữ liệu giữa các vùng, table format, optimize Spark job, xử lý data skew, versioning dữ liệu (Viettel Trung tâm công nghệ, review 8/2025).' },
      { round: 'Vòng 3 — Thi TOEIC, IQ và chuyên môn (review 8/2025)', detail: 'Trắc nghiệm 30 câu mức nhận biết (ETL, RDD là viết tắt của gì…), rất dễ (Viettel Trung tâm công nghệ, review 8/2025).' },
      { round: 'Vòng 4 — Giám đốc và phó tổng giám đốc (review 8/2025)', detail: 'Hỏi lại tổng quan CV, lý do nghỉ công ty cũ, mức lương; chủ yếu behavior, không đi sâu technical (Viettel Trung tâm công nghệ, review 8/2025).' }
    ],
    focus: ['db', 'sql', 'architecture', 'scenario', 'english', 'behavioral'],
    algoWeight: 0.1,
    englishRequired: false,
    questions: [
      'Tại sao dùng kiến trúc lakehouse medalion và luồng đẩy dữ liệu giữa các vùng như thế nào?',
      'Optimize Spark job và xử lý data skew ra sao?',
      'Table format dùng là gì và tại sao chọn format này thay vì format khác?',
      'Versioning dữ liệu trong hệ thống lớn xử lý như thế nào?'
    ],
    tips: [
      'Review này là vị trí Kỹ sư dữ liệu nên không phản ánh quy trình Backend Java của Viettel; xác nhận role và stack với recruiter.',
      'Ôn kiến trúc dữ liệu (lakehouse, medalion), Spark tối ưu, SQL và data skew nếu apply mảng dữ liệu.',
      'Chuẩn bị kể kỹ dự án trong CV vì vòng phỏng vấn hỏi sâu theo từng công nghệ đã ghi.'
    ],
    sources: [
      { title: 'voz.vn — Review Viettel Trung tâm công nghệ Kỹ sư dữ liệu (8/2025)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-78#post-39234999' }
    ],
    confidence: 'low'
  },

  {
    id: 'kms-healthcare',
    name: 'KMS Healthcare',
    type: 'service',
    icon: '🏥',
    summary: 'Đơn vị thuộc KMS Technology tập trung sản phẩm và dịch vụ kỹ thuật cho lĩnh vực y tế (healthcare) tại Việt Nam. Có review vị trí Senior DevOps Engineer năm 2026, quy trình 2 vòng toàn tiếng Anh (có chuyển sang tiếng Việt khi cần), tập trung CI/CD, Terraform, Azure/AWS và infrastructure; đây là vị trí DevOps không phải Backend Java nên chỉ dùng làm tham khảo quy trình chung.',
    stack: ['CI/CD', 'Terraform', 'Azure', 'AWS', 'Kubernetes', 'Tiếng Anh'],
    process: [
      { round: 'Vòng 1 — Technical (review 6/2026)', detail: 'Phỏng vấn online với 1 tech và 1 senior, hỏi dự án đang làm, architecture, công nghệ, input/output; sâu về CI/CD workflow, setup agent, phân chia role user, cấu trúc pipeline, Terraform repo/module/tfstate; Azure RBAC, IAM & roles, storage tier trong blob storage, virtual network, Gateway, Sentinel, Defenders; AWS S3, dựng VPC, private subnet, public subnet (KMS Healthcare, review 6/2026).' },
      { round: 'Vòng 2 — Culture fit + deal lương (review 6/2026)', detail: 'Phỏng vấn online với hiring manager, nửa đầu tiếng Anh về behavior (giải quyết conflict trong team, với manager, định hướng 3–4 năm tới), nửa cuối deal lương bằng tiếng Việt (KMS Healthcare, review 6/2026).' }
    ],
    focus: ['devops', 'aws', 'architecture', 'english', 'behavioral'],
    algoWeight: 0.05,
    englishRequired: true,
    questions: [
      'Thiết kế CI/CD pipeline: cấu trúc repo, module Terraform, quản lý tfstate và phân chia role user ra sao?',
      'Mô hình mạng trên Azure/AWS: VPC, private subnet, public subnet, Gateway hoạt động như thế nào?',
      'Lưu file trên S3 và storage tier trong Azure blob storage ra sao?',
      'Giải quyết conflict trong team và với manager, định hướng 3–4 năm tới.'
    ],
    tips: [
      'Review này là vị trí Senior DevOps nên không phản ánh quy trình Backend Java của KMS; xác nhận role và stack với recruiter.',
      'Ôn Terraform, CI/CD, Azure/AWS infrastructure và mạng nếu apply vị trí tương tự.',
      'Luyện trả lời behavior bằng tiếng Anh vì vòng phỏng vấn chính được tiến hành bằng tiếng Anh.'
    ],
    sources: [
      { title: 'voz.vn — Review KMS Healthcare Senior DevOps Engineer (6/2026)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-120#post-42622271' }
    ],
    confidence: 'low'
  },

  {
    id: 'aspire',
    name: 'Aspire',
    type: 'fintech',
    icon: '💳',
    summary: 'Công ty fintech gốc Singapore có team kỹ thuật tại Việt Nam. Có review vị trí Software Engineer Backend năm 2024, quy trình 3 vòng, nhưng nền tảng code test dùng Go phiên bản cũ (1.9) và không cho import thư viện ngoài fmt nên khó làm quen; chỉ coi là tham khảo quy trình chung, xác nhận stack Java với recruiter.',
    stack: ['Go', 'Algorithm', 'Tiếng Anh'],
    process: [
      { round: 'Vòng 1 — HR người Ấn (review 2024)', detail: 'Nói chuyện với HR, accent khá khó nghe (Aspire, review 2024).' },
      { round: 'Vòng 2 — Test tư duy (review 2024)', detail: 'Làm test HLC/HCL kiểm tra khả năng tư duy (Aspire, review 2024).' },
      { round: 'Vòng 3 — Online Assessment (review 2024)', detail: '2 bài (1 easy, 1 medium thiên về toán) trên platform khó dùng, dùng Go 1.9, không cho import thư viện ngoài fmt, đề bài viết kiểu tiếng Anh Ấn khó hiểu (Aspire, review 2024).' }
    ],
    focus: ['core', 'algorithm', 'english'],
    algoWeight: 0.5,
    englishRequired: true,
    questions: [
      'Bài toán dễ và medium thiên về toán trên Online Assessment.',
      'Khả năng tư duy và giải quyết vấn đề trên test HLC/HCL.'
    ],
    tips: [
      'Review này nêu nền tảng code dùng Go 1.9 hạn chế thư viện nên không phản ánh quy trình Java Backend của Aspire; xác nhận ngôn ngữ và stack với recruiter.',
      'Luyện algorith toán cơ bản và làm quen với giới hạn thư viện nếu vòng code dùng Go phiên bản cũ.',
      'Chuẩn bị nghe nói tiếng Anh vì vòng HR có accent Ấn khó nghe.'
    ],
    sources: [
      { title: 'voz.vn — Review Aspire Software Engineer Backend (2024)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-46#post-35680327' }
    ],
    confidence: 'low'
  },

  {
    id: 'tma-vietnam',
    name: 'TMA Solutions',
    type: 'service',
    icon: '🧩',
    summary: 'Công ty outsourcing phát triển phần mềm lớn tại Việt Nam. Có review vị trí outsource về mạng tháng 7/2021, quy trình 2 vòng, hỏi kiến thức cơ bản C/C++, Python, mạng, memory stack/heap và tiếng Anh; review cũ và không phải Backend Java nên chỉ dùng làm tham khảo quy trình chung.',
    stack: ['C/C++', 'Python', 'Mạng máy tính', 'Tiếng Anh'],
    process: [
      { round: 'Vòng 1 — Online với 2 lead (review 7/2021)', detail: 'Hỏi đủ thứ từ C căn bản (con trỏ, struct, enum), memory stack heap (calloc, malloc), thuật toán cơ bản (tìm giá trị cao nhất nhì ba của mảng), Python cơ bản (TMA, review 7/2021).' },
      { round: 'Vòng 2 — Online với 1 lead (review 7/2021)', detail: 'Hỏi lại kiến thức cơ bản, vài câu tiếng Anh giới thiệu bản thân và tại sao nghĩ công ty cũ, sau đó deal lương (TMA, review 7/2021).' }
    ],
    focus: ['core', 'english', 'behavioral'],
    algoWeight: 0.15,
    englishRequired: false,
    questions: [
      'C căn bản: con trỏ, struct, enum và memory stack/heap (calloc, malloc) hoạt động như thế nào?',
      'Thuật toán cơ bản: tìm giá trị cao nhất, nhì, ba của một mảng.',
      'Giới thiệu bản thân và lý do nghĩ công ty cũ bằng tiếng Anh.'
    ],
    tips: [
      'Review này năm 2021 và vị trí outsource mạng nên không phản ánh quy trình Backend Java hiện tại của TMA; xác nhận role và stack với recruiter.',
      'Ôn lại C/C++, Python cơ bản, memory management và algorith mảng nếu apply vị trí tương tự.',
      'Hỏi dò HR về range lương trước khi phỏng vấn để tránh waste time (kinh nghiệm review nhấn mạnh điều này).'
    ],
    sources: [
      { title: 'voz.vn — Review TMA outsource network (7/2021)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-3#post-22805194' }
    ],
    confidence: 'low'
  },

  {
    id: 'vmo-holdings',
    name: 'VMO Holdings',
    type: 'service',
    icon: '🤝',
    summary: 'Công ty outsourcing / dịch vụ kỹ thuật có trụ sở tại Việt Nam. Có review năm 2024 cho biết quy trình tương tự FPT (gửi online assessment rồi xử lý nhanh), nhưng có ghi nhận trường hợp BU lead không đồng ý sau khi qua vòng assessment nên ứng viên nên cẩn thận với rủi ro sau onboarding; dữ liệu chỉ từ một review ngắn nên confidence thấp.',
    stack: ['Backend', 'Online Assessment', 'Tiếng Anh'],
    process: [
      { round: 'Online assessment (review 2024)', detail: 'Gửi online assessment, hôm ngay sau lại quay xe với lý do BU lead không đồng ý (VMO Holdings, review 2024).' }
    ],
    focus: ['english', 'behavioral'],
    algoWeight: 0.2,
    englishRequired: false,
    questions: [
      'Chưa có câu hỏi kỹ thuật cụ thể được chia sẻ công khai (VMO Holdings, review 2024).'
    ],
    tips: [
      'Dữ liệu chỉ từ một review ngắn nên chỉ coi là tham khảo rất thô; xác nhận quy trình và trạng thái tuyển dụng với recruiter.',
      'Lưu ý rủi ro sau khi qua vòng assessment có thể bị hủy do cấp lead, hãy cân nhắc trước khi từ chối offer khác.'
    ],
    sources: [
      { title: 'voz.vn — Review VMO Holdings (2024)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-35#post-34416208' }
    ],
    confidence: 'low'
  }
];
