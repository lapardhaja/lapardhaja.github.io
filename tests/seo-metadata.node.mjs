import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const root = new URL('../', import.meta.url)
const html = await readFile(new URL('index.html', root), 'utf8')
const sitemap = await readFile(new URL('sitemap.xml', root), 'utf8')
const metaContent = name => html.match(new RegExp(`<meta[^>]+name="${name}"[^>]+content="([^"]+)"`, 'i'))?.[1]

test('publishes concise, indexable portfolio metadata', () => {
  assert.match(html, /<title>Servet Lapardhaja, Ph\.D\., P\.E\. \| AI Engineer at U\.S\. Treasury<\/title>/)
  assert.equal(metaContent('description'), 'AI Engineer at the U.S. Department of the Treasury, UC Berkeley Ph.D., licensed Professional Engineer (P.E.) in New Jersey, and transportation researcher.')
  assert.equal(metaContent('robots'), 'index, follow, max-image-preview:large')
  assert.equal(metaContent('referrer'), 'strict-origin-when-cross-origin')
  assert.match(html, /<link rel="canonical" href="https:\/\/lapardhaja\.com\/">/)
  assert.match(sitemap, /<loc>https:\/\/lapardhaja\.com\/<\/loc>/)
  assert.match(sitemap, /<lastmod>2026-09-03<\/lastmod>/)
  assert.match(html, /<meta property="og:image" content="https:\/\/lapardhaja\.com\/images\/og-portrait\.jpg">/)
  assert.match(html, /<meta property="og:image:width" content="1200">/)
  assert.match(html, /<meta property="og:image:height" content="1200">/)
  assert.match(html, /<meta property="og:image:alt" content="Portrait of Servet Lapardhaja, Ph\.D\., P\.E\.">/)
  assert.match(html, /<meta property="og:title" content="Servet Lapardhaja, Ph\.D\., P\.E\. \| AI Engineer at the U\.S\. Treasury">/)
  assert.match(html, /<meta name="twitter:image" content="https:\/\/lapardhaja\.com\/images\/og-portrait\.jpg">/)
  assert.match(html, /<meta name="twitter:image:alt" content="Portrait of Servet Lapardhaja, Ph\.D\., P\.E\.">/)
  assert.equal((html.match(/<link rel="me"/g) ?? []).length, 2)
})

test('uses profile structured data and the official New Jersey credential', () => {
  const jsonLd = html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/)?.[1]
  assert.ok(jsonLd, 'Expected a JSON-LD script')
  const person = JSON.parse(jsonLd)
  assert.equal(person['@type'], 'Person')
  assert.equal(person.jobTitle, 'AI Engineer')
  assert.equal(person.worksFor.name, 'U.S. Department of the Treasury')
  assert.equal(person.hasCredential.identifier, '24GE06379100')
  assert.equal(person.hasCredential.credentialCategory, 'Professional Engineer')
  assert.equal(person.hasCredential.url, undefined)
  assert.equal(person.image.url, 'https://lapardhaja.com/images/og-portrait.jpg')
  assert.equal(person.image.width, 1200)
  assert.equal(person.image.height, 1200)
  assert.match(html, /"@type":"ProfilePage"/)
  assert.match(html, /"dateModified":"2026-09-03"/)
  assert.match(html, /"primaryImageOfPage":\{"@type":"ImageObject","url":"https:\/\/lapardhaja\.com\/images\/og-portrait\.jpg"/)
})

