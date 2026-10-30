/**
 * Catalog
 * Everything the portal lists: site name, categories and games.
 * To rename the site, change Catalog.SITE. To add a game, add an entry to Catalog.GAMES.
 */
class Catalog {
  static game(id) {
    return Catalog.GAMES.find(g => g.id === id) || null;
  }

  static category(id) {
    return Catalog.CATEGORIES.find(c => c.id === id) || null;
  }

  static gamesIn(categoryId) {
    const c = Catalog.category(categoryId);
    if (!c || c.id === 'all') return Catalog.GAMES.slice();
    if (c.id === 'new') return Catalog.GAMES.filter(g => g.isNew);
    return Catalog.GAMES.filter(g => g.skills.indexOf(c.skill) >= 0);
  }

  /** Page the player loads for a game. */
  static urlFor(g) {
    return g.url || (Catalog.GAME_URL + '?theme=' + encodeURIComponent(g.theme));
  }

  /** How-to steps for a game, with its own word for a move. */
  static howToFor(g) {
    return (g.howTo || Catalog.FILL_HOW_TO).map(s => s.replace('{moves}', g.moves.toLowerCase()));
  }

  static search(text) {
    const q = text.trim().toLowerCase();
    if (!q) return Catalog.GAMES.slice();
    return Catalog.GAMES.filter(g =>
      (g.title + ' ' + g.tagline + ' ' + g.skills.join(' ') + ' ' + g.world).toLowerCase().indexOf(q) >= 0);
  }
}

Catalog.SITE = {
  name: 'MindPlay Arcade',
  tagline: 'Free brain games for Class 3–8',
  year: 2026
};

Catalog.CATEGORIES = [
  { id: 'new', label: 'New' },
  { id: 'planning', label: 'Planning', skill: 'Planning' },
  { id: 'spatial', label: 'Spatial', skill: 'Spatial reasoning' },
  { id: 'memory', label: 'Memory', skill: 'Working memory' },
  { id: 'attention', label: 'Attention', skill: 'Attention', soon: true },
  { id: 'maths', label: 'Maths', skill: 'Mental maths', soon: true },
  { id: 'all', label: 'All games' }
];

/** Shared text for every Fill the Holes world. */
Catalog.FILL_HOW_TO = [
  'Choose your class (3–8). Each session has 10 levels.',
  'Tap a piece, then tap an arrow (or swipe). It moves in a straight line until something stops it.',
  'It drops into the first empty place that fits it. Filled places can be crossed.',
  'Fill every place in as few {moves} as possible. Undo, Restart and Hint are there if you get stuck.',
  'Class 6–8 adds a colour rule: ● pieces only fit ● places, ▲ pieces only fit ▲ places.'
];

