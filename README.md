# Turkey to Toast

**A live holiday deals tracker, from the Thanksgiving turkey to the New Year's toast.**

Turkey to Toast collects the season's best deals in one place: online sales from Amazon, Walmart, Best Buy and Target, in-person deals in Boston, tickets and experiences, and picks for students. Every card links straight to its source.

**Live site:** https://aravindb98.github.io/turkey-to-toast/

## What it does

- **Runs every year on its own schedule:** the tracker opens one month before Thanksgiving and stays live through New Year's Day, then shows a countdown to the next opening. For 2026 that's Oct 26, 2026 to Jan 1, 2027; for 2027 it's Oct 25, 2027 to Jan 1, 2028. Every sale date is calculated for each year, so nothing needs re-dating.
- **Deals near me:** tap *Use my location* (or type a city or ZIP) to see nearby stores with in-person deals running, sorted by distance, with directions. Store locations come live from OpenStreetMap, so it works anywhere in the US, not just Boston. Your location stays in your browser; only rough coordinates are sent to OpenStreetMap to look up stores.
- **Covers the whole season:** Thanksgiving, Black Friday, Small Business Saturday, Cyber Monday, Giving Tuesday, Green Monday, Super Saturday, Christmas, after-Christmas sales and New Year's Day.
- **Live countdown** to the next sale event, plus a sticky calendar strip that marks what's next.
- **Live status badges:** each deal shows *Live*, *Ends in 2 days*, *Starts tomorrow* or *Ended*, worked out from its dates in your browser. Badges change on their own as days pass, with no rebuild needed.
- **Filters:** category (store-wide, tech, laptops, gaming, winter coats, student and under-30, Boston in-person, tickets), online or Boston, season, student picks only, and hide ended.
- **Search** across titles, stores and notes.
- **Sort** by ending soonest, store or category.
- Works on phones, follows your system's dark mode, and runs as plain HTML, CSS and JavaScript with no build step.

## Categories

| Category | Examples |
| --- | --- |
| Store-wide | Amazon up to 60% off, Target up to 50% off, Walmart up to 40% off |
| Tech | Sony WH-1000XM5 at $169, Oura Ring 5 $100 off |
| Laptops | LG gram 15 $400 off, Lenovo LOQ 15 (RTX 5060) at $1,150 |
| Gaming | PS5 Pro at $649, GTA 6 console bundles, PlayStation Store up to 50% off |
| Winter coats | The North Face up to 40% off, Columbia up to 50% off |
| Student and under-30 | Headspace 50% off, Walmart+ with Sam's Club Plus for $120/year |
| Boston in-person | Museum Store Sunday at the MFA (Nov 29) |
| Tickets and experiences | Fever Boston discounts, Boston hotel stays |

## Project structure

```
turkey-to-toast/
├── index.html        # Page layout
├── assets/
│   ├── deals.js      # Deals per season + store-brand map for "Deals near me" (edit this)
│   ├── app.js        # Season schedule, filters, countdown, status badges, nearby stores
│   └── styles.css    # Styling, light and dark mode
├── .github/workflows/
│   └── season-reminder.yml  # Opens an issue every Oct 1 to add the new season's deals
└── README.md
```

## Starting a new season each year

Each season is keyed by the year its Thanksgiving falls in. On October 1 a GitHub Action opens an issue reminding you to add the new season. To start it, add a block to `assets/deals.js`:

```js
window.TT_SEASONS[2027] = [
  // deals for Oct 25, 2027 to Jan 1, 2028
];
```

If the season opens before you add deals, the site says deals are on the way. Last season stays browsable at `?season=2026`.

## Add or update a deal

Copy an entry inside the current season's list, edit it and commit:

```js
{
  title: "Sony WH-1000XM5 headphones",
  deal: "$169",
  store: "Best Buy",
  category: "tech",                 // storewide | tech | laptops | gaming | coats | student | boston | tickets
  season: ["thanksgiving", "cyber"],// thanksgiving | cyber | christmas | newyear
  where: "both",                    // online | boston | both
  start: null,                      // "YYYY-MM-DD" or null
  end: "2026-11-30",                // "YYYY-MM-DD" or null
  student: true,                    // shows the Student pick tag
  url: "https://www.bestbuy.com/",  // where the card's button goes
  sourceLabel: "Best Buy",          // optional; defaults to the link's domain
  note: "Optional one-line tip",
  brands: ["Best Buy"],             // optional; store brands to find nearby (defaults to TT_STORE_BRANDS[store])
  place: { name, lat, lng, address } // optional; fixed venue such as a museum
}
```

Then change `lastUpdated` at the top of the file. GitHub Pages republishes the site within a minute or two.

Deals with `where: "both"` or `"boston"` show up in *Deals near me* whenever their store is in `TT_STORE_BRANDS`. Add new store names there.

## Preview any date

Append `?date=YYYY-MM-DD` to the URL to see the site as it will look on that day, for example `?date=2027-03-10` for the off-season page.

## Run it locally

No install needed. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy on GitHub Pages

1. Push to `main`.
2. In the repo, go to **Settings → Pages**.
3. Set **Source** to *Deploy from a branch*, then choose `main` and `/ (root)`.

## Credits

Store locations © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), via the Overpass API. Place search by Nominatim.

## Disclaimer

Prices and dates come from retailers and deal sites and change quickly, so check the store before you buy. This project isn't affiliated with any retailer and uses no affiliate links.

## License

MIT, © 2026 Aravind Balaji
