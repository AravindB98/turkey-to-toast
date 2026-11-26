// Turkey to Toast deal data.
//
// The tracker runs every year from one month before Thanksgiving through New Year's Day.
// Sale-day dates (Thanksgiving, Black Friday, Cyber Monday, Green Monday...) are worked out
// automatically for each year, so you never edit them. You only add deals.
//
// Each season is keyed by the year its Thanksgiving falls in: TT_SEASONS[2026] runs
// Oct 26, 2026 to Jan 1, 2027. To start a new season, add TT_SEASONS[2027] = [ ... ].
//
// Deal fields:
//   dates     YYYY-MM-DD (US Eastern). Leave start or end as null when the retailer has not published one.
//   category  tech | laptops | gaming | coats | student | storewide | boston | tickets
//   season    any of thanksgiving | cyber | christmas | newyear
//   where     online | boston | both   ("both" deals show up in "Deals near me" at nearby stores)
//   brands    optional list of store brand names to look for nearby; defaults to TT_STORE_BRANDS[store]
//   place     optional fixed location for one-off venues: { name, lat, lng, address }

window.TT_META = {
  lastUpdated: "2026-11-26",
  city: "Boston"
};

// Store names on deals mapped to the brand names stores use on OpenStreetMap,
// which "Deals near me" uses to find physical locations.
window.TT_STORE_BRANDS = {
  "Target": ["Target"],
  "Walmart": ["Walmart"],
  "Best Buy": ["Best Buy"],
  "Nordstrom": ["Nordstrom"],
  "Kohl's": ["Kohl's"],
  "REI": ["REI"],
  "The North Face": ["The North Face"],
  "Columbia": ["Columbia"],
  "T-Mobile": ["T-Mobile"],
  "Amazon, Walmart": ["Walmart"],
  "Multiple retailers": ["Best Buy", "Target", "Walmart"]
};

window.TT_SEASONS = window.TT_SEASONS || {};

