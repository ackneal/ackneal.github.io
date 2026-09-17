# ackneal.github.io

## Development

Requires Bun 1.3.13.

```sh
bun install --frozen-lockfile
bun run dev
```

## Deployment

Push to `release` to run tests, type checking, and the production build, then deploy `dist/` to GitHub Pages.

In GitHub **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**. If the `github-pages` environment restricts deployment branches, allow `release`.

Keep `resume.pdf` in the repository root; the build copies it into `dist/`.