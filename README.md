# Eldertide Isles

Mobile-first fantasy forge builder prototype.

Players can craft exportable local practice-token items through two paths:

- **Skill Forge**: advanced customization, forge minigames, skill paths, and 100-node progression.
- **Hephaestus' Bench**: quick crafter-service rolls with visible odds, offerings, and local market listing.

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

## Tester Mode

Tester mode is for QA only. It grants unlimited supplies, tester shell display, and all Hephaestus offerings.

Local tester URL:

```text
http://127.0.0.1:5173/?tester=1
```

Tester build:

```bash
npm run build:tester
```

## GitHub Pages Tester Build

The included workflow at `.github/workflows/deploy-tester.yml` builds the tester version with:

```bash
npm run build:tester
```

Important: private GitHub repositories do not always make GitHub Pages private. Confirm your account or organization Pages visibility settings before sharing a tester URL.

