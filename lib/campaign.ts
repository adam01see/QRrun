export interface CampaignStep {
  step: number
  npc: string
  npc_location: string       // display name of where NPC is
  title: string
  dialogue: string
  objective: string          // short action text
  advance_on: string         // arriving at this location_id advances to next step
}

export const CAMPAIGN: CampaignStep[] = [
  {
    step: 0,
    npc: 'Elder Maren',
    npc_location: 'Starting City',
    title: 'Iron Roads',
    dialogue: 'Courier. Good, you\'re here. The Dwarfs Kingdom has gone silent — no iron shipments, no messengers. Something is wrong up north and you\'re the fastest pair of legs in this city. Head there and report back.',
    objective: 'Travel to the Dwarfs Kingdom',
    advance_on: 'dwarfs_kingdom',
  },
  {
    step: 1,
    npc: 'King Thordak',
    npc_location: 'Dwarfs Kingdom',
    title: 'Something in the Stone',
    dialogue: 'Courier. Our miners broke into a sealed vault three weeks ago. Inside was a glowing fragment — beautiful and wrong. Since then, the tunnels breed creatures and three dwarfs have gone mad. Our loremaster believes it\'s a shard of the Shattered Compass. Find the Druid in the Dark Forest. She will know what to do with it.',
    objective: 'Travel to the House of the Druid',
    advance_on: 'house_of_druid',
  },
  {
    step: 2,
    npc: 'Druid Eiravel',
    npc_location: 'House of the Druid',
    title: 'Six Shards',
    dialogue: 'I felt it the moment you entered the forest. Yes — a shard of the Shattered Compass. The Compass was broken centuries ago to prevent any one person from controlling the paths of the world. Six shards, scattered. Someone is gathering them. I sense one nearby, in the Magic Forest. The spirits there are agitated. Go before the shard corrupts them entirely.',
    objective: 'Travel to the Magic Forest',
    advance_on: 'magic_forest',
  },
  {
    step: 3,
    npc: 'Forest Spirit',
    npc_location: 'Magic Forest',
    title: 'The Trail of Corruption',
    dialogue: 'Runner. The shard is gone. An elf carried it through here two days ago, heading south toward their village. The forest bled where they walked. Flowers turned to ash. Follow the trail. Warn them.',
    objective: 'Travel to the Village of Elfs',
    advance_on: 'village_of_elfs',
  },
  {
    step: 4,
    npc: 'Elder Syl',
    npc_location: 'Village of Elfs',
    title: 'Aethon\'s Folly',
    dialogue: 'We know. Our elder Aethon became obsessed with the shard — believed the eternal light at the summit of the Mountain of the Sun could purify it. He left three days ago. We tried to stop him. If the shard is as dangerous as you say, you must reach him before the corruption consumes what\'s left of his mind.',
    objective: 'Travel to the Mountain of the Sun',
    advance_on: 'mountain_of_sun',
  },
  {
    step: 5,
    npc: 'Elder Aethon',
    npc_location: 'Mountain of the Sun',
    title: 'The Source',
    dialogue: 'You found me. The light didn\'t purify it — it amplified it. I\'m sorry. Before the madness took hold I saw visions. The one gathering the shards... they\'re in the City of Outsiders, at the edge of everything. They call themselves the Collector. Run. Don\'t stop. You\'re the only one who can reach them in time.',
    objective: 'Travel to the City of Outsiders',
    advance_on: 'city_of_outsiders',
  },
  {
    step: 6,
    npc: 'The Collector',
    npc_location: 'City of Outsiders',
    title: 'The Shattered Compass',
    dialogue: 'So you made it. Impressive. I\'ve been watching you since Starting City, courier. The Compass wasn\'t broken by accident — I broke it. Maps give power to those who hold them. But you\'ve run every road, crossed every forest, climbed every peak. You didn\'t need the Compass. You became it. The world is yours.',
    objective: 'Campaign complete',
    advance_on: '',
  },
]

export function getCampaignStep(step: number | null): CampaignStep {
  const s = step ?? 0
  return CAMPAIGN[Math.min(s, CAMPAIGN.length - 1)]
}

export const CAMPAIGN_ADVANCE_MAP: Record<string, number> = Object.fromEntries(
  CAMPAIGN.filter(s => s.advance_on).map(s => [s.advance_on, s.step + 1])
)
