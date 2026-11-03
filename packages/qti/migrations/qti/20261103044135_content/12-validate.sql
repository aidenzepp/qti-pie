-- Validate law __map_entry_base_type_alternatives_zhy4acy6cn: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."map_entry", "qti"."map_entry_boolean", "qti"."map_entry_directed_pair", "qti"."map_entry_duration", "qti"."map_entry_file", "qti"."map_entry_float", "qti"."map_entry_identifier", "qti"."map_entry_integer", "qti"."map_entry_pair", "qti"."map_entry_point", "qti"."map_entry_string", "qti"."map_entry_uri" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_map_entry_base_type_alternatives_z72azgyqew"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" record;
BEGIN
  IF TG_TABLE_NAME = 'map_entry'::text THEN
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."map_entry" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
      CASE "p"."c2"
        WHEN 'boolean'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_boolean" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'integer'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_integer" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'float'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_float" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'string'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_string" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'identifier'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_identifier" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'uri'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_uri" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'duration'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_duration" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'point'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_point" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'pair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'directedPair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_directed_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'file'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_file" AS "r1" WHERE "r1"."id" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __map_entry_base_type_alternatives_zhy4acy6cn violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__map_entry_base_type_alternatives_zhy4acy6cn'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["MapEntry",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["MapEntry"]'::text END;
      END IF;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'map_entry_boolean'::text THEN
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."map_entry" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      CASE "p"."c2"
        WHEN 'boolean'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_boolean" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'integer'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_integer" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'float'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_float" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'string'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_string" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'identifier'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_identifier" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'uri'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_uri" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'duration'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_duration" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'point'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_point" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'pair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'directedPair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_directed_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'file'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_file" AS "r1" WHERE "r1"."id" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __map_entry_base_type_alternatives_zhy4acy6cn violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__map_entry_base_type_alternatives_zhy4acy6cn'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["MapEntry",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["MapEntry"]'::text END;
      END IF;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'map_entry_integer'::text THEN
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."map_entry" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      CASE "p"."c2"
        WHEN 'boolean'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_boolean" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'integer'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_integer" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'float'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_float" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'string'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_string" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'identifier'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_identifier" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'uri'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_uri" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'duration'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_duration" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'point'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_point" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'pair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'directedPair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_directed_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'file'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_file" AS "r1" WHERE "r1"."id" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __map_entry_base_type_alternatives_zhy4acy6cn violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__map_entry_base_type_alternatives_zhy4acy6cn'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["MapEntry",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["MapEntry"]'::text END;
      END IF;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'map_entry_float'::text THEN
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."map_entry" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      CASE "p"."c2"
        WHEN 'boolean'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_boolean" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'integer'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_integer" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'float'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_float" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'string'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_string" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'identifier'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_identifier" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'uri'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_uri" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'duration'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_duration" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'point'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_point" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'pair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'directedPair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_directed_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'file'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_file" AS "r1" WHERE "r1"."id" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __map_entry_base_type_alternatives_zhy4acy6cn violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__map_entry_base_type_alternatives_zhy4acy6cn'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["MapEntry",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["MapEntry"]'::text END;
      END IF;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'map_entry_string'::text THEN
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."map_entry" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      CASE "p"."c2"
        WHEN 'boolean'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_boolean" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'integer'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_integer" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'float'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_float" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'string'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_string" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'identifier'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_identifier" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'uri'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_uri" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'duration'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_duration" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'point'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_point" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'pair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'directedPair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_directed_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'file'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_file" AS "r1" WHERE "r1"."id" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __map_entry_base_type_alternatives_zhy4acy6cn violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__map_entry_base_type_alternatives_zhy4acy6cn'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["MapEntry",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["MapEntry"]'::text END;
      END IF;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'map_entry_identifier'::text THEN
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."map_entry" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      CASE "p"."c2"
        WHEN 'boolean'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_boolean" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'integer'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_integer" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'float'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_float" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'string'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_string" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'identifier'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_identifier" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'uri'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_uri" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'duration'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_duration" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'point'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_point" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'pair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'directedPair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_directed_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'file'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_file" AS "r1" WHERE "r1"."id" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __map_entry_base_type_alternatives_zhy4acy6cn violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__map_entry_base_type_alternatives_zhy4acy6cn'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["MapEntry",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["MapEntry"]'::text END;
      END IF;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'map_entry_uri'::text THEN
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."map_entry" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      CASE "p"."c2"
        WHEN 'boolean'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_boolean" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'integer'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_integer" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'float'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_float" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'string'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_string" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'identifier'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_identifier" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'uri'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_uri" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'duration'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_duration" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'point'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_point" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'pair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'directedPair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_directed_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'file'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_file" AS "r1" WHERE "r1"."id" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __map_entry_base_type_alternatives_zhy4acy6cn violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__map_entry_base_type_alternatives_zhy4acy6cn'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["MapEntry",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["MapEntry"]'::text END;
      END IF;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'map_entry_duration'::text THEN
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."map_entry" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      CASE "p"."c2"
        WHEN 'boolean'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_boolean" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'integer'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_integer" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'float'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_float" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'string'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_string" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'identifier'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_identifier" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'uri'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_uri" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'duration'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_duration" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'point'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_point" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'pair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'directedPair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_directed_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'file'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_file" AS "r1" WHERE "r1"."id" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __map_entry_base_type_alternatives_zhy4acy6cn violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__map_entry_base_type_alternatives_zhy4acy6cn'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["MapEntry",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["MapEntry"]'::text END;
      END IF;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'map_entry_point'::text THEN
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."map_entry" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      CASE "p"."c2"
        WHEN 'boolean'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_boolean" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'integer'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_integer" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'float'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_float" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'string'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_string" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'identifier'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_identifier" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'uri'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_uri" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'duration'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_duration" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'point'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_point" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'pair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'directedPair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_directed_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'file'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_file" AS "r1" WHERE "r1"."id" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __map_entry_base_type_alternatives_zhy4acy6cn violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__map_entry_base_type_alternatives_zhy4acy6cn'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["MapEntry",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["MapEntry"]'::text END;
      END IF;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'map_entry_pair'::text THEN
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."map_entry" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      CASE "p"."c2"
        WHEN 'boolean'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_boolean" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'integer'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_integer" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'float'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_float" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'string'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_string" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'identifier'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_identifier" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'uri'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_uri" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'duration'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_duration" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'point'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_point" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'pair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'directedPair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_directed_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'file'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_file" AS "r1" WHERE "r1"."id" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __map_entry_base_type_alternatives_zhy4acy6cn violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__map_entry_base_type_alternatives_zhy4acy6cn'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["MapEntry",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["MapEntry"]'::text END;
      END IF;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'map_entry_directed_pair'::text THEN
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."map_entry" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      CASE "p"."c2"
        WHEN 'boolean'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_boolean" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'integer'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_integer" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'float'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_float" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'string'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_string" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'identifier'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_identifier" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'uri'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_uri" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'duration'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_duration" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'point'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_point" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'pair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'directedPair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_directed_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'file'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_file" AS "r1" WHERE "r1"."id" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __map_entry_base_type_alternatives_zhy4acy6cn violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__map_entry_base_type_alternatives_zhy4acy6cn'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["MapEntry",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["MapEntry"]'::text END;
      END IF;
    END LOOP;
  ELSE
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."map_entry" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      CASE "p"."c2"
        WHEN 'boolean'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_boolean" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'integer'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_integer" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'float'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_float" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'string'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_string" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'identifier'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_identifier" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'uri'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_uri" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'duration'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_duration" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'point'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_point" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'pair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'directedPair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_directed_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'file'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."map_entry_file" AS "r1" WHERE "r1"."id" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __map_entry_base_type_alternatives_zhy4acy6cn violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__map_entry_base_type_alternatives_zhy4acy6cn'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["MapEntry",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["MapEntry"]'::text END;
      END IF;
    END LOOP;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_map_entry_base_type_alternatives_z72azgyqew"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_map_entry_base_type_alternatives_g43izcycal"
  AFTER INSERT ON "qti"."map_entry"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_map_entry_base_type_alternatives_z72azgyqew"();

