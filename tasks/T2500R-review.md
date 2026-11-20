# T2500R — Fact-check nội dung mới của T2500

Status: DONE
Agent: opencode
Owns: `js/data/q-frontend.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2500 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa 3 câu hỏi trong `js/data/q-frontend.js`:

1. **frontend-008** (computed vs watch): Sửa tiếng Việt không dấu thành có dấu đầy đủ (Tóm tắt, Cơ chế, Ví dụ, Bảng so sánh, Lỗi hay gặp, Ví dụ đời thực, Trả lời mẫu, Senior tip).

2. **frontend-009** (Props, emit, v-model): 
   - Sửa tiếng Việt không dấu thành có dấu đầy đủ.
   - **Sửa lỗi kỹ thuật**: `emit('update:model-value')` → `emit('update:modelValue')` để khớp với prop `modelValue` (camelCase) theo quy ước Vue 3. Cập nhật cả comment giải thích v-model: `@update:model-value` → `@update:modelValue`.

3. **frontend-010** (Pinia vs Vuex): Sửa tiếng Việt không dấu thành có dấu đầy đủ (Tóm tắt, Cơ chế, Ví dụ, Bảng so sánh, Lỗi hay gặp, Ví dụ đời thực, Trả lời mẫu, Senior tip).

`node scripts/validate.js` chạy OK — không có lỗi trên file q-frontend.js.
