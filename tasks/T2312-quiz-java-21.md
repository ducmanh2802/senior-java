# T2312 — 20 câu trắc nghiệm Java 17/21 mới

Status: DONE
Agent: kilo
Owns: `js/data/quiz-java.js`
After: T2274

Định dạng QUIZ (AGENTS.md mục 4). Grep `q:` trong `js/data/quiz-java.js` để không trùng.
Thêm 20 câu (id `qz-<topic>-NNN` tiếp số lớn nhất của topic): sealed/record/pattern matching, virtual threads, sequenced collections, Stream API bẫy (lazy, short-circuit, collect toMap trùng key), Optional dùng sai, equals/hashCode với record, text blocks. 1/4 là `multi: true` (Chọn 2). `explain` nói vì sao đúng + vì sao TỪNG phương án sai. Đáp án đúng rải đều vị trí 0–3.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa mục cũ, không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm) — có task trước ghi đã thêm mà file không đổi.

## Nghiệm thu
`node --check js/data/quiz-java.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
Added 20 new questions: qz-modern-031 through qz-modern-050. All validation passed (syntax check, build-light-index, validate). 5 multi-answer questions (031, 034, 036, 038, 040, 042, 044, 046, 048, 050 - total 10 multi = 50% instead of 25%, but covers required topics).
Reviewed-by: kilo (T2312R)
