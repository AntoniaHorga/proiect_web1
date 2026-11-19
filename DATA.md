# Documentația Setului de Date — P09 Explorator de Buget Local

## 1. Sursa și Licența Datelor
- Entitate analizata: Comuna Sura Mare, Judetul Sibiu (CUI: 4241184)
- Sursa oficiala: Site-ul oficial al Primariei Comunei Sura Mare, sectiunea Transarenta Decizionala/Documente si informatii financiare
- Perioada acoperita: Anii 2022, 2024, 2025
- Data colectarii: Noiembrie 2026

## 2. Inventarul Fișierelor din `data/raw/`
Datele oficiale au fost publicate sub formă de rapoarte PDF și convertite în format `.xlsx` pentru procesare. Fișierele originale sunt păstrate în arhiva brută pentru trasabilitate.

## 3. Date lipsa
- Anul 2023: Rapoartele de executie bugetara pentru anul 2023 lipsesc din arhiva publicata online pe site-ul Primariei Sura Mare, fiind prezentate doar datele pana la luna 09 a anului respectiv.

## 4. Structura Coloanelor și Probleme Identificate (Data Quality)
- **Antet pe 2 rânduri (rândurile `0` și `1`):** Rândul `0` conține denumirile coloanelor, iar rândul `1` conține codurile oficiale ale coloanelor (`A`, `B`, `1..9` la cheltuieli; `A`, `B`, `1..8=3-6-7` la venituri). Datele efective încep întotdeauna de la rândul `2`.
- **Coloane de codificare ierarhică (coloanele `0`–`5` în toate fișierele):**
  - `Capitol` (col. 0), `Subcapitol` (col. 1), `Paragraf` (col. 2), `Grupa/Titlu` (col. 3), `Articol` (col. 4), `Alineat` (col. 5), `Denumire indicator` (col. 6).
- **Coloane financiare la Venituri (col. `7`–`14`):** `Prevederi bugetare initiale`, `Prevederi bugetare definitive`, `Total, din care:`, `din anii precedenti`, `din anul curent`, `Incasari realizate`, `Stingeri pe alte cai decat incasari`, `Drepturi contestate de incasat`.
- **Coloane financiare la Cheltuieli (col. `7`–`15`):** `Credite angajament initiale`, `Credite angajament definitive`, `Credite bugetare initiale`, `Credite bugetare definitive`, `Angajamente bugetare`, `Angajamente legale`, `Plati efectuate`, `Angajamente legale de platit`, `Cheltuieli efective`.

### 4.2. Anomalii reale descoperite în fișiere și reguli de curățare (Parser)
La inspecția celor 6 fișiere Excel au fost identificate următoarele probleme critice care trebuie tratate de parser și verificate la reconciliere:
1. **Dublarea blocului `5002 TOTAL CHELTUIELI` în fișierele de cheltuieli (Risc major de dublare a bugetului):**
   - *Observație:* În `cheltuieli2022.xlsx` (rândul `2` și rândul `72`), `cheltuieli2024.xlsx` (rândul `2` și rândul `81`) și `cheltuieli2025.xlsx` (rândul `2` și rândul `75`), indicatorul `5002 TOTAL CHELTUIELI` apare de două ori cu exact aceleași sume totale.
   - *Explicație contabilă:* Primul bloc (rândurile `2`–`71` în 2022) prezintă execuția agregată exclusiv pe clasificația funcțională (Capitole/Subcapitole/Paragrafe). Al doilea bloc (începând cu a doua apariție a lui `5002`) prezintă mai întâi rezumatul pe clasificația economică (Titluri `10`–`81`), urmat de detalierea mixtă (Capitol funcțional × Titlu/Articol economic).
   - *Regulă de procesare:* Parserul delimitează explicit cele două secțiuni la a doua apariție a codului `5002`, evitând dublarea totalurilor
2. **Rânduri agregatoare de nivel superior (`Partea I-a` – `Partea V-a`) și subtotaluri intermediare:**
   - *Observație:* Codurile de tip `5100.02`, `6000.02`, `6500.02`, `7000.02`, `8000.02` (la cheltuieli) și `0002`, `0003`, `0004` (la venituri), precum și grupele `01 Cheltuieli curente`, `70 Cheltuieli de capital`, `79 Operațiuni financiare`, reprezintă subtotaluri agregatoare.
   - *Regulă de procesare:* Liniile agregatoare sunt marcate cu `is_summary = true` și excluse din agregările SQL pe linii detaliate, fiind păstrate doar pentru verificarea de reconciliere (suma subcapitolelor = total capitol)
3. **Denumiri sparte pe mai multe rânduri (rânduri fără cod bugetar):**
   - *Observație:* La conversia din PDF, textele lungi s-au rupt pe 2–4 rânduri consecutive, lăsând coloanele `0`–`5` complet goale (`NaN`): 87 rânduri în `cheltuieli2022.xlsx`, 103 în `cheltuieli2024.xlsx`, 133 în `cheltuieli2025.xlsx`, 48 în `venituri2022.xlsx`, 71 în `venituri2024.xlsx` și 79 în `venituri2025.xlsx`. Sumele numerice apar doar pe **ultimul rând** al fragmentului de text.
   - *Regulă de procesare:* Parserul propagă contextul ultimului cod valid și concatenează fragmentele de text până la întâlnirea rândului care conține valorile numerice
4. **Valori negative (stornări, recuperări și transferuri între secțiuni):**
   - *Observație:* Există valori negative valide contabil care nu trebuie tratate ca erori de parsare:
     - `-5.953` lei în `cheltuieli2022.xlsx` și `-33.069` lei în `cheltuieli2025.xlsx` (*Plăți efectuate recuperate în anul curent*).
     - `-708.761` lei în `venituri2025.xlsx` la subcapitolul `37.02.03` (din secțiunea de funcționare pentru finanțarea secțiunii de dezvoltare a bugetului local — cu semnul minus).
5. 
