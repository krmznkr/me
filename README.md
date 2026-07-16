# me

A single, quiet homepage for the `krmznkr` identity: a full-stack software
engineer based in Berlin. It renders a monochrome, ordered-dithered pixel-art
fog field on an HTML canvas and links out to open-source work.

Live at [`me.krmznkr.com`](https://me.krmznkr.com).

## Design

A quiet monochrome nightscape rendered as chunky pixel art on an HTML canvas:
one side-lit, ordered-dithered (8×8 Bayer) moon with a soft halo, a sparse
scatter of slowly breathing stars, and a whisper of film grain — everything
else is pure black. See [`src/scripts/nocturne.ts`](src/scripts/nocturne.ts).

- **The art is a subject, not a texture.** The moon is placed with intent
  (off-centre in landscape, high-centre in portrait) so the type always keeps
  its own dark, high-contrast space. No noise behind the words.
- **Every aspect ratio.** The canvas is DPR-aware and re-composes on resize;
  the layout is fluid from tall phones to ultrawide displays.
- **Calm by default.** Motion is slow and respects `prefers-reduced-motion`;
  the scene pauses when the tab is hidden. The greeting fades up on load but is
  fully present in the HTML without JavaScript.

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
