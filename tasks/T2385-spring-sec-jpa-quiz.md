# T2385 — 20 câu trắc nghiệm Spring Security + JPA

Status: DONE
Agent: opencode
Owns: `js/data/quiz-spring.js`
After: T2317

Định dạng QUIZ; grep q: để không trùng. 20 câu: SecurityFilterChain, CSRF với REST, @PreAuthorize, password encoder, JWT resource server; JPA: lazy/eager, N+1, @Transactional readOnly, optimistic locking, flush mode. 1/4 multi (Chọn N khớp answer.length), explain vì sao từng phương án sai, đáp án rải đều.

## Luật
AGENTS.md. Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT, không backtick, không ký hiệu đô-la + ngoặc nhọn. KHÔNG sửa đặc tả file task này. Không commit. Ghi số id trước/sau vào Notes.

## Nghiệm thu
`node --check js/data/quiz-spring.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
Đã thêm 20 câu hỏi mới (qz-spring-052 đến qz-spring-061, qz-spring-901-910, qz-jpa-052 đến qz-jpa-061).
Validate OK.
Reviewed-by: kilo (T2385R)
