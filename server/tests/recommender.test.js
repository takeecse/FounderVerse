// Run with:  node --test server/tests
const test = require("node:test");
const assert = require("node:assert");
const { tokenize, rankStartups, hasProfileData } = require("../utils/recommender");

const startups = [
  {
    title: "PayFlow",
    tagline: "Payments for small shops",
    description: "A fintech app that helps shops accept digital payments.",
    industry: "Fintech",
    techStack: ["React", "Node.js", "MongoDB"],
    lookingFor: ["Frontend Developer"],
    createdAt: "2026-01-01",
  },
  {
    title: "MediTrack",
    tagline: "Patient records made simple",
    description: "Healthcare platform for clinics.",
    industry: "Healthcare",
    techStack: ["Python", "Django"],
    lookingFor: ["Backend Developer", "Designer"],
    createdAt: "2026-02-01",
  },
  {
    title: "FarmLink",
    tagline: "Connecting farmers to buyers",
    description: "Agriculture marketplace.",
    industry: "Agriculture",
    techStack: ["Flutter"],
    lookingFor: ["Mobile Developer"],
    createdAt: "2026-03-01",
  },
];

test("tokenize cleans and normalizes text", () => {
  assert.deepStrictEqual(tokenize("Front-End Developers"), ["frontend", "developer"]);
  assert.deepStrictEqual(tokenize("ReactJS and the apps"), ["react", "app"]);
});

test("startup matching the user's skills and interests ranks first", () => {
  const user = {
    skills: ["React", "JavaScript"],
    interests: ["Fintech"],
    lookingFor: [],
    bio: "Frontend developer",
  };

  const ranked = rankStartups(user, startups);

  assert.strictEqual(ranked[0].startup.title, "PayFlow");
  assert.ok(ranked[0].score > ranked[1].score);
  assert.ok(ranked[0].matchedTerms.includes("fintech"));
});

test("different user gets a different first result", () => {
  const user = { skills: ["Python"], interests: ["Healthcare"], lookingFor: [], bio: "" };

  assert.strictEqual(rankStartups(user, startups)[0].startup.title, "MediTrack");
});

test("empty profile falls back to newest first with score 0", () => {
  const user = { skills: [], interests: [], lookingFor: [], bio: "" };
  const ranked = rankStartups(user, startups);

  assert.strictEqual(hasProfileData(user), false);
  assert.strictEqual(ranked[0].startup.title, "FarmLink");
  assert.ok(ranked.every((item) => item.score === 0));
});
