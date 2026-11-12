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
      { round: 'Vòng 3 — Lãnh đạo khối (tùy vị trí)', detail: 'Bài JobOKO 2026 mô tả quy trình chung của ngân hàng: phỏng vấn cá nhân với hội đồng, sau đó một số vị trí gặp thêm lãnh đạo khối hoặc chuyên gia.' },
      { round: 'Hình thức test (tham khảo iMocha/ngân hàng 2024–2025)', detail: 'Techcombank dùng iMocha cho vòng screening (theo review 2022). Các ngân hàng tương tự 2024–2025 thường có: bài test 60–90 phút (Java core, Spring, SQL, OOP/design pattern, English), technical 1–2 vòng (live coding, system design microservices/database, deep-dive project), leadership/behavioral cho Senior/Lead. AWS/cloud knowledge là plus (case study AWS công khai). Hỏi recruiter team (digital/core/platform) vì stack khác nhau.' }
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
      { role: 'Backend (NodeJS, không phải Java)', yoe: '2 năm', amount: '23tr gross/tháng (deal được nhưng không nhận)', year: '2025', note: 'quy trình 4 vòng (tech NestJS, DB, lead, TA); có offer khác cao hơn', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-816#post-35934382' }
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
      { round: 'Tham khảo — Chương trình Talent IT 2024 (fresher)', detail: 'Ứng viên chọn 1 trong 3 đề thử thách, làm trong 72 giờ với tài khoản AWS được cấp, nộp tài liệu ý tưởng + slide + video demo; kèm bài test IQ và culture fit. Đây là chương trình fresher, không phải quy trình senior.' },
      { round: 'Hình thức test thường gặp (tham khảo JD và review ngân hàng 2024)', detail: 'JD Senior Backend 2024 nêu yêu cầu Java/Spring Boot, MS SQL/Oracle, microservices, CI/CD; các ngân hàng tương tự thường có bài test online (iMocha/Codility/HackerRank) về Java core, Spring, SQL và tiếng Anh trước vòng technical. Hỏi recruiter để xác nhận nền tảng và thời lượng.' }
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
    pay: [
      { role: 'Data Engineer (tham khảo, không phải backend Java)', yoe: '1 năm', amount: '20 (đơn vị trong bài ghi net)*15 ~ 300tr/năm (cách tính trong bài, không rõ gross/net chuẩn)', year: '2024', note: '14 ngày phép, 4 triệu tiền holiday, làm thứ 7 cách ngày tùy team', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1051#post-38215996' }
    ],
    sources: [
      { title: 'Temenos — VPBank success story', url: 'https://www.temenos.com/success-story/vpbank/' },
      { title: 'VPBank Careers — Senior Backend Developer (Java/Spring Boot)', url: 'https://tuyendung.vpbank.com.vn/job/Senior-Backend-Developer-%28JavaSpringboot%29-TA171/10696-vi_VN/' },
      { title: 'VPBank IT Careers — Java Developer and microservices roles, 2025', url: 'https://hr.vpbank.com.vn/ta/Tuyendung_IT/index.html' },
      { title: 'ITviec — VPBank company page', url: 'https://itviec.com/companies/vpbank' },
      { title: 'voz.vn — Thử thách tuyển dụng Talent IT của VPBank 2024', url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt-boi-het-vao.34528/page-111' },
      { title: 'voz.vn — Mong nhận góp ý Nashtech vs VPBank (2020)', url: 'https://voz.vn/t/mong-nhan-gop-y-nashtech-vs-vp-bank.171662/' },
      { title: 'voz.vn — Chia sẻ lương Data Engineer VPBank (2024)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1051#post-38215996' }
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
      { round: 'Vòng 2 — Phỏng vấn với cấp phó giám đốc', detail: 'Đào sâu hơn kiến thức cốt lõi và câu hỏi tình huống, ví dụ thiết kế hệ thống để người dùng không phải chờ khi lượng request tăng mạnh.' },
      { round: 'Hình thức test (tham khảo review 2024–2025)', detail: 'Review 2024–2025 cho thấy MB Bank thường không có bài test online riêng, mà trực tiếp technical interview. Vòng 1: 1–2 interviewer hỏi thuật toán (easy–medium), SQL, security, SOLID, microservices ~60 phút. Vòng 2: leadership/architecture discussion. Tiếng Anh không bắt buộc nhưng team có expat. Hỏi recruiter team (digital/core/data) và format cụ thể.' }
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
    pay: [
      { role: 'AI Engineer (tham khảo, không phải backend Java)', yoe: '2 năm', amount: '23tr gross/tháng', year: '2024', note: 'tháng 13, bonus 4–6 tháng tùy KPI (theo bài chia sẻ)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-932#post-36967197' },
      { role: 'DevOps (rejected, tham khảo)', yoe: '1 năm', amount: '23tr gross/tháng', year: '2022', note: 'offer bị từ chối; package năm theo bài chia sẻ khoảng 341tr', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-972#post-37474613' }
    ],
    sources: [
      { title: 'voz.vn — Xin quy trình phỏng vấn Dev tại MB Bank HN (2024)', url: 'https://voz.vn/t/xin-quy-trinh-phong-van-dev-tai-mb-bank-hn.986276/' },
      { title: 'voz.vn — Review môi trường làm việc MB Bank (trang 2–3, 2024–2025)', url: 'https://voz.vn/t/review-moi-truong-lam-viec-mb-bank.1026012/page-3' },
      { title: 'ITviec — MB Bank company page', url: 'https://itviec.com/companies/mb-bank' },
      { title: 'voz.vn — Chia sẻ lương AI Engineer MB Bank (2024)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-932#post-36967197' },
      { title: 'voz.vn — Chia sẻ offer DevOps MB Bank (2022, rejected)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-972#post-37474613' }
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
      { round: 'Vòng 3 — Tech Lead + Senior Engineer', detail: 'Tiếp tục hỏi CV, một câu system design nhỏ và các câu problem solving mở. Một ứng viên Java năm 2026 kể vòng technical online kéo dài khoảng 2 giờ.' },
      { round: 'Hình thức test (tham khảo review 2023–2026)', detail: 'MoMo thường không có bài test online riêng, mà straight to technical interview. Vòng 2: live coding 1 bài algorithm (medium, yêu cầu brute force → optimize) + deep-dive project ~90 phút. Vòng 3: system design (payment/ledger/idempotency) + behavioral + problem solving mở ~90–120 phút. Toàn tiếng Anh hoặc Việt/Anh lẫn nhau. Có review 2024–2026 phàn nàn phản hồi chậm. Hỏi recruiter team (core/wallet/lending/platform) vì domain khác nhau.' }
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
    pay: [
      { role: 'Machine Learning Engineer (tham khảo, không phải backend Java)', yoe: '3 năm', amount: '38tr gross/tháng', year: '2021', note: 'offer bị từ chối; bài chia sẻ nhắc BHXH có mức đóng 30% lương gross và deal được lên 60% (cách hiểu theo bài gốc)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-918#post-36760412' },
      { role: 'Backend/Engineer (tham khảo chung)', yoe: 'không rõ', amount: 'không có con số cụ thể (không rõ gross/net)', year: '2026', note: 'bình luận cho rằng thưởng khoảng tháng 13 + 14,15 ở mức cao; không phải offer cá nhân có số tiền', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1246#post-41392785' }
    ],
    sources: [
      { title: 'note8.vn — Phỏng vấn MOMO Vietnam (review Backend Engineer 2023)', url: 'https://note8.vn/phong-van-dn/cong-ty-co-phan-vien-thong-momo-viet-nam-1392' },
      { title: 'voz.vn — Xin review phỏng vấn Software Engineer II Java MoMo (2026)', url: 'https://voz.vn/t/xin-review-phong-van-software-engineer-ii-java-momo.1258526/' },
      { title: 'ITviec — M_Service (MoMo) company page', url: 'https://itviec.com/companies/m_service-momo' },
      { title: 'voz.vn — Chia sẻ offer Machine Learning Engineer MoMo (2021, rejected)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-918#post-36760412' },
      { title: 'voz.vn — Bình luận thưởng MoMo (2026, tham khảo)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1246#post-41392785' }
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
      { round: 'Vòng duy nhất — 2 Technical Lead', detail: 'Review năm 2020 cho vị trí Software Engineer (Java): một vòng duy nhất với 2 technical lead, hỏi kiến thức nền Java/Spring, đào sâu tech stack trên CV và một câu thiết kế; ứng viên không nhớ có câu thuật toán.' },
      { round: 'Hình thức test thường gặp (tham khảo JD fintech 2024–2025)', detail: 'JD VNPay 2024–2025 tuyển Java/Spring Boot, Vert.x, Oracle/MS SQL/PostgreSQL, Kafka, RabbitMQ, Redis; fintech thường có bài test online (HackerRank/Codility) về Java core, concurrency, SQL và message queue trước vòng technical. Hỏi recruiter xác nhận nền tảng, có take-home hay live coding.' }
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
    pay: [
      { role: 'Kỹ sư lập trình (Backend/Software Engineer)', yoe: '1,5 năm thực tập', amount: '15tr gross/tháng', year: '2023', note: 'thưởng tết 2 tháng, bảo hiểm BV, đóng thuế + BHXH theo lương cơ bản (theo bài chia sẻ)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1204#post-40732006' },
      { role: 'Junior Backend Engineer (rejected)', yoe: '0,5 năm', amount: '17tr gross/tháng', year: '2025', note: 'offer bị từ chối; thưởng trung bình khoảng 2 tháng, có mã hoàn tiền/giảm giá (theo bài chia sẻ)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1214#post-40834428' }
    ],
    sources: [
      { title: 'voz.vn — [Review Phỏng Vấn] Các công ty CNTT, trang 3 (VNPay Software Engineer Java, 2020)', url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-3' },
      { title: 'ITviec — VNPAY company page', url: 'https://itviec.com/companies/vnpay' },
      { title: 'voz.vn — Chia sẻ lương VNPay (2023)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1204#post-40732006' },
      { title: 'voz.vn — Offer Junior Backend Engineer VNPay (2025, rejected)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1214#post-40834428' }
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
      { round: 'Vòng 3 — Kỹ thuật + culture fit (~1,5 giờ)', detail: 'Nửa kỹ thuật, nửa behavioral/culture fit; không khí khá thoải mái.' },
      { round: 'Hình thức test (tham khảo Viblo/Glassdoor 2024–2025)', detail: 'Zalo/VNG thường có: online assessment (GMAT-style English/Math/Logic 60–90 phút), technical 2–3 vòng: live coding 2–3 bài (medium–hard, heap/linked list/graph/O(1) design), system design (chat/messaging/scale), CS fundamentals deep-dive (TCP/HTTP, OS, DB internals). Vòng cuối: culture fit/behavioral. Tiếng Anh bắt buộc (team có expat, doc tiếng Anh). Hỏi recruiter team (Zalo app, ZaloPay, Zalo AI, backend platform) vì quy trình khác nhau.' }
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
    pay: [
      { role: 'Software Engineer (Zalo)', yoe: '3 năm', amount: '27tr gross/tháng', year: '2025', note: 'tháng 13 (theo bài chia sẻ)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-971#post-37466345' },
      { role: 'Senior Data Scientist (Zalo, tham khảo role khác)', yoe: '3 năm', amount: '50tr gross/tháng (14 tháng/năm theo bài)', year: '2022', note: 'không phải backend Java; phản ánh mặt bằng lương kỹ thuật cao tại Zalo thời điểm đó', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-921#post-36805295' },
      { role: 'Senior DevOps Engineer (VNG Solution/VSol, tham khảo)', yoe: '3,5 năm', amount: '~530tr gross/năm', year: '2025', note: 'VNG Solution thuộc hệ sinh thái VNG; BHXH 70%, có onsite KSA (theo bài chia sẻ)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1379#post-42637273' }
    ],
    sources: [
      { title: 'Viblo — Từ cú trượt Caladan đến offer mid-level tại Zalo', url: 'https://viblo.asia/p/tu-cu-truot-caladan-den-offer-mid-level-tai-zalo-1QLxnya04Aw' },
      { title: 'voz.vn — [Review Phỏng Vấn] Các công ty CNTT, trang 7 (Zalo Senior SE, 2021)', url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-7' },
      { title: 'voz.vn — Review phỏng vấn ZaloPay/VNG, vòng behavior (10/2023, voz #48)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-34#post-34282956' },
      { title: 'ITviec — VNG Corporation company page', url: 'https://itviec.com/companies/vng-corporation' },
      { title: 'voz.vn — Offer Software Engineer Zalo (2025)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-971#post-37466345' },
      { title: 'voz.vn — Offer Senior Data Scientist Zalo (2022, tham khảo)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-921#post-36805295' },
      { title: 'voz.vn — Offer Senior DevOps Engineer VNG Solution/VSol (2025, tham khảo)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1379#post-42637273' }
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
      { round: 'Vòng cuối — Team lead / manager', detail: 'Theo review Shopee Singapore: vòng cuối với team lead vẫn có code/thuật toán và system design; kết quả có trong khoảng vài ngày đến hơn một tuần.' },
      { round: 'Hình thức test (tham khảo Glassdoor 2024–2025)', detail: 'Glassdoor cho thấy Shopee thường dùng HackerRank/Codility cho bài screening: 2–3 câu thuật toán (easy–medium) + vài câu trắc nghiệm CS/DB/SQL trong 60–90 phút. Một số vị trí có take-home project (1–2 ngày) thay vì live coding. Hỏi recruiter vì stack team VN chủ yếu Go/React, Java ít hơn.' }
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
    pay: [
      { role: 'Backend/Software Engineer (chưa có offer công khai chi tiết)', yoe: 'không rõ', amount: 'không có số cụ thể trong digest voz (không rõ gross/net)', year: '2026', note: 'digest có bình luận trải nghiệm làm việc, không có bài chia sẻ mức lương có số tiền cho role cụ thể', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-122#post-42849257' }
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
      { round: 'Vòng 3 (SDET, 2026) — Cultural fit', detail: 'Trao đổi bằng tiếng Anh.' },
      { round: 'Hình thức test (tham khảo Glassdoor/Codility 2024–2025)', detail: 'Grab dùng Codility cho OA: 2–3 câu algorithm (medium) + SQL/CS trắc nghiệm 60–90 phút. Technical rounds: live coding (easy–medium) + system design (backpressure, queue, microservices) + deep-dive project. SDET có flow riêng: coding easy + test case design + cultural fit. 4H values (Heart, Hunger, Honour, Humility) được hỏi ở behavioral. Tiếng Anh bắt buộc (interviewer thường là expat/SG team). Hỏi recruiter team (transport, delivery, fintech, platform) vì stack khác nhau (Go/Java/Kotlin).' }
    ],
    focus: ['design', 'microservices', 'db', 'concurrency', 'behavioral', 'english', 'testing'],
    algoWeight: 0.65,
    englishRequired: true,
    questions: [
      'Thiết kế service C đứng giữa service A (phát X message/giây) và service B (xử lý Y message/giây), rồi viết code xử lý.',
      'Làm sao đảm bảo dữ liệu nhất quán và mức isolation trong database ở dự án cũ?',
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
    pay: [
      { role: 'Backend/Software Engineer (chưa có offer công khai chi tiết)', yoe: 'không rõ', amount: 'không có số cụ thể trong digest voz (không rõ gross/net)', year: '2026', note: 'digest có review quy trình SDET/SE (2026) nhưng không kèm số lương; hỏi recruiter/Glassdoor cho range', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-88#post-40705655' }
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
    pay: [
      { role: 'Senior Software Engineer (SSE)', yoe: '5,5 năm', amount: '80tr gross/tháng', year: '2023', note: 'bài chia sẻ không nêu bonus chi tiết', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1216#post-40919407' },
      { role: 'Middle Java Engineer', yoe: '3 năm', amount: '40tr gross/tháng', year: '2025', note: 'hybrid, BHXH 100% (theo bài chia sẻ)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1043#post-38166847' },
      { role: 'Senior BA (tham khảo role khác)', yoe: '4,5 năm', amount: '52tr gross/tháng', year: '2025', note: 'tháng 13 + thưởng kinh doanh (theo bài), 27 ngày phép, BH cao; không phải dev', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1000#post-37901206' }
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
      { title: 'ITviec — NAB Innovation Centre Vietnam company page', url: 'https://itviec.com/companies/nab-innovation-centre-vietnam' },
      { title: 'voz.vn — Offer SSE NAB (2023)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1216#post-40919407' },
      { title: 'voz.vn — Offer Middle Java Engineer NAB (2025)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1043#post-38166847' },
      { title: 'voz.vn — Offer Senior BA NAB (2025, tham khảo)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1000#post-37901206' }
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
      { round: 'Vòng 3/4 — Culture fit hoặc trao đổi với quản lý dự kiến (tham khảo)', detail: 'Có thể gặp head/manager nước ngoài về kỳ vọng, lý do đổi việc, điểm mạnh/yếu, kế hoạch phát triển. Review Senior SE 2026 (voz #105) kể vòng cuối chủ yếu trao đổi/deal với quản lý dự kiến và cho biết sau vòng đó có offer letter; tổng thời gian từ vòng đầu đến có offer khoảng 2 tháng.' },
      { round: 'Hình thức test (tham khảo review 2022–2026)', detail: 'Axon có thể có OA (trắc nghiệm + 3 bài medium–hard 60–120 phút) hoặc straight to technical. Onsite/virtual 3–4 panel: coding (algorithm medium, edge case), CS/OS deep-dive (thread model, GC, memory, runtime), system design (trade-off A vs B), culture fit. Senior 2026 gặp live coding mutex/locking (không phải LeetCode). Toàn tiếng Anh/Việt. Hỏi recruiter team (Enterprise, Cloud, AI, Body Camera) vì domain khác nhau.' }
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
    pay: [
      { role: 'Software Engineer (chưa có offer công khai chi tiết)', yoe: 'không rõ', amount: 'không có số cụ thể trong digest voz (không rõ gross/net)', year: '2026', note: 'digest có review quy trình (2022–2026) nhưng không kèm số lương cụ thể', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-91#post-41118587' }
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
      { round: 'Vòng 3 — Culture fit', detail: 'Trang tuyển dụng nêu culture-fit interview, sau đó onboarding nếu phù hợp.' },
      { round: 'Hình thức test (tham khảo trang tuyển dụng vietname.tyme.com 2024–2025)', detail: 'Trang chính thức nêu quy trình 3 bước nhưng không chi tiết bài test. Fintech/digital bank tương tự (MoMo, VNPay, ShopBack) thường có: bài test online HackerRank/Codility (Java core, Spring, SQL, concurrency 60–90 phút) hoặc take-home API design (24–48h), sau đó live coding system design. Hỏi recruiter trước: nền tảng test, cho phép ngôn ngữ nào, có bài tiếng Anh riêng.' }
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
    pay: [
      { role: 'Backend/Java (chưa có offer công khai chi tiết)', yoe: 'không rõ', amount: 'không có số cụ thể trong digest voz (không rõ gross/net)', year: '2026', note: 'digest có nhắc TymeX trong thảo luận chung nhưng không có bài chia sẻ mức lương có số tiền gắn rõ GoTyme/TymeX VN; xác nhận với recruiter', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1011#post-37957078' }
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
      { round: 'Vòng 1–3 (Mid Software Engineer, 2026)', detail: 'HR giới thiệu công ty, test tiếng Anh và clarify CV. Technical 1:1 hỏi nội dung trong CV, dự án đã làm, Java core, Spring annotations, bean lifecycle, authn/authz, database isolation levels, transactions. Technical với 1 Lead + 1 Manager: thêm microservices, manager hỏi agile/scrum, assign task, tiêu chí dự án.' },
      { round: 'Hình thức test (tham khảo Glassdoor/AmbitionBox 2024–2025)', detail: 'EPAM thường có: entry test (nếu client yêu cầu) — Java core, Spring, SQL, algorithm easy–medium 60–90 phút; technical interview 1–2 vòng (live coding, deep-dive project, Spring/DI, database, microservices); client interview (bằng tiếng Anh với PM/Architect khách hàng); HR/manager deal. EPAM Anywhere 2022: technical screening (theory + easy coding) → manager → re-technical → hiring manager. Tiếng Anh bắt buộc (client quốc tế). Hỏi recruiter project/client vì stack và quy trình khác nhau.' }
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
    pay: [
      { role: 'Mid Software Engineer', yoe: '~4 năm', amount: '46tr gross/tháng', year: '2026', note: 'tháng 13, có performance bonus (theo bài); full remote, bảo hiểm tư nhân cho vợ chồng con cái, BHXH full lương', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1204#post-40732006' },
      { role: 'Associate Software Engineer (tham khảo đầu vào)', yoe: '0 năm', amount: '~14tr gross/tháng', year: '2022', note: 'lương tăng theo năm trong cùng công ty (theo bài chia sẻ); tháng 13 + performance (hên xui)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1104#post-38952425' }
    ],
    sources: [
      { title: 'EPAM Careers — Senior Java Engineer, Vietnam vacancy and hiring process', url: 'https://careers.epam.com/en/vacancy/senior-java-engineer-blttpn84g6zmt6ll3c7_en' },
      { title: 'AmbitionBox — EPAM Software Engineer interview experiences, 2025', url: 'https://www.ambitionbox.com/interviews/epam-systems-interview-questions/software-engineer' },
      { title: 'Glassdoor — EPAM Senior Java Developer interview experience, 2025', url: 'https://www.glassdoor.ca/Interview/EPAM-Systems-Interview-RVW95534424.htm' },
      { title: 'voz.vn — Review EPAM Anywhere (2/2022)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-1#post-22638823' },
      { title: 'voz.vn — Review EPAM Mid Software Engineer (1/2026)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-85#post-40443979' },
      { title: 'voz.vn — Offer Mid Software Engineer EPAM (2026)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1204#post-40732006' },
      { title: 'voz.vn — Lộ trình lương EPAM (2022–2024, tham khảo)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1104#post-38952425' }
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
      { round: 'Vòng 3 — Final interview', detail: 'Trao đổi với management về kỳ vọng và hướng phát triển. Một bài chia sẻ ứng viên Principal năm 2025 kể hai vòng với team Việt Nam và manager Nhật; đó là trải nghiệm role cụ thể.' },
      { round: 'Hình thức test (tham khảo Viblo/Glassdoor 2024–2025)', detail: 'Money Forward quy trình 4 bước (careers page): phone screen → competency (technical) → final (management) → offer. Technical round: live coding (algorithm easy–medium, Java/Kotlin/Spring) + system design (banking/fintech: ledger, idempotency, audit trail) + deep-dive project. Manager Nhật có thể hỏi bằng tiếng Anh qua dịch vụ phiên dịch. Trang chính thức cam kết phản hồi sau mỗi giai đoạn. Hỏi recruiter team (banking, PFM, cloud) và ngôn ngữ phỏng vấn (Java/Kotlin).' }
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
    pay: [
      { role: 'Backend/Java-Kotlin (không có số liệu offer công khai)', yoe: 'không rõ', amount: 'không có số cụ thể trong digest voz (không rõ gross/net)', year: '2026', note: 'chưa thấy bài chia sẻ mức lương cụ thể cho role Java tại VN trong phạm vi digest; hỏi recruiter khi apply', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1563' }
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
    process: [{ round: 'Quy trình chưa được xác minh', detail: 'Không tìm được review phỏng vấn Java Việt Nam mới đủ chi tiết. Hỏi recruiter về các vòng technical, tiếng Anh và bài coding.' },
      { round: 'Hình thức test thường gặp outsourcing banking (tham khảo FPT/CMC/NashTech 2024–2025)', detail: 'GFT chuyên banking/financial services outsourcing. Công ty tương tự (FPT, CMC, NashTech, TMA) thường có: bài test online iMocha/Codility (Java core, Spring, JPA, Kafka, AWS, SQL, English 60–90 phút), technical interview 1–2 vòng (live coding, Spring transaction, microservices, Kafka, database design), client interview (bằng tiếng Anh với PM/Architect ngân hàng EU/US), HR deal. Tiếng Anh bắt buộc (JD nêu rõ). Hỏi recruiter BU, project, có client interview không.' }],
    focus: ['spring', 'jpa', 'microservices', 'aws', 'db', 'english', 'architecture'],
    algoWeight: 0.25,
    englishRequired: true,
    questions: ['Bạn thiết kế một luồng giao dịch banking dùng Kafka thế nào để tránh mất hoặc xử lý lặp message?', 'Bạn chọn Spring transaction boundary và chiến lược retry ra sao khi gọi service ngoài?'],
    tips: ['JD Java banking yêu cầu tiếng Anh; luyện giải thích kiến trúc, testing và production trade-off bằng tiếng Anh.', 'Điểm ITviec phản ánh review nơi làm việc, không phải review phỏng vấn.'],
    pay: [
      { role: 'Backend/Java (chưa có offer công khai chi tiết)', yoe: 'không rõ', amount: 'không có số cụ thể trong digest voz (không rõ gross/net)', year: '2026', note: 'không có bài chia sẻ mức lương có số tiền cho GFT Vietnam trong digest; JD banking Java/Spring có trên ITviec', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1563' }
    ],
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
      { round: 'Vòng 2 — CEO/CTO hoặc culture fit (tham khảo 2022–2026)', detail: 'Review backend 2025 (voz #103) là behavioral, có thể hỏi kỹ thuật liên quan. Review frontend 2022/2024 nhắc vòng culture fit/trao đổi với management về định hướng, giải quyết xung đột và team dự kiến. Mức offer có thể phụ thuộc kết quả phỏng vấn (review 2022).' },
      { round: 'Hình thức test (tham khảo review 2022–2025)', detail: 'Naver VN dùng HackerRank cho OA: backend có 1 LeetCode medium (data structure implementation) + 1 SQL phức tạp + Java practical 120 phút. Technical 2 buổi: lead (deep-dive CV, OS/distributed systems, Java/Spring internals, design patterns, microservices, distributed locking) → manager (behavioral + technical follow-up). Có buổi với tech lead Hàn qua phiên dịch. Tiếng Anh bắt buộc (doc/code review tiếng Anh, team đa quốc gia). Hỏi recruiter team (search, ads, commerce, platform) vì stack khác nhau.' }
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
      '',
      'Technical chỉ mang tính verification: tự tin, không lóng ngóng là được (review 2024).',
      'Benefits rất ngon, culture, WLB tuyệt vời, đang expanding (review 2025).'
    ],
    pay: [
      { role: 'Backend/Software Engineer (chưa có offer công khai chi tiết)', yoe: 'không rõ', amount: 'không có số cụ thể trong digest voz (không rõ gross/net)', year: '2026', note: 'digest có review quy trình (2022–2025) nhưng không kèm mức lương có số tiền cho role backend Java tại VN', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-91#post-41113722' }
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
    process: [
      { round: 'Quy trình chưa được xác minh', detail: 'Các trang công khai đã tìm được không mô tả nhất quán interview rounds cho Java. Xác nhận với recruiter trước khi chuẩn bị theo format cụ thể.' },
      { round: 'Hình thức test thường gặp tại Rakuten Fintech (tham khảo ITviec review 2024–2025)', detail: 'ITviec review nhân viên 2024–2025 nhắc môi trường Agile, code review nghiêm ngặt, dùng Java/Spring Boot, Kafka, Kubernetes. Fintech Nhật thường có: bài test tiếng Anh (TOEIC/TOEFL benchmark hoặc test nội bộ), bài coding online HackerRank (Java core, Spring, SQL, algorithm easy–medium), live coding system design (payment/transaction flow), và vòng với hiring manager Nhật qua dịch vụ phiên dịch. Hỏi recruiter rõ: có bài test tiếng Anh không, nền tảng coding, số vòng technical.' }
    ],
    focus: ['core', 'spring', 'db', 'security', 'microservices', 'scenario'],
    algoWeight: 0.3,
    englishRequired: true,
    questions: ['Bạn bảo vệ dữ liệu thẻ và thông tin nhạy cảm trong backend service thế nào?', 'Thiết kế xử lý thanh toán chống duplicate khi gateway gửi lại callback ra sao?'],
    tips: ['Ôn Java/Spring và thiết kế giao dịch tài chính; các câu hỏi trên là bài luyện domain, không phải câu được xác nhận từ review.', 'Đánh giá ITviec phản ánh nhân viên, không đo trải nghiệm phỏng vấn.', 'Lưu ý: digest voz 2023–2026 có review mang tên Rakuten (2022, 2023) nhưng có thể thuộc pháp nhân/vị trí khác (ví dụ Rakuten Nhật, role iOS) — không suy ra đây là quy trình của Rakuten Fintech Vietnam; xác nhận với recruiter.'],
    pay: [
      { role: 'Backend/Java (chưa có offer công khai chi tiết)', yoe: 'không rõ', amount: 'không có số cụ thể trong digest voz (không rõ gross/net)', year: '2026', note: 'không có bài chia sẻ mức lương có số tiền gắn rõ Rakuten Fintech Vietnam trong digest; xác nhận với recruiter', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1563' }
    ],
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
      { round: 'Vòng 3 — Refactor code và CS với CTO (review 2022, voz #2)', detail: 'CTO (người nước ngoài) đưa đoạn code và yêu cầu refactor/optimize theo kiểu pair, sau đó hỏi DB indexing, networking, microservices (RPC vs message queue). Reviewer nhận xét vòng này thân thiện và không quá sâu như vòng trước.' },
      { round: 'Hình thức test (tham khảo review 2022, voz #2)', detail: 'Bài test vòng 1: 3 câu thuật toán trên HackerRank (medium). Vòng 2: live coding thuật toán + system design + CS fundamentals (có thể dùng ngôn ngữ tùy chọn). Vòng 3: pair programming refactor code có sẵn. Toàn bộ quá trình bằng tiếng Anh. Hỏi recruiter stack hiện tại (Java/Go) và format cụ thể vì review 2022 khá cũ.' }
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
      { round: 'Vòng 5 — Cultural alignment (review 2025, voz #85, #107)', detail: 'Review 2025 mô tả chọn ngẫu nhiên 2–3 câu/thẻ từ bộ câu hỏi (khoảng 20) để trả lời về giá trị, cách làm việc và tình huống.' },
      { round: 'Hình thức test (tham khảo review 2025, Thoughtworks hiring guide)', detail: 'Thoughtworks đặc trưng pair programming: OA HackerRank (2–4 câu easy–medium) → HR screen → pair programming session (1–2 giờ, codebase có sẵn, viết API/refactor, test-driven, nói to tư duy) → technical follow-up (CS fundamentals, project deep-dive) → cultural alignment (random 2–3 câu từ bộ ~20 giá trị). Không tập trung LeetCode hard. Tiếng Anh bắt buộc (pair programming bằng tiếng Anh, client quốc tế). Hỏi recruiter role (Graduate/Associate/Senior) vì format khác nhau.' }
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
      { round: 'Ghi chú từ review 2024 (voz #51)', detail: 'Một chia sẻ khác nhận xét quy trình SAP dài nhưng được hỗ trợ tốt; cũng lưu ý cùng vị trí/tổ chức có thể có biến thể (ví dụ vòng system design có/không tùy case). Hãy hỏi recruiter cấu trúc vòng hiện tại.' },
      { round: 'Hình thức test (tham khảo Glassdoor SAP 2024–2025)', detail: 'Glassdoor cho thấy SAP thường có: online assessment Codility/HackerRank (2–3 câu algorithm easy–medium + SQL/CS trắc nghiệm 60–90 phút), sau đó 2–3 vòng technical với EM (Java/Spring, system design, OOP, database, distributed systems), cuối cùng behavioral/culture fit. Một số vị trí có take-home assignment (1–2 ngày). Quy trình thường kéo dài 3–6 tuần. Hỏi recruiter team cụ thể vì SAP có nhiều org (SAP Labs, SAP Cloud, SAP Industries...).' }
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
    pay: [
      { role: 'Software Engineer (chưa có offer công khai chi tiết)', yoe: 'không rõ', amount: 'không có số cụ thể trong digest voz (không rõ gross/net)', year: '2026', note: 'có bình luận hỏi về package SAP senior/lead nhưng digest không có bài chia sẻ số tiền cụ thể cho role dev tại VN', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1061#post-38303000' }
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
      { round: 'Vòng 2 — Phỏng vấn nhóm (review 2025, voz #74)', detail: 'Khoảng 5 interviewer phỏng vấn vài ứng viên trong khoảng 1 giờ. Ứng viên giới thiệu bằng tiếng Anh, sau đó hỏi về dự án/công nghệ/case xử lý, công việc cũ, lý do nghỉ, công cụ và định hướng; không khí được mô tả thoải mái.' },
      { round: 'Hình thức test (tham khảo Glassdoor Samsung R&D 2024–2025)', detail: 'Glassdoor cho thấy Samsung R&D VN thường có: bài test online (Codility/HackerRank) 2–3 câu algorithm (easy–medium) + CS/DB trắc nghiệm, dành 60–120 phút. Vị trí experienced có thêm live coding system design (distributed systems, caching, message queue) và deep-dive project. Vòng onsite thường 3–4 panel: coding, system design, domain knowledge, behavioral. Tiếng Anh bắt buộc (giáo tiếp daily với HQ Hàn). Hỏi recruiter level cụ thể vì fresher và senior quy trình khác biệt lớn.' }
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
      { round: 'Vòng 2 — Phỏng vấn onsite dài (review 2024, voz #65)', detail: 'Buổi khoảng 2,5 giờ với 3 interviewer: trao đổi làm quen/tính cách, kiểm tra tiếng Anh, hỏi kỹ thuật về các dự án trong CV, cách review code và xử lý một số tình huống trong team; không khí được mô tả vui vẻ.' },
      { round: 'Hình thức test (tham khảo Glassdoor Optimizely 2024–2025)', detail: 'Glassdoor cho thấy Optimizely thường dùng coderpad.io/HackerRank cho bài screening: 1–2 câu coding (easy–medium, ngôn ngữ tự chọn) + system design nhỏ. Vòng onsite 3–4 panel: pair programming/refactor, architecture discussion, behavioral/culture fit. Vị trí Java backend (nếu có) thường hỏi Spring, microservices, testing, CI/CD. Toàn tiếng Anh. Hỏi recruiter stack thực tế vì review 2024 là vị trí .NET.' }
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
      { round: 'Vòng 4 — HR và gặp team (review 2024, voz #52)', detail: 'Phần 1 trao đổi với HR Director về benefit; phần 2 nói chuyện với đại diện team dự kiến join (BE/FE/PO) về behavior và sản phẩm (ví dụ đánh đổi release nhanh nhưng chưa ổn định hay chậm nhưng ổn định).' },
      { round: 'Hình thức test (tham khảo review 2024, HackerRank)', detail: 'Chợ Tốt dùng HackerRank cho OA: 2 thuật toán + 1 SQL (easy) 60–90 phút. Technical interview 1h45 với expat: CS fundamentals (OS, network) + backend (DB, microservices, Docker, CI/CD) + deep-dive project. Culture fit với hiring manager + HR/team meet. Tiếng Anh bắt buộc (interviewer expat, team đa ngôn ngữ Java/Go/Python). Ứng viên HCM có thể onsite ăn trưa. Hỏi recruiter team (marketplace, fintech, platform) và language chính.' }
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
      { round: 'Quy trình Review 2024/2025 (review 12/2024–1/2025)', detail: 'Tất cả vòng phỏng vấn bằng tiếng Anh: HR call, chat với Engineering Manager về behavior, tech assessment live coding mức medium–hard, domain knowledge về system design, behavioral với Head of Engineering; vòng 3–5 cùng ngày và khá đuối (ShopBack, review 12/2024–1/2025).' },
      { round: 'Hình thức test (tham khảo review 2024–2025, HackerRank)', detail: 'ShopBack dùng HackerRank cho OA: domain knowledge assessment (system design questions) + live coding (easy–medium, extend difficulty). 5 vòng: HR → EM (behavioral) → system design OA → live coding → behavioral (Head of Eng). Toàn tiếng Anh, vòng 3–5 cùng ngày. System design tập trung microservices, payment/idempotency, event-driven. Hỏi recruiter team (core, merchant, consumer, platform) vì domain khác.' }
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
      { round: 'Vòng 2 — Technical (review 2022)', detail: 'Dùng laptop mấy code CSS, JS, giải bài Two Sum và bài tìm người được giải thưởng, khá dễ; sau đó hỏi về Promise (Garena, review 2022).' },
      { round: 'Vòng 3 — Head of Country (review 2022)', detail: 'Nói chuyện về culture, lý do rời công ty cũ, yếu tố quan trọng khi chọn công ty mới (Garena, review 2022).' },
      { round: 'Hình thức test (tham khảo Glassdoor Garena/Sea 2024–2025)', detail: 'Glassdoor cho thấy Garena/Sea Group thường có: online assessment HackerRank (2–3 câu algorithm easy–medium + CS/DB trắc nghiệm 60–90 phút), sau đó 2–3 vòng technical (live coding, system design cho game/backend, deep-dive project). Vị trí Java backend (Garena Platform/Sea Money) thường hỏi: Java concurrency, Spring, microservices, Kafka, Redis, distributed systems, gaming backend patterns. Tiếng Anh quan trọng (team đa quốc gia). Quy trình kéo 2–4 tuần. Hỏi recruiter team cụ thể vì Garena có nhiều division (Game, SeaMoney, Shopee tách riêng).' }
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
      { round: 'Vòng 2 — Onsite với Team Lead (review 2022)', detail: 'Hỏi về những thứ đã biết và đã làm, giải thích công việc đã thực hiện; có hỏi tại sao dùng channel truyền data trong goroutine thay vì truyền trực tiếp, và một bài LeetCode tìm vị trí số trong mảng (One Mount Group, review 2022).' },
      { round: 'Hình thức test (tham khảo review fintech/edtech 2024–2025)', detail: 'One Mount thuộc nhóm edtech/fintech, thường có: bài test online HackerRank/Codility (Golang/Java core, algorithm easy–medium, concurrency, SQL 60–90 phút), live coding system design (payment/education platform), trênsite pair programming. Review 2022 là vị trí Golang Junior nên quy trình Senior Java có thể khác: thêm vòng architecture, behavioral, tiếng Anh. Hỏi recruiter stack thực tế (Java/Golang) và số vòng.' }
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
      { round: 'Vòng 4 — Giám đốc và phó tổng giám đốc (review 8/2025)', detail: 'Hỏi lại tổng quan CV, lý do nghỉ công ty cũ, mức lương; chủ yếu behavior, không đi sâu technical (Viettel Trung tâm công nghệ, review 8/2025).' },
      { round: 'Hình thức test (tham khảo Glassdoor Viettel 2024–2025)', detail: 'Glassdoor cho thấy Viettel thường có: bài test online (Java/Spark/SQL/algorithm tùy vị trí) 60–120 phút, vòng technical deep-dive project (data pipeline, lakehouse, Spark tuning), vòng tiếng Anh (TOEIC benchmark hoặc meeting HR), cuối cùng gặp leadership. Vị trí Backend Java (khác Data Engineer) thường hỏi: Java core, Spring, microservices, Oracle/PostgreSQL, Kubernetes, system design cho telecom/banking scale. Hỏi recruiter rõ team (Data, Backend, Platform) vì quy trình khác nhau.' }
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
    pay: [
      { role: 'Mid Java Dev (VT*/Viettel đỏ, rejected)', yoe: '3 năm', amount: '350tr net/năm (package theo bài chia sẻ)', year: '2025', note: 'offer bị từ chối; thưởng package năm 50tr trong gói, BHXH trên mức cơ bản, BHSK PVI', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1073#post-38451596' }
    ],
    sources: [
      { title: 'voz.vn — Review Viettel Trung tâm công nghệ Kỹ sư dữ liệu (8/2025)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-78#post-39234999' },
      { title: 'voz.vn — Offer Mid Java Dev Viettel đỏ (2025, rejected)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1073#post-38451596' }
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
      { round: 'Vòng 2 — Culture fit + deal lương (review 6/2026)', detail: 'Phỏng vấn online với hiring manager, nửa đầu tiếng Anh về behavior (giải quyết conflict trong team, với manager, định hướng 3–4 năm tới), nửa cuối deal lương bằng tiếng Việt (KMS Healthcare, review 6/2026).' },
      { round: 'Hình thức test (tham khảo review KMS Technology group 2024–2025)', detail: 'KMS group (KMS Technology, KMS Healthcare, KMS Solutions) thường có: bài test online HackerRank/Codility (algorithm, language-specific, system design basics 60–90 phút), technical interview 1–2 vòng (live coding, architecture discussion, deep-dive project), English assessment (speaking/writing), culture fit. Vị trí Backend Java (khác DevOps) thường hỏi: Java/Spring, microservices, testing (JUnit/Mockito), CI/CD, AWS/Azure, healthcare domain (HL7/FHIR nếu liên quan). Toàn tiếng Anh. Hỏi recruiter team cụ thể.' }
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
    pay: [
      { role: 'Fresher Dev (KMS HCM)', yoe: '0 năm', amount: '550 USD gross/tháng', year: '2022', note: 'tháng 13 + 14 (theo bài chia sẻ)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1202#post-40700269' }
    ],
    sources: [
      { title: 'voz.vn — Review KMS Healthcare Senior DevOps Engineer (6/2026)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-120#post-42622271' },
      { title: 'voz.vn — Offer Fresher Dev KMS HCM (2022)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1202#post-40700269' }
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
      { round: 'Vòng 2 — Online với 1 lead (review 7/2021)', detail: 'Hỏi lại kiến thức cơ bản, vài câu tiếng Anh giới thiệu bản thân và tại sao nghĩ công ty cũ, sau đó deal lương (TMA, review 7/2021).' },
      { round: 'Hình thức test (tham khảo Glassdoor TMA Solutions 2024–2025)', detail: 'Glassdoor cho thấy TMA thường có: bài test online iMocha/Codility (Java core, Spring, SQL, OOP, design pattern, English 60–90 phút), technical interview 1–2 vòng với Tech Lead (live coding easy–medium, deep-dive project, system design nhỏ), client interview (đặc trưng outsourcing, bằng tiếng Anh với PM/Architect khách hàng), HR deal. Fresher program có IQ test + English + technical test 60 câu. Hỏi recruiter BU và project vì stack khác nhau (Java/.NET/React/mobile).' }
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
      { round: 'Online assessment (review 2024)', detail: 'Gửi online assessment, hôm ngay sau lại quay xe với lý do BU lead không đồng ý (VMO Holdings, review 2024).' },
      { round: 'Hình thức test (tham khảo review outsourcing VN 2024–2025)', detail: 'Dữ liệu chỉ có 1 review ngắn. Công ty outsourcing VN tương tự (FPT, CMC, NashTech, TMA) thường có: bài test online iMocha/HackerRank (Java core, Spring, SQL, English 60–90 phút), technical interview với Tech Lead (live coding, project deep-dive), client interview (bằng tiếng Anh), HR deal. Rủi ro bị hủy sau assessment như review 2024 nhắc tới. Hỏi recruiter rõ BU, project, có client interview không, và xác nhận trạng thái headcount trước khi invest thời gian.' }
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
  },
  {
    id: 'nam-a-bank',
    name: 'Nam A Bank (Ngân hàng số)',
    type: 'bank',
    icon: '🏦',
    summary: 'Ngân hàng TMCP Nam Á đang đầu tư mạnh vào mảng công nghệ và ngân hàng số; các bài chia sẻ lương trên voz cho thấy mức offer cạnh tranh cho vị trí kỹ thuật backend/dev. Được nhắc nhiều trên voz là trả lương tốt cho backend (2024–2026). Chưa có review phỏng vấn chi tiết công khai, nên quy trình dưới đây chỉ là ghi nhận sơ bộ.',
    stack: ['Java', 'Spring Boot', 'Microservices', 'SQL', 'Banking'],
    process: [
      { round: 'Chưa có review phỏng vấn chi tiết', detail: 'Digest voz 02/2025–11/2026 chưa có bài mô tả vòng phỏng vấn backend/Java cụ thể cho Nam A Bank; cần hỏi recruiter về format (test, technical, culture).' },
      { round: 'Hình thức test thường gặp ngân hàng số (tham khảo Techcombank, MB Bank, VPBank 2024–2025)', detail: 'Các ngân hàng số VN (Techcombank, MB Bank, VPBank, TPBank, Sacombank) thường có: bài test online iMocha/Codility/HackerRank (Java core: exception, thread, collections; Spring: bean, DI/IoC, JPA; SQL; design pattern; English 60–90 phút), technical interview 1–2 vòng (live coding easy–medium, deep-dive project, system design banking: idempotency, transaction, core banking integration), culture fit/HR. Nam A Bank tuyển mạnh backend 2024–2026, mức lương cạnh tranh. Hỏi recruiter stack team (core banking vs digital), có client interview không, tiếng Anh yêu cầu mức nào.' }
    ],
    focus: ['spring', 'microservices', 'db', 'security', 'scenario'],
    algoWeight: 0.2,
    englishRequired: false,
    questions: [
      'Chưa có câu hỏi phỏng vấn backend/Java cụ thể được chia sẻ công khai trong nguồn đã rà soát; nên ôn Java/Spring, transaction, bảo mật API và kịch bản banking.'
    ],
    tips: [
      'Chuẩn bị kiến thức banking: idempotency giao dịch, audit log, nhất quán dữ liệu và bảo mật.',
      'Hỏi recruiter rõ stack, team (core banking hay digital) và cấu trúc lương/thưởng vì mức offer trong các chia sẻ khá phân tán theo level.'
    ],
    pay: [
      { role: 'Middle Dev', yoe: '4,5 năm', amount: '53tr gross/tháng', year: '2024', note: 'tháng 13 + performance (theo bài chia sẻ)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1276#post-41673270' },
      { role: 'Principal Engineer', yoe: '6,5–7 năm', amount: '135tr gross/tháng', year: '2026', note: 'tháng 13 + performance bonus (theo bài chia sẻ)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1422#post-43054177' }
    ],
    sources: [
      { title: 'voz.vn — Offer Middle Dev Nam Á (2024)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1276#post-41673270' },
      { title: 'voz.vn — Offer Principal Engineer Nam Á Bank (2026)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1422#post-43054177' }
    ],
    confidence: 'low'
  },
  {
    id: 'covergo',
    name: 'CoverGo',
    type: 'product',
    icon: '🛡️',
    summary: 'Công ty insurtech (công nghệ bảo hiểm) có hoạt động/đội ngũ kỹ thuật tại Việt Nam (theo chia sẻ ứng viên). Được nhắc nhiều trên voz là trả lương tốt cho backend (2025). Chưa có review phỏng vấn chi tiết công khai, nên quy trình dưới đây chỉ là ghi nhận sơ bộ.',
    stack: ['Java', 'Backend', 'Microservices', 'Cloud'],
    process: [
      { round: 'Chưa có review phỏng vấn chi tiết', detail: 'Digest voz 02/2025–11/2026 chưa có bài mô tả vòng phỏng vấn chi tiết cho CoverGo; cần hỏi recruiter về coding, system design và vòng culture.' },
      { round: 'Hình thức test thường gặp insurtech/product company (tham khảo 2024–2025)', detail: 'Insurtech/product company (CoverGo, FWD, AIA, Prudential tech teams) thường có: bài test online HackerRank/Codility (Java/Spring, SQL, algorithm, system design basics 60–90 phút), take-home assignment (API design cho policy/claim, 24–48h), live coding system design (distributed transaction, event-driven, idempotency), architecture discussion, behavioral/culture fit. Tiếng Anh bắt buộc (team quốc tế, HQ Singapore/HK). Hỏi recruiter stack thực tế (Java/Kotlin), team domain (core/platform/integration), số vòng.' }
    ],
    focus: ['design', 'microservices', 'db', 'english', 'scenario'],
    algoWeight: 0.35,
    englishRequired: true,
    questions: [
      'Chưa có câu hỏi phỏng vấn cụ thể được chia sẻ công khai trong nguồn đã rà soát; với insurtech nên chuẩn bị system design, API, transaction và giao tiếp tiếng Anh.'
    ],
    tips: [
      'Chuẩn bị câu chuyện dự án theo STAR và luyện system design bằng tiếng Anh.',
      'Hỏi recruiter về stack thực tế, chính sách ESOP/vesting và hình thức làm việc (remote/hybrid).'
    ],
    pay: [
      { role: 'Senior Software Engineer', yoe: 'không ghi rõ trong bài (chia sẻ offer 2025)', amount: '80tr gross/tháng', year: '2025', note: 'tháng 13, ESOP, thưởng performance (theo bài chia sẻ)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1372#post-42593282' },
      { role: 'Senior Software Engineer (thành phần thưởng/ESOP, cùng nguồn)', yoe: 'không ghi rõ trong bài', amount: '80tr gross/tháng + ESOP/performance', year: '2025', note: 'cùng bài chia sẻ; ghi tách để nêu rõ ESOP và thưởng performance, không phải offer độc lập', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1372#post-42593282' }
    ],
    sources: [
      { title: 'voz.vn — Offer Senior Software Engineer CoverGo (2025)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1372#post-42593282' }
    ],
    confidence: 'low'
  },
  {
    id: 'gsm',
    name: 'GSM (Xanh SM)',
    type: 'product',
    icon: '🚕',
    summary: 'Công ty thuộc hệ sinh thái dịch vụ di chuyển/đặt xe (Xanh SM/GSM) có tuyển kỹ sư phần mềm. Được nhắc nhiều trên voz là trả lương tốt cho backend (2024). Chưa có review phỏng vấn chi tiết công khai ngoài chia sẻ ngắn, nên quy trình dưới đây chỉ là ghi nhận sơ bộ.',
    stack: ['Java', 'Backend', 'Microservices', 'SQL'],
    process: [
      { round: 'Phỏng vấn kỹ thuật (ghi nhận sơ bộ)', detail: 'Một chia sẻ 2024 mô tả 1 vòng phỏng vấn vui vẻ, chủ yếu trò chuyện trao đổi; cần xác nhận với recruiter vì chỉ có 1 nguồn ngắn.' },
      { round: 'Hình thức test thường gặp ride-hailing/logistics tech (tham khảo Grab, Ninja Van, Gojek 2024–2025)', detail: 'Công ty ride-hailing/logistics (GSM/Xanh SM, Grab, Ninja Van, Gojek, Ahamove) thường có: bài test online HackerRank/Codility (algorithm easy–medium, Java/Go core, SQL, concurrency 60–90 phút), live coding system design (dispatch, matching, real-time tracking, payment), deep-dive project (microservices, Kafka, Redis, Kubernetes), behavioral/culture fit. Tiếng Anh quan trọng (team có expat). Review 2024 nhắc đi làm thứ 7 — hỏi rõ WLB. Hỏi recruiter team (dispatch, payment, driver app, platform) vì stack khác nhau.' }
    ],
    focus: ['design', 'microservices', 'db', 'scenario'],
    algoWeight: 0.25,
    englishRequired: false,
    questions: [
      'Chưa có bộ câu hỏi kỹ thuật chi tiết được chia sẻ công khai; chuẩn bị system design dịch vụ đặt xe/thanh toán, API và xử lý sự cố production.'
    ],
    tips: [
      'Xác nhận lịch làm việc (bài chia sẻ 2024 có nhắc đi làm thứ 7) và cơ cấu thưởng trước khi nhận offer.',
      'Chuẩn bị câu chuyện về hệ thống chịu tải, realtime và trade-off kiến trúc.'
    ],
    pay: [
      { role: 'Senior Software Engineer', yoe: '5,5 năm', amount: '95tr gross/tháng', year: '2024', note: 'tháng 13 + performance (không nhớ rõ theo bài chia sẻ); bài có nhắc đi làm thứ 7', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1050#post-38213942' },
      { role: 'Senior Software Engineer (lưu ý điều kiện làm việc, cùng nguồn)', yoe: '5,5 năm', amount: '95tr gross/tháng', year: '2024', note: 'cùng bài chia sẻ; ghi tách để nêu rõ lịch làm việc thứ 7, không phải offer độc lập', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1050#post-38213942' }
    ],
    sources: [
      { title: 'voz.vn — Offer Senior Software Engineer GSM (2024)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1050#post-38213942' }
    ],
    confidence: 'low'
  },

  {
    id: 'fpt-software',
    name: 'FPT Software',
    type: 'service',
    icon: '🧩',
    summary: 'Công ty outsourcing phát triển phần mềm lớn nhất Việt Nam, thuộc tập đoàn FPT. Quy trình tuyển dụng thường có sàng lọc CV, bài test online (kỹ thuật + tiếng Anh), phỏng vấn kỹ thuật với tech lead/team lead (thường bằng tiếng Anh do làm việc với khách quốc tế), và có thể có vòng phỏng vấn với khách hàng (client interview). Đa số dự án là outsourcing cho khách hàng Mỹ, Âu, Nhật, Úc nên yêu cầu tiếng Anh tốt. Stack phổ biến: Java 11/17, Spring Boot, REST API, Oracle/PostgreSQL, MyBatis/JPA, Redis, Docker, Git, CI/CD, Kubernetes, AWS/Azure.',
    stack: ['Java', 'Spring Boot', 'Spring Cloud', 'Microservices', 'Oracle', 'PostgreSQL', 'MySQL', 'Redis', 'Kafka', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GitLab CI', 'JUnit', 'Mockito', 'SonarQube'],
    process: [
      { round: 'Vòng 1 — Sàng lọc CV và bài test online (review 2024–2026)', detail: 'HR sàng lọc CV, sau đó gửi bài test trên nền tảng (iMocha/Codility/HackerRank) gồm Java core (exception, thread, collections), Spring (bean, DI/IoC, JPA), design pattern, SQL và tiếng Anh. Fresher/intern thường có bài test IQ + tiếng Anh + kỹ thuật trước khi được phỏng vấn (review passinterview.app 2026, FPT Software Internship Program 2025).' },
      { round: 'Vòng 2 — Phỏng vấn kỹ thuật với Tech Lead / Team Lead (review 2024–2026)', detail: 'Phỏng vấn online hoặc onsite, thường dùng tiếng Anh. Hỏi sâu về các dự án trên CV, Java core (JVM, GC, concurrency, collections), Spring Boot (bean lifecycle, @Transactional, Spring Security), microservices, database (index, isolation level, transaction), system design nhỏ, và bài coding easy–medium. Một số vị trí Senior có 2 vòng technical: 1 với lead Philippines/khách hàng, 1 với lead Việt Nam (Glassdoor Senior Java 10/2024).' },
      { round: 'Vòng 3 — Phỏng vấn với khách hàng / Manager (tuỳ dự án, review 2024–2026)', detail: 'Vì là outsourcing, nhiều vị trí có vòng client interview: khách hàng (có thể là CTO/Architect nước ngoài) đánh giá kỹ thuật, tiếng Anh và phù hợp văn hóa dự án. Nếu không có client interview thì gặp Hiring Manager/Delivery Manager trao đổi về kỳ vọng, soft skill, deal lương (claveprep.com 2026).' },
      { round: 'Vòng 4 — HR deal lương và onboarding', detail: 'Trao đổi package, benefit (FPTCare, bảo hiểm, đào tạo chứng chỉ, du lịch), ngày gia nhập. Một số review 2026 cho thấy quy trình nhanh, có thể chỉ 1 vòng technical cho vị trí cấp gấp (LinkedIn 8/2025).' }
    ],
    focus: ['core', 'jvm', 'collections', 'spring', 'db', 'microservices', 'design', 'english', 'architecture', 'testing'],
    algoWeight: 0.3,
    englishRequired: true,
    questions: [
      'Giải thích cách Spring quản lý transaction (@Transactional), propagation và isolation level.',
      'HashMap và ConcurrentHashMap khác nhau thế nào, khi nào dùng cái nào?',
      'Thiết kế API idempotent cho thanh toán: client retry sau timeout thì xử lý ra sao?',
      'Khi database commit thành công nhưng publish Kafka thất bại, làm sao giữ nhất quán?',
      'Giải thích OOP 4 tính chất và cho ví dụ áp dụng trong dự án thực tế.',
      'Spring Bean lifecycle: từ khởi tạo đến hủy bỏ, các callback interface nào?',
      'N+1 select problem trong JPA/Hibernate là gì, cách khắc phục?',
      'Bạn xử lý conflict trong team và áp lực deadline như thế nào?',
      'Tự giới thiệu và trình bày dự án tâm đắc bằng tiếng Anh.',
      'Một bài coding easy–medium: ví dụ merge 2 sorted list, tìm duplicate trong mảng, hoặc implement LRU cache.'
    ],
    tips: [
      'Ôn chắc Java core (JVM, GC, concurrency, collections), Spring Boot, SQL và design pattern — đây là trọng tâm bài test và phỏng vấn.',
      'Luyện nói tiếng Anh trình bày dự án, giải thích kỹ thuật vì hầu như dự án đều làm với khách nước ngoài.',
      'Chuẩn bị 1–2 dự án kể theo STAR: bối cảnh → vấn đề → giải pháp → kết quả đo được, sẵn sàng bị hỏi sâu.',
      'Hỏi recruiter trước về BU (Business Unit), stack dự án, có client interview hay không để tập trung chuẩn bị.',
      'Một số review cho thấy offer có thể thấp hơn kỳ vọng; chuẩn bị range lương thực tế và deal dựa trên kinh nghiệm + tiếng Anh.'
    ],
    pay: [
      { role: 'Java Developer (retail global project)', yoe: '4+ năm', amount: 'upto 50tr gross/tháng', year: '2025', note: 'theo tin tuyển dụng LinkedIn 8/2025, dự án quốc tế, tiếng Anh tốt', url: 'https://www.linkedin.com/posts/my2307_javadeveloper-retailglobal-50m-activity-7361308579657601025-qM4l' },
      { role: 'Fresher/Intern (tham khảo)', yoe: '0 năm', amount: '5–7 triệu đồng/tháng (trợ cấp)', year: '2025', note: 'theo chương trình Internship/Fresher 2025, kèm đào tạo tiếng Anh 6–8h/tuần', url: 'https://www.scribd.com/document/885448995/02-FPT-Software-Internship-Program-2025' }
    ],
    sources: [
      { title: 'Glassdoor — FPT Software Senior Java Developer interview questions (10/2024)', url: 'https://www.glassdoor.com.au/Interview/FPT-Software-Senior-Java-Developer-Interview-Questions-EI_IE472026.0,12_KO13,34.htm' },
      { title: 'passinterview.app — Phỏng vấn FPT Software review 2026', url: 'https://passinterview.app/vi/companies/fpt-software' },
      { title: 'note8.vn — Phỏng vấn FPT Software (2026)', url: 'https://note8.vn/phong-van-dn/cong-ty-tnhh-phan-mem-fpt-11' },
      { title: 'FPT Software Internship Program 2025 (PDF)', url: 'https://www.scribd.com/document/885448995/02-FPT-Software-Internship-Program-2025' },
      { title: 'LinkedIn — FPT Software tuyển Java Developer dự án Retail Global (8/2025)', url: 'https://www.linkedin.com/posts/my2307_javadeveloper-retailglobal-50m-activity-7361308579657601025-qM4l' },
      { title: 'claveprep.com — FPT Hiring Process Guide 2026', url: 'https://claveprep.com/blog/fpt-hiring-process-guide-2026' }
    ],
    confidence: 'high'
  },

  {
    id: 'nashtech-vietnam',
    name: 'NashTech Vietnam',
    type: 'service',
    icon: '🌐',
    summary: 'Công ty dịch vụ công nghệ toàn cầu thuộc Harvey Nash Group (UK), chuyên outsourcing phát triển phần mềm, testing và digital transformation cho khách hàng quốc tế. Tại Việt Nam có chương trình "Rookie to Engineer" dành cho fresher (3 tháng đào tạo, offer lên đến 17 triệu). Quy trình Senior/Mid thường: CV screen → Technical test (3 bài thuật toán 2 easy 1 medium + English test) → Technical interview (OOP, SOLID, Spring, DB, microservices, project deep-dive) → HR/Manager. Môi trường quốc tế, yêu cầu tiếng Anh tốt, làm việc với khách Mỹ/Anh/Úc, có thể gặp chênh lệch múi giờ.',
    stack: ['Java', 'Spring Boot', 'Spring Cloud', '.NET', 'Python', 'Microservices', 'AWS', 'Azure', 'Kubernetes', 'Docker', 'Kafka', 'RabbitMQ', 'PostgreSQL', 'Oracle', 'SQL Server', 'JUnit', 'Mockito', 'Selenium', 'Cypress', 'Jenkins', 'GitLab CI'],
    process: [
      { round: 'Vòng 1 — CV screening và Technical Test (review 2023–2025)', detail: 'Sàng lọc CV, sau đó bài test trên-site/online: 3 bài thuật toán (2 easy, 1 medium) trong 60 phút + bài test tiếng Anh (reading comprehension, fill in the blanks, short essay). Chương trình Rookie to Engineer 2025 cũng có Technical Test (Java/.NET/Python/AUTE) + English Proficiency Test tại Open Day (Hà Nội, Đà Nẵng, HCM) (Glassdoor 2/2023, 2/2025, careers.nashtechglobal.com 12/2024).' },
      { round: 'Vòng 2 — Phỏng vấn kỹ thuật (review 2023–2026)', detail: 'Online/onsite với Tech Lead/Hiring Manager (có thể người Việt hoặc nước ngoài). Hỏi OOP 4 tính chất, SOLID principles, Spring (DI/IoC, bean lifecycle, annotation, Spring Security), database (isolation level, transaction, indexing), microservices patterns, concurrency, và đào sâu dự án trên CV. Một số vị trí có live coding thêm (voz.vn 2024–2025, Glassdoor 2/2025).' },
      { round: 'Vòng 3 — HR / Manager interview (review 2023–2025)', detail: 'Trao đổi kỳ vọng lương, định hướng nghề nghiệp, kiểm tra soft skill, tiếng Anh giao tiếp, culture fit. Chương trình Rookie có thêm group discussion và panel interview (FPT University news 2/2025).' }
    ],
    focus: ['core', 'collections', 'spring', 'jpa', 'db', 'microservices', 'english', 'architecture', 'testing', 'behavioral'],
    algoWeight: 0.35,
    englishRequired: true,
    questions: [
      'Giải thích 4 tính chất OOP và nguyên tắc SOLID kèm ví dụ trong dự án.',
      'Spring Bean lifecycle: các phase và interface callback (InitializingBean, DisposableBean, @PostConstruct, @PreDestroy).',
      'Transaction isolation level: READ_COMMITTED vs REPEATABLE_READ vs SERIALIZABLE, khi nào dùng cái nào?',
      'Thiết kế giao dịch phân tán cho service Spring Boot tích hợp Kafka (saga pattern, outbox pattern).',
      'Khi nào dùng CompletableFuture thay vì Future; xử lý exception và timeout ra sao?',
      'Microservices: communication patterns (sync vs async), circuit breaker, distributed tracing.',
      'Database indexing: B-tree vs Hash, covering index, khi nào dùng composite index.',
      'Bài coding: implement LRU cache, merge k sorted lists, hoặc tìm cycle trong linked list.',
      'Tự giới thiệu dự án và giải quyết conflict trong team bằng tiếng Anh.',
      'Tại sao muốn làm ở NashTech và làm thế nào để thích nghi với múi giờ khách hàng quốc tế?'
    ],
    tips: [
      'Luyện LeetCode easy–medium (array, string, linked list, tree, hashmap) và thóiquen code sạch, giải thích rõ tư duy.',
      'Ôn sâu OOP, SOLID, Spring core, JPA/Hibernate, SQL, microservices — đây là bộ câu hỏi cốt lõi.',
      'Chuẩn bị tiếng Anh giao tiếp tốt: tự giới thiệu, trình bày dự án, trả lời behavioral questions.',
      'Tìm hiểu chương trình Rookie to Engineer nếu là fresher/junior: 3 tháng training miễn phí, offer 17M, hỗ trợ đi lại/ăn trưa.',
      'Một số review nhắc quy trình phỏng vấn hơi lằng nhăng, HR Việt Nam không có quyền quyết định cuối cùng; kiên nhẫn theo dõi kết quả.'
    ],
    pay: [
      { role: 'Mid Software Engineer', yoe: '~4 năm', amount: '46tr gross/tháng', year: '2026', note: 'tháng 13, performance bonus, full remote, BHXH full lương, bảo hiểm tư nhân gia đình (theo bài chia sẻ voz 2026)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1204#post-40732006' },
      { role: 'Associate Software Engineer (fresher)', yoe: '0 năm', amount: '~14tr gross/tháng', year: '2022', note: 'lương tăng theo năm; tháng 13 + performance bonus (theo bài chia sẻ voz 2022–2024)', url: 'https://voz.vn/t/thread-tong-hop-chia-se-ve-muc-luong-tai-cac-cong-ty-part-2.515355/page-1104#post-38952425' },
      { role: 'Rookie to Engineer (training)', yoe: '0 năm', amount: '17tr gross/tháng (sau training)', year: '2025', note: 'theo careers.nashtechglobal.com 12/2024, 3 tháng training có trợ cấp', url: 'https://careers.nashtechglobal.com/news/rookie-to-engineer-2025-open-day-embarking-on-the-journey-to-conquer-technology/' }
    ],
    sources: [
      { title: 'Glassdoor — NashTech Global interview questions (2023–2025)', url: 'https://www.glassdoor.co.uk/Interview/NashTech-Global-Interview-Questions-E2154116.htm' },
      { title: 'voz.vn — Tư vấn SystemExe vs NashTech + review phỏng vấn (3/2024–8/2025)', url: 'https://voz.vn/t/tu-van-gap-systemexe-vs-nashtech.933065/' },
      { title: 'FPT University — NashTech Rookie to Engineer recruitment event (2/2025)', url: 'https://daihoc.fpt.edu.vn/en/school-activities/general-news/Nashtech-is-looking-for-young-talents-at-FPT-University./' },
      { title: 'careers.nashtechglobal.com — Rookie to Engineer 2025 Open Day (12/2024)', url: 'https://careers.nashtechglobal.com/news/rookie-to-engineer-2025-open-day-embarking-on-the-journey-to-conquer-technology/' },
      { title: '1900.com.vn — Lương và quy trình phỏng vấn NashTech (3/2025)', url: 'https://1900.com.vn/luong-va-quy-trinh-phong-van-tai-nashtech-nhu-the-nao-5460' },
      { title: 'note8.vn — NASHTECH reviews (449 reviews, cập nhật 2025)', url: 'https://note8.vn/danh-gia-dn/cong-ty-tnhh-nashtech-viet-nam-189' }
    ],
    confidence: 'high'
  },

  {
    id: 'cmc-global',
    name: 'CMC Global',
    type: 'service',
    icon: '🧩',
    summary: 'Công ty outsourcing/dịch vụ công nghệ lớn thuộc tập đoàn CMC, chuyên phát triển phần mềm cho khách hàng quốc tế (banking, enterprise, logistics...). Quy trình: CV screen → Technical test (tiếng Anh + core programming, DS/Algo, DB, IQ) → Technical interview sâu (SQL, microservices, Spring, Java core, project deep-dive) → Client interview (đặc trưng outsourcing) → HR/Offer. Có chương trình Fresher 3 tháng (English speaking, TOEIC, technical test 60 câu). Yêu cầu tiếng Anh đọc hiểu tài liệu, một số vị trí Middle/Senior yêu cầu giao tiếp tốt. Stack: Java, Spring Boot, Hibernate/JPA, Microservices, AWS, PostgreSQL, MS SQL, Redis, Kafka, Docker, Kubernetes, CI/CD, Git.',
    stack: ['Java', 'Spring Boot', 'Spring Cloud', 'Hibernate', 'JPA', 'Microservices', 'AWS', 'PostgreSQL', 'MS SQL', 'Oracle', 'Redis', 'Kafka', 'RabbitMQ', 'Docker', 'Kubernetes', 'Jenkins', 'GitLab CI', 'Git', 'JUnit', 'Mockito', 'SonarQube'],
    process: [
      { round: 'Vòng 1 — Technical Test (review 2022, 2024, 2025)', detail: 'Bài test online/offline bằng tiếng Anh: 60 câu trắc nghiệm bao gồm Core Programming, Basic Front-end, Data Structure & Algorithm, Database, IQ & Logic (CMC University 8/2024). Fresher program cũng test English Speaking (1-1) + TOEIC listening/reading.' },
      { round: 'Vòng 2 — Phỏng vấn kỹ thuật sâu (review 2022, 2024, 2025)', detail: 'Phỏng vấn với 2–3 người từ các DU (Delivery Unit) khác nhau cùng lúc. Hỏi rất sâu: Java core (JVM, compile vs runtime), Spring Boot (DI, bean lifecycle, annotation), SQL (index, isolation level, query phức tạp, recursive CTE), microservices (token mechanism, multi-db, saga), system design (payment flow, feature flags), CI/CD, Git, Kubernetes. Reviewer 2022, 2024, 2025 đều nhắc vòng này nặng kỹ thuật và có thể dùng tiếng Anh.' },
      { round: 'Vòng 3 — Client Interview (đặc thước outsourcing, review 2022, 2024)', detail: 'Sau khi pass vòng technical, ứng viên gặp khách hàng (client) — có thể là Architect/CTO/Project Manager nước ngoài. Vòng này đánh giá kỹ thuật thực chiến, tiếng Anh, và culture fit với team dự án. Một review 2022 kể pass vòng 1 deal lương để gặp client, nhưng hôm sau báo full slot.' },
      { round: 'Vòng 4 — HR deal lương và onboarding (review 2024, 2025)', detail: 'Trao đổi package: lương negotiable, performance review 2 lần/năm, tháng 14, KPI bonus, gói phúc lợi 16–18M/năm (Tết, sinh nhật, quà trung thu...), cơ hội onsite US/EU/Japan, hybrid. Một số review 2025 cho thấy quy trình nhanh, chỉ 1 vòng technical cho vị trí cấp gấp (LinkedIn 10/2025).' }
    ],
    focus: ['core', 'jvm', 'collections', 'spring', 'jpa', 'db', 'microservices', 'design', 'architecture', 'english', 'devops', 'aws', 'testing'],
    algoWeight: 0.3,
    englishRequired: true,
    questions: [
      'Khi run file jar thì JVM làm gì, khi compile thì JDK làm gì? (Phân biệt rõ JVM vs JDK)',
      'Spring Boot DI/IoC: @Autowired, @Qualifier, @Primary, constructor injection vs field injection.',
      'Database: isolation level, lock, index (B-tree, composite, covering), recursive CTE cho cấu trúc cây (phòng ban lồng nhau).',
      'Microservices: token mechanism (JWT/OAuth2), khi nào dùng multi-database, saga pattern vs 2PC cho distributed transaction.',
      'Thanh toán call 2 API: làm sao tránh mất dữ liệu, nếu 1 API pending thì xử lý ra sao (async, compensation, idempotency)?',
      'CI/CD pipeline: Git flow, Jenkins/GitLab CI stages, Docker build, deploy Kubernetes (rolling update, blue-green).',
      'Feature flags: thiết kế DB bật/tắt tính năng theo user segment, SQL vs NoSQL, tối ưu hiệu năng kiểm tra flag.',
      'Bài live coding: implement singleton thread-safe, LRU cache, hoặc refactor đoạn code legacy.',
      'Tiếng Anh: tự giới thiệu, đọc hiểu requirement, trao đổi kỹ thuật cơ bản.',
      'Kể dự án tâm đắc: vai trò, kiến trúc, khó khăn (concurrency, performance, data consistency) và giải pháp.'
    ],
    tips: [
      'Ôn rất kỹ Java core (JVM, class loading, GC), Spring Boot internals, SQL nâng cao (index, isolation, recursive query) — đây là điểm mạnh của CMC.',
      'Chuẩn bị client interview: luyện tiếng Anh kỹ thuật, thuyết trình dự án, trả lời behavioral questions.',
      'Hỏi recruiter rõ DU (Delivery Unit) và domain dự án (banking, logistics, enterprise...) để tập trung ôn domain knowledge.',
      'Một số review nhắc thái độ interviewer có thể hơi "hàn lâm" hoặc(confusing JDK/JVM); giữ bình tĩnh, giải thích rõ ràng, không tranh cãi.',
      'Package phúc lợi khá tốt (tháng 14, 16–18M/năm extra, onsite 기회를, hybrid); deal lương dựa trên level và tiếng Anh.'
    ],
    pay: [
      { role: 'Middle Java Developer', yoe: '2+ năm', amount: 'upto 40tr gross/tháng', year: '2024', note: 'theo LinkedIn 9/2024, không yêu cầu tiếng Anh, phúc lợi 16–18M/năm', url: 'https://www.linkedin.com/posts/nguyen-le-my-huyen_cmcglobal-hcm-hn-activity-7243932560630677504-cSBY' },
      { role: 'Middle/Senior Java Developer', yoe: '4+ năm', amount: 'thương lượng', year: '2025', note: 'theo LinkedIn 10/2025, ưu tiên onboard ngay, dự án enterprise quốc tế', url: 'https://www.linkedin.com/posts/quynh-nhu-ngo-2194b3216_javadeveloper-backenddeveloper-cmglobal-activity-7386227049121841152-s7bi' },
      { role: 'Fresher Java Developer (Banking)', yoe: '0 năm', amount: 'thương lượng', year: '2025', note: 'theo UIT forum 10/2025, dự án banking dài hạn, mentor 1:1, tháng 14, KPI bonus, 16M/năm extra', url: 'https://forum.uit.edu.vn/t/cmc-global-fresher-java-developer/159146' }
    ],
    sources: [
      { title: 'voz.vn — Xin kinh nghiệm phỏng vấn CMC Global (trang 2, review 2022, 2024, 2025)', url: 'https://voz.party/d/591622-xin-kinh-nghiem-phong-van-o-cmc-global?page=2' },
      { title: 'LinkedIn — CMC Global tuyển Middle/Senior Java Developer (9/2024)', url: 'https://www.linkedin.com/posts/nguyen-le-my-huyen_cmcglobal-hcm-hn-activity-7243932560630677504-cSBY' },
      { title: 'bulletinvietnam.org — CMC Global review môi trường và lương thưởng (1/2025)', url: 'https://bulletinvietnam.org/uncategorized/cmc-global-tong-quan-tuyen-dung/' },
      { title: 'CMC University — Sinh viên đánh giá năng lực trước thực tập CMC Global (8/2024)', url: 'https://cmcu.edu.vn/sinh-vien-cong-nghe-thong-tin-tham-gia-danh-gia-nang-luc-dau-vao-truoc-ky-thuc-tap-tai-cong-ty-cmc-global/' },
      { title: 'UIT Forum — CMC Global Fresher Java Developer Banking (10/2025)', url: 'https://forum.uit.edu.vn/t/cmc-global-fresher-java-developer/159146' },
      { title: 'TopCV — Java Developer CMC Global (11/2024)', url: 'https://www.topcv.vn/viec-lam/java-developer/1436388.html' }
    ],
    confidence: 'high'
  },

  {
    id: 'dxc-technology-vietnam',
    name: 'DXC Technology Vietnam',
    type: 'service',
    icon: '🌐',
    summary: 'Chi nhánh Việt Nam của tập đoàn DXC Technology (Mỹ) — công ty dịch vụ CNTT toàn cầu lớn, chuyên modernize hệ thống legacy (mainframe/COBOL), cloud, security, analytics. Quy trình: CV screen (Workday) → English check → Technical interview (Core Java, Spring, Hibernate, SQL, OOP, design patterns, REST/SOAP/gRPC, Docker) → Managerial/HR → Director (vị trí senior) → Offer. Fresher program 3 tháng: TOEIC >800/IELTS >6.0, cam kết 30 tháng, mentor 1:1. Nhiều dự án yêu cầu tiếng Nhật N2/N3 hoặc tiếng Trung. Môi trường WLB tốt, remote/hybrid, nhưng lương tăng chậm, quy trình nội bộ nhiều lớp.',
    stack: ['Java', 'Spring', 'Spring Boot', 'Spring MVC', 'Hibernate', 'JPA', 'JDBC', 'Servlet/JSP', 'SOAP', 'REST', 'gRPC', 'Oracle', 'MSSQL', 'PostgreSQL', 'COBOL', 'Mainframe', 'WebSphere', 'JBoss', 'Tomcat', 'Maven', 'Gradle', 'Ant', 'Git', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'JUnit', 'Mockito', 'SonarQube', 'Jenkins'],
    process: [
      { round: 'Vòng 1 — Nộp CV và sàng lọc (review 2023–2025)', detail: 'Nộp trên careers.dxc.com (Workday), lọc location Vietnam. Recruiter đối chiếu với yêu cầu dự án: Java, .NET, COBOL/mainframe, ServiceNow, automation testing. Fresher bắt buộc có chứng chỉ tiếng Anh (TOEIC/IELTS/TOEFL/VSTEP) (passviec.com, DXC Vietnam tuyển fresher 5/2025).' },
      { round: 'Vòng 2 — Kiểm tra tiếng Anh (review 2023–2025)', detail: 'HR call hoặc meeting kiểm tra listening/speaking. Một số vị trí yêu cầu tiếng Nhật/Trung. Đây là vòng loại quan trọng vì làm việc với team toàn cầu (note8.vn 2025, voz.vn 2023).' },
      { round: 'Vòng 3 — Phỏng vấn kỹ thuật (review 2023–2025)', detail: 'Với Project Manager/Team Lead/Technical Architect. Hỏi Core Java (OOP 4 tính chất, String immutable, ArrayList vs LinkedList, HashMap internal, Exception handling, Multithreading), Spring/Spring Boot (annotation, bean lifecycle, @Transactional, Tomcat port config, DB connection), Hibernate/JPA (annotations, fetch type, N+1), SQL (LEFT OUTER JOIN, query tuning), REST vs SOAP vs gRPC, Docker (container version mismatch), design patterns (Singleton, Factory, Builder). Junior được hỏi nền tảng OOP/SQL; Senior hỏi sâu architecture, scalability, legacy modernization (GeeksforGeeks 2/2023, Glassdoor 11/2024, voz.vn 2023).' },
      { round: 'Vòng 4 — Managerial / HR / Director (review 2023–2025)', detail: 'Behavioral: cách làm việc, xử lý áp lực, giải quyết critical issue, tối ưu scalability, conflict resolution. Với Senior có thể gặp Director/VP. HR trao đổi kỳ vọng lương, cam kết (fresher 30 tháng), khả năng làm theo giờ khách hàng (passviec.com, GeeksforGeeks 6/2023, note8.vn 2025).' }
    ],
    focus: ['core', 'jvm', 'collections', 'spring', 'jpa', 'db', 'microservices', 'architecture', 'english', 'devops', 'testing', 'behavioral'],
    algoWeight: 0.25,
    englishRequired: true,
    questions: [
      '4 đặc tính OOP: encapsulation, inheritance, polymorphism, abstraction — ví dụ thực tế trong dự án.',
      'ArrayList vs LinkedList: cấu trúc dữ liệu, độ phức tạp thêm/xóa/truy cập, khi nào dùng cái nào.',
      'HashMap internal working: bucket, hash collision, treeify threshold (Java 8+), ConcurrentHashMap khác nhau thế nào.',
      'String immutable: vì sao, StringBuilder vs StringBuffer, string pool.',
      'Spring Boot: cách đổi port Tomcat (server.port), cấu hình DataSource, @Transactional propagation/isolation.',
      'Hibernate/JPA: @Entity, @Table, @OneToMany/@ManyToOne, FetchType.LAZY vs EAGER, N+1 problem và giải pháp.',
      'SQL: LEFT OUTER JOIN vs INNER JOIN, index strategy, transaction isolation level.',
      'REST vs SOAP vs gRPC: ưu nhược điểm, khi nào chọn cái nào cho enterprise integration.',
      'Docker: container chạy version cũ, app version mới — xử lý ra sao (rebuild, rolling update, image tag strategy).',
      'Legacy modernization: kinh nghiệm migration mainframe/COBOL, strangler fig pattern, API gateway.',
      'Behavioral: xử lý critical bug/production issue, conflict với đồng nghiệp/manager, tối ưu performance.',
      'Tiếng Anh: tự giới thiệu, đọc requirement, trao đổi technical cơ bản.'
    ],
    tips: [
      'Ôn chắc Core Java, Spring/Hibernate, SQL — đây là bộ ba được hỏi ở mọi level. Senior thêm architecture, legacy modernization.',
      'Tiếng Anh là bắt buộc: luyện listening/speaking technical, một số dự án yêu cầu tiếng Nhật N2/N3 hoặc tiếng Trung — hỏi rõ recruiter.',
      'Fresher: chuẩn bị TOEIC >800/IELTS >6.0, cam kết 30 tháng, có mentor 1:1, training 3 tháng (trợ cấp 5M/tháng) (DXC Vietnam 5/2025).',
      'WLB tốt, remote/hybrid linh hoạt, nhưng lương tăng chậm, quy trình nội bộ nhiều lớp (bureaucracy) — review Glassdoor 2025 nhắc rõ.',
      'Frame CV nhấn mạnh: vận hành/hiện đại hóa hệ thống legacy, SLA, quy trình, tài liệu, English communication, teamwork đa quốc gia.'
    ],
    pay: [
      { role: 'Middle Java Developer', yoe: '4+ năm', amount: 'thương lượng', year: '2025', note: 'theo Lumirole 2025, Core Java, Servlet/JSP, JDBC, SOAP/REST, Hibernate, Spring, Oracle, MSSQL, design patterns', url: 'https://lumirole.com/job/middle-java-developer-dxc-technology/98882338-1392-4c82-b33e-692d348f4835' },
      { role: 'Fresher Java Developer', yoe: '0 năm', amount: '5tr gross/tháng (trợ cấp training)', year: '2025', note: 'theo DXC Vietnam tuyển 15 vị trí Cobol/Java Fresher 5/2025, training 3 tháng, cam kết 30 tháng, TOEIC >800/IELTS >6.0', url: 'https://fit.sgu.edu.vn/site/dxc-vietnam-tuyen-dung-15-vi-tri-cobol-va-java-fresher_may-2025/' }
    ],
    sources: [
      { title: 'Glassdoor — DXC Technology Software Developer reviews Vietnam (2024–2025)', url: 'https://www.glassdoor.com/Reviews/DXC-Technology-Software-Developer-Vietnam-Reviews-EI_IE1603125.0,14_KO15,33_IL.34,41_IN251.htm' },
      { title: 'GeeksforGeeks — DXC Technology Interview Experience for Java Developer (2/2023)', url: 'https://www.geeksforgeeks.org/interview-experiences/dxc-technology-interview-experience-for-java-developer/' },
      { title: 'voz.vn — Review phỏng vấn DXC Technology (2023, trang 67)', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-67' },
      { title: 'note8.vn — Phỏng vấn DXC Technology Vietnam (2025, 23 phỏng vấn)', url: 'https://note8.vn/phong-van-dn/cong-ty-dxc-technology-service-vietnam-410' },
      { title: 'passviec.com — DXC Technology Vietnam quy trình phỏng vấn 5 bước', url: 'https://passviec.com/companies/dxc/' },
      { title: 'DXC Vietnam tuyển Fresher Cobol/Java (5/2025)', url: 'https://fit.sgu.edu.vn/site/dxc-vietnam-tuyen-dung-15-vi-tri-cobol-va-java-fresher_may-2025/' }
    ],
    confidence: 'high'
  },
  {
    id: 'bosch-global-software-vietnam',
    name: 'Bosch Global Software Technologies Vietnam (BGSV)',
    type: 'bigtech',
    icon: '⚙️',
    summary: 'Bosch Global Software Technologies Vietnam (BGSV) là trung tâm phát triển phần mềm đầu tiên của Bosch tại Đông Nam Á (khởi động 2010), hơn 4.000 associates, thuộc sở hữu 100% Robert Bosch GmbH. Cung cấp giải pháp Engineering, IT, Business Solutions end-to-end cho các sector Mobility, Industrial Technology, Consumer Goods, Energy & Building Technology. Môi trường tiếng Anh, cơ hội onsite toàn cầu, phúc lợi tốt (tháng 13, thưởng năm, bảo hiểm cao cấp, 16+ ngày nghỉ). Đạt Great Place to Work 10 năm liên tiếp, Vietnam Best IT Companies 2024.',
    stack: ['Java', 'Spring Boot', '.NET', 'C#', 'SAP ABAP', 'SAP FI/CO/MM/SD', 'Embedded C/C++', 'AWS', 'Azure', 'GCP', 'Kubernetes', 'Docker', 'Kafka', 'React', 'Angular', 'Microservices', 'CI/CD', 'GitLab'],
    process: [
      { round: 'Vòng 1 — HR screen tiếng Anh (review intern 2024, blog thu4n)', detail: 'HR kiểm tra kỹ năng nói tiếng Anh và xác nhận ứng viên hiểu vị trí ứng tuyển. Thường qua nhanh nếu tiếng Anh giao tiếp được.' },
      { round: 'Vòng 2 — Phỏng vấn kỹ thuật với Tech Lead (review intern 2024, blog thu4n)', detail: 'Phỏng vấn onsite/online, hỏi sâu theo CV. Ví dụ: phân biệt Java/Go/C#, câu hỏi Linux, nguyên tắc OOP, vẽ sơ đồ kiến trúc dự án (Azure Kubernetes Service, OpenFaaS). Review voz.vn (frontend 2024) kể pv bằng tiếng Anh, dự án Angular 2+ / Java Spring.' },
      { round: 'Vòng 3 — (Tuỳ vị trí Senior/Lead) Phỏng vấn thêm với Manager/Architect', detail: 'Một số vị trí cao hơn có vòng bổ sung hỏi system design, kiến trúc phân tán, decision making, leadership. Hỏi recruiter để xác nhận số vòng chính xác cho team cụ thể.' }
    ],
    focus: ['core', 'spring', 'microservices', 'design', 'architecture', 'english', 'devops', 'aws', 'azure'],
    algoWeight: 0.3,
    englishRequired: true,
    questions: [
      'Phân biệt Java, Go, C# về mô hình concurrency, memory management và use case điển hình.',
      'Giải thích kiến trúc dự án bạn đã làm: vẽ sơ đồ, lý do chọn công nghệ, trade-off.',
      'Linux commands cơ bản và cách debug production issue trên Kubernetes.',
      'Nguyên tắc SOLID và ví dụ áp dụng trong codebase Java/Spring thực tế.',
      'Thiết kế API idempotent cho hệ thống thanh toán/giao dịch phân tán.',
      'Spring Boot bean lifecycle, @Transactional propagation/isolation, cách xử lý exception.',
      'Kinh nghiệm với SAP (ABAP/FI/CO/MM/SD) hoặc Embedded C/C++ nếu apply domain tương ứng.',
      'Tự giới thiệu và trình bày dự án bằng tiếng Anh.'
    ],
    tips: [
      'Chuẩn bị tốt phần trình bày dự án (architecture diagram, tech stack, trade-off) — đây là trọng tâm vòng Tech Lead.',
      'Luyện nói tiếng Anh kỹ thuật: tự giới thiệu, giải thích kiến trúc, trả lời behavioral questions.',
      'Ôn Java core, Spring Boot, microservices patterns, Kubernetes, cloud (AWS/Azure/GCP).',
      'Hỏi recruiter rõ team/domain (Enterprise Software, Embedded Automotive, SAP, AI/ML...) để tập trung ôn stack phù hợp.',
      'Môi trường ổn định, WLB tốt, phúc lợi cao — phù hợp muốn phát triển lâu dài tại bigtech sản phẩm.'
    ],
    pay: [
      { role: 'Software Engineer Intern (DevOps, 2024)', yoe: '0 năm', amount: 'không công bố', year: '2024', note: 'Bosch Summer Bootcamp 2024, full-time 2 tháng, có mentor, Udemy for Business miễn phí', url: 'https://thu4n.github.io/posts/bosch-summer-bootcamp' }
    ],
    sources: [
      { title: 'thu4n blog — How I spent my summer as an intern at Bosch (2024)', url: 'https://thu4n.github.io/posts/bosch-summer-bootcamp' },
      { title: 'voz.vn — Tư vấn xin review công ty Bosch (frontend 2024)', url: 'https://voz.vn/t/tu-van-xin-review-cong-ty-bosch.300235' },
      { title: 'Bosch Vietnam — Trang chủ chính thức, BGSW Vietnam 15 năm (10/2025)', url: 'https://e.vnexpress.net/news/business/bosch-bgsw-marks-15-years-of-growth-and-innovation-in-vietnam-4948621.html' },
      { title: 'Bosch Careers — Junior Java Developer (1-3 năm) JD và quy trình', url: 'https://jobs.bosch.com/en/job/REF265809E-eta-3-junior-java-developer-1-3-years-of-experience' },
      { title: 'ITviec — Bosch Global Software Technologies Company Limited (327 reviews, 3.4/5, 74% recommend)', url: 'https://itviec.com/companies/bosch-global-software-technologies-company-limited' },
      { title: 'Bosch Vietnam — Company overview trang chủ (6.000 associates, 6 locations)', url: 'https://www.bosch.com.vn/en/our-company/bosch-in-vietnam' }
    ],
    confidence: 'medium'
  },
  {
    id: 'tiki',
    name: 'Tiki',
    type: 'product',
    icon: '🛍️',
    summary: 'Tiki là nền tảng thương mại điện tử hàng đầu Việt Nam (thành lập 2010, 4.000+ nhân viên), giá trị cốt lõi "Tốt và Nhanh". Đã migrate 70% hệ thống lên Google Cloud (GKE 200+ services), cải thiện hiệu năng API 30% (80ms→55ms), giảm thời gian cấp server từ vài ngày xuống vài phút. Stack backend chính: Java, Go, microservices, Kubernetes, Kafka, Redis, PostgreSQL, MongoDB. Tuyển dụng Senior Backend Engineer (Java/Go) thường xuyên. Môi trường hybrid, phúc lợi tốt, thưởng hiệu suất, culture "Tốt và Nhanh".',
    stack: ['Java', 'Golang', 'Spring Boot', 'Microservices', 'Kubernetes (GKE)', 'Google Cloud', 'Kafka', 'Redis', 'PostgreSQL', 'MongoDB', 'gRPC', 'GraphQL', 'CI/CD', 'Docker', 'Prometheus', 'Grafana', 'Elasticsearch'],
    process: [
      { round: 'Vòng 1 — HR screen', detail: 'Trao đổi kinh nghiệm, kỳ vọng lương, kiểm tra culture fit với giá trị "Tốt và Nhanh".' },
      { round: 'Vòng 2 — Technical interview (backend Java/Go)', detail: 'Hỏi sâu Java/Go core, concurrency, microservices patterns, database (PostgreSQL/MongoDB), system design quy mô nhỏ (service discovery, caching, message queue). Có thể live coding hoặc take-home. Review ITviec (2024–2025) cho thấy kỹ thuật khá rộng.' },
      { round: 'Vòng 3 — System design / Architecture discussion', detail: 'Thiết kế hệ thống e-commerce: catalog, search, order, payment, inventory. Trade-off consistency/availability, scale read/write, idempotency, event-driven architecture.' },
      { round: 'Vòng 4 — Culture fit / Hiring manager', detail: 'Trao đổi với hiring manager về định hướng, cách làm việc, xử lý conflict, alignment giá trị cốt lõi. Có thể gặp team lead hoặc director.' }
    ],
    focus: ['core', 'spring', 'microservices', 'design', 'db', 'concurrency', 'devops', 'architecture', 'scenario'],
    algoWeight: 0.35,
    englishRequired: true,
    questions: [
      'Thiết kế service Product Discovery (catalog, search, recommendation) chịu tải cao: schema, indexing, caching, scale.',
      'Giải thích cách xử lý idempotency cho API đặt hàng/thanh toán khi client retry sau timeout.',
      'So sánh Java và Go cho microservices: khi nào chọn cái nào, trade-off concurrency, memory, developer velocity.',
      'Kubernetes/GKE: cách config deployment, HPA, rolling update, xử lý pod OOM/killed.',
      'Kafka: tại sao dùng, partition strategy, consumer group, exactly-once semantics, xử lý duplicate message.',
      'Database: PostgreSQL vs MongoDB cho catalog/product, indexing strategy, recursive CTE cho category tree.',
      'Microservices communication: sync (gRPC/REST) vs async (Kafka), circuit breaker, distributed tracing.',
      'Câu chuyện incident production: triệu chứng → root cause → fix → preventive measures (review ITviec 2024–2025).'
    ],
    tips: [
      'Ôn sâu Java core, Go concurrency, microservices patterns — Tiki dùng cả hai ngôn ngữ song song.',
      'Luyện system design e-commerce: catalog, search (Elasticsearch), order, payment, inventory, promotion.',
      'Chuẩn bị trình bày incident/post-mortem thực tế: Tiki scale lớn, interviewer quan tâm cách bạn xử lý sự cố.',
      'Tiếng Anh đọc hiểu tài liệu, giao tiếp cơ bản — team có expat, doc tiếng Anh.',
      'Hỏi recruiter team cụ thể (Product Discovery, Transportation, Payment, Platform...) vì stack/domain khác nhau.'
    ],
    pay: [
      { role: 'Senior Backend Engineer (Java/Go)', yoe: '4–6 năm', amount: 'thương lượng (theo JD 2024–2025)', year: '2025', note: 'ITviec reviews 2024–2025 nhắc lương tốt, thưởng performance, tháng 13, hybrid, health check, personal leave', url: 'https://tuyendung.tiki.vn/job_detail?request_id=TIKI_Product%20and%20Engineering_03072024_819' }
    ],
    sources: [
      { title: 'Google Cloud Case Study — Tiki (migrate to GKE, 200+ services, 30% API perf gain)', url: 'https://cloud.google.com/customers/tiki-en' },
      { title: 'Tuyendung.tiki.vn — Trang tuyển dụng chính thức, JD Senior Backend Engineer Java/Go', url: 'https://tuyendung.tiki.vn/job_detail?request_id=TIKI_Product%20and%20Engineering_03072024_819' },
      { title: 'ITviec — Tiki reviews (46 reviews, 2024–2025, lương tốt, hybrid, culture Tốt và Nhanh)', url: 'http://itviec.com/companies/tiki/review' },
      { title: 'e27 — How Tiki manages its hiring process (culture fit, internal headhunting, competitive pay)', url: 'https://e27.co/how-tiki-manages-its-hiring-process-20200813' }
    ],
    confidence: 'medium'
  },
  {
    id: 'wizeline-vietnam',
    name: 'Wizeline Vietnam',
    type: 'service',
    icon: '🌐',
    summary: 'Wizeline là công ty product development toàn cầu (HQ Mỹ, 500+ nhân viên), delivery center tại HCMC từ 2016. Làm việc cho khách hàng enterprise (AirAsia, Arc XP/Washington Post, True Digital, Mastercard...). Đặc trưng: pair programming, problem-solving capabilities thay vì ngôn ngữ cụ thể, tiếng Anh là ngôn ngữ làm việc chính. Glassdoor HCMC 3.8/5, 80% recommend (22 reviews 2025). Dataford (192 reports 2026): 6 vòng, difficulty 5.1/10, offer rate 51%. Stack đa dạng: Java, JavaScript/React, Node, Go, Python, AWS, Kafka, Kubernetes, Docker, GCP.',
    stack: ['Java', 'Spring Boot', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Go', 'Python', 'AWS', 'GCP', 'Kubernetes', 'Docker', 'Kafka', 'Kinesis', 'DynamoDB', 'Aurora', 'Elasticsearch', 'ElastiCache', 'Lambda', 'ECS', 'CI/CD', 'Terraform', 'GitLab', 'JUnit', 'Mockito', 'Cypress'],
    process: [
      { round: 'Vòng 1 — Recruiter call (Talent Ambassador)', detail: '30 phút: giới thiệu Wizeline, hỏi background, technical skills, career goals, kiểm tra tiếng Anh. PDF chính thức Wizeline nêu rõ vòng này.' },
      { round: 'Vòng 2 — HR screening + English evaluation', detail: 'Kiểm tra tiếng Anh sâu hơn (reading, speaking), alignment kỳ vọng, culture fit sơ bộ. Dataford 2026 ghi nhận vòng này tách biệt.' },
      { round: 'Vòng 3 — Technical screening (pair programming / coding)', detail: '1–2 bài coding easy-medium (có thể chọn ngôn ngữ), focus problem-solving, communication. Wizeline PDF: "We don\'t focus on specific languages... focus on problem-solving capabilities".' },
      { round: 'Vòng 4 — On-site / Virtual full day (4 technical sessions)', detail: 'Theo PDF Wizeline SWE: Debugging (tìm bug CSV reader), Design (test strategy trên whiteboard), Pair Programming (code review/refactor legacy PHP/Java), Architectural Discussion (design system ingest/process/store real-time analytics). Mỗi session ~1 giờ.' },
      { round: 'Vòng 5 — Decision & Offer', detail: 'Hiring team đánh giá toàn bộ insights, Talent Ambassador phản hồi next business day. Dataford: 2–4 weeks total.' }
    ],
    focus: ['design', 'microservices', 'core', 'english', 'behavioral', 'architecture', 'devops', 'testing', 'scenario'],
    algoWeight: 0.5,
    englishRequired: true,
    questions: [
      'Pair programming: review legacy Java/PHP codebase, chỉ ra 2 performance bottlenecks và refactor để cải thiện readability/execution speed.',
      'Debugging: code đọc CSV crash khi gặp malformed row — locate bug và viết robust solution.',
      'Design: propose test strategy cho scenario cho trước (whiteboard), cover unit/integration/e2e, tools, processes.',
      'Architectural discussion: design system ingest/process/store large-volume real-time analytical data (Kafka, stream processing, storage).',
      'System design: optimize nested DB queries/API calls causing latency in backend service.',
      'Microservices patterns: saga, outbox, circuit breaker, distributed tracing (Wizeline case study Arc XP: Kafka MSK, DynamoDB, Aurora).',
      'AWS/GCP: Lambda, ECS, DynamoDB, Aurora, Kinesis — khi nào chọn managed service vs self-hosted.',
      'Behavioral: strength/weakness, challenge solved, career goals, why Wizeline (culture: continuous learning, self-organization, technical excellence).'
    ],
    tips: [
      'Tập trung pair programming: nói to suy nghĩ, code sạch, thêm test/edge case, giải thích trade-off — Wizeline đánh giá quá trình, không chỉ đáp án.',
      'Tiếng Anh là bắt buộc: luyện speaking technical, trình bày thiết kế, hỏi clarification khi pair programming.',
      'Ôn system design thực tế (event-driven, stream processing, microservices) thay vì chỉ LeetCode.',
      'Đọc case study Wizeline (Arc XP, AirAsia) để hiểu stack và scale thực tế.',
      'Chuẩn bị câu hỏi ngược cho Talent Ambassador: project types, career path, certification support (AWS/GCP/K8s miễn phí).'
    ],
    pay: [
      { role: 'Software Engineer (Mid/Senior, tham khảo quốc tế)', yoe: '3–5 năm', amount: 'không công bố VN', year: '2026', note: 'Glassdoor HCMC 2025: "High salary, fair, opportunities", Dataford 192 reports offer rate 51%; VN thường thấp hơn US/Mexico, hỏi recruiter range cụ thể', url: 'https://www.glassdoor.com/Reviews/Wizeline-Ho-Chi-Minh-City-Reviews-EI_IE868055.0,8_IL.9,25_IM1746.htm' }
    ],
    sources: [
      { title: 'Wizeline Official PDF — Interviewing at Wizeline for Software Engineer (pair programming, debugging, design, architecture)', url: 'https://cdn.wizeline.com/uploads/2020/06/Interviewing-At-Wizeline-for-SWE-1.pdf' },
      { title: 'Dataford — Wizeline Interview Process 2026 (192 reports, 6 rounds, difficulty 5.1/10, offer rate 51%)', url: 'https://dataford.io/interview-guides/wizeline' },
      { title: 'PracHub — Wizeline Software Engineer Interview Questions Guide 2026', url: 'https://prachub.com/interview-guide/wizeline-software-engineer-interview-questions-guide-2026' },
      { title: 'Wizeline Blog — Behind the Scenes of Wizeline APAC: AirAsia Superapp (Java, Go, Python, AWS, Kafka)', url: 'https://www.wizeline.com/behind-the-scenes-of-wizeline-apac-collaborating-to-expand-improve-airasias-superapp' },
      { title: 'Glassdoor — Wizeline Ho Chi Minh City Reviews (22 reviews, 3.8/5, 80% recommend, 2025)', url: 'https://www.glassdoor.com/Reviews/Wizeline-Ho-Chi-Minh-City-Reviews-EI_IE868055.0,8_IL.9,25_IM1746.htm' },
      { title: 'Wizeline Blog — Celebrating 5 Years of Wizeline Vietnam (2021, history, growth, certifications)', url: 'https://www.wizeline.com/celebrating-5-years-of-wizeline-vietnam' }
    ],
    confidence: 'high'
  },
  {
    id: 'trusting-social',
    name: 'Trusting Social',
    type: 'fintech',
    icon: '💳',
    summary: 'Trusting Social là AI Fintech pioner (HQ Singapore, team engineering 50+ người tại HCMC Quận 1), sứ mệnh "Advancing AI to Meet the Financial Needs of Everyday Consumers with Empathy". Đã assess 1 tỷ+ consumers across 4 quốc gia (VN, ID, IN, PH), mục tiêu 100 triệu credit lines. Sản phẩm chính: Digital Onboarding Platform (DOP - automate 100% registration/approval/decision), EVO Platform (instant credit decision + card issuance), Co-Lending partnership với ngân hàng. Stack: Go, Java, Python, Flutter, Rust, Scala, Elixir, Kubernetes, Docker, AWS, GCP. Culture: ownership, integrity, agility, AI-native development, WLB tốt (hybrid 2 days office, lunch provided, happy hour Thứ 5).',
    stack: ['Go', 'Java', 'Spring Boot', 'Python', 'Flutter', 'Rust', 'Scala', 'Elixir', 'Kubernetes', 'Docker', 'AWS', 'GCP', 'Kafka', 'gRPC', 'PostgreSQL', 'Redis', 'MongoDB', 'CI/CD', 'GitLab', 'Prometheus', 'Grafana', 'OpenTelemetry', 'WebRTC', 'LiveKit', 'LLM/AI Agents'],
    process: [
      { round: 'Vòng 1 — Recruiter / HR screen', detail: 'Trao đổi background, tech stack (Go/Java/Python), kiểm tra tiếng Anh (môi trường đa quốc gia, HQ Singapore). JD Backend Engineer (Go, Java) nêu rõ 5+ năm exp, BS/MS CS.' },
      { round: 'Vòng 2 — Technical interview (Backend/Platform)', detail: 'Hỏi sâu Go/Java concurrency, microservices, scalable API design (millions transactions/day), database optimization, lock-free algorithms, CI/CD, Kubernetes. Senior Backend Engineer AGI JD nêu: low-latency APIs cho realtime AI Agents, optimize DB calls, lock-free orchestration.' },
      { round: 'Vòng 3 — System design / Architecture', detail: 'Thiết kế Digital Onboarding Platform hoặc EVO: idempotency, fault-tolerance, bank integration, event-driven, data consistency, security/compliance (PCI-DSS, data privacy).' },
      { round: 'Vòng 4 — Culture fit / Hiring manager / Director', detail: 'Trao đổi với Engineering Manager hoặc Director (Siddharth Ravichandran - Senior Director): ownership, integrity, agility values, behavioral, career goals. AmbitionBox 2025: 3.5/5, culture/WLB rating cao.' }
    ],
    focus: ['core', 'microservices', 'design', 'db', 'concurrency', 'scenario', 'english', 'architecture', 'devops', 'ai'],
    algoWeight: 0.35,
    englishRequired: true,
    questions: [
      'Thiết kế API idempotent cho Digital Onboarding Platform: client retry sau timeout, tránh duplicate approval/decision.',
      'Go vs Java cho high-throughput microservices: concurrency model (goroutine vs virtual thread), memory, latency, khi nào chọn cái nào.',
      'Lock-free algorithms cho orchestration AI Agents: CAS, atomic operations, verschillende patterns, trade-off complexity vs performance.',
      'Database optimization cho low-latency realtime voice agents: connection pooling, query optimization, read replicas, caching strategy.',
      'Event-driven architecture cho Co-Lending partnership: Kafka, saga pattern, outbox pattern, exactly-once, reconciliation với ngân hàng.',
      'Kubernetes/GCP/AWS: deploy canary/blue-green, HPA, observability (OpenTelemetry, Prometheus, Grafana), chaos engineering.',
      'Security/Compliance fintech: PCI-DSS, data encryption, PII protection, audit logging, consumer data privacy (GDPR/PDPA).',
      'AI-native development: cách dùng coding agents (Cursor, Claude Code, Copilot) trong workflow hàng ngày, eval/harness cho LLM output.'
    ],
    tips: [
      'Chuẩn bị mạnh Go/Java concurrency, microservices patterns, scalable API design — đây là core stack backend.',
      'Luyện system design fintech: idempotency, ledger, audit trail, reconciliation, bank integration, compliance.',
      'Tiếng Anh bắt buộc: HQ Singapore, team đa quốc gia, doc/code review tiếng Anh.',
      'Nắm vững AI/LLM application thực tế: RAG, agents, eval, voice AI (ASR/TTS) — Trusting Social đầu tư mạnh AGI.',
      'Culture fit quan trọng: ownership (chủ động end-to-end), integrity (đúng/thẳng), agility (nhanh, lặp lại) — chuẩn bị ví dụ STAR thể hiện 3 giá trị này.'
    ],
    pay: [
      { role: 'Backend Engineer (Go, Java) - DOP/EVO', yoe: '5+ năm', amount: 'thương lượng (theo JD 2025)', year: '2025', note: 'JD nêu generous leave, central D1 office near metro, lunch, Grab allowance, happy hour Thứ 5, unlimited coffee/snacks', url: 'https://trustingsocial.com/careers/openings/backend-engineer-(go-java)-dop-674454' },
      { role: 'Senior Backend Engineer - AGI', yoe: '4+ năm', amount: 'thương lượng (theo JD 2025)', year: '2025', note: 'Low-latency APIs cho realtime AI Agents, lock-free algorithms, AI-native delivery', url: 'https://trustingsocial.com/careers/openings/senior-backend-engineer-agi-674227' }
    ],
    sources: [
      { title: 'Trusting Social Careers — Backend Engineer (Go, Java) DOP JD (2025)', url: 'https://trustingsocial.com/careers/openings/backend-engineer-(go-java)-dop-674454' },
      { title: 'Trusting Social Careers — Senior Backend Engineer AGI JD (2025)', url: 'https://trustingsocial.com/careers/openings/senior-backend-engineer-agi-674227' },
      { title: 'Trusting Social Careers — Full-Stack AI Engineer JD (2025)', url: 'https://trustingsocial.com/careers/openings/full-stack-ai-engineer-701894' },
      { title: 'ITviec — Director of Engineering Fintech Trusting Social (2025, 50-person team, Java/Python/Node.js, microservices, AI, big data)', url: 'https://itviec.com/it-jobs/director-of-engineering-fintech-trusting-social-2541' },
      { title: 'AmbitionBox — Trusting Social Reviews (5 reviews, 3.5/5, culture 4.9, WLB 4.9, 2025)', url: 'https://www.ambitionbox.com/reviews/trusting-social-reviews' },
      { title: 'Clodura.AI — Trusting Social Tech Stack (Go, Java, Python, Rust, Scala, Elixir, K8s, AWS, GCP, Kafka)', url: 'https://www.clodura.ai/directory/company/trusting-social' }
    ],
    confidence: 'medium'
  }
];
