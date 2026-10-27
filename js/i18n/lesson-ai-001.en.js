/* English translation of js/data/lesson-ai-001.js — AI Engineering Foundations.
 * Format: js/core/i18n.js (content overlay). Only loaded when English chosen. */
App.i18n.content({
  'lesson-ai-001': {
    title: 'AI Engineering Foundations: từ prompt, API và structured output đến measurement & production quality',
    goals: [
      'Giải thích được 3 thành phần cốt lõi của "AI Engineering": prompt, API contract và measurement.',
      'Viết một HTTP client Java 17 gọi endpoints chat-completions, gửi request và parse response JSON an toàn.',
      'Xây một pipeline đo lường deterministic: accuracy, precision@k, recall@k từ predictions và labels.',
      'Nêu ra checklist triển khai AI production (rate limit, retry, cache, logging, audit).',
    ],
    body: `### ⚡ Tóm tắt
AI Engineering không phải "viết prompt đẹp" mà là **lập trình hệ thống**: gọi endpoint model, định dạng payload JSON, nhận ` + '`response_format`' + `, xử lý lỗi, xếp hạng chất lượng và ghi số liệu. Trước khi dùng LLM, cần biết:
1. **Prompt** — đầu vào trò chuyện (system/user/assistant/tools).
2. **API contract** — HTTP method, header, body JSON, timeout, retry, quota.
3. **Measurement** — accuracy, precision@k, recall@k, hallucination rate, latency, cost.

Bài học chỉ hướng 3 việc:
- Gọi HTTP từ Java 17 với ` + '`java.net.http.HttpClient`' + `.
- Xây pipeline đo lường deterministic (test không ảo, không network).
- Nêu checklist ` + '`AI production`' + `.

> ⚠️ Không bao giờ ghi API key, prompt wall, transcript vào log. Log chỉ giữ method, endpoint, status, duration, request/response id (không body nhạy cảm).

### Cơ chế hoạt động: AI gọi API như thế nào?
Gọi ` + '`POST /v1/chat/completions`' + ` (OpenAI/OpenRouter style):
1. Client gửi `Authorization: Bearer <key>`, `Content-Type: application/json`.
2. Body gồm `model`, `messages[]`, `max_tokens`, `temperature`, `response_format` (nếu muốn JSON hợp lệ).
3. Server trả: `{"id": "...", "model": "...", "choices":[{"message":{"content":"..."}}]}`. `content` đôi khi là **1 string JSON** (structured output), cần `JSON.parse`.
4. Client phải parse lại và **xác thực lỗi**: parse thất bại → 502; `choices` rỗng → 502; HTTP 4xx → map lỗi (401 key sai, 429 rate limit, 400 bad request, 5xx provider error). Không tự trả JSON giả khi server lỗi.

### AI Engineering 5 layers
| Layer | Mô tả | Ví dụ | Lỗi thường gặp |
|---|---|---|---|
| System prompt | Hướng dẫn hành vi | "Bạn là interviewer Java senior…" | Prompt dài, mục đích không rõ, rò từ/khóa |
| Messages | Conversation history | `messages = [{role, content}]` | Sai thứ tự, múi giờ, lịch sử tràn ngập |
| API call | Request/response JSON | HttpClient, JSON.parse, response_format | Payload lớn, timeout, JSON không parse |
| Evaluation | Metric & rubric | accuracy, precision@k, latency, cost | Chỉ "thấy đúng" mà không có số; không đo 100 case |
| Production | Rate limit, retry, cache, logging, audit | Retry backoff, circuit breaker, log summarize | Retry vô hạn đẩy provider, log chứa PII/API key`

### Bài tập minh họa: HTTP client + JSON parse (Java 17)
Viết `Main` đọc JSON request từ stdin, gửi (mô ph Simmons, không dùng network), đọc response JSON string, in `OK_HTTP_200` / `HTTP_4xx` / `IO_ERROR`. Template chỉ dùng `java.net.http.HttpClient`, `java.io.*`, `java.util.*`.

> Kiểm tra: dùng `HttpClient`, `HttpRequest.BodyPublishers`, `HttpResponse.BodyHandlers`. Khuyến nghị: không gọi real endpoint vì flaky, không deterministic.

### Bài tập 2: Measurement (deterministic)
Viết class đo `accuracy`, `precisionAtK(k)`, `recallAtK(k)`. Dùng `Set<String>` để O(1). Test 100 trường hợp deterministic (tối thiểu 3→10 items).

### Kiểm tra nhanh
1. JSON từ AI (content = string JSON) trong Java 17 parse đúng cách? A) `toString()` rồi in ra; B) `new JSONObject(text)` / `new Gson().fromJson(text, T.class)`; C) không parse; D) chỉ in `content`.
2. `precision@k` khác `recall@k` ra sao? A) precision đo tỷ lệ top-k đúng; B) precision đo tỷ lệ top-k có ít nhất 1 label; C) precision lấy số lượng top-k đúng; D) precision lấy % tất cả label nằm trong top-k.
3. Xuất hiện 502 bad_json khi gọi AI, xử lý đúng? A) coi là 200; B) map internal code; 5xx/429 → retry backoff + fallback an toàn, không re-throw; C) lưu full payload để audit; D) throw RuntimeException.
4. Đâu không thuộc AI Engineering pipeline? A) Prompt design; B) API contract; C) Evaluation; D) Mua GPU cluster.
5. Lỗi HTTP 502 bad_json: sai? A) Roigate response sang object validate; B) fallback để user ask lại; C) retry cháy; D) luân hồi 5xx: exponential backoff + cap.`,

    check: [
      {
        q: 'How to parse a JSON string returned by AI (content = a JSON string) in Java 17?',
        options: [
          'Call `response.body().toString()` and print it.',
          'Use `new JSONObject(text)` or `new Gson().fromJson(text, T.class)`',
          'Do not parse JSON; the server sends valid JSON directly.',
          'Use `new java.util.Scanner(...)` line by line.',
        ],
        answer: 1,
        explain: 'Goal: <message>.content is a JSON string; parse the outer JSON then the content into an object. `new JSONObject` (org.json) or Gson/DOM parse correctly. Parsing ensures structured data, not raw text.'
      },
      {
        q: 'Given `labels=["a","b"]`, `predicted=["a","c"]`, `precisionAtK(2)` = ?',
        options: ['0.5', '0.0', '1.0', '0.33'],
        answer: 0,
        explain: 'Top-2 predictions: ["a","c"]. "a" is correct, "c" is wrong. Precision = 1/2 = 0.5.'
      },
      {
        q: 'What should an AI client do when it gets HTTP 502 "bad_json"?',
        options: [
          'Treat as success because HTTP was 200.',
          'Map to internal codes; for 5xx/429 use backoff + fallback; for bad_json ask to re-generate with a stricter schema.',
          'Log the full payload to disk for audit.',
          'Throw RuntimeException.',
        ],
        answer: 1,
        explain: 'Failure 4xx/5xx always maps to internal code; do not retry 4xx (client error); for 5xx/429 use exponential backoff with jitter and a hard cap; for bad_json ask the AI to re-generate with a stricter schema. Never leak the full request/response to the user.'
      },
      {
        q: 'Which one is NOT part of the "AI Engineering" pipeline?',
        options: [
          'Prompt design',
          'API contract (request/response)',
          'Evaluation & measurement',
          'Purchase a GPU cluster',
        ],
        answer: 3,
        explain: 'AI Engineering focuses on prompt, API contract, structured output, evaluation, and production quality. Buying a GPU is infrastructure, not product engineering.'
      },
    ],
    related: ['ai-001', 'ai-002', 'ai-003', 'ai-004', 'ai-005', 'ai-006'],
    tags: ['ai', 'engineering', 'evaluation', 'rag', 'prompt', 'pattern', 'java'],
  },
});
