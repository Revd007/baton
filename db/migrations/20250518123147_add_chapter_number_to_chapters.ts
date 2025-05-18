import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("chapters", (table) => {
    table.float("chapter_number").nullable().after("manga_id");
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("chapters", (table) => {
    table.dropColumn("chapter_number");
  });
}

