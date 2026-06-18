# Asma ul-Husna — The 99 Names of Allah

A calm, interactive web page to discover, remember and understand the 99 Names
of Allah. Each day one name is highlighted; all 99 are browsable; you can mark
names as "learned" and (coming next) test yourself with a flash quiz.

Built as a plain static website — no build tools, no frameworks. Just open it.

---

## The files (what each one does)

| File          | What it is |
|---------------|------------|
| `index.html`  | The page itself — the structure/skeleton. |
| `styles.css`  | All the visual styling (colours, fonts, layout, animations). |
| `data.js`     | **The content** — all 99 names, meanings, and Quran references. Edit here. |
| `app.js`      | The logic — daily name, the grid, the popup, progress tracking. |
| `README.md`   | This guide. |

> The whole site is just these files in a folder. That's it.

---

## How to change a name's meaning or reference

1. Open `data.js`.
2. Find the name (they're numbered 1–99).
3. Edit the `english`, `urdu`, or `quranRef` / `quranUrl` text between the quotes.
4. Save. Refresh the page. Done.

If a name should show a Quran reference it doesn't have yet, add:
`quranRef: "2:255", quranUrl: "https://quran.com/2/255"` to that entry.
Leave both out and no reference is shown — that's intentional for names
where the verse isn't well-attested.

---

## How to preview it on your own computer

You can simply double-click `index.html` to open it in a browser. (Fonts and
everything work offline-ish via Google Fonts.)

---

## How it's published (live on the internet)

This site is hosted for free on **Netlify**. To update what's live after editing:

- **If deployed by drag-and-drop:** go to your Netlify site → "Deploys" tab →
  drag the project folder onto the upload area again. New version goes live in seconds.
- **If deployed via GitHub:** save your change, then push it to GitHub. Netlify
  rebuilds and republishes automatically.

The live address is a subdomain of your own domain (set up via a DNS record at
your domain registrar, GoDaddy).

---

## A note on the sacred content

Names, transliterations, and English + Urdu meanings follow the canonical
Asma ul-Husna list. Quran references are shown only where well-attested and each
links to **quran.com** so anyone can verify the source. Please review and expand
the data over time — `data.js` is the single place to do that.
