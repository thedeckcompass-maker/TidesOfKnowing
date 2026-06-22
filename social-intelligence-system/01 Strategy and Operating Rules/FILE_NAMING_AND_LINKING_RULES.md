# Tides of Knowing: File Naming and Linking Rules

This document establishes the standardized file naming conventions and linking rules for the Tides of Knowing Social Intelligence System. Adherence to these guidelines is crucial for maintaining traceability, enabling reliable click-through navigation, and ensuring the system remains easy to use and manage.

## Core Principle

Every major item within the system must have a predictable ID and a consistent file path to facilitate quick retrieval and interlinking.

## ID Formats

To ensure unique identification and easy referencing, the following ID formats must be used:

*   **Website content inventory item:** `TOK-0001`, `TOK-0002`, `TOK-0003` (sequential numbering)
*   **Source card:** `SC-TOK-0001` (prefix `SC-` for Source Card)
*   **Angle bank:** `AB-TOK-0001` (prefix `AB-` for Angle Bank)
*   **Social asset:** `SA-TOK-0001-YYYY-MM-DD-PLATFORM` (prefix `SA-` for Social Asset, includes Inventory ID, Date, and Platform)
*   **Image brief:** `IB-TOK-0001-YYYY-MM-DD-PLATFORM` (prefix `IB-` for Image Brief, includes Inventory ID, Date, and Platform)

## File Naming Patterns

File names must be descriptive, consistent, and adhere to the following patterns:

*   **Source card:** `03 Source Card Library/SC-TOK-0001-source-title.md`
*   **Angle bank:** `04 Angle Bank Library/AB-TOK-0001-source-title.md`
*   **Social asset:** `05 Social Asset Production/SA-TOK-0001-YYYY-MM-DD-platform-source-title.md`
*   **Image brief:** `06 Image Briefs for ChatGPT/IB-TOK-0001-YYYY-MM-DD-platform-source-title.md`

### Canonical Platform Filename Slugs

When a platform name is used in a filename or ID, use the following canonical slugs:

*   Substack = `substack`
*   Reddit = `reddit`
*   X / Twitter = `x-twitter`
*   Instagram = `instagram`
*   Facebook = `facebook`
*   Pinterest = `pinterest`

### File Naming Rules

*   Use canonical lowercase platform names in filenames (e.g., `instagram`, `x-twitter`).
*   Use short, readable slugs derived from the source title.
*   **Source-title slugs should usually be no more than 8 to 12 words.** If a title is long, shorten the slug while preserving recognisable meaning.
*   Do not use punctuation in filenames except hyphens (`-`) and the file extension (`.md`).
*   Keep filenames practical and not excessively long.

## Linking and Traceability Rules

*   **Relative Linking:** All internal system links should use relative Markdown links wherever possible, so files remain clickable and portable within the Manus/Drive folder structure.
*   Every social asset must link back to its corresponding source card, angle bank, original source URL, and image brief (if one exists).
*   Every image brief must link back to its related social asset and original source URL.
*   The visual calendar must link to the full social asset file first, then provide access to supporting files (source card, angle bank, image brief).
*   The social rotation ledger serves as the primary audit trail for all generated and published social assets.
*   The visual calendar is designed as the primary working interface for day-to-day operations, facilitating quick access to content.
*   **Link Maintenance:** If a file path changes, update all linked references in the inventory, ledger, calendar requirements, social asset file, image brief file, source card, and angle bank where applicable.
