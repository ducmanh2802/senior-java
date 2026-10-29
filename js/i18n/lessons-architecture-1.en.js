/*
 * English translation of js/data/lessons-architecture.js — task T472. Format: js/core/i18n.js (content overlay).
 * ids: lesson-architecture-001 lesson-architecture-002 lesson-architecture-003
 */
App.i18n.content({
  'lesson-architecture-001': {
    title: 'Parking Lot: Strategy for pricing and Factory for vehicle types',
    goals: [
      'Lead an LLD session from the requirements to a class diagram and justify each chosen pattern',
      'Apply Strategy for hourly pricing tables and Factory for vehicle classification',
      'Handle concurrency when several vehicles enter the same floor and avoid deadlock'
    ],
    body: `**Summary:** Design a multi-storey parking lot with Strategy for pricing and Factory for vehicle creation, separating the pricing algorithm from the spot-finding logic and supporting new price tables without touching existing code.

### LLD starts with clarifying questions, not with a diagram
In an LLD interview round, the interviewer does not want you to draw UML right away. They want you to follow a process: **clarify the requirements** (vehicle types, number of floors, how fees are computed, whether spot reservations are needed), **identify the main entities** (Vehicle, ParkingSpot, ParkingFloor, Ticket, PricingStrategy), **draw the relationships** (one floor holds many spots, one spot holds at most one vehicle), **choose patterns** and **explain why**, and only then talk about concurrency and extensibility.

### The Parking Lot problem
Typical requirements: a multi-storey parking lot, each floor has many spots, multiple vehicle types (motorcycle, compact car, large truck), fees charged hourly or at a flat rate, and the ability to add a new price table for holidays without editing the existing pricing code.

### Entities and relationships
~~~text
ParkingLot
  |-- ParkingFloor (1..n)
        |-- ParkingSpot (1..n)
              |-- Vehicle (0..1)
Ticket
PricingStrategy (interface)
  |-- HourlyPricing
  |-- FlatRatePricing
  |-- HolidayPricing
VehicleFactory (interface / abstract)
  |-- MotorcycleFactory
  |-- CarFactory
  |-- TruckFactory
~~~

Each floor has a list of spots; each spot has a state (available / occupied / reserved) and a size (small, medium, large). A vehicle must match the spot size. When a vehicle enters, the system finds a matching spot on the nearest floor (or according to a dispatch strategy), issues a ticket, and computes the fee through the Strategy.

### Strategy for pricing
PricingStrategy defines the method {{calculateFee(durationMinutes, vehicleType)}}. Each strategy implements its own formula. To add a holiday price table, you write a new class implementing Strategy and register it in the factory or injector; the existing pricing classes are not modified — exactly the Open/Closed principle (OCP).

The key point when answering in an interview: Strategy separates the **changing algorithm** from the **object that uses it**. ParkingLot does not need to know whether the fee is hourly, daily, or vehicle-type based; it only calls {{strategy.calculateFee}}. As a result, the same lot can switch price tables by season, by time slot, or by customer contract without touching the spot-finding logic.

### Factory for vehicle classification
VehicleFactory creates Vehicle objects from input data (license plate, type). If the user enters an unknown type or you add a new vehicle type (for example an electric car with its own size), you add a new factory without editing the core spot-finding logic. This preserves Single Responsibility (SRP): the factory is only responsible for creating objects.

### Where SOLID applies
- **SRP:** Ticket only stores ticket data; PricingStrategy only computes money; SpotAllocator only finds spots.
- **OCP:** adding a price table or a vehicle type means a new class, not an edit to an old one.
- **DIP:** ParkingLot depends on the {{PricingStrategy}} and {{VehicleFactory}} interfaces, not on concrete classes.
- **ISP:** interfaces stay small, each covering one group of behaviour; do not stuff everything into one giant interface.

### Trade-offs when choosing patterns
| Option | Pros | Cons | When to choose |
|---|---|---|---|
| if-else inside one service | Few classes, easy to read with 2-3 types | Every new type edits a big method, easy to regress | Prototype, rarely changing |
| Strategy + Factory | Independent extension, testable pieces | More classes, needs registration | Problems with many price/vehicle variants |
| Configurable rule engine | Price changes without a deploy | Operational complexity, hard to debug | Price tables change daily |

### Concurrency and edge cases
Several vehicles may request the same floor at the same time. Using one lock for the whole floor kills throughput. A better approach is a per-spot lock (fine-grained lock) or a concurrent structure (for example a ConcurrentHashMap mapping spot -> state) with state checks via CAS. You must avoid deadlock when a vehicle needs to move from floor A to floor B because B is full; the best rule is to disallow moving between floors once parked.

### Extensions
If reservations are needed, add a Reservation entity tied to a user and a start time. When the vehicle arrives, check the reservation and move the spot from reserved to occupied. If you need minute-precise billing, Strategy additionally receives the start and end timestamps; on exit, the system computes the time difference and applies the appropriate strategy for that time window.

### Interview relevance
Interviewers often follow up: "If the lot has 10,000 spots and you must find a free spot in < 10 ms, which data structure do you use?". Senior answer: keep a list of free spots per size per floor (for example a PriorityQueue or ConcurrentSkipList) and update it on entry and exit. If they ask about SOLID: Strategy demonstrates Open/Closed, and Factory demonstrates Dependency Inversion (DIP) because ParkingLot depends on the interface rather than a concrete class.

> Senior tip: in real LLD sessions I always sketch a short trade-off table before choosing a pattern: Strategy lets behaviour change dynamically but adds abstraction; Factory reduces direct coupling but needs a registration mechanism. If time is limited, I choose Strategy for pricing because it is the part that changes most often with business requirements.
`,
    exercises: [
      {
        title: 'Issue a ticket and compute the fee with Strategy',
        prompt: `Complete the {{TicketService}} class that receives a {{PricingStrategy}} and issues a {{Ticket}} for a vehicle. The {{calculateFee(long minutes)}} method delegates to the strategy; {{Ticket}} stores the ticket code, entry time, and the computed amount. The starter already provides the {{PricingStrategy}} interface and the {{Ticket}} class.

Requirements:
- Do not modify the {{PricingStrategy}} interface or the {{Ticket}} class.
- If the strategy returns a negative number or 0, treat it as an error and throw {{IllegalArgumentException}}.
- There must be at least one test covering a newly added strategy (HolidayPricing) that requires no change to existing code.`,
        hints: [
          'Inside {{issueTicket}}, call {{strategy.calculateFee}} and validate the result before creating the {{Ticket}}.',
          'To add a new strategy, create a class that implements {{PricingStrategy}}; {{TicketService}} does not need to know the details.'
        ],
        explain: `This exercise checks whether you apply Strategy correctly: {{TicketService}} depends on the {{PricingStrategy}} interface, not on a concrete class. To add a holiday strategy you only create a new object and pass it to the constructor; {{TicketService}} stays untouched. That is the Open/Closed Principle proven in practice. Common mistakes are forgetting to validate the strategy result (for example a negative price caused by a calculation bug) or passing null as the strategy.`
      }
    ],
    check: [
      {
        q: 'In a Parking Lot design, why use Strategy for pricing instead of a single pricing function?',
        options: [
          'To reduce the number of lines of code',
          'To add new price tables without modifying existing code (Open/Closed)',
          'To speed up the computation',
          'To avoid using an interface'
        ],
        explain: `Strategy lets you add a new pricing rule by creating a class that implements the interface; the existing pricing code is not modified — exactly the Open/Closed principle.`
      },
      {
        q: 'The Factory for vehicle types removes the direct dependency on which concrete class?',
        options: [
          'ParkingSpot',
          'Ticket',
          'Vehicle',
          'PricingStrategy'
        ],
        explain: `The Factory creates {{Vehicle}} objects from input data; the core code depends only on the {{Vehicle}} abstract class or interface, not directly on {{Car}} or {{Truck}}.`
      },
      {
        q: 'If several vehicles request the same last free spot at once, what is the best way to avoid deadlock?',
        options: [
          'Use one global lock for the whole lot',
          'Lock per spot and check the state with CAS',
          'Stop letting vehicles in',
          'Use synchronized on the ParkingLot class'
        ],
        explain: `A global lock destroys throughput; per-spot locking allows many concurrent operations and avoids deadlock when several spot locks never need to be held at the same time.`
      }
    ]
  },

  'lesson-architecture-002': {
    title: 'Elevator: State pattern and dispatch strategies',
    goals: [
      'Model elevator states with the State pattern and deterministic transitions',
      'Compare the FCFS and SCAN dispatch strategies and choose one based on load',
      'Run a tick-based simulation that does not depend on the real clock'
    ],
    body: `**Summary:** Simulate elevators with the State pattern, one class per state, combined with FCFS/SCAN/LOOK dispatch strategies to pick the right car under load.

### The Elevator problem
A building has several elevators, each serving many floors. Every car has states: {{IDLE}}, {{MOVING_UP}}, {{MOVING_DOWN}}, {{DOOR_OPEN}}. When a request comes from a floor (a call button) or from inside the car (a destination floor), the system must choose a suitable car, move it, and open and close the door at the right moment.

### Class diagram
~~~text
Elevator
  |-- ElevatorState (interface)
  |     |-- IdleState
  |     |-- MovingUpState
  |     |-- MovingDownState
  |     |-- DoorOpenState
  |     |-- OutOfServiceState  (extension)
  |-- targetFloor, currentFloor, openTicks
Dispatcher (interface)
  |-- NearestCarStrategy  (FCFS)
  |-- ScanStrategy
  |-- LookStrategy
Building
  |-- Elevator (1..n)
  |-- Dispatcher
~~~

### State pattern for the car
Instead of a state variable plus one long {{if-else}} statement, each state is a class implementing the {{ElevatorState}} interface. The method {{handleRequest}} or {{tick}} is invoked according to the current state. On a transition, the current object calls {{elevator.setState(new MovingUpState())}}. This preserves Single Responsibility: each class is responsible only for the behaviour of one state.

The core idea is that **the state owns its transition rules**. {{DoorOpenState}} knows it must count 3 ticks before closing the door; {{MovingUpState}} knows each tick advances at most one floor and the door opens only at the destination. If you cram these rules into one giant {{tick}} method, every new state forces you to edit every if branch and you will very easily break existing states.

### Dispatch strategies
There are several strategies for assigning a car to a request:
- **FCFS (First Come First Served):** the first request is assigned to the nearest car. Simple, but it can produce uneven load.
- **SCAN:** the car travels in one direction, serves every request along the way, and reverses at the end. Optimal for even load, but it can slow down requests in the opposite direction.
- **LOOK:** like SCAN but it only travels to the farthest request in the current direction before reversing; fewer reversals than SCAN.

When designing for a real building, I usually pick SCAN or LOOK for the main cars and FCFS for service cars (for example the freight elevator). The reason: SCAN lowers average waiting time when load is evenly distributed, while FCFS is easiest to deploy and to explain to operators.

### Dispatch strategy trade-offs
| Strategy | Average waiting time | Complexity | Main risk |
|---|---|---|---|
| FCFS | High under skewed load | Low | The nearest car is constantly busy while far cars sit idle |
| SCAN | Low under even load | Medium | Requests in the opposite direction wait for a full sweep |
| LOOK | Low, fewer reversals than SCAN | Medium | Requires accurate tracking of direction and destination set |

### Where SOLID applies
- **SRP:** each state only handles the behaviour of one state; {{Dispatcher}} only picks cars; {{Elevator}} only holds data and moves.
- **OCP:** adding {{OUT_OF_SERVICE}} or an even-floors-only car means a new state/strategy class, without editing the running states.
- **LSP:** any {{ElevatorState}} can substitute for another through {{setState}} without {{Elevator}} knowing the concrete class.
- **DIP:** {{Building}} depends on the {{Dispatcher}} and {{ElevatorState}} interfaces, not on implementation classes.

### Tick-based simulation
Because LLD exercises usually require deterministic time simulation, we use a fake clock (ticks) passed to {{tick(long now)}}. Each tick represents one interval (for example 1 second). While the car is in {{DOOR_OPEN}}, after a fixed number of ticks (for example 3) it automatically transitions to a moving state. While moving, each tick reduces the distance to the destination by one unit. This makes tests fully deterministic, with no {{Thread.sleep}} needed.

### Edge cases and extensions
- **Several cars serving one request:** make sure only one car accepts it; use a central dispatcher or an atomic structure (for example a ConcurrentHashMap holding request state).
- **A floor request while the car moves the other way:** the dispatch strategy must compute distance and current direction to pick a suitable car.
- **A faulty car:** add an {{OUT_OF_SERVICE}} state and route all requests to the remaining cars. Because a state is an interface, you add a new class and call {{setState}} without editing the old states.
- **An overloaded car:** add a passenger limit for the cabin; beyond it, the car refuses further requests until someone exits.

### Interview relevance
The interviewer often asks: "If you had to add a new feature — say, a car that only serves even floors — which parts would you change without breaking existing code?". Senior answer: add a new strategy class or a sub-state (for example {{EvenOnlyMovingUpState}}) extending the base state, and register it in a factory or configuration; the existing states and strategies are unaffected.

> Senior tip: in a real project I once saw a serious bug where the car went from {{DOOR_OPEN}} straight to {{MOVING_UP}} without checking whether the door had fully closed. That is why I always add an intermediate {{DOOR_CLOSING}} state and verify the closing time before allowing movement, even though it increases the number of states.
`,
    exercises: [
      {
        title: 'Simulate an elevator with the State pattern on ticks',
        prompt: `Complete the {{Elevator}} class using the {{ElevatorState}} interface for a tick-based simulation. On each tick:
- If the state is {{DOOR_OPEN}} and 3 ticks have elapsed, switch to {{IDLE}} when there is no target, or to {{MOVING_UP}} / {{MOVING_DOWN}} when a new target exists.
- While moving, advance one floor per tick; open the door on arrival.
- {{requestUp(int floor)}} and {{requestDown(int floor)}} accept only a floor valid for the direction (higher / lower than the current floor) and within 1..maxFloor.

Requirements:
- Do not use {{Thread.sleep}}; all timing is measured in ticks.
- The door must stay open for exactly 3 ticks before the car moves again.
- The car must accept a new {{ElevatorState}} through {{setState}} without editing the {{Elevator}} class (for example a maintenance state).`,
        hints: [
          'In {{tick}}, delegate to {{state.tick(this)}}; each state decides the next state itself.',
          'Do not forget to reset {{targetFloor}} on arrival, otherwise the door reopens right after closing.',
          'For requests that arrive while the door is open, only record the target; {{DoorOpenState}} starts moving after the third tick.'
        ],
        explain: `The exercise checks two things: a real State pattern (each state is its own class) and a deterministic tick-based simulation. {{Elevator}} only holds data and floor-transition operations; the transition rules live inside each state. As a result, the test can add a {{MaintenanceState}} simply by implementing {{ElevatorState}} and calling {{setState}} — proof of Open/Closed. Common mistakes: forgetting to reset the target after opening the door, or letting the car move in the same tick the door just closed instead of the next tick, which shifts the tick count by one and makes the test hard to predict.`
      }
    ],
    check: [
      {
        q: 'What risk does the State pattern for Elevator reduce compared with a state variable and a long if statement?',
        options: [
          'It increases the number of lines of code',
          'It makes adding a new state harder without editing existing code',
          'It ensures each state only carries its own behaviour, reducing bugs when adding new states',
          'It speeds up the simulation'
        ],
        explain: `The State pattern splits the behaviour of each state into its own class; adding a new state (for example {{OUT_OF_SERVICE}}) only requires a new class without editing the existing ones.`
      },
      {
        q: 'How does the SCAN strategy differ from FCFS mainly?',
        options: [
          'SCAN always serves the nearest request',
          'SCAN travels in one direction and serves all requests along the way, then reverses',
          'FCFS does not allow reversing direction',
          'SCAN only works with a single elevator'
        ],
        explain: `SCAN moves in one direction and serves every request along the path; FCFS only serves the first request received.`
      },
      {
        q: 'Why simulate with ticks instead of real time?',
        options: [
          'To reduce algorithmic complexity',
          'To make tests fully deterministic, independent of the real clock',
          'To save memory',
          'To avoid using an interface'
        ],
        explain: `A fake tick lets you check behaviour precisely step by step; real time produces flaky tests that are hard to control.`
      }
    ]
  },

  'lesson-architecture-003': {
    title: 'Notification Service: Observer and the Open/Closed principle',
    goals: [
      'Use Observer to add new subscribers without modifying the notification-sending code',
      'Apply Open/Closed for new channels (Email, SMS, Push)',
      'Handle retry and templates as separate concerns'
    ],
    body: `**Summary:** Build a multi-channel notification service with the Observer pattern so new channels (Email, SMS, Push) can be added without editing the sending code, with retry and template handling kept separate.

### The multi-channel notification problem
A system needs to notify users through several channels: Email, SMS, Push notification. Each channel has a different format, different delivery timing, and may fail. If you write one {{sendNotification}} method containing all the per-channel logic, every new channel (for example WhatsApp) forces you to edit that method — an Open/Closed violation.

### Class diagram
~~~text
NotificationService
  |-- List<Subscriber>
  |-- subscribe / unsubscribe / notify(Event)
Event
  |-- EventType (EMAIL | SMS | PUSH)
  |-- content
Subscriber (interface)
  |-- supports(EventType): boolean
  |-- notify(Event): void
  |-- EmailSubscriber
  |-- SmsSubscriber
  |-- PushSubscriber
  |-- DigestSubscriber   (extension: receives every type)
NotificationChannel (interface)
  |-- EmailChannel / SmsChannel / PushChannel
RetryPolicy + TemplateEngine   (separate components)
~~~

### Observer for subscribers
Instead of calling each channel directly, the system keeps a list of subscribers (objects implementing the {{Subscriber}} interface). When an event needs notification, the system calls {{notify}} on every subscriber. To add SMS, you create a class implementing {{Subscriber}} and register it in the list; the event-sending code is not modified.

The mechanism has three fixed steps: (1) the service iterates the subscriber list, (2) asks {{supports(type)}} to filter, (3) calls {{notify(event)}}. Thanks to the filtering step, a subscriber that only cares about Push is not disturbed by Email events. This is exactly what makes Observer a good fit for in-memory pub/sub: the publisher does not know who the subscribers are, only the shared contract.

### New channels and Open/Closed
The {{NotificationChannel}} interface defines the methods: {{send(Message message)}}, {{supports(MessageType type)}}, {{getRetryPolicy()}}. Each concrete channel ({{EmailChannel}}, {{SmsChannel}}, {{PushChannel}}) implements this interface. To add a new channel, you only create a new class and register it in the container or factory; the existing channels are unaffected.

### Where SOLID applies
- **SRP:** {{NotificationService}} only coordinates; a channel only delivers; the template only renders content; retry only decides whether to try again.
- **OCP:** adding a subscriber or a channel means a new class, not an edit to the notify loop.
- **LSP:** every subscriber honours the {{supports}} / {{notify}} contract and can substitute for another.
- **ISP:** interfaces stay small, so subscribers are not forced to implement methods they do not use.
- **DIP:** the service depends on the {{Subscriber}} abstraction, not on {{EmailSubscriber}}.

### Trade-offs
| Approach | Pros | Cons | When to use |
|---|---|---|---|
| Call each channel directly inside the service | Few classes, easy linear debugging | Adding a channel edits the service, hard to test | 1-2 fixed channels |
| In-memory Observer | Easy to extend, testable with fake subscribers | Not durable across restarts, does not scale horizontally | Small applications, internal events |
| Message queue + workers | Handles heavy load, durable retries, decoupled deploys | Complex infrastructure, requires idempotency | Millions of notifications |

### Retry and templates
Retry and templates must be separated from channel delivery. A {{RetryPolicy}} class defines the number of attempts, the wait (backoff), and what counts as a transient error. A {{TemplateEngine}} class renders the notification content from event data and the channel type. This separation lets you change the retry policy of one channel without affecting the others.

### Edge cases and extensions
- **A channel keeps failing:** after the maximum number of retries, the system should mark that channel as unavailable and switch to a fallback channel if one exists.
- **Duplicate notifications:** if a user receives notifications over both Email and Push for the same event, the system needs deduplication (for example storing an idempotency key per notification).
- **Throughput:** if millions of users must be notified at once, you need a queue (message queue) and workers processing in parallel; the sending system then only enqueues messages instead of delivering directly.
- **Duplicate subscriptions:** use a {{Set}} instead of a {{List}} so a subscriber does not receive the same event twice.

### Interview relevance
The interviewer often asks: "If you had to add a new channel without editing any existing file, how would you do it?". Senior answer: use a configuration file or an auto-discovery registry that finds new classes (for example via annotations or classpath scanning) and registers them into the container at startup. This preserves the Open/Closed principle at both the code and configuration level.

> Senior tip: I once saw a production system go down because one SMS channel failed and had no retry limit; the system retried endlessly and exhausted CPU. That is why I always add a capped retry policy and a circuit breaker per channel in real designs.
`,
    exercises: [
      {
        title: 'Register subscribers and route notifications to the right channel',
        prompt: `Complete the {{NotificationService}} class. It holds a list of {{Subscriber}} objects and provides:
- {{subscribe(Subscriber s)}}: add a subscriber, ignoring null or an already-registered one.
- {{unsubscribe(Subscriber s)}}: remove a subscriber.
- {{notify(Event event)}}: call {{notify}} on every subscriber whose {{supports(event.type())}} returns true; ignore a null event.

The {{Subscriber}} interface has {{boolean supports(EventType type)}} and {{void notify(Event event)}}. The {{Event}} class has {{EventType type}} and {{String content}}.

Requirements:
- Do not modify the {{Subscriber}} interface or the {{Event}} class.
- A subscriber that does not support the event type must not receive the notification.
- A new subscriber (for example one that receives every event type) must work without editing {{NotificationService}}.`,
        hints: [
          'Use a {{Set}} (for example {{LinkedHashSet}}) to block duplicate subscriptions automatically.',
          'Inside {{notify}}, check for a null event first and call {{supports}} before {{notify}} on the subscriber.'
        ],
        explain: `The exercise checks a genuine Observer: the service does not know concrete subscribers, only the {{supports}} / {{notify}} contract. Using a {{Set}} also solves the duplicate-subscription edge case. Adding {{Counting}} (which accepts every event type) in the test proves Open/Closed: not a single line of {{NotificationService}} has to change. Common mistakes are iterating over all subscribers without calling {{supports}}, so users receive notifications on the wrong channel, or using a {{List}} so a subscriber registered twice receives two notifications.`
      }
    ],
    check: [
      {
        q: 'How does the Open/Closed Principle (OCP) apply to the Notification Service?',
        options: [
          'Edit the notify method every time a new channel is added',
          'Add a new class implementing the Subscriber interface without modifying the sending code',
          'Delete old subscribers',
          'Change the Subscriber interface every time'
        ],
        explain: `OCP requires software to be open for extension (adding behaviour) but closed for modification; adding a new subscriber as a new class implementing the interface satisfies exactly that.`
      },
      {
        q: 'Why separate RetryPolicy and TemplateEngine from the delivery channel?',
        options: [
          'To reduce the number of lines of code',
          'To change the retry policy or content template independently for each channel',
          'To avoid using an interface',
          'To speed up delivery'
        ],
        explain: `Separation allows per-channel configuration of retry and templates without affecting other channels.`
      },
      {
        q: 'If millions of users must be notified at the same time, what should the sending system do?',
        options: [
          'Send directly from the main system',
          'Push into a queue and use workers to process in parallel',
          'Turn notifications off',
          'Call each subscriber in one synchronous loop'
        ],
        explain: `A queue decouples sending load from the main system and enables parallel processing; sending directly would bring the system down.`
      }
    ]
  }
});