window.TT_SEASONS[2026] = [
  // Store-wide sales
  { title: "Amazon Black Friday sale", deal: "Up to 60% off, new daily markdowns", store: "Amazon", category: "storewide", season: ["thanksgiving", "cyber"], where: "online", start: "2026-11-19", end: "2026-11-30", url: "https://www.amazon.com/" },
  { title: "Target Black Friday sale", deal: "Up to 50% off sitewide", store: "Target", category: "storewide", season: ["thanksgiving"], where: "both", start: "2026-11-22", end: "2026-11-29", url: "https://www.target.com/" },
  { title: "Walmart Black Friday Deals", deal: "Up to 40% off", store: "Walmart", category: "storewide", season: ["thanksgiving", "cyber"], where: "both", start: "2026-11-23", end: null, url: "https://www.walmart.com/" },
  { title: "Best Buy Doorbusters", deal: "Same deals online and in store, with Store Pickup", store: "Best Buy", category: "storewide", season: ["thanksgiving", "cyber"], where: "both", start: null, end: null, url: "https://www.bestbuy.com/" },
  { title: "Nordstrom Black Friday sale", deal: "Sale prices plus free shipping and free returns", store: "Nordstrom", category: "storewide", season: ["thanksgiving"], where: "both", start: null, end: null, url: "https://www.nordstrom.com/" },
  { title: "Kohl's extra 20% off", deal: "Extra 20% sitewide with code LOVE2SAVE", store: "Kohl's", category: "storewide", season: ["thanksgiving"], where: "both", start: null, end: "2026-11-21", url: "https://www.kohls.com/" },

  // Tech
  { title: "MacBook Air M5", deal: "$1,049", store: "Best Buy", category: "tech", season: ["thanksgiving"], where: "both", start: null, end: null, student: true, url: "https://www.bestbuy.com/" },
  { title: "Sony WH-1000XM5 headphones", deal: "$169", store: "Best Buy", category: "tech", season: ["thanksgiving"], where: "both", start: null, end: null, student: true, url: "https://www.bestbuy.com/" },
  { title: "Blink Video Doorbell", deal: "$30", store: "Amazon", category: "tech", season: ["thanksgiving", "cyber"], where: "online", start: null, end: "2026-11-30", url: "https://www.amazon.com/" },
  { title: "Echo, Ring, Blink and Fire TV devices", deal: "From $17", store: "Amazon", category: "tech", season: ["thanksgiving", "cyber"], where: "online", start: null, end: "2026-11-30", url: "https://www.amazon.com/" },
  { title: "Oura Ring 5", deal: "$100 off", store: "Oura", category: "tech", season: ["thanksgiving", "cyber"], where: "online", start: null, end: "2026-11-30", url: "https://ouraring.com/" },
  { title: "Sonos speakers", deal: "Up to 25% off sitewide", store: "Sonos", category: "tech", season: ["thanksgiving", "cyber"], where: "online", start: null, end: "2026-11-30", url: "https://www.sonos.com/" },
  { title: "Stanley drinkware", deal: "Up to 50% off sitewide", store: "Stanley", category: "tech", season: ["thanksgiving"], where: "online", start: null, end: null, student: true, url: "https://www.stanley1913.com/" },

  // Laptops
  { title: "Apple MacBook Air (2026)", deal: "$200 off", store: "Multiple retailers", category: "laptops", season: ["thanksgiving", "cyber"], where: "both", start: null, end: null, student: true, url: "https://www.bestbuy.com/" },
  { title: "HP OmniBook 7", deal: "$400 off", store: "HP", category: "laptops", season: ["thanksgiving", "cyber"], where: "online", start: null, end: null, student: true, url: "https://www.hp.com/" },
  { title: "LG gram 15 (Core Ultra 5, 16GB, 512GB)", deal: "$400 off", store: "LG", category: "laptops", season: ["thanksgiving", "cyber"], where: "online", start: null, end: null, student: true, url: "https://www.lg.com/us/" },
  { title: "MSI Cyborg 15 (RTX 5050)", deal: "$950, save $349", store: "Walmart", category: "laptops", season: ["thanksgiving"], where: "online", start: null, end: null, url: "https://www.walmart.com/" },
  { title: "Lenovo LOQ 15 (RTX 5060)", deal: "$1,150, save $370", store: "Best Buy", category: "laptops", season: ["thanksgiving"], where: "both", start: null, end: null, url: "https://www.bestbuy.com/" },
  { title: "Razer Blade 14 (RTX 5070)", deal: "$1,699, was $2,699", store: "Razer", category: "laptops", season: ["thanksgiving", "cyber"], where: "online", start: null, end: null, url: "https://www.tomsguide.com/computing/gaming-laptops/i-test-gaming-laptops-for-a-living-and-these-are-the-best-early-black-friday-rtx-50-deals-i-recommend", sourceLabel: "Tom's Guide" },

  // Gaming
  { title: "PS5 Pro console", deal: "$649, was $749 (lowest ever)", store: "Amazon, Walmart", category: "gaming", season: ["thanksgiving", "cyber"], where: "both", start: null, end: null, student: true, note: "Best way to play GTA 6, which is console only for now.", url: "https://www.techradar.com/gaming/ive-spent-hundreds-of-hours-testing-the-best-ps5-pro-games-and-now-that-the-console-has-dropped-to-a-lowest-ever-price-i-cant-recommend-it-enough-for-whats-to-come-in-2026", sourceLabel: "TechRadar" },
  { title: "PS5 Slim Digital + GTA 6", deal: "Console $600, GTA 6 $80 ($100 Ultimate)", store: "Best Buy", category: "gaming", season: ["thanksgiving", "christmas"], where: "both", start: null, end: null, student: true, note: "Digital plays GTA 6 the same as the disc model.", url: "https://games.gg/news/best-buy-gta-6-console-bundle/", sourceLabel: "games.gg" },
  { title: "GTA 6 console bundles tracker", deal: "PS5 and Xbox bundles checked daily", store: "PC Guide", category: "gaming", season: ["thanksgiving", "cyber"], where: "online", start: null, end: "2026-11-30", url: "https://www.pcguide.com/deals/black-friday/gta-6/", sourceLabel: "PC Guide" },
  { title: "PlayStation Store sale", deal: "Up to 50% off digital games, add-ons and memberships", store: "PlayStation", category: "gaming", season: ["thanksgiving", "cyber"], where: "online", start: null, end: "2026-11-30", student: true, url: "https://store.playstation.com/" },

  // Winter coats
  { title: "The North Face winter jackets", deal: "Up to 40% off Retro Nuptse, Denali Fleece and more", store: "The North Face", category: "coats", season: ["thanksgiving"], where: "both", start: null, end: null, student: true, url: "https://www.thenorthface.com/" },
  { title: "Columbia sale", deal: "Up to 50% off plus free shipping; jackets from $40", store: "Columbia", category: "coats", season: ["thanksgiving"], where: "online", start: null, end: null, student: true, note: "Free Greater Rewards membership needed for some prices.", url: "https://www.columbia.com/" },
  { title: "Columbia Steens Mountain 2.0 fleece", deal: "From $33, was $65", store: "Columbia", category: "coats", season: ["thanksgiving"], where: "online", start: null, end: null, student: true, url: "https://www.columbia.com/" },
  { title: "Columbia on Amazon", deal: "Up to 39% off last year's styles", store: "Amazon", category: "coats", season: ["thanksgiving", "cyber"], where: "online", start: null, end: "2026-11-30", url: "https://www.amazon.com/" },
  { title: "REI sitewide sale", deal: "Up to 25% off; members get 20% off one full-price item", store: "REI", category: "coats", season: ["thanksgiving"], where: "both", start: null, end: "2026-11-23", url: "https://www.rei.com/" },

  // Student and under-30 picks
  { title: "Headspace annual plan", deal: "50% off", store: "Headspace", category: "student", season: ["thanksgiving", "cyber"], where: "online", start: null, end: "2026-12-03", student: true, url: "https://www.headspace.com/" },
  { title: "T-Mobile phone deals", deal: "Up to $1,200 off iPhone Duo, $1,000 off Pixel 11 Pro with a new line", store: "T-Mobile", category: "student", season: ["thanksgiving", "cyber"], where: "both", start: null, end: null, student: true, url: "https://www.t-mobile.com/" },
  { title: "Walmart+ with Sam's Club Plus", deal: "Both memberships for $120/year", store: "Walmart", category: "student", season: ["thanksgiving"], where: "online", start: null, end: null, student: true, url: "https://www.walmart.com/plus" },

  // Boston in-person
  { title: "Museum Store Sunday at the MFA", deal: "20% off socks, toys, mugs and more", store: "Museum of Fine Arts, Boston", category: "boston", season: ["thanksgiving"], where: "boston", start: "2026-11-29", end: "2026-11-29", student: true, url: "https://www.mfa.org/", place: { name: "Museum of Fine Arts, Boston", lat: 42.3394, lng: -71.0940, address: "465 Huntington Ave, Boston, MA" } },
  { title: "Boston Black Friday store tracker", deal: "Live store and product discount monitor", store: "Come To Boston", category: "boston", season: ["thanksgiving"], where: "boston", start: null, end: null, url: "https://www.cometoboston.com/" },
  { title: "Best Buy Store Pickup, Boston area", deal: "Order Doorbusters online, collect in store", store: "Best Buy", category: "boston", season: ["thanksgiving", "cyber"], where: "boston", start: null, end: null, url: "https://www.bestbuy.com/" },

  // Tickets and experiences
  { title: "Fever Boston Black Friday", deal: "Discounts on concerts and experiences", store: "Fever", category: "tickets", season: ["thanksgiving", "cyber"], where: "boston", start: "2026-11-20", end: "2026-11-30", student: true, url: "https://feverup.com/en/boston" },
  { title: "Boston hotel stays", deal: "Up to 40% off select hotels and apartments", store: "Booking.com", category: "tickets", season: ["thanksgiving", "christmas", "newyear"], where: "boston", start: null, end: null, url: "https://www.booking.com/" },

  // Christmas and New Year planning
  { title: "After-Christmas sales guide", deal: "Which stores discount what after Dec 25", store: "CouponCabin", category: "storewide", season: ["christmas", "newyear"], where: "online", start: "2026-12-26", end: "2027-01-01", url: "https://www.couponcabin.com/blog/after-christmas-sales/", sourceLabel: "CouponCabin" },
  { title: "Best days to shop in 2026", deal: "Calendar of the year's biggest sale days", store: "WTOP", category: "storewide", season: ["christmas", "newyear"], where: "online", start: null, end: null, url: "https://wtop.com/news/2026/03/the-best-days-to-shop-in-2026/", sourceLabel: "WTOP" },
  { title: "Retail holiday calendar 2026 to 2028", deal: "Every US sale event date through New Year", store: "Martech Zone", category: "storewide", season: ["christmas", "newyear"], where: "online", start: null, end: null, url: "https://martech.zone/calendar/", sourceLabel: "Martech Zone" }
];
