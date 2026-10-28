/*
 * English translation of js/data/lessons-microservices.js — task T276. Format: js/core/i18n.js (content overlay).
 * ids: lesson-microservices-004
 */
App.i18n.content({
  'lesson-microservices-004': {
    title: 'Circuit Breaker: preventing cascading failures',
    goals: [
      'Explain the three states of a circuit breaker: Closed, Open, Half-Open',
      'Describe how timeout and error threshold control circuit behavior',
      'Understand how a circuit breaker prevents cascading failures across services',
    ],
    body: `### Circuit Breaker Pattern
A circuit breaker is a resilience pattern that prevents cascading failures in distributed systems. It wraps a remote service call and monitors for failures.

### Three States
- **Closed**: Normal operation. Calls pass through to the remote service. Failure statistics are tracked.
- **Open**: The circuit has "tripped" because too many failures occurred. All calls are immediately rejected without attempting the remote call. A timeout timer may be running to transition to Half-Open.
- **Half-Open**: A limited number of test calls are allowed through to verify if the remote service has recovered. If they succeed, the circuit transitions back to Closed. If they fail, it reopens.

### Configuration
- **Error threshold**: Number of failures within a time window that triggers the circuit to open.
- **Timeout**: How long to wait for a response before considering it a failure.
- **Sleep window**: Duration to wait in Half-Open state before allowing test calls.

### Why use a circuit breaker?
- **Fail fast**: Callers don't waste time waiting for a slow or failing remote service.
- **Resource protection**: Prevents exhaustion of threads, connections, or CPU from repeated retries.
- **Graceful degradation**: The system can continue operating with reduced functionality (e.g., show cached data instead of failing).
- **Faster recovery**: Automatic transition to Half-Open allows testing if the remote service has recovered.

### Implementation insights
- Most languages have libraries (Hystrix for Java/Spring, opossum for Node, resilience4j for Java 8+).
- Key configuration parameters often need tuning based on traffic patterns and service level objectives.
- Circuit breakers work best idempotent or safely retryable operations.
- Monitoring circuit state transitions is essential for observability.

### Example: Resilience4j circuit breaker (Java)
~~~java
CircuitBreaker cb = CircuitBreaker.ofDefaults("order-service");
Supplier<String> supplier = CircuitBreaker.decorateSupplier(cb, () -> {
    // call remote service
    return restTemplate.getForObject(url, String.class);
});
try {
    String response = supplier.get();
} catch (Exception e) {
    // circuit may have tripped
}
~~~
`,
    exercises: [],
    check: [],
  },
});