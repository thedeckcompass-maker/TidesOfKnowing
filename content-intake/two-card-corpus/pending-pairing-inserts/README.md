# Pending pairing inserts (temporary bulk import)

Drop **one manually written pairing per `.md` file** here. Cursor imports into the canonical master only — it does not generate or rewrite meanings.

**Master corpus:** `../major-arcana-upright-ordered-pairs-master.md`

## File format

- Filename is arbitrary (e.g. `wheel-empress.md`).
- File must start with an H2 pairing heading:

```markdown
## Wheel of Fortune + The Empress
```

Also accepted: `+`, `–`, `—`, `-` between card names.

- Body: full ten-part pairing (Dynamic Recap through The Questions).
- Use `###` section headings if you like; import strips markdown heading markers only (wording unchanged).
- Numbered questions in The Questions are converted to plain lines (numbers removed).

## Import command

```bash
node scripts/import-pending-pairing-inserts.mjs
```

Then:

```bash
node scripts/audit-two-card-corpus.mjs
```

## Rules

| Do | Do not |
|----|--------|
| Paste Leigh’s exact prose | Generate, polish, or expand meanings |
| One pairing per file | Import multiple pairings in one file |
| Valid ordered Major Arcana pair (462 set, no self-pairs) | Import reversed or minor-arcana pairings |

Skipped automatically:

- Invalid or unrecognised H2 heading
- Pairing already **complete** in the master (chunk + template)
- Empty or duplicate pending files for the same pair

After a successful import, you may delete or archive the pending file.
