/*
 * English translation of js/data/q-system-design.js — task T790. Format: js/core/i18n.js (content overlay).
 * ids: design-030 design-031 design-032 design-033 design-034 design-035
 */
App.i18n.content({
  'design-030': {
    q: 'Design a multi-channel notification service.',
    a: `**Summary:** at-least-once + dedup by (dedupKey,channel), per-channel queues, priority, retry+jitter, circuit breaker.

> Senior tip: OTP takes priority.`,
    follow: ['How is OTP prioritized?', 'Why is jitter needed?'],
  },
  'design-031': {
    q: 'Design a real-time leaderboard.',
    a: `**Summary:** Redis ZSET, atomic ZINCRBY, ZREVRANGE/ZREVRANK, DB as source of truth.`,
    follow: ['Tie-breaker?', 'Recovery?'],
  },
  'design-032': {
    q: 'Design real-time 1-1 and group chat.',
    a: `**Summary:** WebSocket, persist before broadcast, hybrid fan-out, presence, push when offline.`,
    follow: ['Fan-out?', 'Reconnect?'],
  },
  'design-033': {
    q: 'Design a news feed with celebrities.',
    a: `**Summary:** Hybrid fan-out, cursor-based pagination.`,
    follow: ['Why hybrid?', 'Cursor vs OFFSET?'],
  },
  'design-034': {
    q: 'Design file storage with deduplication.',
    a: `**Summary:** Content-addressable, chunking, reference counting.`,
    follow: ['Why chunking?', 'Reference counting?'],
  },
  'design-035': {
    q: 'Design ticketing that prevents overbooking.',
    a: `**Summary:** Hold TTL + SELECT FOR UPDATE, expiry worker, atomic confirm.`,
    follow: ['Pessimistic vs optimistic?', 'Hold expired?'],
  },
});
