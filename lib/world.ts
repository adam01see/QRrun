import { WorldLocation, WorldPath, Creature, BiomeId } from '@/types'

export const LOCATIONS: WorldLocation[] = [
  { id: 'starting_city',     name: 'Starting City',         description: 'A bustling hub of adventurers and merchants.',             icon: '🏙️' },
  { id: 'dwarfs_kingdom',    name: 'Dwarfs Kingdom',         description: 'Ancient halls carved deep into the mountain rock.',        icon: '⛏️' },
  { id: 'house_of_druid',   name: 'House of the Druid',     description: 'A mossy cottage hidden deep within the Dark Forest.',      icon: '🌿' },
  { id: 'magic_forest',      name: 'Magic Forest',           description: 'A luminous forest where reality bends.',                   icon: '✨' },
  { id: 'village_of_elfs',   name: 'Village of the Elfs',   description: 'Treetop homes connected by rope bridges.',                 icon: '🧝' },
  { id: 'mountain_of_sun',   name: 'Mountain of the Sun',   description: 'A peak that pierces the clouds, bathed in eternal light.', icon: '⛰️' },
  { id: 'city_of_outsiders', name: 'City of Outsiders',     description: 'A lawless city at the edge of the known world.',          icon: '🏚️' },
]

export const PATHS: WorldPath[] = [
  {
    id: 'starting_city-dwarfs_kingdom',
    from: 'starting_city', to: 'dwarfs_kingdom',
    total_km: 10,
    segments: [{ biome: 'road', start_km: 0, end_km: 10 }],
  },
  {
    id: 'starting_city-house_of_druid',
    from: 'starting_city', to: 'house_of_druid',
    total_km: 15,
    segments: [{ biome: 'dark_forest', start_km: 0, end_km: 15 }],
  },
  {
    id: 'starting_city-magic_forest',
    from: 'starting_city', to: 'magic_forest',
    total_km: 10,
    segments: [{ biome: 'magic_forest', start_km: 0, end_km: 10 }],
  },
  {
    id: 'starting_city-village_of_elfs',
    from: 'starting_city', to: 'village_of_elfs',
    total_km: 20,
    segments: [{ biome: 'road', start_km: 0, end_km: 20 }],
  },
  {
    id: 'village_of_elfs-mountain_of_sun',
    from: 'village_of_elfs', to: 'mountain_of_sun',
    total_km: 10,
    segments: [{ biome: 'mountain', start_km: 0, end_km: 10 }],
  },
  {
    id: 'village_of_elfs-city_of_outsiders',
    from: 'village_of_elfs', to: 'city_of_outsiders',
    total_km: 40,
    segments: [
      { biome: 'swamp',  start_km: 0,  end_km: 20 },
      { biome: 'desert', start_km: 20, end_km: 40 },
    ],
  },
]