Catalog.GAMES = [
  {
    id: 'masala',
    title: 'Masala Dabba Sort',
    world: 'Kitchen',
    isNew: true,
    tagline: 'The spices got mixed up. Pour them back before Dadi starts cooking!',
    description: 'Pour haldi, mirchi, jeera and more between the jars until every jar holds one spice. A spice only goes on top of the same spice or into an empty jar, so the wrong pour can trap a spice at the bottom. In Class 6–8 the jars are frosted: you only see the top layer, and must remember what you uncover.',
    skills: ['Planning', 'Working memory', 'Inhibitory control'],
    classes: 'Class 3–8',
    moves: 'Pours',
    thumb: 'thumbs/masala.jpg',
    wide: 'thumbs/masala_wide.jpg',
    poster: 'thumbs/masala_menu.jpg',
    url: 'masala/index.html',
    howTo: [
      'Choose your class (3–8). Each session has 10 shelves.',
      'Tap a jar, then tap the jar to pour into.',
      'A spice can only go on top of the same spice, or into an empty jar. All matching scoops on top pour together, as many as fit.',
      'Sort every jar to one spice in as few pours as possible. Undo, Restart and Hint are there if you get stuck.',
      'Class 6–8 uses frosted jars: only the top spice shows. Anything you uncover stays visible.'
    ],
    accent: '#e0a526'
  },
  {
    id: 'autoout',
    title: 'Get the Auto Out',
    world: 'School gate',
    isNew: true,
    tagline: 'Morning rush at the school gate. Clear a path for the school van!',
    description: 'Autos, taxis, tempos, buses, trucks and water tankers are jammed outside Gyan Jyoti School. Slide them forward or back along their lanes, never sideways, until the gate swings open and the school van drives in. A resting cow, a police barricade or a parked sabzi cart never moves, and the last jams grow to 7×7 and 8×8 lots. Every vehicle has its own horn and engine sound.',
    skills: ['Planning', 'Spatial reasoning', 'Sequencing'],
    classes: 'Class 3–8',
    moves: 'Moves',
    thumb: 'thumbs/autoout.jpg',
    wide: 'thumbs/autoout_wide.jpg',
    poster: 'thumbs/autoout_menu.jpg',
    url: 'autoout/index.html',
    howTo: [
      'Choose your class (3–8). Each session has 10 traffic jams.',
      'Drag a vehicle along its lane. It can only move forward or back, never turn or move sideways.',
      'A slide of any length counts as one move. Buses, trucks and tankers are 3 cells long.',
      'Cows, police barricades and sabzi carts never move. Tap them to hear them, then plan around them.',
      'Get the yellow school van through the gate in as few moves as possible. Undo, Restart and Hint are there if you get stuck.',
      'The last jams use bigger lots: up to 7×7 in Class 3–5 and 8×8 in Class 6–8.'
    ],
    accent: '#ffd23f'
  },
  {
    id: 'pothole',
    title: 'Pothole Patrol',
    world: 'Fill the Holes',
    isNew: true,
    tagline: 'The monsoon broke the road. Fix it before the school bus comes!',
    description: 'Roll repair carts across the wet road. A cart cannot brake: it rolls until an auto-rickshaw, a cone or a tree stops it, and drops into the first pothole it reaches. Plan the order, or a cart ends up where no pothole can be reached.',
    skills: ['Planning', 'Spatial reasoning', 'Sequencing'],
    classes: 'Class 3–8',
    moves: 'Moves',
    thumb: 'thumbs/pothole.jpg',
    wide: 'thumbs/pothole_wide.jpg',
    poster: 'thumbs/pothole_menu.jpg',
    theme: 'pothole',
    accent: '#ffc21a'
  },
  {
    id: 'kanche',
    title: 'Kanche Champ',
    world: 'Fill the Holes',
    isNew: true,
    tagline: 'The street marble game. Flick, roll, and fill every hole!',
    description: 'Flick glass marbles across a mud patch. Each one rolls straight until a stone, a brick or a slipper stops it, and drops into the first empty hole it rolls over. Champions fill every hole in the fewest flicks.',
    skills: ['Planning', 'Spatial reasoning', 'Sequencing'],
    classes: 'Class 3–8',
    moves: 'Flicks',
    thumb: 'thumbs/kanche.jpg',
    wide: 'thumbs/kanche_wide.jpg',
    poster: 'thumbs/kanche_menu.jpg',
    theme: 'kanche',
    accent: '#3d9c74'
  },
  {
    id: 'fields',
    title: 'Water the Fields',
    world: 'Fill the Holes',
    isNew: true,
    tagline: 'The monsoon is late. Send water to every dry field!',
    description: 'Open the channels and let the water flow. It runs straight until a bund, a haystack or a tree stops it, and fills the first dry field on its way. Watered fields turn green, and later water can flow across them. Paddy needs canal water, vegetables need well water.',
    skills: ['Planning', 'Spatial reasoning', 'Rule following'],
    classes: 'Class 3–8',
    moves: 'Flows',
    thumb: 'thumbs/fields.jpg',
    wide: 'thumbs/fields_wide.jpg',
    poster: 'thumbs/fields_menu.jpg',
    theme: 'fields',
    accent: '#6fa548'
  },
  {
    id: 'parking',
    title: 'Park It!',
    world: 'Fill the Holes',
    isNew: true,
    tagline: 'The mall opens soon. Park every vehicle on a lift!',
    description: 'Drive cars and scooters through a basement car park. Each one drives straight until a pillar, a barrier or another vehicle stops it, and takes the first free parking lift meant for it. The lift lowers it underground, so others can drive over.',
    skills: ['Planning', 'Spatial reasoning', 'Rule following'],
    classes: 'Class 3–8',
    moves: 'Moves',
    thumb: 'thumbs/parking.jpg',
    wide: 'thumbs/parking_wide.jpg',
    poster: 'thumbs/parking_menu.jpg',
    theme: 'parking',
    accent: '#f2c230'
  }
];

Catalog.GAME_URL = 'game/index.html';

/** Solver-checked puzzles across all level banks (Fill the Holes 299, Masala 294, Auto Out 286). */
Catalog.PUZZLE_COUNT = 879;
