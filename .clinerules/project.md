# Cline rules

Read and follow ../AGENTS.md (project contract) and your task file in tasks/ before doing anything.
Never run git commit/push. Only edit files your task owns.

## HARD RULES (process safety)
- NEVER kill processes by name (taskkill /IM, Stop-Process -Name, Get-Process node|chrome | Stop-Process, pkill, killall). Other agents and the user's browser run on this machine.
- NEVER launch Chrome/Edge/CDP/headless browsers or background servers. Verify with `node --check <file>` and `node scripts/validate.js` only.
