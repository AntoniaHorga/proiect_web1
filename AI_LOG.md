# AI Execution & Interaction Log — proiect_web1

Acest fișier documentează sesiunile de lucru dintre utilizator și asistentul AI, acțiunile executate, fișierele create sau modificate și deciziile aprobate în ledger.

---

## Sesiunea 1: Interviu de Definire a Domeniului (Scope) și Decizii Arhitecturale
**Data:** 19 noiembrie 2026  
**Context:** P09 · Explorator de buget local (Comuna Șura Mare, 2022, 2024, 2025)

### 1. Ce a cerut utilizatorul
* Parcurgerea fișei de proiect din `docs/brief.md`, a notițelor de interviu din `INTERVIEW.md`, a analizei setului de date din `DATA.md` și a regulilor din `AGENTS.md`.
* Realizarea unui interviu ghidat, întrebare cu întrebare, fără a scrie cod prematur, pentru a clarifica:
  * Cele 3 variabile obligatorii din catalog (Comuna Șura Mare 2022/2024/2025, taxonomia comună pe două axe, întrebarea reală a jurnalistului pe prima pagină).
  * Stiva tehnologică completă.
  * Rolurile utilizatorilor și fluxul de autentificare/moderare.
  * Regulile exacte ale motorului de reconciliere a datelor (toleranțe, praguri, anomalii).
  * Inventarul complet al ecranelor aplicației.
  * Limitele stricte ale proiectului (ce NU este în proiect / Out of Scope).
* Formalizarea deciziilor tehnice conform procesului de aprobare (The Gate).
* Documentarea acordului în `README.md`, `CONTEXT.md`, `docs/SCOPE.md`, `docs/agents/OPEN-QUESTIONS.md` și `AI_LOG.md`.
* Lansarea interviului de design vizual (culori, fonturi, ton, identitate locală).

### 2. Întrebările adresate și răspunsurile agreate
1. **Variabila 1 (Localitate & Ani):** Comuna Șura Mare (2022, 2024, 2025). Lipsa anului 2023 este marcată vizual ca discontinuitate în grafice/tabele, fără extrapolări fictive. Indicatorii INS (populație și IPC) sunt urmăriți în Q-002 și gestionați în tabela `locality_stats`.
2. **Variabila 2 (Taxonomie comună pe 2 axe):**
   * *Axa 1 (Funcționare vs. Investiții):* pe baza clasificației economice (Titlurile 10, 20, 30, 40, 55, 57, 59, 81, 85 la Funcționare; Titlurile 56, 58, 60, 61 PNRR, 71, 72 la Investiții).
   * *Axa 2 (7 domenii cetățenești):* Drumuri și Transport, Apă, Canalizare și Mediu, Iluminat Public și Dezvoltare Locală, Educație și Cultură, Asistență Socială și Sănătate, Administrație, Ordine Publică și Datorie, Agricultură și Alte Acțiuni Economice.
   * *Venituri:* grupate în 3 surse majore (Taxe locale, Buget de stat, Fonduri UE).
   * *Stocare:* tabela `budget_taxonomy_mapping` în PostgreSQL, cu fallback „Necategorisit”.
3. **Variabila 3 (Întrebarea jurnalistului Laura Nițu):** Afișată pe hero la `/`: *„Cum au evoluat investițiile în comuna Șura Mare în perioada 2022–2025 și câți dintre banii alocați au fost cheltuiți efectiv?”*, urmată de sinteza investițiilor (prevăzut vs. plătit, % execuție), raport Funcționare vs. Investiții, 4 KPI-uri anuale, ponderea pe domenii și semnale de variație (+30% / +50% și proiecte cu execuție 0% sau <10%).
4. **Stiva tehnică:** Next.js (App Router, TypeScript) + Tailwind CSS + PostgreSQL 16 (Docker) cu Drizzle ORM / `pg` nativ (interogări SQL cu `GROUP BY`, `CTE`, `LAG()`) + Apache ECharts (Treemap) + Vitest și Playwright. Toate sumele stocate în `BIGINT` (bani) sau `NUMERIC(15,2)`, fără `FLOAT`.
5. **Roluri & Securitate:** Vizitator (public), Utilizator (adnotări cu status inițial `pending`), Admin (import, reconciliere, moderare, configurare). Parole securizate cu `bcryptjs` și sesiuni în cookie-uri HTTP-only.
6. **Reconcilierea datelor:** Raportare exactă la ban; toleranță de rotunjire de max ±1,00 leu (`rounded_match`); diferențele > 1,00 leu (`discrepancy_detected`) blochează publicarea fără o notă explicativă obligatorie de minim 20 de caractere. Pagină publică de transparență la `/audit`.
7. **Ecrane (7):** `/` (Hero & KPI-uri), `/explorator` (Treemap & Adnotări), `/cautare` (Căutare liberă), `/comparatii` (Comparații YoY & per capita), `/audit` (Metodologie, Reconciliere & Fișiere brute), `/login` / `/register` (Autentificare), `/admin` (Panou administrare).
8. **Out of Scope (7):** Fără multi-localitate, fără date estimate pentru 2023, fără plăți/taxe, fără OCR din PDF, fără OAuth terți/SMTP extern, fără AI/LLM de clasificare, fără sincronizare live API.

### 3. Fișiere create și modificate
* `docs/SCOPE.md` — **Creat:** Documentul complet de specificații și scop agreat.
* `README.md` — **Creat:** Prezentarea proiectului, a stivei, variabilelor, ecranelor și limitărilor.
* `CONTEXT.md` — **Modificat:** Adăugarea vocabularului specific domeniului bugetar local.
* `docs/agents/DECISIONS.md` — **Modificat:** Înregistrarea deciziilor D-002, D-003, D-004, D-005, D-006 ca `approved`.
* `docs/agents/OPEN-QUESTIONS.md` — **Modificat:** Marcarea Q-001 ca `answered` și deschiderea Q-002, Q-003, Q-004, Q-005.
* `AI_LOG.md` — **Creat:** Prezentul jurnal de bord.

### 4. Decizii aprobate în registru
* **D-001** (preexistentă) · Local branching and approval gate for commits.
* **D-002** (aprobată) · Full technology stack and architecture (Next.js, TypeScript, PostgreSQL 16 Docker, Drizzle, ECharts, Vitest).
* **D-003** (aprobată) · Exact numeric representation for monetary values (`BIGINT` bani / `NUMERIC(15,2)`, fără `FLOAT`).
* **D-004** (aprobată) · Reconciliation tolerance and publication gate (toleranță ±1,00 leu, justificare textuală obligatorie ≥20 caractere).
* **D-005** (aprobată) · Local containerized storage with abstracted interface for audit files (volum local Docker + interfață `FileStorageService`).
* **D-006** (aprobată) · Session-based authentication via HTTP-only cookies and bcrypt password hashing (fără OAuth extern).

---
