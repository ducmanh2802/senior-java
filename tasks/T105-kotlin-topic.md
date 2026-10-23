# T105 — Chủ đề mới: Kotlin cho dev Java (10 câu)

Status: DONE
Ghi chú: Đã đăng ký topic Kotlin và script dữ liệu; bổ sung 10 câu Kotlin, node --check và validate đều đạt.
Agent: opencode
Owns: `js/data/q-kotlin.js`, `js/data/topics.js`, `index.html`

1. `js/data/topics.js`: thêm `{ id: 'kotlin', name: 'Kotlin cho dev Java', icon: '🟣', group: 'Java', file: 'q-kotlin.js' }` ngay sau topic `modern`. `index.html`: thêm `<script src="js/data/q-kotlin.js"></script>` ngay sau dòng `q-java.js`. Không sửa gì khác.
2. `js/data/q-kotlin.js` (format như `q-java.js`): 10 câu `kotlin-001..010`: null safety và interop với Java (platform types, @Nullable), data class vs record, extension function, coroutines vs virtual threads vs CompletableFuture, Spring Boot với Kotlin (all-open/kotlin-spring, JPA no-arg), sealed class/when, collections và sequence vs Stream, scope functions, companion object/@JvmStatic, khi nào nên/không nên chuyển team từ Java sang Kotlin.
Chuẩn chất lượng đầy đủ (AGENTS.md mục 4–6), code ví dụ dùng ~~~text cho Kotlin (chỉ java/sql/yaml/json/bash/text được tô màu). `node scripts/validate.js` → OK.

## Notes

Reviewed-by: codex (T105R)
