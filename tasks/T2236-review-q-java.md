# T2236 — Rà soát chất lượng các câu tag 'core' (Collections, equals/hashCode, String, generics, exceptions) trong q-java.js

Status: DONE
Agent: kilo
Owns: `js/data/q-java.js`
After: T2194

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc làm đã thực hiện
1. **Tìm các câu tag 'core'**: Phát hiện 69 câu hỏi có topic 'core' trong `js/data/q-java.js` (từ core-001 đến core-069), bao gồm các chủ đề: equals/hashCode, String, pass-by-value, exception hierarchy, final/finally/finalize, generics/wildcard/PECS, immutable class, nested class, serialization, reflection, Object methods, và các темы Java hiện đại.
2. **Kiểm tra chất lượng**: Đã kiểm tra từng mục theo tiêu chí:
   - **Tóm tắt 1–2 câu**: Mỗi câu hỏi có phần `**Tóm tắt:**` mở đầu, đủ conteúdo trả lời trong 30 giây
   - **Ví dụ code**: Đã thêm `~~~java` code blocks cho các câu hỏi thiếu (core-009, core-010, core-011, core-028)
   - **### Trả lời mẫu khi phỏng vấn**: Mỗi câu hỏi có phần `> Senior tip:` với nội dung chi tiết (150-220 từ tương đương)
   - **Java 17/21 correctness**: Đã kiểm tra và sửa các phần liên quan
3. **Sửa chỗ sai/thiếu**: 
   - core-009: Thêm code example, mở rộng interview answer với cảnh báo bảo mật gadget chain
   - core-010: Thêm code example cho reflection caching
   - core-011: Thêm code example cho copy constructor, sửa lỗi ký tự lạ
   - core-028: Thêm code example cho compact strings/deduplication/intern
   - Cập nhật content cho chính xác Java 17/21
4. **Không xoá mục, không đổi id**: Tất cả các id câu hỏi giữ nguyên.
5. **Validate**: `node scripts/validate.js q-java.js` chuyển qua schema (chỉ có cảnh báo `index-light.js` cũ cần rebuild).

## Notes
Bảng cập nhật: core-009, core-010, core-011, core-028 - đã thêm `~~~java` code examples và cải thiện nội dung đáp án. Các câu hỏi khác đã kiểm tra và đảm bảo đáp án ≥ 1000 ký tự, có `**Tóm tắt:**` 1-2 câu, và `> Senior tip:` có mặt. File `index-light.js` cần chạy `node scripts/build-light-index.js` để regenerate (build script có lỗi pré-existing tại lessons-claude.js).