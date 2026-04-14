// Seed database with initial data from JSON file
import { sqliteDb } from "./db.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function seedDatabase() {
  console.log("🌱 Checking seed data...");

  try {
    const seedPath = join(__dirname, "seed-data.json");
    const seedData = JSON.parse(readFileSync(seedPath, "utf-8"));

    // Insert blog categories (upsert by slug)
    const insertCat = sqliteDb.prepare(
      `INSERT OR IGNORE INTO blog_categories (name, slug, description, color, created_at)
       VALUES (?, ?, ?, ?, ?)`
    );
    let catCount = 0;
    for (const cat of seedData.categories) {
      const result = insertCat.run(
        cat.name, cat.slug, cat.description || '', cat.color || '#3B82F6',
        Date.now()
      );
      if (result.changes > 0) catCount++;
    }
    if (catCount > 0) console.log(`  ✅ Seeded ${catCount} blog categories`);

    // Insert blog posts (upsert by slug)
    const insertPost = sqliteDb.prepare(
      `INSERT OR IGNORE INTO blog_posts
       (title, slug, excerpt, content, featured_image, audio_url, audio_duration, audio_title,
        post_type, category, subcategory, author, published, published_at,
        created_at, updated_at, tags, meta_description, reading_time, seo_title, canonical_url)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    );
    let postCount = 0;
    for (const post of seedData.posts) {
      const result = insertPost.run(
        post.title, post.slug, post.excerpt || '', post.content || '',
        post.featured_image || '', post.audio_url || '', post.audio_duration || '',
        post.audio_title || '', post.post_type || 'article',
        post.category || 'general', post.subcategory || '',
        post.author || 'Up Arrow Inc',
        post.published ? 1 : 0,
        post.published_at || Date.now(),
        Date.now(), Date.now(),
        post.tags || '', post.meta_description || '',
        post.reading_time || '5 min read',
        post.seo_title || '', post.canonical_url || ''
      );
      if (result.changes > 0) postCount++;
    }
    if (postCount > 0) console.log(`  ✅ Seeded ${postCount} blog posts`);

    // Insert members (upsert by email)
    const insertMember = sqliteDb.prepare(
      `INSERT OR IGNORE INTO members
       (email, first_name, last_name, password, phone, company,
        membership_tier, membership_status, is_approved,
        has_training_access, has_ticketing_access, has_billing_access,
        created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    );
    let memberCount = 0;
    for (const member of seedData.members) {
      const result = insertMember.run(
        member.email, member.first_name || '', member.last_name || '',
        member.password_hash || '', member.phone || '', member.company || '',
        member.tier || 'free', member.status || 'active', 1,
        1, 1, 1,
        Date.now(), Date.now()
      );
      if (result.changes > 0) memberCount++;
    }
    if (memberCount > 0) console.log(`  ✅ Seeded ${memberCount} members`);

    if (catCount === 0 && postCount === 0 && memberCount === 0) {
      console.log("✅ Database already seeded, nothing to add");
    } else {
      console.log("✅ Database seeded successfully");
    }
  } catch (err) {
    console.error("⚠️ Seed failed (non-fatal):", err);
  }
}
