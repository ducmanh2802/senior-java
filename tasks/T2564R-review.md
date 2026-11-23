# T2564R — Fact-check nội dung mới của T2564

Status: DONE
Agent: opencode
Owns: `js/data/q-soft.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2564 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check 6 câu mới (behavioral-075…080). Về **kiến thức kỹ thuật không có lỗi**: công thức PERT `(O + 4L + P)/6`, code Java (record/accessor, `String.isBlank()`), MoSCoW (Must/Should/Could/Won't), hourensou (houkoku + renraku + soudan), critical path/đường găng, blameless postmortem/RCA, Definition of Done, spike/timebox đều đúng; không có API/flag bịa, không có cơ chế nói ngược, không có số liệu kỹ thuật vô căn cứ (các con số trong ví dụ là số liệu minh hoạ, giữ nguyên).

Lỗi đã sửa (đều là chữ nước ngoài lẫn vào, không phải lỗi kiến thức):
- **behavioral-076**: "số câu hỏi Clarify từ khách" → "số câu hỏi làm rõ từ khách".
- **behavioral-079**: "Phải anticipate yêu cầu" → "Phải dự liệu trước yêu cầu".
- **behavioral-080**: "focusing vào hệ thống và quy trình" → "tập trung vào hệ thống và quy trình" (3 chỗ: phần Tóm tắt, bước 2 Playbook, và Trả lời mẫu).

Markup: bảng, code block `~~~java`, `{{code}}` inline đều hợp lệ; không có backtick/`${` lọt trong template literal (`node --check` OK).

Nghiệm thu: `node --check js/data/q-soft.js` → OK. `node scripts/validate.js` **không báo lỗi nào cho `q-soft.js`/behavioral-07x/08x**. Các LỖI còn lại trong validate đều bắt nguồn từ file của agent khác (`js/data/q-banking.js` lỗi cú pháp "Unexpected identifier 'lý'" → kéo theo banking 0 câu → bugs.js/lessons-banking.js/path.js/index-light.js báo related banking-xxx không tồn tại). Đây là file ngoài phạm vi T2564R nên **không sửa** (AGENTS luật 3); cần agent T2570 (banking) hoàn tất và build lại `index-light.js` thì validate mới OK toàn cục.
