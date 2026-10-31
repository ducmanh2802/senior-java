/* English translation for quiz-gaps (kotlin: qz-kotlin-018, qz-kotlin-019, qz-kotlin-020) */
App.i18n.content({

'qz-kotlin-018': {
  q: `A Kotlin module is called from legacy Java code. Which statements are **correct**? (Choose 2)`,
  options: [
    'Function with default parameters: Java must pass all arguments unless the Kotlin function has @JvmOverloads',
    'Top-level function in Utils.kt is called from Java as Utils.format(...)',
    'Function in companion object of Foo is called from Java via Foo.Companion.bar(); add @JvmStatic to call Foo.bar()',
    'Kotlin function throwing IOException is called from Java in try { } catch (IOException e) normally without any extra declaration'
  ],
  explain: `**Correct answer: options 1 and 3.**

### Why correct
- **Default argument**: Java has no concept of default parameters. The compiler only generates one method with all parameters (plus an internal synthetic method). {{@JvmOverloads}} generates additional overloads that omit default parameters from the end.
- **Companion**: companion object is a real object (static field {{Companion}}), so Java calls {{Foo.Companion.bar()}}. {{@JvmStatic}} generates an additional static method on Foo.

### Why others are wrong
- **Utils.format**: top-level function lives in class {{UtilsKt}}, so Java calls {{UtilsKt.format(...)}}. To change the name use {{@file:JvmName("Utils")}} at the top of the file.
- **Catch IOException**: Kotlin has no checked exceptions, so the generated method does not declare {{throws IOException}}. The Java compiler will error "exception IOException is never thrown in body of corresponding try statement". Must add {{@Throws(IOException::class)}} on the Kotlin side.

### Other interop annotations
{{@JvmField}} (expose field instead of getter/setter), {{@JvmName}} (rename when signatures clash after type erasure).

> Senior tip: when gradually migrating a Java codebase to Kotlin, write a few Java tests that call the public Kotlin API; that's the cheapest way to keep the API friendly to the Java side.`
},

'qz-kotlin-019': {
  q: `What does the following Kotlin code print?
~~~java
data class Cart(val items: MutableList<String>)

val a = Cart(mutableListOf("x"))
val b = a.copy()
b.items.add("y")
println(a.items)
~~~`,
  options: [
    '[x]',
    '[x, y]',
    'Compilation error because items is val',
    '[y]'
  ],
  explain: `**Correct answer: [x, y].**

### Mechanism
{{copy()}} of a data class creates a new object by calling the constructor with **the same references** of the properties (shallow copy). {{b.items}} and {{a.items}} are the **same** MutableList, so adding "y" via b is visible to a.

{{val}} only means the **reference** cannot be reassigned ({{b.items = ...}} is an error), it does **not** mean the object inside is immutable.

### Why others are wrong
- **[x]**: would only be true if copy were a deep copy, but Kotlin does not deep copy automatically.
- **Compilation error**: calling {{add()}} on the list mutates its contents, not reassigning the val property.
- **[y]**: copy does not create a new empty list.

### Correct approach
- Use {{List}} (read-only) and create a new list when changing:
~~~java
data class Cart(val items: List<String>)
val b = a.copy(items = a.items + "y")   // new list, a unchanged
~~~
- Or manually copy on copy: {{a.copy(items = a.items.toMutableList())}}.

> Senior tip: data class containing a mutable collection has both the sharing bug above and a hashCode that changes with contents, very dangerous when used as a Map key or in UI/Redux-style store state. Default to val + read-only type.`
},

'qz-kotlin-020': {
  q: `The following job does heavy computation; calling {{job.cancel()}} but the loop runs to completion. Which changes help it **actually stop when cancelled**? (Choose 2)
~~~java
val job = scope.launch(Dispatchers.Default) {
    for (i in 0 until 1_000_000_000) {
        heavyCompute(i)   // regular function, not suspend
    }
}
~~~`,
  options: [
    'Call ensureActive() (or check isActive) periodically inside the loop',
    'Wrap loop body in try { } catch (e: Exception) { }',
    'Call yield() periodically inside the loop',
    'Call Thread.sleep(1) in each iteration',
    'Switch to Dispatchers.IO'
  ],
  explain: `**Correct answer: ensureActive()/isActive and yield().**

### Mechanism: cancellation is cooperative
{{cancel()}} does not stop the thread. It only transitions the Job to "cancelling" state; the coroutine stops when it **checks** that state itself. kotlinx.coroutines suspend functions ({{delay}}, {{yield}}, {{withContext}}, {{await}}…) check and throw {{CancellationException}}. A loop calling only regular functions never hits a cancellation point.
- {{ensureActive()}}: throws CancellationException if the Job is cancelled; {{isActive}} to manually break the loop.
- {{yield()}}: a suspension point that checks cancellation, and also yields the thread to other coroutines on the same dispatcher.

### Why others are wrong
- **try/catch Exception**: does not create a cancellation point; worse, if there are suspend functions inside it **swallows** the CancellationException, making the coroutine continue as if not cancelled. (Same trap with {{runCatching}}.)
- **Thread.sleep**: blocks the thread, not a suspension point, knows nothing about the Job.
- **Dispatchers.IO**: only changes the thread pool running the code, does not change the cancellation mechanism.

> Senior tip: in a hot loop, call {{ensureActive()}} every N iterations (e.g., 10k) instead of every iteration so the check overhead stays negligible; and always rethrow CancellationException if you must catch broadly.`
}

});