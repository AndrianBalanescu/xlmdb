// Just export our search helper and convenience function
// Import LMDB separately: import { open } from "lmdb";
export { search, search as searchHelper, db, type SearchOptions, type SearchOptions as SearchHelperOptions } from "./search-helper.ts";
