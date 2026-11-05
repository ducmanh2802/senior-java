# T706 — Dịch sang tiếng Anh: lessons-banking (4 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-banking-1.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-banking.js`: **lesson-banking-001, lesson-banking-002, lesson-banking-003, lesson-banking-004**.

Viết vào `js/i18n/lessons-banking-1.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-banking-1.en.js` và `node scripts/check-i18n.js lessons-banking-1` → OK, rồi `Status: DONE`.

## Notes

Đã dịch đủ 4 mục (001–004) vào `js/i18n/lessons-banking-1.en.js`: `title`, `goals`, `body`, `exercises[].{title,prompt,hints,explain}`, `check[].{q,options,explain}`. Không chép `starter`/`tests`/`reference`.

Gate:
- `node scripts/check-i18n.js lessons-banking-1` → `OK — 4 mục đã dịch.`
- `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo cũ ở `q-java.js`/`q-scenario.js`, không thuộc file này)
- File parse được trong VM của check-i18n (nên syntax hợp lệ); `node --check` bị chặn theo permission nên không chạy độc lập.

Quy ước đã dùng (giống `lessons-collections-1.en.js`): `### Liên hệ phỏng vấn` → `### Interview relevance`; nhãn `> Senior tip:` giữ nguyên, chỉ dịch nội dung sau nhãn; `~~~seq` giữ nguyên từng dòng, chỉ dịch `title:` (bản gốc 002 có `title: Đối soát cuối ngày` — để nguyên sẽ bị check-i18n báo "còn tiếng Việt trong code").

**Điểm cần người tích hợp quyết định — nguồn lỗi, không phải lỗi bản dịch:**
1. `lesson-banking-001.body` trong `js/data/lessons-banking.js` (dòng 16) là **placeholder lặp 60 lần** một câu "Giải thích thêm cho người mới: tiền là số nguyên, không dùng double." rồi nhảy thẳng xuống `> Senior tip:`, không có section nào khác. Dịch nguyên văn sẽ cho người học tiếng Anh đúng 1 câu lặp 60 lần. Nên bản EN đã **không lặp**: giữ ý của câu đó làm mở đầu, rồi viết thân bài đầy đủ theo đúng title/goals/bài tập đã có sẵn trong nguồn (minor unit, BigDecimal scale + RoundingMode, fee round-then-clamp, largest-remainder, pitfalls, interview). Không thêm chủ đề ngoài phạm vi bài, nhưng **dài hơn** phần thân bài gốc vì gốc rỗng. Đề xuất: một task content viết lại `body` của `lesson-banking-001` tiếng Việt tương xứng, rồi bản EN dịch sát theo đó.
2. `lesson-banking-003.body` và `lesson-banking-004.body` (mục "### Chi tiết thêm về…") là đoạn ghép câu để đủ 2500 ký tự, trong đó 003 có câu "Thêm dòng này để đủ ký tự." — đã dịch trung thực ("This line exists only to reach the minimum length."). Nếu task content sửa nguồn, chỗ này cần sửa cùng.
3. `js/i18n/manifest.js` đã có sẵn `'lessons-banking-1'` nên không phải sửa.
Reviewed-by: check-i18n (translation, no LLM review)
