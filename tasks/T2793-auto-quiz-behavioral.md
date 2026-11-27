# T2793 — 10 câu trắc nghiệm (behavioral) vào quiz-gaps.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-gaps.js`
After: T2730

Thêm **10 câu trắc nghiệm** vào `js/data/quiz-gaps.js` (topic `behavioral`; id `qz-behavioral-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-behavioral-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: tình huống hành vi: ưu tiên khi bị giao 3 việc gấp, nhận lỗi production do mình gây ra, phản hồi code review khó chịu, đàm phán deadline, onboard người mới — chọn cách xử lý thể hiện tư duy senior. Chỉ hỏi kiến thức chắc chắn đúng; khác với các câu qz-behavioral đã có.

> Vòng 3 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

Theo AGENTS.md mục "Câu trắc nghiệm": dạng tình huống/đoạn code thật, không hỏi định nghĩa suông; khoảng 1/4 là `multi: true` (Chọn 2); đáp án đúng rải đều vị trí; `explain` giải thích vì sao đúng **và vì sao từng phương án sai** là sai.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/quiz-gaps.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 10 câu `qz-behavioral-020` … `qz-behavioral-029` vào cuối `js/data/quiz-gaps.js` (chèn trước `);` cuối file, chỉ THÊM, không sửa mục cũ). Chủ đề vòng 3, góc chưa có so với 015–019: ưu tiên 3 việc gấp (020), phản hồi code review khó chịu (021), onboard người mới (022, multi), nhận lỗi production khi chưa ai phát hiện (023), scope creep giữa sprint (024), xử lý sự cố production do mình gây ra (025, multi), viết bình luận review (026), báo trễ deadline (027, multi), xử lý lỗi của đồng nghiệp (028), push back deploy gấp thứ Sáu (029).
- 3/10 câu `multi: true` (022, 025, 027) ≈ 1/4; đáp án đúng rải đều (0,1,2,3); mỗi `explain` nêu vì sao đúng + vì sao từng phương án sai.
- `node --check js/data/quiz-gaps.js` → OK. `node scripts/validate.js`: KHÔNG có lỗi nào tham chiếu `quiz-gaps.js`/behavioral (behavioral tăng lên 29 trắc nghiệm).
- `node scripts/build-light-index.js`: đã chạy THÀNH CÔNG 1 lần (ghi index-light 468.1 KB). Các lần sau build bị chặn do file của agent khác `js/data/lessons-collections.js` đang có lỗi cú pháp (backtick `now` trong template literal) — KHÔNG phải file tôi sở hữu, theo luật 3 tôi không sửa. Các lỗi validate còn lại (quiz-ops.js, lessons-*.js, path.js, index-light cũ) đều thuộc file agent khác đang làm dở.
- Không commit, không mở trình duyệt, không kill tiến trình, không npm install.
Reviewed-by: kilo (T2793R)
