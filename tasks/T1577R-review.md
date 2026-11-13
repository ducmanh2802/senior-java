# T1577R — Fact-check nội dung mới của T1577

Status: DONE
Agent: opencode
Owns: `js/data/lessons-core.js`

## Notes
Review phần mới của T1577 (lesson-core-010 composite key, lesson-core-011 immutable snapshot): không tìm thấy lỗi kỹ thuật (hợp đồng equals/hashCode/compareTo, HashMap/TreeMap, List.copyOf, unmodifiable view, record Comparable đều chính xác Java 17), không lỗi markup, không chữ nước ngoài lẫn vào术语 kỹ thuật. Chạy `node scripts/test-lessons.js lesson-core-010` → 6/6 pass, `lesson-core-011` → 6/6 pass. `node scripts/validate.js` → OK. Không sửa nội dung đã có ở HEAD, không thêm/xoá mục.
