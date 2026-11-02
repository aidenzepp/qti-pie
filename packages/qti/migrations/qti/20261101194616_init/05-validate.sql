-- Validate law __declared_value_base_type_alternatives_n27lgzyqlq: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."declared_value", "qti"."declared_value_boolean", "qti"."declared_value_directed_pair", "qti"."declared_value_duration", "qti"."declared_value_file", "qti"."declared_value_float", "qti"."declared_value_identifier", "qti"."declared_value_integer", "qti"."declared_value_pair", "qti"."declared_value_point", "qti"."declared_value_string", "qti"."declared_value_uri" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_declared_value_base_type_alternatives_xmwdlu4tnr"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" record;
BEGIN
  IF TG_TABLE_NAME = 'declared_value'::text THEN
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."declared_value" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
      CASE "p"."c2"
        WHEN 'boolean'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_boolean" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'integer'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_integer" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'float'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_float" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'string'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_string" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'identifier'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_identifier" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'uri'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_uri" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'duration'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_duration" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'point'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_point" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'pair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'directedPair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_directed_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'file'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_file" AS "r1" WHERE "r1"."id" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __declared_value_base_type_alternatives_n27lgzyqlq violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__declared_value_base_type_alternatives_n27lgzyqlq'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["DeclaredValue",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["DeclaredValue"]'::text END;
      END IF;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'declared_value_boolean'::text THEN
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."declared_value" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      CASE "p"."c2"
        WHEN 'boolean'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_boolean" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'integer'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_integer" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'float'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_float" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'string'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_string" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'identifier'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_identifier" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'uri'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_uri" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'duration'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_duration" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'point'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_point" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'pair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'directedPair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_directed_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'file'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_file" AS "r1" WHERE "r1"."id" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __declared_value_base_type_alternatives_n27lgzyqlq violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__declared_value_base_type_alternatives_n27lgzyqlq'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["DeclaredValue",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["DeclaredValue"]'::text END;
      END IF;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'declared_value_integer'::text THEN
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."declared_value" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      CASE "p"."c2"
        WHEN 'boolean'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_boolean" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'integer'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_integer" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'float'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_float" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'string'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_string" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'identifier'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_identifier" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'uri'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_uri" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'duration'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_duration" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'point'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_point" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'pair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'directedPair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_directed_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'file'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_file" AS "r1" WHERE "r1"."id" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __declared_value_base_type_alternatives_n27lgzyqlq violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__declared_value_base_type_alternatives_n27lgzyqlq'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["DeclaredValue",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["DeclaredValue"]'::text END;
      END IF;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'declared_value_float'::text THEN
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."declared_value" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      CASE "p"."c2"
        WHEN 'boolean'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_boolean" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'integer'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_integer" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'float'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_float" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'string'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_string" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'identifier'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_identifier" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'uri'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_uri" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'duration'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_duration" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'point'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_point" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'pair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'directedPair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_directed_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'file'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_file" AS "r1" WHERE "r1"."id" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __declared_value_base_type_alternatives_n27lgzyqlq violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__declared_value_base_type_alternatives_n27lgzyqlq'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["DeclaredValue",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["DeclaredValue"]'::text END;
      END IF;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'declared_value_string'::text THEN
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."declared_value" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      CASE "p"."c2"
        WHEN 'boolean'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_boolean" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'integer'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_integer" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'float'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_float" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'string'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_string" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'identifier'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_identifier" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'uri'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_uri" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'duration'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_duration" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'point'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_point" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'pair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'directedPair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_directed_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'file'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_file" AS "r1" WHERE "r1"."id" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __declared_value_base_type_alternatives_n27lgzyqlq violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__declared_value_base_type_alternatives_n27lgzyqlq'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["DeclaredValue",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["DeclaredValue"]'::text END;
      END IF;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'declared_value_identifier'::text THEN
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."declared_value" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      CASE "p"."c2"
        WHEN 'boolean'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_boolean" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'integer'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_integer" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'float'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_float" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'string'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_string" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'identifier'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_identifier" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'uri'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_uri" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'duration'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_duration" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'point'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_point" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'pair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'directedPair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_directed_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'file'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_file" AS "r1" WHERE "r1"."id" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __declared_value_base_type_alternatives_n27lgzyqlq violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__declared_value_base_type_alternatives_n27lgzyqlq'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["DeclaredValue",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["DeclaredValue"]'::text END;
      END IF;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'declared_value_uri'::text THEN
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."declared_value" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      CASE "p"."c2"
        WHEN 'boolean'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_boolean" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'integer'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_integer" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'float'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_float" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'string'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_string" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'identifier'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_identifier" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'uri'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_uri" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'duration'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_duration" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'point'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_point" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'pair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'directedPair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_directed_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'file'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_file" AS "r1" WHERE "r1"."id" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __declared_value_base_type_alternatives_n27lgzyqlq violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__declared_value_base_type_alternatives_n27lgzyqlq'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["DeclaredValue",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["DeclaredValue"]'::text END;
      END IF;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'declared_value_duration'::text THEN
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."declared_value" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      CASE "p"."c2"
        WHEN 'boolean'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_boolean" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'integer'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_integer" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'float'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_float" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'string'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_string" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'identifier'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_identifier" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'uri'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_uri" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'duration'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_duration" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'point'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_point" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'pair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'directedPair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_directed_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'file'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_file" AS "r1" WHERE "r1"."id" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __declared_value_base_type_alternatives_n27lgzyqlq violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__declared_value_base_type_alternatives_n27lgzyqlq'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["DeclaredValue",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["DeclaredValue"]'::text END;
      END IF;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'declared_value_point'::text THEN
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."declared_value" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      CASE "p"."c2"
        WHEN 'boolean'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_boolean" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'integer'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_integer" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'float'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_float" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'string'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_string" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'identifier'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_identifier" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'uri'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_uri" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'duration'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_duration" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'point'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_point" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'pair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'directedPair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_directed_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'file'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_file" AS "r1" WHERE "r1"."id" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __declared_value_base_type_alternatives_n27lgzyqlq violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__declared_value_base_type_alternatives_n27lgzyqlq'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["DeclaredValue",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["DeclaredValue"]'::text END;
      END IF;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'declared_value_pair'::text THEN
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."declared_value" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      CASE "p"."c2"
        WHEN 'boolean'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_boolean" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'integer'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_integer" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'float'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_float" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'string'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_string" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'identifier'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_identifier" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'uri'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_uri" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'duration'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_duration" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'point'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_point" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'pair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'directedPair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_directed_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'file'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_file" AS "r1" WHERE "r1"."id" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __declared_value_base_type_alternatives_n27lgzyqlq violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__declared_value_base_type_alternatives_n27lgzyqlq'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["DeclaredValue",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["DeclaredValue"]'::text END;
      END IF;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'declared_value_directed_pair'::text THEN
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."declared_value" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      CASE "p"."c2"
        WHEN 'boolean'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_boolean" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'integer'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_integer" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'float'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_float" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'string'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_string" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'identifier'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_identifier" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'uri'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_uri" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'duration'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_duration" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'point'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_point" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'pair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'directedPair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_directed_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'file'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_file" AS "r1" WHERE "r1"."id" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __declared_value_base_type_alternatives_n27lgzyqlq violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__declared_value_base_type_alternatives_n27lgzyqlq'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["DeclaredValue",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["DeclaredValue"]'::text END;
      END IF;
    END LOOP;
  ELSE
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."declared_value" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      CASE "p"."c2"
        WHEN 'boolean'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_boolean" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'integer'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_integer" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'float'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_float" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'string'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_string" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'identifier'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_identifier" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'uri'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_uri" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'duration'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_duration" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'point'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_point" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'pair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'directedPair'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_directed_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'file'::"qti"."base_type" THEN
          PERFORM 1 FROM "qti"."declared_value_file" AS "r1" WHERE "r1"."id" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __declared_value_base_type_alternatives_n27lgzyqlq violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__declared_value_base_type_alternatives_n27lgzyqlq'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["DeclaredValue",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["DeclaredValue"]'::text END;
      END IF;
    END LOOP;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_declared_value_base_type_alternatives_xmwdlu4tnr"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_declared_value_base_type_alternatives_4w34r7nktl"
  AFTER INSERT ON "qti"."declared_value"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_declared_value_base_type_alternatives_xmwdlu4tnr"();

