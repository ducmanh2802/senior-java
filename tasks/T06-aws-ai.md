# T06 — Nội dung: AWS & Cloud, AI/LLM cho Java dev

Status: TODO
Agent: opencode
Owns: `js/data/q-aws.js`, `js/data/q-ai.js`

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
(agent ghi chú ở đây)
