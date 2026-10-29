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

- **Booking times and days:** change `BOOKING` near the middle of `site.js` (`slots`, `openDays`, `weeksAhead`). Picking a time opens a short form, and sending it emails you the request. To have visitors finish on a Google Calendar appointment schedule after they send it, paste the schedule's link into `bookingPageUrl`.
- **Forms:** the booking, contact, speaking and free help forms all send through `FORM_ENDPOINT` near the top of `site.js`, which is Mark's Formspree form (submissions arrive by email and in the Formspree dashboard). To send them somewhere else, paste another Formspree link there. If it's left empty, sending a form opens the visitor's email app with the message filled in.
- **Recommendations:** in `index.html`, remove `hidden` from the recommendations section and fill in each quote with the person's words, name, role and organization.
- **Certificates:** in the About section of `index.html`.
- **Email address:** set once near the top of `site.js` (`EMAIL`), in two parts so bots that collect addresses from websites don't find it. Visitors see it after clicking "Reveal email".
- **Link preview image:** after replacing `images/og.jpg`, raise the `?v=` number in the `og:image` tag of both pages, so sites that saved the old preview fetch the new one.