export const CREATURES: Creature[] = [
  { slug: 'stray_dog',    name: 'Stray Dog',       description: 'A mangy mutt that looks desperate.',                   hp_km: 1,  damage: 5,  biomes: ['road'],                     icon: '🐕' },
  { slug: 'bandit',       name: 'Bandit',           description: 'A hooded figure blocking the road.',                  hp_km: 3,  damage: 10, biomes: ['road', 'desert'],           icon: '🗡️' },
  { slug: 'skeleton',     name: 'Skeleton',         description: 'Bones rattling in the darkness.',                     hp_km: 2,  damage: 8,  biomes: ['dark_forest'],              icon: '💀' },
  { slug: 'wolf',         name: 'Wolf',             description: 'Glowing eyes between the trees.',                     hp_km: 3,  damage: 12, biomes: ['dark_forest'],              icon: '🐺' },
  { slug: 'dark_witch',   name: 'Dark Witch',       description: 'A cackling figure wreathed in purple smoke.',         hp_km: 8,  damage: 20, biomes: ['dark_forest'],              icon: '🧙' },
  { slug: 'fairy',        name: 'Mischief Fairy',   description: 'Tiny and quick, pulling your hair.',                  hp_km: 1,  damage: 5,  biomes: ['magic_forest'],             icon: '🧚' },
  { slug: 'will_o_wisp',  name: "Will-o'-Wisp",     description: 'A floating orb that lures travellers astray.',        hp_km: 3,  damage: 10, biomes: ['magic_forest'],             icon: '🔮' },
  { slug: 'treant',       name: 'Treant',           description: 'An ancient tree that has grown a grudge.',            hp_km: 7,  damage: 18, biomes: ['magic_forest'],             icon: '🌳' },
  { slug: 'leech_swarm',  name: 'Leech Swarm',      description: 'A writhing mass rising from the mud.',                hp_km: 4,  damage: 12, biomes: ['swamp'],                    icon: '🪱' },
  { slug: 'swamp_troll',  name: 'Swamp Troll',      description: 'A lurching mass of moss and rage.',                   hp_km: 6,  damage: 15, biomes: ['swamp'],                    icon: '👹' },
  { slug: 'scorpion',     name: 'Giant Scorpion',   description: 'Emerges from the sand without warning.',              hp_km: 2,  damage: 8,  biomes: ['desert'],                   icon: '🦂' },
  { slug: 'sand_wyrm',    name: 'Sand Wyrm',        description: 'The ground shakes. It is underneath you.',            hp_km: 15, damage: 30, biomes: ['desert'],                   icon: '🐉' },
  { slug: 'eagle',        name: 'Mountain Eagle',   description: 'Massive wings blot out the sun.',                     hp_km: 2,  damage: 8,  biomes: ['mountain'],                 icon: '🦅' },
  { slug: 'golem',        name: 'Stone Golem',      description: 'A construct of living rock, blocking the pass.',      hp_km: 10, damage: 25, biomes: ['mountain'],                 icon: '🗿' },
  { slug: 'stone_giant',  name: 'Stone Giant',      description: 'It uses boulders as toys.',                           hp_km: 12, damage: 30, biomes: ['mountain'],                 icon: '🏔️' },
]

export const BIOME_DANGER: Record<BiomeId, number> = {
  road:         0.08,
  dark_forest:  0.30,
  magic_forest: 0.20,
  swamp:        0.25,
  desert:       0.20,
  mountain:     0.18,
}

export const BIOME_NAMES: Record<BiomeId, string> = {
  road:         'Road',
  dark_forest:  'Dark Forest',
  magic_forest: 'Magic Forest',
  swamp:        'Swamp',
  desert:       'Desert',
  mountain:     'Mountain',
}

export const BIOME_COLORS: Record<BiomeId, string> = {
  road:         'text-zinc-400',
  dark_forest:  'text-purple-400',
  magic_forest: 'text-teal-400',
  swamp:        'text-green-600',
  desert:       'text-yellow-500',
  mountain:     'text-stone-400',
}

export function getLocation(id: string): WorldLocation | undefined {
  return LOCATIONS.find(l => l.id === id)
}

export function getPath(fromId: string, toId: string): WorldPath | undefined {
  return PATHS.find(p =>
    (p.from === fromId && p.to === toId) ||
    (p.from === toId   && p.to === fromId)
  )
}

export function getPathsFrom(locationId: string): WorldPath[] {
  return PATHS.filter(p => p.from === locationId || p.to === locationId)
}

export function getNeighbors(locationId: string): WorldLocation[] {
  return getPathsFrom(locationId)
    .map(p => getLocation(p.from === locationId ? p.to : p.from))
    .filter(Boolean) as WorldLocation[]
}

export function getCreature(slug: string): Creature | undefined {
  return CREATURES.find(c => c.slug === slug)
}

export function getBiomeAtKm(path: WorldPath, km: number): BiomeId {
  for (const seg of path.segments) {
    if (km >= seg.start_km && km < seg.end_km) return seg.biome
  }
  return path.segments[path.segments.length - 1].biome
}

export function getCreaturesForBiome(biome: BiomeId): Creature[] {
  return CREATURES.filter(c => c.biomes.includes(biome))
}
