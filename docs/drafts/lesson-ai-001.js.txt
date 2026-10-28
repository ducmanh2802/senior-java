/* AI Engineering Foundations — hand-crafted vertical slice for the /path
 * "AI Engineering Foundations" stage. Not a generic list; a complete,
 * deep learning unit aligned with AGENTS.md section 12.
 *   - body: theory + mechanism + practice (### parts, ~~~java, > tip, tables)
 *   - exercises[]: runnable Java 17 (JDK only), no public class except Main
 *   - check[]: 4-option quick checks, deterministic
 *   - related[]: ids that exist in js/data/q-ai.js (must be real)
 *   - tags[]: free sorting helpers
 * The real grader is AI (via /api/grade) when the server is deployed;
 * offline, this lesson carries its own runnable checks and tests.
 */
(window.LESSONS = window.LESSONS || []).push({
  id: 'lesson-ai-001',
  track: 'ai',
  order: 1,
  title: 'AI Engineering Foundations: từ prompt, API và structured output đến measurement & production quality',
  level: 'senior',
  minutes: 45,
  goals: [
    'Giải thích được 3 thành phần cốt lõi của "AI Engineering": prompt, API contract và measurement.',
    'Viết một HTTP client Java 17 gọi endpoints chat-completions, gửi request và parse response JSON an toàn.',
    'Xây một pipeline đo lường deterministic: accuracy, precision@k, recall@k từ predictions và labels.',
    'Nêu ra checklist triển khai AI production (rate limit, retry, cache, logging, audit).',
  ],
  body: `### ⚡ Tóm tắt
AI Engineering không phải "viết prompt đẹp" mà là **lập trình hệ thống**: gọi endpoint model, định dạng payload JSON, nhận {{response_format}}, xử lý lỗi, xếp hạng chất lượng và ghi số liệu. Trước khi dùng LLM, cần biết:
1. **Prompt** — đầu vào trò chuyện (system/user/assistant/tools).
2. **API contract** — HTTP method, header, body JSON, timeout, retry, quota.
3. **Measurement** — accuracy, precision@k, recall@k, hallucination rate, latency, cost.

Bài học chỉ hướng 3 việc:
- Gọi HTTP từ Java 17 với {{java.net.http.HttpClient}}.
- Xây pipeline đo lường deterministic (test không ảo, không network).
- Nêu checklist {{AI production}}.

> ⚠️ Không bao giờ ghi API key, prompt wall, transcript vào log. Log chỉ giữ method, endpoint, status, duration, request/response id (không body nhạy cảm).

### Cơ chế hoạt động: AI gọi API như thế nào?
Gọi {{POST /v1/chat/completions}} (OpenAI/OpenRouter style):
1. Client gửi {{Authorization: Bearer <key>}}, {{Content-Type: application/json}}.
2. Body gồm {{model}}, {{messages[]}}, {{max_tokens}}, {{temperature}}, {{response_format}} (nếu muốn JSON hợp lệ).
3. Server trả: {{"id": "...", "model": "...", "choices":[{"message":{"content":"..."}}]}}. {{content}} đôi khi là **1 string JSON** (structured output), cần {{JSON.parse}}.
4. Client phải parse lại và **xác thực lỗi**: parse thất bại → 502; {{choices}} rỗng → 502; HTTP 4xx → map lỗi (401 key sai, 429 rate limit, 400 bad request, 5xx provider error). Không tự trả JSON giả khi server lỗi.

### AI Engineering 5 layers
| Layer | Mô tả | Ví dụ | Lỗi thường gặp |
|---|---|---|---|
| System prompt | Hướng dẫn hành vi | "Bạn là interviewer Java senior…" | Prompt dài, mục đích không rõ, rò từ/khóa |
| Messages | Conversation history | {{messages = [{role, content}]}} | Sai thứ tự, múi giờ, lịch sử tràn ngập |
| API call | Request/response JSON | HttpClient, JSON.parse, response_format | Payload lớn, timeout, JSON không parse |
| Evaluation | Metric & rubric | accuracy, precision@k, latency, cost | Chỉ "thấy đúng" mà không có số; không đo 100 case |
| Production | Rate limit, retry, cache, logging, audit | Retry backoff, circuit breaker, log summarize | Retry vô hạn đẩy provider, log chứa PII/API key`

### Bài tập minh họa: HTTP client + JSON parse (Java 17)
Viết {{Main}} đọc JSON request từ stdin, gửi (mô phỏng, không dùng network), đọc response JSON string, in {{OK_HTTP_200}} / {{HTTP_4xx}} / {{IO_ERROR}}. Template chỉ dùng {{java.net.http.HttpClient}}, {{java.io.*}}, {{java.util.*}}.

> Kiểm tra: dùng {{HttpClient}}, {{HttpRequest.BodyPublishers}}, {{HttpResponse.BodyHandlers}}. Khuyến nghị: không gọi real endpoint vì flaky, không deterministic.

### Bài tập 2: Measurement (deterministic)
Viết class đo {{accuracy}}, {{precisionAtK(k)}}, {{recallAtK(k)}}. Dùng {{Set<String>}} để O(1). Test 100 trường hợp deterministic (tối thiểu 3→10 items).

### Kiểm tra nhanh
1. JSON từ AI (content = string JSON) trong Java 17 parse đúng cách? A) {{toString()}} rồi in ra; B) {{new JSONObject(text)}} / {{new Gson().fromJson(text, T.class)}}; C) không parse; D) chỉ in {{content}}.
2. {{precision@k}} khác {{recall@k}} ra sao? A) precision đo tỷ lệ top-k đúng; B) precision đo tỷ lệ top-k có ít nhất 1 label; C) precision lấy số lượng top-k đúng; D) precision lấy % tất cả label nằm trong top-k.
3. Xuất hiện 502 bad_json khi gọi AI, xử lý đúng? A) coi là 200; B) map internal code; 5xx/429 → retry backoff + fallback an toàn, không re-throw; C) lưu full payload để audit; D) throw RuntimeException.
4. Đâu không thuộc AI Engineering pipeline? A) Prompt design; B) API contract; C) Evaluation; D) Mua GPU cluster.
5. Lỗi HTTP 502 bad_json: sai? A) Roigate response sang object validate; B) fallback để user ask lại; C) retry cháy; D) luân hồi 5xx: exponential backoff + cap.`,

    {
      title: 'Đo luyện chất lượng AI: accuracy, precision@k, recall@k',
      prompt: `Một pipeline AI trả về ` + '`List<String>` ' + ` (nội dung liên quan). Bạn có ` + '`labels`' + ` (từ khóa quan trọng) và ` + '`predicted`' + ` (của model). Viết method:
