CREATE TYPE "auth"."app_user_type" AS ENUM('internal', 'client');--> statement-breakpoint
CREATE TYPE "auth"."internal_role" AS ENUM('support_agent', 'manager', 'admin');--> statement-breakpoint
CREATE TYPE "auth"."account_status" AS ENUM('pending', 'active', 'disabled');--> statement-breakpoint
ALTER TABLE "public"."app_users" DROP CONSTRAINT "app_users_user_type_integrity";--> statement-breakpoint
ALTER TABLE "public"."app_users" SET SCHEMA "auth";--> statement-breakpoint
ALTER TABLE "auth"."app_users" ALTER COLUMN "user_type" TYPE "auth"."app_user_type" USING "user_type"::text::"auth"."app_user_type";--> statement-breakpoint
ALTER TABLE "auth"."app_users" ALTER COLUMN "internal_role" TYPE "auth"."internal_role" USING "internal_role"::text::"auth"."internal_role";--> statement-breakpoint
ALTER TABLE "auth"."app_users" ALTER COLUMN "account_status" TYPE "auth"."account_status" USING "account_status"::text::"auth"."account_status";--> statement-breakpoint
ALTER TABLE "auth"."app_users" ALTER COLUMN "account_status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "auth"."app_users" ADD CONSTRAINT "app_users_user_type_integrity" CHECK ((
        (
          "auth"."app_users"."user_type" = 'client'
          and "auth"."app_users"."team_member_id" is null
          and "auth"."app_users"."internal_role" is null
          and ("auth"."app_users"."account_status" <> 'active' or "auth"."app_users"."client_id" is not null)
        )
        or (
          "auth"."app_users"."user_type" = 'internal'
          and "auth"."app_users"."client_id" is null
          and (
            "auth"."app_users"."account_status" <> 'active'
            or ("auth"."app_users"."team_member_id" is not null and "auth"."app_users"."internal_role" is not null)
          )
        )
      ));--> statement-breakpoint
DROP TYPE "public"."account_status";--> statement-breakpoint
DROP TYPE "public"."app_user_type";--> statement-breakpoint
DROP TYPE "public"."internal_role";

