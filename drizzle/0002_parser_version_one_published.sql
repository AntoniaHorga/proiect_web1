ALTER TABLE "import_batches" DROP CONSTRAINT "import_batches_source_sha256_key";--> statement-breakpoint
ALTER TABLE "expense_lines" ADD COLUMN "name_parts" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "import_batches" ADD COLUMN "parser_version" smallint DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "revenue_lines" ADD COLUMN "name_parts" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "import_batches_one_published_per_year_key" ON "import_batches" USING btree ("kind","fiscal_year") WHERE "import_batches"."status" = 'published';--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_source_sha256_parser_version_key" UNIQUE("source_sha256","parser_version");