# Troubleshooting

## "og:image could not be downloaded"

The image URL is wrong, blocked for crawlers (CDN bot protection, hotlink protection) or requires cookies. Platforms will fail in the same way.

## Image dimensions shown as ?

The file is in a format the header reader does not know (AVIF, SVG) or the response is not an image. Use PNG or JPEG.

## Tags are found in the browser but not by the tool

They are injected by JavaScript. Social crawlers do not run JavaScript; render the tags on the server.

## Still stuck?

Open an [issue](https://github.com/ksanyok/og-debugger/issues/new/choose) with the command, the output (`--json` if possible) and your Node.js version — or compare with the [online version](https://promopilot.link/en/tools/og-debugger.php?utm_source=github&utm_medium=repo&utm_campaign=tools&utm_content=og-debugger).
