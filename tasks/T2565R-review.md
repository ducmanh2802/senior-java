# T2565R — Fact-check nội dung mới của T2565

Status: DONE
Agent: opencode
Owns: `js/data/quiz.js`

Reviewed T2565 added 10 quiz questions (qz-frontend-023 to qz-frontend-032). Fixed 2 technical errors:
1. qz-frontend-025: `watch(user.profile, callback)` on reactive object creates implicit deep watcher in Vue 3; scenario changed to `watch(() => user.profile, callback)` to make shallow-watch behavior correct, with `{ deep: true }` / `watch(() => user.profile.ten, callback)` as fixes.
2. qz-frontend-031: Fixed `ref="inputel"` → `ref="inputEl"` casing mismatch in template-ref example (`const inputEl` vs `ref="inputel"`) which would cause ref binding to fail silently.

All other 8 questions (frontend topics: v-for key strategy, reactive/ref primitives, watch composition API, onLifecycle, CORS, Vite dist, provide/inject) verified correct per Vue 3/AGENTS.md standards.
