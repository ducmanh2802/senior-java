/*
 * English translation of js/data/q-ai.js — task T211. Format: js/core/i18n.js (content overlay).
 * ids: ai-019 ai-020 ai-021 ai-022 ai-023 ai-024 ai-025 ai-026
 */
App.i18n.content({
  'ai-019': {
    q: 'Your boss asks "how accurate is our RAG chatbot, and does the new version beat the old one?" — which metrics do you use to evaluate RAG quality, and how do you build regression tests?',
    a: `**Summary:** Split RAG into two parts and measure separately. **Retrieval**: whether the correct documents are retrieved (context recall, recall@k, MRR, context precision). **Generation**: whether the answer follows the context (**faithfulness**), whether it answers the question correctly (**answer relevance**), and whether it matches a reference answer (answer correctness). Measure on a fixed golden dataset, run in CI, compare against baseline, and calibrate the LLM-as-judge using human labels.`,
    follow: [
      'How do you calibrate the LLM-as-judge with human labels?',
      'How do you extract real questions from logs into the golden set while respecting data privacy regulations?',
      'Faithfulness is high but users still complain about answers: what do you investigate next?'
    ]
  },
  'ai-020': {
    q: 'The bank wants to use an LLM to summarize call center conversations and support agents in searching customer records. As architect, how do you handle customer data, PII masking, data residency and audit?',
    a: `**Summary:** Treat every LLM call as sending data to a third party until you prove otherwise. Architecture should have a single internal **LLM gateway**: classify data, mask/pseudonymize PII before sending, only allow approved models and regions, control access by the caller, log fully but protect the logs themselves as customer data. The most sensitive data runs inside an approved infrastructure; responsibility for impacts always falls on the accountable person.`,
    follow: [
      'How do you balance the reduction in summarization quality caused by PII masking (the model no longer knows who is who)?',
      'When is it mandatory to self-host a model instead of using the provider\'s API?',
      'How do you prove to auditors that no PII is sent outside?'
    ]
  },
  'ai-021': {
    q: 'A Spring Boot service calls an LLM through Spring AI ChatClient. During peak hours, the provider returns 429/503, with requests hanging longer than 10 minutes draining the thread pool. How do you design timeout, retry, circuit breaker and fallback?',
    a: `**Summary:** LLM calls are slow and often hit quotas, so you need: timeout from the request time budget; limited retries, only for transient errors and at one layer; treat 429 as a signal of backpressure (rate limit from your side, queue) rather than blind retry; circuit breaker and bulkhead to keep the service up if the provider slows down; and fallback that has passed eval. Spring AI's default retry is too generous and needs tuning.`,
    follow: [
      'Why can\'t you retry during response once the user has streamed part of the answer?',
      'How do you pick the slow-call threshold for the circuit breaker based on metrics?',
      'How do you split token quota per minute across multiple instances and tenants?'
    ]
  },
  'ai-022': {
    q: 'After adding the "remember conversation" feature to the bank chatbot, one customer received a reply mentioning another customer\'s transaction. You investigated the root cause and designed how to make chat memory safe for multiple users (Spring AI / LangChain4j)?',
    a: `**Summary:** LLM has no memory; "memory" is the old messages reloaded into the prompt according to a **conversation key**. Cross-leakage almost always happens because the key is wrong: default key shared, key taken from the client without permission check (IDOR), or one memory instance shared by everyone. The right approach: generate the key server-side and bind it to the authenticated user, check ownership on every request, bound the size and expiry of memory, and separate memory from audit history.`,
    follow: [
      'When conversations get long, how do you summarize memory without losing important facts?',
      'How do you write automated tests to catch memory leakages between two users?',
      'When a customer requests personal data deletion, in what places does the chatbot need to delete it?'
    ]
  },
  'ai-023': {
    q: 'The RAG system on PostgreSQL + pgvector has 2 million chunks, source documents change daily, and you are about to switch the embedding model. How do you incrementally update the index, delete documents and switch models without downtime?',
    a: `**Summary:** Treat the vector index as **derived data with versioning**: each chunk stores doc_id, content hash, embedding model name and ACL metadata. Incremental updates work by comparing hashes, embedding only changed chunks, and writing to DB in short transactions. Switch models with blue/green: new column or table, backfill in background, build index concurrently, then swap queries. And remember that for HNSW indexes on pgvector, WHERE filters are applied **after** the index scan.`,
    follow: [
      'When would you switch from pgvector to a dedicated vector database?',
      'Should repeated chunks (e.g., shared clauses across documents) be stored and cited?',
      'How do strict_order and relaxed_order differ in iterative index scans?'
    ]
  },
  'ai-024': {
    q: 'Your Spring Boot service uses ChatClient to extract data and respond to customers. Testing against the real model is slow, costs money and sometimes passes sometimes fails. How do you organize testing (unit, integration, eval) so CI is fast yet catches quality bugs?',
    a: `**Summary:** Split the two questions: **does your code work** (deterministic, tested with a mock model, run on every commit) and **does the model answer well** (probabilistic, measured on a golden set with the real model, run when prompts/models/retrieval change). Don't deep-mock the fluent API of ChatClient; replace {{ChatModel}} with a stub and keep the real ChatClient.`,
    follow: [
      'How do you handle eval cases that pass then fail between runs?',
      'How do you test the streaming flow and tool calling without calling the real model?',
      'Who maintains the golden set and how is it updated according to what process?'
    ]
  },
  'ai-025': {
    q: 'The provider announces that the model you are currently using will stop supporting 6 features after 90 days. As tech lead, how do you plan the transition to a new model so you can prove quality doesn\'t drop and rollback is possible?',
    a: `**Summary:** Switching the model is a **risky release**, not editing a single config line. Plan: inventory where the model is used and pin versions; offline eval on the golden set (hard metrics first, pair comparison by LLM-as-judge after debiasing); tune prompts for the new model; shadow or canary on real traffic with metric gates and rollback by feature flag; decide on statistically meaningful numbers.`,
    follow: [
      'The new model scores higher on the judge but costs 30% more: how do you present this to the product owner?',
      'What approvals are needed when shadowing traffic with bank customer data?',
      'How do you detect the provider secretly changing behavior of the same model id?'
    ]
  },
  'ai-026': {
    q: 'An AI assistant for bank customer service staff reads customer emails, searches CRM and displays answers in markdown. A pentest sends an email containing hidden instructions and extracts another customer\'s CCCD through a link image. How do you analyze the vulnerability and stop it?',
    a: `**Summary:** This is **indirect prompt injection** plus **data exfiltration through output**: the instruction sits in the email (untrusted data), the model follows it, calls the CRM tool and injects data into the URL of the rendered markdown image; the browser loads it automatically, so data leaks out without clicking. Can't patch with "don't follow the instruction in the email". Must break the **lethal trifecta** (sensitive data, untrusted content, external channel), restrict tools by context and control output before rendering.`,
    follow: [
      'How does a dual-LLM setup (one model isolating to read untrusted data) work and what are its limits?',
      'Why is filtering output by regex not enough and what does the markdown renderer need configured?',
      'How do you build a red team prompt injection test suite for Vietnamese?'
    ]
  }
});
