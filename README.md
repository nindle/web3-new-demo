# Reown AppKit Example using wagmi (Vite + Vue)

This is a [Vite](https://vitejs.dev) project together with Vue with GitHub Pages auto-deployment.

## Local Development

1. Go to [Reown Cloud](https://cloud.reown.com) and create a new project.
2. Copy your `Project ID`
3. Create `.env` file and paste your `Project ID` as the value for `VITE_PROJECT_ID`
4. Run `pnpm install` to install dependencies
5. Run `pnpm run dev` to start the development server

## Deployment

This project is configured for automatic deployment to GitHub Pages.

### Setup GitHub Pages Deployment

1. **Enable GitHub Pages:**
   - Go to your repository Settings → Pages
   - Select "GitHub Actions" as the source

2. **Add Environment Variables:**
   - Go to Settings → Secrets and variables → Actions
   - Add repository secret: `VITE_PROJECT_ID` with your Reown project ID

3. **Deploy:**
   - Push to `main` branch to trigger automatic deployment
   - Your site will be available at: `https://[username].github.io/[repository-name]/`

### Manual Build

```bash
# Production build
pnpm run build:prod

# Preview production build locally
pnpm run preview
```

## Resources

- [Reown — Docs](https://docs.reown.com)
- [Vite — GitHub](https://github.com/vitejs/vite)
- [Vite — Docs](https://vitejs.dev/guide/)
- [Vue - Docs](https://vuejs.org/guide/introduction)
