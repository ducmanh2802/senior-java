# T2179R — Fact-check nội dung mới của T2179

Status: DONE
Agent: opencode
Owns: `js/data/quiz-ccap-1.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2179 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check 30 câu mới (qz-ccap-086 → qz-ccap-115). Sửa các lỗi sau:

**Sai đáp án (answer trỏ sai option, sửa theo explain + đáp án đúng):**
- qz-ccap-088: 2 → 1 (prompt caching tái sử dụng prefix).
- qz-ccap-089: 3 → 1 (cắt system prompt giảm input token → giảm latency).
- qz-ccap-090: 0 → 1 (tokens per document khi retrieval mới quyết định cost).
- qz-ccap-092: 2 → 1 (structured output json_schema buộc citations).
- qz-ccap-093: 3 → 1 (redact/tokenize trước khi gửi).
- qz-ccap-094: 0 → 1 (Bedrock/Vertex AI chọn region EU).
- qz-ccap-097: 3 → 1 (eval trên tập gán nhãn + pilot traffic nhỏ).
- qz-ccap-099: 3 → 1 (coi nội dung ngoài là untrusted + tách trust boundary).
- qz-ccap-105: 0 → 1 (p95 cao do nhóm request nặng/queue, không phải "bình thường").

**Chuyển multi → single (chỉ có đúng 1 option đúng, không thể giữ dạng chọn 2):**
- qz-ccap-095, 096, 098, 103, 107, 108, 109, 110, 113, 114, 115 → bỏ `multi`, bỏ "(Choose 2)", answer về 1 option đúng.
- Giữ 5 câu multi còn lại vì có đúng 2 option đúng: 100, 101, 104, 111, 112.

**Khác:**
- qz-ccap-109: đổi tag domain `[Eval & Optimization]` → `[Governance & Risk]` (nội dung là governance/rủi ro dữ liệu; nhờ vậy còn 15/15 theo domain).
- qz-ccap-098, 100: xoá field `q:` bị lặp 2 lần trong cùng object.
- Sửa chữ nước ngoài/lỗi gõ nhầm trong explain: 088 (Lower rate limit), 090 (determines), 091 (isso), 092 (powering), 093 (mát xác/phủ covering), 094 (Giữa), 096/103/109 (pratique/instrument), 104/112 (more), 105 (Định → Đúng + làm rõ), 106/113 (Vô hiệuialize/impossible/records).

Nghiệm thu: `node --check js/data/quiz-ccap-1.js` OK; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.`
Không sửa nội dung HEAD (qz-ccap-001 → 085); không thêm/xoá item.
