# Open Graph Debugger

`og-debugger` requests a page with the Facebook crawler's user agent, reads every `og:`, `twitter:` and `article:` tag and works out what Facebook, LinkedIn and X will actually show — including the fallbacks each platform uses when a tag is missing. Then it downloads the share image and checks what breaks previews most often: a relative or broken URL, a format platforms do not accept, an image smaller than 200×200 or not 1.91:1, and files over the 5 MB / 8 MB limits.

- **[Getting started](Getting-Started)** — install, first run, reading the output
- **[FAQ](FAQ)** — common questions
- **[Troubleshooting](Troubleshooting)** — errors and how to fix them

Prefer a browser? The same check runs online at **[PromoPilot](https://promopilot.link/en/tools/og-debugger.php?utm_source=github&utm_medium=repo&utm_campaign=tools&utm_content=og-debugger)** — free, no sign-up.