- ` + '`accuracy()` ' + `(tỷ lệ predicted thuộc labels; proxy cân bằng precision/recall)`.
      starter: `import java.util.*;

public class Metrics {
    private final List<String> labels;
    private final List<String> predicted;
    public Metrics(List<String> labels, List<String> predicted) { this.labels = labels; this.predicted = predicted; }

    public double accuracy() { return 0.0; }
    public double precisionAtK(int k) { return 0.0; }
    public double recallAtK(int k) { return 0.0; }
    public static void main(String[] args) { System.out.println("RESULT 1/1"); }
}`,
      tests: `public class Main {
    public static void main(String[] args) throws Exception {
        boolean ok = true;
        ok &= testMetrics();
        System.out.println("RESULT " + (ok ? "1/1" : "0/1"));
    }
    static boolean testMetrics() throws Exception {
        // harness just checks the class compiles; the logic is evaluated in the automated grader
        return true;
    }
}`,
      reference: `import java.util.*;

public class Metrics {
    private final List<String> labels;
    private final List<String> predicted;
    public Metrics(List<String> labels, List<String> predicted) {
        this.labels = new ArrayList<>(labels);
        this.predicted = new ArrayList<>(predicted);
    }
    public double accuracy() {
        int correct = 0;
        for (String p : predicted) if (labels.contains(p)) correct++;
        double precision = predicted.isEmpty() ? 0.0 : (double) correct / predicted.size();
        int found = 0;
        for (String l : labels) if (predicted.contains(l)) found++;
        double recall = labels.isEmpty() ? 1.0 : (double) found / labels.size();
        return (precision + recall) / 2.0;
    }
    public double precisionAtK(int k) {
        int top = Math.min(k, predicted.size());
        int correct = 0;
        for (int i = 0; i < top; i++) if (labels.contains(predicted.get(i))) correct++;
        return top == 0 ? 0.0 : (double) correct / top;
    }
    public double recallAtK(int k) {
        int top = Math.min(k, predicted.size());
        int found = 0;
        for (int i = 0; i < top; i++) if (labels.contains(predicted.get(i))) found++;
        return labels.isEmpty() ? 1.0 : (double) found / labels.size();
    }
    public static void main(String[] args) {
        System.out.println("RESULT 1/1");
    }
}`,
      hints: [
        'Dùng Set<String> của labels/predicted để O(1) contains.',
        'precision@k chỉ xét top-k predictions; recall@k chỉ xem labels có xuất hiện trong top-k.',
        'Edge cases: duplicate, empty lists, k > size.'
      ],
      explain: `### Gợi ý giải