test('provides the requested long-scroll destinations and a one-line desktop headline', () => {
  const navigation = html.match(/<nav id="site-nav"[\s\S]*?<\/nav>/)?.[0] ?? ''
  const destinations = [...navigation.matchAll(/href="#([^"]+)"/g)].map(([, destination]) => destination)
  assert.deepEqual(destinations, ['about', 'experience', 'education', 'licenses', 'projects', 'skills', 'publications', 'recognitions', 'contact'])
  for (const destination of ['top', ...destinations]) assert.match(html, new RegExp(`<section id="${destination}"`))
  assert.match(html, /<h1 id="home-title">Servet Lapardhaja, Ph\.D\., P\.E\.<\/h1>/)
  assert.match(html, /<h2 id="about-title">About<\/h2>/)
  assert.match(html, /<h2 id="about-title">About<\/h2><\/div>\s*<p class="lead">I’m an AI Engineer at the U\.S\. Department of the Treasury and a licensed Professional Engineer \(P\.E\.\) in New Jersey\.<\/p>/)
  assert.doesNotMatch(html, /about-statement|about-connector/)
  for (const section of ['experience', 'education', 'licenses', 'projects', 'skills', 'publications', 'recognitions', 'contact']) {
    assert.match(html, new RegExp(`<h2 id="${section}-title">`))
  }
  assert.doesNotMatch(html, /(?:0[1-9]|10) \/(?:\s|<)/)
  assert.doesNotMatch(html, /Choose a role to see the focus, tools, and contribution behind it\./)
  assert.match(html, /class="employer-copy"><span>Currently at<\/span><strong>U\.S\. Department of the Treasury<\/strong><small>AI Engineer<\/small>/)
  assert.equal((html.match(/Taught graduate and undergraduate courses such as Intelligent Transportation Systems, Highway Traffic Operations, Transportation Systems Engineering, and Transportation Facilities\./g) ?? []).length, 1)
  const contact = html.match(/<section id="contact"[\s\S]*?<\/section>/)?.[0] ?? ''
  assert.match(contact, /Professional inquiries/)
  assert.match(contact, /href="mailto:servetlap29@gmail\.com"/)
  assert.doesNotMatch(contact, /Professional profile ↗/)
  assert.doesNotMatch(contact, /Code and projects ↗/)
  assert.match(contact, />LinkedIn<\/span>/)
  assert.match(contact, />GitHub<\/span>/)
  assert.equal((contact.match(/class="contact-link-heading"/g) ?? []).length, 2)
  assert.equal((contact.match(/aria-hidden="true"/g) ?? []).length >= 2, true)
  assert.match(html, /<footer class="site-footer"><div class="site-width">© 2026 Servet Lapardhaja<\/div><\/footer>/)
  const footer = html.match(/<footer class="site-footer"[\s\S]*?<\/footer>/)?.[0] ?? ''
  assert.doesNotMatch(footer, /New York City|Eastern Time|Back to top/)
})

test('uses institution logos, natural positioning, degree details, and linked credentials', () => {
  for (const logo of ['treasury-seal.png', 'hntb-logo.jpg', 'fehr-peers-logo.jpg', 'berkeley-logo.jpg', 'cern-logo.jpg', 'georgia-tech-logo.svg', 'ntua-logo.jpg']) {
    assert.match(html, new RegExp(`images/${logo.replace('.', '\\.')}`))
  }
  assert.match(html, /AI Engineer <span aria-hidden="true">·<\/span> Licensed Professional Civil Engineer/)
  assert.match(html, /I earned both a Ph\.D\. and an M\.S\. in Civil and Environmental Engineering from UC Berkeley\./)
  assert.match(html, /<section id="licenses"/)
  assert.match(html, /Licensed Professional Civil Engineer/)
  assert.match(html, /License number<\/dt><dd>24GE06379100<\/dd>/)
  assert.match(html, /GPA<\/dt><dd>3\.96 \/ 4\.00<\/dd>/)
  assert.match(html, /GPA<\/dt><dd>9\.70 \/ 10\.00<\/dd>/)
  assert.match(html, /<a class="detail-link" href="https:\/\/escholarship\.org\/uc\/item\/36d9r9cw"/)
  assert.doesNotMatch(html, /View degree details/)
  assert.doesNotMatch(html, /card-arrow/)
  const licenses = html.match(/<section id="licenses"[\s\S]*?<\/section>/)?.[0] ?? ''
  for (const credentialUrl of [
    'https://www.credly.com/badges/a15977da-79b2-4a82-9e19-69c09dbab9f6/public_url',
    'https://www.coursera.org/account/accomplishments/specialization/certificate/45Y8SQ6S2AE6',
    'https://account.ncees.org/rn/2076739-1553832-6fdd2c0'
  ]) assert.ok(licenses.includes(`href="${credentialUrl}"`), `Expected credential link: ${credentialUrl}`)
  assert.doesNotMatch(licenses, /newjersey\.mylicense\.com/)
  assert.doesNotMatch(html, /UC Berkeley-trained/)
  assert.doesNotMatch(html, /Public-service engineer/)
  assert.doesNotMatch(html, /My practice|Research deeply|Every system should make/)
  const about = html.match(/<section id="about"[\s\S]*?<\/section>/)?.[0] ?? ''
  for (const detail of ['financial management', 'avoidable costs', 'legacy systems', 'service for taxpayers', 'transportation engineering and research', 'Ph.D. and an M.S. in Civil and Environmental Engineering from UC Berkeley', 'National Technical University of Athens', 'M.S. in Analytics at Georgia Tech']) {
    assert.ok(about.includes(detail), `Expected About detail: ${detail}`)
  }
})

