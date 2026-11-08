# T916 — Kotlin backend thực chiến (8 câu)

Status: DONE
Agent: claude
Owns: `js/data/q-kotlin.js`
After: T896

Topic **kotlin** (file `js/data/q-kotlin.js`): đọc HẾT câu hiện có của topic, không lặp ý; chủ đề đã có thì đào góc khác.

Thêm **8 câu** (2 `mid` + 4 `senior` + 2 `lead`), chuẩn "hay và chi tiết": `**Tóm tắt:**` → cơ chế từng bước (vì sao) → `### Ví dụ đời thực` (tình huống production có số liệu) → code thật có comment (≤ 30 dòng) hoặc `~~~seq` → bảng trade-off → pitfall → `### Trả lời mẫu khi phỏng vấn` (60–90 giây) → `> Senior tip:`. 3000–5000 ký tự, `follow` 3 câu. Chỉ dùng API có thật ở phiên bản hiện hành (kiểm tra docs chính thức); không chắc thì mô tả nguyên lý, không bịa tên class/method.

Chủ đề:
- Spring Boot với Kotlin: data class + JPA (plugin all-open/no-arg, vì sao cần), null-safety với Java interop, extension function trong code Spring.
- Coroutines trong Spring (WebFlux / suspend controller) so với virtual thread Java 21: khi nào chọn cái nào.
- Structured concurrency với coroutineScope/supervisorScope, huỷ (cancellation) và timeout; lỗi hay gặp làm rò coroutine.
- Flow vs Sequence vs Reactor Flux; backpressure.
- Ktor so với Spring Boot cho microservice nhỏ.
- Kiểm thử Kotlin backend: MockK, kotest/JUnit 5, test coroutine (runTest).
- Migrate dần một codebase Java sang Kotlin: thứ tự, rủi ro, đo lường.
- (lead) Khi nào KHÔNG nên đưa Kotlin vào team Java.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6. Người đọc: dev Java 4 năm, ít va chạm doanh nghiệp lớn, cần giải thích **từ gốc, rất chi tiết, có ví dụ đời thực**.
- **Chỉ THÊM** câu mới vào cuối mảng trong `js/data/q-kotlin.js`; id tiếp nối số lớn nhất hiện có của topic (kiểm tra trùng id trước khi ghi). Không sửa câu cũ.
- TRƯỚC khi viết, đọc hết câu cùng topic để **không trùng ý**.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (bối cảnh thật, cách làm từng bước, ví dụ số liệu/artifact, bảng trade-off, pitfall) → `> Senior tip:`. 2500–4500 ký tự. `follow` 2–3 câu.
- Không backtick, không `${` trong template literal. Không chạy file .js trực tiếp, luôn dùng `node`. Đúng kỹ thuật với Java 17/21, Spring Boot 3.x; không bịa API/flag; không chắc thì bỏ.

## Nghiệm thu
`node --check js/data/q-kotlin.js`, `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + danh sách id mới vào Notes.

## Notes

Claude 2026-11-07: thêm 3 câu kotlin-027..029 (Ktor vs Spring, test MockK/runTest, value class). Các chủ đề còn lại của đề đã có trong kotlin-004/005/010/012/013/017..026 (vốn đã trùng nhau) nên không thêm.
Reviewed-by: kilo (T916R)
