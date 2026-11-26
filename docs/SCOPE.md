# Document de Scop (Scope) — P09: Explorator de Buget Local

**Proiect:** P09 · Explorator de buget local (Comuna Șura Mare, Județul Sibiu)  
**Perioadă analizată:** Anii 2022, 2024, 2025  
**Data stabilirii:** 19 noiembrie 2026  
**Status:** Agreat și aliniat cu fișa proiectului, interviul utilizatorului și documentația de date.

---

## 1. Rezumat Executiv

Aplicația **Explorator de Buget Local (Comuna Șura Mare)** este o platformă web de tip *civic-tech / data-journalism* dedicată transparenței execuției bugetare a Comunei Șura Mare (Județul Sibiu). Sistemul transformă rapoartele financiare oficiale complexe publicate de autorități în format PDF/Excel într-un set de date normalizat, reconciliat contabil și accesibil publicului larg, oferind vizualizări interactive, indicatori macro-economici, alerte de variație și instrumente de adnotare civică.

---

## 2. Cele Trei Variabile ale Proiectului

### 2.1. Variabila 1 — Localitatea și Orizontul Temporal
* **Localitate:** Comuna Șura Mare, Județul Sibiu (CUI: 4241184).
* **Ani analizați:** **2022**, **2024** și **2025** (3 ani compleți de execuție bugetară).
* **Tratarea anului 2023:** Datele pentru 2023 lipsesc din arhiva publică a primăriei (au fost publicate doar execuții parțiale până la luna 09). Decalajul temporal 2022 → 2024 este marcat explicit în toate graficele și tabelele de comparație an/an (YoY), cu notă vizuală transparentă că anul 2023 este indisponibil în datele oficiale.
* **Indicatori de context (Populație & IPC):** Valorile exacte din baza INS Tempo Online sunt urmărite în [Q-002](file:///home/antonia/Work/proiect_web1/docs/agents/OPEN-QUESTIONS.md#L21-L26) și vor fi stocate într-un tabel dedicat (`locality_stats` / `macro_indicators`), seed-uite inițial și editabile de către Admin.

### 2.2. Variabila 2 — Taxonomia Comună pe Două Axe
Pentru a elimina jargonul contabil și a asigura comparabilitatea între ani:
* **Axa 1 (Funcționare vs. Investiții / Dezvoltare) — determinată de Grupa/Titlul economic:**
  * **Secțiunea de Funcționare:** Titlurile 10 (Cheltuieli de personal), 20 (Bunuri și servicii), 30 (Dobânzi), 40 (Subvenții), 55 (Alte transferuri), 57 (Asistență socială), 59 (Alte cheltuieli), 81 (Rambursări de credite), 85 (Plăți efectuate în anii precedenți).
  * **Secțiunea de Investiții / Dezvoltare:** Titlurile 56, 58, 60, 61 (Proiecte cu finanțare externă nerambursabilă / PNRR), 71 (Active nefinanciare) și 72 (Active financiare).
* **Axa 2 (7 Domenii Cetățenești) — determinată de Capitolul/Subcapitolul funcțional:**
  1. *Drumuri și Transport:* Capitol 84.02 (inclusiv subcapitolele 84.02.03.01 Drumuri și poduri, 84.02.03.03 Străzi).
  2. *Apă, Canalizare și Mediu:* Subcapitol 70.02.05 (Alimentare cu apă) și Capitol 74.02 (Protecția mediului, salubritate, canalizare).
  3. *Iluminat Public și Dezvoltare Locală:* Capitol 70.02 (Locuințe, servicii și dezvoltare publică, excluzând 70.02.05).
  4. *Educație și Cultură:* Capitol 65.02 (Învățământ) și Capitol 67.02 (Cultură, recreere și religie).
  5. *Asistență Socială și Sănătate:* Capitol 68.02 (Asigurări și asistență socială) și Capitol 66.02 (Sănătate).
  6. *Administrație, Ordine Publică și Datorie:* Capitolele 51.02, 54.02, 55.02, 61.02.
  7. *Agricultură și Alte Acțiuni Economice:* Capitolele 83.02 și 87.02.
* **Gruparea Veniturilor (3 Surse majore):**
  * *Taxe și venituri proprii locale:* Capitolele 03.02–18.02, 30.02–36.02.
  * *Sume de la bugetul de stat:* Capitolele 11.02, 42.02, 43.02, cu excepția sumelor PNRR de mai jos.
  * *Fonduri Europene:* Capitolele 45.02, 48.02, plus sumele PNRR `42.02.88`, `42.02.89` și `43.02.49` (prefixul cel mai lung câștigă, D-009). Notă vizibilă pentru utilizator: „Banii PNRR vin de la Uniunea Europeană prin bugetul de stat”.
* **Compromisuri și diferențe an/an:** Apariția noilor titluri pentru fonduri externe și PNRR (56, 58, 60, 61) în 2024–2025 (inexistente în structura din 2022); cheltuielile de capital sunt agregate la nivel de subcapitol (nu există identificator unic de proiect de investiții în fișiere decât în textul denumirii indicatorului).
* **Capitole mutate între ani (cazuri reale, verificate 2026-11-26):** FEADR raportat în 2024 sub `48.02.04` (cadrul 2014–2020) apare în 2025 și sub `45.02.53` (cadrul 2023–2027); PNRR raportat în 2024 sub `42.02.88` apare în 2025 și sub `43.02.49`. Ambele rămân comparabile an/an prin maparea pe „Fonduri Europene”, cu nota „în 2025, X este raportat și sub Y”. Sunt cazurile pentru testele de mapare cerute de fișa P09 („comparația an/an funcționează inclusiv pentru capitole redenumite”).
* **Persistență:** Maparea este gestionată în tabelul PostgreSQL `budget_taxonomy_mapping`, populată la seed și editabilă din panoul de administrare, cu fallback automat „Necategorisit”.

### 2.3. Variabila 3 — Răspunsul la Întrebarea Jurnalistei pe Pagina Principală
* **Întrebarea centrală (Nițu Laura, jurnalist local Sibiu/Șura Mare):**
  > *„Cum au evoluat investițiile în comuna Șura Mare în perioada 2022–2025 și câți dintre banii alocați au fost cheltuiți efectiv?”*
* **Implementare vizuală în Hero (`/`):**
  * Răspuns vizual sintetizat în sub 30 de secunde.
  * Card / grafic de sinteză: Comparație multi-anuală (2022, 2024, 2025) a sumelor prevăzute (credite definitive) vs. plăților efectuate (în lei și rata de realizare %), plus raportul procentual Funcționare vs. Investiții.
  * 4 KPI-uri macro pentru anul selectat (implicit 2025): Buget total aprobat, Încasări efective (pe cele 3 surse), Cheltuieli efective, „Sold (încasări − plăți)” (D-011).
  * Grafic de pondere și evoluție pe cele 7 domenii cetățenești.
  * Modul de semnale automate (D-010): la nivel de subcapitol, pe plățile efectuate. Variații an/an de peste +30% (atenție) și +50% (majoră), cu procent și diferență în lei; 2024 se compară cu 2022, cu eticheta „față de 2022”. Plus lista subcapitolelor cu grad de execuție 0% sau <10%.

---

## 3. Stiva Tehnologică și Constrângeri Tehnice

* **Runtime & Framework:** Node.js + TypeScript cu Next.js (App Router, Server Actions și Route Handlers).
* **Frontend & Design:** React, Tailwind CSS configurat strict cu tokenii din `docs/design/DESIGN.md`, suport complet Light/Dark mode, stare a filtrelor sincronizată în URL (`searchParams`), inclusiv modul de afișare „Cetățean / Analitic”, care este doar o preferință de afișare, fără legătură cu rolurile (D-012).
* **Bază de Date & SQL:** PostgreSQL 16 (orchestrat în Docker Compose) accesat via `pg` (node-postgres) și Drizzle ORM.
  * Toate agregările și comparațiile an/an sunt calculate în SQL folosind `GROUP BY`, `CTE` și window functions (`LAG()`).
  * Toate valorile monetare sunt stocate în mod exact ca `BIGINT` (în bani — 1 leu = 100 bani, D-007), fiind interzise tipurile `FLOAT`.
* **Vizualizări:** Apache ECharts (`echarts-for-react`) cu Treemap pentru explorarea ierarhică în două vederi: funcțională (Domeniu → Capitol → Subcapitol → Paragraf) și economică (Capitol → Titlu → Articol), vezi Q-006, grafice compuse (bare + linie) pentru evoluție și export direct PNG/SVG.
* **Parsare fișiere:** Server-side via `xlsx` (SheetJS) cu detectarea antetelor pe 2 rânduri, concatenarea rândurilor cu denumiri multi-line, excluderea rândurilor agregatoare superioare (`is_summary = true`) și tratarea valorilor negative legitime (stornări/recuperări).
* **Testare:** Vitest (pentru parser, rotunjiri, reconciliere și mapare taxonomie) + Playwright (pentru fluxuri E2E de bază).

---

## 4. Roluri și Securitate

1. **Vizitator (Anonim / Public):**
   * Acces la Dashboard, Explorator (Treemap), Căutare după cuvinte-cheie, Comparații An/An, Pagina de Metodologie și Audit, descărcare fișiere originale și export CSV.
   * Poate citi adnotările publice aprobate de pe fiecare linie de buget.
2. **Utilizator Înregistrat (Cetățean / Jurnalist):**
   * Autentificare proprie bazată pe email + parolă (`bcryptjs`), sesiune securizată în cookie `HTTP-only`, `Secure`, `SameSite=Lax`.
   * Poate adăuga comentarii și întrebări (adnotări) pe capitole sau linii de buget.
   * Adnotările intră inițial în starea `pending` (în așteptare).
3. **Admin:**
   * Cont inițial generat la seed din variabile de mediu (`ADMIN_EMAIL`, `ADMIN_PASSWORD`).
   * Resetează parolele utilizatorilor din panou; nu există „Ai uitat parola?” (D-013).
   * Acces la panoul protejat `/admin`: încărcare fișiere noi XLSX/CSV, rulare asistent reconciliere, aprobare importuri cu justificare textuală obligatorie, moderare adnotări (`approved` / `rejected`), configurare taxonomie și indicatori locali (`locality_stats`).

---

## 5. Motorul de Reconciliere (Twist-ul de Reconciliere)

* **Formulă de control:** Totalul calculat din liniile de detaliu (frunze) trebuie să coincidă cu totalul raportat în fișier (la nivel de capitol și total general).
* **Deduplicarea codului `5002 TOTAL CHELTUIELI`:** Parserul detectează a doua apariție a codului `5002` (trecerea de la clasificarea funcțională la cea economică/mixtă) și segmentează datele pentru a preveni dublarea bugetului.
* **Toleranțe de reconciliere:**
  * `exact_match`: diferență = 0,00 lei.
  * `rounded_match`: diferență între 0,01 și 1,00 leu (100 bani), cauzată de rotunjirile din PDF-uri sau raportările de Trezorerie.
  * `discrepancy_detected`: diferență > 1,00 leu.
* **Ciclul de viață al importului:**
  `uploaded` → `reconciled` (`exact_match` / `rounded_match` / `discrepancy_detected`) → `published`.
  * Dacă există `discrepancy_detected`, publicarea automată este blocată până când Adminul furnizează o justificare textuală obligatorie (minim 20 de caractere), salvată permanent în baza de date pentru audit.
* **Transparență publică:** Raportul de reconciliere, starea fiecărui an și fișierele brute originale sunt disponibile public pe pagina `/audit`.

---

## 6. Inventarul celor 7 Ecrane

| Nr. | Ecran | Rută | Scop & Componente Cheie |
|---|---|---|---|
| 1 | **Tablou de bord principal** | `/` | Hero cu întrebarea jurnalistei, card sinteză investiții (prevăzut vs. plătit, % execuție), 4 KPI-uri macro, grafic 7 domenii cetățenești, secțiune de alerte (+30% / +50% și investiții 0%). |
| 2 | **Explorator de Buget** | `/explorator` | Treemap interactiv cu drill-down în două vederi (funcțională și economică, Q-006), selector an (2022/2024/2025), comutator Funcționare/Investiții, export CSV, panou lateral de adnotări cu comentarii aprobate și formular adăugare. URL state complet. |
| 3 | **Căutare & Detalii** | `/cautare` | Modulul „Unde s-au dus banii pentru...”: căutare după cuvinte-cheie în denumirile indicatorilor și afișarea rezultatelor comparative pe toți anii. |
| 4 | **Comparații An/An & Indicatori** | `/comparatii` | Comparație multi-anuală detaliată YoY via window functions (`LAG()`), calcul per capita (populație INS) și ajustare opțională la inflație (IPC). |
| 5 | **Metodologie, Audit & Reconciliere** | `/audit` | Transparență completă: rapoarte de reconciliere pe ani, notele explicative ale Adminului, descărcare fișiere originale (XLSX/PDF) și dicționarul de mapare a taxonomiei. |
| 6 | **Autentificare** | `/login`, `/register` | Formulare de autentificare și înregistrare pentru utilizatori și administrator. |
| 7 | **Panou de Administrare** | `/admin` | Upload fișiere, raport reconciliere cu justificare obligatorie, moderare comentarii (`pending`), editare mapări taxonomie și editare indicatori `locality_stats`. |

---

## 7. În Afara Ariei de Cuprindere (Out of Scope / Non-Goals)

1. **Multi-localitate:** Aplicația este construită dedicat pentru Comuna Șura Mare, nu pentru alte UAT-uri.
2. **Estimarea/interpolarea datelor pentru anul lipsă 2023:** Nu se vor calcula cifre estimate sau fictive pentru 2023; decalajul este prezentat ca discontinuitate reală de date.
3. **Plăți sau servicii administrative:** Fără colectare de taxe, procesare de plăți sau formulare administrative pentru primărie.
4. **OCR direct din PDF:** Parsarea se realizează exclusiv pe fișierele structurate `.xlsx` și `.csv` (conversia PDF → Excel a fost făcută offline).
5. **Autentificare socială OAuth / Tranzacții email:** Fără login cu Google/Facebook și fără integrare de servere SMTP externe; deci fără resetare de parolă prin email (D-013).
6. **Clasificare automată cu AI/LLM:** Maparea se face determinist, prin reguli stocate în PostgreSQL și configurabile de Admin.
7. **Sincronizare live prin API:** Încărcarea datelor se face exclusiv manual prin fișiere de către Admin.
8. **Harta investițiilor și „proiectele”:** Fișierele de buget nu conțin locații și nici identificatori de proiect, deci nu există hartă cu pin-uri, galerie foto legată de proiecte sau pagini de proiect (decis 2026-11-26). Investițiile se arată la nivel de subcapitol.
9. **Export JSON:** Exportul se face doar în CSV (D-014).

---

## 8. Definition of Done (Criterii de Finalizare)

1. Toate datele reale pentru anii 2022, 2024 și 2025 din Șura Mare sunt importate, parsate și reconciliate conform regulilor.
2. Pagina principală răspunde verificabil la întrebarea din interviu și afișează corect KPI-urile și alertele automate.
3. Exploratorul Treemap permite navigare fluidă pe cele 3 niveluri ierarhice și exportă datele în CSV.
4. URL-urile din explorator și comparații codifică fidel starea (an, filtru, mod).
5. Sistemul de reconciliere blochează publicarea fișierelor cu diferențe > 1 leu în absența unei justificări de minim 20 de caractere.
6. Sistemul de roluri și fluxul de moderare al adnotărilor funcționează complet.
7. Testele automate Vitest trec cu succes pentru parser, rotunjiri și reconciliere.
