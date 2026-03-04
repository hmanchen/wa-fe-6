/**
 * Shared camelCase ↔ snake_case deep key conversion utilities.
 *
 * Used by financial-interview.ts and presentation-flow.ts
 * to normalise keys between the camelCase frontend and
 * snake_case backend.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/([a-zA-Z])(\d)/g, "$1_$2")
    .toLowerCase();
}

export function toCamelCase(str: string): string {
  return str.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

export function deepConvertKeys(obj: any, converter: (s: string) => string): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((item) => deepConvertKeys(item, converter));
  if (typeof obj === "object" && !(obj instanceof Date)) {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[converter(key)] = deepConvertKeys(value, converter);
    }
    return result;
  }
  return obj;
}
