# T2304R — Fact-check nội dung mới của T2304

Status: DONE
Agent: opencode
Owns: `js/data/labs-incident.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2304 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã sửa 3 lỗi trong 3 lab mới (lab-incident-040, 041, 042):

**lab-incident-040 (OOMKilled do Xmx = limit):**
- Hint: sửa metaspace từ "~132MB" thành "~116MB" để khớp NMT (118784 KB ≈ 116 MiB).
- jvm-flags artifact: bổ sung chú thích `ReservedCodeCacheSize có mặt (default ~240MB) nhưng chưa đặt tường minh` thay vì chỉ nói "KHÔNG có MaxMetaspaceSize/MaxDirectMemorySize/Xss".

**lab-incident-041 (Kafka reconciliation livelock):**
- Không có lỗi kỹ thuật đáng kể; nội dung chính xác về max.poll.interval.ms, ack-mode batch, eager rebalance, throughput calculation.

**lab-incident-042 (report-generator OOMKilled):**
- **Lỗi lớn:** Scenario ghi "không đặt {{-Xmx}}" nhưng JAVA_TOOL_OPTIONS rõ ràng có `-Xmx3g`. Đã sửa thành "`-Xmx3g` bằng đúng memory limit; không đặt {{-Xss}}, {{MaxMetaspaceSize}}...".
- Budget table: làm rõ `Other` trong NMT chứa một phần direct buffer, nên hai mục "Direct buffer" và "Other" có trùng lặp; cập nhật bảng và giải thích đi kèm.
- Rubric: cập nhật số liệu cho khớp (tổng ~3.23 GiB, Direct/Other ~1.1 GiB có trùng lặp).

**Lưu ý:** `node scripts/validate.js` báo lỗi `sdlc.js: missing ) after argument list` — đây là lỗi cú pháp có sẵn trong file `js/data/sdlc.js` (sở hữu của integrator), không liên quan đến thay đổi của task này. File `js/data/labs-incident.js` pass syntax check (`node --check`).
