/*
 * Đề thi thử (#/exam/<id>) — registry dùng chung cho js/views/exam.js. Câu hỏi bốc từ window.QUIZ.
 *   id        — dùng trong URL #/exam/<id> và khoá lịch sử (quizHistory: mode 'exam', topic = id)
 *   topics    — { topicId: trọng số } — domain = chủ đề, số câu mỗi domain ≈ count × w / Σw (thiếu thì bù domain khác)
 *   domains   — (tuỳ chọn, chỉ khi 1 topic) { '<Tag>': trọng số } — domain lấy từ tag "[Tag]" đầu câu hỏi
 *   count / minutes — số câu và thời gian khi ngân hàng đủ (thiếu câu thì giờ giảm theo tỉ lệ, tối thiểu 10 phút)
 *   passPct   — mốc đậu theo % đúng; HOẶC passScore (thang mô phỏng 100–1000) cho đề kiểu chứng chỉ
 *   lang      — (tuỳ chọn) 'en' nếu nội dung đề bằng tiếng Anh
 * Kiểm tra bởi scripts/validate.js.
 */
window.EXAMS = [
  {
    id: 'claude',
    title: 'Chứng chỉ Claude (CCDV-F)',
    icon: '🤖',
    desc: 'Mô phỏng đề Claude Certified Developer: 8 domain theo trọng số đề thật, thang 1000.',
    topics: { claude: 1 },
    // Trọng số domain theo các trang ôn thi CCDV-F (bên thứ ba)
    domains: { 'Applications': 33, 'Model Selection': 17, 'Agents': 15, 'Prompt': 11, 'Tools': 11, 'Security': 8, 'Claude Code': 3, 'Eval': 2 },
    count: 53, minutes: 120, passScore: 720,
  },
  {
    id: 'java-core',
    title: 'Java Core',
    icon: '☕',
    desc: 'Java core, Collections, Java hiện đại (17/21), Concurrency, JVM & GC.',
    topics: { core: 20, collections: 20, modern: 15, concurrency: 25, jvm: 20 },
    count: 25, minutes: 35, passPct: 70,
  },
  {
    id: 'spring',
    title: 'Spring & dữ liệu',
    icon: '🌱',
    desc: 'Spring/Spring Boot, JPA/Hibernate, cơ sở dữ liệu, thiết kế API.',
    topics: { spring: 30, jpa: 25, db: 20, api: 25 },
    count: 20, minutes: 30, passPct: 70,
  },
  {
    id: 'system-design',
    title: 'System Design & kiến trúc',
    icon: '🏗️',
    desc: 'System design, kiến trúc phần mềm, microservices, tình huống production.',
    topics: { design: 30, architecture: 25, microservices: 25, scenario: 20 },
    count: 20, minutes: 30, passPct: 70,
  },
  {
    id: 'devops-cloud',
    title: 'DevOps, Cloud & Security',
    icon: '☁️',
    desc: 'CI/CD, container/Kubernetes, AWS, bảo mật ứng dụng.',
    topics: { devops: 35, aws: 35, security: 30 },
    count: 20, minutes: 30, passPct: 70,
  },
];
