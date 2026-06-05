// Confidence routing thresholds for the FastX classifier.
//
// Same convention as the hotel matcher (src/lib/matching/score.ts) — auto
// at 0.85, review band down to 0.55, below = review unclassified.

export const FASTX_AUTO_THRESHOLD = 0.85;
export const FASTX_REVIEW_THRESHOLD = 0.55;
