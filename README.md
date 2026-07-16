# me

A single, quiet homepage for the `krmznkr` identity: a full-stack software
engineer based in Berlin. It renders a monochrome moon as character-art on an
HTML canvas and links out to open-source work.

Live at [`me.krmznkr.com`](https://me.krmznkr.com).

## Design

A quiet monochrome nightscape rendered as **character-art** on an HTML canvas:
a side-lit 3D moon sampled onto a monospace glyph grid, a sparse scatter of
slowly breathing stars, and a whisper of film grain — everything else is pure
black. See [`src/scripts/nocturne.ts`](src/scripts/nocturne.ts).

- **Glyph, not pixel.** The scene is sampled on a Geist Mono character grid;
  each cell's luminance selects a glyph from a density ramp
  (`· : - = + i c o * 0 @`, dark → light) and a matching gray. The bright limb
  lands on `@ 0`, the terminator falls off through `c o i` into faint `- . :`
  dust. It's the same idea as an image → ASCII converter, but grayscale and
  driven by a live moon rather than a photo.
- **The art is a subject, not a texture.** The moon is placed with intent
  (off-centre in landscape, high-centre in portrait) so the type always keeps
  its own dark, high-contrast space. Stars are masked out of the hero's text
  band — no noise behind the words.
- **Round on screen, not in the grid.** The moon's circle math runs in screen
  pixels, so it stays perfectly round despite the tall (~1.3:1) glyph cells.
- **Every aspect ratio.** The canvas is DPR-aware and re-composes on resize;
  the layout is fluid from tall phones to ultrawide displays.
- **Calm by default.** Motion is slow (~34fps, with a whisper of temporal
  shimmer) and respects `prefers-reduced-motion`; the scene pauses when the tab
  is hidden. The greeting fades up on load but is fully present in the HTML
  without JavaScript.

Built with [Astro](https://astro.build), Geist (sans) for the name and
sentence, and Geist Mono for the small labels. Ships almost no JavaScript.

## Develop

```sh
pnpm install
pnpm dev
```

## Build

```sh
pnpm build
```

Production is deployed as the `me` Cloudflare Worker (static assets) at
`https://me.krmznkr.com`. Pushes to `main` deploy automatically via the Deploy
GitHub Actions workflow (wrangler, using the `CLOUDFLARE_API_TOKEN` repository
secret).

## License

MIT
