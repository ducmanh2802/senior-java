# AWS Pro track (`#/aws`): SAP-C02 + DOP-C02 trong 6 tháng

Mục tiêu người học: dev Java ~4 năm, ít kinh nghiệm cloud. Trong 26 tuần thi đỗ
**AWS Certified Solutions Architect – Professional (SAP-C02)** (khoảng tuần 16), rồi
**AWS Certified DevOps Engineer – Professional (DOP-C02)** (khoảng tuần 26).
Hai kỳ thi đều có 75 câu, 180 phút, thang điểm 100–1000, đậu ở 750, câu hỏi dạng tình huống
một đáp án hoặc nhiều đáp án. Domain và trọng số phải lấy theo **exam guide chính thức hiện hành**
(kiểm tra lại trên trang AWS Certification trước khi viết).

## Dữ liệu

### `js/data/aws-plan.js` → `window.AWS_PLAN`
```js
window.AWS_PLAN = {
  exams: [
    { id: 'sap-c02', name: 'Solutions Architect – Professional', code: 'SAP-C02', minutes: 180, questions: 75, pass: 750,
      guide: 'https://…official exam guide…',
      domains: [{ id: 'sap-d1', name: 'Design Solutions for Organizational Complexity', weight: 26 }, …] },
    { id: 'dop-c02', … domains: [{ id: 'dop-d1', … }, …] },
  ],
  weeks: [
    { n: 1, exam: 'sap-c02', title: '…', domains: ['sap-d1'],
      goals: ['…'],                          // 2–5 mục
      study: [{ title: '…', url: 'https://…' }],   // tài liệu chính thức: docs/whitepaper/FAQ/re:Invent; chỉ link chắc chắn tồn tại
      lab: `markup: bài thực hành hands-on trên AWS (Free Tier/chi phí thấp, kèm bước dọn dẹp)`,
      practice: 15 },                        // số câu luyện gợi ý trong tuần
    …                                        // đủ 26 tuần
  ],
};
```

### `js/data/aws-sap-1.js`, `aws-sap-2.js`, `aws-dop-1.js`, `aws-dop-2.js` → `window.AWS_QUESTIONS`
```js
(window.AWS_QUESTIONS = window.AWS_QUESTIONS || []).push(
{
  id: 'sap-001',                 // sap-NNN / dop-NNN, duy nhất
  exam: 'sap-c02',               // 'sap-c02' | 'dop-c02'
  domain: 'sap-d1',              // id domain có trong AWS_PLAN
  q: `stem TIẾNG ANH, văn phong giống đề thật: bối cảnh công ty, ràng buộc (chi phí, vận hành ít nhất, RTO/RPO…), câu hỏi "Which solution…?"`,
  options: ['…', '…', '…', '…'],  // tiếng Anh; 4 (một đáp án) hoặc 5–6 (nhiều đáp án)
  answer: 2,                      // hoặc [0, 3] khi multi
  multi: true,                    // chỉ khi nhiều đáp án; q phải ghi "(Choose two.)" / "(Choose three.)"
  explain: `markup TIẾNG VIỆT (thuật ngữ giữ tiếng Anh): vì sao đáp án đúng, vì sao TỪNG phương án sai, từ khoá trong đề dẫn tới đáp án, > Exam tip: …`,
  services: ['AWS Organizations', 'SCP'],   // 1–6 tên dịch vụ
  refs: [{ type: 'doc', title: '…', url: 'https://docs.aws.amazon.com/…' }]   // tuỳ chọn, ≤ 3, chỉ link chắc chắn
},
);
```
Markup và bẫy template literal: xem AGENTS.md mục 5 (không backtick, không `${`).
Kiểm tra: `node scripts/check-aws.js` (schema, id trùng, domain hợp lệ, answer hợp lệ, "(Choose N.)").

## Màn hình `#/aws` (`js/views/aws.js`, `css/views/aws.css`)
- **Tổng quan**: ngày bắt đầu (người dùng chọn) → tuần hiện tại, ngày thi dự kiến của từng exam, % tuần đã xong,
  điểm luyện theo domain (thanh tiến độ, so với mốc 75%).
- **Kế hoạch 26 tuần**: mỗi tuần mở ra goals / study links / lab / nút "Luyện N câu của tuần"; tick hoàn thành.
- **Luyện tập**: chọn exam + domain (hoặc "câu sai trước đây"), làm từng câu, xem giải thích ngay.
- **Thi thử**: 75 câu (hoặc toàn bộ pool nếu ít hơn), đồng hồ 180 phút, không xem giải thích tới khi nộp;
  kết quả quy đổi thang 1000 + điểm theo domain + xem lại từng câu.
- Lưu trong `App.store.data.aws = { start, done: { '<week n>': true }, answers: { '<qid>': { ok, at } }, mocks: [...] }`.
