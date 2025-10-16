---
sidebar_position: 5
---

# Deployment

Learn how to deploy your Docusaurus documentation site to various hosting platforms.

## GitHub Pages

GitHub Pages is the easiest way to deploy your Docusaurus site for open source projects.

### Prerequisites

1. Your project must be hosted on GitHub
2. You need write access to the repository
3. Enable GitHub Pages in your repository settings

### Configuration

1. Update `docusaurus.config.ts` with your repository information:

```typescript
const config: Config = {
  url: 'https://your-username.github.io',
  baseUrl: '/your-repo-name/',
  organizationName: 'your-username',
  projectName: 'your-repo-name',
  deploymentBranch: 'gh-pages',
  // ...
};
```

### Manual Deployment

```bash
# Set your GitHub username
GIT_USER=your-username yarn deploy
```

### Automated Deployment with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: yarn
          cache-dependency-path: docs/yarn.lock
      - name: Install dependencies
        working-directory: docs
        run: yarn install --frozen-lockfile
      - name: Build website
        working-directory: docs
        run: yarn build
      - name: Setup Pages
        uses: actions/configure-pages@v4
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: docs/build
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## Netlify

Netlify offers continuous deployment with a generous free tier.

### Quick Deploy

1. Connect your GitHub repository to Netlify
2. Set build settings:
   - Build command: `cd docs && yarn build`
   - Publish directory: `docs/build`
   - Node version: 18

### Custom Domain

1. Add your custom domain in Netlify settings
2. Update `docusaurus.config.ts`:

```typescript
const config: Config = {
  url: 'https://your-domain.com',
  baseUrl: '/',
  // ...
};
```

## Vercel

Vercel provides excellent performance and DX for static sites.

### Configuration

Create `vercel.json` in your project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "docs/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/docs/$1"
    }
  ]
}
```

Add build script to `docs/package.json`:

```json
{
  "scripts": {
    "vercel-build": "docusaurus build"
  }
}
```

## Docker Deployment

For self-hosted solutions, use Docker:

### Dockerfile

```dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY docs/package*.json docs/yarn.lock ./
RUN yarn install --frozen-lockfile

COPY docs/ ./
RUN yarn build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    include mime.types;
    sendfile on;
    
    server {
        listen 80;
        root /usr/share/nginx/html;
        index index.html;
        
        location / {
            try_files $uri $uri/ /index.html;
        }
        
        # Enable gzip compression
        gzip on;
        gzip_types text/plain text/css application/json application/javascript;
    }
}
```

### Build and Run

```bash
# Build the image
docker build -t my-docs .

# Run the container
docker run -p 8080:80 my-docs
```

## Environment Variables

For different environments, use environment variables:

```bash
# Production
DOCUSAURUS_URL=https://your-site.com yarn build

# Staging
DOCUSAURUS_URL=https://staging.your-site.com yarn build
```

Access in config:

```typescript
const config: Config = {
  url: process.env.DOCUSAURUS_URL || 'http://localhost:3000',
  // ...
};
```

## Performance Optimization

### Build Optimization

- Enable compression
- Optimize images
- Use CDN for static assets
- Enable browser caching

### Monitoring

Consider adding:
- Google Analytics
- Performance monitoring
- Error tracking
- SEO monitoring

## Troubleshooting

### Common Issues

1. **Build fails**: Check for broken links and missing files
2. **404 errors**: Verify baseUrl configuration
3. **Slow builds**: Optimize images and reduce bundle size
4. **Memory issues**: Increase Node.js memory limit

### Debug Commands

```bash
# Check for broken links
yarn build

# Analyze bundle size
yarn build --analyze

# Serve built site locally
yarn serve
```