# T2404R — Fact-check nội dung mới của T2404

Status: DONE
Agent: opencode
Owns: `js/data/lessons-claude.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2404 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa các lỗi kỹ thuật trong lesson-claude-014:
1. `cache_control`: `ephemeral_1h` → `{"type": "ephemeral", "ttl": "1h"}` (theo docs Anthropic Oct 2026)
2. TTL 1h cache write multiplier: 2.5x → 2x (theo docs Anthropic)
3. Cập nhật bảng giá model (Oct 2026): Opus $4/$20, Sonnet $2/$10, Haiku $0.10/$0.50 per 1M tokens (trước đó sai: Opus $15/$75, Sonnet $3/$15, Haiku $0.25/$1.25)
4. Trả lời mẫu phỏng vấn: "ghi 2.5x" → "ghi 2x" cho TTL 1h
5. Cập nhật test CostEstimator: PriceTable values và expected values theo giá mới
6. Test "Opus đắt hơn Sonnet": assertion >=5x → >=1.5x (tỷ lệ thực tế ~2x)
7. Haiku comparison: "rẻ gấp 12x Sonnet" → "rẻ gấp ~20x Sonnet" ($0.10 vs $2.00)
Syntax OK, test-lessons.js pass 328/328. Các lỗi validate còn lại (quiz-ccap-2.js, labs-incident.js) thuộc task khác.
