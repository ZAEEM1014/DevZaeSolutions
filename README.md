# DevZaeSolution — Website

A multi-page marketing site for DevZaeSolution (Flutter & web development studio):
separate pages instead of one long scroll, a horizontal hero, a live 3D
mesh background that reacts as you scroll, card-based sections, a full
Contact page with validation, and a professional multi-column footer.

## Pages

| Page             | File            | Purpose                                   |
|------------------|-----------------|--------------------------------------------|
| Home             | `index.html`    | Hero + condensed previews of every section |
| Services         | `services.html` | Full services grid, engagement models, FAQ |
| Work             | `work.html`     | Filterable/searchable project portfolio    |
| Process          | `process.html`  | Step-by-step process + timeline estimates  |
| About            | `about.html`    | Founder bio, expertise, studio milestones  |
| Contact          | `contact.html`  | Validated form that emails your inbox      |

## Folder structure

```
devzaeem/
├── index.html / services.html / work.html / process.html / about.html / contact.html
├── README.md
├── css/
│   ├── variables.css        Design tokens: colors, fonts, spacing, radii
│   ├── base.css              Reset + global element styles + #bg-canvas
│   ├── components.css        Buttons, tags, cards, page-hero, toast, forms shell
│   ├── animations.css        Scroll-reveal + shared motion keyframes
│   └── pages/
│       ├── navbar.css        Header + mobile drawer (active-link state)
│       ├── hero.css          Home hero — horizontal split + floating visual
│       ├── home.css          Home page section-specific layout
│       ├── services.css      Services grid, engagement cards, FAQ accordion
│       ├── work.css          Portfolio grid, filters, search
│       ├── process.css       Timeline + estimate table
│       ├── about.css         Founder layout, skill bars, milestones
│       ├── contact.css       Contact form + info panel
│       └── footer.css        Multi-column footer
├── js/
│   ├── components/
│   │   ├── navbar.js         Scroll state, mobile menu, scroll-to-top
│   │   └── scene3d.js        Global 3D background (mesh + floating panels)
│   └── utils/
│       ├── scrollReveal.js   IntersectionObserver reveal, skill bars, timeline highlight
│       ├── counters.js       Animated stat counters (Home)
│       ├── contactForm.js    Contact form validation + submission
│       ├── workFilter.js     Work page category filter + search
│       └── faq.js            Services page FAQ accordion
└── assets/
    ├── icons/favicon.svg
    └── images/zaeem-placeholder.svg   Swap for a real founder photo
```

## The 3D background

`js/components/scene3d.js` mounts a single Three.js scene onto a
`position: fixed` canvas (`#bg-canvas`) that sits behind every page. It draws:

- **A mesh** — a field of nodes connected by lines when close enough,
  drifting gently, like a small live network.
- **Floating panels** — translucent rounded "app screen" shapes, the same
  motif used in the hero, drifting through the same space.

As you scroll, the camera moves and the whole scene rotates a little based
on scroll position (not just mouse position) — so scrolling reads as moving
through a 3D space rather than a static hero decoration. It respects
`prefers-reduced-motion` and quietly does nothing if Three.js fails to load
(e.g. offline), so the site never breaks without it.

## Making the contact form actually send email

This is a static site — there's no server of its own to send mail from.
`contact.html`'s form is fully validated client-side, then submits to
**FormSubmit** (a free form-to-email backend) and delivers directly to
`mza@devzaesolutions.com`, with a `mailto:` fallback if that request ever
fails, so a submission is never silently lost.

**One-time setup (about 2 minutes):**

1. Open `js/utils/contactForm.js` and confirm the endpoint is set to
   `https://formsubmit.co/ajax/mza@devzaesolutions.com`.
2. If you want a different inbox later, replace the address in that endpoint
   and the `FALLBACK_EMAIL` constant.
3. The form submits directly and shows the success screen on completion.

If the backend request ever fails, the form falls back to the visitor's own
email client with a pre-filled message addressed to mza@devzaesolutions.com,
so nobody hits a dead end.

**Alternative (if hosting on Vercel):** since the original project already
targets Vercel, you can swap Formspree for a small serverless function at
`/api/contact.js` using a provider like Resend or Nodemailer, and point the
form's `fetch()` at `/api/contact` instead. That needs an API key stored as
an environment variable in your Vercel project — ask if you'd like that
version scaffolded.

## How to use

1. Open `index.html` directly in a browser, or serve the folder with any
   static server (e.g. `npx serve .`).
2. Replace `assets/images/zaeem-placeholder.svg` with a real photo, then
   update the `src` in `about.html`.
3. Verify the FormSubmit endpoint and test the contact form once live.
4. Three.js is loaded from a CDN — no build step or `npm install` required.

## Notes

- Colors, type, and spacing live in `css/variables.css` — change the
  palette or fonts there and it cascades through every page.
- Every page shares the same navbar/footer markup with an `active` class
  on the current page's nav link.
- Respects `prefers-reduced-motion` for reveals, skill bars and the 3D scene.
