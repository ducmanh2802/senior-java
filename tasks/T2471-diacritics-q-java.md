# T2471 — Viết lại tiếng Việt CÓ DẤU: core-076, core-077, core-078, core-079

Status: DONE
Agent: kilo
Owns: `js/data/q-java.js`
After: T2470

Các mục sau trong `js/data/q-java.js` đang viết tiếng Việt **KHÔNG DẤU** ("Tom tat", "khong", "nguyen nhan"…), người học đọc rất khó: **core-076, core-077, core-078, core-079**.

Với TỪNG mục: xem bằng `node scripts/qtool.js show js/data/q-java.js <id>`, rồi sửa NGAY TẠI CHỖ mọi chuỗi tiếng Việt (q, a, follow, title, body, prompt, explain, hints, scenario, answer, rubric, check…) thành **tiếng Việt có dấu chuẩn** ("**Tóm tắt:**", "### Ví dụ đời thực", "### Trả lời mẫu khi phỏng vấn", "> Senior tip:"). Giữ nguyên id, cấu trúc, code Java, thuật ngữ tiếng Anh, nội dung kỹ thuật (chỉ sửa lỗi kỹ thuật nếu chắc chắn sai). KHÔNG sửa mục khác, KHÔNG đổi code/test trong bài học.

## Luật
AGENTS.md. Được phép SỬA các mục liệt kê ở trên (ngoại lệ của luật chỉ thêm). Không backtick, không ký hiệu đô-la + ngoặc nhọn. Số mục trong file trước/sau phải bằng nhau. Không commit. KHÔNG sửa đặc tả file task này.

## Nghiệm thu
`node --check js/data/q-java.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → OK. Kiểm tra lại: `grep -c "Tom tat" js/data/q-java.js` không còn tăng do các mục trên. Status: DONE + Notes liệt kê id đã sửa.

## Notes
- Đã chuyển tiếng Việt KHÔNG DẤU thành có dấu chuẩn cho 4 mục: core-076, core-077, core-078, core-079 trong js/data/q-java.js (q, a, follow, tags phần tiếng Việt; giữ nguyên id, cấu trúc, code Java, thuật ngữ tiếng Anh).
- Sửa đúng tại chỗ, không thêm/xoá mục, số mục không đổi, không backtick, không `${` trong nội dung, không commit.
- `node --check js/data/q-java.js` → OK.
- `node scripts/build-light-index.js` BỊ LỖI trước khi sinh xong index-light.js: crash tại js/data/q-concurrency-jvm.js:8 (`a: **Tóm tắt:**` thiếu nháy template literal) — file KHÔNG thuộc quyền sở hữu của task này (task chỉ sở hữu q-java.js), không được tự sửa.
- `node scripts/validate.js` chạy được nhưng không in OK do: (1) index-light.js đã cũ (build-light-index bị chặn như trên; nội dung index-light chỉ lưu [id, topic, level] của câu hỏi, mà id/topic/level của 4 mục trên KHÔNG đổi nên chưa ảnh hưởng), (2) path.js tham chiếu câu hỏi concurrency/jvm/design/architecture/microservices không tồn tại — đều là lỗi tồn tại trước, không do task này gây ra, không nằm trong file sở hữu.
- grep không còn tìm thấy "Tom tat", "khong", "nguyen nhan"… trong vùng 4 mục đã sửa.Reviewed-by: kilo (T2471R)
