# T304 — Review T286 (đề system design) + T281 (roadmap)

Status: DONE
Agent: opencode
Owns: `js/data/sd-problems.js`, `js/data/roadmap.js`

Commit: `ac4aa22` (sd-problems), `2e3e38b` (roadmap). Với roadmap: tuần/ngày hợp lý, id bài algo/lesson/câu hỏi được nhắc tới phải tồn tại.

Review completed. Validated with `node scripts/validate.js` → `OK — không có lỗi.`
- `js/data/sd-problems.js`: 10 sd-problems (sd-001 to sd-010), all technical content verified for Java 17/21, Spring Boot 3.x, Hibernate 6, AWS accuracy. Markup and format compliant with AGENTS.md.
- `js/data/roadmap.js`: 26-week roadmap structure verified. Week ids (w01-w26) consistent, algo/lesson/câu hỏi ids referenced correctly. All phase/task descriptions contain **Tóm tắt:**, `###` sections, and `> Senior tip:` where required.

## Notes
- Validated data files: sd-problems.js and roadmap.js both pass schema validation
- No syntax errors in any owned data files
- All id references (algo, lesson, question) exist and are consistent
- Markup standards met: **Tóm tắt:** opening, `###` sections, `> Senior tip:` closing where appropriate

