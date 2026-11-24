# DESIGN — proiect_web1

<!-- graffino-agentic:begin v1 -->
> The design guardrails for this app. Every UI change follows them. A change to a
> token or a rule here is a PROPOSAL (AGENTS.md → The gate).

## Where designs live
**Designs change only in this repo.** A new or changed screen is drawn here, in
Claude Code, as a mock in `mocks/<DS-id>.html` (using the tokens below), and
confirmed before it is built. The places:

| Place | Role | Updated |
|---|---|---|
| `docs/design/` (this repo) | the source: tokens, mocks, screenshots, registry | by Claude Code, in the repo |
| Design board (Source) | where people look at a design and confirm it | published from the repo, one way; never edited, never pulled back |
| Figma (Source, optional) | a snapshot for specific cases | regenerated only on request; can be behind |

When they disagree, the repo is right. A change made on the board or in Figma is lost
at the next publish. Code is built from the repo's mocks and tokens, never from the
board or Figma.

## Procedure for any UI change

1. **Find the design.** Resolve the screen's `DS-` ID in `registry.yaml` and open
   its mock (`mocks/`) and screenshots (`screens/`). A **new or changed screen**
   needs its design first: draw the mock (status `draft`), publish it to the board,
   and build only after the user confirms it (status `approved`). Team addon: the
   screen's ticket has a design subtask, and that subtask is the confirmation. Never
   extrapolate a screen.
2. **Reuse first.** Use an existing component from `registry.yaml` (kind
   `component`). A new component needs a reason in the plan.
3. **Tokens only.** Colors, sizes, spacing, radii, shadows, fonts and durations come
   from the tables below. No raw hex, px or font name in component code.
4. **Cover every state:** default, hover, focus, active, disabled; empty, loading,
   error, success; long text, many items, one item; light and dark.
5. **Screenshot and compare** (command in AGENTS.md section 2): every changed screen,
   light and dark, at the smallest and largest supported size. Save as
   `screens/<DS-id>.<light|dark>.png`. Look at each one before you report.
6. **Record.** Update `registry.yaml` (new DS- ID, status `implemented`, source
   file). Republish the changed screens to the board. A reusable UI practice becomes
   a `candidate` pattern.

## Guardrails

**Color and contrast**
- Text contrast ≥ 4.5:1 (≥ 3:1 for text ≥ 18.66 px bold / 24 px). Icons, borders of
  inputs and focus rings ≥ 3:1 against their background. Check both themes.
- Color never carries meaning alone: pair it with an icon or text.
- Dark mode uses its own token values, not inverted light values.

**Typography**
- System font stack or standard web-safe fonts (`system-ui, -apple-system, sans-serif`).
- Clear typographic hierarchy from heading to body text.

**Spacing & Layout**
- Consistent 4px / 8px grid (4, 8, 12, 16, 24, 32, 48, 64 px).
- Responsive layouts adapting cleanly to mobile and desktop viewports.
<!-- graffino-agentic:end -->

---

## Design Tokens

### 1. Typography

| Token | CSS Variable / Value | Description |
|---|---|---|
| `font-sans` | `'Inter', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif` | Text curent, titluri, etichete, navigare |
| `font-mono` | `'JetBrains Mono', ui-monospace, SFMono-Regular, monospace` | Coduri bugetare (`51.02`, `5002`), hash-uri, ID-uri |
| `font-numbers` | `font-variant-numeric: tabular-nums` | **Obligatoriu** pe toate sumele în lei, procente și tabele |

| Scale Token | Font Size | Line Height | Usage |
|---|---|---|---|
| `text-xs` | 0.75rem (12px) | 1rem (16px) | Badge-uri, metadata, note de subsol |
| `text-sm` | 0.875rem (14px) | 1.25rem (20px) | Text tabele, etichete formulare, breadcrumbs |
| `text-base` | 1rem (16px) | 1.5rem (24px) | Text de corp implicit, descrieri |
| `text-lg` | 1.125rem (18px) | 1.75rem (28px) | Subtitluri secțiuni, carduri de KPI secundare |
| `text-xl` | 1.25rem (20px) | 1.75rem (28px) | Titluri carduri mari, valori mari de KPI |
| `text-2xl` | 1.5rem (24px) | 2rem (32px) | Titluri de ecrane secundare, totaluri cheie |
| `text-3xl` | 1.875rem (30px) | 2.25rem (36px) | Titluri de pagină majore |
| `text-4xl` | 2.25rem (36px) | 2.5rem (40px) | Hero section (întrebarea jurnalistei) |

### 2. Colors & Semantic Palettes

#### Surface & Foreground (Fond și Text)

