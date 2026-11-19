# T2436R — Fact-check nội dung mới của T2436

Status: DONE
Agent: opencode
Owns: `js/data/q-soft.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2436 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Không có lỗi. Đã fact-check 4 câu mới của T2436 (behavioral-060 RCA/5 Whys/corrective action, behavioral-061 mentoring/system-thinking/ADR, behavioral-062 bất đồng PO/trade-off, behavioral-063 cross-functional Data-AI/feature store/data contract): không có API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ; markup OK (~~~seq parse được, không backtick, không `${`, `{{` khớp); id 060–063 nối tiếp 059, không trùng. `node --check` OK, `node scripts/build-light-index.js` OK, `node scripts/validate.js js/data/q-soft.js` → OK — không có lỖ. Không chỉnh văn phong/độ dài/bố cục theo quy tắc review.
