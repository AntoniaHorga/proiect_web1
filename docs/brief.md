P09 · Explorator de buget local

Categoria B · Date publice · Dificultate ★★★ · Efort estimat ~32h · Runda 1 · 1 student

Pe scurt: aplicație care importă execuția bugetară reală a localității tale (mai mulți ani, fișiere diferite), o normalizează și o face explorabilă: unde se duc banii, cum s-a schimbat de la an la an, cât înseamnă pe cap de locuitor.

Input uman obligatoriu
Localitatea ta (comună, oraș, județ). Obții date reale de buget / execuție bugetară pe minim 3 ani: de pe site-ul primăriei, de pe data.gov.ro, de pe portalul Ministerului Finanțelor, sau printr-o cerere reală în baza Legii 544/2001 (o trimiți în prima săptămână; atașezi cererea și răspunsul sau lipsa lui). Vorbești cu un jurnalist local, un consilier local sau un profesor de economie despre ce întrebări și-ar pune în față datelor. DATA.md + INTERVIEW.md.

Context real
Bugetele sunt publice, dar în PDF-uri și Excel-uri cu structuri diferite de la an la an, cu capitole și subcapitole codificate (clasificația funcțională și economică). Nimeni nu le citește. Tu le faci citibile pentru un om care vrea să știe cât s-a dat pe iluminat anul asta față de acum 3 ani.

Cerințe funcționale (must)
Import de fișiere CSV / XLSX (upload de admin) cu asistent de mapare a coloanelor: utilizatorul spune care coloană e capitolul, care e suma aprobată, care e cea executată; maparea se salvează și se reutilizează.
Model normalizat: an, capitol / subcapitol (clasificația funcțională), titlu (clasificația economică), sume aprobate / rectificate / executate.
Explorator cu drill-down (treemap sau sunburst), comparație între ani, procent de execuție, grafice.
"Unde s-au dus banii pentru..." — căutare după cuvinte-cheie în denumiri, cu rezultate pe ani.
Pe cap de locuitor (populația din INS, introdusă sau importată) și optional ajustare la inflație (indicele prețurilor de consum, din INS).
Adnotări: utilizatorii logați pot adăuga comentarii / întrebări pe o linie de buget; moderare.
Pagini publice partajabile (URL stabil pentru orice vizualizare) și export CSV al oricărei selecții.
Roluri: vizitator, utilizator (adnotează), admin (importă, moderează).

Cerințe tehnice specifice
Parsare XLSX / CSV pe server, cu detectarea rândurilor de antet și de total; fișierele originale se păstrează (object storage) pentru audit.
Interogările de agregare sunt făcute în SQL (GROUP BY, window functions pentru comparații an / an), nu în JavaScript pe toate rândurile.
Toate sumele în decimal / întregi (bani); test pe rotunjiri.
URL-urile de vizualizare codifică starea (an, capitol, mod) și sunt testate.

Twist: reconcilierea
Fiecare import produce un raport de reconciliere: totalul calculat din liniile importate trebuie să fie egal cu totalul raportat în fișier, pe fiecare capitol; orice diferență e afișată cu explicații posibile (rând de total dublat, subcapitol lipsă, sumă negativă) și importul nu se publică până nu e acceptat explicit de admin, cu motiv. Structurile diferite de la an la an trebuie mapate pe o taxonomie comună (un capitol redenumit sau împărțit în doi rămâne comparabil), iar maparea e vizibilă utilizatorului ("în 2022, X era raportat sub Y").

Variabilele tale
Localitatea și cei minim 3 ani de date.
Taxonomia comună pe care ai construit-o (și ce compromisuri ai făcut).
Întrebarea reală a jurnalistului / consilierului pe care aplicația o răspunde pe pagina principală.

Definition of Done
Minim 3 ani reali importați pe live, cu rapoarte de reconciliere acceptate.
Comparația an / an funcționează inclusiv pentru capitole redenumite (teste pe mapare).
Cererea 544 (dacă a fost cazul) și răspunsul sunt în DATA.md.
Pagina principală răspunde la întrebarea reală a interlocutorului tău.
Orice vizualizare are un URL care o reproduce.

La susținere te întrebăm
Cum detectezi un rând de total dublat și ce faci cu el?
Arată-mi query-ul pentru comparația an / an și explică window function-ul.
Ce nu ai reușit să reconciliezi și cum îi spui utilizatorului?

