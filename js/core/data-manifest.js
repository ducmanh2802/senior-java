/*
 * Data manifest — the SINGLE source of truth for which js/data/*.js files exist and when they load.
 * Read by js/core/app.js (App.need, router) and by every Node tool (scripts/validate.js, browser-shim,
 * test-*.js, check-budget.js, smoke.mjs …). See docs/PERFORMANCE.md.
 *
 *   eager  — tiny files every screen needs; index.html loads them with plain <script> tags
 *            (scripts/validate.js checks that index.html lists exactly these, in this order).
 *   groups — loaded on demand by App.need([...group]) as classic <script> tags (works on file://).
 *            File order inside a group is preserved (QUESTIONS/QUIZ/GLOSSARY keep index.html order).
 *   routes — groups a route needs before view.render(). Key 'view' or 'view/firstParam' (more specific
 *            wins). A route missing here loads nothing. A view that starts reading a new global MUST be
 *            updated here, otherwise it renders with an empty list on a cold load.
 *
 * Adding a data file: put it in the right group below (not in index.html).
 */
(function (root) {
  'use strict';
  const M = {
    eager: ['topics.js', 'roadmap.js', 'path.js'],
    groups: {
      // GENERATED compact index of the heavy groups (scripts/build-light-index.js) for light routes; ~100 KB
      index: ['index-light.js'],
      questions: ['q-java.js', 'q-kotlin.js', 'q-concurrency-jvm.js', 'q-spring-data.js', 'q-sql.js', 'q-api.js',
        'q-security.js', 'q-microservices.js', 'q-system-design.js', 'q-scenario.js', 'q-aws.js', 'q-ai.js',
        'q-claude.js', 'q-primer.js', 'q-devops.js', 'q-soft.js', 'q-english.js'],
      quiz: ['quiz.js', 'quiz-claude.js', 'quiz-java.js', 'quiz-spring.js', 'quiz-design.js', 'quiz-ops.js', 'quiz-gaps.js'],
      exams: ['exams.js'],                                    // exam registry (#/exam)
      algos: ['algo.js'],
      companies: ['companies.js'],
      labs: ['labs-thread.js', 'labs-gc.js', 'labs-sql.js', 'labs-incident.js'],
      lessons: ['lessons-collections.js', 'lessons-core.js', 'lessons-modern.js', 'lessons-concurrency.js',
        'lessons-spring.js', 'lessons-jpa.js', 'lessons-design.js', 'lessons-microservices.js', 'lessons-db.js',
        'lessons-jvm.js', 'lessons-sql.js', 'lessons-security.js', 'lessons-testing.js', 'lessons-api.js',
        'lessons-devops.js', 'lessons-architecture.js', 'lessons-ai.js', 'lessons-claude.js', 'lessons-aws.js'],
      sd: ['sd-problems.js'],
      drills: ['drills-shadow.js', 'drills-qa.js', 'drills-term.js'],
      glossary: ['glossary-dist.js', 'glossary-java.js', 'glossary-infra.js'],
      projects: ['projects.js'],
      // AWS Pro track (#/aws): plan + SAP-C02/DOP-C02 exam-style pools (docs/AWS-TRACK.md, scripts/check-aws.js)
      aws: ['aws-plan.js', 'aws-sap-1.js', 'aws-sap-2.js', 'aws-dop-1.js', 'aws-dop-2.js'],
    },
    routes: {
      // dashboard: SRS due list + stats, next lesson, today's plan, interview plan — all from the light index via
      // App.lite()/App.stats()/App.dueItems(); full text loads when the user opens an item (bank/flash/learn…)
      dashboard: ['index'],
      roadmap: ['index'],                                     // App.dueItems()
      bank: ['questions', 'glossary'],
      flash: ['questions', 'glossary'],
      quiz: ['quiz', 'glossary'],
      exam: ['quiz', 'exams', 'glossary'],
      algo: ['algos', 'glossary'],
      mock: ['questions', 'algos'],
      companies: ['companies', 'questions'],                  // App.stats()
      labs: ['labs', 'questions', 'glossary'],                // related-questions widget
      account: ['index'],                                     // App.dueItems(), App.stats()
      legal: ['questions', 'quiz', 'algos'],                  // #/legal (= about page) shows counts
      'legal/about': ['questions', 'quiz', 'algos'],
      'legal/privacy': [],
      'legal/terms': [],
      interview: ['questions', 'companies'],                  // seeds from the bank + company presets
      learn: ['lessons', 'questions', 'glossary'],
      path: ['lessons', 'questions', 'glossary'],
      speak: ['drills'],
      news: [],
      sd: ['sd', 'questions', 'glossary'],
      projects: ['projects', 'lessons', 'questions', 'glossary'],
      career: ['questions', 'companies'],
      aws: ['aws'],                                           // window.AWS_PLAN + window.AWS_QUESTIONS
    },
    // idle prefetch order after the first render (most likely next screens first)
    prefetch: ['index', 'questions', 'glossary', 'lessons', 'algos', 'quiz', 'exams', 'companies', 'sd', 'drills', 'labs', 'projects', 'aws'],
  };
  /** Groups a resolved view needs: needsFor('legal', 'privacy') → routes['legal/privacy'] ?? routes.legal ?? []. */
  M.needsFor = function (view, param) {
    const k2 = view + '/' + (param || '');
    if (param && M.routes[k2]) return M.routes[k2];
    return M.routes[view] || [];
  };
  /** Every data file in load order: eager first, then groups in declaration order. */
  M.allFiles = function () {
    return M.eager.concat(...Object.keys(M.groups).map(g => M.groups[g]));
  };
  root.DATA_MANIFEST = M;
  if (typeof module !== 'undefined' && module.exports) module.exports = M;
})(typeof window !== 'undefined' ? window : globalThis);
