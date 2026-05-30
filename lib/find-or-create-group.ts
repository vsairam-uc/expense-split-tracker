import { db } from "@/lib/db";

export async function findOrCreateGroupForParticipants(
  userId: string,
  participantIds: string[],
  paidById: string,
): Promise<string> {
  const memberIds = Array.from(new Set([...participantIds, paidById]));

  const users = await db.user.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, name: true },
  });
  const nameById = new Map(users.map((u) => [u.id, u.name]));

  const candidates = await db.group.findMany({
    where: {
      deletedAt: null,
      AND: [
        ...memberIds.map((id) => ({
          members: { some: { userId: id } },
        })),
        {
          members: {
            none: {
              userId: { notIn: memberIds },
            },
          },
        },
      ],
    },
    include: { members: true },
  });

  const existing = candidates.find((g) => g.members.length === memberIds.length);
  if (existing) return existing.id;

  const isPersonal = memberIds.length === 2;
  const names = memberIds
    .map((id) => nameById.get(id) ?? "Unknown")
    .sort((a, b) => a.localeCompare(b));

  const name = isPersonal
    ? names.join(" & ")
    : names.length <= 3
      ? names.join(", ")
      : `${names.slice(0, 2).join(", ")} & ${names.length - 2} others`;

  const group = await db.group.create({
    data: {
      name,
      isPersonal,
      createdById: userId,
      members: {
        create: memberIds.map((id) => ({ userId: id })),
      },
    },
  });

  return group.id;
}
