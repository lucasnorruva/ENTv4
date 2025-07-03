// src/lib/actions/utils.ts

export const newId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