CREATE CONSTRAINT TRIGGER "__law_map_entry_base_type_alternatives_ajzma5dtts"
  AFTER DELETE ON "qti"."map_entry_boolean"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_map_entry_base_type_alternatives_z72azgyqew"();

CREATE CONSTRAINT TRIGGER "__law_map_entry_base_type_alternatives_2o6i4ui7jr"
  AFTER DELETE ON "qti"."map_entry_directed_pair"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_map_entry_base_type_alternatives_z72azgyqew"();

CREATE CONSTRAINT TRIGGER "__law_map_entry_base_type_alternatives_iy45ouclyf"
  AFTER DELETE ON "qti"."map_entry_duration"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_map_entry_base_type_alternatives_z72azgyqew"();

CREATE CONSTRAINT TRIGGER "__law_map_entry_base_type_alternatives_sa6syhjmbq"
  AFTER DELETE ON "qti"."map_entry_file"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_map_entry_base_type_alternatives_z72azgyqew"();

CREATE CONSTRAINT TRIGGER "__law_map_entry_base_type_alternatives_66e6zxxo5c"
  AFTER DELETE ON "qti"."map_entry_float"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_map_entry_base_type_alternatives_z72azgyqew"();

CREATE CONSTRAINT TRIGGER "__law_map_entry_base_type_alternatives_tjugiq4soq"
  AFTER DELETE ON "qti"."map_entry_identifier"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_map_entry_base_type_alternatives_z72azgyqew"();

