# Getting started

## Requirements

Node.js 18 or newer. No other dependencies.

## Install

```bash
# one-off run
npx github:ksanyok/og-debugger example.com

# global CLI
npm install -g github:ksanyok/og-debugger

# as a library in your project
npm install github:ksanyok/og-debugger
```

## First run

```bash
og-debugger example.com
```

For each platform you see the title and description it will show; X also shows the card type. Below is the image that will be used with its format, dimensions, weight and HTTP status. Problems follow: `✖` errors produce a broken or empty preview, `!` warnings a degraded one.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | No errors (warnings allowed unless `--strict`) |
| 1 | Errors found (or warnings with `--strict`) |
| 2 | Bad arguments or the check could not run |

## More examples

**Check a page before announcing it**

```bash
og-debugger https://example.com/blog/launch
```

**List every social tag**

```bash
og-debugger example.com --all
```

**Check a local build (tags only)**

```bash
og-debugger --file dist/blog/launch/index.html
```

## Without installing anything

Use the [online Open Graph Debugger](https://promopilot.link/en/tools/og-debugger.php?utm_source=github&utm_medium=repo&utm_campaign=tools&utm_content=og-debugger).
