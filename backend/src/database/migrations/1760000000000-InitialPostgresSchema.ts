import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialPostgresSchema1760000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar NOT NULL UNIQUE,
        "password" varchar NOT NULL,
        "username" varchar NOT NULL UNIQUE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "catalog_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar NOT NULL,
        "release_date" date NOT NULL,
        CONSTRAINT "catalog_items_name_release_date_key" UNIQUE ("name", "release_date")
      )
    `);
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "watch_progress"');
    await queryRunner.query('DROP TABLE "catalog_items"');
    await queryRunner.query('DROP TABLE "users"');
  }
}
