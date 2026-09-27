CREATE SEQUENCE "public"."migrations_id_seq" AS integer INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1 NO CYCLE;

CREATE TABLE "public"."catalog_episodes" (
  "id"             character varying NOT NULL,
  "season_id"      character varying NOT NULL,
  "episode_number" character varying NOT NULL,
  "release_date"   date              NOT NULL,
  CONSTRAINT "catalog_episodes_pkey" PRIMARY KEY (id),
  CONSTRAINT "catalog_episodes_season_number_key" UNIQUE (season_id, episode_number)
);

CREATE TABLE "public"."catalog_items" (
  "id"           uuid              NOT NULL DEFAULT gen_random_uuid(),
  "name"         character varying NOT NULL,
  "release_date" date              NOT NULL,
  CONSTRAINT "catalog_items_name_release_date_key" UNIQUE (name, release_date),
  CONSTRAINT "catalog_items_pkey" PRIMARY KEY (id)
);

CREATE TABLE "public"."catalog_orderings" (
  "id"          character varying NOT NULL,
  "label"       character varying NOT NULL,
  "status"      character varying NOT NULL,
  "description" character varying NOT NULL,
  CONSTRAINT "catalog_orderings_pkey" PRIMARY KEY (id),
  CONSTRAINT "catalog_orderings_status_check"
    CHECK (((status)::text = ANY ((ARRAY['derivable'::character varying, 'pending-curation'::character varying, 'curated'::character varying])::text[])))
);

CREATE TABLE "public"."catalog_seasons" (
  "id"            character varying NOT NULL,
  "title_id"      character varying NOT NULL,
  "season_number" integer           NOT NULL,
  CONSTRAINT "catalog_seasons_pkey" PRIMARY KEY (id),
  CONSTRAINT "catalog_seasons_season_number_check" CHECK ((season_number > 0)),
  CONSTRAINT "catalog_seasons_title_number_key" UNIQUE (title_id, season_number)
);

CREATE TABLE "public"."catalog_titles" (
  "id"           character varying        NOT NULL,
  "title"        character varying        NOT NULL,
  "kind"         character varying        NOT NULL,
  "release_date" date,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "catalog_titles_kind_check" CHECK (((kind)::text = ANY ((ARRAY['movie'::character varying, 'special'::character varying, 'series'::character varying])::text[]))),
  CONSTRAINT "catalog_titles_pkey" PRIMARY KEY (id)
);

CREATE TABLE "public"."migrations" (
  "id"        integer           NOT NULL DEFAULT nextval('public.migrations_id_seq'::regclass),
  "timestamp" bigint            NOT NULL,
  "name"      character varying NOT NULL,
  CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id)
);

CREATE TABLE "public"."ordering_entries" (
  "ordering_id"   character varying NOT NULL,
  "watch_unit_id" character varying NOT NULL,
  "position"      integer           NOT NULL,
  CONSTRAINT "ordering_entries_pkey" PRIMARY KEY (ordering_id, watch_unit_id),
  CONSTRAINT "ordering_entries_position_check" CHECK (("position" > 0)),
  CONSTRAINT "ordering_entries_position_key" UNIQUE (ordering_id, "position")
);

CREATE TABLE "public"."title_relations" (
  "from_title_id" character varying NOT NULL,
  "to_title_id"   character varying NOT NULL,
  "type"          character varying NOT NULL,
  CONSTRAINT "title_relations_distinct_titles_check" CHECK (((from_title_id)::text <> (to_title_id)::text)),
  CONSTRAINT "title_relations_pkey" PRIMARY KEY (from_title_id, to_title_id, TYPE),
  CONSTRAINT "title_relations_type_check" CHECK (((type)::text = ANY ((ARRAY['sequel'::character varying, 'spin-off'::character varying, 'crossover'::character varying])::text[])))
);

CREATE TABLE "public"."users" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "email"      character varying        NOT NULL,
  "password"   character varying        NOT NULL,
  "username"   character varying        NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "users_email_key" UNIQUE (email),
  CONSTRAINT "users_pkey" PRIMARY KEY (id),
  CONSTRAINT "users_username_key" UNIQUE (username)
);

