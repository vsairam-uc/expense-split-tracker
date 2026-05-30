"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  createGroupSchema,
  updateGroupSchema,
} from "@/lib/validations/group";
import {
  getAcceptedFriendIds,
  requireGroupMember,
  requireUser,
} from "@/lib/session";
import type { ActionState } from "@/lib/actions/auth";

export async function createGroupAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const memberIds = formData.getAll("memberIds") as string[];

  const parsed = createGroupSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    memberIds,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const friendIds = await getAcceptedFriendIds(user.id);
  const invalidMembers = parsed.data.memberIds.filter(
    (id) => id !== user.id && !friendIds.includes(id),
  );
  if (invalidMembers.length > 0) {
    return { error: "All members must be your friends" };
  }

  const allMemberIds = Array.from(
    new Set([user.id, ...parsed.data.memberIds]),
  );

  const group = await db.group.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      createdById: user.id,
      members: {
        create: allMemberIds.map((userId) => ({ userId })),
      },
    },
  });

  redirect(`/groups/${group.id}`);
}

export async function updateGroupAction(
  groupId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  await requireGroupMember(groupId, user.id);

  const parsed = updateGroupSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await db.group.update({
    where: { id: groupId },
    data: parsed.data,
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: "Group updated" };
}

export async function addGroupMemberAction(
  groupId: string,
  memberId: string,
): Promise<ActionState> {
  const user = await requireUser();
  await requireGroupMember(groupId, user.id);

  const friendIds = await getAcceptedFriendIds(user.id);
  if (!friendIds.includes(memberId)) {
    return { error: "User must be your friend" };
  }

  const existing = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: memberId } },
  });
  if (existing) {
    return { error: "User is already a member" };
  }

  await db.groupMember.create({
    data: { groupId, userId: memberId },
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: "Member added" };
}

export async function removeGroupMemberAction(
  groupId: string,
  memberId: string,
): Promise<ActionState> {
  const user = await requireUser();
  await requireGroupMember(groupId, user.id);

  const group = await db.group.findUnique({
    where: { id: groupId },
    include: { members: true },
  });

  if (!group) return { error: "Group not found" };
  if (group.members.length <= 2) {
    return { error: "Group must have at least 2 members" };
  }

  await db.groupMember.delete({
    where: { groupId_userId: { groupId, userId: memberId } },
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: "Member removed" };
}

export async function getGroupsData() {
  const user = await requireUser();

  const memberships = await db.groupMember.findMany({
    where: { userId: user.id, group: { deletedAt: null } },
    include: {
      group: {
        include: {
          members: {
            include: { user: { select: { id: true, name: true } } },
          },
          _count: { select: { expenses: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return memberships.map((m) => m.group);
}

export async function getGroupDetail(groupId: string) {
  const user = await requireUser();
  await requireGroupMember(groupId, user.id);

  const group = await db.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      expenses: {
        where: { deletedAt: null },
        include: {
          paidBy: { select: { id: true, name: true } },
          splits: {
            include: { user: { select: { id: true, name: true } } },
          },
        },
        orderBy: { expenseDate: "desc" },
      },
      settlements: {
        where: { deletedAt: null },
        include: {
          fromUser: { select: { id: true, name: true } },
          toUser: { select: { id: true, name: true } },
        },
        orderBy: { settledAt: "desc" },
      },
    },
  });

  if (group?.deletedAt) return null;
  return group;
}
