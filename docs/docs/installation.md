---
sidebar_position: 2
---

# Installation

This guide will help you set up the Project Template on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0 or higher ([Download](https://nodejs.org/))
- **Yarn** package manager ([Installation Guide](https://yarnpkg.com/getting-started/install))
- **Git** for version control

## Step-by-Step Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/project-template.git
cd project-template
```

### 2. Navigate to Documentation Directory

```bash
cd docs
```

### 3. Install Dependencies

```bash
yarn install
```

This will install all necessary dependencies including Docusaurus and its plugins.

### 4. Start Development Server

```bash
yarn start
```

This command starts a local development server and opens your browser to `http://localhost:3000`. Most changes are reflected live without having to restart the server.

## Verification

After installation, you should see:

1. A welcome page with the Project Template branding
2. Navigation menu with "Docs" and "Blog" sections
3. Language switcher in the top right corner
4. Sample documentation pages

## Common Issues

### Node Version Error

If you encounter node version issues:

```bash
# Check your Node.js version
node --version

# Update to Node.js 18+ if needed
# Use nvm (recommended)
nvm install 18
nvm use 18
```

### Port Already in Use

If port 3000 is already in use:

```bash
# Use a different port
yarn start --port 3001
```

### Package Installation Fails

If yarn install fails:

```bash
# Clear cache and try again
yarn cache clean
rm -rf node_modules yarn.lock
yarn install
```

## Next Steps

Once installation is complete:

1. Review the [Configuration Guide](/docs/configuration) to customize your site
2. Start [Writing Content](/docs/writing-content) for your project
3. Learn about [Deployment](/docs/deployment) options