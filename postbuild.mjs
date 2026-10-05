import { cp, copyFile, mkdir } from 'node:fs/promises'

const output = new URL('./dist/', import.meta.url)
await mkdir(output, { recursive: true })

for (const file of ['404.html', 'CNAME', 'robots.txt', 'sitemap.xml']) {
  await copyFile(new URL(`./${file}`, import.meta.url), new URL(file, output))
}

await cp(new URL('./images/', import.meta.url), new URL('./images/', output), { recursive: true })
