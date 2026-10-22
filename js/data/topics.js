/*
 * Topic registry. `file` = data file that owns the topic's questions (see AGENTS.md).
 * Order here is the display order everywhere in the UI.
 */
window.TOPICS = [
  { id: 'core',          name: 'Core Java',                  icon: '☕', group: 'Java',         file: 'q-java.js' },
  { id: 'collections',   name: 'Collections',                icon: '🗂️', group: 'Java',         file: 'q-java.js' },
  { id: 'modern',        name: 'Java 8 → 21',                icon: '✨', group: 'Java',         file: 'q-java.js' },
  { id: 'concurrency',   name: 'Concurrency',                icon: '🧵', group: 'Java',         file: 'q-concurrency-jvm.js' },
  { id: 'jvm',           name: 'JVM & GC',                   icon: '⚙️', group: 'Java',         file: 'q-concurrency-jvm.js' },
  { id: 'spring',        name: 'Spring & Spring Boot',       icon: '🌱', group: 'Framework',    file: 'q-spring-data.js' },
  { id: 'jpa',           name: 'JPA / Hibernate',            icon: '🗄️', group: 'Framework',    file: 'q-spring-data.js' },
  { id: 'db',            name: 'Database & SQL',             icon: '💾', group: 'Framework',    file: 'q-spring-data.js' },
  { id: 'microservices', name: 'Microservices',              icon: '🧱', group: 'Architecture', file: 'q-microservices.js' },
  { id: 'design',        name: 'System Design',              icon: '🏗️', group: 'Architecture', file: 'q-system-design.js' },
  { id: 'architecture',  name: 'Design Patterns & Clean Arch', icon: '🧩', group: 'Architecture', file: 'q-system-design.js' },
  { id: 'scenario',      name: 'Tình huống thực tế',          icon: '🔥', group: 'Architecture', file: 'q-scenario.js' },
  { id: 'aws',           name: 'AWS & Cloud',                icon: '☁️', group: 'Cloud & AI',   file: 'q-aws.js' },
  { id: 'ai',            name: 'AI / LLM cho Java dev',      icon: '🤖', group: 'Cloud & AI',   file: 'q-ai.js' },
  { id: 'testing',       name: 'Testing & Quality',          icon: '🧪', group: 'Soft skills',  file: 'q-soft.js' },
  { id: 'behavioral',    name: 'Leadership & Behavioral',    icon: '🤝', group: 'Soft skills',  file: 'q-soft.js' },
  { id: 'english',       name: 'Phỏng vấn tiếng Anh',        icon: '🇬🇧', group: 'Soft skills',  file: 'q-english.js' },
];
