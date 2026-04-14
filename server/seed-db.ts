// Seed database with initial data from JSON file
import { sqliteDb } from "./db.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function seedDatabase() {
  // Check if already seeded
  const catCount = sqliteDb.prepare("SELECT COUNT(*) as c FROM blog_categories").get() as any;
  if (catCount.c > 0) {
    console.log("✅ Database already seeded, skipping");
    return;
  }
  console.log("🌱 Seeding database with initial data...");

  try {
    const seedPath = join(__dirname, "seed-data.json");
    const seedData = JSON.parse(readFileSync(seedPath, "utf-8"));

    // Insert blog categories
    const insertCat = sqliteDb.prepare(
      "INSERT OR REPLACE INTO blog_categories (id, name, slug, description, color, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    );
    for (const cat of seedData.blog_categories) {
      insertCat.run(cat.id, cat.name, cat.slug, cat.description, cat.color, cat.created_at);
    }
    console.log(`  ✅ Seeded ${seedData.blog_categories.length} blog categories`);

    // Insert blog posts
    const insertPost = sqliteDb.prepare(
      `INSERT OR REPLACE INTO blog_posts 
      (id, title, slug, excerpt, content, featured_image, audio_url, audio_duration, audio_title,
       post_type, category, subcategory, author, published, published_at, scheduled_for,
       created_at, updated_at, tags, meta_description, reading_time)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    );
    for (const post of seedData.blog_posts) {
      insertPost.run(
        post.id, post.title, post.slug, post.excerpt, post.content,
        post.featured_image, post.audio_url, post.audio_duration, post.audio_title,
        post.post_type, post.category, post.subcategory, post.author,
        post.published, post.published_at, post.scheduled_for,
        post.created_at, post.updated_at, post.tags, post.meta_description, post.reading_time
      );
    }
    console.log(`  ✅ Seeded ${seedData.blog_posts.length} blog posts`);

    // Insert members
    const insertMember = sqliteDb.prepare(
      `INSERT OR REPLACE INTO members 
      (id, email, first_name, last_name, password, phone, company,
       membership_tier, membership_status, is_approved,
       has_training_access, has_ticketing_access, has_billing_access,
       preferred_mfa_method, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    );
    for (const member of seedData.members) {
      insertMember.run(
        member.id, member.email, member.first_name, member.last_name, member.password,
        member.phone, member.company, member.membership_tier, member.membership_status,
        member.is_approved, member.has_training_access, member.has_ticketing_access,
        member.has_billing_access, member.preferred_mfa_method,
        member.created_at, member.updated_at
      );
    }
    console.log(`  ✅ Seeded ${seedData.members.length} members`);

    console.log("✅ Database seeded successfully");
  } catch (err) {
    console.error("⚠️ Seed failed (non-fatal):", err);
  }
}
