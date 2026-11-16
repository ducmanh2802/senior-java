# T2180 — 30 câu luyện thi CCAR-P (Architect Professional): domain Stakeholder & Lifecycle, Models & Context

Status: DONE
Agent: kilo
Owns: `js/data/quiz-ccap-1.js`
After: T2179

## Bối cảnh
Người học muốn pass các chứng chỉ Claude của Anthropic trong 3 tháng. Đề thật: 120 phút, câu **tình huống** multiple-choice / multiple-response (đề ghi rõ chọn mấy), thang 1000, đậu 720, thi bằng **tiếng Anh**. Đối tượng CCAR-P (Architect Professional): kiến trúc sư giải pháp sở hữu hệ thống Claude end-to-end trong doanh nghiệp — tích hợp, thiết kế, đánh giá/tối ưu chi phí-độ trễ-chất lượng, governance & risk, làm việc với stakeholder, vận hành. Câu khó, nhiều ràng buộc, chọn phương án TỐT NHẤT.
App có đề thi thử `ccar-p` trong `js/data/exams.js`: câu thuộc domain nào phải có tag **`[Tên domain]` ở đầu `q`**, đúng y tên domain trong exams.js.

## Việc cần làm
Thêm **30 câu** vào `js/data/quiz-ccap-1.js` (trước dòng `);` cuối file), chia đều cho các domain: `[Stakeholder & Lifecycle]`, `[Models & Context]`.
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

- Đã thêm 30 câu `qz-ccap-116` … `qz-ccap-145` vào `js/data/quiz-ccap-1.js` (file đã có sẵn 60 câu tới `qz-ccap-115` từ T2178–T2179; lần chạy trước của task này bị gián đoạn sau khi thêm 116–145 nhưng chưa validate/cập nhật status).
- Chia domain: `[Stakeholder & Lifecycle]` 15 câu (116–130), `[Models & Context]` 15 câu (131–145). 8 câu `multi: true` dạng "(Choose 2)" (118, 122, 126, 130, 133, 137, 141, 143) ≈ 1/4; các câu còn lại 4 options, answer rải đều (0×6, 1×7, 2×5, 3×4).
- Q đã sửa từ lần chạy trước bị lỗi: `qz-ccap-131` answer sai (3 → 2, đáp án đúng là "smallest, fastest, cheapest model"); `qz-ccap-137` answer sai ([1,3] → viết lại thành câu mới về map-reduce vì trùng `qz-ccap-081`); viết lại các câu trùng ý câu đã có: `qz-ccap-138` (trùng 072 → model version pinning), `qz-ccap-143` (trùng 089 → chất lượng đa ngôn ngữ), `qz-ccap-145` (trùng 134 → hybrid retrieval); sửa text lỗi ("giúpXX", "modèles", "ngcreasing", "tonicoses", "liên minh thông tin", "ít lệnh ví dụ"…) và "kíp" → "nhóm".
- Nội dung chỉ dùng kiến thức chắc chắn (stateless API, prompt caching, RAG/retrieval, tool use, system prompt, temperature, model version pinning, hybrid retrieval, map-reduce); tránh chi tiết model/giá/phiên bản cụ thể. Không trùng với quiz-cca-*.js, quiz-claude.js, quiz-gaps.js (đã grep kiểm tra: prefill bị loại vì quiz-claude.js ghi model hiện hành không hỗ trợ; chunking đã có trong quiz-gaps.js).
- Nghiệm thu: `node --check js/data/quiz-ccap-1.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → `OK — không có lỗi.`
Reviewed-by: kilo (T2180R)
