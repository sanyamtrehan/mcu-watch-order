import { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizedCatalog1760000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "catalog_titles" (
        "id" varchar PRIMARY KEY,
        "title" varchar NOT NULL,
        "kind" varchar NOT NULL CHECK ("kind" IN ('movie', 'special', 'series')),
        "release_date" date,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "catalog_seasons" (
        "id" varchar PRIMARY KEY,
        "title_id" varchar NOT NULL REFERENCES "catalog_titles"("id") ON DELETE CASCADE,
        "season_number" integer NOT NULL CHECK ("season_number" > 0),
        CONSTRAINT "catalog_seasons_title_number_key" UNIQUE ("title_id", "season_number")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "catalog_episodes" (
        "id" varchar PRIMARY KEY,
        "season_id" varchar NOT NULL REFERENCES "catalog_seasons"("id") ON DELETE CASCADE,
        "episode_number" varchar NOT NULL,
        "release_date" date NOT NULL,
        CONSTRAINT "catalog_episodes_season_number_key" UNIQUE ("season_id", "episode_number")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "watch_units" (
        "id" varchar PRIMARY KEY,
        "title_id" varchar NOT NULL REFERENCES "catalog_titles"("id") ON DELETE CASCADE,
        "episode_id" varchar UNIQUE REFERENCES "catalog_episodes"("id") ON DELETE CASCADE,
        "kind" varchar NOT NULL CHECK ("kind" IN ('movie', 'special', 'episode')),
        "release_date" date NOT NULL,
        CONSTRAINT "watch_units_kind_episode_check" CHECK (
          ("kind" = 'episode' AND "episode_id" IS NOT NULL) OR
          ("kind" IN ('movie', 'special') AND "episode_id" IS NULL)
        )
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "title_relations" (
        "from_title_id" varchar NOT NULL REFERENCES "catalog_titles"("id") ON DELETE CASCADE,
        "to_title_id" varchar NOT NULL REFERENCES "catalog_titles"("id") ON DELETE CASCADE,
        "type" varchar NOT NULL CHECK ("type" IN ('sequel', 'spin-off', 'crossover')),
        PRIMARY KEY ("from_title_id", "to_title_id", "type"),
        CONSTRAINT "title_relations_distinct_titles_check" CHECK ("from_title_id" <> "to_title_id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "catalog_orderings" (
        "id" varchar PRIMARY KEY,
        "label" varchar NOT NULL,
        "status" varchar NOT NULL CHECK ("status" IN ('derivable', 'pending-curation', 'curated')),
        "description" varchar NOT NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "ordering_entries" (
        "ordering_id" varchar NOT NULL REFERENCES "catalog_orderings"("id") ON DELETE CASCADE,
        "watch_unit_id" varchar NOT NULL REFERENCES "watch_units"("id") ON DELETE CASCADE,
        "position" integer NOT NULL CHECK ("position" > 0),
        PRIMARY KEY ("ordering_id", "watch_unit_id"),
        CONSTRAINT "ordering_entries_position_key" UNIQUE ("ordering_id", "position")
      )
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM "watch_progress") THEN
          RAISE EXCEPTION 'Cannot migrate watch_progress with existing data';
        END IF;
      END $$
    `);
    await queryRunner.query('DROP TABLE "watch_progress"');
    await queryRunner.query(`
      CREATE TABLE "watch_progress" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "watch_unit_id" varchar NOT NULL REFERENCES "watch_units"("id") ON DELETE CASCADE,
        "status" varchar NOT NULL DEFAULT 'unwatched' CHECK ("status" IN ('unwatched', 'watched')),
        "watched_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "watch_progress_user_unit_key" UNIQUE ("user_id", "watch_unit_id")
      )
    `);
    await queryRunner.query('CREATE INDEX "watch_units_title_id_index" ON "watch_units" ("title_id")');
    await queryRunner.query('CREATE INDEX "watch_progress_user_id_index" ON "watch_progress" ("user_id")');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "watch_progress_user_id_index"');
    await queryRunner.query('DROP INDEX "watch_units_title_id_index"');
    await queryRunner.query('DROP TABLE "watch_progress"');
    await queryRunner.query(`
      CREATE TABLE "watch_progress" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "catalog_item_id" uuid NOT NULL REFERENCES "catalog_items"("id") ON DELETE CASCADE,
        "status" varchar NOT NULL DEFAULT 'unwatched' CHECK ("status" IN ('unwatched', 'watched')),
        "watched_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "watch_progress_user_item_key" UNIQUE ("user_id", "catalog_item_id")
      )
    `);
    await queryRunner.query('DROP TABLE "ordering_entries"');
    await queryRunner.query('DROP TABLE "catalog_orderings"');
    await queryRunner.query('DROP TABLE "title_relations"');
    await queryRunner.query('DROP TABLE "watch_units"');
    await queryRunner.query('DROP TABLE "catalog_episodes"');
    await queryRunner.query('DROP TABLE "catalog_seasons"');
    await queryRunner.query('DROP TABLE "catalog_titles"');
  }
}
