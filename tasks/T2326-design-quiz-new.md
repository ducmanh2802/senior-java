# T2326 — 20 câu trắc nghiệm design pattern / clean code mới

Status: DONE
Agent: kilo
Owns: `js/data/quiz-design.js`
After: T2279

Định dạng QUIZ (AGENTS.md mục 4). Grep `q:` để không trùng. Thêm 20 câu: SOLID qua đoạn code Java thật, Strategy vs State, Decorator trong Spring (proxy), Builder/record, hexagonal/ports-adapters, DDD aggregate boundary, code smell (feature envy, shotgun surgery), refactor an toàn có test. 1/4 multi (Chọn 2), explain vì sao từng phương án sai, đáp án rải đều.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT (không dùng lại số cũ), không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm).

## Nghiệm thu
`node --check js/data/quiz-design.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
- Trước: max id `qz-design-050` (count `qz-design-*` = 29). Sau: max id `qz-design-070` (count `qz-design-*` = 49, tăng đúng 20). Thêm `qz-design-051`..`qz-design-070`.
- Nội dung: SOLID qua đoạn code Java (SRP/OCP/LSP/ISP/DIP), Strategy vs State, Decorator/proxy Spring (`@Transactional`/`@Cacheable`, self-invocation), Builder + Java record, Hexagonal/Ports & Adapters, DDD Aggregate boundary, code smell (feature envy, shotgun surgery), refactor an toàn có test. Multi (Chọn 2): 052, 055, 058, 061, 064, 068 (6/20) — explain nêu vì sao từng phương án sai, đáp án đúng rải đều.
- Sửa lỗi cú pháp có sẵn cuối file (đoạn `qz-architecture-030` bị cắt giữa chừng gây `SyntaxError`, và đuôi bị lặp/corrupt) để file parse được; phục hồi đầy đủ `qz-architecture-030`..`qz-architecture-040` rồi mới thêm block mới. Không thêm backtick, không `${`.
- Chạy: `node --check js/data/quiz-design.js` OK; `node scripts/build-light-index.js` OK (ghi index-light; cảnh báo load `q-system-design.js` có sẵn không do file này); `node scripts/validate.js` hiện báo lỗi pre-existing không thuộc file sở hữu (lessons-architecture/projects/path tham chiếu id không tồn tại) và không in `OK — không có lỗi.`. File `js/data/quiz-design.js` không phát sinh lỗi validate mới.

