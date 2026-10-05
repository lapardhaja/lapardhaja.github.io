# Servet Lapardhaja — Portfolio

Personal portfolio for Dr. Servet Lapardhaja, an AI and transportation engineer working at the intersection of public-interest technology, mobility systems, data, and research.

## What the site covers

- AI engineering at the U.S. Department of the Treasury
- Transportation engineering and automation work
- UC Berkeley research on Adaptive Cruise Control and urban congestion
- Peer-reviewed publications, conference work, theses, and open datasets
- Selected software projects
- Education, credentials, technical capabilities, and recognition

## Stack

The page content remains semantic HTML and is delivered as a static site. Vite bundles the site JavaScript and the React-powered portfolio map; the tagged GitHub Pages workflow builds those files before publishing them.

## Run locally

```sh
npm ci
npm run dev
```

Then open `http://127.0.0.1:5173`. To create the same static output used by Pages, run `npm run build`; it writes the deployable site to `dist/`.

## Deployment

GitHub Pages deploys tagged releases through the `Deploy tagged version to GitHub Pages` workflow. The workflow checks out the exact tag that triggered it, builds it when it has a build script, and publishes the static output. Older tags without a build script use the original file-copy deployment path.

To publish a release, create and push a semantic version tag:

```sh
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

To publish an existing version again, run the workflow from the Actions tab and enter its tag. In repository Settings → Pages, set the publishing source to **GitHub Actions**. The workflow includes `CNAME` and the site assets in its deployment artifact.