CREATE CONSTRAINT TRIGGER "__law_declared_value_base_type_alternatives_mgimadxysu"
  AFTER DELETE ON "qti"."declared_value_boolean"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_declared_value_base_type_alternatives_xmwdlu4tnr"();

CREATE CONSTRAINT TRIGGER "__law_declared_value_base_type_alternatives_jlvjy7zbkg"
  AFTER DELETE ON "qti"."declared_value_directed_pair"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_declared_value_base_type_alternatives_xmwdlu4tnr"();

CREATE CONSTRAINT TRIGGER "__law_declared_value_base_type_alternatives_pljp3smpng"
  AFTER DELETE ON "qti"."declared_value_duration"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_declared_value_base_type_alternatives_xmwdlu4tnr"();

CREATE CONSTRAINT TRIGGER "__law_declared_value_base_type_alternatives_7k7uh2pbe3"
  AFTER DELETE ON "qti"."declared_value_file"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_declared_value_base_type_alternatives_xmwdlu4tnr"();

CREATE CONSTRAINT TRIGGER "__law_declared_value_base_type_alternatives_oxhzuibafc"
  AFTER DELETE ON "qti"."declared_value_float"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_declared_value_base_type_alternatives_xmwdlu4tnr"();

CREATE CONSTRAINT TRIGGER "__law_declared_value_base_type_alternatives_25lksnkfdz"
  AFTER DELETE ON "qti"."declared_value_identifier"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_declared_value_base_type_alternatives_xmwdlu4tnr"();

