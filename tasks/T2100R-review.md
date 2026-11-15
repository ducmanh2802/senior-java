# T2100R — Fact-check nội dung mới của T2100

Status: DONE
Agent: kilo
Owns: `js/data/q-ai.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2100 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check 5 câu mới ai-121…ai-125 (diff T2100) và sửa các lỗi sau, chỉ trong nội dung mới:

- ai-121:
  - BM25 không phải là full-text search có sẵn của PostgreSQL (ts_rank không phải BM25): sửa thành "BM25 trong OpenSearch/Elasticsearch, hoặc extension pg_search cho PostgreSQL".
  - Số liệu RRF sai: 1/(60+1)+1/(60+20)=0.0289 (không phải 0.0285); sửa cả text và comment code.
  - "keyword 0-10" sai bản chất BM25 (không có trần trên): sửa thành "BM25 không có trần trên, cosine từ -1 đến 1".
  - Sửa câu hỏng "xuất hiện ở một phương pháp nhưng không kia" → "chỉ xuất hiện ở một phương pháp… (giao quá chặt)".
  - Chữ nước ngoài lẫn: "từng engines" → "từng engine"; "tài nguyên embed" → "tài nguyên embedding"; "làm nhiễm" → "làm nhiễu"; "Analyzer" → "analyzer".
- ai-122:
  - Lỗi gõ "xuất điểmociation" → "xuất điểm liên quan"; "chuỗi truy vấn… lại" → "nối chuỗi truy vấn… lại".
  - Pitfall nói ngược quy trình rerank ("chỉ rerank top-k cần thiết"): rerank phải chấm cả tập ứng viên top-N rồi mới lấy top-k; sửa thành "chỉ rerank một tập ứng viên nhỏ (ví dụ top-50 đến top-100)".
- ai-123:
  - Lỗi gõ "tiểu sự nhỏ" → "sai sót nhỏ"; "ý hiểu nhầm nhỏ" → "hiểu nhầm nhỏ".
  - Ô bảng bị lỗi "Chprüche trường hợp phức tạp" → "Trường hợp phức tạp".
- ai-124: không có lỗi kiến thức/markup (công thức merge, recall@k, multi-hop đều đúng).
- ai-125:
  - "Fine-tuning khórollback" → "khó rollback".
  - Chữ nước ngoài lẫn: "ngữ cảnh prompts" → "ngữ cảnh prompt".

Không thêm/xoá mục, không sửa nội dung HEAD (đã khôi phục nguyên định dạng 4 dòng cuối của ai-120 để diff chỉ còn phần thêm mới). Không cần build lại index-light vì chỉ sửa đáp án (index-light lưu id/topic/level).

Nghiệm thu: `node --check js/data/q-ai.js` → OK. `node scripts/validate.js` không in lỗi nào cho q-ai.js (0 dòng chứa q-ai). Tuy nhiên validate toàn repo chưa OK vì các file đang được task khác sửa dở trong working tree: `q-java.js` và `q-devops.js` lỗi cú pháp (bản HEAD của cả hai đều pass `node --check`), kéo theo lỗi liên kết ở `bugs.js`, `lessons-devops.js`, `path.js`, `projects.js`, và `index-light.js` báo cũ. Các lỗi này ngoài phạm vi sở hữu của task, không tự sửa theo luật 3.
