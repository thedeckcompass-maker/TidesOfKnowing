# Retired build profiles

These are byte-preserved historical configuration snapshots, not selectable build or deployment profiles. `MANIFEST.json` records their original names and SHA-256 hashes. The `.retired.txt` suffix is deliberate; do not pass these files to Astro or Wrangler.

- Community/local profiles supported earlier Community reviews and retained older runtime/Hyperdrive settings.
- Stage 7 and visual-preview profiles supported earlier isolated builds. Despite their names, their target was the consolidated Worker; their names did not isolate Production.
- The consolidated review pair was a local-validation proposal, not a reconciled release definition.
- The root/downloaded stage copies targeted the former community-stage Pages project and were identical.

Their active replacements are the canonical production runner and configuration documented in `docs/DCS-PRODUCTION-BUILD-RELEASE.md`. No historical profile is an authorised deployment instruction. No hosted Worker, Pages project, route or Access application is removed by this archive.
