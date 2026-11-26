# Explorator de Buget Local — Comuna Șura Mare (P09)

Aplicație web de tip *civic-tech / data-journalism* pentru analiza, explorarea interactivă și reconcilierea execuției bugetare a Comunei Șura Mare, Județul Sibiu, pe anii **2022**, **2024** și **2025**.

Proiect dezvoltat în cadrul cursului de Dezvoltare Web (Anul 3, Semestrul 1), categoria B (Date Publice).

---

## 1. Scopul Proiectului (Scope)

Bugetele administrației locale sunt publicate de regulă în formate greu accesibile (PDF-uri scanate sau Excel-uri cu mii de coduri contabile greu de descifrat). Scopul acestei aplicații este de a:
1. **Normaliza și curăța datele reale:** Importă execuțiile bugetare din fișiere `.xlsx`/`.csv`, detectează anomaliile contabile reale (ex. dublarea blocului `5002 TOTAL CHELTUIELI`, denumiri multi-line, valori negative legitime) și verifică integritatea prin reconciliere matematică automată.
2. **Oferi transparență cetățenilor:** Traduce codurile bugetare tehnice într-o taxonomie prietenoasă pe două axe (Funcționare vs. Investiții și 7 domenii tematice clare).
3. **Răspunde întrebărilor jurnaliștilor locali:** Afișează imediat în pagina principală evoluția reală a investițiilor, rata de realizare efectivă, alertele de variație majoră (>30% / >50%) și proiectele cu execuție zero.
4. **Permite explorarea detaliată și participarea civică:** Vizualizare Treemap în două vederi, funcțională (Domeniu → Capitol → Subcapitol → Paragraf) și economică (Capitol → Titlu → Articol) (Q-006), comparații an/an cu funcții analitice SQL, calcul pe cap de locuitor (per capita) și adnotări moderate pe fiecare linie de buget.

Documentul complet de scop se găsește în [docs/SCOPE.md](docs/SCOPE.md).

---

## 2. Cele 3 Variabile ale Proiectului

### Variabila 1: Localitatea și Anii Analizați
* **Localitate:** Comuna Șura Mare, Județul Sibiu (CUI: 4241184).
* **Ani de date:** **2022**, **2024**, **2025** (date complete de execuție bugetară publicate).
* **Decalajul 2023:** Rapoartele pe 2023 lipsesc din arhiva publică online (existau doar date parțiale până în luna septembrie). Discontinuitatea 2022 → 2024 este marcată explicit pe grafice și tabele, fără estimări fictive.
* **Indicatori de context:** Populația INS și Indicele Prețurilor de Consum (IPC) sunt gestionate în baza de date via `locality_stats`.

### Variabila 2: Taxonomia Comună pe Două Axe
* **Axa 1 (Funcționare vs. Investiții/Dezvoltare) — Clasificație Economică:**
  * *Funcționare:* Titlurile 10 (Personal), 20 (Bunuri & servicii), 30 (Dobânzi), 40 (Subvenții), 55 (Transferuri), 57 (Asistență socială), 59 (Alte cheltuieli), 81 (Credite), 85 (Plăți ani precedenți).
  * *Investiții & Dezvoltare:* Titlurile 56, 58, 60, 61 (Proiecte PNRR / fonduri europene nerambursabile), 71 (Active nefinanciare), 72 (Active financiare).
* **Axa 2 (7 Domenii Cetățenești) — Clasificație Funcțională:**
  1. *Drumuri și Transport* (Cap. 84.02 — inclusiv drumuri, poduri și străzi)
  2. *Apă, Canalizare și Mediu* (Cap. 70.02.05 și Cap. 74.02)
  3. *Iluminat Public și Dezvoltare Locală* (Cap. 70.02, exclusiv 70.02.05)
  4. *Educație și Cultură* (Cap. 65.02 și Cap. 67.02)
  5. *Asistență Socială și Sănătate* (Cap. 68.02 și Cap. 66.02)
  6. *Administrație, Ordine Publică și Datorie* (Cap. 51.02, 54.02, 55.02, 61.02)
  7. *Agricultură și Alte Acțiuni Economice* (Cap. 83.02 și 87.02)
* **Gruparea Veniturilor (3 surse):** Taxe și venituri locale (03.02–18.02, 30.02–36.02), Sume de la bugetul de stat (11.02, 42.02, 43.02, fără PNRR), Fonduri Europene (45.02, 48.02 și PNRR: 42.02.88, 42.02.89, 43.02.49, cu nota că banii PNRR vin de la UE prin bugetul de stat).
* **Compromisuri documentate:** Introducerea titlurilor noi PNRR în 2024–2025; agregarea investițiilor la nivel de subcapitol în absența codurilor unice de proiect în sursele primare.

### Variabila 3: Întrebarea Jurnalistului pe Pagina Principală
* **Întrebare extrasă din interviul real ([INTERVIEW.md](INTERVIEW.md) — Nițu Laura, jurnalist local):**
  > *„Cum au evoluat investițiile în comuna Șura Mare în perioada 2022–2025 și câți dintre banii alocați au fost cheltuiți efectiv?”*
