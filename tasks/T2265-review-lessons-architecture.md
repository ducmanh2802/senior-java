# T2265 — Rà soát chất lượng các bài (grep -n "id: 'lesson-") trong lessons-architecture.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-architecture.js`
After: T2215

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các bài (grep -n "id: 'lesson-") (`node scripts/qtool.js list js/data/lessons-architecture.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: body dạy từ gốc cho người hổng nền tảng, mỗi khái niệm có ví dụ + lý do VÌ SAO; check có explain nói vì sao từng phương án sai; KHÔNG sửa tests/reference (nếu đụng code chạy node scripts/test-lessons.js). Ghi vào Notes danh sách cụ thể các chỗ đã sửa (id + mô tả); nếu không sửa gì phải nêu 3 điểm đã kiểm tra kỹ; trade-off kiến trúc có bảng so sánh.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/lessons-architecture.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| lesson-architecture-001..012 | check explain chỉ nêu lý do đáp án đúng, chưa phân tích các đáp án sai | bổ sung đoạn "Sai: ..." giải thích vì sao mỗi phương án sai trong tất cả 38 câu check của 12 bài |

3 điểm đã kiểm tra kỹ:
- Mỗi bài có bảng trade-off so sánh (đủ yêu cầu "trade-off kiến trúc có bảng so sánh").
- Body giải thích thuật ngữ lần đầu xuất hiện với ví dụ + lý do VÌ SAO (ví dụ: lesson-architecture-009 giải thích node/shard/hash; lesson-architecture-010 giải thích distributed lock/TTL/fencing token; lesson-architecture-011 giải thích CQRS/read model/projector/idempotent).
- Không thêm/bỏ bài, không đổi id: số mục trước/sau bằng nhau (12 bài), tests/reference không động, `test-lessons.js` 304/304 OK.

Xác thực: `node --check` OK, `node scripts/test-lessons.js` OK, `node scripts/build-light-index.js` OK, `node scripts/validate.js` → "OK — không có lỗi."
