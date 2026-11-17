// Sample data for the demo. Prices (BDT) and climate values are approximate
// sample figures - admins can edit them from the Admin Dashboard.
const PROFILES = {
  coastal:   { temp: [21,23,26,28,29,28,28,28,28,28,25,22], rain: [5,10,60,120,300,800,900,700,400,230,70,10] },
  hill:      { temp: [20,23,26,28,28,28,28,28,28,27,24,21], rain: [10,25,50,130,300,550,600,450,300,200,60,10] },
  northeast: { temp: [19,22,25,26,27,28,28,28,28,26,23,20], rain: [10,30,120,330,480,780,740,560,430,250,40,10] },
  southwest: { temp: [19,22,27,30,30,30,29,29,29,28,24,20], rain: [10,25,50,90,180,320,350,330,310,180,40,10] },
  northwest: { temp: [18,21,27,31,31,30,29,29,29,27,23,19], rain: [10,15,25,45,130,260,300,260,230,90,10,5] },
};
const HUMIDITY = [72, 70, 70, 73, 78, 85, 87, 87, 85, 80, 74, 72];

const pic = (key, n) => `https://picsum.photos/seed/${key}${n}/900/600`;

// attraction = [name, description, isOutdoor(1/0), estCost]
const destinations = [
  {
    short: "Cox's Bazar", climate: 'coastal',
    row: {
      name: "Cox's Bazar", division: 'Chattogram', category: 'beach', best_season: 'winter', budget_level: 'medium',
      description: "Home of the world's longest natural sea beach, with golden sand, surf, seafood and nearby hills.",
      image_url: pic('coxsbazar', ''), gallery_urls: [pic('coxsbazar', 1), pic('coxsbazar', 2)].join(','),
      latitude: 21.4272, longitude: 92.0058,
      travel_tips: 'Visit between November and February. Avoid swimming during red-flag warnings and cyclone season (Apr-May, Oct-Nov).',
      food_per_day: 800, local_transport_per_day: 500, activities_per_day: 600,
    },
    transport: { bus: 1600, train: 1500, air: 7500 }, hotels: [1200, 3500, 9000],
    attractions: [
      ['Cox\'s Bazar Sea Beach', 'Sunset walks and beach activities.', 1, 0],
      ['Inani Beach', 'Quieter beach with coral stones.', 1, 100],
      ['Himchari National Park', 'Waterfall and hill viewpoint.', 1, 100],
      ['Burmese Market', 'Handicrafts and local shopping.', 0, 0],
      ['Aggmeda Khyang Monastery', 'Buddhist monastery with a small museum.', 0, 0],
    ],
  },
  {
    short: "Saint Martin's", climate: 'coastal',
    row: {
      name: "Saint Martin's Island", division: 'Chattogram', category: 'beach', best_season: 'winter', budget_level: 'high',
      description: "Bangladesh's only coral island, famous for clear water, coconut palms and peaceful beaches.",
      image_url: pic('stmartin', ''), gallery_urls: [pic('stmartin', 1), pic('stmartin', 2)].join(','),
      latitude: 20.6275, longitude: 92.3226,
      travel_tips: 'Ships run only in the dry season (roughly Nov-Mar). Book tickets early and carry cash.',
      food_per_day: 700, local_transport_per_day: 200, activities_per_day: 400,
    },
    transport: { bus: 1800, launch: 2300 }, hotels: [1500, 3500, 7000],
    attractions: [
      ['Island Beach Walk', 'Walk around the coral shoreline.', 1, 0],
      ['Chera Dwip', 'Rocky islet reachable at low tide.', 1, 0],
      ['Sunset Point', 'Evening views over the Bay of Bengal.', 1, 0],
      ['Village Cafes and Dried-Fish Market', 'Local food and shopping.', 0, 0],
    ],
  },
  {
    short: 'Kuakata', climate: 'southwest',
    row: {
      name: 'Kuakata', division: 'Barishal', category: 'beach', best_season: 'winter', budget_level: 'low',
      description: 'A rare beach where you can watch both sunrise and sunset over the sea.',
      image_url: pic('kuakata', ''), gallery_urls: [pic('kuakata', 1), pic('kuakata', 2)].join(','),
      latitude: 21.8172, longitude: 90.12,
      travel_tips: 'Reach the beach before sunrise. Check cyclone warnings before travelling.',
      food_per_day: 600, local_transport_per_day: 400, activities_per_day: 400,
    },
    transport: { bus: 1200, launch: 1000 }, hotels: [1000, 2800, 5500],
    attractions: [
      ['Kuakata Sea Beach', 'Sunrise and sunset viewing.', 1, 0],
      ['Fatrar Char Mangrove', 'Mangrove forest and boat trip.', 1, 200],
      ['Sima Buddha Temple', 'Rakhine Buddhist temple.', 0, 0],
      ['Rakhine Village Handicrafts', 'Traditional weaving and crafts.', 0, 0],
    ],
  },
  {
    short: 'Sundarbans', climate: 'southwest',
    row: {
      name: 'Sundarbans', division: 'Khulna', category: 'nature', best_season: 'winter', budget_level: 'medium',
      description: 'The largest mangrove forest in the world and home of the Royal Bengal Tiger.',
      image_url: pic('sundarbans', ''), gallery_urls: [pic('sundarbans', 1), pic('sundarbans', 2)].join(','),
      latitude: 21.9497, longitude: 89.1833,
      travel_tips: 'Entry needs a forest permit and a registered tour guide. Best from November to February.',
      food_per_day: 900, local_transport_per_day: 800, activities_per_day: 1200,
    },
    transport: { bus: 900, train: 900, air: 5500, launch: 1200 }, hotels: [1200, 3000, 6000],
    attractions: [
      ['Karamjal Wildlife Centre', 'Deer, crocodiles and a nature trail.', 1, 300],
      ['Kotka Beach', 'Remote beach inside the forest.', 1, 300],
      ['Tin Kona Island', 'Wildlife viewing point.', 1, 300],
      ['Sundarbans Visitor Information Centre', 'Exhibits about forest wildlife (Khulna).', 0, 0],
    ],
  },
  {
    short: 'Sylhet', climate: 'northeast',
    row: {
      name: 'Sylhet', division: 'Sylhet', category: 'nature', best_season: 'year_round', budget_level: 'medium',
      description: 'Tea gardens, swamp forest, waterfalls and shrines in the green north-east.',
      image_url: pic('sylhet', ''), gallery_urls: [pic('sylhet', 1), pic('sylhet', 2)].join(','),
      latitude: 24.8949, longitude: 91.8687,
      travel_tips: 'Ratargul is best visited in the rainy season by boat. Watch for flash floods in Jaflong.',
      food_per_day: 700, local_transport_per_day: 600, activities_per_day: 500,
    },
    transport: { bus: 900, train: 800, air: 5500 }, hotels: [1200, 3000, 8000],
    attractions: [
      ['Ratargul Swamp Forest', 'Boat ride through a flooded forest.', 1, 400],
      ['Jaflong', 'Stone collection area and river views.', 1, 100],
      ['Lalakhal', 'Blue-green river boat trip.', 1, 300],
      ['Shah Jalal Dargah', 'Famous Sufi shrine.', 0, 0],
      ['Sylhet Osmani Museum', 'Local history museum.', 0, 20],
    ],
  },
  {
    short: 'Bandarban', climate: 'hill',
    row: {
      name: 'Bandarban', division: 'Chattogram', category: 'hill', best_season: 'winter', budget_level: 'medium',
      description: 'Bangladesh\'s hill district with mountain views, waterfalls and tribal culture.',
      image_url: pic('bandarban', ''), gallery_urls: [pic('bandarban', 1), pic('bandarban', 2)].join(','),
      latitude: 22.1953, longitude: 92.2184,
      travel_tips: 'Landslides are a risk in monsoon. Hire a local guide for treks and carry a permit when asked.',
      food_per_day: 600, local_transport_per_day: 1200, activities_per_day: 800,
    },
    transport: { bus: 1000 }, hotels: [1200, 3000, 6000],
    attractions: [
      ['Nilgiri Hills', 'Cloud-level viewpoint.', 1, 200],
      ['Shoilo Propat Waterfall', 'Easy waterfall near the town.', 1, 50],
      ['Nilachal Viewpoint', 'Sunset view over the town.', 1, 50],
      ['Buddha Dhatu Jadi (Golden Temple)', 'Largest Buddhist temple in the region.', 0, 0],
      ['Local Bazaar and Tribal Handicrafts', 'Shopping for traditional cloth.', 0, 0],
    ],
  },
  {
    short: 'Rangamati', climate: 'hill',
    row: {
      name: 'Rangamati', division: 'Chattogram', category: 'hill', best_season: 'year_round', budget_level: 'low',
      description: 'The lake district of Bangladesh, built around Kaptai Lake and tribal villages.',
      image_url: pic('rangamati', ''), gallery_urls: [pic('rangamati', 1), pic('rangamati', 2)].join(','),
      latitude: 22.6372, longitude: 92.201,
      travel_tips: 'Boat rides are cheapest when shared. Avoid boating in stormy weather.',
      food_per_day: 600, local_transport_per_day: 500, activities_per_day: 600,
    },
    transport: { bus: 800 }, hotels: [1000, 2500, 5000],
    attractions: [
      ['Kaptai Lake Boat Ride', 'Boat trip across the lake.', 1, 500],
      ['Hanging Bridge', 'Landmark suspension bridge.', 1, 20],
      ['Shuvolong Waterfall', 'Waterfall reached by boat.', 1, 200],
      ['Tribal Cultural Institute Museum', 'Tribal artefacts and costumes.', 0, 20],
      ['Rajban Vihara', 'Buddhist temple.', 0, 0],
    ],
  },
  {
    short: 'Bagerhat', climate: 'southwest',
    row: {
      name: 'Bagerhat', division: 'Khulna', category: 'heritage', best_season: 'winter', budget_level: 'low',
      description: 'The historic mosque city of Khan Jahan Ali, a UNESCO World Heritage Site.',
      image_url: pic('bagerhat', ''), gallery_urls: [pic('bagerhat', 1), pic('bagerhat', 2)].join(','),
      latitude: 22.6602, longitude: 89.7895,
      travel_tips: 'Dress modestly at mosques. Combine with a Sundarbans trip from Khulna.',
      food_per_day: 500, local_transport_per_day: 300, activities_per_day: 200,
    },
    transport: { bus: 700, train: 600 }, hotels: [900, 2200, 4500],
    attractions: [
      ['Sixty Dome Mosque', 'Largest medieval mosque in Bangladesh.', 0, 20],
      ['Khan Jahan Ali Tomb', 'Tomb and crocodile pond.', 1, 20],
      ['Nine Dome Mosque', 'Small historic mosque.', 0, 0],
      ['Bagerhat Museum', 'Terracotta and relics of the old city.', 0, 20],
    ],
  },
  {
    short: 'Paharpur', climate: 'northwest',
    row: {
      name: 'Paharpur (Somapura Mahavihara)', division: 'Rajshahi', category: 'heritage', best_season: 'winter', budget_level: 'low',
      description: 'Ruins of a great Buddhist monastery, a UNESCO World Heritage Site in Naogaon.',
      image_url: pic('paharpur', ''), gallery_urls: [pic('paharpur', 1), pic('paharpur', 2)].join(','),
      latitude: 25.0314, longitude: 88.9768,
      travel_tips: 'Very hot in summer - visit early morning. Combine with Mahasthangarh.',
      food_per_day: 450, local_transport_per_day: 300, activities_per_day: 150,
    },
    transport: { bus: 800, train: 700 }, hotels: [800, 2000, 4000],
    attractions: [
      ['Somapura Mahavihara Ruins', 'Large monastery ruins.', 1, 20],
      ['Paharpur Site Museum', 'Terracotta plaques and artefacts.', 0, 20],
      ['Mahasthangarh', 'Ancient fortified city.', 1, 20],
      ['Kusumba Mosque', 'Historic mosque in Naogaon.', 0, 0],
    ],
  },
];

module.exports = { PROFILES, HUMIDITY, destinations };
