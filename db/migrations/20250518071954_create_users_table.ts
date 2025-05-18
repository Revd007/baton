import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("users", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid()); // Primary key
    table.string("name");
    table.string("email").notNullable().unique();
    table.timestamp("email_verified_at").nullable();
    table.string("image_url").nullable();
    table.string("provider").nullable(); // e.g., \'google\', \'facebook\', \'email\'
    table.string("provider_id").nullable().unique(); // ID from the OAuth provider

    // Timestamps
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());

    // Optional: if you plan to store hashed passwords for email/password auth
    // table.string("password_hash").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("users");
}

