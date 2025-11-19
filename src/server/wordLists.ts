// Word lists for generating memorable room codes
// All words are 4 characters or less in English

export const WORD_LISTS = {
  animals: [
    'bear', 'deer', 'wolf', 'lion', 'hawk', 'frog', 'duck', 'crab',
    'crow', 'dove', 'fish', 'fox', 'goat', 'hare', 'lynx', 'mole',
    'moth', 'owl', 'pike', 'puma', 'seal', 'slug', 'swan', 'toad',
    'wasp', 'worm', 'yak', 'ape', 'bat', 'bee', 'boar', 'bull',
    'calf', 'cat', 'clam', 'cod', 'colt', 'cow', 'cub', 'dog',
    'ewe', 'fly', 'gnu', 'hen', 'hog', 'ibex', 'joey', 'lamb',
    'lark', 'loon', 'mice', 'mink', 'newt', 'orca', 'ox', 'pig',
    'ram', 'rat', 'rook', 'stag', 'tern', 'tuna', 'vole', 'wren'
  ],
  
  plants: [
    'tree', 'rose', 'lily', 'fern', 'moss', 'sage', 'pine', 'oak',
    'elm', 'ash', 'fig', 'herb', 'iris', 'ivy', 'kelp', 'kale',
    'leaf', 'lime', 'mint', 'palm', 'pear', 'plum', 'reed', 'rice',
    'root', 'rye', 'seed', 'twig', 'vine', 'weed', 'wood', 'yam',
    'aloe', 'bean', 'beet', 'bush', 'cane', 'chia', 'corn', 'dill',
    'flax', 'hemp', 'hops', 'jute', 'leek', 'oat', 'okra', 'pea'
  ],
  
  objects: [
    'book', 'lamp', 'desk', 'bell', 'coin', 'rope', 'lock', 'nail',
    'bolt', 'gear', 'helm', 'ring', 'axe', 'bow', 'cup', 'drum',
    'flue', 'fork', 'gate', 'harp', 'horn', 'key', 'kite', 'lamp',
    'lens', 'mask', 'net', 'oar', 'pipe', 'rake', 'sail', 'saw',
    'seal', 'ship', 'sled', 'tent', 'tool', 'vase', 'wall', 'well',
    'ball', 'bath', 'bed', 'bike', 'boat', 'bolt', 'bone', 'boot',
    'card', 'cart', 'case', 'cash', 'cask', 'chip', 'clay', 'clue',
    'coal', 'coat', 'coil', 'comb', 'cork', 'crib', 'dice', 'dish',
    'doll', 'door', 'fan', 'file', 'flag', 'foam', 'fuel', 'gift',
    'golf', 'grid', 'grip', 'hall', 'hook', 'hose', 'jail', 'keg',
    'kiln', 'knob', 'lace', 'loom', 'mail', 'map', 'mat', 'meal',
    'mill', 'mop', 'mug', 'nut', 'oven', 'pail', 'pan', 'pass',
    'path', 'peg', 'pen', 'pier', 'pill', 'pin', 'plan', 'pole',
    'pool', 'port', 'post', 'pot', 'rack', 'rail', 'ramp', 'reel',
    'road', 'rod', 'roof', 'room', 'rug', 'safe', 'salt', 'sand',
    'sash', 'sign', 'silk', 'sink', 'slab', 'sofa', 'soil', 'step',
    'stew', 'sway', 'tack', 'tag', 'tank', 'tape', 'tarp', 'taxi',
    'tile', 'tine', 'tire', 'tray', 'tube', 'turf', 'twig', 'veil',
    'vent', 'vest', 'vine', 'wand', 'ward', 'ware', 'wick', 'wig',
    'wing', 'wire', 'wood', 'wool', 'yard', 'yoke', 'zinc'
  ],
  
  nature: [
    'cave', 'hill', 'lake', 'moon', 'star', 'sun', 'wave', 'wind',
    'bay', 'bog', 'clay', 'cove', 'dawn', 'dew', 'dirt', 'drop',
    'dune', 'dust', 'fall', 'fog', 'gale', 'glow', 'gold', 'gulf',
    'hail', 'heat', 'ice', 'jade', 'jet', 'lava', 'mist', 'mud',
    'peak', 'rain', 'reef', 'rift', 'rock', 'ruby', 'salt', 'sand',
    'sea', 'sky', 'snow', 'soil', 'tide', 'vale', 'vent', 'void'
  ],
  
  colors: [
    'blue', 'cyan', 'gold', 'gray', 'jade', 'navy', 'pink', 'red',
    'rose', 'ruby', 'rust', 'sage', 'sand', 'teal', 'aqua', 'buff',
    'ecru', 'fawn', 'glow', 'haze', 'iris', 'lime', 'onyx', 'plum'
  ]
};

// Combine all words into a single pool
export const ALL_WORDS = [
  ...WORD_LISTS.animals,
  ...WORD_LISTS.plants,
  ...WORD_LISTS.objects,
  ...WORD_LISTS.nature,
  ...WORD_LISTS.colors
];

/**
 * Generate a room code from two random words
 * Format: "word1-word2" (e.g., "bear-lamp", "rose-moon")
 */
export function generateWordRoomCode(): string {
  const word1 = ALL_WORDS[Math.floor(Math.random() * ALL_WORDS.length)];
  let word2 = ALL_WORDS[Math.floor(Math.random() * ALL_WORDS.length)];
  
  // Ensure words are different
  while (word2 === word1) {
    word2 = ALL_WORDS[Math.floor(Math.random() * ALL_WORDS.length)];
  }
  
  return `${word1}-${word2}`;
}
