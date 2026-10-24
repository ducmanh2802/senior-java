/*
 * Learning path Java junior → Senior: ordered stages, each unlocks after the previous one (see tasks/T137).
 * Stage = { id: 'path-NN', order, phase: 'Nền tảng'|'Vững vàng'|'Senior', title, weeks: '1–2', goal: `markup`,
 *           lessons: [lesson ids], questions: [bank question ids, 4–8 "câu chốt chặng"], quizTopics: [topic ids],
 *           requires: [stage ids] }
 * A stage is done when every lesson is 'known' and ≥ 70% of its questions are 'known'.
 */
window.PATH = [
  {
    id: 'path-01', order: 1, phase: 'Nền tảng', title: 'Java core chắc tay', weeks: '1–2',
    goal: 'Hiểu exception, generics, String và immutability đủ để giải thích bằng lời, không chỉ dùng được.',
    lessons: ['lesson-core-001', 'lesson-core-002', 'lesson-core-005', 'lesson-core-003'],
    questions: [], quizTopics: ['core'], requires: [],
  },
  {
    id: 'path-02', order: 2, phase: 'Nền tảng', title: 'Collections từ bên trong', weeks: '3–4',
    goal: 'Biết HashMap, ArrayList, TreeMap, PriorityQueue chạy thế nào bên trong và chọn đúng cấu trúc.',
    lessons: ['lesson-collections-001', 'lesson-collections-002', 'lesson-collections-004', 'lesson-collections-005'],
    questions: [], quizTopics: ['collections'], requires: ['path-01'],
  },
];
