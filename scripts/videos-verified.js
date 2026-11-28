/*
 * YouTube videos verified to exist (oEmbed, 2026-11-28) — the ONLY videos allowed in the
 * `videos` field of CKAD labs (js/data/ckad-labs-N.js) and TOEIC tips (js/data/toeic-tips.js).
 * AI agents invent video IDs, so the checkers reject any ID not listed here.
 * To add one: run
 *   curl -s "https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=<ID>"
 * and copy the real title + channel below (integrator only).
 * Value: [title, channel, topics]
 */
module.exports = {
  // ---- CKAD / Kubernetes ----
  'X48VuDVv0do': ['Kubernetes Tutorial for Beginners [FULL COURSE in 4 Hours]', 'TechWorld with Nana', 'k8s tổng quan, mọi module'],
  's_o8dwzRlu4': ['Kubernetes Crash Course for Absolute Beginners [NEW]', 'TechWorld with Nana', 'k8s tổng quan, module 1'],
  'Krpb44XR0bk': ['Kubernetes Components explained! Pods, Services, Secrets, ConfigMap | Kubernetes Tutorial 14', 'TechWorld with Nana', 'module 1, 9, 11'],
  '6_gMoe7Ik8k': ['FREE Kubernetes Full Course (Day 0/40) | Certified Kubernetes Administrator (CKA) Tutorial + Roadmap', 'Tech Tutorials with Piyush', 'lộ trình, module 1'],
  'ul96dslvVwY': ['Day 1/40 - Docker Tutorial For Beginners - Docker Fundamentals - CKA Full Course 2025', 'Tech Tutorials with Piyush', 'module 4 image/Dockerfile'],
  'yRiFq1ykBxc': ['Day 11/40 - Multi Container Pod Kubernetes - Sidecar vs Init Container', 'Tech Tutorials with Piyush', 'module 2'],
  'De8D-K4tyRI': ['Kubernetes Jobs and CronJobs | Chapter 13 | Zero To Interview-Hero', 'TechWorld with Sahana', 'module 3'],
  'HyEE2eSkBqk': ['How to create repeating jobs (aka CronJobs) in Kubernetes?', 'Peter Jausovec', 'module 3'],
  'oe2zjRb51F0': ['Day 8/40 - Kubernetes Deployment, Replication Controller and ReplicaSet Explained', 'Tech Tutorials with Piyush', 'module 5'],
  'Kmi4VfxRsvw': ['Blue-Green vs Canary vs Rolling Deploy Explained', 'Thetips4you', 'module 5, 6'],
  'b8KIEIkV9zI': ['Canary Deployment in Kubernetes | Step-by-Step Demo (90/10 Traffic Split Explained)', 'TechOps Tutorials', 'module 6'],
  'JHj2pCO7Wbk': ['Helm Tutorial - Crash Course In 15 Minutes', 'Genka', 'module 7 Helm'],
  'v2vRiTVjVAE': ['Helm Tutorial for Beginners 2026 — Full Kubernetes Course', 'Thetips4you', 'module 7 Helm'],
  'Od4BROWS3M0': ['Day 44 - Kustomize Tutorial For Beginners | Kubernetes Kustomized Simply Explained (with demo)', 'Tech Tutorials with Piyush', 'module 7 Kustomize'],
  'spCdNeNCuFU': ['Kustomize: The Best Way to Manage Your Kubernetes Configs', 'DevOps Journey', 'module 7 Kustomize'],
  'x2e6pIBLKzw': ['Day 18/40 - Kubernetes Health Probes Explained | Liveness vs Readiness Probes', 'Tech Tutorials with Piyush', 'module 8'],
  '6_zxiCqCOPM': ['Kubernetes Liveness vs Readiness vs Startup Probes Explained 2026', 'LearnITGuide Tutorials', 'module 8'],
  'TJozPhWIACY': ['kubectl debug: Ephemeral Debug Containers for Kubernetes Troubleshooting', 'CodeLucky', 'module 8'],
  'Q9fHJLSyd7Q': ['Day 19/40 - kubernetes configmap and secret - CKA Full Course 2024', 'Tech Tutorials with Piyush', 'module 9'],
  'FAnQTgr04mU': ['Kubernetes ConfigMap and Secret as Kubernetes Volumes | Demo', 'TechWorld with Nana', 'module 9'],
  '5creJtM4sIM': ['Kubernetes securityContext: run as non-root, drop capabilities and Pod Security Admission', 'Prepare-sh', 'module 10'],
  'ZoTKkmY6VSw': ['Day 41: Pod Security in Kubernetes – Mastering Security Context & Linux Capabilities | CKA 2025', 'Cloud With VarJosh', 'module 10'],
  'T4Z7visMM4E': ['Kubernetes Services explained | ClusterIP vs NodePort vs LoadBalancer vs Headless Service', 'TechWorld with Nana', 'module 11'],
  '80Ew_fsV4rM': ['Kubernetes Ingress Tutorial for Beginners | simply explained | Kubernetes Tutorial 22', 'TechWorld with Nana', 'module 11'],
  'eVtnevr3Rao': ['Day 26/40 - Kubernetes Network Policies Explained', 'Tech Tutorials with Piyush', 'module 12'],
  'Fr-6oDHbobM': ['Kubernetes Network Policy Deep Dive', 'Kubesimplify', 'module 12'],
  'fnI_4wV7YZM': ['Your Complete Guide to Passing CKAD the Right Way', 'DevOps Avenue', 'chiến lược thi CKAD'],
  'qSQAOOmt2nw': ['How To Pass CKAD With Real Exam-like Questions - LIVE', 'CodeGenitor', 'luyện đề CKAD'],
  'd8PgRJBN-QA': ['What is Covered on the Certified Kubernetes Application Developer (CKAD) Exam?', 'CBT Nuggets', 'tổng quan đề CKAD'],
  '7UzZU8KUqyw': ['My CKAD Strategy — The Certified Kubernetes Application Developer Exam (Yann Stoneman)', 'Yann Stoneman', 'chiến lược thi CKAD'],
  'PlHUjS4JxRg': ['Preparing for the Kubernetes Certifications - CKA & CKAD', 'KodeKloud', 'chuẩn bị thi CKA/CKAD'],

  // ---- TOEIC ----
  'ARE-Hz_BKDI': ['TOEIC Intro - What is TOEIC? A Complete Guide for Beginners (Listening, Reading, Speaking, Writing)', 'Brainyahia', 'tổng quan 4 kỹ năng'],
  'EwS5lxyQYXk': ['TOEIC Full Course: Complete Listening, Reading, Speaking & Writing Preparation', 'My English Classes Online / MyECO', 'tổng quan 4 kỹ năng'],
  '-pViT88Iyxc': ['TOEIC Listening & Reading Practice Test 2024 - Complete with Answers & Tips!', 'Russian Pronunciation', 'đề L&R đầy đủ'],
  'M_P2JpriyyI': ['TOEIC Listening Practice Test 9 (2026) | Full Test + Answers', 'English Exam Essentials', 'luyện Listening'],
  'i2U0jCw8mCE': ['Strategies for the TOEIC Listening & Reading Test PART 2 Question Response', 'MORKSENSEI', 'Listening Part 2'],
  'tsBIZv2VlDc': ['TOEIC Listening Tip - Part 2 - Wh- & How Questions', 'English Minute', 'Listening Part 2'],
  'ooZ8NeDIRkM': ['How to improve your TOEIC listening score (Part 2 question types)', 'Cherritopia', 'Listening Part 2'],
  'bLXHmPuL9UI': ['TOEIC Reading: Part 5 Incomplete Sentence', 'English Exam Essentials', 'Reading Part 5'],
  'W5axcI7rw18': ['TOEIC Reading - Part 5: Incomplete Sentence (2024)', 'English Exam Essentials', 'Reading Part 5'],
  '5EEuSDKPRX8': ['5 Bí Quyết Học TOEIC READING Part 7 hiệu quả nhất 2025 - Ăn trọn 54 câu từ một đến nhiều đoạn văn', 'Tú Võ TOEIC 2&4 KỸ NĂNG', 'Reading Part 7'],
  'wPV59PlopdY': ['TOEIC TEST - Part 7 - Strategy 5', 'Westminster Elite - English Pronunciation', 'Reading Part 7'],
  'Q2u00kkorSQ': ['TOEIC Reading Skills 3: Reading Comprehension', 'Kenton County Adult English as a Second Language', 'Reading Part 7'],
  '1Ss1CXZsyfY': ['TỔNG QUAN TOEIC SPEAKING WRITING 2026 - tổng hợp thắc mắc cho người bắt đầu', 'Tú Võ TOEIC 2&4 KỸ NĂNG', 'Speaking + Writing'],
  'B8G_6bKBIrU': ['TOEIC Speaking: How to CORRECTLY Express Your Opinion', 'E2 TOEIC', 'Speaking'],
  'zh0E5Ky79RU': ['TOEIC Writing Test: Full Overview & Guide for Beginners', 'Clear English Communication', 'Writing'],
};
