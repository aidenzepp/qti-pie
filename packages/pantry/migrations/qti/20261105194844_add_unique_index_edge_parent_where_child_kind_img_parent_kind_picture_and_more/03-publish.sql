DROP TRIGGER "__law_picture_capacity_edge_lufcs722k4" ON "qti"."edge";

DROP TRIGGER "__law_picture_capacity_edge_4v6xjylcwt" ON "qti"."picture";

DROP INDEX "qti"."__edge_key_parent_child_kind_img_hizgmsur3h";

DROP FUNCTION "qti"."__law_picture_capacity_edge_lvxdouo4l2"();

DROP FUNCTION "qti"."__law_picture_capacity_edge_dfmlqchuaa"();

COMMENT ON FUNCTION "qti"."__law_picture_capacity_edge_a655uk7rqv"() IS 'function of law capacity of Picture(id) over Edge(parent) where childKind = img, parentKind = picture within 1..1 on Edge for DELETE';

COMMENT ON FUNCTION "qti"."__law_picture_capacity_edge_2hunnpwdq3"() IS 'function of law capacity of Picture(id) over Edge(parent) where childKind = img, parentKind = picture within 1..1 on Picture for INSERT';

COMMENT ON INDEX "qti"."__edge_key_parent_child_kind_img_parent_kind_picture_kojhq4stf3" IS 'unique index Edge(parent) where childKind = img, parentKind = picture';

COMMENT ON TRIGGER "__law_picture_capacity_edge_6v3mqho45d" ON "qti"."edge" IS 'trigger of law capacity of Picture(id) over Edge(parent) where childKind = img, parentKind = picture within 1..1 on Edge for DELETE';

COMMENT ON TRIGGER "__law_picture_capacity_edge_ltbjnbkpbt" ON "qti"."picture" IS 'trigger of law capacity of Picture(id) over Edge(parent) where childKind = img, parentKind = picture within 1..1 on Picture for INSERT';
