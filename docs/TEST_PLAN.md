# Vasool — Manual & E2E Test Plan

This document maps the seeded test dataset (`npm run load-test-data`) to test scenarios. Use it for manual QA or as a blueprint for automated E2E tests.

**Seed credentials:** all `*@seed.test` accounts use password `SeedPass123!`

**Reset:** `npm run clear-db` then `npm run load-test-data` (or `npm run load-test-data -- --force`)

---

## 1. Authentication

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| A1 | Register new user | `/register` with new email | Account created, redirected to dashboard |
| A2 | Login — valid user | Login as `alice@seed.test` | Dashboard loads |
| A3 | Login — wrong password | Wrong password for alice | Error message, no session |
| A4 | Login — deleted user | Login as `frank@seed.test` | Rejected (soft-deleted) |
| A5 | Protected routes | Visit `/dashboard` logged out | Redirect to `/login` |
| A6 | Auth page redirect | Visit `/login` while logged in | Redirect to `/dashboard` |
| A7 | Profile update | `/profile` → change name | Name updates, persists on reload |
| A8 | Logout | Sign out from nav | Session cleared, landing page |

---

## 2. Friends & Dashboard

| # | Scenario | Account | Expected |
|---|----------|---------|----------|
| F1 | Friend list | alice | Shows Bob, Carol, Dave with balances |
| F2 | Empty dashboard | grace | No friends, no balances |
| F3 | Search existing user | alice searches "bob" | Bob appears with ACCEPTED status |
| F4 | Search unknown | alice searches "zzz" | Empty or no match |
| F5 | Send friend request | grace → search eve → send | PENDING outgoing |
| F6 | Incoming request | alice | Eve's pending request visible |
| F7 | Accept request | alice accepts eve | Friendship ACCEPTED, personal group created |
| F8 | Decline request | dave sees carol's request | Can decline (already PENDING) |
| F9 | Declined state | eve searches dave | DECLINED status shown |
| F10 | Friend detail balance | alice → Bob | Non-zero balance from dinner, uber, groceries, settlement |
| F11 | Pairwise vs group | alice → Dave | Balance reflects personal group only |
| F12 | Cross-group balance | alice dashboard | Aggregates personal + Weekend Trip + Lunch Club |

---

## 3. Groups

| # | Scenario | Account | Expected |
|---|----------|---------|----------|
| G1 | Groups list | alice | Weekend Cabin Trip, Office Lunch Club (not 2-person groups) |
| G2 | Personal groups hidden | alice | Alice & Bob not in `/groups` list |
| G3 | Create group | alice → new group with bob + carol | Group appears, members added |
| G4 | Group detail | alice → Weekend Cabin Trip | Members, expenses, simplified debts |
| G5 | Non-member access | grace → direct group URL | Blocked or not found |
| G6 | Add member | bob → Roommates → add eve (after befriending) | Member added |
| G7 | Remove member | bob → Roommates | Min 2 members enforced |
| G8 | Deleted group | admin → Archived Side Project | Soft-deleted, restore available |
| G9 | Roommates (alice excluded) | alice `/groups` | Roommates not listed for alice |

---

## 4. Expenses

| # | Scenario | Group / Flow | Expected |
|---|----------|--------------|----------|
| E1 | Equal split — odd cents | Alice & Bob → Dinner $45.50 | Splits sum to total, payer gets remainder cent |
| E2 | Exact split | Alice & Bob → Uber $30 | Alice $18, Bob $12 |
| E3 | Subset participants | Weekend → Ski tickets | Only Alice, Bob, Carol in split (not Dave) |
| E4 | Exact split — 4 people | Weekend → Groceries $89.50 | Custom amounts, sum validated |
| E5 | All categories | Various seeded expenses | FOOD, TRANSPORT, TRAVEL, etc. display correctly |
| E6 | Expense detail | Any expense | Payer, splits, date, notes shown |
| E7 | Edit expense | Edit groceries amount | Splits recalculated/replaced |
| E8 | Delete expense | Soft-delete an expense | Removed from lists, balance updates |
| E9 | Deleted expense hidden | Weekend trip | "Camping gear (cancelled)" not in active list |
| E10 | Friend expense flow | alice → `/expenses/new` with bob | Auto-resolves Alice & Bob personal group |
| E11 | New group on friend expense | grace + eve (after accept) | New personal group if none exists |
| E12 | Validation — exact sum | Create expense, wrong split total | Error: splits must sum to total |
| E13 | Validation — payer | Payer not in group | Error rejected |

---

## 5. Balances & Settlements

