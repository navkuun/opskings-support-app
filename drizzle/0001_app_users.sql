CREATE TYPE "public"."app_user_type" AS ENUM('internal', 'client');--> statement-breakpoint
CREATE TYPE "public"."internal_role" AS ENUM('support_agent', 'manager', 'admin');--> statement-breakpoint
CREATE TABLE "app_users" (
	"auth_user_id" text PRIMARY KEY NOT NULL,
	"user_type" "app_user_type" NOT NULL,
	"internal_role" "internal_role",
	"client_id" integer,
	"team_member_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_users_user_type_integrity" CHECK ((
        ("app_users"."user_type" = 'client' and "app_users"."client_id" is not null and "app_users"."team_member_id" is null and "app_users"."internal_role" is null)
        or
        ("app_users"."user_type" = 'internal' and "app_users"."client_id" is null and "app_users"."team_member_id" is not null and "app_users"."internal_role" is not null)
      ))
);
--> statement-breakpoint
ALTER TABLE "app_users" ADD CONSTRAINT "app_users_auth_user_id_user_id_fk" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_users" ADD CONSTRAINT "app_users_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_users" ADD CONSTRAINT "app_users_team_member_id_team_members_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_app_users_user_type" ON "app_users" USING btree ("user_type");--> statement-breakpoint
CREATE INDEX "idx_app_users_client_id" ON "app_users" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_app_users_team_member_id" ON "app_users" USING btree ("team_member_id");