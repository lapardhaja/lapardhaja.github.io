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

The site is intentionally lightweight:

- Semantic HTML
- Modern CSS
- Dependency-free JavaScript
- Static hosting through GitHub Pages

## Run locally

```sh
cd '/Users/lapardhajaS/Desktop/servet website/lapardhaja.github.io-main'
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Deployment

GitHub Pages deploys tagged releases through the `Deploy tagged version to GitHub Pages` workflow. The workflow checks out and publishes the exact tag that triggered it, such as `v1.0.0`.

To publish a release, create and push a semantic version tag:

```sh
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

To publish an existing version again, run the workflow from the Actions tab and enter its tag. In repository Settings → Pages, set the publishing source to **GitHub Actions**. The workflow includes `CNAME` and the site assets in its deployment artifact.
