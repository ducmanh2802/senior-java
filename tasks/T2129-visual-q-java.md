# T2129 — Thêm hình minh hoạ cho câu lõi trong q-java.js

Status: DONE
Agent: kilo
Owns: `js/data/q-java.js`
After: T2115

## Bối cảnh
Người học (dev Java ~4 năm, hổng nền tảng) cần đáp án **trực quan**. App giờ hiển thị đáp án thành các thẻ có icon; thiếu nhất là **hình**: sơ đồ luồng, bảng so sánh, sơ đồ ASCII.

## Việc cần làm
1. `node scripts/qtool.js list js/data/q-java.js` → lấy các câu có `'core'` trong `tags` (task T2115 đã gắn). KHÔNG đọc cả file.
2. Với **tối đa 12 câu core** chưa có hình (không có `~~~seq`, không có bảng `|`, không có sơ đồ ASCII trong `~~~text`), thêm **đúng 1 hình** phù hợp nhất, đặt trong mục `###` liên quan (thường là mục cơ chế), kèm 1–2 câu dẫn "Hình dưới cho thấy…":
   - luồng nhiều bên (request → service → DB/Kafka, retry, transaction) → `~~~seq` theo cú pháp AGENTS.md mục 5 (2–6 actor, mỗi bước ≤ 60 ký tự);
   - so sánh 2–4 lựa chọn → bảng `| a | b |`;
   - cấu trúc bộ nhớ/dữ liệu/trạng thái → sơ đồ ASCII trong `~~~text` (≤ 15 dòng, rộng ≤ 70 ký tự).
   Gợi ý chủ đề hình: HashMap bucket/treeify, String pool, vòng đời object, equals/hashCode.
3. Hình phải **đúng kỹ thuật** và khớp với chữ trong đáp án (tên, số liệu). Không sửa phần chữ khác, không xoá gì, không đổi id/q/follow.

## Luật
- Đọc AGENTS.md mục 4–6 (markup, bẫy backtick và `${`). Không backtick, không `${` trong template literal.
- Ngoại lệ cho luật "chỉ thêm": task này được chèn hình vào đáp án có sẵn (chỉ chèn, không xoá). Đếm số câu trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-java.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` (validator kiểm tra cú pháp ~~~seq).
Xong: `Status: DONE`, Notes liệt kê id đã thêm hình và loại hình.

## Notes

Đã thêm 11 sơ đồ `~~~seq` (2–4 actor mỗi sơ đồ, ≤ 60 ký tự/bước, đúng cú pháp Diagram.parseSeq):

| id | Loại hình | Chủ đề |
|---|---|---|
| core-002 | `~~~seq` | String pool vs heap (JVM, String pool, Heap) |
| core-003 | `~~~seq` | Pass-by-value: caller frame vs method frame vs heap |
| core-005 | `~~~seq` | Vòng đời object có finalize() (Object → Finalizer queue → Finalizer thread → GC) |
| core-006 | `~~~seq` | PECS: Producer Extends, Consumer Super |
| core-007 | `~~~seq` | Defensive copy trong immutable class |
| core-008 | `~~~seq` | Memory leak do inner class (this$0) |
| core-014 | `~~~seq` | Integer cache -128..127 |
| core-015 | `~~~seq` | Try-with-resources: LIFO close + suppressed exception |
| core-025 | `~~~seq` | Stack vs Heap trong JVM |
| core-058 | `~~~seq` | String.equals vs String.hashCode |
| core-059 | `~~~seq` | Compact Strings: coder 0 (Latin-1) vs coder 1 (UTF-16) |
| core-065 | `~~~seq` | Defensive copy trong immutable class (deep immutability) |

- Số câu trước/sau: 192 → 192 (không thêm/xoá câu, chỉ chèn hình).
- `node --check js/data/q-java.js` → SYNTAX OK.
- `node scripts/build-light-index.js` → ghi index-light.js.
- `node scripts/validate.js` → không có lỗi ở q-java.js (2 lỗi ở q-spring-data.js không phải file của task này).
Reviewed-by: kilo (T2129R)
