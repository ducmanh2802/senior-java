# T06 — Nội dung: AWS & Cloud, AI/LLM cho Java dev

Status: DONE
Agent: opencode
Owns: `js/data/q-aws.js`, `js/data/q-ai.js`

> **Quan trọng — ghi theo lô nhỏ:** model miễn phí sẽ timeout (lỗi 504) nếu sinh cả file trong một lần.
> Viết **3–4 câu mỗi lần edit**, nối vào cuối danh sách (trước dòng `);`), rồi chạy `node --check <file>` sau mỗi lô.
> Lặp lại cho đến đủ số lượng. Không cần web search dài dòng; chỉ tra cứu khi thực sự không chắc về API.

## Mục tiêu
Viết câu hỏi kèm đáp án mẫu cho topic `aws` (file `q-aws.js`, ID từ `aws-001`) và `ai` (file `q-ai.js`, ID từ `ai-001`) theo `AGENTS.md` mục 4–6.
Văn phong theo mẫu `core-001` trong `js/data/q-java.js`. Chỉ dùng dịch vụ và API **có thật**, đừng bịa tên SDK class.

## Danh sách câu hỏi (bắt buộc bao phủ)
### aws (≥ 14 câu)
- Deploy Spring Boot lên AWS: EC2 vs ECS (Fargate) vs EKS vs Lambda, chọn thế nào
- Java trên Lambda: cold start, SnapStart, GraalVM native, tối ưu memory/CPU
- VPC: public/private subnet, NAT gateway, security group vs NACL, VPC endpoint
- IAM: role vs user, least privilege, IRSA / task role, không hard-code credentials
- RDS vs Aurora vs DynamoDB: chọn thế nào; DynamoDB partition key & hot partition, GSI
- S3: storage class, presigned URL, lifecycle, consistency, multipart upload
- SQS (standard vs FIFO, visibility timeout, DLQ) vs SNS vs EventBridge vs Kinesis vs MSK
- High availability & disaster recovery: multi-AZ vs multi-region, RTO/RPO, các chiến lược DR
- Auto Scaling, ALB vs NLB, health check, graceful shutdown khi scale-in
- ElastiCache Redis: use case, cluster mode, eviction
- Observability: CloudWatch logs/metrics/alarms, X-Ray / OpenTelemetry
- Secrets Manager vs Parameter Store; KMS envelope encryption
- Tối ưu chi phí AWS (rightsizing, Savings Plans, Spot, Graviton, data transfer)
- Infrastructure as Code: CloudFormation vs CDK vs Terraform; CI/CD (CodePipeline / GitHub Actions)
- Well-Architected Framework: 6 pillars, dùng để review kiến trúc
### ai (≥ 12 câu)
- LLM hoạt động ở mức đủ để dev hiểu: token, context window, temperature, hallucination
- Tích hợp LLM vào ứng dụng Java: Spring AI vs LangChain4j, ChatClient, structured output
- RAG: chunking, embedding, vector store (pgvector, OpenSearch…), retrieval, re-ranking; khi nào RAG vs fine-tune
- Prompt engineering cho production: system prompt, few-shot, output schema, prompt versioning
- Tool calling / function calling & agent; MCP (Model Context Protocol) là gì
- Đánh giá chất lượng (eval) ứng dụng LLM: golden dataset, LLM-as-judge, regression
- Chi phí & latency: caching (prompt cache, semantic cache), streaming, chọn model, giới hạn token
- Bảo mật: prompt injection, data leakage, PII, guardrails, rate limit
- Kiến trúc hệ thống chatbot hỏi đáp tài liệu nội bộ cho doanh nghiệp (system design AI)
- Vector database & similarity search (cosine, HNSW), trade-off recall/latency
- Dùng AI coding assistant (Copilot, Claude Code, Cursor) trong team: lợi ích, rủi ro, review code do AI viết
- Amazon Bedrock / OpenAI API / self-host model: chọn thế nào cho doanh nghiệp
- Observability cho LLM app: trace prompt/response, token usage, feedback loop

## Notes
- Đã hoàn thành `js/data/q-aws.js` (16 câu, `aws-001`…`aws-016`) và `js/data/q-ai.js` (13 câu, `ai-001`…`ai-013`), phủ toàn bộ danh sách bắt buộc.
- Level: aws 2 mid / 11 senior / 3 lead; ai 2 mid / 9 senior / 2 lead. Đáp án dài 2.675–3.900 ký tự, có `**Tóm tắt:**`, ví dụ/code khi phù hợp và `> Senior tip:`.
- Nội dung dùng API/dịch vụ thật (Spring AI `ChatClient`/`entity`, LangChain4j `AiServices`, MCP, SnapStart, IRSA/EKS Pod Identity, Aurora Global Database, HNSW…). Không có backtick thô trong template literal, không dùng `${`.
- Đã chạy `node --check` cho cả hai file và `node scripts/validate.js`: **OK — không có lỗi**, không có cảnh báo.
- Không sửa file ngoài quyền sở hữu; không commit/push.
