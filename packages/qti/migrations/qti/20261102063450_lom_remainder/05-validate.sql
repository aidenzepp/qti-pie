ALTER TABLE "qti"."edge" ADD CONSTRAINT "__edge_key_child_parent_kind_jv6mposiie" UNIQUE USING INDEX "__edge_key_child_parent_kind_jv6mposiie";

ALTER TABLE "qti"."lom_value" VALIDATE CONSTRAINT "lom_learning_resource_type";

ALTER TABLE "qti"."lom_value" ADD CONSTRAINT "__lom_value_fk_id_parent_kind_k3ati6fakb" FOREIGN KEY ("id", "parent_kind") REFERENCES "qti"."edge" ("child", "parent_kind") DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE "qti"."lom_value" VALIDATE CONSTRAINT "__lom_value_fk_id_parent_kind_k3ati6fakb";
