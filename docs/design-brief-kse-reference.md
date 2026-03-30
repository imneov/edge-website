# KubeSphere Enterprise (KSE) Product Page -- Design Analysis Brief

> Reference source: `kubesphere.cloud/kse` product page and `/documents` docs page
> Purpose: Provide a precise design reference for redesigning edge-website to match this commercial/enterprise aesthetic.

---

## 1. Page Architecture (7 Sections)

The product page follows a classic enterprise SaaS vertical scroll layout:

| # | Section Class | Type | Content |
|---|--------------|------|---------|
| 0 | `kse_top` | **Hero** | Headline + product name highlight + tagline + long description + primary CTA |
| 1 | `kse_luban` | **Platform Story** | Split layout: left text + right SVG illustration + background video loop |
| 2 | `kse_feature` | **Rotating Feature Headlines** | Animated headline carousel with gradient text + 5-card icon grid |
| 3 | `kse_innovation` | **Value Propositions** | Section heading + 4 rows of icon-left / text-right items + CTA |
| 4 | `kse_delivery` | **Pricing/Delivery** (id="delivery") | 3-column comparison cards with feature checklists + CTAs |
| 5 | `kse_resources` | **Related Resources** | 5 rows of icon-left / text-right link items with "learn more" arrows |
| 6 | `kse_bottom` | **Final CTA / Contact** | Product name + tagline + CTA button + QR code tooltip |

The docs page (`/documents`) has only 2 sections:
- Hero banner (`documents_top`) with heading + subtitle
- Content cards (`documents_content_section`) grouped by category (Products, Developers, Marketplace)

---

## 2. Hero Section (`kse_top`)

### Structure
```
<section class="kse_top">
  <div class="kse_content common-width-3">
    <h1>
      划时代的
      <span>[Product Name]</span>           <!-- highlighted text -->
      <p>[Tagline / subtitle]</p>           <!-- nested inside h1 -->
    </h1>
    <p class="kse_desc">[Long description paragraph]</p>
    <a href="#delivery">
      <button class="button button-black button-size-normal">
        [CTA Text] <svg chevron-right icon />
      </button>
    </a>
  </div>
</section>
```

### Visual Treatment
- **Background**: Solid dark or deep brand color (no visible gradient from inline styles; likely CSS class-driven dark background)
- **Typography**: h1 is the dominant element; `<span>` within h1 is used to highlight the product name (likely a different color or gradient)
- **Layout**: Single column, centered content within `common-width-3` container
- **CTA**: Single black button with right-chevron icon, anchored to `#delivery`
- **Mobile**: Separate h1 element (`kse_mobile` class) for responsive text reflow
- **No badge/trust signal** in hero -- clean and focused

### Key Design Decisions
- Product name is visually distinguished within the headline using a `<span>` wrapper
- Subtitle/tagline is a `<p>` nested inside `<h1>` (semantically unusual but visually a sub-heading)
- Long description paragraph follows separately with `kse_desc` class
- Single CTA, not dual -- emphasizes one conversion path

---

## 3. Color Scheme

### Inline Gradient Colors (extracted from feature section)
These are the accent/highlight gradients used on rotating headline keywords:

| Keyword | Gradient | Start | End |
|---------|----------|-------|-----|
| "True" (真正的) | `linear-gradient(90deg, ...)` | `#3983F7` (blue) | `#6BDDE0` (teal) |
| "Lightweight" (轻量的) | `linear-gradient(90deg, ...)` | `#7B26CF` (purple) | `#E61F86` (magenta) |
| "Full-featured" (全能的) | `linear-gradient(154deg, ...)` | `#FFBB56` (amber) | `#FF834E` (orange) |
| "Flexible" (灵活的) | `linear-gradient(154deg, ...)` | `#FF567F` (coral) | `#FF834E` (orange) |
| "Open" (开放的) | `linear-gradient(135deg, ...)` | `#E64EFF` (violet) | `#8FFFF8` (cyan) |
| "Reliable" (可靠的) | `linear-gradient(154deg, ...)` | `rgba(43,189,182)` (teal) | `rgba(150,222,218)` (light teal) |

### Derived Color Palette

**Primary Colors:**
- `#3983F7` -- Primary blue (brand blue, used in first gradient)
- `#6BDDE0` -- Teal accent
- `#7B26CF` -- Deep purple

**Secondary/Accent Colors:**
- `#E61F86` -- Magenta/hot pink
- `#E64EFF` -- Violet/bright purple
- `#FF567F` -- Coral red
- `#FF834E` -- Orange
- `#FFBB56` -- Amber/gold
- `#8FFFF8` -- Cyan/mint (light accent)
- `#3DFFA2` -- Green/mint (in radial gradient)
- `#8C35E3` -- Purple (in radial gradient)

