import type { Database, RangeOptions } from "lmdb";

/**
 * Advanced search options that can be applied to any LMDB Database
 */
export type SearchOptions<T> = {
  /** Key prefix to filter results */
  prefix?: string;
  /** Maximum number of results to return */
  limit?: number;
  /** Custom sort function applied after filtering */
  sort?: (a: T, b: T) => number;
  /** Array of filter functions - all must return true */
  filters?: Array<(value: T, key: string) => boolean>;
  /** Deep search - searches for text in any string field (recursive) */
  deepSearch?: string;
  /** Query text - alias for deepSearch (searches in any string field) */
  query?: string;
  /** Additional LMDB range options (reverse, offset, snapshot, transaction, etc) */
  rangeOptions?: Omit<RangeOptions, "start" | "end" | "limit">;
};

/**
 * Performs advanced search on an LMDB Database with TypeScript filters,
 * deep search capabilities, and custom sorting.
 */
export function search<T, K extends string = string>(
  db: Database<T, K>,
  options: SearchOptions<T> = {}
): Array<{ key: K; value: T }> {
  const start = options.prefix ?? "";
  const end = start ? start + "￿" : undefined;
  const limit = options.limit ?? Infinity;

  // Build the range options
  const rangeOpts: RangeOptions = {
    ...(options.rangeOptions ?? {}),
    start,
    ...(end && { end }),
  };

  const iterable = db.getRange(rangeOpts);
  const results: Array<{ key: K; value: T }> = [];

  // Combine all filters including deepSearch
  const allFilters = [...(options.filters ?? [])];
  const searchText = (options.deepSearch || options.query)?.toLowerCase();
  if (searchText) {
    allFilters.push((value) => deepSearchHelper(value, searchText));
  }

  // Iterate and filter — collect ALL matching results first
  for (const { key, value } of iterable) {
    if (allFilters.length > 0 && !allFilters.every((f) => f(value as T, key as string))) {
      continue;
    }
    results.push({ key: key as K, value: value as T });
  }

  // Apply custom sorting BEFORE limit (sort must see the full set)
  if (options.sort) {
    results.sort((a, b) => options.sort!(a.value, b.value));
  }

  // Apply limit AFTER sorting so we get the correct top-N results
  if (results.length > limit) {
    results.length = limit;
  }

  return results;
}

/**
 * Recursively searches for text in any string field of an object
 * Uses a visited set to prevent infinite loops with circular references
 */
function deepSearchHelper(obj: any, text: string, visited = new WeakSet()): boolean {
  if (typeof obj === "string") {
    return obj.toLowerCase().includes(text);
  }
  if (typeof obj === "object" && obj !== null) {
    // Prevent infinite loops with circular references
    if (visited.has(obj)) {
      return false;
    }
    visited.add(obj);
    
    for (const key in obj) {
      if (Object.hasOwn(obj, key) && deepSearchHelper(obj[key], text, visited)) {
        return true;
      }
    }
  }
  return false;
}

