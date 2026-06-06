export const TOPICS_BY_CLASS = {
  3:  ['Fractions', 'Addition', 'Subtraction', 'Shapes', 'Measurement'],
  4:  ['Fractions', 'Multiplication', 'Division', 'Ratio', 'Geometry'],
  5:  ['Fractions', 'Percentage', 'Ratio', 'Algebra Basics', 'Geometry'],
  6:  ['Percentage', 'Ratio', 'Algebra', 'Integers', 'Sets', 'Statistics'],
  7:  ['Algebra', 'Ratio', 'Percentage', 'Geometry', 'Probability', 'Linear Equations'],
  8:  ['Algebra', 'Geometry', 'Quadratic Equations', 'Statistics', 'Trigonometry', 'Mensuration'],
  9:  ['Quadratic Equations', 'Trigonometry', 'Coordinate Geometry', 'Statistics', 'Probability', 'Polynomials'],
  10: ['Trigonometry', 'Coordinate Geometry', 'Polynomials', 'Probability', 'Mensuration', 'Sequences & Series'],
}

export const ENVIRONMENTS = [
  { id: 'Cricket',        emoji: '🏏' },
  { id: 'Football',       emoji: '⚽' },
  { id: 'Free Fire',      emoji: '🎮' },
  { id: 'PUBG',           emoji: '🎯' },
  { id: 'Business',       emoji: '💼' },
  { id: 'Village Life',   emoji: '🌾' },
  { id: 'Cooking',        emoji: '🍳' },
  { id: 'Space',          emoji: '🚀' },
  { id: 'Anime',          emoji: '🎌' },
  { id: 'Bazaar Market',  emoji: '🛒' },
]

export const CLASS_LEVELS = [3, 4, 5, 6, 7, 8, 9, 10]

export const TOPIC_ICONS = {
  'Fractions': '½',
  'Algebra': 'x²',
  'Geometry': '△',
  'Ratio': '∶',
  'Percentage': '%',
  'Statistics': '📊',
  'Probability': '🎲',
  'Trigonometry': '∠',
  'Polynomials': 'p(x)',
  'Integers': '±',
  'Sets': '∩',
  'Mensuration': '📐',
  'default': '∑',
}

export function getTopicIcon(topic) {
  for (const [key, val] of Object.entries(TOPIC_ICONS)) {
    if (topic.toLowerCase().includes(key.toLowerCase())) return val
  }
  return TOPIC_ICONS.default
}

export const BADGE_ICONS = {
  'Beginner': '🌱',
  'Quick Learner': '⚡',
  'Rising Star': '🌟',
  'Math Warrior': '⚔️',
  'Consistent Learner': '🔥',
  'Study Champion': '🏆',
}

export function parseBadges(raw) {
  if (!raw) return []
  return raw.split(',').map(b => b.trim()).filter(Boolean)
}