**Neutral Colors:**
- `#fff` -- White text (confirmed for CTA icon color)
- Black/dark gray for button backgrounds (`button-black` class)
- Gray for secondary buttons (`button-grey` class)
- White for tertiary buttons (`button-white` class)

### Gradient Application Technique
The gradient text effect uses `background: linear-gradient(...)` applied to the text with `-webkit-background-clip: text` and `-webkit-text-fill-color: transparent` (standard CSS gradient text technique). The `<p>` elements containing the animated keywords carry these inline styles.

---

## 4. Typography

### Font Stack
Three Google Fonts loaded in order:
1. **Noto Sans SC** -- Weights: 100, 300, 400, 500, 700, 900 (Chinese body/headings)
2. **Montserrat** -- Weights: 100-900 incl. italic (English headings and display text)
3. **Roboto** -- Weights: 100-900 incl. italic (English body text)

Plus one custom font:
4. **SPEEDX** -- Loaded via `@font-face` from `/font/SPEEDX.otf` (likely decorative/display)

### Heading Hierarchy
- **h1** (Hero): Product headline, large display size. Contains `<span>` for product name highlight + nested `<p>` for tagline
- **h2** (Section): Section titles like "交付形式", "相关资源", "全面赋能企业数字化转型和业务创新"
- **h3** (`kse_title`): Card/item titles within each section
- **p** (`kse_desc`): Body descriptions, secondary text
- **p** (`kse_feature_desc`): Smaller descriptive text within feature checklists
- **p** (`kse_more`): "Learn more" link text with arrow

### Font Weight Pattern
- h1/h2: Bold (700-900 likely)
- h3 (`kse_title`): Medium-bold (500-700)
- Body text (`kse_desc`): Regular (400)
- Feature descriptions: Regular or light

---

## 5. Layout System

### Container Widths
Two container width classes observed:
- `common-width` -- Standard page width (header/nav)
- `common-width-3` -- Wider content area (all main sections use this)

### Section Layout Patterns

**Pattern A -- Single Column Centered** (Hero, Bottom CTA):
```
section > div.common-width-3 > h1/h2 + p + button
```

**Pattern B -- Split Layout** (LuBan section):
```
section > div.common-width-3 > div.left + img.right
```
Left side has text (h2 + p + buttons), right side has SVG illustration.

**Pattern C -- Heading + Grid** (Features):
```
section > div.common-width-3 > h2 (with carousel items) + ul > li*5
```
Each `<li>` contains: `<img>` icon + `<h3>` title + `<p>` description.
5 items, likely displayed as a grid (2-3 columns responsive).

**Pattern D -- Heading + Vertical List** (Innovation, Resources):
```
section > div.common-width-3 > h2 + ul > li*4
```
Each `<li>` contains: `<img class="kse_left_img">` + `<div>` with `<h3>` + `<p>`.
Horizontal layout within each list item (icon left, text right).

**Pattern E -- Multi-Column Comparison** (Delivery/Pricing):
```
section > div.common-width-3 > h2 + ul > li*3
```
Each `<li>` is a pricing card containing:
- Top icon (`<img>`)
- Title (`<h3>`)
- Description (`<p>`)
- Sub-heading (`kse_subhead`)
- Feature checklist (`kse_delivery_features > li` with checkmark icons)
- CTA button at bottom

---

## 6. Feature/Capability Cards

### Icon Grid (Section 2 -- kse_feature)
```html
<li>
  <img alt="[title]" src="/images/kse/feature_N.svg" />  <!-- SVG icon -->
  <h3 class="kse_title">Feature Title</h3>
  <p class="kse_desc">Description text...</p>
</li>
```
- **5 feature cards** in a grid
- Icons are SVG illustrations (not icon fonts), hosted on CDN
- Each card: icon + title + description, vertically stacked
- Clean, no borders visible (background/shadow likely from CSS)

### Icon-Left Text-Right Rows (Section 3 -- kse_innovation)
```html
<li>
  <img class="kse_left_img" src="/images/kse/innovation_N.svg" />
  <div>
    <h3 class="kse_title">Title</h3>
    <p class="kse_desc">Description paragraph...</p>
  </div>
</li>
```
- **4 items** in a vertical list
- Larger SVG illustrations on the left
- Text block on the right (title + multi-line description)

