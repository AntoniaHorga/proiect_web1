# Open questions — proiect_web1

<!-- graffino-agentic:begin v1 -->
> Unknowns. Work that depends on an open question is out of scope until it is
> answered. Only the user answers; an agent never answers by guessing. An agent may
> write a `Proposed answer` the evidence supports; the question stays
> `investigating` until the user confirms it.
> Answered entries stay, with the answer and date, and usually become a D- or PATTERN-.
<!-- graffino-agentic:end -->

## Index
- Q-001 · What technology stack, frameworks, and requirements apply to this project? · _answered_
- Q-002 · Care sunt valorile oficiale INS (populație și IPC) pentru Comuna Șura Mare pe anii 2022, 2024, 2025?
- Q-003 · Cum sunt stocate fișierele originale încărcate pentru audit (Object storage vs. sistem de fișiere local)? · _answered_
- Q-004 · Care este formatul și granularitatea exportului CSV din explorator?
- Q-005 · Cum gestionăm eventualele encoding-uri non-UTF-8 sau denumiri fragmentate la importul de fișiere noi? · _answered_
- Q-006 · Ce ierarhie folosește treemap-ul, dat fiind că datele nu încrucișează Subcapitol × Titlu? · _investigating_

---

## Q-001 · What technology stack, frameworks, and requirements apply to this project?
- **Status:** answered
- **Date:** 2026-11-19
- **Blocks:** Setting up project dependencies, build tools, linting, and automated tests in AGENTS.md section 2.
- **Who answers:** Repository owner / course instructor requirements.
- **Answer:** Node.js + TypeScript cu Next.js (App Router, Server Actions/Route Handlers, parsare XLSX server-side via `xlsx`/SheetJS), Tailwind CSS (stilizat cu tokeni din docs/design/DESIGN.md, Light/Dark mode, URL state via searchParams), PostgreSQL 16 (Docker) cu `pg` / Drizzle ORM (interogări SQL native cu GROUP BY, CTE, LAG()), sume monetare stocate exact ca BIGINT (bani) sau NUMERIC(15,2), Apache ECharts (echarts-for-react) pentru treemap/sunburst și evoluție, Vitest + Playwright pentru testare automată.

## Q-002 · Care sunt valorile oficiale INS (populație și IPC) pentru Comuna Șura Mare pe anii 2022, 2024, 2025?
- **Status:** open
- **Blocks:** Calculele exacte per capita și ajustarea la inflație în interfață.
- **Who answers:** Utilizatorul / INS Tempo Online.
- **Proposed answer:** Preluarea populației după domiciliu/rezidență din INS Tempo Online pentru Comuna Șura Mare și a indicelui prețurilor de consum (IPC) pentru 2022, 2024, 2025; stocate în tabelul `locality_stats`, introduse de utilizator din INS Tempo Online. Nu se folosesc valori estimative sau inventate: până la introducere tabelul rămâne gol, iar calculele per capita și ajustarea la inflație nu se afișează.

## Q-003 · Cum sunt stocate fișierele originale încărcate pentru audit (Object storage vs. sistem de fișiere local)?
- **Status:** answered
- **Date:** 2026-11-19
- **Blocks:** Configurarea stocării pentru fișierele originale încărcate de administrator.
- **Who answers:** Arhitectura aplicației / Dezvoltator.
- **Proposed answer:** În mediul local / Docker, stocăm fișierele originale într-un volum dedicat pe disc (`uploads/original_files/`), expus securizat prin ruta `/audit` pentru descărcare, cu o abstractizare de interfață `FileStorageService` ce permite trecerea la un bucket compatibil S3 (MinIO, AWS S3) în producție.
- **Answer:** Volum local persistent în Docker (`uploads/original_files/`), servit prin `/audit`, accesat prin interfața `FileStorageService`. Înregistrat ca decizia D-005.

## Q-004 · Care este formatul și granularitatea exportului CSV din explorator?
- **Status:** open
- **Blocks:** Implementarea endpoint-ului de descărcare CSV din ecranul `/explorator`.
- **Who answers:** Utilizatorul / Cerințele de raportare civică.
- **Proposed answer:** Exportul CSV reflectă selecția curentă a utilizatorului (anul selectat, filtrele de Funcționare/Dezvoltare, capitolele filtrate), conținând coloanele: An, Cod Capitol, Denumire, Titlu Economic, Sumă Aprobată, Sumă Executată, Procent Execuție.
- **Confirmed:** 2026-11-25

## Q-005 · Cum gestionăm eventualele encoding-uri non-UTF-8 sau denumiri fragmentate la importul de fișiere noi?
- **Status:** answered
- **Date:** 2026-11-25
- **Blocks:** Robustetea modulului de upload și parsare din panoul de administrare.
- **Who answers:** Dezvoltator / Fișierele sursă furnizate.
- **Proposed answer:** Parserul server-side forțează normalizarea stringurilor la UTF-8 (NFC) și aplică concatenarea automată cu eliminarea spațiilor multiple pentru rândurile consecutive fără cod bugetar.
- **Answer:** Doar UTF-8. Un fișier CSV care nu este UTF-8 valid este respins cu eroare; nu se ghicește encoding-ul. Denumirile fragmentate se tratează conform DATA.md §4.2 regula 3.

## Q-006 · Ce ierarhie folosește treemap-ul, dat fiind că datele nu încrucișează Subcapitol × Titlu?
- **Status:** investigating
- **Date:** 2026-11-25
- **Blocks:** Ierarhia treemap-ului din DS-002 (`/explorator`) și comutatorul Funcționare/Investiții; SCOPE.md §3 și §6 („Capitol → Subcapitol → Titlu”).
- **Who answers:** Utilizatorul.
- **Evidence:** În cele 3 fișiere de cheltuieli, blocul funcțional are Capitol → Subcapitol → Paragraf fără titluri economice, iar blocul mixt are Capitol × Titlu/Articol/Alineat fără subcapitole (0 rânduri cu subcapitol sau paragraf în blocul mixt, verificat 2026-11-25).
- **Proposed answer:** Două vederi separate: funcțională (Capitol → Subcapitol → Paragraf) și economică (Capitol → Titlu → Articol). Detalii în propunerea din sesiunea 2026-11-25.