| # | Scenario | Location | Expected |
|---|----------|----------|----------|
| B1 | Net balances | Weekend Cabin Trip | Correct per-member net after expenses |
| B2 | Simplified debts | Weekend Cabin Trip settle page | Greedy debt simplification matches `simplifyDebts()` |
| B3 | Partial settlement effect | After Bob → Alice $50 | Balances reduced accordingly |
| B4 | Record settlement | `/groups/[id]/settle` | New settlement appears, balances update |
| B5 | Settlement validation | fromUser = toUser | Rejected |
| B6 | Deleted settlement | Weekend trip (voided $10) | Not counted in balances |
| B7 | Multi-creditor scenario | Office Lunch Club | Multiple people owe Eve after team lunch |
| B8 | Zero balance friend | After full settle | Friend shows settled up |

---

## 6. Activity Feed

| # | Scenario | Account | Expected |
|---|----------|---------|----------|
| AC1 | Expense activity | alice `/activity` | Expenses where alice paid or has a split |
| AC2 | Settlement activity | bob | Settlements where bob paid or received |
| AC3 | Net effect sign | alice | Positive = lent, negative = borrowed |
| AC4 | Chronological order | any | Sorted by date descending |
| AC5 | Cross-group feed | alice | Mix of personal, trip, and lunch club items |

---

## 7. Admin Panel

| # | Scenario | Account | Expected |
|---|----------|---------|----------|
| AD1 | Access control | alice → `/admin` | Redirected or forbidden |
| AD2 | Admin access | admin@seed.test | Admin dashboard loads |
| AD3 | List users | admin → users | All seed users visible |
| AD4 | Soft-delete user | admin → delete grace | grace.deletedAt set, login blocked |
| AD5 | Restore user | admin → restore grace | User active again |
| AD6 | Edit group | admin → Weekend Cabin Trip | Name/description editable |
| AD7 | Restore group | admin → Archived Side Project | Group active again |
| AD8 | Edit expense metadata | admin → expense | Description/category editable (not splits) |
| AD9 | Create settlement | admin → new settlement | Settlement recorded |
| AD10 | Soft-delete settlement | admin | Settlement excluded from balances |

---

## 8. Middleware & Authorization

| # | Scenario | Expected |
|---|----------|----------|
| M1 | Non-admin `/admin` | Blocked |
| M2 | Group member check | Non-member cannot add expenses |
| M3 | Friend-only group members | Cannot add non-friends to group |
| M4 | Personal group member add | UI prevents adding to 2-person group |

---

## 9. Seeded Data Reference

### Users

| Email | Role | Purpose |
|-------|------|---------|
| alice@seed.test | USER | Primary tester — most connections |
| bob@seed.test | USER | Friend, roommate, trip member |
| carol@seed.test | USER | Pending request to dave |
| dave@seed.test | USER | Declined eve, trip member |
| eve@seed.test | USER | Pending to alice, lunch club |
| admin@seed.test | ADMIN | Admin panel |
| frank@seed.test | USER (deleted) | Login rejection |
| grace@seed.test | USER | Isolated — no friends |

### Friendships

| Pair | Status |
|------|--------|
| Alice ↔ Bob, Carol, Dave | ACCEPTED |
| Bob ↔ Carol | ACCEPTED |
| Carol → Dave | PENDING |
| Eve → Alice | PENDING |
| Bob → Eve | PENDING |
| Dave → Eve | DECLINED |

### Groups

| Name | Members | Notes |
|------|---------|-------|
| Alice & Bob (personal) | Alice, Bob | Hidden from `/groups` |
| Alice & Carol (personal) | Alice, Carol | |
| Alice & Dave (personal) | Alice, Dave | |
| Bob & Carol (personal) | Bob, Carol | |
| Weekend Cabin Trip | Alice, Bob, Carol, Dave | 5 expenses, 3 settlements |
| Roommates | Bob, Carol, Dave | Alice not a member |
| Office Lunch Club | All 5 active users | 5-person equal + exact |
| Archived Side Project | Alice, Bob | Soft-deleted |

---

## 10. Future Automated E2E Structure

Suggested test file layout (Playwright/Cypress):

```
e2e/
  auth.spec.ts          # A1–A8
  friends.spec.ts       # F1–F12
  groups.spec.ts        # G1–G9
  expenses.spec.ts      # E1–E13
  settlements.spec.ts   # B1–B8
  activity.spec.ts      # AC1–AC5
  admin.spec.ts         # AD1–AD10
```

**Setup/teardown per suite:**

```bash
npm run load-test-data -- --force   # before all
npm run clear-db                    # after all (optional)
```

**Fixtures:** import emails/passwords from `scripts/seed-lib.ts` constants.

---

## 11. Unit Test Gaps (not covered by seed data)

These remain pure-logic tests in `tests/balances.test.ts`; seed data enables integration coverage:

- `equalSplit` remainder distribution
- `validateExactSplits` boundary cases
- `simplifyDebts` multi-party chains
- `computePairwiseBalance` with settlements

Consider adding integration tests that load seed data and assert computed balances match expected values.