CREATE CONSTRAINT TRIGGER "__law_declared_value_base_type_alternatives_k5rhlgc3tt"
  AFTER DELETE ON "qti"."declared_value_integer"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_declared_value_base_type_alternatives_xmwdlu4tnr"();

CREATE CONSTRAINT TRIGGER "__law_declared_value_base_type_alternatives_codktwlwvu"
  AFTER DELETE ON "qti"."declared_value_pair"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_declared_value_base_type_alternatives_xmwdlu4tnr"();

CREATE CONSTRAINT TRIGGER "__law_declared_value_base_type_alternatives_o4hjz65tk7"
  AFTER DELETE ON "qti"."declared_value_point"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_declared_value_base_type_alternatives_xmwdlu4tnr"();

CREATE CONSTRAINT TRIGGER "__law_declared_value_base_type_alternatives_k6ndyc2dma"
  AFTER DELETE ON "qti"."declared_value_string"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_declared_value_base_type_alternatives_xmwdlu4tnr"();

CREATE CONSTRAINT TRIGGER "__law_declared_value_base_type_alternatives_jgctflzzgt"
  AFTER DELETE ON "qti"."declared_value_uri"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_declared_value_base_type_alternatives_xmwdlu4tnr"();

-- The full violation query of law __declared_value_base_type_alternatives_n27lgzyqlq.
DO $$
BEGIN
  IF EXISTS (SELECT "r100"."c133" AS "id" FROM (SELECT "r9"."c12" FROM (SELECT DISTINCT "r4"."c7" FROM (SELECT DISTINCT "r3"."c6" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."base_type", "r1"."id", "r1"."position", "r1"."shape", "r1"."value_set" FROM "qti"."declared_value" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5") WHERE "r2"."c1" = 'boolean'::"qti"."base_type") AS "r3"("c6")) AS "r4"("c7") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c10" FROM (SELECT DISTINCT "r6"."c8" FROM (SELECT DISTINCT "r5"."id", "r5"."value" FROM "qti"."declared_value_boolean" AS "r5") AS "r6"("c8", "c9")) AS "r7"("c10")) AS "r8"("c11") WHERE "r8"."c11" = "r4"."c7")) AS "r9"("c12") UNION SELECT "r18"."c24" FROM (SELECT DISTINCT "r13"."c19" FROM (SELECT DISTINCT "r12"."c18" FROM (SELECT DISTINCT "r11"."c14" FROM (SELECT DISTINCT "r10"."base_type", "r10"."id", "r10"."position", "r10"."shape", "r10"."value_set" FROM "qti"."declared_value" AS "r10") AS "r11"("c13", "c14", "c15", "c16", "c17") WHERE "r11"."c13" = 'integer'::"qti"."base_type") AS "r12"("c18")) AS "r13"("c19") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r16"."c22" FROM (SELECT DISTINCT "r15"."c20" FROM (SELECT DISTINCT "r14"."id", "r14"."value" FROM "qti"."declared_value_integer" AS "r14") AS "r15"("c20", "c21")) AS "r16"("c22")) AS "r17"("c23") WHERE "r17"."c23" = "r13"."c19")) AS "r18"("c24") UNION SELECT "r27"."c36" FROM (SELECT DISTINCT "r22"."c31" FROM (SELECT DISTINCT "r21"."c30" FROM (SELECT DISTINCT "r20"."c26" FROM (SELECT DISTINCT "r19"."base_type", "r19"."id", "r19"."position", "r19"."shape", "r19"."value_set" FROM "qti"."declared_value" AS "r19") AS "r20"("c25", "c26", "c27", "c28", "c29") WHERE "r20"."c25" = 'float'::"qti"."base_type") AS "r21"("c30")) AS "r22"("c31") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r25"."c34" FROM (SELECT DISTINCT "r24"."c32" FROM (SELECT DISTINCT "r23"."id", "r23"."value" FROM "qti"."declared_value_float" AS "r23") AS "r24"("c32", "c33")) AS "r25"("c34")) AS "r26"("c35") WHERE "r26"."c35" = "r22"."c31")) AS "r27"("c36") UNION SELECT "r36"."c48" FROM (SELECT DISTINCT "r31"."c43" FROM (SELECT DISTINCT "r30"."c42" FROM (SELECT DISTINCT "r29"."c38" FROM (SELECT DISTINCT "r28"."base_type", "r28"."id", "r28"."position", "r28"."shape", "r28"."value_set" FROM "qti"."declared_value" AS "r28") AS "r29"("c37", "c38", "c39", "c40", "c41") WHERE "r29"."c37" = 'string'::"qti"."base_type") AS "r30"("c42")) AS "r31"("c43") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r34"."c46" FROM (SELECT DISTINCT "r33"."c44" FROM (SELECT DISTINCT "r32"."id", "r32"."value" FROM "qti"."declared_value_string" AS "r32") AS "r33"("c44", "c45")) AS "r34"("c46")) AS "r35"("c47") WHERE "r35"."c47" = "r31"."c43")) AS "r36"("c48") UNION SELECT "r45"."c60" FROM (SELECT DISTINCT "r40"."c55" FROM (SELECT DISTINCT "r39"."c54" FROM (SELECT DISTINCT "r38"."c50" FROM (SELECT DISTINCT "r37"."base_type", "r37"."id", "r37"."position", "r37"."shape", "r37"."value_set" FROM "qti"."declared_value" AS "r37") AS "r38"("c49", "c50", "c51", "c52", "c53") WHERE "r38"."c49" = 'identifier'::"qti"."base_type") AS "r39"("c54")) AS "r40"("c55") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r43"."c58" FROM (SELECT DISTINCT "r42"."c56" FROM (SELECT DISTINCT "r41"."id", "r41"."value" FROM "qti"."declared_value_identifier" AS "r41") AS "r42"("c56", "c57")) AS "r43"("c58")) AS "r44"("c59") WHERE "r44"."c59" = "r40"."c55")) AS "r45"("c60") UNION SELECT "r54"."c72" FROM (SELECT DISTINCT "r49"."c67" FROM (SELECT DISTINCT "r48"."c66" FROM (SELECT DISTINCT "r47"."c62" FROM (SELECT DISTINCT "r46"."base_type", "r46"."id", "r46"."position", "r46"."shape", "r46"."value_set" FROM "qti"."declared_value" AS "r46") AS "r47"("c61", "c62", "c63", "c64", "c65") WHERE "r47"."c61" = 'uri'::"qti"."base_type") AS "r48"("c66")) AS "r49"("c67") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r52"."c70" FROM (SELECT DISTINCT "r51"."c68" FROM (SELECT DISTINCT "r50"."id", "r50"."value" FROM "qti"."declared_value_uri" AS "r50") AS "r51"("c68", "c69")) AS "r52"("c70")) AS "r53"("c71") WHERE "r53"."c71" = "r49"."c67")) AS "r54"("c72") UNION SELECT "r63"."c84" FROM (SELECT DISTINCT "r58"."c79" FROM (SELECT DISTINCT "r57"."c78" FROM (SELECT DISTINCT "r56"."c74" FROM (SELECT DISTINCT "r55"."base_type", "r55"."id", "r55"."position", "r55"."shape", "r55"."value_set" FROM "qti"."declared_value" AS "r55") AS "r56"("c73", "c74", "c75", "c76", "c77") WHERE "r56"."c73" = 'duration'::"qti"."base_type") AS "r57"("c78")) AS "r58"("c79") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r61"."c82" FROM (SELECT DISTINCT "r60"."c80" FROM (SELECT DISTINCT "r59"."id", "r59"."value" FROM "qti"."declared_value_duration" AS "r59") AS "r60"("c80", "c81")) AS "r61"("c82")) AS "r62"("c83") WHERE "r62"."c83" = "r58"."c79")) AS "r63"("c84") UNION SELECT "r72"."c96" FROM (SELECT DISTINCT "r67"."c91" FROM (SELECT DISTINCT "r66"."c90" FROM (SELECT DISTINCT "r65"."c86" FROM (SELECT DISTINCT "r64"."base_type", "r64"."id", "r64"."position", "r64"."shape", "r64"."value_set" FROM "qti"."declared_value" AS "r64") AS "r65"("c85", "c86", "c87", "c88", "c89") WHERE "r65"."c85" = 'point'::"qti"."base_type") AS "r66"("c90")) AS "r67"("c91") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r70"."c94" FROM (SELECT DISTINCT "r69"."c92" FROM (SELECT DISTINCT "r68"."id", "r68"."value" FROM "qti"."declared_value_point" AS "r68") AS "r69"("c92", "c93")) AS "r70"("c94")) AS "r71"("c95") WHERE "r71"."c95" = "r67"."c91")) AS "r72"("c96") UNION SELECT "r81"."c108" FROM (SELECT DISTINCT "r76"."c103" FROM (SELECT DISTINCT "r75"."c102" FROM (SELECT DISTINCT "r74"."c98" FROM (SELECT DISTINCT "r73"."base_type", "r73"."id", "r73"."position", "r73"."shape", "r73"."value_set" FROM "qti"."declared_value" AS "r73") AS "r74"("c97", "c98", "c99", "c100", "c101") WHERE "r74"."c97" = 'pair'::"qti"."base_type") AS "r75"("c102")) AS "r76"("c103") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r79"."c106" FROM (SELECT DISTINCT "r78"."c104" FROM (SELECT DISTINCT "r77"."id", "r77"."value" FROM "qti"."declared_value_pair" AS "r77") AS "r78"("c104", "c105")) AS "r79"("c106")) AS "r80"("c107") WHERE "r80"."c107" = "r76"."c103")) AS "r81"("c108") UNION SELECT "r90"."c120" FROM (SELECT DISTINCT "r85"."c115" FROM (SELECT DISTINCT "r84"."c114" FROM (SELECT DISTINCT "r83"."c110" FROM (SELECT DISTINCT "r82"."base_type", "r82"."id", "r82"."position", "r82"."shape", "r82"."value_set" FROM "qti"."declared_value" AS "r82") AS "r83"("c109", "c110", "c111", "c112", "c113") WHERE "r83"."c109" = 'directedPair'::"qti"."base_type") AS "r84"("c114")) AS "r85"("c115") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r88"."c118" FROM (SELECT DISTINCT "r87"."c116" FROM (SELECT DISTINCT "r86"."id", "r86"."value" FROM "qti"."declared_value_directed_pair" AS "r86") AS "r87"("c116", "c117")) AS "r88"("c118")) AS "r89"("c119") WHERE "r89"."c119" = "r85"."c115")) AS "r90"("c120") UNION SELECT "r99"."c132" FROM (SELECT DISTINCT "r94"."c127" FROM (SELECT DISTINCT "r93"."c126" FROM (SELECT DISTINCT "r92"."c122" FROM (SELECT DISTINCT "r91"."base_type", "r91"."id", "r91"."position", "r91"."shape", "r91"."value_set" FROM "qti"."declared_value" AS "r91") AS "r92"("c121", "c122", "c123", "c124", "c125") WHERE "r92"."c121" = 'file'::"qti"."base_type") AS "r93"("c126")) AS "r94"("c127") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r97"."c130" FROM (SELECT DISTINCT "r96"."c128" FROM (SELECT DISTINCT "r95"."id", "r95"."value" FROM "qti"."declared_value_file" AS "r95") AS "r96"("c128", "c129")) AS "r97"("c130")) AS "r98"("c131") WHERE "r98"."c131" = "r94"."c127")) AS "r99"("c132")) AS "r100"("c133")) THEN
    RAISE EXCEPTION 'law __declared_value_base_type_alternatives_n27lgzyqlq is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__declared_value_base_type_alternatives_n27lgzyqlq'::text;
  END IF;
END
$$;
