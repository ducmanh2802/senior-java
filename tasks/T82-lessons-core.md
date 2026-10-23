# T82 — Bài học: Core Java

Status: DONE
Agent: opencode
Owns: `js/data/lessons-core.js`

> **Ghi theo lô nhỏ:** viết **1 bài học mỗi lần edit** (bài dài). Sau mỗi bài chạy `node --check js/data/lessons-core.js`, `node scripts/validate.js lessons-core.js` và `node scripts/test-lessons.js` (biên dịch thật bằng JDK).

Đọc **AGENTS.md mục 12** và bài mẫu **`lesson-collections-001`** trong `js/data/lessons-collections.js` trước khi viết; viết theo đúng phong cách và độ kỹ của bài mẫu.

## Mục tiêu
Viết **5 bài học** cho track `core`, `order` từ 1, ID `lesson-core-001` trở đi:
1. Exception: checked vs unchecked, try-with-resources, suppressed, thiết kế exception nghiệp vụ — bài tập: viết AutoCloseable và đảm bảo thứ tự đóng + suppressed
2. Generics và PECS — bài tập: viết copy(List<? super T> dst, List<? extends T> src) và max(Collection<? extends T>, Comparator<? super T>)
3. Immutable object và defensive copy — bài tập: sửa class Money/Transfer để không bị thay đổi từ bên ngoài
4. BigDecimal cho tiền: scale, RoundingMode, equals vs compareTo — bài tập: chia phí cho N kỳ, phân bổ phần dư để tổng khớp tuyệt đối
5. String, StringBuilder và String pool — bài tập: chuẩn hoá và che (mask) số tài khoản/thẻ hiệu quả

## Yêu cầu
- `body` ≥ 2500 ký tự, dạy như cho người chưa biết: cơ chế bên trong **và vì sao**, ví dụ code ngắn có comment, bảng so sánh, lỗi production hay gặp, kết bằng `### Liên hệ phỏng vấn`.
- Mỗi bài 1–2 bài tập; test ≥ 3 case, có cả edge case; reference pass 100%; starter biên dịch được và trượt test.
- Đúng kỹ thuật Java 17/21 (Spring Boot 3.x, Hibernate 6 cho phần giải thích). Không bịa API/số liệu. Không viết lẫn ngôn ngữ khác (validator chặn).
- `related`: chỉ id câu hỏi có thật (tra trong `js/data/q-*.js`).

## Nghiệm thu
`node scripts/validate.js` → OK và `node scripts/test-lessons.js` → tất cả bài tập OK. Integrator sẽ fact-check.

## Notes
- Đã thêm đủ 5 bài học core và bài tập/câu hỏi kiểm tra; `node --check` và kiểm tra lesson riêng đạt.
- Validator toàn repo chưa đạt: `q-scenario.js` báo `Unexpected end of input`, file ngoài phạm vi sở hữu T82.
- Viết bởi Codex CLI (ChatGPT). Integrator: test-lessons pass.
Verify-failed: legacy — đã commit từ trước, autopilot bỏ qua
