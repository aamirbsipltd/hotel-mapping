import 'server-only';
import { prisma } from '@/lib/prisma';
import { tripadvisor } from '@/lib/tripadvisor/client';
import { rankCandidates, classify, type SourceHotel, type CandidateHotel } from './score';
import { parseLatLng, addressToString } from '@/lib/tripadvisor/types';
import type { TaLocationMatch } from '@/lib/tripadvisor/types';

function taMatchToCandidate(m: TaLocationMatch): CandidateHotel {
  return {
    locationId: m.location_id,
    name: m.name,
    address: addressToString(m.address_obj),
    latitude: parseLatLng(m.latitude),
    longitude: parseLatLng(m.longitude),
    phone: m.phone,
  };
}

export async function runMatchingPipeline(
  sessionId: string,
  apiKey?: string,
): Promise<void> {
  try {
    await prisma.session.update({
      where: { id: sessionId },
      data: { status: 'processing' },
    });

    const matches = await prisma.match.findMany({
      where: { sessionId, status: 'pending' },
      orderBy: { rowIndex: 'asc' },
    });

    let processed = 0;

    for (const match of matches) {
      try {
        const source: SourceHotel = {
          id: match.sourceId,
          name: match.sourceName,
          city: match.sourceCity ?? undefined,
          country: match.sourceCountry ?? undefined,
          address: match.sourceAddress ?? undefined,
          latitude: match.sourceLat ?? undefined,
          longitude: match.sourceLng ?? undefined,
          phone: match.sourcePhone ?? undefined,
        };

        const query = [match.sourceName, match.sourceCity, match.sourceCountry]
          .filter(Boolean)
          .join(' ');

        const latLong =
          match.sourceLat != null && match.sourceLng != null
            ? `${match.sourceLat},${match.sourceLng}`
            : undefined;

        // Primary: location_mapper
        let taMatches: TaLocationMatch[] = [];
        try {
          const mapperResult = await tripadvisor.locationMapper(
            {
              query,
              latitude: source.latitude,
              longitude: source.longitude,
              phone: source.phone,
              address: source.address,
            },
            apiKey,
          );
          taMatches = mapperResult.data;
        } catch {
          // Fall through to search fallback
        }

        // Fallback: location/search
        if (taMatches.length === 0) {
          try {
            const searchResult = await tripadvisor.locationSearch(
              { query, latLong },
              apiKey,
            );
            taMatches = searchResult.data;
          } catch {
            // No candidates available
          }
        }

        if (taMatches.length === 0) {
          await prisma.match.update({
            where: { id: match.id },
            data: {
              status: 'no_candidates',
              updatedAt: new Date(),
            },
          });
        } else {
          const candidates = taMatches.map(taMatchToCandidate);
          const ranked = rankCandidates(source, candidates);
          const top5 = ranked.slice(0, 5);
          const best = top5[0];
          const classification = classify(best.breakdown.totalScore);

          const status =
            classification === 'auto_accept'
              ? 'auto_accepted'
              : classification === 'manual_review'
              ? 'manual_review'
              : 'auto_rejected';

          await prisma.match.update({
            where: { id: match.id },
            data: {
              status,
              candidatesJson: JSON.stringify(top5),
              selectedLocationId:
                classification === 'auto_accept' ? best.candidate.locationId : null,
              selectedConfidence: best.breakdown.totalScore,
              updatedAt: new Date(),
            },
          });
        }
      } catch (err) {
        await prisma.match.update({
          where: { id: match.id },
          data: {
            status: 'error',
            errorMessage: err instanceof Error ? err.message : String(err),
            updatedAt: new Date(),
          },
        });
      }

      processed++;
      await prisma.session.update({
        where: { id: sessionId },
        data: { rowsProcessed: processed },
      });
    }

    await prisma.session.update({
      where: { id: sessionId },
      data: { status: 'done' },
    });
  } catch (err) {
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'failed',
        errorMessage: err instanceof Error ? err.message : String(err),
      },
    });
  }
}
