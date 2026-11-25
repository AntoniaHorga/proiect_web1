CREATE TABLE "budget_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"axis" text NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	CONSTRAINT "budget_categories_axis_key_key" UNIQUE("axis","key"),
	CONSTRAINT "budget_categories_id_axis_key" UNIQUE("id","axis"),
	CONSTRAINT "budget_categories_axis_check" CHECK ("budget_categories"."axis" IN ('section', 'domain', 'revenue_source'))
);
--> statement-breakpoint
CREATE TABLE "budget_taxonomy_mapping" (
	"id" serial PRIMARY KEY NOT NULL,
	"axis" text NOT NULL,
	"code_prefix" text NOT NULL,
	"category_id" integer NOT NULL,
	"valid_from_year" smallint,
	"valid_to_year" smallint,
	"note" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "budget_taxonomy_mapping_axis_prefix_from_key" UNIQUE NULLS NOT DISTINCT("axis","code_prefix","valid_from_year"),
	CONSTRAINT "budget_taxonomy_mapping_axis_check" CHECK ("budget_taxonomy_mapping"."axis" IN ('section', 'domain', 'revenue_source')),
	CONSTRAINT "budget_taxonomy_mapping_code_prefix_check" CHECK ("budget_taxonomy_mapping"."code_prefix" ~ '^[0-9]{2}([.][0-9]{2})*$'),
	CONSTRAINT "budget_taxonomy_mapping_years_check" CHECK ("budget_taxonomy_mapping"."valid_from_year" IS NULL OR "budget_taxonomy_mapping"."valid_to_year" IS NULL OR "budget_taxonomy_mapping"."valid_from_year" <= "budget_taxonomy_mapping"."valid_to_year")
);
--> statement-breakpoint
CREATE TABLE "expense_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"import_id" integer NOT NULL,
	"source_row" integer NOT NULL,
	"block" text NOT NULL,
	"capitol" char(4),
	"subcapitol" char(2),
	"paragraf" char(2),
	"titlu" char(2),
	"articol" char(2),
	"alineat" char(2),
	"functional_code" text,
	"economic_code" text,
	"name" text NOT NULL,
	"is_summary" boolean NOT NULL,
	"is_leaf" boolean NOT NULL,
	"credite_angajament_initiale" bigint DEFAULT 0 NOT NULL,
	"credite_angajament_definitive" bigint DEFAULT 0 NOT NULL,
	"credite_bugetare_initiale" bigint DEFAULT 0 NOT NULL,
	"credite_bugetare_definitive" bigint DEFAULT 0 NOT NULL,
	"angajamente_bugetare" bigint DEFAULT 0 NOT NULL,
	"angajamente_legale" bigint DEFAULT 0 NOT NULL,
	"plati_efectuate" bigint DEFAULT 0 NOT NULL,
	"angajamente_legale_de_platit" bigint DEFAULT 0 NOT NULL,
	"cheltuieli_efective" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "expense_lines_block_check" CHECK ("expense_lines"."block" IN ('functional', 'economic_summary', 'mixed'))
);
--> statement-breakpoint
CREATE TABLE "import_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"fiscal_year" smallint NOT NULL,
	"source_filename" text NOT NULL,
	"source_sha256" char(64) NOT NULL,
	"column_layout" jsonb NOT NULL,
	"status" text DEFAULT 'uploaded' NOT NULL,
	"reconciliation_status" text,
	"justification" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reconciled_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	CONSTRAINT "import_batches_source_sha256_key" UNIQUE("source_sha256"),
	CONSTRAINT "import_batches_kind_check" CHECK ("import_batches"."kind" IN ('expense', 'revenue')),
	CONSTRAINT "import_batches_status_check" CHECK ("import_batches"."status" IN ('uploaded', 'reconciled', 'published')),
	CONSTRAINT "import_batches_reconciliation_status_check" CHECK ("import_batches"."reconciliation_status" IS NULL OR "import_batches"."reconciliation_status" IN ('exact_match', 'rounded_match', 'discrepancy_detected')),
	CONSTRAINT "import_batches_reconciled_has_status_check" CHECK ("import_batches"."status" = 'uploaded' OR "import_batches"."reconciliation_status" IS NOT NULL),
	CONSTRAINT "import_batches_publication_gate_check" CHECK ("import_batches"."status" <> 'published' OR "import_batches"."reconciliation_status" IN ('exact_match', 'rounded_match') OR char_length(btrim(coalesce("import_batches"."justification", ''))) >= 20)
);
--> statement-breakpoint
CREATE TABLE "locality_stats" (
	"year" smallint PRIMARY KEY NOT NULL,
	"population" integer,
	"population_source" text,
	"cpi_index" numeric(7, 3),
	"cpi_source" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "locality_stats_population_check" CHECK ("locality_stats"."population" IS NULL OR "locality_stats"."population" > 0),
	CONSTRAINT "locality_stats_population_source_check" CHECK ("locality_stats"."population" IS NULL OR "locality_stats"."population_source" IS NOT NULL),
	CONSTRAINT "locality_stats_cpi_source_check" CHECK ("locality_stats"."cpi_index" IS NULL OR "locality_stats"."cpi_source" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "reconciliation_checks" (
	"id" serial PRIMARY KEY NOT NULL,
	"import_id" integer NOT NULL,
	"check_kind" text NOT NULL,
	"block" text NOT NULL,
	"code" text NOT NULL,
	"source_row" integer NOT NULL,
	"amount_column" text NOT NULL,
	"reported_bani" bigint NOT NULL,
	"computed_bani" bigint NOT NULL,
	"difference_bani" bigint NOT NULL,
	"status" text NOT NULL,
	CONSTRAINT "reconciliation_checks_check_kind_check" CHECK ("reconciliation_checks"."check_kind" IN ('total_vs_chapters', 'parent_vs_children', 'functional_vs_mixed_total')),
	CONSTRAINT "reconciliation_checks_block_check" CHECK ("reconciliation_checks"."block" IN ('functional', 'economic_summary', 'mixed')),
	CONSTRAINT "reconciliation_checks_status_check" CHECK ("reconciliation_checks"."status" IN ('exact_match', 'rounded_match', 'discrepancy_detected'))
);
--> statement-breakpoint
CREATE TABLE "revenue_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"import_id" integer NOT NULL,
	"source_row" integer NOT NULL,
	"capitol" char(4),
	"subcapitol" char(2),
	"paragraf" char(2),
	"functional_code" text,
	"name" text NOT NULL,
	"is_summary" boolean NOT NULL,
	"is_leaf" boolean NOT NULL,
	"prevederi_initiale" bigint DEFAULT 0 NOT NULL,
	"prevederi_definitive" bigint DEFAULT 0 NOT NULL,
	"drepturi_total" bigint DEFAULT 0 NOT NULL,
	"drepturi_ani_precedenti" bigint DEFAULT 0 NOT NULL,
	"drepturi_an_curent" bigint DEFAULT 0 NOT NULL,
	"incasari_realizate" bigint DEFAULT 0 NOT NULL,
	"stingeri_alte_cai" bigint DEFAULT 0 NOT NULL,
	"drepturi_contestate" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "budget_taxonomy_mapping" ADD CONSTRAINT "budget_taxonomy_mapping_category_axis_fk" FOREIGN KEY ("category_id","axis") REFERENCES "public"."budget_categories"("id","axis") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_lines" ADD CONSTRAINT "expense_lines_import_id_import_batches_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."import_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation_checks" ADD CONSTRAINT "reconciliation_checks_import_id_import_batches_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."import_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_lines" ADD CONSTRAINT "revenue_lines_import_id_import_batches_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."import_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expense_lines_import_id_idx" ON "expense_lines" USING btree ("import_id");--> statement-breakpoint
CREATE INDEX "expense_lines_functional_code_idx" ON "expense_lines" USING btree ("functional_code");--> statement-breakpoint
CREATE INDEX "reconciliation_checks_import_id_idx" ON "reconciliation_checks" USING btree ("import_id");--> statement-breakpoint
CREATE INDEX "revenue_lines_import_id_idx" ON "revenue_lines" USING btree ("import_id");--> statement-breakpoint
CREATE INDEX "revenue_lines_functional_code_idx" ON "revenue_lines" USING btree ("functional_code");