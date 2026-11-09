# T1402R — Fact-check nội dung mới của T1402

Status: DONE
Agent: opencode
Owns: `js/data/lessons-ai.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1402 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review diff `HEAD -- js/data/lessons-ai.js` (chỉ body/check text; exercises không đổi so với HEAD). Kiểm tra: `node --check` OK, không backtick/`${` trong template, không CJK/Cyrillic, check `answer` hợp lệ và khớp option đúng (ai-002/003 đã xáo option + cập nhật index đúng), không HTML thô/markup lỗi thấy trong phần mới.

Lỗi kỹ thuật đã sửa (theo id):
- `lesson-ai-002` (PII masking, mục "Cơ chế từng bước" Bước 2): câu ví dụ nói CCCD `012345678901` "bị cắt thành phone `0123456789` + 01" khi chạy CCCD trước phone là **không chính xác** với regex phone dùng `\b` (reference/starter dùng `(?:\+84|\b0)\d{9}\b`) — `\b` không khớp giữa chữ số thứ 10 và 11 của chuỗi 12 số, nên không cắt trọn như mô tả. Đã viết lại để giải thích đúng: phone regex với `\b` không khớp trọn CCCD 12 số, nhưng thứ tự email → phone → CCCD → card vẫn là an toàn/đúng để tránh che nhầm (email chứa số, CCCD mẫu cố định 12 số). Code/reference không đổi.
- `lesson-ai-006` (LLM API integration, mục 2 "Đo chi phí"): thay `max_completion_tokens` được nêu như tham số chung bằng diễn đạt chính xác theo provider: "giới hạn token đầu ra (`max_tokens` / `max_completion_tokens` tuỳ provider)". Tránh ngụ ý một flag duy nhất đúng cho mọi API (OpenAI Chat Completions từng dùng `max_tokens`, nhiều API/model mới dùng `max_completion_tokens`; Anthropic dùng `max_tokens` bắt buộc — đã ghi rõ ở mục 1). Bảng so sánh/đoạn Anthropic ở đầu bài giữ nguyên (đúng theo API).

Xác nhận nội dung mới đúng/không cần sửa:
- `lesson-ai-001` (structured output): làm rõ "502 `bad_json`" là mã nội bộ, không phải của provider — hợp lý.
- `lesson-ai-002`: thêm cơ chế 7 bước, bảng lỗi hay gặp, liên hệ phỏng vấn, Luhn giải thích + ví dụ Java (Luhn duyệt từ phải sang trái, nhân đôi chữ số thứ hai tính từ bên phải, tổng mod 10) — thuật toán đúng, ví dụ `4532015112830366` pass / `1234567890123456` fail hợp lý; 2 câu check mới (placeholder, sắp xếp option card/unmask) đúng.
- `lesson-ai-003` (RAG): pipeline 7 bước, ví dụ cosine bag-of-words, bảng lỗi production, metadata/threshold/hybrid+re-rank, Q&A phỏng vấn, sửa "sốDimensions"→"số chiều", giải thích ANN — kỹ thuật hợp lý cho RAG; câu check overlap mới đúng.
- `lesson-ai-006`: chỉ đổi token-limit phrasing (đã sửa).

Chạy:
- `node --check js/data/lessons-ai.js` → OK.
- `node scripts/validate.js` → **không có lỗi nào thuộc `lessons-ai.js`**. Repo còn nhiều lỗi ở file khác (không thuộc quyền sở hữu): `q-microservices.js`, `lessons-db.js` lỗi cú pháp; `q-system-design.js`, `bugs.js`, `lessons-microservices.js`, `lessons-devops.js`, `projects.js`, `path.js`, `index-light.js` cũ. Không sửa.
- `node scripts/test-lessons.js` (toàn bộ) fail sớm do `lessons-db.js` syntax error (không thuộc sở hữu). Đã test cô lập 6 bài `lesson-ai-*` (compile/run reference+starter với JDK): reference **fail compile/runtime** và starter cũng compile fail theo cùng nguyên nhân — nguyên nhân nằm ở `exercises` (thiếu import `java.util.*`/`Objects`/`List` trong một số test/reference ghép, hoặc `public class Main` trong exercise context) và **giống hệt HEAD** (đối chiếu exercises HEAD vs hiện tại: không đổi). Vì không được sửa code/content ngoài phạm vi fact-check text và không được thêm/xoá mục, để nguyên; đề xuất integrator sửa test harness/import cho `lesson-ai-001..006`.
- `node scripts/build-light-index.js` chạy nhưng fail vì `q-microservices.js` syntax error (không thuộc sở hữu) → `index-light.js` chưa rebuild được từ môi trường hiện tại. Cần chạy lại sau khi file ngoài được sửa.

DoD: chỉ `js/data/lessons-ai.js` và `tasks/T1402R-review.md` thay đổi bởi task này (repo đang có nhiều file dirty khác từ trước, tôi không đụng). `validate.js` không báo lỗi cho file sở hữu. Task DONE.
