/* Multiple-choice bank for the "Trắc nghiệm" view — owner: task T12. Format: see AGENTS.md */
(window.QUIZ = window.QUIZ || []).push(
{
  id: 'qz-collections-001',
  topic: 'collections',
  q: 'Từ Java 8, khi một bucket của {{HashMap}} có quá nhiều phần tử, điều gì xảy ra?',
  options: [
    'Bucket được chuyển từ linked list sang red-black tree khi đạt ngưỡng 8 (và table ≥ 64)',
    'HashMap ném ConcurrentModificationException',
    'HashMap luôn resize gấp đôi ngay lập tức',
    'Các phần tử mới bị bỏ qua'
  ],
  answer: 0,
  explain: `{{TREEIFY_THRESHOLD = 8}}: bucket chuyển thành tree để tra cứu O(log n) thay vì O(n). Nếu table còn nhỏ hơn {{MIN_TREEIFY_CAPACITY = 64}} thì HashMap resize thay vì treeify.`
}
);
