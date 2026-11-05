/*
 * English translation of js/data/lessons-spring.js — task T755. Format: js/core/i18n.js (content overlay).
 * ids: lesson-spring-008
 */
App.i18n.content({
  'lesson-spring-008': {
    title: 'Auto-configuration and @Conditional: why default beans step aside for yours',
    goals: [
      'Describe how @Conditional filters bean definitions at startup',
      'Explain why a bean you declare yourself beats Boot\'s default bean',
      'Read the CONDITIONS EVALUATION REPORT to find the condition that blocked a bean',
      'Write an auto-configuration guarded by OnClass/OnProperty/OnMissingBean conditions'
    ],
    body: `**Summary:** Auto-configuration is how Spring Boot **registers beans on your behalf** once the conditions are met: the required class is present on the classpath, the property is enabled, and no bean of that type exists yet. Every condition is a {{@Conditional...}} evaluated **exactly once at startup**, when the container has only read the *bean definition* (the blueprint of a bean: its name, its type, how to create it) and has not created any instance yet. A bean you declare yourself always wins over the default one, because your definition is written into the container **before** Boot runs its auto-configuration classes, so {{@ConditionalOnMissingBean}} already sees your bean and the "missing" condition fails.

### The problem auto-configuration solves
Before Spring Boot, standing up a web app with JPA + JSON + a connection pool meant writing dozens of lines of hand-written configuration: declaring a {{DataSource}}, a {{PlatformTransactionManager}}, an {{ObjectMapper}}, registering filters, mapping error pages… Boot inverts the problem: you declare only the **intent** by adding a dependency ({{spring-boot-starter-data-jpa}}), while **wiring the beans together** is left to the {{*AutoConfiguration}} classes inside the {{spring-boot-autoconfigure}} jar. The core sentence of the mechanism: "if the required class is on the classpath and the user has not defined such a bean, create them a sensibly configured one".
Two keywords used throughout this lesson: a **starter** = a pre-assembled bundle of dependencies for one feature (including every jar that feature needs); the **classpath** = the set of jars the JVM can see at runtime. When a class is not on the classpath, loading it with {{Class.forName}} throws {{ClassNotFoundException}} — and that is precisely how Boot "sees" or "does not see" a technology in order to decide whether to configure it.

### @Conditional: a filter that runs while definitions are registered
{{@Conditional}} takes a class implementing the {{Condition}} interface, which has exactly one method, {{matches(context, metadata)}}; it returns true/false and **also the reason**, which is written into the report. This is the key point: a condition is a **boolean question**, and it runs while Spring reads the annotation, i.e. **before any bean is created**. The four conditions you meet most often:

| Condition | Read from | What it is used for |
|---|---|---|
| {{@ConditionalOnClass(name = "org.h2.Driver")}} | classpath (tries to load the class) | configure only when the required jar is present |
| {{@ConditionalOnMissingBean(DataSource.class)}} | the list of bean definitions already registered | leave room for the user to define their own |
| {{@ConditionalOnProperty(prefix = "app.mail", name = "host")}} | Environment (application.yml, environment variables) | enable a feature according to configuration |
| {{@ConditionalOnWebApplication}} | the kind of application currently running | create filters/handlers only when the app is a web app |

The rules of {{@ConditionalOnProperty}} — frequently asked and frequently misunderstood:
- {{name}} only, no {{havingValue}}: matches when the property **exists** and its value is **not** "false" (case-insensitive). An absent property = **no** match.
- With {{havingValue = "kafka"}}: matches only when the property value equals that exact string (case-sensitive).
- With {{matchIfMissing = true}}: an absent property counts as a match — the feature becomes **on** by default.

> Note: properties are read through *relaxed binding*, so {{app.id-strategy}}, {{app.idStrategy}} and the environment variable {{APP_ID_STRATEGY}} all point to the same property. A condition only sees the value **present at startup**: editing the config on the server and hot-reloading does not make a bean appear or disappear.

### Registration order: why your bean wins
~~~seq
title: Bean registration order at startup
actors: App | UserConfig | BootJar | CondEval | BeanFactory
App -> UserConfig: component scan picks up your @Service and @Bean
UserConfig -> BeanFactory: register your definition (step 1)
App -> BootJar: EnableAutoConfiguration reads AutoConfiguration.imports
BootJar -> CondEval: test @ConditionalOnClass for each auto-config
BootJar -> BeanFactory: register the default definitions (step 2)
BeanFactory -> CondEval: @ConditionalOnMissingBean already sees your bean
CondEval --> BootJar: no match -> drop the default bean
note App..BeanFactory: conditions run on definitions, no instance created yet
~~~

{{@SpringBootApplication}} contains {{@EnableAutoConfiguration}}; that annotation attaches {{AutoConfigurationImportSelector}}, a class that reads the full list of auto-config class names from the file {{META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports}}, removes the classes blocked by {{@Conditional}}, sorts what is left and submits those classes to the container. Because your configuration is processed in the "user configuration" phase — before the auto-configuration phase — by the time {{@ConditionalOnMissingBean}} runs, your bean is already in the definition list. Two consequences:
1. You do **not** need {{@Primary}}, and you do not need to turn on {{spring.main.allow-bean-definition-overriding}} to beat a default bean: it is enough to declare a bean of the **type** (or the name) the auto-config would have created.
2. Conversely, {{@ConditionalOnBean}} / {{@ConditionalOnMissingBean}} placed in **your own** config are fragile, because they only see the definitions registered **up to the moment of evaluation**. The Boot documentation therefore recommends using this pair of conditions only inside auto-configuration classes, together with {{@AutoConfigureAfter}} to pin down the order.

### Example: the auto-configuration of an internal starter
~~~java
@AutoConfiguration                                // Boot 3: replaces the hand-written @Configuration(proxyBeanMethods = false)
@ConditionalOnClass(MailerClient.class)           // no mailer jar on the classpath -> this whole class is skipped
public class MailerAutoConfiguration {
    @Bean
    @ConditionalOnProperty(prefix = "app.mail", name = "enabled")  // must be enabled explicitly
    @ConditionalOnMissingBean                     // user already has a Mailer? -> stand aside
    Mailer mailer(MailerProperties props) {       // props bound from app.mail.*
        return new SmtpMailer(props.getHost(), props.getPort());
    }
}
~~~
Without the registration line below, the class above is dead code that nobody loads:
~~~text
src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
    com.acme.mailer.MailerAutoConfiguration
~~~
(Before Boot 2.7 registration used the {{EnableAutoConfiguration}} key in {{META-INF/spring.factories}}; from Boot 3 use the {{.imports}} file.)

### Reading the --debug report
Running {{java -jar app.jar --debug}} (or {{--logging.level.org.springframework.boot.autoconfigure=DEBUG}}) prints a report that lists **every** auto-config and **every** condition, including the reason for each failure:
~~~text
============================
CONDITIONS EVALUATION REPORT
============================

Positive matches:
-----------------
   MailerAutoConfiguration matched:
      - @ConditionalOnClass found required class 'com.acme.mailer.MailerClient' (OnClassCondition)
   MailerAutoConfiguration#mailer matched:
      - @ConditionalOnProperty (app.mail.enabled) matched (OnPropertyCondition)
      - @ConditionalOnMissingBean (types: com.acme.mailer.Mailer; SearchStrategy: all) did not find any beans

Negative matches:
-----------------
   DataSourceAutoConfiguration#dataSource:
      - @ConditionalOnMissingBean (types: javax.sql.DataSource; SearchStrategy: all) found bean 'myDataSource'

Exclusions:
-----------
    None
~~~
"Positive matches" = classes/beans that were loaded, together with the reason they matched; "Negative matches" = blocked ones, stating **which condition** and **what it found**. The report is written per method, so you know exactly which bean inside a config class was dropped and not merely "the whole class". The same information is available from the Actuator endpoint {{/actuator/conditions}} — the endpoint is enabled by default but not exposed over HTTP, so you must add {{management.endpoints.web.exposure.include=conditions}}; reading it from the endpoint is more convenient because you do not have to restart the app. To remove an auto-config completely: declare {{spring.autoconfigure.exclude}} in yml or {{@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)}}.

### Production pitfalls
- **One property typo makes a bean disappear silently.** {{app.mail.enabled: FALSE}} is at least understandable, but {{app.mail.enable: true}} is not: the property "does not exist", so the condition fails, the app still starts fine and the bug only shows up when a request reaches that bean. Prevention: bind configuration with {{@ConfigurationProperties}} + {{@Validated}} so that a missing or misspelled name fails at startup immediately, instead of reading individual properties with {{@Value}} in ten different places.
- **{{@ConditionalOnMissingBean}} looks at the method's return type** and uses the "assignable" relation, so your bean being a **subclass** of that type also makes the auto-config stand aside. Conversely, if your bean has a **different type but the same name** as the default bean, that is a name clash between bean definitions: Boot 2+ forbids overriding by default and throws {{BeanDefinitionOverrideException}} right at startup.
- **Conditions run only once.** "I changed the property but the bean still does not appear" is correct behaviour, not a bug — the context has to be restarted.
- **If you need a bean produced by another auto-config**, you must declare {{@AutoConfigureBefore}}/{{@AutoConfigureAfter}}; otherwise Boot orders auto-configs by class name almost by default, and that order can change when you upgrade versions.
- **Testing auto-configs** should use {{ApplicationContextRunner}} instead of {{@SpringBootTest}}: it runs fast and lets you assert exactly the two branches "when the user defines the bean, the auto-config must stand aside" and "when the user defines nothing, the default bean must exist".

### Interview notes
The answer frame: (1) auto-configs are {{@Configuration}} classes loaded from the {{.imports}} file and filtered by {{@Conditional}}; (2) conditions are evaluated on bean definitions at startup, not on instances; (3) your bean wins because it is registered first, so {{@ConditionalOnMissingBean}} sees it and stands aside; (4) when a bean "disappears", turn on {{--debug}} or call {{/actuator/conditions}} and read the negative match instead of guessing. If you are asked "how do you write an internal starter", stress: every bean must have {{@ConditionalOnMissingBean}}, every property must have a sensible default, and there must be tests for both branches.

> Senior tip: Treat the auto-configuration of an internal starter as a **public API**. Forgetting {{@ConditionalOnMissingBean}} once means the whole company cannot override that bean and has to fork the starter. Conversely, when you inherit someone else's code, don't rush to conclude "Bean X is not created" — one run with {{--debug}} usually saves half a day of debugging, and it is worth keeping the conditions report enabled in staging.`,
    exercises: [{
      title: 'A mini auto-config container with OnProperty and OnMissingBean conditions',
      prompt: `Complete {{AutoConfig}} — a tiny auto-configuration container that simulates Spring Boot's {{@ConditionalOnProperty}} and {{@ConditionalOnMissingBean}}. The {{Cond}} class and the three condition factories are already given; you only write three methods:
- {{register(bean, conds)}}: record the bean name together with its array of conditions **in registration order** (each register call is like one {{@Bean}} method inside an auto-config class). With no conditions at all, the spec is always accepted.
- {{resolve(props, userBeans)}}: return the list of bean names that end up in the container. The list **starts with all of userBeans, in exactly the order they were passed in** (these are "the user's beans", registered before the auto-config). Then walk each spec **in registration order**: if **every** condition of the spec is satisfied, append the spec's bean name at the end of the list.
  - {{onProperty(key)}} is satisfied when {{props}} contains key and the value is **not** "false" (case ignored).
  - {{onPropertyValue(key, value)}} is satisfied when {{props}} contains key and the value equals {{value}} exactly (case-sensitive).
  - {{onMissingBean(name)}} is satisfied when the name {{name}} has **not** yet appeared in the list of beans registered **up to that point**, which includes the user's beans and the beans of the specs accepted before it.
- Every spec, accepted or skipped, writes one line into the report: {{REGISTERED name}} or {{SKIPPED name REASON}}. {{REASON}} is the reason of the **first** failing condition in the array of conditions, taken from this table: property missing → {{NO_PROPERTY}}; property present but its value is false → {{PROPERTY_FALSE}}; value differs from the expected value → {{VALUE_MISMATCH}}; bean already present → {{ALREADY_PRESENT}}. For {{onPropertyValue}} with an absent property the code is still {{NO_PROPERTY}}.
- {{report()}}: returns the report of the **most recent resolve** — overwritten on every resolve call, never accumulated, and an empty list if resolve has never been called.`,
      hints: [
        'Keep two parallel lists in registration order ({{beans}} and {{specs}}), or a single list of specs each holding a name plus its conditions. {{register}} only appends; it evaluates **no** condition at all — that is exactly the point "conditions run at resolve time, not at declaration time".',
        '{{resolve}} builds a {{List}} starting from {{userBeans}}, then walks the specs in order. The bean of an accepted spec must be appended to **that very list**, so that {{onMissingBean}} of a later spec sees the bean an earlier spec produced.',
        'Conditions are ANDed and the reason reported is that of the **first** failing one: write a function returning {{null}} when every condition is satisfied and otherwise exactly one of the four error codes. Use {{equalsIgnoreCase("false")}} for PROPERTY but {{equals}} for PROPERTY_VALUE — two different rules, and the tests will catch any mix-up.',
        'Assign {{lastReport = report}} at the **end** of each resolve so the report is overwritten, and return that same list from {{report()}}.'
      ],
      explain: `The model above reproduces exactly the three design decisions of Spring Boot.

**First**, {{register}} only stores metadata. In Spring, {{@ConditionalOnMissingBean}} is evaluated by {{ConfigurationClassPostProcessor}} while it reads the config class and creates bean definitions, **before** any bean is instantiated. So a condition does not "wait" for a bean to exist; it only looks at the list of definitions — like our {{resolve}} looking at {{registered}} without creating objects.

**Second**, the bean list is initialised with the user beans, and only then are the specs walked in registration order. This is why your bean wins: your definition is present first, so {{onMissingBean}} answers "already there" and the default bean is dropped. In a real container this comes from Boot submitting user configuration before auto-configuration.

**Third**, an accepted bean must be appended to the list being walked, so when two specs name the same bean only one of them wins, and winning depends on the **registration order**. Boot describes exactly this behaviour with {{@AutoConfigureBefore}}/{{@AutoConfigureAfter}}: the order between auto-configs is something you must declare, not something Spring infers.

Common mistakes when doing this exercise:
- Using a {{Set}} for registered beans: you lose the order and the test "user beans keep their order" fails.
- Forgetting to append the accepted bean: {{ALREADY_PRESENT}} never appears and both specs create the bean with the same name.
- Comparing with {{equals("false")}} instead of {{equalsIgnoreCase}}: you miss {{enabled: FALSE}} in a real yaml file.
- Using one shared property variable for both {{onProperty}} and {{onPropertyValue}}: wrong error codes, because an absent value must be NO_PROPERTY while a different value must be VALUE_MISMATCH.
- Accumulating {{report}} across resolve calls: Spring also keeps the report of **one** startup, and every context refresh evaluates everything again from scratch.

Exercise upgrade (if you want to get closer to production): make {{onMissingBean}} compare by **type** instead of by name, by storing an extra {{Class}} in {{Cond}} and using {{isAssignableFrom}} — that is precisely how {{OnBeanCondition}} compares beans.`
    }],
    check: [
      { q: 'With {{@ConditionalOnProperty(name = "app.export.enabled")}} and no {{havingValue}}, in which case is the bean **created**?', options: ['The yaml contains {{app.export.enabled: true}}', 'That property is not declared anywhere', 'The yaml contains {{app.export.enabled: false}}', 'That property sits in a profile that is not active'], explain: `Without {{havingValue}} the condition matches when the property **exists** and its value differs from "false". Case 1: the property exists and equals true, so it matches. Cases 2 and 4 are both equivalent to "property absent", so they do not match (you would need {{matchIfMissing = true}} to match). Case 3 is a false value, so it fails — and in the --debug report cases 2/4 and case 3 get different reasons, which is a useful debugging clue.` },
      { q: 'You declare {{@Bean DataSource myDataSource()}} in your own {{@Configuration}} class. Boot has {{DataSourceAutoConfiguration}} creating a {{dataSource}} bean with {{@ConditionalOnMissingBean}}. What happens?', options: ['The default bean wins because auto-configuration always has higher priority', 'The app fails because there are two beans of type DataSource', 'Both beans are created and Spring picks one randomly by name', 'Your bean wins: your definition is registered before the auto-config phase, so the missing condition fails'], explain: `The order is exactly this: user configuration first, auto-configuration after; when OnMissingBean is evaluated {{myDataSource}} is already in the definition list, so the default bean is dropped — no {{@Primary}} needed, and no need to turn on {{spring.main.allow-bean-definition-overriding}}. Boot does not "prioritise" auto-config at all. Two beans of the same type only happen if your bean has a different type while the auto-config checks another type, or if you clash on the bean name and get {{BeanDefinitionOverrideException}}. Nothing is chosen randomly.` },
      { q: 'Your auto-config uses {{@ConditionalOnBean(MetricRegistry.class)}}, and that bean is created by a different auto-config. Now and then the condition fails even though the registry will certainly exist. Why?', options: ['Because @ConditionalOnBean only sees beans that have already been instantiated', 'Because the condition is evaluated on bean definitions according to processing order; the other auto-config may not have been processed at that moment', 'Because MetricRegistry always has prototype scope', 'Because the registry bean is missing @Lazy'], explain: `This is why the Boot documentation advises using OnBean/OnMissingBean only inside auto-configuration classes and pinning the order with {{@AutoConfigureAfter}}. When the registry will certainly be created, the only problem is the **moment** the condition is evaluated relative to the config loading order. Conditions run on definitions and do not need an instance, so the option "only sees already instantiated beans" is wrong. Scope and @Lazy are not the cause here.` },
      { q: 'A bean you expect is not created. Which method tells you exactly which condition blocked it, without reading the auto-config source?', options: ['Turn on logging.level.root=TRACE and read the whole log', 'Call context.getBeanDefinitionNames() after startup', 'Run the app with the --debug flag and read the CONDITIONS EVALUATION REPORT, or call /actuator/conditions', 'Delete the target directory and rebuild to clear the cache'], explain: `The conditions report lists positive and negative matches **with the reason and the values found**, per bean method. TRACE inflates the log to hundreds of MB and still does not state the condition reason; {{getBeanDefinitionNames()}} only shows the outcome (which beans exist), not why another bean was dropped; rebuilding is irrelevant.` }
    ]
  }
});
