# Mark Mathany: portfolio site

A static website with no build step. It's hosted on Vercel as the project `markmathany` and lives at https://www.markmathany.com (markmathany.com redirects there).

## Publishing changes

The Vercel project is connected to this GitHub repo, so every push to `main` goes live on its own. There's nothing to build: Vercel serves the files as they are.

## Files

- `index.html`: the home page
- `help.html`: the free help hour page ("I'm drowning, I can't pay you, please just help me")
- `styles.css`: all styles. The colors are at the top.
- `site.js`: the sliding banner, custom cursor, booking calendar, forms and the "Reveal email" buttons
- `images/`: photos, the pineapple drawing, the logo and the link preview image (`og.jpg`, used when the site is shared in a message or post)

## Common edits

- **Booking times and days:** change `BOOKING` near the middle of `site.js` (`slots`, `openDays`, `weeksAhead`). To send visitors to a Google Calendar appointment schedule instead, paste its link into `bookingPageUrl`.
- **Forms:** submitting a form opens the visitor's email app with the message filled in. To get messages straight to your inbox instead, create a free form at formspree.io and paste its URL into `data-endpoint` on the form in `index.html` and in `help.html`.
- **Recommendations:** in `index.html`, remove `hidden` from the recommendations section and fill in each quote with the person's words, name, role and organization.
- **Certificates:** in the About section of `index.html`.
- **Email address:** set once near the top of `site.js` (`EMAIL`), in two parts so bots that collect addresses from websites don't find it. Visitors see it after clicking "Reveal email".
- **Link preview image:** after replacing `images/og.jpg`, raise the `?v=` number in the `og:image` tag of both pages, so sites that saved the old preview fetch the new one.
