DROP POLICY "qti__author" ON "qti"."node";

DROP POLICY "qti__author" ON "qti"."lom_value";

DROP POLICY "qti__author" ON "qti"."lom";

DROP POLICY "qti__author" ON "qti"."edge";

DROP VIEW "qti__author"."typed_binding";

DROP VIEW "qti__author"."record_binding";

DROP VIEW "qti__author"."operator_arity_max";

DROP VIEW "qti__author"."operator_arity";

DROP VIEW "qti__author"."node";

DROP VIEW "qti__author"."lom_value";

DROP VIEW "qti__author"."lom";

DROP VIEW "qti__author"."interaction_binding";

DROP VIEW "qti__author"."expression";

DROP VIEW "qti__author"."edge";

DROP VIEW "qti__author"."binding_fit";

DROP VIEW "qti__author"."attribute_lexical";

DROP VIEW "qti__author"."admission";

CREATE TABLE "qti"."lom_annotation" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_annotation_pk_pahdalsdmw" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_classification" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_classification_pk_sv4svz23wo" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_context" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_context_pk_d3q5q7l6tv" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_difficulty" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_difficulty_pk_izmwy4nlak" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_educational" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_educational_pk_obnzvqdy6m" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_entry_lang_string" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_entry_lang_string_pk_ieu73vzaj3" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_id" (
  "collapsed" "qti"."__text_ieskz75v7g" NOT NULL,
  "id" uuid NOT NULL,
  "value" text COLLATE "pg_catalog"."pg_c_utf8" NOT NULL,
  CONSTRAINT "__lom_id_pk_m3vjr77vsc" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_intended_end_user_role" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_intended_end_user_role_pk_4ns4gxzj42" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_interactivity_level" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_interactivity_level_pk_smnf62qv23" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_interactivity_type" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_interactivity_type_pk_bs5vquvjc5" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_kind" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_kind_pk_lvae7tdas3" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_learning_resource_type" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_learning_resource_type_pk_nmjempx6wc" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_purpose" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_purpose_pk_icp6pnpvro" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_relation" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_relation_pk_gm4jfwfabn" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_resource" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_resource_pk_jcjprudbpj" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_semantic_density" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_semantic_density_pk_le3a5envz3" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_source_lang_string" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_source_lang_string_pk_6aokne5mpu" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_taxon" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_taxon_pk_23daz4igko" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_taxon_path" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_taxon_path_pk_22rkrrz3j6" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_typical_age_range" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_typical_age_range_pk_3xmo44huiz" PRIMARY KEY ("id")
);

CREATE TABLE "qti"."lom_typical_learning_time" (
  "id" uuid NOT NULL,
  "lom" uuid NOT NULL,
  CONSTRAINT "__lom_typical_learning_time_pk_a3dl6vpcbh" PRIMARY KEY ("id")
);

