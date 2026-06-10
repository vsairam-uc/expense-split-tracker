export type SplitEntry = {
  userId: string;
  amount: number;
};

export type ExpenseRecord = {
  paidById: string;
  amount: number;
  splits: SplitEntry[];
};

export type SettlementRecord = {
  fromUserId: string;
  toUserId: string;
  amount: number;
};

export type SimplifiedDebt = {
  fromUserId: string;
  toUserId: string;
  amount: number;
};

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function equalSplit(
  total: number,
  participantIds: string[],
  payerId?: string,
): SplitEntry[] {
  if (participantIds.length === 0) {
    throw new Error("At least one participant is required");
  }

  const totalCents = toCents(total);
  const baseCents = Math.floor(totalCents / participantIds.length);
  let remainder = totalCents - baseCents * participantIds.length;

  const orderedIds = [...participantIds].sort((a, b) => {
    if (payerId) {
      if (a === payerId) return -1;
      if (b === payerId) return 1;
    }
    return a.localeCompare(b);
  });

  return orderedIds.map((userId) => {
    const extra = remainder > 0 ? 1 : 0;
    if (remainder > 0) remainder -= 1;
    return {
      userId,
      amount: fromCents(baseCents + extra),
    };
  });
}

export function computeNetBalances(
  userIds: string[],
  expenses: ExpenseRecord[],
  settlements: SettlementRecord[] = [],
): Map<string, number> {
  const balances = new Map<string, number>();
  for (const userId of userIds) {
    balances.set(userId, 0);
  }

  for (const expense of expenses) {
    const current = balances.get(expense.paidById) ?? 0;
    balances.set(expense.paidById, current + expense.amount);

    for (const split of expense.splits) {
      const splitBalance = balances.get(split.userId) ?? 0;
      balances.set(split.userId, splitBalance - split.amount);
    }
  }

  for (const settlement of settlements) {
    const fromBalance = balances.get(settlement.fromUserId) ?? 0;
    const toBalance = balances.get(settlement.toUserId) ?? 0;
    balances.set(settlement.fromUserId, fromBalance + settlement.amount);
    balances.set(settlement.toUserId, toBalance - settlement.amount);
  }

  return balances;
}

export function simplifyDebts(
  balances: Map<string, number>,
  tolerance = 0.01,
): SimplifiedDebt[] {
  type Person = { userId: string; amount: number };

  const creditors: Person[] = [];
  const debtors: Person[] = [];

  for (const [userId, balance] of balances.entries()) {
    if (balance > tolerance) {
      creditors.push({ userId, amount: balance });
    } else if (balance < -tolerance) {
      debtors.push({ userId, amount: -balance });
    }
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const result: SimplifiedDebt[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const payment = Math.min(debtor.amount, creditor.amount);

    if (payment > tolerance) {
      result.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount: Math.round(payment * 100) / 100,
      });
    }

    debtor.amount -= payment;
    creditor.amount -= payment;

    if (debtor.amount <= tolerance) i += 1;
    if (creditor.amount <= tolerance) j += 1;
  }

  return result;
}

export function computePairwiseBalance(
  userId: string,
  otherId: string,
  expenses: ExpenseRecord[],
  settlements: SettlementRecord[] = [],
): number {
  let balance = 0;

  for (const expense of expenses) {
    if (expense.paidById === userId) {
      const otherSplit = expense.splits.find((s) => s.userId === otherId);
      if (otherSplit) balance += otherSplit.amount;
    } else if (expense.paidById === otherId) {
      const userSplit = expense.splits.find((s) => s.userId === userId);
      if (userSplit) balance -= userSplit.amount;
    }
  }

  for (const settlement of settlements) {
    if (settlement.fromUserId === otherId && settlement.toUserId === userId) {
      balance -= settlement.amount;
    } else if (
      settlement.fromUserId === userId &&
      settlement.toUserId === otherId
    ) {
      balance += settlement.amount;
    }
  }

  return balance;
}

export function getBalanceBetween(
  fromUserId: string,
  toUserId: string,
  balances: Map<string, number>,
): number {
  const fromBalance = balances.get(fromUserId) ?? 0;
  const toBalance = balances.get(toUserId) ?? 0;

  if (fromBalance < 0 && toBalance > 0) {
    return Math.min(-fromBalance, toBalance);
  }

  return 0;
}

export function validateExactSplits(
  total: number,
  splits: SplitEntry[],
  tolerance = 0.01,
): boolean {
  const sum = splits.reduce((acc, split) => acc + split.amount, 0);
  return Math.abs(sum - total) <= tolerance;
}
