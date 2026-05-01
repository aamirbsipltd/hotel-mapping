import { rankCandidates, classify, type SourceHotel, type CandidateHotel } from '../src/lib/matching/score';

type Fixture = {
  source: SourceHotel;
  candidates: CandidateHotel[];
  expectedWinnerId: string;
  note?: string;
};

// 20 known-good fixtures covering a range of matching scenarios.
// Classification is whatever the algorithm produces — the key invariant is
// that the correct candidate wins.
const fixtures: Fixture[] = [
  // Perfect name + coord match
  {
    source: { id: '1', name: 'Grand Palace Lisbon', latitude: 38.71, longitude: -9.14, address: 'Rua das Flores 123' },
    candidates: [
      { locationId: 'ta1', name: 'Grand Palace Hotel Lisbon', latitude: 38.71, longitude: -9.14, address: 'Rua das Flores 123' },
      { locationId: 'ta2', name: 'Some Other Lisbon Hotel', latitude: 38.70, longitude: -9.13 },
    ],
    expectedWinnerId: 'ta1',
  },
  // Partial name overlap — "Hotel Adlon" subset of "Hotel Adlon Kempinski"
  {
    source: { id: '2', name: 'Hotel Adlon', latitude: 52.52, longitude: 13.38 },
    candidates: [
      { locationId: 'ta3', name: 'Hotel Adlon Kempinski', latitude: 52.52, longitude: 13.38 },
      { locationId: 'ta4', name: 'Berlin Mitte Hotel', latitude: 52.51, longitude: 13.40 },
    ],
    expectedWinnerId: 'ta3',
    note: 'Partial overlap — Adlon tokens match even though Kempinski is extra',
  },
  // Source longer than candidate
  {
    source: { id: '3', name: 'Marriott City Centre Manchester', latitude: 53.48, longitude: -2.24 },
    candidates: [
      { locationId: 'ta5', name: 'Manchester Marriott', latitude: 53.48, longitude: -2.24 },
      { locationId: 'ta6', name: 'Hilton Manchester', latitude: 53.48, longitude: -2.25 },
    ],
    expectedWinnerId: 'ta5',
    note: 'Token overlap wins over completely wrong brand',
  },
  // "The" article in candidate name
  {
    source: { id: '4', name: 'Ritz Paris', latitude: 48.87, longitude: 2.33 },
    candidates: [
      { locationId: 'ta7', name: 'The Ritz Paris', latitude: 48.87, longitude: 2.33 },
    ],
    expectedWinnerId: 'ta7',
    note: '"The" is a stopword, stripped during tokenisation',
  },
  // W Hotel — abbreviation vs full form
  {
    source: { id: '5', name: 'W Hotel Barcelona', latitude: 41.37, longitude: 2.19 },
    candidates: [
      { locationId: 'ta8', name: 'W Barcelona', latitude: 41.37, longitude: 2.19 },
      { locationId: 'ta9', name: 'Arts Barcelona', latitude: 41.38, longitude: 2.20 },
    ],
    expectedWinnerId: 'ta8',
  },
  // Translated city — "Milan" vs "Milano"
  {
    source: { id: '6', name: 'Four Seasons Milan', latitude: 45.46, longitude: 9.19 },
    candidates: [
      { locationId: 'ta10', name: 'Four Seasons Hotel Milano', latitude: 45.46, longitude: 9.19 },
      { locationId: 'ta11', name: 'Park Hyatt Milan', latitude: 45.46, longitude: 9.19 },
    ],
    expectedWinnerId: 'ta10',
    note: '"Four Seasons" tokens match; "Milan" vs "Milano" reduces but coord seals it',
  },
  // Chain trap — same name at different locations; location-specific candidate should win
  {
    source: { id: '7', name: 'Hilton Garden Inn', latitude: 40.42, longitude: -3.71 },
    candidates: [
      { locationId: 'ta12', name: 'Hilton Garden Inn Madrid', latitude: 40.42, longitude: -3.71 },
      { locationId: 'ta13', name: 'Hilton Garden Inn', latitude: 41.39, longitude: 2.17 },
    ],
    expectedWinnerId: 'ta12',
    note: 'Coord match beats generic name; far-away same-name should not win',
  },
  // Exact match
  {
    source: { id: '8', name: 'Mandarin Oriental Hong Kong', latitude: 22.28, longitude: 114.16 },
    candidates: [
      { locationId: 'ta14', name: 'Mandarin Oriental Hong Kong', latitude: 22.28, longitude: 114.16 },
    ],
    expectedWinnerId: 'ta14',
  },
  // Same brand, different locations — closest wins
  {
    source: { id: '9', name: 'Novotel Paris Centre', latitude: 48.86, longitude: 2.35 },
    candidates: [
      { locationId: 'ta15', name: 'Novotel Paris Centre Tour Eiffel', latitude: 48.85, longitude: 2.29 },
      { locationId: 'ta16', name: 'Novotel Paris Centre Gare Montparnasse', latitude: 48.84, longitude: 2.32 },
    ],
    expectedWinnerId: 'ta15',
    note: 'Both have same tokens; Tour Eiffel is slightly closer',
  },
  // Clearly wrong match
  {
    source: { id: '10', name: 'Budget Inn Express', latitude: 33.45, longitude: -112.07 },
    candidates: [
      { locationId: 'ta17', name: 'Phoenix Marriott Resort', latitude: 33.61, longitude: -111.90 },
    ],
    expectedWinnerId: 'ta17',
    note: 'Only candidate; will be auto_reject — correct behavior',
  },
  // Same chain, close candidates — TSR favours shorter candidate with higher overlap ratio
  {
    source: { id: '11', name: 'Ibis Styles Paris Gare du Nord', latitude: 48.88, longitude: 2.36 },
    candidates: [
      { locationId: 'ta18', name: 'Ibis Styles Paris Gare du Nord Chateau Landon', latitude: 48.88, longitude: 2.36 },
      { locationId: 'ta19', name: 'Ibis Paris Gare du Nord', latitude: 48.88, longitude: 2.36 },
    ],
    expectedWinnerId: 'ta19',
    note: 'ta19 TSR = 5/6 = 0.83; ta18 TSR = 6/8 = 0.75 — both go to manual review for human disambiguation',
  },
  // Hyphenated brand name
  {
    source: { id: '12', name: 'Shangri La Hotel Sydney', latitude: -33.87, longitude: 151.21 },
    candidates: [
      { locationId: 'ta20', name: 'Shangri-La Sydney', latitude: -33.87, longitude: 151.21 },
    ],
    expectedWinnerId: 'ta20',
    note: 'Hyphen stripped to space — "shangri" and "la" tokenise correctly',
  },
  // Source is the brand without city; candidates have city
  {
    source: { id: '13', name: 'Park Inn by Radisson', latitude: 55.75, longitude: 37.62 },
    candidates: [
      { locationId: 'ta21', name: 'Park Inn by Radisson Moscow City', latitude: 55.75, longitude: 37.62 },
      { locationId: 'ta22', name: 'Park Inn Moscow', latitude: 55.74, longitude: 37.63 },
    ],
    expectedWinnerId: 'ta21',
    note: '"by radisson" tokens overlap with ta21 more than ta22',
  },
  // Phone matching boosts score
  {
    source: { id: '14', name: 'Ace Hotel London', latitude: 51.53, longitude: -0.08, phone: '+442077030000' },
    candidates: [
      { locationId: 'ta23', name: 'Ace Hotel London Shoreditch', latitude: 51.53, longitude: -0.08, phone: '02077030000' },
      { locationId: 'ta24', name: 'The Hoxton Shoreditch', latitude: 51.52, longitude: -0.07 },
    ],
    expectedWinnerId: 'ta23',
    note: 'Phone match and coord match clinch it over Hoxton',
  },
  // Token reordering — "Grand Hyatt Tokyo" vs "Tokyo Grand Hyatt"
  {
    source: { id: '15', name: 'Grand Hyatt Tokyo', latitude: 35.66, longitude: 139.73 },
    candidates: [
      { locationId: 'ta25', name: 'Tokyo Grand Hyatt', latitude: 35.66, longitude: 139.73 },
      { locationId: 'ta26', name: 'Park Hyatt Tokyo', latitude: 35.69, longitude: 139.70 },
    ],
    expectedWinnerId: 'ta25',
    note: 'TSR = 1.0 for reordered tokens; Park Hyatt has different first token',
  },
  // Address number helps
  {
    source: { id: '16', name: 'One Aldwych Hotel London', latitude: 51.51, longitude: -0.12, address: '1 Aldwych London' },
    candidates: [
      { locationId: 'ta27', name: 'One Aldwych', latitude: 51.51, longitude: -0.12, address: '1 Aldwych London WC2B 4BZ' },
      { locationId: 'ta28', name: 'The Strand Hotel', latitude: 51.51, longitude: -0.12 },
    ],
    expectedWinnerId: 'ta27',
    note: '"one aldwych" tokens match; street number 1 boosts address score',
  },
  // Token reordering with city — "Marriott Marquis New York" vs "New York Marriott Marquis"
  {
    source: { id: '17', name: 'Marriott Marquis New York', latitude: 40.76, longitude: -73.99 },
    candidates: [
      { locationId: 'ta29', name: 'New York Marriott Marquis', latitude: 40.76, longitude: -73.99 },
    ],
    expectedWinnerId: 'ta29',
  },
  // Same base name, translated city
  {
    source: { id: '18', name: 'Hotel de la Paix Geneva', latitude: 46.20, longitude: 6.15 },
    candidates: [
      { locationId: 'ta30', name: 'La Reserve Geneve', latitude: 46.21, longitude: 6.13 },
      { locationId: 'ta31', name: 'Hotel de la Paix Geneve', latitude: 46.20, longitude: 6.15 },
    ],
    expectedWinnerId: 'ta31',
    note: '"de la paix" tokens match ta31; coords seal it',
  },
  // Long exact name
  {
    source: { id: '19', name: 'Sofitel Cairo Nile El Gezirah', latitude: 30.05, longitude: 31.22 },
    candidates: [
      { locationId: 'ta32', name: 'Sofitel Cairo Nile El Gezirah', latitude: 30.05, longitude: 31.22 },
    ],
    expectedWinnerId: 'ta32',
  },
  // Completely wrong — should be solo auto_reject winner (only candidate available)
  {
    source: { id: '20', name: 'Unknown Property XYZ123', latitude: 0, longitude: 0 },
    candidates: [
      { locationId: 'ta33', name: 'Ritz Carlton New York', latitude: 40.76, longitude: -73.97 },
    ],
    expectedWinnerId: 'ta33',
    note: 'Only candidate; correctly classified as auto_reject',
  },
];

