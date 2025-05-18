import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("mangas", (table) => {
    table.text("id").primary(); // Manga slug, e.g., 'one-piece'
    table.text("title").notNullable();
    table.text("source_name"); // e.g., 'westmanga', 'mangadex'
    table.text("source_url").notNullable().unique(); // URL of the manga on the source website
    table.text("cover_image_url");
    table.text("author");
    table.text("description", "longtext");
    table.text("type"); // e.g., Manga, Manhwa, Manhua
    table.timestamp("last_scraped_at").defaultTo(knex.fn.now());
    table.timestamps(true, true); // created_at and updated_at
  });

  await knex.schema.createTable("genres", (table) => {
    table.increments("id").primary();
    table.text("name").notNullable().unique();
    table.timestamps(true, true);
  });

  await knex.schema.createTable("manga_genres", (table) => {
    table.text("manga_id").references("id").inTable("mangas").onDelete("CASCADE");
    table.integer("genre_id").references("id").inTable("genres").onDelete("CASCADE");
    table.primary(["manga_id", "genre_id"]);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("manga_genres");
  await knex.schema.dropTableIfExists("genres");
  await knex.schema.dropTableIfExists("mangas");
}

