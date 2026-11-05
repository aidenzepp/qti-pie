-- grizzle: no-transaction

DROP INDEX CONCURRENTLY IF EXISTS "qti"."__edge_key_parent_child_kind_img_parent_kind_picture_kojhq4stf3";

CREATE UNIQUE INDEX CONCURRENTLY "__edge_key_parent_child_kind_img_parent_kind_picture_kojhq4stf3" ON "qti"."edge" USING btree ("parent") WHERE "child_kind" = 'img'::"qti"."node_kind" AND "parent_kind" = 'picture'::"qti"."node_kind";
