import 'server-only';
import { prisma } from '@/lib/prisma';
import type { Session, Match } from '@/generated/prisma/client';

export async function loadSession(id: string): Promise<Session | null> {
  return prisma.session.findUnique({ where: { id } });
}

export async function loadMatches(sessionId: string): Promise<Match[]> {
  return prisma.match.findMany({
    where: { sessionId },
    orderBy: { rowIndex: 'asc' },
  });
}

export async function loadSessionWithMatches(
  id: string,
): Promise<(Session & { matches: Match[] }) | null> {
  return prisma.session.findUnique({
    where: { id },
    include: { matches: { orderBy: { rowIndex: 'asc' } } },
  });
}
