# T785 — 10 câu English: nói về DevOps/cloud trong phỏng vấn

Status: DONE
Agent: kilo
Owns: `js/data/q-english.js`

Topic **english** (đọc hết để không trùng). Thêm 10 câu `lang: 'en'` luyện **nói tiếng Anh về DevOps/cloud** cho dev Java đi phỏng vấn công ty nước ngoài: giải thích pipeline CI/CD của dự án, mô tả kiến trúc trên AWS, kể một incident production (timeline, root cause, action items), giải thích blue-green/canary cho người không chuyên, trả lời "how do you monitor your service", nói về on-call, giải thích quyết định Terraform/IaC, xin làm rõ câu hỏi, thừa nhận không biết một cách chuyên nghiệp, hỏi lại interviewer về team DevOps. Mỗi đáp án: từ vựng/cụm từ chính, câu mẫu tự nhiên B2–C1, lỗi người Việt hay mắc.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6 và docs/PLAN-v4-deep.md. Người đọc: dev Java 4 năm, ít va chạm thực tế, cần giải thích **từ gốc, rất chi tiết**.
- **Chỉ THÊM** câu mới vào cuối mảng trong `js/data/q-english.js`; id tiếp nối số lớn nhất hiện có của topic. Không sửa câu cũ.
- TRƯỚC khi viết, đọc hết câu cùng topic (grep "topic: '<id>'") để **không trùng ý**. Góc gợi ý nào đã có thì chọn góc khác cùng mảng.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (cơ chế bên trong, ví dụ code/số liệu, bảng trade-off, pitfall production) → `> Senior tip:`. 2500–4500 ký tự. `follow` 2–3 câu.
- Đúng kỹ thuật với Java 17/21, Spring Boot 3.x. Không bịa flag/API; không chắc thì bỏ.
- Không backtick, không `${` trong template literal. Không chạy file .js trực tiếp, luôn dùng `node`.
- `refs` tuỳ chọn, chỉ link chính thức chắc chắn tồn tại; có refs thì chạy `node scripts/check-links.mjs js/data/q-english.js`.

## Nghiệm thu
`node --check js/data/q-english.js`, `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + danh sách id mới vào Notes.

## Notes
- IDs mới (10, chỉ THÊM, không sửa/xoá câu cũ): `english-132` (CI/CD pipeline, senior), `english-133` (kiến trúc AWS/cloud, senior), `english-134` (production incident timeline/root cause/action items, senior), `english-135` (so sánh blue-green vs canary, senior), `english-136` (monitor service: metrics/logs/traces/SLO, senior), `english-137` (nói về on-call, senior), `english-138` (quyết định Terraform/IaC, senior), `english-139` (xin làm rõ câu hỏi, polite phrases, mid), `english-140` (thừa nhận không biết một cách chuyên nghiệp, mid), `english-141` (hỏi interviewer về DevOps culture/team, mid).
- Đếm id trong `js/data/q-english.js` (`id: '...'`): trước khi bắt đầu = 130; sau khi hoàn tất = 140 (tăng 10). `node --check js/data/q-english.js` OK. Đã chạy `node scripts/build-light-index.js` rồi `node scripts/validate.js` → `OK — không có lỗi.` (các cảnh báo là ở file khác, có sẵn từ trước).
- Nội dung bám yêu cầu: `lang: 'en'`, giải thích thuật ngữ lần đầu (VN + ví dụ/ẩn dụ), cấu trúc Tóm tắt → mục ### (cơ chế/từng bước, ví dụ/số liệu, bảng trade-off, `~~~seq` cho luồng IaC, pitfall production) → `> Senior tip:`; có cụm từ/câu mẫu B2–C1 và lỗi người Việt hay mắc; `follow` 2–3 câu. `topic: 'english'`. Không backtick thô phá template literal, không `${`.
- Không commit, không mở trình duyệt, không kill tiến trình theo tên, không chạy file .js trực tiếp ngoài `node`. Chỉ sửa file sở hữu: `js/data/q-english.js` và `tasks/T785-q-english-devops.md`.
Reviewed-by: kilo (T785R)
