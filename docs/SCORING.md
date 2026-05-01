# How the Matching Algorithm Works

This document explains the scoring algorithm that maps hotel names to Tripadvisor Location IDs. It is written for an agency reviewer who wants to understand why a match was accepted, rejected, or flagged for review before trusting the output.

---

## Why not a black-box ML model?

Most hotel-mapping tools on the market are AI-based black boxes. You upload a CSV, you get back a file, and you have no way to understand why property X matched to Tripadvisor ID Y — or why it didn't.

That opacity is a problem for agencies. When a hotel page shows the wrong Tripadvisor rating, the damage is real: inaccurate reviews, wrong star counts, guest complaints. You can't audit a black box.

This tool uses a deterministic, four-signal scoring algorithm. Every match shows its breakdown. You can see exactly which signal drove the confidence score, and you can override any match through the review queue.

---

## The four signals

### 1. Name similarity (45% weight)

Hotel names are noisy. The same property might be listed as "Grand Palace Hotel Lisbon" in your inventory and "Grand Palace Lisbon" in Tripadvisor. Two metrics are combined:

**Levenshtein similarity** (25% of name score): Edit distance between the two strings, normalised to [0, 1]. Catches typos and minor variations like "Hyat" vs "Hyatt".

**Token-set ratio** (75% of name score): The two names are tokenised (lowercased, diacritics stripped, punctuation removed) and common stopwords removed. Tokens that are generic hotel suffixes — "hotel", "resort", "inn", "suites", "lodge", "palace", "plaza" — are stripped as low-signal noise. The remaining content tokens are compared as sets using Jaccard similarity (intersection ÷ union).

Token-set ratio carries more weight because hotels with the same content tokens but different word order are clearly the same property. "Grand Hotel Lisbon" and "Lisbon Grand Hotel" produce a perfect token-set score of 1.0 even though Levenshtein would score them low.

The combined formula:

```
nameSimilarity = 0.25 × levenshteinSimilarity + 0.75 × tokenSetRatio
```

### 2. Geographic distance (30% weight)

When coordinates are available, the Haversine formula calculates the great-circle distance between source and candidate in kilometres. The distance is converted to a score on a deliberate cliff-and-decay curve:

| Distance | Score |
|---|---|
| ≤ 0.1 km | 1.0 |
| ≤ 0.5 km | 0.9 |
| ≤ 1.0 km | 0.7 |
| ≤ 2.0 km | 0.5 |
| ≤ 5.0 km | 0.2 |
| > 5.0 km | 0.0 |

The cliff at 0.1 km matters. Hotels in the same building are often different properties — a hotel and a hostel sharing a structure, for example — but two hotels 200 m apart are almost certainly different. We do not want coordinate-only false positives for nearby but distinct properties.

### 3. Address similarity (20% weight)

Address strings are highly variable across data sources: abbreviations differ, postcodes may be absent, city suffixes may be included or excluded. We use token overlap rather than exact string matching.

Street numbers are treated as high-diagnostic signals. If both the source and candidate address contain the same street number, the score receives a 0.15 bonus (capped at 1.0). A shared number is a strong signal that two addresses refer to the same building.

Address similarity is only applied when both the source and candidate have address data. When either is absent, the signal is dropped and the remaining weights are renormalised.

### 4. Phone matching (5% weight)

Phone numbers are normalised to digits only and compared by their trailing 7 digits. This handles the most common formatting differences (country code presence, spaces, dashes, leading zeros). A match sets this signal to 1.0; a mismatch or missing number sets it to 0.

Phone matching carries a small weight because many hotels share phone numbers across booking systems, and Tripadvisor phone data is inconsistently populated. It is a tiebreaker, not a primary signal.

---

## Weight renormalisation for missing data

Not all source records have coordinates, addresses, or phone numbers. When a signal is unavailable, its weight is redistributed proportionally to the remaining active signals.

For example, if a record has name and coordinates but no address or phone:
- Active weights: name (0.45) + distance (0.30) = 0.75
- Renormalised: name contributes 0.45/0.75 = 60%, distance contributes 0.30/0.75 = 40%

This ensures the score stays on the [0, 1] scale and missing data does not artificially suppress confident matches.

---

## Classification thresholds

| Score | Classification | Meaning |
|---|---|---|
| ≥ 0.85 | auto_accept | High confidence. False positives rare at this score. |
| 0.55 – 0.84 | manual_review | Ambiguous. Human review distinguishes here. |
| < 0.55 | auto_reject | Low confidence. Likely a different property. |

These thresholds are conservative by design. The review queue exists precisely for the 0.55–0.85 band, where the algorithm identifies good candidates but does not commit without human confirmation.

---

## Weighting rationale

| Signal | Weight | Why |
|---|---|---|
| Name | 45% | Strongest single signal. Hotels with unique names almost never share them. |
| Distance | 30% | Very strong for nearby cities, essential for chain hotel disambiguation. |
| Address | 20% | High precision when available, but frequently missing or malformatted. |
| Phone | 5% | Useful tiebreaker; unreliable as a primary signal due to data gaps. |

The name–distance pair (75% combined) is the workhorse. The address and phone signals are bonuses that push confident matches firmly into auto_accept territory.

---

## Known failure modes

### Chain hotels with shared names

The Hilton Garden Inn has hundreds of properties worldwide. If your source record has accurate coordinates, the distance signal correctly disambiguates them. Without coordinates, name similarity alone will produce a near-identical score for every "Hilton Garden Inn" candidate — these will go to manual review, which is the correct outcome.

Mitigation: ensure your inventory includes coordinates for chain hotel records.

### Hotels in the same building

Two hotels at coordinates (48.8720, 2.3300) and (48.8720, 2.3300) — identical to four decimal places — will both score 1.0 on distance. Name similarity becomes the sole discriminant. If the names are also similar (e.g., branded suites co-located with a main hotel), both may score above the auto_accept threshold.

Mitigation: check address and phone signals. Building-sharing properties typically have the same address but different phone numbers.

### Recently renamed properties

A hotel renamed from "Hotel X" to "Hotel Y" after your inventory was last updated will score poorly on name similarity. Distance will still identify the correct location if coordinates are present, but the total score may fall into manual_review.

Mitigation: treat manual_review results as a changelog — they often reveal stale names in your inventory.

### Translated city names

"Milan" (English) vs "Milano" (Italian) will not match as tokens. If both source and candidate have coordinates, the distance signal compensates. Without coordinates, this will produce a lower name score.

Mitigation: normalise city name language in your source data before upload, or rely on coordinates.

### Very short hotel names

Single-word names like "Ace" or "W" have small token sets. A token-set ratio of 1.0 is achievable with very few shared tokens, which means short names offer less discrimination. The Levenshtein component partially compensates.

Mitigation: add address or coordinates to disambiguate single-word brand names.

---

## How to tune thresholds

The thresholds (0.85 / 0.55) reflect conservative defaults suited for agencies that prefer human review of ambiguous matches over automated false positives.

If your inventory has high-quality coordinates and clean names, you may be able to raise the manual_review→auto_accept threshold to 0.80. If you have a high tolerance for false positives (e.g., you will manually audit the full output anyway), you can lower it.

Contact us if you are processing a large inventory and want a calibration run on a labelled sample.

---

## How to report a wrong match

If the algorithm auto-accepted a match that is incorrect, use the "Reject" button in the results UI. This removes the match from your export and adds it to the review queue for re-examination.

If a match you expected to be auto-accepted is in manual review, the score breakdown will show which signal is dragging the score down. The most common causes are: coordinates missing from your source record, or a name variation that reduces token overlap.
