// Just export our search helper
// Import LMDB separately: import { open } from "lmdb";
export { search, search as searchHelper, type SearchOptions, type SearchOptions as SearchHelperOptions } from "./search-helper.ts";