ALTER TABLE "qti"."lom_annotation" ADD COLUMN "__tag_kind_lom_annotation_wmk4msekhm" "qti"."node_kind" GENERATED ALWAYS AS ('lom:annotation'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_classification" ADD COLUMN "__tag_kind_lom_classification_s33zb3ydxx" "qti"."node_kind" GENERATED ALWAYS AS ('lom:classification'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_context" ADD COLUMN "__tag_kind_lom_context_unp6fhu2i5" "qti"."node_kind" GENERATED ALWAYS AS ('lom:context'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_difficulty" ADD COLUMN "__tag_kind_lom_difficulty_u6oh2pluob" "qti"."node_kind" GENERATED ALWAYS AS ('lom:difficulty'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_educational" ADD COLUMN "__tag_kind_lom_educational_bfejue5lpc" "qti"."node_kind" GENERATED ALWAYS AS ('lom:educational'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_entry_lang_string" ADD COLUMN "__tag_kind_lom_entry_lang_string_yr7dyefaw7" "qti"."node_kind" GENERATED ALWAYS AS ('lom:entry.langString'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_id" ADD COLUMN "__tag_kind_lom_id_qophyddse4" "qti"."node_kind" GENERATED ALWAYS AS ('lom:id'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_intended_end_user_role" ADD COLUMN "__tag_kind_lom_intended_end_user_role_fu7zxsgpuk" "qti"."node_kind" GENERATED ALWAYS AS ('lom:intendedEndUserRole'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_interactivity_level" ADD COLUMN "__tag_kind_lom_interactivity_level_42hqjwr3eg" "qti"."node_kind" GENERATED ALWAYS AS ('lom:interactivityLevel'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_interactivity_type" ADD COLUMN "__tag_kind_lom_interactivity_type_mx3pzoaf7t" "qti"."node_kind" GENERATED ALWAYS AS ('lom:interactivityType'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_kind" ADD COLUMN "__tag_kind_lom_kind_xuf2kkwyr4" "qti"."node_kind" GENERATED ALWAYS AS ('lom:kind'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_learning_resource_type" ADD COLUMN "__tag_kind_lom_learning_resource_type_mm2kxi35r2" "qti"."node_kind" GENERATED ALWAYS AS ('lom:learningResourceType'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_purpose" ADD COLUMN "__tag_kind_lom_purpose_qtsfpmrlct" "qti"."node_kind" GENERATED ALWAYS AS ('lom:purpose'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_relation" ADD COLUMN "__tag_kind_lom_relation_adpqqvr6or" "qti"."node_kind" GENERATED ALWAYS AS ('lom:relation'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_resource" ADD COLUMN "__tag_kind_lom_resource_jgqpmzi3u4" "qti"."node_kind" GENERATED ALWAYS AS ('lom:resource'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_semantic_density" ADD COLUMN "__tag_kind_lom_semantic_density_uqmekskg64" "qti"."node_kind" GENERATED ALWAYS AS ('lom:semanticDensity'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_source_lang_string" ADD COLUMN "__tag_kind_lom_source_lang_string_3blfwn3hhk" "qti"."node_kind" GENERATED ALWAYS AS ('lom:source.langString'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_taxon" ADD COLUMN "__tag_kind_lom_taxon_2gykitonjg" "qti"."node_kind" GENERATED ALWAYS AS ('lom:taxon'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_taxon_path" ADD COLUMN "__tag_kind_lom_taxon_path_ifvs3xty7l" "qti"."node_kind" GENERATED ALWAYS AS ('lom:taxonPath'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_typical_age_range" ADD COLUMN "__tag_kind_lom_typical_age_range_b2nwhfufjs" "qti"."node_kind" GENERATED ALWAYS AS ('lom:typicalAgeRange'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_typical_learning_time" ADD COLUMN "__tag_kind_lom_typical_learning_time_jvgzdwqqg4" "qti"."node_kind" GENERATED ALWAYS AS ('lom:typicalLearningTime'::"qti"."node_kind") STORED NOT NULL;

ALTER TABLE "qti"."lom_value" ADD CONSTRAINT "lom_learning_resource_type" CHECK ((NOT "collapsed" IN ('self assessment'::text, 'exam'::text) OR "parent_kind" <> 'lom:learningResourceType'::"qti"."node_kind") IS TRUE) NOT VALID;

ALTER TABLE "qti"."lom_annotation" ADD CONSTRAINT "__lom_annotation_fk_id_tag_kind_lom_annotation_wmk_4_lavkjljdee" FOREIGN KEY ("id", "__tag_kind_lom_annotation_wmk4msekhm") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_annotation" ADD CONSTRAINT "__lom_annotation_fk_id_lom_fvl6yckn7w" FOREIGN KEY ("id", "lom") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_annotation" ADD CONSTRAINT "__lom_annotation_fk_lom_zekvm5wtoq" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_classification" ADD CONSTRAINT "__lom_classification_fk_id_tag_kind_lom_2chxdeo54b" FOREIGN KEY ("id", "__tag_kind_lom_classification_s33zb3ydxx") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_classification" ADD CONSTRAINT "__lom_classification_fk_id_lom_lbzjzocrka" FOREIGN KEY ("id", "lom") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_classification" ADD CONSTRAINT "__lom_classification_fk_lom_oe4atcfgdx" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_context" ADD CONSTRAINT "__lom_context_fk_id_tag_kind_lom_context_unp_6_fhu_2_uutdmnxs3j" FOREIGN KEY ("id", "__tag_kind_lom_context_unp6fhu2i5") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_context" ADD CONSTRAINT "__lom_context_fk_lom_y2fvbzxfmp" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_difficulty" ADD CONSTRAINT "__lom_difficulty_fk_id_tag_kind_lom_difficulty_u_6_f6wuieia5v" FOREIGN KEY ("id", "__tag_kind_lom_difficulty_u6oh2pluob") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_difficulty" ADD CONSTRAINT "__lom_difficulty_fk_lom_qtl7zjkhp4" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_educational" ADD CONSTRAINT "__lom_educational_fk_id_tag_kind_lom_educational_u2hj6zfswu" FOREIGN KEY ("id", "__tag_kind_lom_educational_bfejue5lpc") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_educational" ADD CONSTRAINT "__lom_educational_fk_id_lom_lkprbuhw2p" FOREIGN KEY ("id", "lom") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_educational" ADD CONSTRAINT "__lom_educational_fk_lom_cwyavg2yop" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_entry_lang_string" ADD CONSTRAINT "__lom_entry_lang_string_fk_id_tag_kind_lom_entry_gmkubnhnma" FOREIGN KEY ("id", "__tag_kind_lom_entry_lang_string_yr7dyefaw7") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_entry_lang_string" ADD CONSTRAINT "__lom_entry_lang_string_fk_lom_t3jwxa4puv" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_id" ADD CONSTRAINT "__lom_id_fk_id_tag_kind_lom_id_qophyddse_4_dn4cdvz5zw" FOREIGN KEY ("id", "__tag_kind_lom_id_qophyddse4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_intended_end_user_role" ADD CONSTRAINT "__lom_intended_end_user_role_fk_id_tag_kind_lom_egpc75apis" FOREIGN KEY ("id", "__tag_kind_lom_intended_end_user_role_fu7zxsgpuk") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_intended_end_user_role" ADD CONSTRAINT "__lom_intended_end_user_role_fk_lom_ktfhs6wv7t" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_interactivity_level" ADD CONSTRAINT "__lom_interactivity_level_fk_id_tag_kind_lom_aiamt7iwqo" FOREIGN KEY ("id", "__tag_kind_lom_interactivity_level_42hqjwr3eg") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_interactivity_level" ADD CONSTRAINT "__lom_interactivity_level_fk_lom_sbe3wkv47z" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_interactivity_type" ADD CONSTRAINT "__lom_interactivity_type_fk_id_tag_kind_lom_r22zgwluzg" FOREIGN KEY ("id", "__tag_kind_lom_interactivity_type_mx3pzoaf7t") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_interactivity_type" ADD CONSTRAINT "__lom_interactivity_type_fk_lom_ttjit342cz" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_kind" ADD CONSTRAINT "__lom_kind_fk_id_tag_kind_lom_kind_xuf_2_kkwyr_4_zz5lccb55i" FOREIGN KEY ("id", "__tag_kind_lom_kind_xuf2kkwyr4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_kind" ADD CONSTRAINT "__lom_kind_fk_lom_x5v72f33di" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_learning_resource_type" ADD CONSTRAINT "__lom_learning_resource_type_fk_id_tag_kind_lom_7uw7egcsk5" FOREIGN KEY ("id", "__tag_kind_lom_learning_resource_type_mm2kxi35r2") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_learning_resource_type" ADD CONSTRAINT "__lom_learning_resource_type_fk_lom_u64xh2vyxm" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_purpose" ADD CONSTRAINT "__lom_purpose_fk_id_tag_kind_lom_purpose_qtsfpmrlct_nobdk2jbas" FOREIGN KEY ("id", "__tag_kind_lom_purpose_qtsfpmrlct") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_purpose" ADD CONSTRAINT "__lom_purpose_fk_lom_xy4taailou" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_relation" ADD CONSTRAINT "__lom_relation_fk_id_tag_kind_lom_relation_adpqqvr_6_6cfiwwa7tj" FOREIGN KEY ("id", "__tag_kind_lom_relation_adpqqvr6or") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_relation" ADD CONSTRAINT "__lom_relation_fk_id_lom_zmkhto22ty" FOREIGN KEY ("id", "lom") REFERENCES "qti"."edge" ("child", "parent") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_relation" ADD CONSTRAINT "__lom_relation_fk_lom_gmpdl7y72h" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_resource" ADD CONSTRAINT "__lom_resource_fk_id_tag_kind_lom_resource_jgqpmzi_3_6qi7ptxdfc" FOREIGN KEY ("id", "__tag_kind_lom_resource_jgqpmzi3u4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_resource" ADD CONSTRAINT "__lom_resource_fk_lom_jmhhitoiys" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_semantic_density" ADD CONSTRAINT "__lom_semantic_density_fk_id_tag_kind_lom_semantic_4fn5sxcuig" FOREIGN KEY ("id", "__tag_kind_lom_semantic_density_uqmekskg64") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_semantic_density" ADD CONSTRAINT "__lom_semantic_density_fk_lom_dxydczl7vk" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_source_lang_string" ADD CONSTRAINT "__lom_source_lang_string_fk_id_tag_kind_lom_source_r7qdlilqsg" FOREIGN KEY ("id", "__tag_kind_lom_source_lang_string_3blfwn3hhk") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_source_lang_string" ADD CONSTRAINT "__lom_source_lang_string_fk_lom_z7zml3al6y" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_taxon" ADD CONSTRAINT "__lom_taxon_fk_id_tag_kind_lom_taxon_2_gykitonjg_zavitntcvd" FOREIGN KEY ("id", "__tag_kind_lom_taxon_2gykitonjg") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_taxon" ADD CONSTRAINT "__lom_taxon_fk_lom_5mvtruica4" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_taxon_path" ADD CONSTRAINT "__lom_taxon_path_fk_id_tag_kind_lom_taxon_path_ifvs_tq7eupudq3" FOREIGN KEY ("id", "__tag_kind_lom_taxon_path_ifvs3xty7l") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_taxon_path" ADD CONSTRAINT "__lom_taxon_path_fk_lom_k3h74twnz6" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_typical_age_range" ADD CONSTRAINT "__lom_typical_age_range_fk_id_tag_kind_lom_typical_ioa2kacvy3" FOREIGN KEY ("id", "__tag_kind_lom_typical_age_range_b2nwhfufjs") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_typical_age_range" ADD CONSTRAINT "__lom_typical_age_range_fk_lom_mvwf7dmhci" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_typical_learning_time" ADD CONSTRAINT "__lom_typical_learning_time_fk_id_tag_kind_lom_43cggo65yx" FOREIGN KEY ("id", "__tag_kind_lom_typical_learning_time_jvgzdwqqg4") REFERENCES "qti"."node" ("id", "kind") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "qti"."lom_typical_learning_time" ADD CONSTRAINT "__lom_typical_learning_time_fk_lom_rybcun2wt3" FOREIGN KEY ("lom") REFERENCES "qti"."lom" ("id") DEFERRABLE INITIALLY DEFERRED;

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_annotation"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_classification"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_context"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_difficulty"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_educational"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_entry_lang_string"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_id"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_intended_end_user_role"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_interactivity_level"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_interactivity_type"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_kind"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_learning_resource_type"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_purpose"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_relation"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_resource"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_semantic_density"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_source_lang_string"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_taxon"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_taxon_path"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_typical_age_range"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE TRIGGER "__isolation"
  BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "qti"."lom_typical_learning_time"
  FOR EACH STATEMENT EXECUTE FUNCTION "qti"."__require_serializable"();

CREATE VIEW "qti__author"."admission" ("child", "parent", "version") AS
SELECT "r1"."child", "r1"."parent", "r1"."version"
FROM "qti"."admission" AS "r1";

GRANT SELECT ON TABLE "qti__author"."admission" TO "qti__author";

CREATE VIEW "qti__author"."attribute_lexical" ("attribute", "kind", "node", "value") AS
SELECT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."value"
FROM "qti"."attribute_lexical" AS "r1";

GRANT SELECT ON TABLE "qti__author"."attribute_lexical" TO "qti__author";

CREATE VIEW "qti__author"."binding_fit" ("base_type", "cardinality", "interaction_kind") AS
SELECT "r1"."base_type", "r1"."cardinality", "r1"."interaction_kind"
FROM "qti"."binding_fit" AS "r1";

GRANT SELECT ON TABLE "qti__author"."binding_fit" TO "qti__author";

CREATE VIEW "qti__author"."edge" ("child", "child_kind", "parent", "parent_kind", "position", "tree", "version") AS
SELECT "r1"."child", "r1"."child_kind", "r1"."parent", "r1"."parent_kind", "r1"."position", "r1"."tree", "r1"."version"
FROM "qti"."edge" AS "r1";

GRANT SELECT ON TABLE "qti__author"."edge" TO "qti__author";

CREATE VIEW "qti__author"."expression" ("document", "id", "kind") AS
SELECT "r1"."document", "r1"."id", "r1"."kind"
FROM "qti"."expression" AS "r1";

GRANT SELECT ON TABLE "qti__author"."expression" TO "qti__author";

CREATE VIEW "qti__author"."interaction_binding" ("document", "interaction_kind", "node", "response_identifier", "shape") AS
SELECT "r1"."document", "r1"."interaction_kind", "r1"."node", "r1"."response_identifier", "r1"."shape"
FROM "qti"."interaction_binding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."interaction_binding" TO "qti__author";

CREATE VIEW "qti__author"."lom" ("id", "owner", "package") AS
SELECT "r1"."id", "r1"."owner", "r1"."package"
FROM "qti"."lom" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom" TO "qti__author";

CREATE VIEW "qti__author"."lom_annotation" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_annotation" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_annotation" TO "qti__author";

CREATE VIEW "qti__author"."lom_classification" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_classification" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_classification" TO "qti__author";

CREATE VIEW "qti__author"."lom_context" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_context" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_context" TO "qti__author";

CREATE VIEW "qti__author"."lom_difficulty" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_difficulty" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_difficulty" TO "qti__author";

CREATE VIEW "qti__author"."lom_educational" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_educational" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_educational" TO "qti__author";

CREATE VIEW "qti__author"."lom_entry_lang_string" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_entry_lang_string" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_entry_lang_string" TO "qti__author";

CREATE VIEW "qti__author"."lom_id" ("collapsed", "id", "value") AS
SELECT "r1"."collapsed", "r1"."id", "r1"."value"
FROM "qti"."lom_id" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_id" TO "qti__author";

CREATE VIEW "qti__author"."lom_intended_end_user_role" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_intended_end_user_role" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_intended_end_user_role" TO "qti__author";

CREATE VIEW "qti__author"."lom_interactivity_level" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_interactivity_level" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_interactivity_level" TO "qti__author";

CREATE VIEW "qti__author"."lom_interactivity_type" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_interactivity_type" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_interactivity_type" TO "qti__author";

CREATE VIEW "qti__author"."lom_kind" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_kind" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_kind" TO "qti__author";

CREATE VIEW "qti__author"."lom_learning_resource_type" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_learning_resource_type" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_learning_resource_type" TO "qti__author";

CREATE VIEW "qti__author"."lom_purpose" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_purpose" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_purpose" TO "qti__author";

CREATE VIEW "qti__author"."lom_relation" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_relation" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_relation" TO "qti__author";

CREATE VIEW "qti__author"."lom_resource" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_resource" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_resource" TO "qti__author";

CREATE VIEW "qti__author"."lom_semantic_density" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_semantic_density" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_semantic_density" TO "qti__author";

CREATE VIEW "qti__author"."lom_source_lang_string" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_source_lang_string" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_source_lang_string" TO "qti__author";

CREATE VIEW "qti__author"."lom_taxon" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_taxon" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_taxon" TO "qti__author";

CREATE VIEW "qti__author"."lom_taxon_path" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_taxon_path" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_taxon_path" TO "qti__author";

CREATE VIEW "qti__author"."lom_typical_age_range" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_typical_age_range" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_typical_age_range" TO "qti__author";

CREATE VIEW "qti__author"."lom_typical_learning_time" ("id", "lom") AS
SELECT "r1"."id", "r1"."lom"
FROM "qti"."lom_typical_learning_time" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_typical_learning_time" TO "qti__author";

CREATE VIEW "qti__author"."lom_value" ("collapsed", "id", "parent_kind", "value") AS
SELECT "r1"."collapsed", "r1"."id", "r1"."parent_kind", "r1"."value"
FROM "qti"."lom_value" AS "r1";

GRANT SELECT ON TABLE "qti__author"."lom_value" TO "qti__author";

CREATE VIEW "qti__author"."node" ("id", "kind", "prefix", "root_kind", "tree", "version") AS
SELECT "r1"."id", "r1"."kind", "r1"."prefix", "r1"."root_kind", "r1"."tree", "r1"."version"
FROM "qti"."node" AS "r1";

GRANT SELECT ON TABLE "qti__author"."node" TO "qti__author";

CREATE VIEW "qti__author"."operator_arity" ("kind", "min") AS
SELECT "r1"."kind", "r1"."min"
FROM "qti"."operator_arity" AS "r1";

GRANT SELECT ON TABLE "qti__author"."operator_arity" TO "qti__author";

CREATE VIEW "qti__author"."operator_arity_max" ("kind", "max") AS
SELECT "r1"."kind", "r1"."max"
FROM "qti"."operator_arity_max" AS "r1";

GRANT SELECT ON TABLE "qti__author"."operator_arity_max" TO "qti__author";

CREATE VIEW "qti__author"."record_binding" ("interaction_kind", "node") AS
SELECT "r1"."interaction_kind", "r1"."node"
FROM "qti"."record_binding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."record_binding" TO "qti__author";

CREATE VIEW "qti__author"."typed_binding" ("base_type", "cardinality", "document", "interaction_kind", "max_count", "node", "response_identifier") AS
SELECT "r1"."base_type", "r1"."cardinality", "r1"."document", "r1"."interaction_kind", "r1"."max_count", "r1"."node", "r1"."response_identifier"
FROM "qti"."typed_binding" AS "r1";

GRANT SELECT ON TABLE "qti__author"."typed_binding" TO "qti__author";

CREATE POLICY "qti__author" ON "qti"."edge" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_annotation" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_classification" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_context" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_difficulty" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_educational" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_entry_lang_string" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_id" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_intended_end_user_role" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_interactivity_level" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_interactivity_type" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_kind" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_learning_resource_type" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_purpose" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_relation" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_resource" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_semantic_density" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_source_lang_string" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_taxon" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_taxon_path" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_typical_age_range" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_typical_learning_time" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."lom_value" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__author" ON "qti"."node" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);
