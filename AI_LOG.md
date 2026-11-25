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

## Sesiunea 2: Interviu de Design și Propunerea Tokenilor Vizuali
**Data:** 19 noiembrie 2026  
**Context:** Pasul D — Definirea identității vizuale și a ghidului de stil pentru Comuna Șura Mare

### 1. Ce a furnizat utilizatorul
* **Identitate locală:** Albastru heraldic (`#0F3B9D`) și accent auriu (`#DFD400` / ajustat la contrast `#A16207`), inspirate din stema oficială a Comunei Șura Mare (fond albastru, săbii încrucișate și chevron auriu).
* **Ton:** Jurnalism de date & Civic-Tech modern (aerisit, spațiu alb generos, contrast ridicat WCAG AA/AAA, claritate pentru cetățeanul fără pregătire contabilă).
* **Referințe:** *Banul Public* (accesibilitate civică) și *Our World in Data* (claritatea graficelor și a etichetelor).
* **Tipografie:** `Inter` (cu `tabular-nums` obligatoriu pe toate sumele și tabelele) și `JetBrains Mono` pentru coduri bugetare și statusuri.
* **Paletă semantică:** Verde smarald (execuție pozitivă), Chihlimbar (atenție +30%–+50% sau execuție <10%), Roșu crimson (alertă critică >+50% sau discrepanță), nuanțe Slate/Sky pentru comparația duală Funcționare vs. Investiții și o paletă armonioasă pe 7 culori pentru Treemap.

### 2. Fișiere modificate
* `docs/design/DESIGN.md` — completat cu tabelele complete de tokeni (Typography, Surface/Foreground, Brand, Semantice financiare, Dual comparison, Treemap 7 domenii, Spacing, Radii, Shadows, Transitions).
* `AI_LOG.md` — actualizat cu logul sesiunii de design.

---

## Sesiunea 3: Desenarea Mock-urilor HTML/CSS (DS-001 și DS-002)
**Data:** 19 noiembrie 2026  
**Context:** Laboratorul 1 — Crearea mock-urilor interactive cu date reale și stări multiple

### 1. Ce s-a realizat
* Extragerea cifrelor exacte din setul de date oficial al Comunei Șura Mare (2022, 2024, 2025):
  * Total Cheltuieli, Funcționare vs. Investiții (scăderea execuției investițiilor de la 75,1% la 23,5%).
  * Cele 4 KPI-uri macro pentru 2025 (48,25 mil. lei buget, 20,78 mil. lei încasări, 21,94 mil. lei plăți, sold negativ acoperit din excedent).
  * Distribuția pe cele 7 domenii cetățenești (Educație 31,9%, Asistență 23,0%, Apă 21,9%, Administrație 17,8%, Iluminat 14,1%, Drumuri 6,3%, Agricultură 0,6%).
  * Alertele de variație: Drumuri +367% (6,45 mil. lei alocat vs 1,38 mil. lei plătit) și proiecte cu execuție 0% (Alte servicii agricultură - 100.000 lei necheltuiți).
* Generarea a două mock-uri HTML/CSS de sine stătătoare, fără dependențe externe:
  * `docs/design/mocks/01-dashboard.html` (DS-001) — Tablou de bord principal (`/`).
  * `docs/design/mocks/02-explorator.html` (DS-002) — Explorator de buget cu Treemap & Adnotări (`/explorator`).
* Implementarea barei de instrumente pentru testare în browser:
  * Comutator Light / Dark mode cu tokenii din `docs/design/DESIGN.md`.
  * Comutator între cele 4 stări: **Normal** (date reale), **Loading** (skeleton screens cu animație shimmer), **Empty** (fără date) și **Error** (mesaj de eroare).
* Actualizarea registrului de design `docs/design/registry.yaml` cu cele două ecrane în starea `draft`.

---

## Sesiunea 4: Rafinarea Mock-urilor și Generarea Ecranelor Complete (DS-001 – DS-007)
**Data:** 19 noiembrie 2026  
**Context:** Laboratorul 1 — Integrarea feedback-ului, a stemei oficiale și generarea completă a celor 7 ecrane

### 1. Modificări aplicate pe ecranele existente
* **Integrare Stemă Oficială Șura Mare:** Înlocuire SVG placeholder cu stema oficială reală `../assets/stema-sura-mare.png` (și `public/images/stema-sura-mare.png`).
* **Header Vizual de Brand:** Navigație aplicată pe albastru heraldic `#0F3B9D`, text alb, accent auriu `#DFD400` pe bordura inferioară și pe tab-ul activ.
* **Hero Scanabil în Dashboard (`01-dashboard.html`):** Titlu-concluzie concis (*„Investiții 2022–2025: Alocări record de 43,38 mil. lei, dar execuție efectivă de doar 23,5%”*), bară comparativă vizuală Funcționare (73,4%) vs. Investiții (26,6%), carduri anuale și eliminarea textului dens.
* **KPI-uri Umane:** Înlocuire etichete tehnice (`COL K`, `COL N`) cu indicatori expliciți (`Buget definitiv`, `44,3% din prevăzut`, `45,5% din prevăzut`, `Acoperit din excedent`).
* **Iconițe Vectoriale:** Înlocuire emoji-uri cu SVG-uri uniforme (stil Lucide).

