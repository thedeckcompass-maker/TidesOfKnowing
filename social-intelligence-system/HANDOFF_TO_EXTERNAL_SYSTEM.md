# HANDOFF_TO_EXTERNAL_SYSTEM.md: Guide to Using the Tides of Knowing Social Intelligence System

This document provides a practical guide for using the exported Tides of Knowing Social Intelligence System outside of Manus. It outlines recommended tools, workflows, and responsibilities to ensure a smooth transition and efficient operation.

## 1. Recommended Canonical Home

The entire `TOK_SOCIAL_INTELLIGENCE_EXPORT_2026-06-05` folder should be stored in a **local folder or a private GitHub repository**. This will serve as the single source of truth for all system files.

## 2. Recommended Intelligence Layer: ChatGPT Project

For tasks requiring advanced reasoning, content generation, and adherence to the editorial voice, a **ChatGPT Project** is recommended. The `TOK_SOCIAL_SYSTEM_MASTER_CONTEXT.md` file should be uploaded to this project to provide the necessary context and rules.

## 3. Recommended Build/Tooling Layer: Codex

For automated scripting, bulk generation, and dynamic data processing, **Codex** (or similar programmatic tools) is recommended. This will be crucial for scaling operations beyond the initial manual tests.

## 4. Recommended Future Dashboard: Local Markdown/HTML Dashboard

While the `TOK_VISUAL_SOCIAL_CALENDAR.md` provides a static view, a dynamic, interactive dashboard (potentially built with HTML/CSS and JavaScript, parsing the Markdown files) will offer the best user experience for daily operations.

## 5. How to Use the Folder Structure

The system is organized into 13 numbered folders (00-12). Each folder contains specific types of documents and assets. Navigation should primarily occur through the `TOK_CONTENT_INVENTORY.md` and `TOK_SOCIAL_ROTATION_LEDGER.md`, which contain relative links to all associated files.

## 6. How to Add a New Source Card

1.  **Identify a new URL:** From the `TOK_CONTENT_INVENTORY.md` with `Status = Unprocessed`.
2.  **Scan the URL:** Use a web scraping tool or manual review to extract key information.
3.  **Create a new Source Card file:** Copy `03 Source Card Library/SOURCE_CARD_TEMPLATE.md`.
4.  **Populate the Source Card:** Fill in all fields based on the scanned content and the `TOK_EDITORIAL_VOICE_AND_PLATFORM_ADAPTATION_GUIDE.md`.
5.  **Name the file:** Use the format `SC-TOK-####-source-title-slug.md` (e.g., `SC-TOK-0035-new-article-title.md`).
6.  **Update `TOK_CONTENT_INVENTORY.md`:** Change `Status` to `Source Card Created`, set `Source Card Created = Yes`, and add a relative link to the new Source Card file.

## 7. How to Add an Angle Bank

1.  **Identify a Source Card:** From the `TOK_CONTENT_INVENTORY.md` with `Status = Source Card Created`.
2.  **Create a new Angle Bank file:** Copy `04 Angle Bank Library/ANGLE_BANK_TEMPLATE.md`.
3.  **Populate the Angle Bank:** Generate 5 angles for each section, drawing from the Source Card and adhering to the `TOK_EDITORIAL_VOICE_AND_PLATFORM_ADAPTATION_GUIDE.md`.
4.  **Name the file:** Use the format `AB-TOK-####-source-title-slug.md` (e.g., `AB-TOK-0035-new-article-title.md`).
5.  **Update `TOK_CONTENT_INVENTORY.md`:** Change `Status` to `Angle Bank Created`, set `Angle Bank Created = Yes`, and add a relative link to the new Angle Bank file.

## 8. How to Add a Social Asset

1.  **Identify an Angle Bank:** From the `TOK_CONTENT_INVENTORY.md` with `Status = Angle Bank Created`.
2.  **Select an Angle and Platform:** Choose an angle from the Angle Bank and a suitable platform based on `PLATFORM_AND_OBJECTIVE_SELECTION_RULES.md`.
3.  **Create a new Social Asset file:** Copy `05 Social Asset Production/SOCIAL_ASSET_TEMPLATE.md`.
4.  **Populate the Social Asset:** Draft the publishable post, ensuring it adheres to the `TOK_EDITORIAL_VOICE_AND_PLATFORM_ADAPTATION_GUIDE.md` and the `Quality Rules for Finished Social Assets`.
5.  **Name the file:** Use the format `SA-TOK-####-YYYY-MM-DD-platform-slug.md` (e.g., `SA-TOK-0035-2026-06-10-x-twitter.md`).
6.  **Update `TOK_CONTENT_INVENTORY.md`:** Update `Latest Social Asset File` with a relative link.
7.  **Add to `TOK_SOCIAL_ROTATION_LEDGER.md`:** Create a new row, linking to the Social Asset, Source Card, Angle Bank, and Image Brief (if created).

## 9. How to Update the Visual Calendar

1.  **Open `07 Visual Calendar/TOK_VISUAL_SOCIAL_CALENDAR.md`**.
2.  **Add new entries:** For each scheduled social asset, add a new row to the calendar table, including the `Scheduled Date`, `Platform`, `Content Type`, `Objective`, `Status`, and clickable links to the `Social Asset File`, `Source Card File`, `Angle Bank File`, `Image Brief File`, `Source URL`, and `Ledger Entry`.

## 10. How to Update the Social Rotation Ledger

1.  **Open `08 Social Rotation Ledger/TOK_SOCIAL_ROTATION_LEDGER.md`**.
2.  **Add new entries:** For each new social asset, add a new row with all relevant details, including links to associated files.
3.  **Update existing entries:** Modify `Status`, `Posted Date`, `Performance Signal`, and `Next Eligible Date` as assets are scheduled, posted, and analyzed.

## 11. What Must Remain Controlled by Leigh

*   **Strategic Direction:** Overall content strategy, new offer development, and high-level objectives.
*   **Final Approval:** Of all social assets and image briefs before scheduling.
*   **Credit Authorization:** For any tasks incurring additional costs.
*   **Sensitive Content:** Review and approval of any content touching on nuanced or potentially controversial topics.

## 12. What a VA Could Safely Maintain

*   **Manual Data Entry:** Populating the `TOK_CONTENT_INVENTORY.md` with new URLs (after initial processing by Codex).
*   **Scheduling Social Assets:** Using external scheduling tools.
*   **Basic Content Review:** Proofreading and checking for adherence to simple rules.
*   **Image Sourcing/Curation:** Finding suitable stock images based on image briefs (if not AI-generated).

## 13. What Should Never Be Automated Without Review

*   **Content that deviates from the `TOK_EDITORIAL_VOICE_AND_PLATFORM_ADAPTATION_GUIDE.md`**.
*   **Any content for Reddit:** Due to its sensitive nature and requirement for careful, approved participation.
*   **Content for new or untested platforms.**
*   **Content directly promoting new offers or price changes.**
*   **Any content generated by AI without human oversight.**
