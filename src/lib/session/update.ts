import 'server-only';
import { prisma } from '@/lib/prisma';

export async function updateMatchDecision(
  matchId: string,
  accepted: boolean,
): Promise<void> {
  if (accepted) {
    await prisma.match.update({
      where: { id: matchId },
      data: { status: 'accepted' },
    });
  } else {
    await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'rejected',
        selectedLocationId: null,
        selectedConfidence: null,
      },
    });
  }
}

export async function updateSessionProgress(
  sessionId: string,
  rowsProcessed: number,
  status?: string,
): Promise<void> {
  await prisma.session.update({
    where: { id: sessionId },
    data: {
      rowsProcessed,
      ...(status ? { status } : {}),
    },
  });
}
