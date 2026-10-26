# FAQ

## I fixed the tags but Facebook still shows the old preview

Platforms cache previews. After fixing, ask Facebook to re-scrape the URL in its Sharing Debugger; LinkedIn has a Post Inspector. X refreshes its cache within about a week.

## What is the best og:image size?

1200×630 pixels (1.91:1), PNG or JPEG, under 5 MB. It looks sharp on high-density screens and is not cropped on any major platform.

## Do I need Twitter Card tags if I have Open Graph?

X falls back to Open Graph for title, description and image, but you need `twitter:card` = `summary_large_image` to get the large image layout.

## Can og:image be an SVG?

No. Facebook, LinkedIn and X do not render SVG previews. Use PNG or JPEG.

## Why does the tool use the Facebook user agent?

Some sites (and bot protection) respond differently to crawlers. Testing as the crawler shows what it will really get. Use `--ua` to test another one.
