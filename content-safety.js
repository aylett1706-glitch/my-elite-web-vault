const ADULT_RATINGS = new Set(['R', 'X', 'XXX', 'NC-17', '18+', 'R18+', 'X18+', 'MA18+', 'TV-MA']);

export function normalizeRating(value = '') {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
}

export function isAdultRated(item = {}) {
  const rating = normalizeRating(item.content_rating || item.age_rating || item.rating_label);
  const notes = `${item.title || ''} ${item.synopsis || ''} ${item.content_notes || ''} ${(item.genres || []).join(' ')}`.toLowerCase();
  return Boolean(item.is_adult) || ADULT_RATINGS.has(rating) || /\b(x-rated|xxx|nc-17|r18\+|x18\+|adult|snuff)\b/i.test(notes);
}

export function filterMainAppSafeMedia(items = []) {
  return (items || []).filter(item => !isAdultRated(item));
}

export function canAccessAdultContent() {
  return sessionStorage.getItem('ev_vault_unlocked') === 'true';
}