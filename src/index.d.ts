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
  /** Additional LMDB range options (reverse, offset, snapshot, transaction, etc) */
  rangeOptions?: Omit<RangeOptions, "start" | "end" | "limit">;
};

/**
 * Performs advanced search on an LMDB Database with TypeScript filters,
 * deep search capabilities, and custom sorting.
 */
export function search<T, K extends string = string>(
  db: Database<T, K>,
  options?: SearchOptions<T>
): Array<{ key: K; value: T }>;

