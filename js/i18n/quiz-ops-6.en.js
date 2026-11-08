/*
 * English translation of js/data/quiz-ops.js — task T1003. Format: js/core/i18n.js (content overlay).
 * ids: qz-devops-070 qz-devops-071 qz-devops-072 qz-devops-073
 */
App.i18n.content({
  "qz-devops-070": {
    "q": "With Kafka configured as min.insync.replicas=2, acks=all, and replication.factor=3, how many broker failures can the cluster tolerate while still accepting writes?",
    "options": [
      "0 brokers (no failure)",
      "1 broker",
      "2 brokers",
      "3 brokers"
    ],
    "explain": "**Summary:** You need at least min.insync.replicas (2) replicas to acknowledge. With replication.factor=3, losing 1 broker leaves 2 in-sync replicas → writes succeed. Losing 2 brokers leaves only 1 < 2 → NotEnoughReplicas.\n\n### Why the other options are wrong\n- Losing 0 brokers is not an answer about fault tolerance.\n- Losing 2 brokers leaves fewer than min.insync.replicas in-sync replicas.\n- Losing 3 brokers means no cluster remains.\n\n> Senior tip: this is a durability-vs-availability trade-off; monitor UnderReplicatedPartitions; do not set min.insync.replicas equal to replication.factor (you would lose availability as soon as one broker goes down)."
  },
  "qz-devops-071": {
    "q": "In a Galera cluster, node B commits a transaction but certification fails. What happens?",
    "options": [
      "The transaction rolls back on node B, and the cluster continues",
      "The entire cluster rolls back",
      "Node B is kicked out of the cluster",
      "The transaction still commits on node B"
    ],
    "explain": "**Summary:** Galera uses certification-based replication: if a conflict is detected (certification fails), the transaction is rolled back on the executing node, and the cluster is unaffected. The application must retry.\n\n### Why the other options are wrong\n- The entire cluster does not roll back.\n- A node is not kicked out over a single certification conflict.\n- The transaction does not commit when certification fails.\n\n> Senior tip: reduce conflicts by partitioning writes per node or key; retry the transaction at the application layer; monitor wsrep_cert_deps_distance."
  },
  "qz-devops-072": {
    "q": "To prevent split-brain in Elasticsearch, which configuration is correct? (Choose 2)",
    "options": [
      "An odd number of master-eligible nodes (3 or 5)",
      "Correct discovery.seed_hosts",
      "Disable replication",
      "Every node is master-eligible"
    ],
    "explain": "**Summary:** You need an odd number of master-eligible nodes and correct discovery.seed_hosts to elect a master with a quorum. ES 7+ manages this automatically (no minimum_master_nodes). Replication is unrelated to split-brain prevention.\n\n### Why the other options are wrong\n- Disabling replication does not prevent split-brain.\n- Making every node master-eligible increases risk and voting complexity; best practice is dedicated master nodes.\n\n> Senior tip: use 3 dedicated master-eligible nodes; monitor cluster health; split-brain causes duplicate data and data loss."
  },
  "qz-devops-073": {
    "q": "What is the difference between RPO and RTO?",
    "options": [
      "RPO = how much data loss is acceptable; RTO = how much recovery time is acceptable",
      "RPO = recovery time; RTO = data loss",
      "Both are recovery time",
      "Both are data loss"
    ],
    "explain": "**Summary:** RPO (Recovery Point Objective) is how much data loss is acceptable; RTO (Recovery Time Objective) is how long the system may be down. Design backups and disaster recovery around both.\n\n### Why the other options are wrong\n- These swap the definitions.\n- They are not the same concept.\n\n> Senior tip: low RPO means replication or synchronous backup; low RTO means automated failover, runbooks, and chaos testing. Measure both with regular drills."
  }
});