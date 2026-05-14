# TOK Brand System — non-negotiables

1. **White reads. Blue contains.**
2. **Article content must never be placed on dark blue.**
3. **No custom colours outside** `src/styles/tokens.css`. Legacy `tokens-compat.css` has been removed; do not reintroduce old variable names.
4. **No inline colour styling** in components or pages; use classes and tokens.
5. **All new UI must use canonical TOK tokens** (`--tok-*` and `--font-heading` / `--font-body` / `--font-accent` only).
6. **Typography must use** `--font-heading`, `--font-body`, and `--font-accent` as appropriate.
7. **Surface A** is for editorial reading and learning.
8. **Surface B** is for tools, interactive systems, symbolic work, CTAs, and footer containment.
9. **Do not invent new visual styles** without first updating `docs/brand/tok-brand-system.md` and, when needed, the HTML brand guide.
10. **If a requested change conflicts with these rules,** preserve the brand system and report the conflict to the stakeholder.
11. **Do not introduce or reintroduce** legacy compatibility variables such as: `--gold`, `--paper`, `--ink`, `--shore`, `--mountain-water`, `--sky`, `--navy`, `--lavender`, `--font-display`, `--font-nav`. Use canonical `--tok-*` and `--font-*` tokens only. Prefer layout tokens from `tokens.css` (`--radius-*`, `--z-*`, `--bp-*`, `--tok-header-height`, typography scale) instead of duplicating magic numbers.
