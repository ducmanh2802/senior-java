# T504 — Dịch lại (nội dung đã sửa): lessons-spring-1 (5 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-spring-1.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-spring.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-spring-1.en.js` đã cũ: **lesson-spring-001, lesson-spring-002, lesson-spring-003, lesson-spring-004, lesson-spring-005**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-spring.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-spring-1.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-spring-1 → OK; node scripts/validate.js → OK.

## Notes
- Dịch lại toàn bộ 5 entry (001–005) theo nội dung tiếng Việt hiện tại, giữ nguyên key và tập field
  (title, goals, body, exercises[title,prompt,hints,explain], check[q,options,answer,explain]).
- Bổ sung các chi tiết mới của bản VI: `@Autowired` với một constructor duy nhất; `BeanCurrentlyInCreationException`
  và cờ `spring.main.allow-circular-references=false` từ Boot 2.6; CGLIB mặc định + thứ tự cách sửa self-invocation
  (tách bean / boundary ngoài / `TransactionTemplate`) + `@Transactional` protected/package-private từ Spring 6.0;
  bẫy rollback-only → `UnexpectedRollbackException`, checked exception commit mặc định, `rollbackFor` tính cả lớp con,
  `noRollbackFor`; 7 bước lifecycle (proxy tạo ở postProcessAfterInitialization nên `@PostConstruct` không có transaction),
  `ObjectProvider`/`@Lookup`, scope request/session; 6 bước request flow, RFC 9457, `application/problem+json`,
  `spring.mvc.problemdetails.enabled`; câu hỏi `check` thứ hai mới của cả 5 bài.
- Chuỗi tiếng Việt trong code mẫu của body đã dịch sang tiếng Anh; code/starter/tests/reference không chép sang file i18n.
- `node scripts/check-i18n.js lessons-spring-1` → OK; `node scripts/validate.js` → OK.
Reviewed-by: check-i18n (translation, no LLM review)
