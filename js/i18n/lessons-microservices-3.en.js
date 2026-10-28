/*
 * English translation of js/data/lessons-microservices.js — task T276. Format: js/core/i18n.js (content overlay).
 * ids: lesson-microservices-003
 */
App.i18n.content({
  'lesson-microservices-003': {
    title: 'Saga orchestration: immutable state and compensation',
    goals: [
      'Explain the core concepts of saga: append-only log, versioning, replay',
      'Describe how compensation differs from rollback and why it is idempotent',
      'Understand the trade-offs between orchestration and choreography',
    ],
    body: `### Saga vs Traditional Storage
In traditional systems, the database is the **source of truth**: the current state is derived from the latest write. Every write overwrites the previous state.

In **event sourcing** (or saga), the database only stores a sequence of **events** (factual records of things that happened). The current state is **reconstructed** by replaying all events for a given aggregate.

### Why saga?
- **Full audit trail**: Every change is recorded with a timestamp and user/context.
- **Reconstruct any state**: Replay events to rebuild the system state at any point in time.
- **Temporal queries**: Query what the state was at any past moment without needing backups.
- **Decoupling**: Producers write events; consumers process them independently. No direct coupling between write and read models.

### Core concepts
- **Aggregate**: The root entity that encapsulates business invariants. Events are emitted when the aggregate changes state.
- **Event**: A fact that something happened. Typically named in past tense (e.g., {{OrderPlaced}}, {{CustomerRegistered}}).
- **Projection**: A read model that is updated by consuming events. Projections can be materialized views, search indexes, or UI updates.
- **Snapshot**: A snapshot of the aggregate state at a given version, taken to avoid replaying all events for performance.

### Typical flow
1. **Command**: A client sends a command (e.g., {{PlaceOrder}}) to change state.
2. **Domain logic**: The aggregate validates the command, emits one or more events, and updates its internal state.
3. **Event store**: Events are appended to the log (often with {{version}} and {{timestamp}}).
4. **Projection update**: Event handlers update read models (e.g., update a SQL table, a search index, a UI component).
5. **Query**: Applications read from the projection, not the event store directly.

### When to use saga
- When you need a complete audit history (finance, healthcare, compliance).
- When you need to rebuild state or answer temporal questions.
- When you have complex domain invariants that benefit from explicit event modeling.
- When you want to decouple write and read models (CQRS).

### When to avoid it
- When simplicity is paramount and you don't need history.
- When the event volume is very high and replay is too costly.
- When the domain is simple CRUD without complex invariants.

### Example: Order aggregate (simplified)
~~~
class Order {
  OrderId id;
  State state; // NEW, CONFIRMED, SHIPPED, CANCELLED;
  List<OrderEvent> events = new ArrayList<>();

  void placeOrder(CustomerId customerId, Money money) {
    if (state != State.NEW) throw new IllegalStateException();
    events.add(new OrderPlaced(id, customerId, money, Instant.now()));
    state = State.CONFIRMED;
  }

  void shipOrder() {
    if (state != State.CONFIRMED) throw new IllegalStateException();
    events.add(new OrderShipped(id, Instant.now()));
    state = State.SHIPPED;
  }

  List<OrderEvent> getEvents() { return events; }
}
~~~

### Example projection (read model)
~~~java
@Query("SELECT o.orderId, o.total, o.status, o.createdAt FROM Orders o")
List<OrderDto> findAll();
~~~
`,
    exercises: [],
    check: [],
  },
});