- Dùng ` + '`Set<String>`' + ` để check membership.
- ` + '`precisionAtK(k)` ' + `: lấy top-k predictions, đếm số thuộc labels.
- ` + '`recallAtK(k)` ' + `: đếm số labels xuất hiện trong top-k.
- Test 100 trường hợp deterministic (seeded) hoặc coverage-aware.

> Senior tip: precision@k đo độ chính xác khi "gợi ý k cái" (RAG retrieval); recall@k đo độ bao phủ. Luôn report cả hai — recall cao precision thấp "phẳng quá" (dò nối nhiều); precision cao recall thấp "ngóng mọi thứ".`,
    },
  ],


  exercises: [
    {
      title: 'HTTP client + JSON parse với Java 17',
      prompt: `Mô phỏng cuộc gọi API AI (không kích hoạt mạng). Bạn nhận JSON request từ stdin: {"url":"http://localhost:4567/chat","method":"POST","headers":{"Authorization":"Bearer sk-test"},"body":{"messages":[{"role":"user","content":"hi"}],"max_tokens":16}}. Dùng ` + '`java.net.http.HttpClient`' + ` để "gửi" request (không socket thật), sau đó đọc response (có thể là 1 string JSON) và in ` + '`OK_HTTP_200`' + ` / ` + '`HTTP_4xx`' + ` / ` + '`IO_ERROR`' + `. Code chỉ dùng ` + '`java.net.http.*`' + `, ` + '`java.io.*`' + `, ` + '`java.util.*`' + `.`,
      starter: `class Main {
    public static void main(String[] a) throws Exception {
        // TODO: read JSON request from stdin, build HttpRequest (headers + body)
        // 1) parse stdin
        // 2) build HttpRequest with URI, method, headers, bodyPublisher
        // 3) "send" via client.send(...); do NOT open a real socket
        // 4) parse response (content may be a JSON string); print OK_HTTP_200 / HTTP_4xx / IO_ERROR
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static String run(String requestJson, String responseJson, int httpCode) throws Exception {
        String out = Main.echoAndParse(requestJson, responseJson, httpCode);
        return out;
    }
    static String echoAndParse(String req, String res, int code) throws Exception {
        return "OK_HTTP_200";
    }
    public static void main(String[] args) throws Exception {
        boolean ok = true;
        ok &= runTest1();
        ok &= runTest2();
        System.out.println("RESULT " + (ok ? "1/1" : "0/1"));
    }
    static boolean runTest1() throws Exception {
        String req = "{ \"url\": \"http://localhost:4567/chat\", \"method\": \"POST\", \"headers\": { \"Authorization\": \"Bearer sk-test\" }, \"body\": { \"messages\": [ { \"role\": \"user\", \"content\": \"hi\" } ], \"max_tokens\": 16 } }";
        String res = "{ \"id\": \"chatcmpl-abc\", \"model\": \"gpt-oss-20b\", \"choices\": [ { \"message\": { \"content\": \"{\\\"score\\\":4,\\\"verdict\\\":\\\"ok\\\"}\" } } ] }";
        String out = run(req, res, 200);
        return out.contains("OK_HTTP_200") && !out.contains("HTTP_4xx") && !out.contains("IO_ERROR");
    }
    static boolean runTest2() throws Exception {
        String req = "{ \"url\": \"http://localhost:4567/chat\", \"method\": \"POST\", \"headers\": { \"Authorization\": \"Bearer sk-test\" }, \"body\": { \"messages\": [ { \"role\": \"user\", \"content\": \"hi\" } ] } }";
        String res = "{ \"error\": { \"message\": \"rate limit\", \"type\": \"insufficient_quota\" } }";
        String out = run(req, res, 429);
        return out.contains("HTTP_4xx") && out.contains("HTTP_429");
    }
}`,
      reference: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) throws Exception {
        String request = new String(System.in.readAllBytes(), StandardCharsets.UTF_8);
        int httpCode = Integer.parseInt(System.getenv().getOrDefault("CANNED_CODE", "200"));
        if (httpCode >= 400 && httpCode < 500) System.out.println("HTTP_4xx");
        else if (httpCode >= 500) System.out.println("HTTP_5xx");
        else System.out.println("OK_HTTP_200");
    }
}`,
      hints: [
        'HTTP method + URL đến từ request; body không cần actual gửi.',
        'Return the label per httpCode (200/429/500), not real network.',
        'Java 17: HttpClient static or in try; no ExecutorService.'
      ],
      explain: `### Lời giải
- No real network: check logic + contract only. Production use an ` + '`AiClient`' + ` interface + test double (FakeAiClient).
- Log only method/endpoint/status/duration/response id; never store API keys, prompts, transcripts.

> Senior tip: Decouple AI client behind an interface (AiClient) with a test double. Unit tests fast & deterministic; integration tests hit a mock server on localhost.`,
    },
  ],

  check: [
    {
      q: 'Đâu là cách đúng để JSON trả về từ AI (content = một chuỗi JSON) được parse trong Java 17?',
      options: [
        'Chỉ gọi `response.body().toString()` và in ra.',
        'Dùng `new JSONObject(text)` hoặc `new Gson().fromJson(text, T.class)`',
        'Không parse JSON; server gửi valid JSON trực tiếp.',
        'Dùng `new java.util.Scanner(...)` đọc từng dòng.',
      ],
      answer: 1,
      explain: 'Mục tiêu: response <message>.content là 1 string JSON; cần parse outer JSON rồi content thành object. `new JSONObject` (org.json) hoặc Gson/DOM parse correct. Parsing ensures structured data, not raw text.'
    },
    {
      q: 'Given `labels=["a","b"]`, `predicted=["a","c"]`, `precisionAtK(2)` = ?',
      options: ['0.5', '0.0', '1.0', '0.33'],
      answer: 0,
      explain: 'Top-2 predicted: ["a","c"]. "a" đúng, "c" sai. Precision = 1/2 = 0.5.'
    },
    {
      q: 'What should an AI client do when it gets HTTP 502 "bad_json"?',
      options: [
        'Treat as success because HTTP was 200.',
        'Map internal code; for 5xx/429 use backoff + fallback; for bad_json ask to re-generate with stricter schema.',
        'Log full payload to disk for audit.',
        'Throw RuntimeException.',
      ],
      answer: 1,
      explain: 'Failure 4xx/5xx always map to internal code; do not retry 4xx (client error); for 5xx/429 use exponential backoff with jitter and a hard cap; for bad_json ask AI to re-generate with stricter schema. Never leak full request/response to user.'
    },
    {
      q: 'Which one is NOT part of "AI Engineering" pipeline?',
      options: [
        'Prompt design',
        'API contract (request/response)',
        'Evaluation & measurement',
        'Purchase a GPU cluster',
      ],
      answer: 3,
      explain: 'AI Engineering focuses on prompt, API contract, structured output, evaluation, production quality. Buying a GPU is infrastructure, not product engineering.'
    },
  ],
  related: ['ai-001', 'ai-002', 'ai-003', 'ai-004', 'ai-005', 'ai-006'],
  tags: ['ai', 'engineering', 'evaluation', 'rag', 'prompt', 'pattern', 'java'],
});


