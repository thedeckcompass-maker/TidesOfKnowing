# Tides of Knowing: Visual Calendar Requirements

This document defines the functional and display requirements for the Visual Calendar within the Tides of Knowing Social Intelligence System. The calendar is intended to provide a clear, operational overview of scheduled social assets.

## Calendar Display Items

The visual calendar should display the following key information for each scheduled social asset:

*   **Scheduled date:** The planned publication date of the asset.
*   **Platform:** The target social media platform(s).
*   **Source title:** The title of the original content from which the asset was derived.
*   **Content type:** The type of content (e.g., Article, Field Note).
*   **Primary objective:** The main strategic objective the asset serves.
*   **Asset status:** The current status of the social asset (e.g., Drafted, Ready to Schedule, Posted).
*   **Image needed:** Yes / No indicator for whether an image is required for the asset.
*   **Social asset file:** A link or reference to the complete social asset file.
*   **Image brief file:** A link or reference to the associated image brief file, if applicable.
*   **Source URL:** The URL of the original content.
*   **Notes:** Any additional relevant notes or context.

## Calendar Rule

> The visual calendar should be a simple operational view, not a complex app. It should help Leigh see what is coming, what needs an image, what is ready to schedule, and what has been posted.

**Important:** Do not build the HTML calendar yet unless explicitly instructed later. This document serves as a specification for its future development.

## Usability and Click-Through Requirements

To ensure the visual calendar serves as a highly functional and intuitive working interface for Leigh, it must meet the following usability and click-through requirements:

1.  The visual calendar must be easy to scan at a glance, providing immediate clarity on content status and upcoming activities.
2.  Each scheduled asset displayed on the calendar should be clickable or clearly linked, allowing direct access to its full social asset file.
3.  Each scheduled asset should also provide direct links back to its associated Source Card, Angle Bank, original Source URL, and the Image Brief file if one exists. This ensures all supporting documentation is readily accessible.
4.  The calendar should facilitate efficient content discovery by allowing Leigh to find content using the following criteria:
    *   Date
    *   Platform
    *   Content type
    *   Objective
    *   Status
    *   Image needed
    *   Source page
5.  The system should support simple filtering or grouping functionalities where technically feasible and practical, without adding unnecessary complexity.
6.  The calendar must clearly and visually indicate the status of each asset:
    *   What is drafted
    *   What needs an image
    *   What is ready to schedule
    *   What has already been posted
    *   What needs revision
7.  The calendar must remain practical and lightweight in its implementation, avoiding over-engineering that could hinder its primary operational purpose.
8.  The overarching goal is fast retrieval: Leigh should be able to click through from the calendar directly to the content she wants to review or schedule, eliminating the need to manually search through folders.

## Note on Calendar Functionality

The visual calendar is the primary working interface for day-to-day use. The underlying folders, ledgers, source cards, and angle banks exist to support the calendar, not to make Leigh manually search for content.

## Required Link Fields

Each calendar entry should include links or clear file references to:

*   Full social asset file
*   Source card file
*   Angle bank file
*   Image brief file, if relevant
*   Original source URL
*   Ledger entry or ledger reference

## Rule for Calendar Links

> If a calendar item cannot link to the full content asset, it is not ready for operational use.
