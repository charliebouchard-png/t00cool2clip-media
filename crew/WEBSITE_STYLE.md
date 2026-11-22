# CGA website style (every client website from now on)

Charlie's standing art direction for every website Forge drafts. The goal is a cinematic, editorial, single-page site that looks like an Awwwards winner, not a SaaS template. The reference build is `crew/style-reference/aether.html`. Read it before building and reuse its structure, not its content.

## Fill in this brief for each client first (from the research dossier)

- **Brand name**
- **Industry / product**
- **Core vibe:** 3–5 words that fit the actual business (a dog groomer is not "brutalist luxury" – pick something true to them).
- **3D centrepiece object:** one procedurally built object tied to what they do. Examples:
  - grooming → shears, or a brush and comb
  - florist → a faceted glass vase with stems
  - barber → a straight razor or barber pole
  - café → a cup and saucer, or a portafilter
  - plumber → chrome pipework and a valve wheel
  - dance school → a spinning mirror ball
  - cleaner → a squeegee with water droplets
- **Palette:** strictly 3 colours: background, text, accent. Take the accent from their existing brand colours if they have one.
- **Sections:** usually Hero, Story / Philosophy, Services & Prices (as a spec sheet), Interactive Showcase (gallery, reviews or a before/after), Contact / Book.

## Hard rules

1. **No generic AI look.**
   - `border-radius: 0` everywhere. The only exception is a pill-shaped CTA button.
   - No drop shadows, no neon glow, no purple/blue gradients.
   - No 3-column icon feature grids.
2. **Two fonts only (Google Fonts).**
   - **Display font:** one heavy condensed grotesque (Anton, Oswald or Syne). Uppercase, `clamp(52px, 10vw, 170px)`, line-height 0.85–0.92.
   - **Mono font:** JetBrains Mono or Space Mono for every label, the nav, index numbers (`01 / 04`), coordinates and specs. 11px, uppercase, letter-spacing 0.12em.
3. **Grid and framing.**
   - Separate sections and data blocks with `1px solid rgba(255,255,255,0.14)` hairlines. On light backgrounds, use the dark equivalent.
   - Make sections full height (`100vh` / `100svh`) with asymmetric, magazine-style layouts.
4. **3D and motion.**
   - A fixed full-screen Three.js `<canvas>`, loaded from jsDelivr: `three@0.147.0/build/three.min.js` plus `examples/js/environments/RoomEnvironment.js`.
   - The centrepiece is procedurally built with `MeshStandardMaterial` / `MeshPhysicalMaterial`, with PBR metal or glass, rim lights and RoomEnvironment reflections. Don't use transmission (it renders white on many phones); use low-opacity clearcoat glass instead.
   - GSAP 3.12.5 and ScrollTrigger from cdnjs. Scrub the object's position, rotation and camera between sections.
   - Add a subtle mouse-parallax tilt and masked line-by-line headline reveals. The `.line > span` must be `display: block`, or the letters get clipped.
5. **Polish.**
   - A fixed minimal header with the wordmark, a live section indicator (`02 / 05 — SERVICES`) and one sharp CTA.
   - A custom cursor and magnetic hovers, on mouse/trackpad devices only.
   - Respect `prefers-reduced-motion`.
   - Must run at 60fps. Cap the pixel ratio at 2, and shrink the 3D object on phones so it never covers the text.

## Still required on every client site (these win over style)

- Their real phone number as tap-to-call, their real email, their address with a map link, opening hours, and prices if they publish them.
- Real reviews only, credited. No invented facts, years or awards.
- Fast and readable on a phone. Text must stay readable over the 3D scene.
- Proper `<title>`, meta description, LocalBusiness JSON-LD and Open Graph tags.
- No fake contact forms. Booking and contact go by call, email, or their real booking link.
- No AI branding and no "built by" credit unless the client asked for one. Never put Charlie's full name in any link or text.
- Real copy only, never Lorem Ipsum. Write punchy editorial copy from the research.
