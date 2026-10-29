/*
 * English translation of js/data/lessons-jvm.js — task T457. Format: js/core/i18n.js (content overlay).
 * ids: lesson-jvm-003
 */
App.i18n.content({
  'lesson-jvm-003': {
    title: 'Class loading and static init: initialization order, the holder idiom and classloader traps',
    goals: [
      'Name the loading, linking and initialization phases and what happens in each of them',
      'Predict the order in which static fields and static blocks run when a class is triggered',
      'Write a singleton with the holder idiom that is truly lazy, thread-safe, and explain why',
      'Recognise {{ExceptionInInitializerError}} bugs, initialization deadlocks and classloader leaks',
    ],
    body: `### A class goes through three stages
The first time a class is touched, the JVM does not "run code" right away. It goes through:

1. **Loading**: the classloader finds the bytecode (on disk, in a jar, over the network), reads it and defines the class: the class's internal metadata lives in Metaspace, while the {{java.lang.Class}} object that represents it (the thing you get from {{Foo.class}}) lives on the heap.
2. **Linking** has three parts:
   - **Verification**: checks that the bytecode is valid and cannot corrupt the JVM (for example the stack does not overflow, types are correct).
   - **Preparation**: allocates static fields and assigns **default values** (0, false, null); initializers have not run yet. The one exception is a static final constant variable (for example {{static final int MAX = 100}}): the compiler writes the value into the {{ConstantValue}} attribute of the class file, and the JVM assigns that value directly without running any initializer code.
   - **Resolution**: replaces symbolic references with real references; this can be lazy and only happen when the reference is actually used.
3. **Initialization**: runs static field initializers and static blocks in order — this is when your code really runs.

Only step 3 runs static blocks. Understanding this explains why reading a {{static final int}} constant does not trigger the class: it is a **constant variable**, inlined by the compiler at the use site.

### When is a class initialized?
The JVM initializes a class on **active use**:
- {{new}} an instance;
- get or set a static field that is **not** a constant variable;
- call a static method;
- use reflection {{Class.forName("...")}} (initialize = true by default);
- initialize a subclass (the superclass must finish first; a superclass interface is initialized along with it only if it declares default methods);
- the class containing {{main}} when the JVM starts up.

The following do not trigger initialization:
- reading a constant variable whose value is known at compile time;
- creating an array {{new Foo[10]}} (only the array is created, no Foo yet);
- {{Foo.class}}, {{instanceof}}, a cast;
- declaring a variable of type {{Foo}};
- reading a static field or calling a static method through a subclass name when that field/method is declared in a superclass, for example {{Child.parentField}}: only the class that declares it (the superclass) is initialized, not the subclass.

### Order inside a class
The rule is very short: **superclass first, then subclass; within each class, static fields and static blocks run in textual order, top to bottom**. There is no "fields before blocks" rule and no reverse one either — the compiler merges everything into a single {{<clinit>}} method in exactly the order it appears.

~~~java
class Parent {
    static int A = init("Parent.A");          // (1)
    static { System.out.println("Parent.block"); }  // (2)
    static int init(String s) { System.out.println(s); return 1; }
}
class Child extends Parent {
    static int B = init("Child.B");           // (3) after Parent finishes
    static { System.out.println("Child.block"); }   // (4)
}
// new Child() prints: Parent.A, Parent.block, Child.B, Child.block
~~~

The subtle point: **the superclass is always initialized before the subclass**, even when the subclass has its own static fields. If the superclass throws during static init, the subclass is never initialized.

### Thread safety and initialization deadlocks
The JVM uses a separate **initialization lock** per class. When several threads hit the first access at the same time, one thread runs {{<clinit>}} and the others block and wait. That is why the holder idiom needs no manual {{synchronized}} — the JVM already guarantees it.

But that same lock creates a deadlock if two classes initialize each other in a cycle: thread 1 holds A's lock and waits for B, thread 2 holds B's lock and waits for A. The bug is rare but very hard to debug: an initialization lock is not a regular monitor, so {{jstack}} usually does not print "Found one Java-level deadlock"; you only see two threads standing still inside the {{<clinit>}} of two classes that point at each other. The rule: **static initializers must be short, must not call services, must not open connections, must not wait for other threads**.

### Singleton: the holder idiom and the wrong ways
The best approach in modern Java:

~~~java
final class AppConfig {
    private AppConfig() { /* read config, no heavy I/O */ }

    private static final class Holder {
        static final AppConfig INSTANCE = new AppConfig();
    }

    static AppConfig getInstance() { return Holder.INSTANCE; }
}
~~~

Why it is **lazy**: {{Holder}} is initialized only when {{getInstance}} reads {{Holder.INSTANCE}}, not when {{AppConfig}} is loaded. Why it is **thread-safe**: the JVM guarantees that Holder's {{<clinit>}} runs exactly once under the lock.

Other approaches:
- {{enum}} singleton: short, robust against reflection and serialization, but not lazy in the "created only when called" sense — the enum constant is created when the enum class initializes.
- **Double-checked locking** is correct only when the field is {{volatile}}; without {{volatile}} a partially constructed object can be published because of reordering.
- **Eager static final**: simple, but it initializes as soon as the class is loaded, which can drag I/O into application startup.

### Classloader leak: the Metaspace killer
Each classloader keeps its own class namespace. A class can be unloaded only when **its classloader** is no longer reachable. In server applications (Tomcat, OSGi, hot reload), if a static field of a class loaded by the webapp is still held by a thread, a JDBC driver, a ThreadLocal or a timer, the classloader cannot be unloaded. Every redeploy loads another copy of the classes, and Metaspace grows until {{OutOfMemoryError: Metaspace}}.

How to prevent it: stop threads/timers properly on shutdown, call {{ThreadLocal.remove()}}, deregister drivers/listeners, and watch the number of loaded classes with {{jcmd <pid> VM.classloader_stats}} or {{jcmd <pid> GC.class_histogram}}.

> A very common bug: a static initializer calls a service obtained from the Spring context. Class init runs too early, before the context is ready, causing {{ExceptionInInitializerError}}; afterwards every access to that class fails with {{NoClassDefFoundError}} even though the root cause was only logged the first time.

### Interview relevance
Interviewers often ask: "Why is the holder idiom lazy and still thread-safe?", "When does a static block run?", "When is a class unloaded?", "What is the difference between {{ExceptionInInitializerError}} and {{NoClassDefFoundError}}?". A confident answer covers **active use**, **textual order**, the **initialization lock** and the **classloader unload condition**. The two exercises below have you write the holder singleton and build the exact initialization order by hand.`,
    exercises: [
      {
        title: 'A lazy singleton with the holder idiom',
        prompt: `Complete {{AppConfig}} using the **holder idiom**:

- The constructor is **private** and increments the counter {{initCount}} every time it runs.
- {{getInstance()}} returns the same single instance, created lazily on the first call.
- The holder is a static nested class that is initialized only when {{getInstance()}} reads its field.
- Do not use manual {{synchronized}}: the JVM already guarantees that class initialization runs only once.

The test checks: before any call, {{initCount}} is 0; calling many times still returns the same instance with {{initCount}} equal to 1; the constructor is private; many threads calling concurrently still get a single instance.`,
        hints: [
          'Create a {{private static final class Holder}} with {{static final AppConfig INSTANCE = new AppConfig();}}.',
          '{{getInstance()}} only needs {{return Holder.INSTANCE;}} — the first time Holder is touched, the JVM initializes it under the initialization lock.',
          'The private constructor only increments {{initCount}}; do not initialize Holder inside the constructor or in a static field of AppConfig, because that would lose laziness.',
        ],
        explain: `The holder idiom exploits the JVM's **lazy class initialization** semantics. The {{AppConfig}} class is initialized when {{initCount()}} or {{getInstance()}} is called, but {{Holder}} is initialized only when the instruction {{Holder.INSTANCE}} runs for the first time. At that point the JVM uses the initialization lock: one thread creates the instance, the other threads wait and then see the same instance. No {{volatile}}, no {{synchronized}}, and no cost on each call.

If you put {{static final AppConfig INSTANCE = new AppConfig();}} directly in {{AppConfig}}, the instance is created when the class initializes — eager, not lazy. If you use double-checked locking and forget {{volatile}}, another thread can see a non-null reference to an object that has not been fully published. An enum singleton solves reflection/serialization but is not lazy.

Production note: a singleton constructor should not do heavy I/O or call other services. If it throws, the first call gets {{ExceptionInInitializerError}}, later calls get {{NoClassDefFoundError}}, and the class is effectively broken forever in that classloader.`,
      },
      {
        title: 'Build the correct static initialization order yourself',
        prompt: `Given three classes {{Parent}}, {{Child}} (extending {{Parent}}) and {{Solo}}. Write static field initializers and static blocks so that they log into {{OrderTrace}} in exactly this order:

- When {{Child.CHILD}} is read for the first time: {{Parent.field}}, {{Parent.block}}, {{Child.field}}, {{Child.block}}; {{Parent.PARENT}} returns 10 and {{Child.CHILD}} returns 20.
- When {{Solo.VALUE}} is read for the first time: {{Solo.field}}, {{Solo.block}}; it returns 30.
- The second read does not run static init again.

Use {{OrderTrace.add("...")}} to log. The order must be **textual order**: a field declared before a block runs before that block.`,
        hints: [
          'Static field initializers and static blocks run in the order they appear in the source, not fields before blocks.',
          'When {{Child.CHILD}} is read for the first time, the JVM sees that {{Child}} is not initialized → it initializes {{Parent}} first, and only then {{Child}}.',
          '{{OrderTrace.add}} is called inside {{initParent}}/{{initChild}}/{{initValue}}; the static block only adds one add line.',
        ],
        explain: `The observed order is a direct consequence of two rules: **superclass before subclass**, and **within one class, every static initializer runs in textual order**. The compiler merges field initializers and static blocks into a single {{<clinit>}} method, preserving the source order.

So if you put the static block **before** the {{static int PARENT}} line, the log becomes {{Parent.block, Parent.field}} and the test fails. If you declare {{Child extends Parent}} but forget that reading {{Child.CHILD}} also triggers {{Parent}}, you will be missing the first two events.

The second test checks the most important property: class init runs **only once** per classloader. Reading the field again is just a memory read and does not re-run the static block. That is also why the holder singleton is safe: the instance is never created again.

In a real JVM, if {{<clinit>}} throws an exception, the class is marked as erroneous; the next access throws {{NoClassDefFoundError}} instead of retrying. So never put logic that can throw unchecked exceptions into static init.`,
      },
    ],
    check: [
      {
        q: 'Which operation does **not** trigger initialization of class {{Foo}}?',
        options: [
          '{{new Foo()}}',
          'Reading a {{static final int MAX = 100}} of Foo',
          'Calling a static method of Foo',
          'Initializing a subclass of Foo',
        ],
        answer: 1,
        explain: `If {{MAX}} is a constant variable (primitive or String, initialized with a constant), the compiler inlines the value at the use site and the class is not needed. {{new}}, calling a static method and initializing a subclass are all active uses, so they trigger init (a subclass pulls in its superclass).`,
      },
      {
        q: 'When running {{new Child()}} for the first time, what is the correct static init order?',
        options: [
          'Child first, Parent after',
          'Only Child runs',
          'Parent first, Child after',
          'No class runs static init',
        ],
        answer: 2,
        explain: `The JVM always initializes the superclass before the subclass. If Parent has static fields/blocks, they finish before Child starts. "Child first" and "only Child runs" are both wrong because the subclass may use the parent's static state, so the parent must be ready first. "No class runs" is wrong because {{new}} is always an active use.`,
      },
      {
        q: 'Why is the holder idiom both lazy and thread-safe without {{synchronized}}?',
        options: [
          'Because the JVM initializes a class exactly once under the initialization lock, and Holder is only touched when getInstance is called',
          'Because Holder is private so no thread can see it',
          'Because static fields are always created at JVM start',
          'Because a private constructor synchronizes automatically',
        ],
        answer: 0,
        explain: `Holder is initialized only when {{Holder.INSTANCE}} is read, so the instance is not created when AppConfig initializes (lazy). The JVM guarantees {{<clinit>}} runs exactly once and other threads wait, so no synchronized is needed. Private does not provide thread safety; static fields are not created at JVM start; a private constructor has nothing to do with synchronization.`,
      },
      {
        q: 'A static initializer throws a RuntimeException on the first access. What does the next access get?',
        options: [
          'The static initializer runs again from the start',
          'It silently skips initialization and uses default values',
          '{{StackOverflowError}}',
          '{{NoClassDefFoundError}} because the class has been marked as erroneous',
        ],
        answer: 3,
        explain: `The first time, the JVM wraps the exception in {{ExceptionInInitializerError}}. The class is marked erroneous; later accesses do not retry but throw {{NoClassDefFoundError}} (usually with "Could not initialize class"). That is why a static initializer must be safe and must not depend on services that are not ready yet.`,
      },
    ],
  },
});
