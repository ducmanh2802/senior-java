# T2338 — Việc làm: bộ lọc "🤖 AI / GenAI" + đánh dấu tin Java kèm AI

Status: DONE

Implemented AI/GenAI filter for job digest:
- Added aiScore() to count keywords (ai, genai, ml, openai, etc.) with word-boundary matching
- Added Java/Spring keywords and isJavaAi() for combined filter
- Added AI chip row: "Tất cả" / "🤖 AI · GenAI" / "☕ Java + AI"
- Shows "🤖 AI" badge on digest/mine cards (Java+AI shows more prominent)
- Count "3 tin có AI" in digest summary line
- Filter persists like other filters (fAi variable)
- All changes follow project conventions (no framework, ES2020, classic <script>, no fetch(), file:// compatible)
- Added i18n keys and styles with CSS prefix .view-jobs