| Token | Light Theme | Dark Theme | Usage |
|---|---|---|---|
| `bg-app` | `#F8FAFC` (Slate 50) | `#0B0F17` (Deep Dark) | Fundal general pagină |
| `bg-surface` | `#FFFFFF` | `#111827` (Gray 900) | Carduri, panouri, modale |
| `bg-surface-subtle` | `#F1F5F9` (Slate 100) | `#1F2937` (Gray 800) | Antete tabele, fundal inputuri |
| `fg-default` | `#0F172A` (Slate 900) | `#F8FAFC` (Slate 50) | Text principal de corp (contrast ≥ 14:1) |
| `fg-muted` | `#475569` (Slate 600) | `#CBD5E1` (Slate 300) | Text secundar, etichete (contrast ≥ 5.5:1) |
| `fg-subtle` | `#64748B` (Slate 500) | `#94A3B8` (Slate 400) | Placeholder, note secundare (contrast ≥ 4.5:1 Dark) |
| `border-default` | `#E2E8F0` (Slate 200) | `#374151` (Gray 700) | Borduri carduri, separatori tabele |
| `border-subtle` | `#F1F5F9` (Slate 100) | `#1F2937` (Gray 800) | Separatori interni |

#### Brand & Identitate Locală (Comuna Șura Mare)

| Token | Light Theme | Dark Theme | Usage |
|---|---|---|---|
| `brand-primary` | `#0F3B9D` (Albastru Heraldic) | `#60A5FA` (Blue 400) | Culoare primară, butoane principale, accente de brand |
| `brand-primary-hover` | `#0C2F7D` | `#93C5FD` (Blue 300) | Stare hover buton primar |
| `brand-gold` | `#A16207` (Gold/Amber 700 text) | `#FACC15` (Yellow 400) | Text și badge-uri de accent auriu (contrast ≥ 4.8:1) |
| `brand-gold-bg` | `#DFD400` (Auriu Stemă) | `#854D0E` (Amber 800) | Element vizual decorativ / stemă (text închis asociat) |
| `brand-gold-subtle` | `#FEF9C3` (Yellow 100) | `#422006` (Amber 950) | Fundal badge de accent auriu |

#### Semantice Financiare & Alerte

| Token | Light Theme | Dark Theme | Semnificație |
|---|---|---|---|
| `finance-positive` | `#15803D` (Green 700) | `#4ADE80` (Green 400) | Încasări realizate, execuție bună (≥80%) |
| `finance-positive-bg` | `#DCFCE7` (Green 100) | `#052E16` (Green 950) | Fundal badge pozitiv |
| `finance-warning` | `#B45309` (Amber 700) | `#FBBF24` (Amber 400) | Atenție: Variație an/an +30%–+50% sau execuție slabă (<10%) |
| `finance-warning-bg` | `#FEF3C7` (Amber 100) | `#451A03` (Amber 950) | Fundal badge avertisment |
| `finance-critical` | `#B91C1C` (Red 700) | `#F87171` (Red 400) | Alertă: Variație majoră >+50%, discrepanță reconciliere |
| `finance-critical-bg` | `#FEE2E2` (Red 100) | `#450A0A` (Red 950) | Fundal badge critic |

#### Comparație Duală: Funcționare vs. Investiții

| Categorie | Light Theme | Dark Theme |
|---|---|---|
| `dual-operating` (Funcționare) | `#334155` (Slate 700) | `#94A3B8` (Slate 400) |
| `dual-operating-bg` | `#F1F5F9` (Slate 100) | `#1E293B` (Slate 800) |
| `dual-investment` (Investiții) | `#0284C7` (Sky 600) | `#38BDF8` (Sky 400) |
| `dual-investment-bg` | `#E0F2FE` (Sky 100) | `#082F49` (Sky 950) |

#### Paleta Treemap & Categorii Cetățenești (7 Domenii)

| Domeniu Bugetar | Culoare Light | Culoare Dark | Cod Hex Accent |
|---|---|---|---|
| 1. Drumuri și Transport | Albastru Regal | Sky Vibrant | `#2563EB` |
| 2. Apă, Canalizare și Mediu | Teal Smarald | Mint | `#0D9488` |
| 3. Iluminat Public și Dezvoltare | Portocaliu Auriu | Amber Bright | `#D97706` |
| 4. Educație și Cultură | Violet Editorial | Indigo Deschis | `#7C3AED` |
| 5. Asistență Socială și Sănătate | Roșu Corai / Rose | Rose Bright | `#E11D48` |
| 6. Administrație, Ordine & Datorie | Ardezie Neutru | Slate Mediu | `#475569` |
| 7. Agricultură și Acțiuni Economice | Verde Pădure | Lime Vivid | `#16A34A` |

