# T2549R — Fact-check nội dung mới của T2549

Status: DONE
Agent: opencode
Owns: `js/data/labs-incident.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2549 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚX: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Fact-check T2549R (labs-incident.js) — không có lỗi kiến thức nào.

- **lab-incident-052** (Agent LLM chi phí tăng 9 lần): đã đồng bộ số liệu scenario (chi phí 210→1850 USD/giờ) với artifact hourly-cost-table.csv; các con số 1.200→30.000 tokens, 400.000 tokens/phiên, 0.22→2.0 USD/yêu cầu, 5 bước bình thường → 25 bước đều nhất quán giữa agent-log-sample.jsonl, answer và rubric. Kiến thức đúng: max_steps, history compression, tool error handling, retry, cost alert.
- **lab-incident-053** (RAG chậm do HNSW + WHERE): đã sửa mâu thuẫn số liệu trong schema-documents.sql — planner ước tính 125.000 rows (estimate) nhưng thực tế chỉ 450 hàng pass filter (Rows Removed by Filter: 4.999.550). Cập nhật lại chú giải để phân biệt estimate vs actual. Kiến thức đúng: HNSW chỉ hỗ trợ ORDER BY embedding <=> thuần túy, không kết hợp WHERE trên cột khác; planner chọn Seq Scan; fix bằng partial index / partition / truy vấn hai bước / tuning ef_search.

Không có lỗi markup, không có backtick hoặc ${} trong template literal. `node scripts/validate.js` → không có lỗi liên quan labs-incident.js (134 bài incident, 53 bài trong labs-incident).