### 2. Ecranele noi generate (DS-003 – DS-007)
* `docs/design/mocks/03-cautare.html` (`DS-003` · `/cautare`) — Căutare instantanee în denumiri, chip-uri de sugestii, filtre multi-anuale și evidențiere a termenilor căutați.
* `docs/design/mocks/04-comparatii.html` (`DS-004` · `/comparatii`) — Comparații YoY via `LAG()`, toggle Valori nominale vs. Ajustate cu inflația IPC și calcul Per Capita (populație INS 4.860 → 5.120 → 5.240 locuitori).
* `docs/design/mocks/05-audit.html` (`DS-005` · `/audit`) — Rapoarte reconciliere pe fiecare an (toleranță ±1 leu), note explicative, siluetă teritorială SVG Șura Mare + Hamba și descărcare fișiere brute XLSX/PDF.
* `docs/design/mocks/06-auth.html` (`DS-006` · `/login` & `/register`) — Autentificare/înregistrare cetățean/jurnalist securizată conform D-006.
* `docs/design/mocks/07-admin.html` (`DS-007` · `/admin`) — Upload fișiere noi, blocare publicare la discrepanțe fără justificare ≥20 caractere (D-004), moderare adnotări și configurare `locality_stats` (Q-002).
* **Registru:** `docs/design/registry.yaml` actualizat cu toate cele 7 ecrane.

---

## Sesiunea 5: Actualizare Design Vizual cu Fotografii Reale, Hartă Interactivă & Grafice OWID
**Data:** 24 noiembrie 2026  
**Context:** Rafinare mock-uri HTML/CSS (`01`–`07`) pe baza imaginilor reale din `docs/design/assets/`

### 1. Îmbunătățiri aplicate pe toate cele 7 ecrane (`01`–`07`)
* **Header unificat și echilibrat (`76px`):** Bară de navigare pe albastru heraldic `#0F3B9D` cu bordură aurie `#DFD400`, stema oficială `../assets/stema-sura-mare.png` mărită la `52px` într-un scut luminos cu contur auriu pentru contrast maxim, meniu principal aerisit, selector de an stil pill (`2022` | `2024` | `2025`), buton rapid „Caută în buget” pe accent `#DFD400` și acces cont fără emoji-uri.
* **Hero Banner tip „Funky Citizens” (`01-dashboard.html`):** Eliminat complet citatul „Întrebarea jurnalistului” și înlocuit cu un Hero full-width (`min-height: 440px`) pe fotografia panoramică `../assets/sura_mare_de_sus.jpg` cu gradient `#0F3B9D`, titlu civic clar, subtitlu scurt și 2 butoane de acțiune (*„Explorează bugetul 2025”* și *„Vezi harta investițiilor”*).
* **Hartă interactivă UAT Șura Mare în stil „Our World in Data” (`01-dashboard.html` & `02-explorator.html`):** Contur teritorial cu vatra satului Șura Mare, vatra satului Hamba, axa DN14 și 4 pin-uri clicabile legate de fotografiile reale (`scoala3.jpeg` + galerie `scoala.jpg`/`scoala2.jpg`, `parc.jpg`, `buz.jpg`, `primarie.jpg`), cu card de detalii dinamic în dreapta. În `02-explorator.html`, panoul lateral include și galeria foto comunitară (`cultura.jpg`, `festival.jpg`, `targ.jpg`, `biserica.jpg`, `festival2.jpg`).
* **Pagină de Comparații axată pe grafice (`04-comparatii.html`):** 3 grafice SVG în stil *Our World in Data* (bare grupate Previzionat vs. Plăți cu marcaj pentru lipsa 2023, evoluție liniară pe 7 domenii cu etichete directe și Funcționare vs. Investiții 100% Stacked) + comutator dinamic între *Lei Nominali*, *Ajustat cu Inflația (IPC)* și *Per Capita*, iar tabelul SQL `LAG()` este mutat într-un acordeon colapsabil la final.
* **Ecrane `03`, `05`, `06`, `07`:** Aliniate la header-ul unificat și tokenii `DESIGN.md`, cu filtrare live în `03-cautare.html` și banner foto `primarie.jpg` în `06-auth.html`.



