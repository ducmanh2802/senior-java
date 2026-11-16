# T2169R — Fact-check nội dung mới của T2169

Status: DONE
Agent: opencode
Owns: `js/data/q-primer.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2169 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review `git diff HEAD -- js/data/q-primer.js` (phần nội dung mới T2169). `node --check js/data/q-primer.js` OK; `node scripts/validate.js` → OK.
- `primer-019`: sửa sơ đồ ASCII stack/heap bị lệch/mũi tên sai (gây hiểu nhầm vị trí mảng/object và nhánh {{arr}}).
- `primer-020`: diễn đạt lại TCP handshake cho đúng (ACK thứ 3 có thể piggyback dữ liệu, nhưng vẫn tốn ≥1 RTT); sửa phép tính ví dụ overhead "100 req/s * 30ms" (trước đó ghi sai "3 giây CPU/mạng lãng phí mỗi giây").
- `primer-021`: sửa ví dụ RestClient cho đúng cú pháp Spring Boot 3 (thêm {{.body(String.class)}}); làm rõ DNS trong Kubernetes (ClusterIP ổn định, headless service trả IP pod nên đổi khi pod thay).
- `primer-022`: sửa nguyên nhân/cách xử lý sự cố PKIX cho chính xác hơn (server có thể gửi thiếu intermediate CA, truststore/cacerts thiếu CA); sửa flag debug TLS đúng cho Java 17 ({{-Djavax.net.debug=ssl:handshake}}, không phải {{ssl,handshake}}).
- `primer-023`: sửa nhánh duyệt B-tree trong sơ đồ minh họa ({{'O'}} nằm đoạn N-Q phải đi nhánh trái của nút {{[R,W]}}, trước đó ghi nhầm nhánh giữa); thay "Độ chọn lọc (selectivity)" bằng "Độ phân biệt giá trị (cardinality)" cho đúng ý (giá trị phân biệt cao giúp index lọc tốt).
- `primer-024`: sửa định nghĩa UTF-16 (độ dài biến thiên 2 hoặc 4 byte, không phải "thường 2 byte, emoji 4"); sửa bảng "byte vs char" ({{varchar(255)}} tính ký tự; giới hạn byte thường gặp ở HTTP header/message queue/row size).
- `primer-030`: dọn markup trả lời phỏng vấn bị tách thành câu lạc ngoài block (đưa câu về CIDR vào trong đoạn trả lời).
- `primer-031`: dọn markup trả lời phỏng vấn bị tách câu "nâng cấp theo từng nhóm…" ra ngoài block.
- `primer-032`: sửa ví dụ đo latency dùng {{metrics.record("partner.call", elapsedMillis)}} (API không rõ/không chuẩn) thành ví dụ Micrometer timer đúng hơn ({{registry.timer("partner.call").record(elapsedNanos, TimeUnit.NANOSECONDS)}}). `primer-033` (phần mới trong diff): không phát hiện lỗi kỹ thuật cần sửa.
