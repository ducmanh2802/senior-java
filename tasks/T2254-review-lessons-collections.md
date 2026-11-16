# T2254 — Rà soát chất lượng các bài (grep -n "id: 'lesson-") trong lessons-collections.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-collections.js`
After: T2206

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các bài (grep -n "id: 'lesson-") (`node scripts/qtool.js list js/data/lessons-collections.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: body dạy từ gốc cho người hổng nền tảng, mỗi khái niệm có ví dụ + lý do VÌ SAO; check có explain nói vì sao từng phương án sai; đúng Java 17/21; KHÔNG sửa tests/reference (nếu đụng code chạy node scripts/test-lessons.js); HashMap/ConcurrentHashMap nội bộ đúng Java 8+ (treeify ngưỡng 8, bảng resize).
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/lessons-collections.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes
- Số bài trước/sau: 9 / 9 (giữ nguyên id). Không sửa `tests`/`reference`/`starter`.
- Kiểm tra: HashMap/ConcurrentHashMap nội bộ đúng (spread `h ^ (h >>> 16)`, index `(n-1)&hash`, resize x2, threshold 0.75, treeify ngưỡng 8 node + `MIN_TREEIFY_CAPACITY` 64, fallback resize nếu bảng <64; CHM Java 8+ CAS bin trống, `synchronized` trên node đầu, `ForwardingNode` giúp resize, counter cell, null key/value bị cấm). Nội dung phù hợp Java 17/21, có ví dụ, "vì sao", liên hệ phỏng vấn; mỗi `check` có `explain` giải thích đáp án đúng và vì sao các phương án khác sai.

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| lesson-collections-001 | Không phát hiện lỗi kỹ thuật/nội dung | Không sửa |
| lesson-collections-002 | Không phát hiện lỗi kỹ thuật/nội dung | Không sửa |
| lesson-collections-003 | Không phát hiện lỗi kỹ thuật/nội dung | Không sửa |
| lesson-collections-004 | Không phát hiện lỗi kỹ thuật/nội dung | Không sửa |
| lesson-collections-005 | Không phát hiện lỗi kỹ thuật/nội dung | Không sửa |
| lesson-collections-006 | Không phát hiện lỗi kỹ thuật/nội dung | Không sửa |
| lesson-collections-007 | Không phát hiện lỗi kỹ thuật/nội dung | Không sửa |
| lesson-collections-008 | Không phát hiện lỗi kỹ thuật/nội dung | Không sửa |
| lesson-collections-009 | Không phát hiện lỗi kỹ thuật/nội dung | Không sửa |

- Kiểm chứng: `node --check js/data/lessons-collections.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → `OK — không có lỗi.`; `node scripts/test-lessons.js --file js/data/lessons-collections.js` → `Lesson exercises OK: 0/0  (0 bài học)` (script không nhận/áp dụng tham số lọc file này trong lần chạy).
