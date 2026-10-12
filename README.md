# brianpaiement.com — Brian Paiement

A simple, elegant portfolio page: name, portrait, and logo-only links to
X, Instagram, Threads, and GitHub (all `@brianpaiement`), over an animated
drifting night sky.

## Add your photo

Save your portrait as **`photo.jpg`** in this folder (next to `index.html`).
A vertical/portrait photo works best — it's displayed at a 4:5 ratio and
cropped from the top, so leave a little headroom. Until then, an elegant
"BP" placeholder is shown automatically.

If you'd rather use a `.png`, change `src="photo.jpg"` in `index.html`.

## Run it locally

```bash
cd brianpaiement-com
python3 -m http.server 8173
```

Then open http://localhost:8173 in your browser.

## Files

- `index.html` — page structure and social links
- `style.css` — layout and styling
- `script.js` — drifting stars, twinkle, shooting stars, pointer parallax
  (pauses in background tabs; renders a still sky with `prefers-reduced-motion`)

## Deploy

Upload `index.html`, `style.css`, `script.js`, and `photo.jpg` to any static
host (Cloudflare Pages, Netlify, GitHub Pages, etc.) — no build step needed.
