# Wine Tasting Card

A mobile-first web app for a wine tasting night.

## What it does

- One card per wine
- 1–5 wine-glass rating
- Who brought it?
- What goes with it?
- Multi-select wine descriptors
- Notes
- Saves locally on the phone
- Optional central saving to a Google Sheet

## Free hosting

### Option A — GitHub Pages

1. Create a free GitHub account if needed.
2. Create a new repository, e.g. `wine-tasting-card`.
3. Upload:
   - `index.html`
   - `style.css`
   - `app.js`
4. Go to **Settings → Pages**.
5. Select **Deploy from a branch**, branch `main`, folder `/ (root)`.
6. GitHub will provide a public HTTPS URL.
7. Open that URL on your phone and optionally add it to the home screen.

## Central saving to a Google Sheet

This is optional, but recommended if several guests will use the app.

### 1. Create the sheet

Create a blank Google Sheet and name the first sheet:

`Responses`

Put these headings in row 1:

`Timestamp | ID | Rating | Who brought it | Goes with | Descriptors | Notes | Created at`

### 2. Add the Apps Script

In the sheet, open **Extensions → Apps Script**.

Delete the example code and paste the contents of:

`google-apps-script.gs`

Save the project.

### 3. Deploy it

In Apps Script:

**Deploy → New deployment → Web app**

Use:

- Execute as: **Me**
- Who has access: **Anyone**

Deploy and copy the **Web app URL**.

### 4. Connect the website

Open `app.js` and find:

`const GOOGLE_SCRIPT_URL = "";`

Paste the Web app URL between the quotes.

For example:

`const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/....../exec";`

Then upload the updated `app.js` to GitHub.

Now every submitted wine card will be added as a new row in your Google Sheet.

### Security note

This setup is intentionally simple for a private wine tasting. The URL is public, so anyone who has the app URL could technically submit a card. Do not put sensitive information in the form.

## Changing the descriptor list

At the top of `app.js`, edit:

`const DESCRIPTORS = [...]`

You can replace the supplied descriptors with your own tasting vocabulary.

## Future upgrades

The app can easily be extended with:

- Wine name / bottle photo
- Red / white / rosé / sparkling category
- Automatic wine-card numbering
- QR code for the tasting
- Shared live results
- Average rating per wine
- A final leaderboard/results screen
- Export to CSV
