// Client-safe registry describing the high-value models exposed in the admin
// area. It contains no server-only imports so it can be shared between Server
// Components, Client Components and server actions.

export type AdminFieldType =
  | "text"
  | "email"
  | "number"
  | "select"
  | "boolean"
  | "date"
  | "password";

export type AdminField = {
  name: string;
  label: string;
  type: AdminFieldType;
  options?: readonly { value: string; label: string }[];
  required?: boolean;
  /** Show as a column in the list table. */
  listColumn?: boolean;
  /** Allow editing on the edit form. */
  editable?: boolean;
  /** Only collected when creating a record. */
  createOnly?: boolean;
  helpText?: string;
};

export type AdminModel = {
  /** URL slug, e.g. "users". */
  key: string;
  singularLabel: string;
  pluralLabel: string;
  /** Fields searched by the list view's text query. */
  searchFields: string[];
  canCreate: boolean;
  fields: AdminField[];
};

const userRoleOptions = [
  { value: "USER", label: "User" },
  { value: "ADMIN", label: "Admin" },
] as const;

const expenseCategoryOptions = [
  { value: "GENERAL", label: "General" },
  { value: "FOOD", label: "Food" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "ENTERTAINMENT", label: "Entertainment" },
  { value: "UTILITIES", label: "Utilities" },
  { value: "SHOPPING", label: "Shopping" },
  { value: "TRAVEL", label: "Travel" },
  { value: "OTHER", label: "Other" },
] as const;

const splitTypeOptions = [
  { value: "EQUAL", label: "Equal" },
  { value: "EXACT", label: "Exact" },
] as const;

const booleanOptions = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
] as const;

export const ADMIN_MODELS: AdminModel[] = [
  {
    key: "users",
    singularLabel: "User",
    pluralLabel: "Users",
    searchFields: ["name", "email"],
    canCreate: true,
    fields: [
      { name: "id", label: "ID", type: "text" },
      {
        name: "name",
        label: "Name",
        type: "text",
        required: true,
        listColumn: true,
        editable: true,
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        required: true,
        listColumn: true,
        editable: true,
      },
      {
        name: "role",
        label: "Role",
        type: "select",
        options: userRoleOptions,
        required: true,
        listColumn: true,
        editable: true,
      },
      {
        name: "password",
        label: "Password",
        type: "password",
        editable: true,
        helpText:
          "On create this is required. When editing, leave blank to keep the current password.",
      },
      { name: "createdAt", label: "Created", type: "date", listColumn: true },
    ],
  },
  {
    key: "groups",
    singularLabel: "Group",
    pluralLabel: "Groups",
    searchFields: ["name", "description"],
    canCreate: false,
    fields: [
      { name: "id", label: "ID", type: "text" },
      {
        name: "name",
        label: "Name",
        type: "text",
        required: true,
        listColumn: true,
        editable: true,
      },
      {
        name: "description",
        label: "Description",
        type: "text",
        editable: true,
      },
      {
        name: "isPersonal",
        label: "Personal",
        type: "boolean",
        options: booleanOptions,
        listColumn: true,
        editable: true,
      },
      { name: "createdById", label: "Created by (user ID)", type: "text" },
      { name: "createdAt", label: "Created", type: "date", listColumn: true },
    ],
  },
  {
    key: "expenses",
    singularLabel: "Expense",
    pluralLabel: "Expenses",
    searchFields: ["description"],
    canCreate: false,
    fields: [
      { name: "id", label: "ID", type: "text" },
      {
        name: "description",
        label: "Description",
        type: "text",
        required: true,
        listColumn: true,
        editable: true,
      },
      {
        name: "amount",
        label: "Amount",
        type: "number",
        required: true,
        listColumn: true,
        editable: true,
      },
      {
        name: "currency",
        label: "Currency",
        type: "text",
        editable: true,
      },
      {
        name: "category",
        label: "Category",
        type: "select",
        options: expenseCategoryOptions,
        listColumn: true,
        editable: true,
      },
      {
        name: "splitType",
        label: "Split type",
        type: "select",
        options: splitTypeOptions,
        listColumn: true,
      },
      { name: "notes", label: "Notes", type: "text", editable: true },
      {
        name: "expenseDate",
        label: "Date",
        type: "date",
        listColumn: true,
        editable: true,
      },
      { name: "groupId", label: "Group ID", type: "text" },
      { name: "paidById", label: "Paid by (user ID)", type: "text" },
    ],
  },
  {
    key: "settlements",
    singularLabel: "Settlement",
    pluralLabel: "Settlements",
    searchFields: ["note"],
    canCreate: true,
    fields: [
      { name: "id", label: "ID", type: "text" },
      {
        name: "groupId",
        label: "Group ID",
        type: "text",
        required: true,
        listColumn: true,
        editable: true,
        createOnly: true,
      },
      {
        name: "fromUserId",
        label: "From (user ID)",
        type: "text",
        required: true,
        listColumn: true,
        editable: true,
      },
      {
        name: "toUserId",
        label: "To (user ID)",
        type: "text",
        required: true,
        listColumn: true,
        editable: true,
      },
      {
        name: "amount",
        label: "Amount",
        type: "number",
        required: true,
        listColumn: true,
        editable: true,
      },
      { name: "note", label: "Note", type: "text", editable: true },
      {
        name: "settledAt",
        label: "Settled at",
        type: "date",
        listColumn: true,
        editable: true,
      },
    ],
  },
];

export function getAdminModel(key: string): AdminModel | undefined {
  return ADMIN_MODELS.find((m) => m.key === key);
}

export const PAGE_SIZE = 25;
