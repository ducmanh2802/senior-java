# T2181 — 15 câu luyện thi CCAR-P (Architect Professional): domain Operational Enablement

Status: DONE
Agent: kilo
Owns: `js/data/quiz-ccap-1.js`
After: T2180

## Bối cảnh
Người học muốn pass các chứng chỉ Claude của Anthropic trong 3 tháng. Đề thật: 120 phút, câu **tình huống** multiple-choice / multiple-response (đề ghi rõ chọn mấy), thang 1000, đậu 720, thi bằng **tiếng Anh**. Đối tượng CCAR-P (Architect Professional): kiến trúc sư giải pháp sở hữu hệ thống Claude end-to-end trong doanh nghiệp — tích hợp, thiết kế, đánh giá/tối ưu chi phí-độ trễ-chất lượng, governance & risk, làm việc với stakeholder, vận hành. Câu khó, nhiều ràng buộc, chọn phương án TỐT NHẤT.
App có đề thi thử `ccar-p` trong `js/data/exams.js`: câu thuộc domain nào phải có tag **`[Tên domain]` ở đầu `q`**, đúng y tên domain trong exams.js.

## Việc cần làm
Thêm **15 câu** vào `js/data/quiz-ccap-1.js` (trước dòng `);` cuối file), chia đều cho các domain: `[Operational Enablement]`.
- id: `qz-ccap-NNN` nối tiếp số lớn nhất đã có trong file (file rỗng → bắt đầu 001). topic: `'claude'`.
- `q` và `options` bằng **tiếng Anh** (giống đề thật), dạng tình huống thực tế 2–4 câu ("A support team… Which approach…?"), không hỏi định nghĩa suông.
- Khoảng 1/4 là `multi: true` với "(Choose 2)" (4–6 options, answer là mảng tăng dần). Câu 1 đáp án: đúng 4 options, answer 0..3, rải đều vị trí.
- `explain` bằng **tiếng Việt**: vì sao đáp án đúng + vì sao TỪNG phương án sai; thuật ngữ giữ tiếng Anh.
- Nguồn kiến thức (chỉ dùng điều bạn CHẮC CHẮN đúng theo tài liệu chính thức của Anthropic: docs.claude.com / docs.anthropic.com, code.claude.com/docs, modelcontextprotocol.io, các khoá Anthropic Academy trên anthropic.skilljar.com). **Không bịa** tên tính năng, tham số API, giới hạn, giá, tên model. Chi tiết nào không chắc → hỏi ở mức nguyên lý/best practice thay vì chi tiết.
- Đọc 3–4 câu mẫu trong `js/data/quiz-cca-2.js` (cùng định dạng) trước khi viết; không trùng ý với câu đã có trong các file quiz-cca-*.js, quiz-claude.js.

## Luật
- AGENTS.md mục "Câu trắc nghiệm" và mục 5 (không backtick, không ký hiệu đô-la + ngoặc nhọn). Chỉ thêm, không sửa câu cũ. Không commit.

## Nghiệm thu
`node --check js/data/quiz-ccap-1.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.`
Xong: `Status: DONE`, Notes ghi số câu theo từng domain.

## Notes
- Đã thêm 15 câu trắc nghiệm vào js/data/quiz-ccap-1.js, id qz-ccap-146 → qz-ccap-160 (tiếp theo số lớn nhất qz-ccap-145).
- Tất cả 15 câu gắn tag "[Operational Enablement]" đầu q, topic 'claude', q và options tiếng Anh (tình huống thực tế), explain tiếng Việt.
- 4 câu multi: true với "(Choose 2)" (qz-ccap-157, 158, 159, 160), 11 câu đơn đáp án; vị trí đáp án đã phân tán.
- Không trùng ý với câu đã có trong quiz-cca-*.js, quiz-claude.js; kiến thức chỉ lấy từ nguồn chắc chắn (docs.anthropic.com, docs.claude.com, code.claude.com/docs, modelcontextprotocol.io).
- node --check OK; node scripts/build-light-index.js OK; node scripts/validate.js → OK — không có lỗi.
Reviewed-by: kilo (T2181R)