test('keeps every role concise by default with optional supporting detail', () => {
  const experience = html.match(/<section id="experience"[\s\S]*?<\/section>/)?.[0] ?? ''
  assert.equal((experience.match(/class="role-more"/g) ?? []).length, 6)
  assert.match(experience, /Led traffic modeling and engineering-automation work/)
  assert.match(experience, /dynamic traffic assignment and automated OD-matrix estimation/)
  assert.match(experience, /Build responsive, accessible data experiences with React, Next\.js, and TypeScript/)
  assert.match(experience, /Lead development and coordinate delivery across product, data, and engineering workstreams/)
  for (const detail of ['PostgreSQL', 'Playwright', '95%\+', 'three intersections near MetLife Stadium', 'Antioch, Pleasanton, and Moraga', '80% increase in network-wide vehicle hours traveled', '±0\.04 pixels']) {
    assert.match(experience, new RegExp(detail))
  }
  assert.doesNotMatch(experience, /<details class="role-more" open/)
})

test('groups the complete skills profile and preserves all publication categories with full citations', () => {
  const skills = html.match(/<section id="skills"[\s\S]*?<\/section>/)?.[0] ?? ''
  for (const cluster of ['Software', 'Analytics', 'Transportation', 'Spatial', 'Delivery']) {
    assert.ok(skills.includes(cluster), `Expected skills cluster: ${cluster}`)
  }
  for (const skill of ['Next.js', 'PostgreSQL', 'VISSIM', 'Aimsun', 'ArcGIS', 'Photogrammetry', 'Playwright']) {
    assert.ok(skills.includes(skill), `Expected skill: ${skill}`)
  }
  assert.match(skills, /class="skills-grid"/)
  assert.doesNotMatch(skills, /skills-map-core|Integrated practice|Lead<br>and deliver/)
  for (const category of ['software', 'analytics', 'transportation', 'spatial', 'delivery']) {
    assert.match(skills, new RegExp(`id="skill-${category}"`))
  }
  assert.doesNotMatch(skills, /class="skills-nav"/)

  const publications = html.match(/<section id="publications"[\s\S]*?<\/section>/)?.[0] ?? ''
  for (const category of ['Journal articles', 'Theses', 'Conference papers', 'Book chapter', 'Research report', 'Datasets']) {
    assert.ok(publications.includes(category), `Expected publication category: ${category}`)
  }
  for (const count of ['06', '02', '08', '01']) assert.ok(publications.includes(`>${count}</small>`), `Expected publication count: ${count}`)
  assert.equal((publications.match(/class="publication-card"/g) ?? []).length, 20)
  assert.match(publications, /<strong>Lapardhaja, S\.<\/strong>/)
  for (const title of ['ACC, queue storage, and worrisome news for cities', 'Bus Operations of Three San Francisco Bay Area Transit Agencies', 'MicroSimACC-ICE']) {
    assert.ok(publications.includes(title), `Expected publication: ${title}`)
  }
})

test('lists repeat recognitions as individual award periods', () => {
  const recognitions = html.match(/<section id="recognitions"[\s\S]*?<\/section>/)?.[0] ?? ''
  assert.match(recognitions, /Thomaidio Award/)
  for (const period of ['2014—2015', '2015—2016', '2016—2017', '2018—2019']) assert.match(recognitions, new RegExp(`<time>${period}<\\/time>`))
  assert.match(recognitions, /Papakyriakopoulos Award/)
  assert.match(recognitions, /<time>2014—2015<\/time><time>2015—2016<\/time>/)
  assert.doesNotMatch(recognitions, /2014—2019<\/span><h3>Thomaidio Award/)
  assert.doesNotMatch(recognitions, /2014—2016<\/span><h3>Papakyriakopoulos Award/)
})

test('defaults Education to the Ph.D. and keeps project cards concise', () => {
  assert.match(html, /<button[^>]*aria-selected="true"[^>]*id="education-tab-phd"/)
  assert.match(html, /<button[^>]*aria-selected="false"[^>]*id="education-tab-georgia"/)
  assert.match(html, /<article class="education-detail" id="education-phd"[^>]*><div>/)
  assert.match(html, /<article class="education-detail" id="education-georgia"[^>]* hidden>/)
  const projects = html.match(/<section id="projects"[\s\S]*?<\/section>/)?.[0] ?? ''
  assert.equal((projects.match(/class="project-more"/g) ?? []).length, 0)
  assert.equal((projects.match(/>Live<\/a>/g) ?? []).length, 5)
  assert.equal((projects.match(/>Code<\/a>/g) ?? []).length, 5)
  assert.doesNotMatch(projects, /Open product|View code/)
  for (const detail of ['Supabase Auth', 'Tesseract OCR', 'D3\.js', 'Maine Turnpike Lane Closures', 'PDF &amp; Excel export', 'Mortgage Calculator']) {
    assert.match(projects, new RegExp(detail))
  }
})
