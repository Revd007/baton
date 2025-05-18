import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("chapters", (table) => {
    table.text("id").primary(); // Chapter slug, e.g., 'one-piece-chapter-1000'
    table.text("manga_id").notNullable().references("id").inTable("mangas").onDelete("CASCADE");
    table.text("title").notNullable();
    table.text("chapter_url").notNullable().unique(); // URL of the chapter on the source website
    table.timestamp("scraped_at").defaultTo(knex.fn.now());
    table.timestamps(true, true); // created_at and updated_at
  });

  await knex.schema.createTable("pages", (table) => {
    table.increments("id").primary();
    table.text("chapter_id").notNullable().references("id").inTable("chapters").onDelete("CASCADE");
    table.integer("page_number").notNullable();
    table.text("image_url").notNullable();
    table.timestamps(true, true);
    table.unique(["chapter_id", "page_number"]); // Ensure page number is unique within a chapter
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("pages");
  await knex.schema.dropTableIfExists("chapters");
}

