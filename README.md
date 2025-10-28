# xlmdb

> Advanced search helper for LMDB with TypeScript support. Make LMDB queries as simple as MongoDB queries!

**xlmdb** extends [LMDB](https://github.com/kriszyp/lmdb-js) with powerful search capabilities including filtering, deep search, sorting, and prefix matching - all with full TypeScript type safety.

## Features

- 🔍 **Advanced filtering** - Chain multiple filters with custom logic
- 🌊 **Deep search** - Find text in nested objects and arrays
- 🎯 **Prefix matching** - Efficient key-based filtering
- 📊 **Custom sorting** - Sort results by any criteria
- 🚀 **Type-safe** - Full TypeScript support with generics
- ⚡ **Performance** - Built on LMDB's high-performance range queries
- 🎨 **Simple API** - One function to rule them all: `searchHelper`

## Install

```bash
bun add xlmdb lmdb
# or
npm install xlmdb lmdb
# or
pnpm add xlmdb lmdb
```

## Quick Start

```typescript
import { db, searchHelper } from "xlmdb";

// Define your types
type Product = {
  name: string;
  price: number;
  category: string;
  description?: string;
  tags?: string[];
};

// Create database and collection in one line
const products = db<Product>("./data", "products");

// Add some data
await products.put("p1", { 
  name: "Laptop", 
  price: 999, 
  category: "electronics",
  description: "Powerful laptop for gaming"
});

await products.put("p2", { 
  name: "Coffee Maker", 
  price: 89, 
  category: "appliances",
  tags: ["kitchen", "coffee"]
});

// Search with filters, deep search, and sorting!
const results = searchHelper(products, {
  filters: [p => p.price < 1000],           // Filter by price
  deepSearch: "coffee",                      // Search in any field
  sort: (a, b) => b.price - a.price,         // Sort by price descending
  limit: 10                                  // Limit results
});

console.log(results);
// [{ key: "p2", value: { name: "Coffee Maker", ... } }]
```

## Full Control

For more control, use LMDB's native API:

```typescript
import { open } from "lmdb";
import { searchHelper } from "xlmdb";

// Open database
const db = open({ path: "./data" });
const products = db.openDB<Product, string>({ name: "products" });

// Use search helper
const results = searchHelper(products, {
  filters: [p => p.price < 1000],
});
```

## API Reference

### `db<T>(path: string, name: string): Database<T, string>`

Quick shortcut to open a database and collection in one call.

**Parameters:**
- `path` - Database path
- `name` - Collection/database name

**Returns:** LMDB Database instance

**Example:**
```typescript
const users = db<User>("./data", "users");
```

### `searchHelper<T, K>(db: Database<T, K>, options?: SearchHelperOptions<T>): Array<{ key: K; value: T }>`

Perform advanced search on an LMDB database.

**Type Parameters:**
- `T` - Value type (your data structure)
- `K` - Key type (default: `string`)

**Parameters:**
- `db` - LMDB Database instance
- `options` - Search options (see below)

**Returns:** Array of objects with `key` and `value` properties

#### Search Options

```typescript
interface SearchHelperOptions<T> {
  /** Key prefix to filter results (efficient range query) */
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
}
```

## Usage Examples

### 1. Basic Filtering

Filter products by price:

```typescript
const cheapProducts = searchHelper(products, {
  filters: [p => p.price < 50]
});
```

### 2. Multiple Filters

Chain multiple filters (all must pass):

```typescript
const filtered = searchHelper(products, {
  filters: [
    p => p.price > 100,
    p => p.price < 1000,
    p => p.category === "electronics",
    p => p.stock > 0
  ]
});
```

### 3. Deep Search

Search text in any nested field:

```typescript
// Finds "gaming" in name, description, tags, or any nested field
const gamingProducts = searchHelper(products, {
  deepSearch: "gaming"
});
```

### 4. Prefix Matching

Efficient key-based filtering:

```typescript
// Get all items with keys starting with "user:"
const users = searchHelper(db, {
  prefix: "user:"
});
```

### 5. Custom Sorting

Sort by any criteria:

```typescript
const sortedByPrice = searchHelper(products, {
  sort: (a, b) => a.price - b.price  // ascending
});

const sortedByName = searchHelper(products, {
  sort: (a, b) => a.name.localeCompare(b.name)  // alphabetical
});
```

### 6. Limit Results

Get top N results:

```typescript
const top5 = searchHelper(products, {
  sort: (a, b) => b.views - a.views,
  limit: 5
});
```

### 7. Combined Features

Combine all features for powerful queries:

```typescript
const results = searchHelper(products, {
  prefix: "p",                                    // Keys starting with "p"
  filters: [                                      // Multiple filters
    p => p.price < 100,
    p => p.category === "electronics"
  ],
  deepSearch: "wireless",                        // Search in nested fields
  sort: (a, b) => b.price - a.price,            // Sort by price
  limit: 10                                      // Top 10 results
});
```

### 8. Complex Type-Safe Queries

With TypeScript generics, you get full type safety:

```typescript
type BlogPost = {
  title: string;
  content: string;
  author: { name: string; email: string };
  tags: string[];
  published: boolean;
  views: number;
};

const posts = db<BlogPost>("./data", "posts");

// Type-safe query with autocomplete!
const recentViews = searchHelper(posts, {
  filters: [
    post => post.published,
    post => post.views > 1000
  ],
  deepSearch: "TypeScript",
  sort: (a, b) => b.views - a.views,
  limit: 5
});
```

### 9. Using with Transactions

```typescript
const tx = db.beginTransaction();
const results = searchHelper(products, {
  rangeOptions: { transaction: tx }
});
await tx.commit();
```

## Advanced Usage

### Performance Tips

1. **Use prefix for key-based queries** - Most efficient
2. **Apply filters before sorting** - Reduces sort work
3. **Set reasonable limits** - Prevents memory issues
4. **Combine with LMDB range options** - Use snapshot/transaction for consistency

### TypeScript Tips

1. **Always specify types** when using `db()` helper:
   ```typescript
   const products = db<Product>("./data", "products");
   ```

2. **Use const assertions** for better inference:
   ```typescript
   type Product = { name: string; price: number; } as const;
   ```

3. **Extract filter functions** for reusability:
   ```typescript
   const affordable = (p: Product) => p.price < 100;
   const inStock = (p: Product) => p.stock > 0;
   
   const results = searchHelper(products, {
     filters: [affordable, inStock]
   });
   ```

## Why Use xlmdb?

### Without xlmdb (Manual LMDB)

```typescript
// Tedious manual iteration
const results = [];
for (const { key, value } of products.getRange()) {
  if (value.price < 100 && 
      value.category === "electronics" && 
      value.stock > 0) {
    results.push({ key, value });
  }
}
results.sort((a, b) => a.value.price - b.value.price);
const top5 = results.slice(0, 5);
```

### With xlmdb

```typescript
// Clean and powerful
const results = searchHelper(products, {
  filters: [
    p => p.price < 100,
    p => p.category === "electronics",
    p => p.stock > 0
  ],
  sort: (a, b) => a.price - b.price,
  limit: 5
});
```

## Comparison

| Feature | xlmdb | LMDB Native | MongoDB |
|---------|-------|-------------|---------|
| Filtering | ✅ | ❌ | ✅ |
| Deep Search | ✅ | ❌ | ✅ |
| Sorting | ✅ | Manual | ✅ |
| Type Safety | ✅ | ✅ | ✅ |
| Performance | ⚡ Fast | ⚡⚡ Fastest | ⚡ Fast |
| File-based | ✅ | ✅ | ❌ |
| No server | ✅ | ✅ | ❌ |

## Examples

Try the included examples:

```bash
# Run the e-commerce example
bun run example

# Run the animal shelter example
bun run example:shelter
```

Or check out the [example directory](./example/) for more use cases.

## Testing

```bash
# Run tests
bun test

# Run tests in watch mode
bun test:watch
```

All tests pass and examples work out of the box.

## Limitations

- **Full scans on complex queries** - Prefix-based queries are fastest
- **No indexing** - Filtering happens in-memory after retrieval
- **Sync API** - Results are returned synchronously (LMDB's design)

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT - See LICENSE file for details.

## Acknowledgments

Built on top of [LMDB](https://github.com/kriszyp/lmdb-js) - a fast, memory-mapped database with excellent performance characteristics.
