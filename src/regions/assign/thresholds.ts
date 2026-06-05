// Engine thresholds.
//
// FALLBACK_KM is the radius around a hotel within which a non-containing
// region centroid still earns a "nearest region" review suggestion. Beyond
// this distance the hotel is treated as genuinely outside the seeded
// destination and routed to UNASSIGNED. 10 km is a metro-scale value —
// large enough to catch hotels mis-placed by a few hundred metres or
// hand-coordinates that landed offshore, small enough that hotels in a
// different city don't pick up a misleading suggestion.

export const FALLBACK_KM = 10;
