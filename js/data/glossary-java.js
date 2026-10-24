/*
 * Glossary (window.GLOSSARY): hard terms are auto-linked inside every .md block; click opens a modal (js/core/glossary.js).
 * { id: "idempotency-key",                 // kebab-case, unique across all glossary-*.js
 *   term: "Idempotency key",               // display name
 *   aliases: ["idempotency key", "idempotency-key"],   // lowercase phrases matched in text (2+ chars, longest wins)
 *   short: "1 câu giải thích dễ hiểu",       // tooltip / first line of the modal
 *   body: `markup (AGENTS.md mục 5): ### Ví dụ đời thường, ### Cơ chế, ~~~text sơ đồ ASCII ~~~, ### Khi nào dùng, ### Hay nhầm với`,
 *   refs: [{ type: "video"|"doc"|"article", title, url, note? }],   // 1-3, link THẬT, kiểm tra bằng node scripts/check-links.mjs
 *   related: ["retry", "payment-intent"] } // ids of other glossary entries
 */
(window.GLOSSARY = window.GLOSSARY || []).push(
);
