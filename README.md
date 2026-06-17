# BigQuery Release Notes Viewer & Tweet Drafter

A sleek, premium single-page web application built with a **Python Flask backend** and a **plain vanilla HTML, CSS, and JS frontend**. It fetches, parses, and segments the official Google Cloud BigQuery Release Notes, allowing you to browse, search, and instantly draft and post tweets about specific updates on X (Twitter).

## Features

- **Dynamic Feed Parsing & Segmentation**: Parses Google's Atom/XML feed (`https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`) and splits entries into individual, granular updates grouped by date and type (e.g., *Feature*, *Changed*, *Deprecated*, *Bug Fix*).
- **Premium Glassmorphic Design**: Sleek slate-dark theme with radial glows, backdrop-blur borders, and carefully chosen accent badges.
- **Instant Tweet Drafter**: Selecting any update auto-generates a clean tweet template containing the update details, the original source link, and hashtags.
- **Accurate Twitter Character Counter**: Real-time counter featuring X's official URL length policy (where any link is counted as exactly 23 characters). A circular progress ring turns from indigo to amber and red as you approach the 280-character limit.
- **Interactive Composer Panel**: Quickly append suggested hashtags, copy the text to your clipboard, or click "Post Draft" to immediately open the X Web Intent composer.
- **Robust Searching & Filtering**: Search text content or filter by specific update types.
- **One-click Feed Sync**: Clean refresh button with spinning state transitions to pull the latest updates.

## Technical Details

### Backend
- **Framework**: Flask (Python 3)
- **Feed Parsing**: `feedparser` (interprets Atom XML feeds)
- **HTML Segmentation**: `beautifulsoup4` (splits daily grouped updates by `<h3>` tags into granular cards)

### Frontend
- **Structure**: Vanilla HTML5 using Google Fonts (`Inter`, `Outfit`, `JetBrains Mono`) and custom SVG icons.
- **Styling**: Vanilla CSS featuring modern variables, glassmorphism filters, scrollbars, responsive layouts, and animations.
- **Interactivity**: Pure Javascript managing reactive states, search debounce/filters, character count logic, and clipboard interactions.

---

## Running the Application

This repository utilizes **`uv`**, a blazing-fast Python package installer and runner, ensuring you can start the application even without Xcode developer tools installed.

### 1. Ensure `uv` is installed
If you don't have it, run:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 2. Run the server
Run the following command in the project directory to launch the server:
```bash
~/.local/bin/uv run python3 app.py
```

The server will start at **`http://127.0.0.1:5000`**. Open this URL in your browser to view the application.
