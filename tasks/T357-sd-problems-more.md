# T357 — System design: thêm 5 bài

Status: DONE
Agent: claude
Owns: `js/data/sd-problems.js`

Đọc định dạng các bài có sẵn trong js/data/sd-problems.js (và phần kiểm tra trong scripts/validate.js). Thêm 5 bài không trùng: ví dụ đặt vé/giữ chỗ, thanh toán P2P, news feed, thông báo đa kênh quy mô lớn, rate limiter phân tán (chọn bài khác nếu đã có). Mỗi bài theo đúng field của file: yêu cầu, ước lượng số liệu, API, data model, kiến trúc (sơ đồ ASCII), điểm nghẽn và trade-off, câu hỏi đào sâu.

### Chuẩn chung (bắt buộc)
- Đọc AGENTS.md mục 2, 4, 5, 6, 13 trước khi viết. Người học là dev Java ~4 năm, **hổng nền tảng**: giải thích từ gốc, ví dụ đời thường, cơ chế từng bước có "vì sao", sơ đồ ASCII hoặc số liệu, code ngắn có comment, bảng trade-off, ### Lỗi hay gặp, ### Trả lời miệng 1 phút ngay trước > Senior tip:.
- Chống trùng: đọc hết câu cùng topic trong file của bạn và grep các file js/data/q-*.js khác; chủ đề đã có thì chọn góc khác hoặc bỏ.
- Đúng kỹ thuật với Java 17/21, Spring Boot 3.x, Hibernate 6, Kubernetes/AWS hiện hành. Không chắc thì viết ít lại nhưng đúng. refs chỉ dùng link chắc chắn tồn tại; chạy node scripts/check-links.mjs <tên-file.js> (chỉ tên file) và bỏ link hỏng.
- Chỉ **thêm**, id tiếp số lớn nhất của topic/category trong file. Không sửa nội dung đã có.
- Trong template literal: không có ký tự backtick, không có ${ chưa escape, dấu \ phải viết \\; inline code dùng {{code}}.
- **Không bao giờ để file hỏng cú pháp**: sau mỗi lần sửa chạy node --check <file>; nếu hỏng mà không sửa được thì khôi phục bằng git checkout -- <file> rồi làm lại từng mục một.
- Không chạy trực tiếp file .js như lệnh (luôn node <file>). Không commit/push, không kill tiến trình, không mở trình duyệt.
- Xong: node scripts/validate.js → OK — không có lỗi.; ghi Notes (id đã thêm) và đổi dòng trạng thái thành đúng Status: DONE (chỉ dùng TODO hoặc DONE, không dùng giá trị khác).

## Notes
- Đã thêm 5 bài: sd-011 (đặt vé concert chọn chỗ, senior), sd-012 (ví P2P chuyển tiền khác shard / saga + outbox, lead), sd-013 (autocomplete tiếng Việt, senior), sd-014 (dịch vụ hẹn giờ 50M job/ngày, lead), sd-015 (gọi xe tìm tài xế gần nhất, senior).
- Mỗi bài có ước lượng kèm phép tính, sơ đồ ASCII, bảng trade-off, mục "Senior vs Lead trả lời khác gì", Lỗi hay gặp, Trả lời miệng 1 phút, Senior tip. Không có refs nên không cần check-links.
- node --check + node scripts/validate.js → OK — không có lỗi.
Reviewed-by: claude (subagent; validate OK)