### 3. Spacing, Borders & Shadows

#### Grilă de Spațiere (Grid 4px / 8px)

| Token | Valoare | Utilizare |
|---|---|---|
| `space-1` | 0.25rem (4px) | Gap minim elemente inline, padding badge |
| `space-2` | 0.5rem (8px) | Spațiere internă butoane mici, gap icon-text |
| `space-3` | 0.75rem (12px) | Padding intern celule tabel, gap carduri mici |
| `space-4` | 1rem (16px) | Padding standard carduri, margin standard |
| `space-6` | 1.5rem (24px) | Padding panouri, gap între coloane de dashboard |
| `space-8` | 2rem (32px) | Spațiere între secțiuni de pagină |
| `space-12` | 3rem (48px) | Separare între blocuri majore |
| `space-16` | 4rem (64px) | Margine sus/jos Hero |

#### Raze de Curbură (Border Radius)

| Token | Valoare | Utilizare |
|---|---|---|
| `radius-sm` | 0.25rem (4px) | Tag-uri mici, badge-uri de statut |
| `radius-md` | 0.375rem (6px) | Butoane, inputuri formulare, dreptunghiuri Treemap |
| `radius-lg` | 0.5rem (8px) | Carduri standard, panouri de filtrare |
| `radius-xl` | 0.75rem (12px) | Carduri Hero, modale mari |
| `radius-full` | 9999px | Avatare, pill-uri interactive |

#### Elevații & Umbre (Shadows)

| Token | Light Theme | Dark Theme | Utilizare |
|---|---|---|---|
| `shadow-sm` | `0 1px 2px 0 rgba(0,0,0,0.05)` | `0 1px 2px 0 rgba(0,0,0,0.3)` | Carduri plate, butoane secundare |
| `shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.07)` | `0 4px 6px -1px rgba(0,0,0,0.4)` | Carduri hover, dropdown-uri |
| `shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.08)` | `0 10px 15px -3px rgba(0,0,0,0.5)` | Panouri plutitoare, modale, Treemap tooltips |

#### Tranziții

| Token | Valoare | Utilizare |
|---|---|---|
| `duration-fast` | 150ms ease-in-out | Hover butoane, tooltip-uri, link-uri |
| `duration-normal` | 250ms ease-in-out | Deschidere panou lateral, acordeon, schimbare temă |
| `duration-slow` | 400ms ease-in-out | Re-randare și tranziție treemap / grafice animate |

---

### 4. Chart Colors (ECharts)

Tokeni destinați exclusiv componentelor Apache ECharts. Nu se folosesc în CSS general.

| Token | Light Theme | Dark Theme | Utilizare |
|---|---|---|---|
| `chart-forecast` | `#60A5FA` (Blue 400) | `#93C5FD` (Blue 300) | Linie previzionată / buget aprobat |
| `chart-actual` | `#0F3B9D` (Brand Blue) | `#60A5FA` (Blue 400) | Linie realizată / plăți efective |
| `chart-stacked-operating` | `#334155` (Slate 700) | `#94A3B8` (Slate 400) | Segment stacked bar: Funcționare |
| `chart-stacked-investment` | `#0284C7` (Sky 600) | `#38BDF8` (Sky 400) | Segment stacked bar: Investiții |

### 5. Accessibility Tokens

| Token | Valoare | Utilizare |
|---|---|---|
| `focus-ring` Light | `0 0 0 3px rgba(15, 59, 157, 0.5)` | Inel de focus WCAG 2.1 §2.4.7 (Light mode) |
| `focus-ring` Dark | `0 0 0 3px rgba(96, 165, 250, 0.5)` | Inel de focus WCAG 2.1 §2.4.7 (Dark mode) |

> [!IMPORTANT]
> `*:focus-visible` trebuie să aplice `box-shadow: var(--focus-ring)` și `outline: none` în toate mock-urile și componentele finale.

### 6. Fixed Brand Colors

Aceste tokeni nu se suprascriu în `html.dark` — rămân constante indiferent de temă (utilizate pe suprafețe cu fundal heraldic permanent, e.g. header nav, bordura aurie).

| Token | Valoare | Utilizare |
|---|---|---|
| `brand-primary-fixed` | `#0F3B9D` | Fundal header nav, butoane cu temă fixă |
| `brand-gold-fixed` | `#DFD400` | Bordura inferioară header, accent decorativ stemă |
| `color-white` | `#FFFFFF` | Text alb pe suprafețe cu fundal `brand-primary-fixed` |
