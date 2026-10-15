# ProofAtlas — /brag-slim production storyboard

**Workflow credit:** [latent-spaces/brag](https://github.com/latent-spaces/brag/tree/main/skills/brag-slim); following the no-Hyperframes, zero-cost, self-rendered `/brag-slim` method.

**Purpose:** A 20-second, 16:9, 24-fps product launch demo showing the actual **public Cloudflare guest UI**, with true interface details and no credential exposure. No implied authenticated transaction is filmed.

**Audience:** Researchers, analysts and teams reviewing evidence-heavy decisions.

**Creative direction:** Serious, modern software-engineering reel; restrained typography, #F2BB78 accent, dark neutral #101B23 base, original synthesized ambient music. Distinct identity for this product; no generic SaaS copy.

## Five beats (4 seconds each)

| Timeline | Scene | Honest visual source |
|---|---|---|
| 00–04 | **Hook:** EVERY CLAIM NEEDS A SOURCE. | Title, real guest UI below |
| 04–08 | **Reveal:** The reading room is the source. | Live desktop guest screenshot |
| 08–12 | **Engineering:** Evidence must remain intact. | Live desktop image + supported assertions |
| 12–16 | **Responsive:** Read the actual evidence. | Live mobile guest screenshot |
| 16–20 | **Call to action:** Proof belongs next to the claim. | Real project destination and no-paid-service scope |

## Reproduce

Prerequisites: Python 3, Pillow, FFmpeg, and two  browser-acceptance guest screenshots from the [live deploy workflow](../.github/workflows/deploy.yml). Screenshots must be named `ProofAtlas-desktop-guest.png` and `ProofAtlas-mobile-guest.png`. No authenticated or private frame is permitted in the output.

```bash
python3 -m pip install pillow
python3 scripts/build-brag.py --config docs/brag.json --screenshots docs/demo-source --output docs/media
```

The GitHub [showcase workflow](../.github/workflows/demo-video.yml) obtains the latest successful public browser-acceptance screenshots, composes the film deterministically, checks the MP4 and commits `docs/media/` back to the same repository. Music is synthesized offline using FFmpeg; nothing calls a paid provider.

The music is not claimed to be from BRAG's bundled sample assets. No Hyperframes or subscription is required. All illustrated numerical records appearing in the live guest UI are labeled demo data.

## Privacy and publishing

- Never pass `APP_ADMIN_TOKEN` or any secret into the renderer.
- Only use browser acceptance `*-guest.png` screenshots.
- Keep original screenshot provenance (GitHub Actions artifact) rather than synthesizing product screenshots.
- No customer identities, testimonials, guaranteed uptime, real-world benchmarks or unmeasured performance claims.
