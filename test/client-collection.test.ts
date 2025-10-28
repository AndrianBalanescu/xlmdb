import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { open } from "lmdb";
import { searchHelper } from "../src/index.ts";
import { rm, mkdir } from "fs/promises";

describe("xlmdb", () => {
  const testDbPath = "./test-db";
  let db: ReturnType<typeof open>;

  beforeEach(async () => {
    try {
      await rm(testDbPath, { recursive: true, force: true });
    } catch (e) {
      // ignore
    }
    await mkdir(testDbPath, { recursive: true });
    db = open({ path: testDbPath });
  });

  afterEach(async () => {
    if (db) {
      await db.close();
    }
    try {
      await rm(testDbPath, { recursive: true, force: true });
    } catch (e) {
      // ignore
    }
  });

  it("should work with LMDB directly", () => {
    const products = db.openDB<string, string>({ name: "test" });
    expect(products).toBeDefined();
  });

  it("should work with basic operations", async () => {
    const products = db.openDB<string, string>({ name: "products" });

    await products.put("p1", "laptop");
    const val = products.get("p1");
    expect(val).toBe("laptop");

    await products.remove("p1");
    expect(products.get("p1")).toBeUndefined();
  });

  it("should work with searchHelper", async () => {
    type Product = { name: string; price: number };
    const products = db.openDB<Product, string>({ name: "products" });

    await products.put("p1", { name: "Laptop", price: 999 });
    await products.put("p2", { name: "Mouse", price: 29 });
    await products.put("p3", { name: "Keyboard", price: 79 });

    const results = searchHelper(products, {
      filters: [p => p.price < 100],
    });

    expect(results).toHaveLength(2);
    expect(results.map(r => r.value.name)).toEqual(["Mouse", "Keyboard"]);
  });

  it("should work with deep search", async () => {
    type Item = { name: string; details?: { description: string } };
    const items = db.openDB<Item, string>({ name: "items" });

    await items.put("i:1", { name: "Pen" });
    await items.put("i:2", { name: "Book", details: { description: "A story about a blue pen." } });

    const results = searchHelper(items, {
      deepSearch: "pen",
    });

    expect(results.length).toBeGreaterThanOrEqual(1); // At least Pen matches
  });
});
