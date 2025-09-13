---
sidebar_position: 4
---

# Writing Content

Learn how to create and organize content in your documentation site.

## Documentation Pages

### Creating New Pages

1. Create a new `.md` or `.mdx` file in the `docs/` directory
2. Add frontmatter at the top of the file:

```markdown
---
sidebar_position: 5
title: Custom Page Title
description: Page description for SEO
---

# Page Content

Your content goes here...
```

### Frontmatter Options

Common frontmatter fields:

- `sidebar_position`: Order in the sidebar (number)
- `title`: Custom page title (overrides H1)
- `description`: Page description for SEO
- `keywords`: SEO keywords array
- `hide_title`: Hide the page title (boolean)
- `hide_table_of_contents`: Hide TOC (boolean)

### Markdown Features

#### Code Blocks

````markdown
```javascript title="example.js"
function hello(name) {
  console.log(`Hello, ${name}!`);
}
```
````

#### Admonitions

```markdown
:::note
This is a note admonition.
:::

:::tip
This is a tip admonition.
:::

:::warning
This is a warning admonition.
:::

:::danger
This is a danger admonition.
:::
```

#### Tabs

````markdown
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
  <TabItem value="js" label="JavaScript">
    ```js
    console.log('Hello from JavaScript!');
    ```
  </TabItem>
  <TabItem value="py" label="Python">
    ```python
    print('Hello from Python!')
    ```
  </TabItem>
</Tabs>
````

## Blog Posts

### Creating Blog Posts

1. Create a new file in `blog/` with this naming pattern:
   - `YYYY-MM-DD-post-title.md`
   - `YYYY-MM-DD-post-title.mdx`

2. Add frontmatter:

```markdown
---
slug: custom-blog-post-slug
title: Blog Post Title
authors:
  - name: Author Name
    title: Author Title
    url: https://github.com/author
    image_url: https://github.com/author.png
tags: [tag1, tag2, tag3]
---

Blog post content goes here...

<!--truncate-->

Content after this comment appears only on the full post page.
```

### Blog Frontmatter

- `slug`: Custom URL slug
- `title`: Post title
- `authors`: Author information (array)
- `tags`: Post tags (array)
- `date`: Custom publish date
- `hide_reading_time`: Hide reading time estimate

### Author Profiles

Create `blog/authors.yml` to define reusable author profiles:

```yaml
author1:
  name: John Doe
  title: Senior Developer
  url: https://github.com/johndoe
  image_url: https://github.com/johndoe.png

author2:
  name: Jane Smith
  title: Technical Writer
  url: https://twitter.com/janesmith
  image_url: /img/jane.png
```

Then reference in posts:

```markdown
---
authors: [author1, author2]
---
```

## MDX Features

MDX allows you to use React components in your content:

### Importing Components

```markdown
import MyComponent from '@site/src/components/MyComponent';

# Page Title

<MyComponent prop="value" />
```

### Creating Custom Components

1. Create component in `src/components/`:

```jsx title="src/components/Highlight.jsx"
export default function Highlight({children, color}) {
  return (
    <span
      style={{
        backgroundColor: color,
        borderRadius: '2px',
        color: '#fff',
        padding: '0.2rem',
      }}>
      {children}
    </span>
  );
}
```

2. Use in content:

```markdown
import Highlight from '@site/src/components/Highlight';

This is <Highlight color="#25c2a0">highlighted text</Highlight>.
```

## Organizing Content

### Sidebar Structure

Edit `sidebars.ts` to organize documentation:

```typescript
const sidebars = {
  tutorialSidebar: [
    'intro',
    'installation',
    {
      type: 'category',
      label: 'Getting Started',
      items: ['basics', 'advanced'],
      collapsed: false,
    },
    {
      type: 'link',
      label: 'External Link',
      href: 'https://example.com',
    },
  ],
};
```

### Categories and Subcategories

```typescript
{
  type: 'category',
  label: 'API Reference',
  link: {
    type: 'generated-index',
    title: 'API Reference',
    description: 'Complete API documentation',
  },
  items: [
    'api/authentication',
    'api/users',
    {
      type: 'category',
      label: 'Resources',
      items: ['api/posts', 'api/comments'],
    },
  ],
}
```

## Assets and Images

### Adding Images

1. Place images in `static/img/`
2. Reference in content:

```markdown
![Alt text](/img/screenshot.png)

<!-- Or with custom styling -->
<img src="/img/screenshot.png" alt="Alt text" width="500" />
```

### Relative Images

For images specific to a document:

```markdown
![Local image](./assets/local-image.png)
```

## Search

Docusaurus includes built-in search for your content. No additional configuration needed for local search.

For production sites, consider:
- [Algolia DocSearch](https://docsearch.algolia.com/) (free for open source)
- Local search plugins

## Tips for Good Content

1. **Use descriptive headings** - They become navigation anchors
2. **Add code examples** - Include practical examples
3. **Use admonitions** - Highlight important information
4. **Keep it concise** - Break up long content with subheadings
5. **Cross-reference** - Link between related pages
6. **Update regularly** - Keep content current and accurate