---
sidebar_position: 3
---

# Configuration

Learn how to customize your Project Template site to match your project's needs.

## Basic Configuration

The main configuration file is located at `docusaurus.config.ts`. Here are the key settings you should update:

### Site Metadata

```typescript
const config: Config = {
  title: 'Your Project Name',
  tagline: 'Your project description',
  favicon: 'img/favicon.ico',
  url: 'https://your-project.example.com',
  baseUrl: '/',
  organizationName: 'your-username',
  projectName: 'your-project',
  // ...
};
```

### Navigation Bar

Update the navigation bar in the `themeConfig.navbar` section:

```typescript
navbar: {
  title: 'Your Project',
  logo: {
    alt: 'Your Project Logo',
    src: 'img/logo.svg',
  },
  items: [
    // Add or modify navigation items
  ],
},
```

## Multi-language Setup

The template comes pre-configured with English and Chinese support.

### Default Language Configuration

```typescript
i18n: {
  defaultLocale: 'en',
  locales: ['en', 'zh-Hans'],
},
```

### Adding More Languages

1. Add the locale to the `locales` array in `docusaurus.config.ts`
2. Create translation files using Docusaurus CLI:

```bash
yarn write-translations --locale [locale]
```

3. Translate your content in the generated `i18n/[locale]/` directories

## Theme Customization

### Custom CSS

Edit `src/css/custom.css` to customize colors, fonts, and layout:

```css
:root {
  --ifm-color-primary: #2e8555;
  --ifm-color-primary-dark: #29784c;
  /* Add your custom CSS variables */
}
```

### Logo and Favicon

Replace these files in the `static/img/` directory:
- `logo.svg` - Site logo
- `favicon.ico` - Browser favicon
- `docusaurus-social-card.jpg` - Social media preview image

## Plugin Configuration

### Blog Settings

Configure blog behavior in the preset configuration:

```typescript
blog: {
  showReadingTime: true,
  postsPerPage: 10,
  blogSidebarTitle: 'All posts',
  blogSidebarCount: 'ALL',
},
```

### Docs Settings

Customize documentation behavior:

```typescript
docs: {
  sidebarPath: './sidebars.ts',
  editUrl: 'https://github.com/your-username/your-project/tree/main/docs/',
  showLastUpdateTime: true,
  showLastUpdateAuthor: true,
},
```

## SEO and Analytics

### Meta Tags

Configure SEO settings:

```typescript
const config: Config = {
  // ...
  themeConfig: {
    metadata: [{name: 'keywords', content: 'documentation, blog, react'}],
    image: 'img/docusaurus-social-card.jpg',
  },
};
```

### Google Analytics

Add Google Analytics (optional):

```bash
yarn add @docusaurus/plugin-google-analytics
```

Then configure in `docusaurus.config.ts`:

```typescript
plugins: [
  [
    '@docusaurus/plugin-google-analytics',
    {
      trackingID: 'UA-XXXXXXXXX-X',
    },
  ],
],
```

## Sidebar Configuration

Edit `sidebars.ts` to organize your documentation:

```typescript
import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    'installation',
    {
      type: 'category',
      label: 'Guides',
      items: ['guide1', 'guide2'],
    },
  ],
};
```

## Footer Configuration

Customize the footer links in `docusaurus.config.ts`:

```typescript
footer: {
  style: 'dark',
  links: [
    {
      title: 'Docs',
      items: [
        {
          label: 'Getting Started',
          to: '/docs/intro',
        },
      ],
    },
    // Add more footer sections
  ],
  copyright: `Copyright © ${new Date().getFullYear()} Your Project.`,
},
```

## Environment Variables

You can use environment variables for sensitive configuration:

```bash
# .env
ORGANIZATION_NAME=your-org
PROJECT_NAME=your-project
```

Then reference them in your config:

```typescript
organizationName: process.env.ORGANIZATION_NAME,
projectName: process.env.PROJECT_NAME,
```