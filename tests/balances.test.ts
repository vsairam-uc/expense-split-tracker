import { describe, expect, it } from "vitest";
import {
  computeNetBalances,
  computePairwiseBalance,
  equalSplit,
  simplifyDebts,
  validateExactSplits,
} from "@/lib/balances";

describe("computePairwiseBalance", () => {
  it("returns positive when the other person owes the user", () => {
    const expenses = [
      {
        paidById: "a",
        amount: 40,
        splits: [
          { userId: "a", amount: 20 },
          { userId: "b", amount: 20 },
        ],
      },
    ];
    expect(computePairwiseBalance("a", "b", expenses)).toBeCloseTo(20, 2);
    expect(computePairwiseBalance("b", "a", expenses)).toBeCloseTo(-20, 2);
  });

  it("ignores splits that do not involve both users", () => {
    const expenses = [
      {
        paidById: "a",
        amount: 30,
        splits: [
          { userId: "a", amount: 10 },
          { userId: "b", amount: 10 },
          { userId: "c", amount: 10 },
        ],
      },
    ];
    expect(computePairwiseBalance("a", "b", expenses)).toBeCloseTo(10, 2);
  });

  it("applies settlements between the two users", () => {
    const expenses = [
      {
        paidById: "a",
        amount: 40,
        splits: [
          { userId: "a", amount: 20 },
          { userId: "b", amount: 20 },
        ],
      },
    ];
    const settlements = [{ fromUserId: "b", toUserId: "a", amount: 20 }];
    expect(computePairwiseBalance("a", "b", expenses, settlements)).toBeCloseTo(
      0,
      2,
    );
  });
});

describe("equalSplit", () => {
  it("splits evenly when divisible", () => {
    const splits = equalSplit(100, ["a", "b", "c", "d"]);
    expect(splits).toHaveLength(4);
    expect(splits.every((s) => s.amount === 25)).toBe(true);
  });

  it("assigns remainder cents to payer first", () => {
    const splits = equalSplit(10, ["a", "b", "c"], "b");
    const total = splits.reduce((sum, s) => sum + s.amount, 0);
    expect(total).toBeCloseTo(10, 2);
    const payerSplit = splits.find((s) => s.userId === "b");
    expect(payerSplit?.amount).toBeGreaterThanOrEqual(3.34);
  });

  it("handles two-person split with odd cents", () => {
    const splits = equalSplit(10.01, ["a", "b"], "a");
    const total = splits.reduce((sum, s) => sum + s.amount, 0);
    expect(total).toBeCloseTo(10.01, 2);
  });
});

describe("validateExactSplits", () => {
  it("accepts splits that sum to total", () => {
    expect(
      validateExactSplits(50, [
        { userId: "a", amount: 30 },
        { userId: "b", amount: 20 },
      ]),
    ).toBe(true);
  });

  it("rejects splits that do not sum to total", () => {
    expect(
      validateExactSplits(50, [
        { userId: "a", amount: 30 },
        { userId: "b", amount: 19 },
      ]),
    ).toBe(false);
  });
});

describe("computeNetBalances", () => {
  it("computes balances from expenses", () => {
    const balances = computeNetBalances(
      ["alice", "bob"],
      [
        {
          paidById: "alice",
          amount: 100,
          splits: [
            { userId: "alice", amount: 50 },
            { userId: "bob", amount: 50 },
          ],
        },
      ],
    );

    expect(balances.get("alice")).toBeCloseTo(50, 2);
    expect(balances.get("bob")).toBeCloseTo(-50, 2);
  });

  it("adjusts balances with settlements", () => {
    const balances = computeNetBalances(
      ["alice", "bob"],
      [
        {
          paidById: "alice",
          amount: 100,
          splits: [
            { userId: "alice", amount: 50 },
            { userId: "bob", amount: 50 },
          ],
        },
      ],
      [{ fromUserId: "bob", toUserId: "alice", amount: 50 }],
    );

    expect(balances.get("alice")).toBeCloseTo(0, 2);
    expect(balances.get("bob")).toBeCloseTo(0, 2);
  });
});

describe("simplifyDebts", () => {
  it("simplifies a chain of debts", () => {
    const balances = new Map([
      ["a", 30],
      ["b", 0],
      ["c", -30],
    ]);

    const debts = simplifyDebts(balances);
    expect(debts).toHaveLength(1);
    expect(debts[0]).toEqual({
      fromUserId: "c",
      toUserId: "a",
      amount: 30,
    });
  });

  it("handles multiple creditors and debtors", () => {
    const balances = computeNetBalances(
      ["a", "b", "c", "d"],
      [
        {
          paidById: "a",
          amount: 100,
          splits: [
            { userId: "a", amount: 25 },
            { userId: "b", amount: 25 },
            { userId: "c", amount: 25 },
            { userId: "d", amount: 25 },
          ],
        },
        {
          paidById: "b",
          amount: 40,
          splits: [
            { userId: "a", amount: 10 },
            { userId: "b", amount: 10 },
            { userId: "c", amount: 10 },
            { userId: "d", amount: 10 },
          ],
        },
      ],
    );

    const debts = simplifyDebts(balances);
    const totalPaid = debts.reduce((sum, d) => sum + d.amount, 0);
    expect(totalPaid).toBeGreaterThan(0);

    for (const debt of debts) {
      expect(debt.amount).toBeGreaterThan(0);
    }
  });
});