* **Răspunsul vizual imediat (Hero Dashboard):**
  * Card de sinteză: Sume prevăzute vs. plăți efective pe investiții (2022, 2024, 2025), rată de execuție % și raportul Funcționare vs. Investiții.
  * 4 KPI-uri anuale: Buget aprobat, Încasări (pe 3 surse), Cheltuieli, „Sold (încasări − plăți)” (D-011).
  * Grafic ponderi pe cele 7 domenii tematice.
  * Semnale automate (D-010): variații an/an ale plăților peste +30% și +50% (procent și valoare în lei), la nivel de subcapitol, cu 2024 comparat „față de 2022” + lista subcapitolelor bugetate cu execuție 0% sau <10%.

---

## 3. Stiva Tehnologică (Tech Stack)

Conform deciziei arhitecturale [D-002](docs/agents/DECISIONS.md#d-002--full-technology-stack-and-architecture):

* **Runtime & Framework:** Node.js, TypeScript, Next.js (App Router, Server Actions, Route Handlers)
* **Design & UI:** Tailwind CSS (bazat pe tokenii din [docs/design/DESIGN.md](docs/design/DESIGN.md)), suport Light/Dark mode, URL state sincronizat prin `searchParams`
* **Bază de date & SQL:** PostgreSQL 16 rulat prin Docker Compose, accesat prin `pg` / Drizzle ORM
  * Calcule analitice și comparații an/an executate nativ în SQL (`GROUP BY`, `CTE`, `LAG()`)
  * Conform [D-003](docs/agents/DECISIONS.md#d-003--exact-numeric-representation-for-monetary-values) și D-007: sume monetare stocate exact ca `BIGINT` (în bani), fără `FLOAT`
* **Vizualizări Interactive:** Apache ECharts (`echarts-for-react`) cu Treemap pentru drill-down ierarhic și export grafic
* **Parsare Fișiere:** `xlsx` (SheetJS) server-side cu parsare structurată a rapoartelor financiare oficiale
* **Motor de Reconciliere:** Conform [D-004](docs/agents/DECISIONS.md#d-004--reconciliation-tolerance-and-publication-gate): toleranță de rotunjire ±1,00 leu, justificare textuală obligatorie (≥20 caractere) pentru publicarea fișierelor cu discrepanțe
* **Testare:** Vitest (unit/integration) + Playwright (end-to-end)

---

## 4. Structura Ecranelor

1. `/` — **Tablou de bord principal:** Răspunsul direct la întrebarea din interviu, KPI-uri anuale, semnale automate.
2. `/explorator` — **Explorator de Buget:** Treemap în vederea funcțională și în cea economică (Q-006), filtre dinamice, export CSV (doar CSV, D-014), adnotări pe linii bugetare.
3. `/cautare` — **Căutare & Detalii:** Căutare liberă după cuvinte-cheie în denumirile de indicatori pe toți anii.
4. `/comparatii` — **Comparații An/An & Indicatori:** Analiză temporală comparativă YoY, indicatori per capita și ajustare inflație.
5. `/audit` — **Metodologie, Audit & Reconciliere:** Rapoarte publice de reconciliere, descărcare fișiere originale (XLSX/PDF).
6. `/login` / `/register` — **Autentificare:** Sistem simplu email/parolă securizat cu bcrypt și sesiuni HTTP-only. Parolele le resetează adminul (D-013).
7. `/admin` — **Panou Administrare:** Import fișiere, reconciliere și aprobare publicare, moderare adnotări, configurare mapări.

---

## 5. Ce NU este în proiect (Out of Scope)

* Fără suport multi-localitate (doar Comuna Șura Mare).
* Fără estimare/interpolare speculativă a datelor pentru anul 2023.
* Fără procesare de plăți sau colectare taxe locale.
* Fără parsare OCR live din PDF (fișierele brute au fost convertite offline în `.xlsx`).
* Fără autentificare externă OAuth (Google/Facebook) sau servere de trimitere email-uri.
* Fără algoritmi de clasificare automată AI/LLM.
* Fără sincronizare API live cu Ministerul Finanțelor.
* Fără hartă a investițiilor și fără „proiecte”: fișierele de buget nu conțin locații sau identificatori de proiect.
* Fără export JSON: doar CSV (D-014).

---

## 6. Documentație și Referințe

* [docs/SCOPE.md](docs/SCOPE.md) — Documentul detaliat de specificații și scop agreat
* [DATA.md](DATA.md) — Documentația setului de date și anomaliile identificate în fișiere
* [INTERVIEW.md](INTERVIEW.md) — Transcriptul interviului cu jurnalistul local Laura Nițu
* [AGENTS.md](AGENTS.md) — Regulile de lucru și guvernanța registrului
* [docs/agents/DECISIONS.md](docs/agents/DECISIONS.md) — Registrul deciziilor arhitecturale
* [docs/agents/OPEN-QUESTIONS.md](docs/agents/OPEN-QUESTIONS.md) — Întrebările deschise
* [docs/design/DESIGN.md](docs/design/DESIGN.md) — Ghidul de stil și tokenii de design
