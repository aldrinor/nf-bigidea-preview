# nf-bigidea-preview / _deploy — AGENTS.md

This is the website build + GitHub Pages preview dir (served at
https://aldrinor.github.io/nf-bigidea-preview/). Codex Gen 2 is invoked here.

## Build Pipeline — Tool Role Allocation (MANDATORY)

**Logged 2026-06-26 at Yin's explicit instruction.** Roles are FIXED, do not mix:

- **Codex Gen 2 (GPT Image 2, via Higgsfield OAuth)** — ONLY tool for generating/editing IMAGES.
- **GLM 5.2** — ONLY tool for UI / CSS / canvas / HTML / JS CODE. Never use it for images.
- **GLM 5V** — visual GATE; iterates with GLM 5.2 until sign-off.
- **Higgsfield Seedance 2.0** — ONLY tool for VIDEO.
- **Claude** — assigns clear tasks, runs the loop, HARVESTS after GLM 5V signs off. No hand-drawn
  graphics in Python/PIL, no hand-coded UI.

**Why:** hand-coding the charge ⊖ symbols in PIL looked flat/pasted and was rejected by GLM 5V + Yin.

**Order (charge graphic):** Codex Gen 2 edits the image (remove symbols, recolor glow) → confirm with
Yin → GLM 5.2 codes the overlay → GLM 5V gates → Claude harvests → Seedance animates.

### Iteration workflow (MANDATORY 4-step sequence)

1. Claude gives ONE clear direction to GLM 5.2 AND GLM 5V (build task + audit criteria).
2. GLM 5.2 writes the code; GLM 5V audits the render; iterate FAST until GLM 5V signs off. Claude does
   NOT hand-code / hand-place anything.
3. Claude visually audits the signed-off result.
4. Only then does Claude show Yin. Never show un-audited / un-signed-off work.
