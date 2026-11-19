# Lexicon work remains parked

`wrangler.lexicon-preview.json` remains the dedicated Lexicon build input used by the preserved build tooling and safeguard tests. It is not part of the Production release pipeline. Do not run import, SQL, provisioning or deployment operations without separate approval and fresh identity/protection checks.

Private Access/recovery evidence remains at `config/lexicon-preview-access.json`, excluded from Git. The former account/project-specific import configuration has been retired to `.build-temp/dcs-configuration-closeout-20261119/lexicon-preview-import.retired.json.txt`, also excluded from Git and production output. It must not be reused as a new import instruction.

The generic importer and its fixtures remain preserved. Diagnostic tests now use offline synthetic identities, rather than loading the retired real-account instruction. A future Lexicon resumption needs a newly reviewed configuration and explicit approval. This retirement changes no Preview account, grant, content, hosted Access policy or Worker.
