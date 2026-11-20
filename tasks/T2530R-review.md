# T2530R — Fact-check nội dung mới của T2530

Status: DONE
Agent: opencode
Owns: `js/data/q-english.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2530 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỉ cần kiến thức ĐÚG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Kiểm tra nội dung mới (english-227 → english-230) trong `js/data/q-english.js`:

- **Markup**: không có backtick lẻ hay `${` nào trong template literal (kết quả kiểm tra chỉ thấy delimiter `a: \`` và `\`,` chính xác).
- **Schema**: 4 câu mới đều đủ field `id`, `topic`, `level`, `q`, `a`, `follow`, `tags`, `lang: 'en'`; không field thừa.
- **ID**: không trùng lặp; english-227 → english-230 tăng dần, nối tiếp english-226.
- **Kỹ thuật**: 4 câu thuộc nhóm soft skills/communication (stand-up, email clarification, delay reporting, explaining bugs to non-technical client) — không có API/flag bịa, cơ chế nói ngược hay số liệu vô căn cứ. Thuật ngữ kỹ thuật dùng trong ví dụ (DLQ, exponential backoff, unique constraint, race condition, soak test, idempotency, rollback, config) đều đúng.
- **Ngôn ngữ**: phát âm/IPA trong phần "Lỗi người Việt hay mắc" và "Senior tip" chính xác (blocker /ˈblɒkə/, clarify /ˈklærɪfaɪ/, mitigation /ˌmɪtɪˈɡeɪʃn/, proactive /proʊˈæktɪv/, config /ˈkɒnfaɡ/, deadline /ˈdedlaɪn/, retention /rɪˈtɛnʃn/).
- **Độ dài**: 4 đáp án đều > 1500 ký tự, đủ phần Tóm tắt, Sample answer, Useful phrases, Lỗi người Việt, Senior tip.

**Kết luận: không có lỗi kiến thức hay markup.** Chỉnh sửa nào đó đều là format nhỏ (không thay đổi nội dung).