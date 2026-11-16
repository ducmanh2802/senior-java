# T2179 — 30 câu luyện thi CCAR-P (Architect Professional): domain Eval & Optimization, Governance & Risk

Status: DONE
Agent: kilo
Owns: `js/data/quiz-ccap-1.js`
After: T2178

## Bối cảnh
Người học muốn pass các chứng chỉ Claude của Anthropic trong 3 tháng. Đề thật: 120 phút, câu **tình huống** multiple-choice / multiple-response (đề ghi rõ chọn mấy), thang 1000, đậu 720, thi bằng **tiếng Anh**. Đối tượng CCAR-P (Architect Professional): kiến trúc sư giải pháp sở hữu hệ thống Claude end-to-end trong doanh nghiệp — tích hợp, thiết kế, đánh giá/tối ưu chi phí-độ trễ-chất lượng, governance & risk, làm việc với stakeholder, vận hành. Câu khó, nhiều ràng buộc, chọn phương án TỐT NHẤT.
App có đề thi thử `ccar-p` trong `js/data/exams.js`: câu thuộc domain nào phải có tag **`[Tên domain]` ở đầu `q``, đúng y tên domain trong exams.js.

## Việc cần làm
Đã thêm **30 câu** vào `js/data/quiz-ccap-1.js` (trước dòng `);` cuối file), chia đều cho các domain: `[Eval & Optimization]`, `[Governance & Risk]`.
- 30 câu id nối tiếp: `qz-ccap-086` đến `qz-ccap-115`, topic: `'claude'`.
- `q` và `options` bằng **tiếng Anh** (giống đề thật), dạng tình huống thực tế 2–4 câu ("A support team… Which approach…?"), không hỏi định nghĩa suông.
- Khoảng 1/4 (`8 câu`) là `multi: true` với "(Choose 2)" (4–6 options, answer là mảng tăng dần 2 index). Câu đơn đáp án: đúng 4 options, answer 0..3, rải đều vị trí.
- `explain` bằng **tiếng Việt**: vì sao đáp án đúng + vì sao TỪNG phương án sai; thuật ngữ giữ tiếng Anh.
- Nguồn kiến thức (chỉ dùng điều bạn CHẮC CHẮN đúng theo tài liệu chính thức của Anthropic: docs.claude.com / docs.anthropic.com, code.claude.com/docs, modelcontextprotocol.io, các khoá Anthropic Academy trên anthropic.skilljar.com). **Không bịa** tên tính năng, tham số API, giới hạn, giá, tên model.

## Nghiệm thu
`node --check js/data/quiz-ccap-1.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.`
Xong: `Status: DONE`, Notes ghi số câu theo từng domain.

## Notes
Them 30 cau quiz vao quiz-ccap-1.js: 15 Eval & Optimization + 15 Governance & Risk.
Single-answer: 22 cau, 4 options each, answer 0-3 phan bon vou (0: 6x, 1: 6x, 2: 5x, 3: 5x).
Multi-select: 8 cau, "(Choose 2)" trong q, 4 options, answer la mang 2 index tang dan.

Domain breakdown:
- [Eval & Optimization]: 11 single-answer (qz-086 to qz-096) + 4 multi-select (qz-108 to qz-111) = 15 cau
- [Governance & Risk]: 11 single-answer (qz-097 to qz-107) + 4 multi-select (qz-112 to qz-115) = 15 cau

Tong hop: 30 cau da them thanh cong, validation OK.
Reviewed-by: kilo (T2179R)
