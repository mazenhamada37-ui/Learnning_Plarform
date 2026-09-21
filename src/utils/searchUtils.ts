// Arabic search normalization and robust, accurate search matching & scoring

export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    // Remove Arabic diacritics (tashkeel)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Normalize Alef variants: أ, إ, آ, ٱ -> ا
    .replace(/[أإآٱ]/g, 'ا')
    // Normalize Yeh / Alef Maksura: ى, ئ -> ي
    .replace(/[ىئ]/g, 'ي')
    // Normalize Teh Marbuta: ة -> ه
    .replace(/ة/g, 'ه')
    // Normalize Waw with Hamza: ؤ -> و
    .replace(/ؤ/g, 'و')
    // Remove tatweel (kashida)
    .replace(/\u0640/g, '')
    // Remove extra punctuation and whitespace
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»[\]\\]/g, ' ')
    .replace(/\s+/g, ' ');
}

// Common Arabic stop words that should not trigger false positives if user searches for them alongside keywords
const STOP_WORDS = new Set([
  'في', 'من', 'على', 'إلى', 'الي', 'عن', 'مع', 'هذا', 'هذه', 'تم', 'ما', 'هو', 'هي', 'أن', 'ان', 'لا'
]);

/**
 * Calculates a search relevance score for a course.
 * Returns 0 if there is NO genuine match.
 * Returns > 0 if matched, with higher scores for matches in title, tags, or category.
 */
export function getCourseSearchScore(
  course: {
    title: string;
    subtitle?: string;
    description?: string;
    category?: string;
    instructor?: { name: string };
    tags?: string[];
  },
  rawQuery: string
): number {
  if (!rawQuery || !rawQuery.trim()) return 1;

  const normQuery = normalizeArabic(rawQuery);
  if (!normQuery) return 1;

  const rawTokens = normQuery.split(' ').filter(Boolean);
  // Filter out standalone stop words if there are multiple words
  const queryTokens = rawTokens.length > 1
    ? rawTokens.filter(tok => !STOP_WORDS.has(tok))
    : rawTokens;

  if (queryTokens.length === 0) return 0;

  const normTitle = normalizeArabic(course.title || '');
  const normCategory = normalizeArabic(course.category || '');
  const normInstructor = normalizeArabic(course.instructor?.name || '');
  const normTags = (course.tags || []).map(t => normalizeArabic(t));
  const normSubtitle = normalizeArabic(course.subtitle || '');

  let score = 0;

  // 1. Exact phrase match in Title (Highest priority)
  if (normTitle.includes(normQuery)) {
    score += 100;
  }

  // 2. Exact phrase match in Tags or Category
  if (normTags.some(t => t.includes(normQuery) || normQuery.includes(t))) {
    score += 80;
  }
  if (normCategory.includes(normQuery)) {
    score += 70;
  }
  if (normInstructor.includes(normQuery)) {
    score += 60;
  }
  if (normSubtitle.includes(normQuery)) {
    score += 30;
  }

  // 3. Token-by-token verification
  // Every substantive query token MUST be found in either title, tags, category, instructor, or subtitle
  const allTokensMatch = queryTokens.every(tok => {
    // Check Title
    if (normTitle.includes(tok)) return true;
    // Check Category
    if (normCategory.includes(tok)) return true;
    // Check Tags
    if (normTags.some(t => t.includes(tok))) return true;
    // Check Instructor
    if (normInstructor.includes(tok)) return true;
    // Check Subtitle
    if (normSubtitle.includes(tok)) return true;

    return false;
  });

  if (!allTokensMatch) {
    // If not all tokens match across the course metadata, do not display unrelated courses
    return 0;
  }

  // Calculate additional token score bonuses
  queryTokens.forEach(tok => {
    if (normTitle.includes(tok)) score += 20;
    if (normTags.some(t => t.includes(tok))) score += 15;
    if (normCategory.includes(tok)) score += 10;
    if (normInstructor.includes(tok)) score += 8;
  });

  return score;
}

/**
 * Simple boolean check: does the course genuinely match the query?
 */
export function isCourseMatched(
  course: {
    title: string;
    subtitle?: string;
    description?: string;
    category?: string;
    instructor?: { name: string };
    tags?: string[];
  },
  query: string
): boolean {
  return getCourseSearchScore(course, query) > 0;
}
