const TOPIC_RULES = [
  { topic: 'Marvel', terms: ['marvel', 'mcu', 'avengers', 'spider-man', 'spiderman', 'x-men', 'xmen', 'daredevil', 'punisher', 'deadpool', 'wolverine', 'fantastic four', 'guardians of the galaxy'] },
  { topic: 'DC', terms: ['dc comics', 'dc universe', 'batman', 'superman', 'wonder woman', 'joker', 'aquaman', 'flash', 'green lantern', 'justice league', 'suicide squad', 'harley quinn'] },
  { topic: 'Disney', terms: ['disney', 'pixar', 'descendants', 'zombies', 'high school musical', 'camp rock', 'frozen', 'moana', 'lion king'] },
  { topic: 'Bluey', terms: ['bluey'] },
  { topic: 'Descendants', terms: ['descendants'] },
  { topic: 'High School Musical', terms: ['high school musical'] },
  { topic: 'Mortal Kombat', terms: ['mortal kombat'] },
  { topic: 'Zombies', terms: ['zombies'] },
  { topic: 'Superheroes', terms: ['superhero', 'super hero', 'heroes', 'vigilante'] },
  { topic: 'Animation', terms: ['animation', 'animated', 'cartoon'] },
  { topic: 'Kids & Family', terms: ['kids', 'family', 'children'] },
  { topic: 'Musicals', terms: ['musical', 'music', 'sing along'] },
  { topic: 'Romance', terms: ['romance', 'romantic', 'love'] },
  { topic: 'Horror', terms: ['horror', 'witch', 'witches', 'obsession', 'zombie'] }
];

const normalizeText = (item = {}) => [
  item.title,
  item.collection_name,
  item.collection_key,
  item.synopsis,
  ...(item.genres || []),
  ...(item.related_keywords || [])
].filter(Boolean).join(' ').toLowerCase();

export function deriveMediaTopics(item = {}) {
  const haystack = normalizeText(item);
  const topics = TOPIC_RULES
    .filter(rule => rule.terms.some(term => haystack.includes(term)))
    .map(rule => rule.topic);

  if (item.collection_name && !topics.includes(item.collection_name)) {
    topics.unshift(item.collection_name);
  }

  return [...new Set(topics)].slice(0, 4);
}

export function getLibraryTopics(items = []) {
  return [...new Set(items.flatMap(deriveMediaTopics))].sort((a, b) => a.localeCompare(b));
}