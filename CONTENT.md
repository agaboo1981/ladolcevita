# Content: what is real, what is invented

La Dolce Vita is a **fictional** trattoria in a **real** city. The site is a portfolio
demo, and it tries to be honest about which is which.

## The real thing

Lucca is a real city in Tuscany, and every photograph of it on this site is a real
photograph of Lucca, used under an open licence (see credits below). Every claim the
site makes about the *city* is true:

- The medieval walls run for about four kilometres and you can walk the whole circuit.
- Tortelli lucchesi, farro, and buccellato are real Lucchese foods.
- The Guinigi tower really does have holm oaks growing on top of it.
- Piazza dell'Anfiteatro really is built on the footprint of a Roman arena.
- Via Fillungo really is the main street of the walled centre.
- The hills you can see from the tower really are the Colline Lucchesi, a wine area.

## The invented thing

Everything about the restaurant itself is made up, to the extent that a demo needs
something concrete to show:

- The name "La Dolce Vita", the address (Via Fillungo 42, 55100 Lucca), the telephone
  number (+39 0583 123 456), and the email (`ciao@ladolcevita.example`, on the reserved
  `.example` domain, which cannot receive mail).
- The opening year (1985), the seat count (44), the distance from the wall (160 m),
  and the three dining zones.
- The whole menu and its prices, and the wine pairing notes. There are no real
  producers named anywhere.
- The opening hours, the "last table at 21:30", the corkage charge.
- Every sentence of copy written in the restaurant's voice.

There is no invented press, no invented reviews, no awards, and no testimonials. An
earlier draft of this project had them; they were removed.

## How the sample content is labelled

So a visitor is never misled:

- **Every page** carries a footer note: the restaurant is fictional and the menu,
  prices, hours and availability are sample content.
- The **menu** repeats it in the colophon under the prices.
- The **reservations** form says the times are sample availability.
- **Checkout** says it is a demo build and no card is charged.
- The contact details use obviously-fake, clearly-reserved values (a `.example` email
  domain, a telephone number with sequential digits).

## Photographs

Two kinds of picture are used, and the gallery says so in as many words.

### Real photographs of Lucca

Seven photographs of the city, downloaded from Wikimedia Commons and re-encoded into
`images/build/`. Their provenance is recorded in `images/lucca/CREDITS.json` and they
are credited in the footer of every page.

| id | subject | author | licence |
|----|---------|--------|---------|
| `lucca-walls` | the walls of Lucca | AndreCollodi | CC BY-SA 4.0 |
| `lucca-walls-dusk` | the walls at dusk (hero) | Pepeina8 | CC BY-SA 4.0 |
| `lucca-rooftops` | Lucca panorama | Pietro Colnago | CC BY-SA 4.0 |
| `lucca-street` | Via Fillungo | Palickap | CC BY-SA 4.0 |
| `lucca-tower` | Torre Guinigi from the campanile | Ingo Mehling | CC BY-SA 4.0 |
| `lucca-anfiteatro` | Piazza dell'Anfiteatro | qwesy qwesy | CC BY 3.0 |
| `lucca-night` | the walls at night | Marcolione | CC BY-SA 4.0 |

Re-share of these files must keep the same licence and the same attribution. The
re-encoded WebP and JPEG files in `images/build/` are the same pictures, only resized.

### Generated kitchen photographs

The pictures of the room, the plates and the pass are generated images made for this
demo. They stand in for photography a real restaurant would commission. They are
labelled on the gallery page as our own, and they are never used to claim a specific
dish, because a generated plate and a named dish would not match. On the order page
that is why the dishes are listed as text only.

## Law and manners

- No real restaurant, chef, or producer is impersonated.
- No third-party trademarks or logos are used.
- The Lucca photographs are used under their licences, with attribution.
- Prices and hours are illustrative and are labelled as such.
