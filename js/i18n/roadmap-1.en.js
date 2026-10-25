/*
 * English translation of js/data/roadmap.js — task T246. Format: js/core/i18n.js (content overlay).
 * ids: __roadmap
 */
App.i18n.content({
  __roadmap: {
    goal: 'Senior Java Interview Prep — Big Tech & Banking, 26 weeks',
    targets: [
      {
        name: 'Banking / Fintech',
        focus: [
          'Transaction & consistency, locking, isolation level',
          'Security, audit log, compliance (PCI DSS, State Bank of Vietnam)',
          'Oracle/PostgreSQL, SQL optimization, batch processing & reconciliation',
          'Kafka, idempotency, Saga/Outbox',
          'Production scenarios & system stability'
        ]
      },
      {
        name: 'Big tech / Product',
        focus: [
          'LeetCode algorithms easy–medium (~150 problems)',
          'System design with load estimation',
          'Deep dive into Concurrency & JVM',
          'English interview (for multinational companies)',
          'Behavioral interviews using STAR, ownership'
        ]
      }
    ],
    project: {
      name: 'Portfolio project: Mini Payment / Wallet Service',
      desc: 'Build over 6 months to have a real story for interviews: Spring Boot 3 + PostgreSQL + Redis + Kafka, double-entry ledger, idempotency key, Outbox, import CSV bank statement reconciliation, observability, deploy AWS/Vercel for frontend. Push to GitHub with architecture README + ADR.'
    },
    phases: [
      {
        name: 'Phase 1 — Solid Java Fundamentals',
        weeks: [
          {
            title: 'Core Java & Initial Assessment',
            algo: '8 Easy problems: Array, Hash Map',
            tasks: [
              'Do 1 "Full loop" mock interview to know the starting point',
              'Review all Core Java questions in the Question Bank, honestly rate status',
              'Write a draft CV following the STAR format for each project',
              'Initialize portfolio project repo (Spring Boot 3, Java 21)'
            ]
          },
          {
            title: 'Collections & HashMap internals',
            algo: '8 problems: Two Pointers, Hash Map',
            tasks: [
              'Draw HashMap / ConcurrentHashMap structure from memory',
              'Read java.util.HashMap source code (putVal, resize)',
              'Complete Collections Quiz ≥ 80%'
            ]
          },
          {
            title: 'Modern Java 8 → 21',
            algo: '8 problems: Sliding Window',
            tasks: [
              'Refactor 1 legacy module to use records, switch pattern matching, Stream',
              'Project: design Account / Transaction / LedgerEntry domain'
            ]
          },
          {
            title: 'Java Comprehensive Review + Buffer',
            algo: '6 problems: Stack, review missed ones',
            tasks: [
              'Use Flashcard in "Only review unknown" mode until ≥ 70% Known',
              'Mock interview preset "Java Backend Senior" (5 questions)'
            ]
          }
        ]
      },
      {
        name: 'Phase 2 — Concurrency & JVM (Senior Classification Criteria)',
        weeks: [
          {
            title: 'Java Memory Model, lock, atomic',
            algo: '8 problems: Binary Search',
            tasks: [
              'Write a race condition demo + fix in 3 ways (synchronized, Lock, Atomic)',
              'Project: transfer money between 2 wallets safely in parallel (optimistic vs pessimistic)'
            ]
          },
          {
            title: 'Thread pool, CompletableFuture, virtual threads',
            algo: '8 problems: Linked List',
            tasks: [
              'Benchmark platform thread vs virtual thread for IO-bound API',
              'Speak out loud 5 concurrency questions, timed 3 minutes/question'
            ]
          },
          {
            title: 'JVM memory & GC',
            algo: '8 problems: Tree DFS/BFS',
            tasks: [
              'Create an intentional memory leak, take heap dump, analyze with Eclipse MAT',
              'Read G1 GC log, experiment with ZGC on Java 21'
            ]
          },
          {
            title: 'Troubleshooting production',
            algo: '6 problems: Tree + review missed ones',
            tasks: [
              'Practice "CPU 100%" and "OOM on Kubernetes" processes (Scenario questions)',
              'Mock interview Java Backend Senior 8 questions, target average score ≥ 3.5'
            ]
          }
        ]
      },
      {
        name: 'Phase 3 — Spring, JPA, Database (Banking focus)',
        weeks: [
          {
            title: 'Spring core, @Transactional, AOP',
            algo: '8 problems: Heap / Priority Queue',
            tasks: [
              'Prove self-invocation @Transactional error with tests',
              'Project: money transfer API with idempotency key + ProblemDetail'
            ]
          },
          {
            title: 'JPA/Hibernate & Performance',
            algo: '8 problems: Graph BFS/DFS',
            tasks: [
              'Enable SQL log, find and fix N+1 in the project',
              'Batch insert 1 million rows: compare IDENTITY vs SEQUENCE'
            ]
          },
          {
            title: 'SQL, index, isolation, locking',
            algo: '8 problems: Graph (topo sort, union-find)',
            tasks: [
              'Read EXPLAIN ANALYZE of 10 queries, optimize with appropriate indexes',
              'Reproduce deadlock + lost update on PostgreSQL, then fix',
              'Review Oracle (used heavily in banking): sequence, partition, execution plan'
            ]
          },
          {
            title: 'DB Scenarios & large files',
            algo: '6 problems: review missed ones',
            tasks: [
              'Project: import 1 million bank statement rows (streaming + batch + row-level error reporting)',
              'Mock interview preset "Practical Scenarios"'
            ]
          }
        ]
      },
      {
        name: 'Phase 4 — Microservices & Distributed Systems',
        weeks: [
          {
            title: 'Microservices architecture, communication, resilience',
            algo: '8 problems: Dynamic Programming 1D',
            tasks: [
              'Add Resilience4j (timeout, retry, circuit breaker) for external calls',
              'Draw project architecture, write first ADR'
            ]
          },
          {
            title: 'Kafka, Outbox, Saga, idempotency',
            algo: '8 problems: DP 2D',
            tasks: [
              'Project: Transactional Outbox → Kafka → notification service',
              'Handle duplicate & out-of-order messages (consumer idempotent)'
            ]
          },
          {
            title: 'Observability, security, deploy',
            algo: '8 problems: Backtracking',
            tasks: [
              'Add Micrometer + OpenTelemetry tracing, p95/p99 dashboard',
              'Spring Security OAuth2 resource server + JWT'
            ]
          },
          {
            title: 'Design patterns & Clean Architecture',
            algo: '6 problems: Greedy / Intervals',
            tasks: [
              'Refactor project using hexagonal architecture (ports & adapters)',
              'Mock interview "Microservices & System Design"'
            ]
          }
        ]
      },
      {
        name: 'Phase 5 — System Design & Cloud',
        weeks: [
          {
            title: 'Framework system design + caching',
            algo: '8 medium problems mixed',
            tasks: [
              'Practice 45-minute framework: requirements → estimation → API → data → architecture → deep dive',
              'Design URL shortener & rate limiter on paper, speak out loud'
            ]
          },
          {
            title: 'System design for banking/fintech',
            algo: '8 medium problems mixed',
            tasks: [
              'Design e-wallet / payment: ledger, idempotency, reconciliation',
              'Design flash sale with oversell prevention'
            ]
          },
          {
            title: 'AWS for backend',
            algo: '8 medium problems mixed',
            tasks: [
              'Deploy project to AWS (ECS Fargate or EC2 + RDS), use Secrets Manager',
              'Draw multi-AZ architecture, specify RTO/RPO'
            ]
          },
          {
            title: 'System design comprehensive review',
            algo: '6 hard problems selected',
            tasks: [
              '3 system design problems, 45 minutes each, record and self-review',
              'Mock interview "Full loop"'
            ]
          }
        ]
      },
      {
        name: 'Phase 6 — AI, testing, soft skills & English',
        weeks: [
          {
            title: 'AI/LLM for Java dev',
            algo: '8 problems reviewing weak patterns',
            tasks: [
              'Project: add bank statement Q&A feature using Spring AI + RAG (pgvector)',
              'Prepare story "how you use AI tools in your work"'
            ]
          },
          {
            title: 'Testing & Quality',
            algo: '8 problems reviewing weak patterns',
            tasks: [
              'Testcontainers for PostgreSQL + Kafka in project',
              'Write your own code review checklist'
            ]
          },
          {
            title: 'Behavioral & leadership (STAR)',
            algo: '8 problems: Coding round mock',
            tasks: [
              'Prepare 8 STAR stories with metrics (incidents, disagreements, mentoring, bad decisions...)',
              'Prepare questions to ask the interviewer & salary negotiation strategy'
            ]
          },
          {
            title: 'English interview',
            algo: '6 problems: Coding round mock',
            tasks: [
              'Practice 2-minute "Tell me about yourself", record 5 times',
              'Mock interview preset "English Interview" ×2'
            ]
          }
        ]
      },
      {
        name: 'Phase 7 — Final Sprint & Application',
        weeks: [
          {
            title: 'High-intensity mock interview',
            algo: '10 problems mixed, timed 25 minutes/problem',
            tasks: [
              '1 mock interview session per day (rotate presets)',
              'Ask friends/colleagues to mock a real session',
              'Finalize CV + LinkedIn + Project README; start applying to "practice" companies first'
            ]
          },
          {
            title: 'Real interview & lessons learned',
            algo: 'Maintain 3–5 problems/week',
            tasks: [
              'After each interview round: record questions, add to review, self-rate',
              'Flashcard review "Only review unknown" 20 minutes daily',
              'Negotiate offer: compare total compensation, career path, technology'
            ]
          }
        ]
      }
    ]
  }
});