CREATE TABLE "public"."watch_progress" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"       uuid                     NOT NULL,
  "watch_unit_id" character varying        NOT NULL,
  "status"        character varying        NOT NULL DEFAULT 'unwatched'::character varying,
  "watched_at"    timestamp with time zone,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "watch_progress_pkey" PRIMARY KEY (id),
  CONSTRAINT "watch_progress_status_check" CHECK (((status)::text = ANY ((ARRAY['unwatched'::character varying, 'watched'::character varying])::text[]))),
  CONSTRAINT "watch_progress_user_unit_key" UNIQUE (user_id, watch_unit_id)
);

CREATE TABLE "public"."watch_units" (
  "id"           character varying NOT NULL,
  "title_id"     character varying NOT NULL,
  "episode_id"   character varying,
  "kind"         character varying NOT NULL,
  "release_date" date              NOT NULL,
  CONSTRAINT "watch_units_episode_id_key" UNIQUE (episode_id),
  CONSTRAINT "watch_units_kind_check" CHECK (((kind)::text = ANY ((ARRAY['movie'::character varying, 'special'::character varying, 'episode'::character varying])::text[]))),
  CONSTRAINT "watch_units_kind_episode_check" CHECK (((((kind)::text = 'episode'::text) AND (episode_id IS
    NOT NULL)) OR (((kind)::text = ANY ((ARRAY['movie'::character varying, 'special'::character varying])::text[])) AND (episode_id IS NULL)))),
  CONSTRAINT "watch_units_pkey" PRIMARY KEY (id)
);

ALTER SEQUENCE "public"."migrations_id_seq" OWNED BY "public"."migrations"."id";

ALTER TABLE "public"."catalog_episodes"
  ADD CONSTRAINT "catalog_episodes_season_id_fkey" FOREIGN KEY (season_id) REFERENCES public.catalog_seasons(id) ON DELETE CASCADE;

ALTER TABLE "public"."catalog_seasons"
  ADD CONSTRAINT "catalog_seasons_title_id_fkey" FOREIGN KEY (title_id) REFERENCES public.catalog_titles(id) ON DELETE CASCADE;

ALTER TABLE "public"."ordering_entries"
  ADD CONSTRAINT "ordering_entries_ordering_id_fkey" FOREIGN KEY (ordering_id) REFERENCES public.catalog_orderings(id) ON DELETE CASCADE;

ALTER TABLE "public"."title_relations"
  ADD CONSTRAINT "title_relations_from_title_id_fkey" FOREIGN KEY (from_title_id) REFERENCES public.catalog_titles(id) ON DELETE CASCADE;

ALTER TABLE "public"."title_relations"
  ADD CONSTRAINT "title_relations_to_title_id_fkey" FOREIGN KEY (to_title_id) REFERENCES public.catalog_titles(id) ON DELETE CASCADE;

ALTER TABLE "public"."watch_progress"
  ADD CONSTRAINT "watch_progress_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."watch_units"
  ADD CONSTRAINT "watch_units_episode_id_fkey" FOREIGN KEY (episode_id) REFERENCES public.catalog_episodes(id) ON DELETE CASCADE;

ALTER TABLE "public"."ordering_entries"
  ADD CONSTRAINT "ordering_entries_watch_unit_id_fkey" FOREIGN KEY (watch_unit_id) REFERENCES public.watch_units(id) ON DELETE CASCADE;

ALTER TABLE "public"."watch_progress"
  ADD CONSTRAINT "watch_progress_watch_unit_id_fkey" FOREIGN KEY (watch_unit_id) REFERENCES public.watch_units(id) ON DELETE CASCADE;

ALTER TABLE "public"."watch_units"
  ADD CONSTRAINT "watch_units_title_id_fkey" FOREIGN KEY (title_id) REFERENCES public.catalog_titles(id) ON DELETE CASCADE;

CREATE INDEX watch_progress_user_id_index ON public.watch_progress USING btree (user_id);

CREATE INDEX watch_units_title_id_index ON public.watch_units USING btree (title_id);

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."migrations_id_seq" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."catalog_episodes" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."catalog_items" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."catalog_orderings" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."catalog_seasons" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."catalog_titles" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."migrations" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ordering_entries" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."title_relations" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."users" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."watch_progress" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."watch_units" TO "anon", "authenticated", "postgres", "service_role";

