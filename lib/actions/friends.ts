"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import type { ActionState } from "@/lib/actions/auth";

export async function searchUsersAction(query: string) {
  const user = await requireUser();
  if (!query.trim()) return [];

  const users = await db.user.findMany({
    where: {
      AND: [
        { id: { not: user.id } },
        {
          OR: [
            { email: { contains: query, mode: "insensitive" } },
            { name: { contains: query, mode: "insensitive" } },
          ],
        },
      ],
    },
    select: { id: true, name: true, email: true },
    take: 10,
  });

  const friendships = await db.friendship.findMany({
    where: {
      OR: [{ requesterId: user.id }, { addresseeId: user.id }],
      AND: {
        OR: [
          { requesterId: { in: users.map((u) => u.id) } },
          { addresseeId: { in: users.map((u) => u.id) } },
        ],
      },
    },
  });

  return users.map((u) => {
    const friendship = friendships.find(
      (f) =>
        (f.requesterId === user.id && f.addresseeId === u.id) ||
        (f.addresseeId === user.id && f.requesterId === u.id),
    );
    return {
      ...u,
      friendshipStatus: friendship?.status ?? null,
      friendshipId: friendship?.id ?? null,
      isRequester: friendship?.requesterId === user.id,
    };
  });
}

export async function sendFriendRequestAction(
  addresseeId: string,
): Promise<ActionState> {
  const user = await requireUser();
  if (addresseeId === user.id) {
    return { error: "You cannot add yourself" };
  }

  const existing = await db.friendship.findFirst({
    where: {
      OR: [
        { requesterId: user.id, addresseeId },
        { requesterId: addresseeId, addresseeId: user.id },
      ],
    },
  });

  if (existing) {
    return { error: "Friend request already exists" };
  }

  await db.friendship.create({
    data: {
      requesterId: user.id,
      addresseeId,
      status: "PENDING",
    },
  });

  revalidatePath("/friends");
  return { success: "Friend request sent" };
}

export async function respondFriendRequestAction(
  friendshipId: string,
  accept: boolean,
): Promise<ActionState> {
  const user = await requireUser();
  const friendship = await db.friendship.findUnique({
    where: { id: friendshipId },
  });

  if (!friendship || friendship.addresseeId !== user.id) {
    return { error: "Friend request not found" };
  }

  if (friendship.status !== "PENDING") {
    return { error: "Request already handled" };
  }

  await db.friendship.update({
    where: { id: friendshipId },
    data: { status: accept ? "ACCEPTED" : "DECLINED" },
  });

  if (accept) {
    const existingPersonal = await db.group.findFirst({
      where: {
        isPersonal: true,
        AND: [
          { members: { some: { userId: user.id } } },
          { members: { some: { userId: friendship.requesterId } } },
        ],
      },
    });

    if (!existingPersonal) {
      const requester = await db.user.findUnique({
        where: { id: friendship.requesterId },
      });
      const currentUser = await db.user.findUnique({ where: { id: user.id } });
      if (requester && currentUser) {
        await db.group.create({
          data: {
            name: `${currentUser.name} & ${requester.name}`,
            isPersonal: true,
            createdById: user.id,
            members: {
              create: [
                { userId: user.id },
                { userId: friendship.requesterId },
              ],
            },
          },
        });
      }
    }
  }

  revalidatePath("/friends");
  revalidatePath("/groups");
  return { success: accept ? "Friend request accepted" : "Friend request declined" };
}

export async function getFriendsData() {
  const user = await requireUser();

  const friendships = await db.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: user.id }, { addresseeId: user.id }],
    },
    include: {
      requester: { select: { id: true, name: true, email: true } },
      addressee: { select: { id: true, name: true, email: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const pendingIncoming = await db.friendship.findMany({
    where: { addresseeId: user.id, status: "PENDING" },
    include: {
      requester: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const pendingOutgoing = await db.friendship.findMany({
    where: { requesterId: user.id, status: "PENDING" },
    include: {
      addressee: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const friends = friendships.map((f) =>
    f.requesterId === user.id ? f.addressee : f.requester,
  );

  return { friends, pendingIncoming, pendingOutgoing };
}
