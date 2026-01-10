CREATE INDEX "idx_ticket_messages_ticket_id_created_at" ON "ticket_messages" USING btree ("ticket_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_tickets_client_id_created_at" ON "tickets" USING btree ("client_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_tickets_assigned_to_created_at" ON "tickets" USING btree ("assigned_to","created_at");--> statement-breakpoint
CREATE INDEX "idx_tickets_ticket_type_id" ON "tickets" USING btree ("ticket_type_id");--> statement-breakpoint
CREATE INDEX "idx_tickets_priority" ON "tickets" USING btree ("priority");