### Pricing/Delivery Cards (Section 4 -- kse_delivery)
```html
<li>
  <img alt="按需订阅" src="/images/kse/delivery_N.svg" />
  <h3 class="kse_title">Plan Name</h3>
  <p class="kse_desc">Plan description</p>
  <div class="kse_subhead">Contact Sales</div>
  <ul class="kse_delivery_features">
    <li>
      <div class="kse_feature_title">
        <img src="/images/kse/success_duotone.svg" />  <!-- checkmark -->
        Feature Name
      </div>
      <p class="kse_feature_desc">Feature details</p>
    </li>
  </ul>
  <div class="kse_btn_wrapper">
    <button class="button button-black">Contact Sales</button>
  </div>
</li>
```
- **3 pricing tiers**: Subscription, Private Deployment, Appliance
- Checkmark icon (`success_duotone.svg`) for feature list items
- Each feature has a title line (with icon) + description paragraph
- CTA button anchored at the bottom of each card

---

## 7. Button System

### Button Class Hierarchy
```
.button                    -- Base button styles
  .button-black            -- Primary/dark: black background, white text
  .button-grey             -- Secondary: grey/light background, dark text
  .button-white            -- Tertiary: white background, dark text
  .button-size-normal      -- Standard size (height/padding)
  .button-content          -- Inner flex container for icon+text alignment
```

### Button Variants Observed

| Variant | Class | Usage | Count |
|---------|-------|-------|-------|
| Primary | `button-black` | "试用企业版", "联系销售", "在线咨询" | 6 |
| Secondary | `button-grey` | "了解 KubeSphere 扩展组件", "观看产品介绍视频", "了解更多" | 4 |
| Tertiary | `button-white` | "进入 KubeSphere 市场" | 1 |

### Icon Usage in Buttons
- Chevron-right icon (`kubed-icon-chevron-right`) appended to primary CTAs in hero and bottom sections
- Play icon (`kubed-icon-start`) prepended to "观看产品介绍视频" button
- Icons use SVG sprite (`<use xlink:href="#icon-...">`) with inline color `#fff` for dark buttons
- Icon size: 20x20px with 4px left margin

### CTA Placement Strategy
- **Hero**: Single primary CTA (scroll to delivery section)
- **LuBan**: Two secondary buttons side by side
- **Innovation**: Single white/tertiary button
- **Delivery**: One primary CTA per pricing card (3 total)
- **Bottom**: Primary CTA with tooltip (QR code popup on hover)

---

## 8. Visual Language

### Icon Style
- **Line/outline SVG illustrations** for feature icons (feature_1-5.svg)
- **Detailed scene illustrations** for innovation section (innovation_1-4.svg)
- **Pictogram SVGs** for delivery options (delivery_1-3.svg)
- **Duotone checkmark** (`success_duotone.svg`) for feature lists
- All icons hosted on CDN: `ks-com-cn.pek3b.qingstor.com/images/kse/`

### Illustration Style
- SVG-based, not raster images (except `ea.png` at 989px wide for extension architecture diagram)
- Clean vector style, suitable for dark and light backgrounds
- LuBan section has a dedicated right-side SVG (`luban_right_img.svg`)

### Background Treatment
- **LuBan section**: Background video loop (`/videos/kse-video.webm`) with muted autoplay
- **Feature section**: Likely alternating background color (CSS-driven)
- **Bottom CTA section**: Includes the KubeSphere logo SVG as a decorative element on the right side

### Decorative Elements
- No visible particle effects or complex animations in the HTML structure
- Background video for the LuBan (architecture) section provides motion
- Gradient text animation on feature headlines (carousel with `active` class toggling)
- Header banner bar (`Header_headerBanner`) linking to release notes (announcement bar)

---

## 9. Docs Page Design

### Hero
```html
<section class="documents_top">
  <div class="common-width-3">
    <h1>文档中心</h1>
    <p>丰富的入门文档指引您快速上手</p>
  </div>
</section>
```
- Simple, clean hero with heading + subtitle
- No CTA in docs hero

### Content Cards
```html
<li>
  <img class="documents_logo" src="[normal icon]" />
  <img class="documents_hoverLogo" src="[hover icon]" />
  <p class="documents_title">Product Name</p>
  <p class="documents_desc">Description...</p>
  <button class="button button-grey">查看文档</button>
</li>
```
- **Dual-state icons**: Normal + hover variants (e.g., `kse.svg` / `kse_hover.svg`)
- Cards grouped by category with `<h2>` separators
- Categories: Products (2 cards), Developers (1 card), Marketplace (1 card)
- Category headers have top margin (`documents_marginT64` -- 64px margin-top)
- Each card has a "查看文档" (View Docs) grey button

---

