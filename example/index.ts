import { open } from "lmdb";
import { search } from "../src/index.ts";
import { rm, mkdir } from "fs/promises";

type Product = {
  name: string;
  price: number;
  category: string;
  description?: string;
  tags?: string[];
};

async function main() {
  const dbPath = "./example/data/simple";
  await rm(dbPath, { recursive: true, force: true }).catch(() => {});
  await mkdir(dbPath, { recursive: true });

  // Open database and collection
  const root = open({ path: dbPath });
  const products = root.openDB<Product, string>({ name: "products" });

  // Add products with nested data
  await products.put("p1", { 
    name: "Laptop", 
    price: 999, 
    category: "electronics",
    description: "Great for work and gaming"
  });
  await products.put("p2", { 
    name: "Coffee Machine", 
    price: 89, 
    category: "appliances",
    description: "Brews perfect coffee every morning",
    tags: ["kitchen", "coffee", "espresso"]
  });
  await products.put("p3", { 
    name: "Wireless Mouse", 
    price: 29, 
    category: "electronics" 
  });
  await products.put("p4", { 
    name: "Mouse Pad", 
    price: 15, 
    category: "accessories",
    description: "Ergonomic pad for gaming mouse"
  });

  console.log("=== xlmdb EXAMPLES ===\n");

  // 1. Basic get
  console.log("1️⃣ Basic Get:");
  const laptop = products.get("p1");
  console.log(`   ${laptop?.name} - $${laptop?.price}`);

  // 2. Filter by price
  console.log("\n2️⃣ Filter by Price (< $50):");
  const cheap = search(products, {
    filters: [p => p.price < 50]
  });
  console.log(`   Found: ${cheap.map(r => r.value.name).join(", ")}`);

  // 3. Filter by category
  console.log("\n3️⃣ Filter by Category (electronics):");
  const electronics = search(products, {
    filters: [p => p.category === "electronics"]
  });
  console.log(`   Found: ${electronics.map(r => r.value.name).join(", ")}`);

  // 4. Multiple filters
  console.log("\n4️⃣ Multiple Filters (electronics + < $100):");
  const filtered = search(products, {
    filters: [
      p => p.category === "electronics",
      p => p.price < 100
    ]
  });
  console.log(`   Found: ${filtered.map(r => r.value.name).join(", ")}`);

  // 5. Deep search in description
  console.log("\n5️⃣ Query (finds 'coffee' anywhere):");
  const coffeeProducts = search(products, {
    query: "coffe"
  });
  console.log(`   Found: ${coffeeProducts.map(r => r.value.name).join(", ")}`);
  console.log(`   Matched in: descriptions/tags anywhere in the object`);

  // 6. Deep search in nested arrays (tags)
  console.log("\n6️⃣ Query in Nested Arrays (finds 'gaming'):");
  const gamingProducts = search(products, {
    query: "gaming"
  });
  console.log(`   Found: ${gamingProducts.map(r => r.value.name).join(", ")}`);

  // 7. Sort by price
  console.log("\n7️⃣ Sort by Price (ascending):");
  const sorted = search(products, {
    sort: (a, b) => a.price - b.price
  });
  console.log(`   ${sorted.map(r => `${r.value.name} ($${r.value.price})`).join(", ")}`);

  // 8. Limit results
  console.log("\n8️⃣ Limit Results (top 2 by price):");
  const top2 = search(products, {
    sort: (a, b) => b.price - a.price,
    limit: 2
  });
  console.log(`   ${top2.map(r => `${r.value.name} ($${r.value.price})`).join(", ")}`);

  // 9. Prefix search
  console.log("\n9️⃣ Filter by Key Prefix:");
  const mouseProducts = search(products, {
    prefix: "p",  // All keys starting with "p"
    filters: [p => p.name.toLowerCase().includes("mouse")]
  });
  console.log(`   Found: ${mouseProducts.map(r => r.value.name).join(", ")}`);

  console.log("\n✅ All done!");
}

main().catch(console.error);
