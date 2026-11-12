// Content-based recommender using TF-IDF + cosine similarity.
//
// Idea in one line:
//   turn the user's profile and every startup into a list of weighted words,
//   then rank startups by how similar their words are to the user's words.

// Very common words that carry no meaning for matching
const STOP_WORDS = new Set([
  "the", "and", "for", "with", "that", "this", "are", "was", "our", "you",
  "your", "from", "have", "has", "will", "can", "all", "any", "but", "not",
  "who", "its", "into", "more", "about", "get", "use", "using", "new", "we",
  "is", "in", "on", "to", "of", "a", "an", "or", "as", "at", "by", "be",
]);

// Different spellings of the same thing
const ALIASES = {
  reactjs: "react",
  nodejs: "node",
  vuejs: "vue",
  nextjs: "next",
  javascript: "js",
  typescript: "ts",
  ml: "machinelearning",
  ai: "artificialintelligence",
};

// "startups" -> "startup", "apps" -> "app" (but keep "business", "css")
const stem = (word) =>
  word.length > 3 && word.endsWith("s") && !word.endsWith("ss")
    ? word.slice(0, -1)
    : word;

const tokenize = (text) => {
  // remove "-" so "front-end" and "frontend" become the same word
  const words =
    String(text).toLowerCase().replace(/-/g, "").match(/[a-z0-9+#]+/g) || [];

  return words
    .map((word) => ALIASES[word] || stem(word))
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
};

// parts = [[value, weight], ...]
// A bigger weight repeats the words more times, so they count more.
const toTokens = (parts) => {
  const tokens = [];

  for (const [value, weight] of parts) {
    const text = Array.isArray(value) ? value.join(" ") : value || "";
    const words = tokenize(text);

    for (let i = 0; i < weight; i++) {
      tokens.push(...words);
    }
  }

  return tokens;
};

// What describes a user (interests matter most)
const getUserTokens = (user) =>
  toTokens([
    [user.interests, 3],
    [user.skills, 2],
    [user.lookingFor, 2],
    [user.bio, 1],
  ]);

// What describes a startup (industry, tech and needs matter most)
const getStartupTokens = (startup) =>
  toTokens([
    [startup.title, 1],
    [startup.tagline, 1],
    [startup.industry, 2],
    [startup.techStack, 2],
    [startup.lookingFor, 2],
    [startup.description, 1],
  ]);

// IDF = how rare a word is across all startups.
// Rare words (e.g. "fintech") are more useful than common ones (e.g. "platform").
const buildIdf = (documents) => {
  const documentFrequency = new Map();

  documents.forEach((tokens) => {
    new Set(tokens).forEach((term) => {
      documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1);
    });
  });

  const idf = new Map();

  documentFrequency.forEach((count, term) => {
    idf.set(term, Math.log((documents.length + 1) / (count + 1)) + 1);
  });

  return idf;
};

// TF-IDF vector: word -> (how often it appears) x (how rare it is).
// Words that appear in no startup are skipped, because they can never match.
const toVector = (tokens, idf) => {
  const counts = new Map();

  tokens.forEach((term) => {
    counts.set(term, (counts.get(term) || 0) + 1);
  });

  const vector = new Map();

  counts.forEach((count, term) => {
    if (idf.has(term)) {
      vector.set(term, count * idf.get(term));
    }
  });

  return vector;
};

// 0 = nothing in common, 1 = identical
const cosineSimilarity = (a, b) => {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  a.forEach((weight, term) => {
    normA += weight * weight;

    if (b.has(term)) {
      dot += weight * b.get(term);
    }
  });

  b.forEach((weight) => {
    normB += weight * weight;
  });

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

// The words that helped most, so we can show "why recommended"
const getMatchedTerms = (userVector, startupVector, limit = 3) =>
  [...userVector.entries()]
    .filter(([term]) => startupVector.has(term))
    .map(([term, weight]) => [term, weight * startupVector.get(term)])
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term]) => term);

// Main function: returns startups sorted from best match to worst.
// Ties (and users with an empty profile) fall back to newest first.
const rankStartups = (user, startups) => {
  const documents = startups.map(getStartupTokens);
  const idf = buildIdf(documents);
  const userVector = toVector(getUserTokens(user), idf);

  return startups
    .map((startup, index) => {
      const startupVector = toVector(documents[index], idf);

      return {
        startup,
        score: cosineSimilarity(userVector, startupVector),
        matchedTerms: getMatchedTerms(userVector, startupVector),
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.startup.createdAt) - new Date(a.startup.createdAt)
    );
};

// Does the user have anything we can match on?
const hasProfileData = (user) => getUserTokens(user).length > 0;

module.exports = {
  tokenize,
  rankStartups,
  hasProfileData,
};