## 10. Trust Signals

### Present Trust Elements
- "100+ 头部客户真实生产环境验证" (100+ enterprise production validations) -- mentioned in feature description text
- "Ubuntu Canonical 战略合作伙伴" (strategic partner) -- mentioned in delivery card
- Architecture compatibility callout: "x86, c86, Arm64"
- Version specificity: "KubeSphere 企业版 4.2"

### Absent Trust Elements (opportunities for edge-website)
- No customer logo bar
- No numerical metrics/stats section
- No certification badges
- No testimonial quotes
- No analyst/award badges

---

## 11. Header / Navigation

### Structure
```
Header (sticky, inheriting background)
  ├── Announcement Banner (links to release notes)
  ├── Logo (172x44 SVG)
  ├── Nav Menu
  │   ├── Products dropdown
  │   ├── Resources link
  │   └── Certification link
  ├── Language switcher
  ├── Contact Us dropdown
  └── "试用企业版" CTA button (in header)
```

### Key Navigation Details
- Sticky header (`Header_sticky`)
- Products dropdown with sub-items and descriptions
- Contact dropdown with phone, WeChat, and online chat options
- Top announcement banner bar (common enterprise pattern)

---

## 12. Footer

### Structure
- Logo repeat
- Product links column
- Company links column (partnerships, careers, about)
- Legal links (ToS, privacy, lifecycle policy)
- Social icons: WeChat, Facebook, Twitter, LinkedIn, YouTube, Slack, GitHub, Medium
- WeChat QR code with scanning code icon
- ICP filing reference (Chinese regulatory requirement)

---

## 13. Key Design Patterns for Replication

### What Makes It Look "Enterprise/Commercial"

1. **Restrained color palette** with strategic gradient accents only on key keywords
2. **SVG illustration system** -- consistent vector art style across all sections
3. **Information density** -- long descriptive paragraphs (not just bullet points)
4. **Three-tier button hierarchy** -- clear visual priority (black > grey > white)
5. **Pricing/delivery comparison** layout with feature checklists
6. **Single primary CTA** per viewport -- avoids choice paralysis
7. **Professional typography** -- Noto Sans SC for Chinese, Montserrat for English headings
8. **Background video** in architecture section adds premium feel
9. **Sticky header with announcement bar** -- standard SaaS pattern
10. **Contact options** embedded (WeChat QR, phone, online chat) -- enterprise B2B pattern

### CSS Architecture
- **Next.js CSS Modules** with hashed class names (e.g., `kse_top__1bYHy`)
- **Global utility classes** (`common-width-3`, `column-flex`, `button-*`)
- **Component-scoped classes** with prefix pattern: `ComponentName_element__hash`
- No Tailwind or other utility framework detected

### Responsive Strategy
- Separate mobile elements: `kse_pc` (desktop) and `kse_mobile` (mobile) classes
- Display toggling rather than responsive reflow for hero text
- `common-width-3` container handles max-width constraints

---

## 14. Spacing Reference (Inferred)

Since the external CSS was not accessible, spacing values are inferred from the class naming convention (`documents_marginT64` = 64px margin-top) and standard enterprise page patterns:

| Element | Estimated Spacing |
|---------|-------------------|
| Section vertical padding | 80-120px top/bottom |
| Content container max-width | 1200-1440px (`common-width-3`) |
| Card grid gap | 24-32px |
| Icon-to-text gap (horizontal) | 16-24px |
| Title-to-description gap | 8-16px |
| Button horizontal padding | 24-32px |
| Button height | 40-48px |
| Feature list item spacing | 16-24px |
| Section heading bottom margin | 40-60px |
| Category heading top margin | 64px (confirmed from class name) |

---

## 15. Implementation Recommendations

For replicating this aesthetic in the edge-website:

1. **Use gradient text sparingly** -- only on 1-2 hero keywords, not everywhere
2. **Invest in consistent SVG illustrations** -- the icon system is a major contributor to the premium feel
3. **Implement a 3-tier button system** -- primary (dark), secondary (grey/outline), tertiary (white/ghost)
4. **Follow the section rhythm**: Hero > Platform Story > Feature Grid > Value Props > Pricing > Resources > Final CTA
5. **Use professional font pairing**: A serif or geometric sans for English headings + a quality CJK font for Chinese
6. **Background video** in one key section adds depth without overwhelming
7. **Keep CTAs singular per section** -- one conversion action per viewport
8. **Add an announcement bar** above the header for latest releases/news
9. **Include a "Resources" section** linking to docs, comparisons, and release notes
10. **WeChat/contact integration** is essential for Chinese enterprise B2B
