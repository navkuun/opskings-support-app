CREATE TYPE "public"."account_status" AS ENUM('pending', 'active', 'disabled');--> statement-breakpoint
ALTER TABLE "app_users" DROP CONSTRAINT "app_users_user_type_integrity";--> statement-breakpoint
ALTER TABLE "app_users" ADD COLUMN "account_status" "account_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_app_users_account_status" ON "app_users" USING btree ("account_status");--> statement-breakpoint
ALTER TABLE "app_users" ADD CONSTRAINT "app_users_user_type_integrity" CHECK ((
        (
          "app_users"."user_type" = 'client'
          and "app_users"."team_member_id" is null
          and "app_users"."internal_role" is null
          and ("app_users"."account_status" <> 'active' or "app_users"."client_id" is not null)
        )
        or (
          "app_users"."user_type" = 'internal'
          and "app_users"."client_id" is null
          and (
            "app_users"."account_status" <> 'active'
            or ("app_users"."team_member_id" is not null and "app_users"."internal_role" is not null)
          )
        )
      ));