let passed = 0;
let failed = 0;
const counts: Record<string, number> = { auto_accept: 0, manual_review: 0, auto_reject: 0 };

console.log('\nRunning matching fixture tests...\n');

for (const fixture of fixtures) {
  const ranked = rankCandidates(fixture.source, fixture.candidates);
  const winner = ranked[0];
  const classification = classify(winner.breakdown.totalScore);

  counts[classification] = (counts[classification] ?? 0) + 1;

  const correctWinner = winner.candidate.locationId === fixture.expectedWinnerId;

  if (correctWinner) {
    passed++;
    console.log(`✓ [${fixture.source.id}] ${fixture.source.name}`);
    console.log(`    → ${winner.candidate.name} (${(winner.breakdown.totalScore * 100).toFixed(1)}% — ${classification})`);
    if (fixture.note) console.log(`    note: ${fixture.note}`);
    console.log();
  } else {
    failed++;
    console.log(`✗ [${fixture.source.id}] ${fixture.source.name}`);
    console.log(`    Expected winner: ${fixture.expectedWinnerId}`);
    console.log(`    Got:             ${winner.candidate.locationId} — ${winner.candidate.name}`);
    console.log(`    Score: ${(winner.breakdown.totalScore * 100).toFixed(1)}% (${classification})`);
    if (fixture.note) console.log(`    note: ${fixture.note}`);
    console.log();
  }
}

console.log('─'.repeat(60));
console.log(`Results: ${passed}/${fixtures.length} correct winner, ${failed} wrong winner`);
console.log(`Classifications: ${counts['auto_accept']} auto_accept, ${counts['manual_review']} manual_review, ${counts['auto_reject']} auto_reject`);

if (failed > 0) process.exit(1);
