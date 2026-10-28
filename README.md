# Mark Mathany: portfolio site

A static website with no build step. It's hosted on Vercel as the project `markmathany`.

## Publishing changes

There's no GitHub repo yet, so changes go live by uploading this folder to Vercel, for example with `npx vercel deploy --prod` run from this folder. If you later connect a GitHub repo to the Vercel project, every push to `main` will go live on its own.

## Files

- `index.html`: the home page
- `help.html`: the free help hour page ("I'm drowning, I can't pay you, please just help me")
- `styles.css`: all styles. The colors are at the top.
- `site.js`: the sliding banner, custom cursor, booking calendar and forms
- `images/`: photos (AVIF), the pineapple drawing (stored as five strips, `pineapple-1.webp` to `pineapple-5.webp`), the logo and a link preview image (`og.jpg`, not used yet)

## Common edits

- **Booking times and days:** change `BOOKING` near the middle of `site.js` (`slots`, `openDays`, `weeksAhead`). To send visitors to a Google Calendar appointment schedule instead, paste its link into `bookingPageUrl`.
- **Forms:** submitting a form opens the visitor's email app with the message filled in. To get messages straight to your inbox instead, create a free form at formspree.io and paste its URL into `data-endpoint` on the form in `index.html` and in `help.html`.
- **Recommendations:** in `index.html`, remove `hidden` from the recommendations section and fill in each quote with the person's words, name, role and organization.
- **Certificates:** in the About section of `index.html`.