CREATE CONSTRAINT TRIGGER "__law_map_entry_base_type_alternatives_lcyl2bemjm"
  AFTER DELETE ON "qti"."map_entry_integer"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_map_entry_base_type_alternatives_z72azgyqew"();

CREATE CONSTRAINT TRIGGER "__law_map_entry_base_type_alternatives_q5npgxja73"
  AFTER DELETE ON "qti"."map_entry_pair"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_map_entry_base_type_alternatives_z72azgyqew"();

CREATE CONSTRAINT TRIGGER "__law_map_entry_base_type_alternatives_gwd4phjdxk"
  AFTER DELETE ON "qti"."map_entry_point"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_map_entry_base_type_alternatives_z72azgyqew"();

CREATE CONSTRAINT TRIGGER "__law_map_entry_base_type_alternatives_tjw7cw2icj"
  AFTER DELETE ON "qti"."map_entry_string"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_map_entry_base_type_alternatives_z72azgyqew"();

CREATE CONSTRAINT TRIGGER "__law_map_entry_base_type_alternatives_wb44t2syqx"
  AFTER DELETE ON "qti"."map_entry_uri"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_map_entry_base_type_alternatives_z72azgyqew"();

-- The full violation query of law __map_entry_base_type_alternatives_zhy4acy6cn.
DO $$
BEGIN
  IF EXISTS (SELECT "r100"."c155" AS "id" FROM (SELECT "r9"."c14" FROM (SELECT DISTINCT "r4"."c9" FROM (SELECT DISTINCT "r3"."c8" FROM (SELECT DISTINCT "r2"."c4" FROM (SELECT DISTINCT "r1"."base_type", "r1"."case_sensitive", "r1"."declaration", "r1"."id", "r1"."mapped_value", "r1"."mapping", "r1"."position" FROM "qti"."map_entry" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6", "c7") WHERE "r2"."c1" = 'boolean'::"qti"."base_type") AS "r3"("c8")) AS "r4"("c9") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c12" FROM (SELECT DISTINCT "r6"."c10" FROM (SELECT DISTINCT "r5"."id", "r5"."map_key" FROM "qti"."map_entry_boolean" AS "r5") AS "r6"("c10", "c11")) AS "r7"("c12")) AS "r8"("c13") WHERE "r8"."c13" = "r4"."c9")) AS "r9"("c14") UNION SELECT "r18"."c28" FROM (SELECT DISTINCT "r13"."c23" FROM (SELECT DISTINCT "r12"."c22" FROM (SELECT DISTINCT "r11"."c18" FROM (SELECT DISTINCT "r10"."base_type", "r10"."case_sensitive", "r10"."declaration", "r10"."id", "r10"."mapped_value", "r10"."mapping", "r10"."position" FROM "qti"."map_entry" AS "r10") AS "r11"("c15", "c16", "c17", "c18", "c19", "c20", "c21") WHERE "r11"."c15" = 'integer'::"qti"."base_type") AS "r12"("c22")) AS "r13"("c23") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r16"."c26" FROM (SELECT DISTINCT "r15"."c24" FROM (SELECT DISTINCT "r14"."id", "r14"."map_key" FROM "qti"."map_entry_integer" AS "r14") AS "r15"("c24", "c25")) AS "r16"("c26")) AS "r17"("c27") WHERE "r17"."c27" = "r13"."c23")) AS "r18"("c28") UNION SELECT "r27"."c42" FROM (SELECT DISTINCT "r22"."c37" FROM (SELECT DISTINCT "r21"."c36" FROM (SELECT DISTINCT "r20"."c32" FROM (SELECT DISTINCT "r19"."base_type", "r19"."case_sensitive", "r19"."declaration", "r19"."id", "r19"."mapped_value", "r19"."mapping", "r19"."position" FROM "qti"."map_entry" AS "r19") AS "r20"("c29", "c30", "c31", "c32", "c33", "c34", "c35") WHERE "r20"."c29" = 'float'::"qti"."base_type") AS "r21"("c36")) AS "r22"("c37") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r25"."c40" FROM (SELECT DISTINCT "r24"."c38" FROM (SELECT DISTINCT "r23"."id", "r23"."map_key" FROM "qti"."map_entry_float" AS "r23") AS "r24"("c38", "c39")) AS "r25"("c40")) AS "r26"("c41") WHERE "r26"."c41" = "r22"."c37")) AS "r27"("c42") UNION SELECT "r36"."c56" FROM (SELECT DISTINCT "r31"."c51" FROM (SELECT DISTINCT "r30"."c50" FROM (SELECT DISTINCT "r29"."c46" FROM (SELECT DISTINCT "r28"."base_type", "r28"."case_sensitive", "r28"."declaration", "r28"."id", "r28"."mapped_value", "r28"."mapping", "r28"."position" FROM "qti"."map_entry" AS "r28") AS "r29"("c43", "c44", "c45", "c46", "c47", "c48", "c49") WHERE "r29"."c43" = 'string'::"qti"."base_type") AS "r30"("c50")) AS "r31"("c51") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r34"."c54" FROM (SELECT DISTINCT "r33"."c52" FROM (SELECT DISTINCT "r32"."id", "r32"."map_key" FROM "qti"."map_entry_string" AS "r32") AS "r33"("c52", "c53")) AS "r34"("c54")) AS "r35"("c55") WHERE "r35"."c55" = "r31"."c51")) AS "r36"("c56") UNION SELECT "r45"."c70" FROM (SELECT DISTINCT "r40"."c65" FROM (SELECT DISTINCT "r39"."c64" FROM (SELECT DISTINCT "r38"."c60" FROM (SELECT DISTINCT "r37"."base_type", "r37"."case_sensitive", "r37"."declaration", "r37"."id", "r37"."mapped_value", "r37"."mapping", "r37"."position" FROM "qti"."map_entry" AS "r37") AS "r38"("c57", "c58", "c59", "c60", "c61", "c62", "c63") WHERE "r38"."c57" = 'identifier'::"qti"."base_type") AS "r39"("c64")) AS "r40"("c65") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r43"."c68" FROM (SELECT DISTINCT "r42"."c66" FROM (SELECT DISTINCT "r41"."id", "r41"."map_key" FROM "qti"."map_entry_identifier" AS "r41") AS "r42"("c66", "c67")) AS "r43"("c68")) AS "r44"("c69") WHERE "r44"."c69" = "r40"."c65")) AS "r45"("c70") UNION SELECT "r54"."c84" FROM (SELECT DISTINCT "r49"."c79" FROM (SELECT DISTINCT "r48"."c78" FROM (SELECT DISTINCT "r47"."c74" FROM (SELECT DISTINCT "r46"."base_type", "r46"."case_sensitive", "r46"."declaration", "r46"."id", "r46"."mapped_value", "r46"."mapping", "r46"."position" FROM "qti"."map_entry" AS "r46") AS "r47"("c71", "c72", "c73", "c74", "c75", "c76", "c77") WHERE "r47"."c71" = 'uri'::"qti"."base_type") AS "r48"("c78")) AS "r49"("c79") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r52"."c82" FROM (SELECT DISTINCT "r51"."c80" FROM (SELECT DISTINCT "r50"."id", "r50"."map_key" FROM "qti"."map_entry_uri" AS "r50") AS "r51"("c80", "c81")) AS "r52"("c82")) AS "r53"("c83") WHERE "r53"."c83" = "r49"."c79")) AS "r54"("c84") UNION SELECT "r63"."c98" FROM (SELECT DISTINCT "r58"."c93" FROM (SELECT DISTINCT "r57"."c92" FROM (SELECT DISTINCT "r56"."c88" FROM (SELECT DISTINCT "r55"."base_type", "r55"."case_sensitive", "r55"."declaration", "r55"."id", "r55"."mapped_value", "r55"."mapping", "r55"."position" FROM "qti"."map_entry" AS "r55") AS "r56"("c85", "c86", "c87", "c88", "c89", "c90", "c91") WHERE "r56"."c85" = 'duration'::"qti"."base_type") AS "r57"("c92")) AS "r58"("c93") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r61"."c96" FROM (SELECT DISTINCT "r60"."c94" FROM (SELECT DISTINCT "r59"."id", "r59"."map_key" FROM "qti"."map_entry_duration" AS "r59") AS "r60"("c94", "c95")) AS "r61"("c96")) AS "r62"("c97") WHERE "r62"."c97" = "r58"."c93")) AS "r63"("c98") UNION SELECT "r72"."c112" FROM (SELECT DISTINCT "r67"."c107" FROM (SELECT DISTINCT "r66"."c106" FROM (SELECT DISTINCT "r65"."c102" FROM (SELECT DISTINCT "r64"."base_type", "r64"."case_sensitive", "r64"."declaration", "r64"."id", "r64"."mapped_value", "r64"."mapping", "r64"."position" FROM "qti"."map_entry" AS "r64") AS "r65"("c99", "c100", "c101", "c102", "c103", "c104", "c105") WHERE "r65"."c99" = 'point'::"qti"."base_type") AS "r66"("c106")) AS "r67"("c107") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r70"."c110" FROM (SELECT DISTINCT "r69"."c108" FROM (SELECT DISTINCT "r68"."id", "r68"."map_key" FROM "qti"."map_entry_point" AS "r68") AS "r69"("c108", "c109")) AS "r70"("c110")) AS "r71"("c111") WHERE "r71"."c111" = "r67"."c107")) AS "r72"("c112") UNION SELECT "r81"."c126" FROM (SELECT DISTINCT "r76"."c121" FROM (SELECT DISTINCT "r75"."c120" FROM (SELECT DISTINCT "r74"."c116" FROM (SELECT DISTINCT "r73"."base_type", "r73"."case_sensitive", "r73"."declaration", "r73"."id", "r73"."mapped_value", "r73"."mapping", "r73"."position" FROM "qti"."map_entry" AS "r73") AS "r74"("c113", "c114", "c115", "c116", "c117", "c118", "c119") WHERE "r74"."c113" = 'pair'::"qti"."base_type") AS "r75"("c120")) AS "r76"("c121") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r79"."c124" FROM (SELECT DISTINCT "r78"."c122" FROM (SELECT DISTINCT "r77"."id", "r77"."map_key" FROM "qti"."map_entry_pair" AS "r77") AS "r78"("c122", "c123")) AS "r79"("c124")) AS "r80"("c125") WHERE "r80"."c125" = "r76"."c121")) AS "r81"("c126") UNION SELECT "r90"."c140" FROM (SELECT DISTINCT "r85"."c135" FROM (SELECT DISTINCT "r84"."c134" FROM (SELECT DISTINCT "r83"."c130" FROM (SELECT DISTINCT "r82"."base_type", "r82"."case_sensitive", "r82"."declaration", "r82"."id", "r82"."mapped_value", "r82"."mapping", "r82"."position" FROM "qti"."map_entry" AS "r82") AS "r83"("c127", "c128", "c129", "c130", "c131", "c132", "c133") WHERE "r83"."c127" = 'directedPair'::"qti"."base_type") AS "r84"("c134")) AS "r85"("c135") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r88"."c138" FROM (SELECT DISTINCT "r87"."c136" FROM (SELECT DISTINCT "r86"."id", "r86"."map_key" FROM "qti"."map_entry_directed_pair" AS "r86") AS "r87"("c136", "c137")) AS "r88"("c138")) AS "r89"("c139") WHERE "r89"."c139" = "r85"."c135")) AS "r90"("c140") UNION SELECT "r99"."c154" FROM (SELECT DISTINCT "r94"."c149" FROM (SELECT DISTINCT "r93"."c148" FROM (SELECT DISTINCT "r92"."c144" FROM (SELECT DISTINCT "r91"."base_type", "r91"."case_sensitive", "r91"."declaration", "r91"."id", "r91"."mapped_value", "r91"."mapping", "r91"."position" FROM "qti"."map_entry" AS "r91") AS "r92"("c141", "c142", "c143", "c144", "c145", "c146", "c147") WHERE "r92"."c141" = 'file'::"qti"."base_type") AS "r93"("c148")) AS "r94"("c149") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r97"."c152" FROM (SELECT DISTINCT "r96"."c150" FROM (SELECT DISTINCT "r95"."id", "r95"."map_key" FROM "qti"."map_entry_file" AS "r95") AS "r96"("c150", "c151")) AS "r97"("c152")) AS "r98"("c153") WHERE "r98"."c153" = "r94"."c149")) AS "r99"("c154")) AS "r100"("c155")) THEN
    RAISE EXCEPTION 'law __map_entry_base_type_alternatives_zhy4acy6cn is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__map_entry_base_type_alternatives_zhy4acy6cn'::text;
  END IF;
END
$$;
