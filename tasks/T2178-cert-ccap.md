# T2178 — 30 câu luyện thi CCAR-P (Architect Professional): domain Enterprise Integration, Solution Design

Status: DONE
Agent: kilo
Owns: `js/data/quiz-ccap-1.js`

## Bối cảnh
Người học muốn pass các chứng chỉ Claude của Anthropic trong 3 tháng. Đề thật: 120 phút, câu **tình huống** multiple-choice / multiple-response (đề ghi rõ chọn mấy), thang 1000, đậu 720, thi bằng **tiếng Anh**. Đối tượng CCAR-P (Architect Professional): kiến trúc sư giải pháp sở hữu hệ thống Claude end-to-end trong doanh nghiệp — tích hợp, thiết kế, đánh giá/tối ưu chi phí-độ trễ-chất lượng, governance & risk, làm việc với stakeholder, vận hành. Câu khó, nhiều ràng buộc, chọn phương án TỐT NHẤT.
App có đề thi thử `ccar-p` trong `js/data/exams.js`: câu thuộc domain nào phải có tag **`[Tên domain]` ở đầu `q`**, đúng y tên domain trong exams.js.

## Việc cần làm
Thêm **30 câu** vào `js/data/quiz-ccap-1.js` (trước dòng `);` cuối file), chia đều cho các domain: `[Enterprise Integration]`, `[Solution Design]`.
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
- Đã thêm 30 câu vào `js/data/quiz-ccap-1.js`:
  - **Enterprise Integration: 15 câu** (`qz-ccap-056`, 058, 061–066, 068, 070, 072–075, 077, 079, 082, 084).
  - **Solution Design: 15 câu** (`qz-ccap-057`, 059–060, 067, 069, 071, 076, 078, 080–081, 083, 085).
  - Tổng 8 câu `multi: true` (4 Enterprise Integration + 4 Solution Design), mỗi câu 2–3 đáp án, có ghi "(Choose N)".
- **Lưu ý id:** tiền tố `qz-ccap-` đã bị `quiz-cca-3.js` dùng cho id 001–055 (task T1518). Để tránh trùng id (validator báo lỗi "quiz id thiếu hoặc trùng"), 30 câu mới được đánh số tiếp **056–085** thay vì 001–030.
- Tất cả `q`/`options` bằng tiếng Anh (dạng tình huống 2–4 câu), `explain` bằng tiếng Việt: giải thích vì sao đáp án đúng + vì sao từng phương án sai, giữ thuật ngữ tiếng Anh.
- Không dùng backtick, không dùng `${`; inline code dùng `{{cache_control}}` / `{{tool_result}}`.
- Nghiệm thu: `node --check js/data/quiz-ccap-1.js` → OK; `node scripts/build-light-index.js` → ghi `js/data/index-light.js`; `node scripts/validate.js` → **OK — không có lỗi.** (exit 0).
Reviewed-by: kilo (T2178R)
