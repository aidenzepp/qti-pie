CREATE TYPE "qti"."mathml_boolean_value" AS ENUM ('true', 'false');

CREATE TYPE "qti"."mathml_closure_value" AS ENUM ('closed', 'open', 'open-closed', 'closed-open');

CREATE TYPE "qti"."mathml_columnalignstyle_value" AS ENUM ('left', 'center', 'right');

CREATE TYPE "qti"."mathml_dir_value" AS ENUM ('ltr', 'rtl');

CREATE TYPE "qti"."mathml_display_value" AS ENUM ('block', 'inline');

CREATE TYPE "qti"."mathml_edge_value" AS ENUM ('left', 'right');

CREATE TYPE "qti"."mathml_fontstyle_value" AS ENUM ('normal', 'italic');

CREATE TYPE "qti"."mathml_fontweight_value" AS ENUM ('normal', 'bold');

CREATE TYPE "qti"."mathml_form_value" AS ENUM ('prefix', 'infix', 'postfix');

CREATE TYPE "qti"."mathml_group_alignment_value" AS ENUM ('left', 'center', 'right', 'decimalpoint');

CREATE TYPE "qti"."mathml_indentalign_line_value" AS ENUM ('left', 'center', 'right', 'auto', 'id', 'indentalign');

CREATE TYPE "qti"."mathml_indentalign_value" AS ENUM ('left', 'center', 'right', 'auto', 'id');

CREATE TYPE "qti"."mathml_infixlinebreakstyle_value" AS ENUM ('before', 'after', 'duplicate');

CREATE TYPE "qti"."mathml_linebreak_value" AS ENUM ('auto', 'newline', 'nobreak', 'goodbreak', 'badbreak');

CREATE TYPE "qti"."mathml_linebreakstyle_value" AS ENUM ('before', 'after', 'duplicate', 'infixlinebreakstyle');

CREATE TYPE "qti"."mathml_linestyle_value" AS ENUM ('none', 'solid', 'dashed');

CREATE TYPE "qti"."mathml_location_value" AS ENUM ('w', 'nw', 'n', 'ne', 'e', 'se', 's', 'sw');

CREATE TYPE "qti"."mathml_longdivstyle_value" AS ENUM ('lefttop', 'stackedrightright', 'mediumstackedrightright', 'shortstackedrightright', 'righttop', 'left/\right', 'left)(right', ':right=right', 'stackedleftleft', 'stackedleftlinetop');

CREATE TYPE "qti"."mathml_mathvariant_value" AS ENUM ('normal', 'bold', 'italic', 'bold-italic', 'double-struck', 'bold-fraktur', 'script', 'bold-script', 'fraktur', 'sans-serif', 'bold-sans-serif', 'sans-serif-italic', 'sans-serif-bold-italic', 'monospace', 'initial', 'tailed', 'looped', 'stretched');

CREATE TYPE "qti"."mathml_mspace_linebreak_value" AS ENUM ('auto', 'newline', 'nobreak', 'goodbreak', 'badbreak', 'indentingnewline');

CREATE TYPE "qti"."mathml_occurrence_value" AS ENUM ('prefix', 'infix', 'function-model');

CREATE TYPE "qti"."mathml_order_value" AS ENUM ('numeric', 'lexicographic');

CREATE TYPE "qti"."mathml_overflow_value" AS ENUM ('linebreak', 'scroll', 'elide', 'truncate', 'scale');

CREATE TYPE "qti"."mathml_side_value" AS ENUM ('left', 'right', 'leftoverlap', 'rightoverlap');

CREATE TYPE "qti"."mathml_value_type" AS ENUM ('align', 'alignmentscope', 'altimg-valign', 'background', 'base', 'boolean', 'cd', 'cdgroup', 'character', 'charspacing', 'class', 'closure', 'color', 'columnalign', 'columnalignstyle', 'columnwidth', 'crossout', 'definition-url', 'dir', 'display', 'edge', 'embed-source', 'fontstyle', 'fontweight', 'form', 'framespacing', 'group-alignment', 'group-alignment-list', 'group-alignment-list-list', 'href', 'indentalign', 'indentalign-line', 'indentshift-line', 'index', 'infixlinebreakstyle', 'length', 'length-list', 'line-thickness', 'linebreak', 'linebreakstyle', 'linestyle', 'linestyle-list', 'location', 'longdivstyle', 'mathsize', 'mathvariant', 'maxsize', 'mpadded-length', 'mspace-linebreak', 'name', 'nargs', 'number', 'occurrence', 'order', 'overflow', 'position', 'rowalign', 'scriptlevel', 'selection', 'shift', 'side', 'span', 'src', 'string', 'table-width', 'unsigned-integer', 'verticalalign');

CREATE TYPE "qti"."mathml_verticalalign_value" AS ENUM ('top', 'bottom', 'center', 'baseline', 'axis');

CREATE DOMAIN "qti"."mathml_base_value" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A0*[1-9][0-9]*\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."mathml_cbytes_value" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:[\+\/-9A-Za-z]{4})*(?:[\+\/-9A-Za-z]{2}\=\=|[\+\/-9A-Za-z]{3}\=)?\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."mathml_cd_value" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[A-Z\_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF][\-\.0-9A-Z\_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF]{0,255}\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."mathml_cdgroup_value" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\.0-9\;-\>\@-Z\\\^-\U0010FFFF])+(?:\/(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\>\@-Z\\\^-\U0010FFFF])*)?|\/(?:(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\.0-\>\@-Z\\\^-\U0010FFFF])(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\>\@-Z\\\^-\U0010FFFF])*)?|\/\/(?:(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\.0-\>A-Z\\\^-\U0010FFFF])*\@)?(?:(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\.0-9\;-\>A-Z\\\^-\U0010FFFF])*|\[[\u0001-\\\^-\U0010FFFF]*\])(?:\:[0-9]+)?(?:\/(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\>\@-Z\\\^-\U0010FFFF])*)?|[A-Za-z][\+\-\.0-9A-Za-z]*\:(?:(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\.0-\>\@-Z\\\^-\U0010FFFF])(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\>\@-Z\\\^-\U0010FFFF])*|\/(?:(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\.0-\>\@-Z\\\^-\U0010FFFF])(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\>\@-Z\\\^-\U0010FFFF])*)?|\/\/(?:(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\.0-\>A-Z\\\^-\U0010FFFF])*\@)?(?:(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\.0-9\;-\>A-Z\\\^-\U0010FFFF])*|\[[\u0001-\\\^-\U0010FFFF]*\])(?:\:[0-9]+)?(?:\/(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\>\@-Z\\\^-\U0010FFFF])*)?)?)?(?:\?(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-Z\\\^-\U0010FFFF])*)?(?:\#(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\U0010FFFF])*)?\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."mathml_definition_url_value" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\.0-9\;-\>\@-Z\\\^-\U0010FFFF])+(?:\/(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\>\@-Z\\\^-\U0010FFFF])*)?|\/(?:(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\.0-\>\@-Z\\\^-\U0010FFFF])(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\>\@-Z\\\^-\U0010FFFF])*)?|\/\/(?:(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\.0-\>A-Z\\\^-\U0010FFFF])*\@)?(?:(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\.0-9\;-\>A-Z\\\^-\U0010FFFF])*|\[[\u0001-\\\^-\U0010FFFF]*\])(?:\:[0-9]+)?(?:\/(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\>\@-Z\\\^-\U0010FFFF])*)?|[A-Za-z][\+\-\.0-9A-Za-z]*\:(?:(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\.0-\>\@-Z\\\^-\U0010FFFF])(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\>\@-Z\\\^-\U0010FFFF])*|\/(?:(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\.0-\>\@-Z\\\^-\U0010FFFF])(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\>\@-Z\\\^-\U0010FFFF])*)?|\/\/(?:(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\.0-\>A-Z\\\^-\U0010FFFF])*\@)?(?:(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\.0-9\;-\>A-Z\\\^-\U0010FFFF])*|\[[\u0001-\\\^-\U0010FFFF]*\])(?:\:[0-9]+)?(?:\/(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\>\@-Z\\\^-\U0010FFFF])*)?)?)?(?:\?(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-Z\\\^-\U0010FFFF])*)?(?:\#(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\U0010FFFF])*)?\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."mathml_index_value" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A\-?[0-9]+\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."mathml_name_value" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[A-Z\_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF][\-\.0-9A-Z\_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF]{0,255}\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."mathml_nargs_value" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A\+?[0-9]+\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."mathml_position_value" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A\-?[0-9]+\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."mathml_scriptlevel_value" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[\+\-]?[0-9]+\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."mathml_selection_value" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A0*[1-9][0-9]*\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."mathml_shift_value" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A\-?[0-9]+\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."mathml_span_value" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A0*[1-9][0-9]*\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."mathml_src_value" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\.0-9\;-\>\@-Z\\\^-\U0010FFFF])+(?:\/(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\>\@-Z\\\^-\U0010FFFF])*)?|\/(?:(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\.0-\>\@-Z\\\^-\U0010FFFF])(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\>\@-Z\\\^-\U0010FFFF])*)?|\/\/(?:(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\.0-\>A-Z\\\^-\U0010FFFF])*\@)?(?:(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\.0-9\;-\>A-Z\\\^-\U0010FFFF])*|\[[\u0001-\\\^-\U0010FFFF]*\])(?:\:[0-9]+)?(?:\/(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\>\@-Z\\\^-\U0010FFFF])*)?|[A-Za-z][\+\-\.0-9A-Za-z]*\:(?:(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\.0-\>\@-Z\\\^-\U0010FFFF])(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\>\@-Z\\\^-\U0010FFFF])*|\/(?:(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\.0-\>\@-Z\\\^-\U0010FFFF])(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\>\@-Z\\\^-\U0010FFFF])*)?|\/\/(?:(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\.0-\>A-Z\\\^-\U0010FFFF])*\@)?(?:(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\.0-9\;-\>A-Z\\\^-\U0010FFFF])*|\[[\u0001-\\\^-\U0010FFFF]*\])(?:\:[0-9]+)?(?:\/(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\>\@-Z\\\^-\U0010FFFF])*)?)?)?(?:\?(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-Z\\\^-\U0010FFFF])*)?(?:\#(?:\%[0-9A-Fa-f]{2}|[\u0001-\"\$\&-\U0010FFFF])*)?\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."__text_fywgikzrwf" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[\u0009\u000A\u000D ]*(?:(?:negative)?(?:(?:very){0,2}thi(?:ck|n)|medium)mathspace|\-?[0-9]*(?:\.[0-9]|[0-9]\.?)[0-9]*(?:e[mx]|in|mm|p[ctx]|cm|\%)?|medium|thin|thick)[\u0009\u000A\u000D ]*\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."__text_i7djrwbb7n" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:(?:negative)?(?:(?:very){0,2}thi(?:ck|n)|medium)mathspace|\-?[0-9]*(?:\.[0-9]|[0-9]\.?)[0-9]*(?:e[mx]|in|mm|p[ctx]|cm|\%)?)(?: (?:(?:negative)?(?:(?:very){0,2}thi(?:ck|n)|medium)mathspace|\-?[0-9]*(?:\.[0-9]|[0-9]\.?)[0-9]*(?:e[mx]|in|mm|p[ctx]|cm|\%)?))*\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."__text_xusnuddb4k" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[\u0009\u000A\u000D ]*(?:(?:negative)?(?:(?:very){0,2}thi(?:ck|n)|medium)mathspace|\-?[0-9]*(?:\.[0-9]|[0-9]\.?)[0-9]*(?:e[mx]|in|mm|p[ctx]|cm|\%)?)[\u0009\u000A\u000D ]*\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."__text_jfksd4nu5r" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[\-\.0-\:A-Z\_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF]+(?: [\-\.0-\:A-Z\_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF]+)*\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."__text_oxgrhofw2c" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:decimalpoint|left|right|center)(?: (?:decimalpoint|left|right|center))*\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."__text_7dlsmkhhat" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A\-?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."__text_jruckr5nmf" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[\u0009\u000A\u000D ]*(?:(?:negative)?(?:(?:very){0,2}thi(?:ck|n)|medium)mathspace|\-?[0-9]*(?:\.[0-9]|[0-9]\.?)[0-9]*(?:e[mx]|in|mm|p[ctx]|cm|\%)?|indentshift)[\u0009\u000A\u000D ]*\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."__text_623scqhhre" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:(?:negative)?(?:(?:very){0,2}thi(?:ck|n)|medium)mathspace|\-?[0-9]*(?:\.[0-9]|[0-9]\.?)[0-9]*(?:e[mx]|in|mm|p[ctx]|cm|\%)?|fit|auto)(?: (?:(?:negative)?(?:(?:very){0,2}thi(?:ck|n)|medium)mathspace|\-?[0-9]*(?:\.[0-9]|[0-9]\.?)[0-9]*(?:e[mx]|in|mm|p[ctx]|cm|\%)?|fit|auto))*\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."__text_64ulvvuteh" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[\u0009\u000A\u000D ]*(?:(?:negative)?(?:(?:very){0,2}thi(?:ck|n)|medium)mathspace|\-?[0-9]*(?:\.[0-9]|[0-9]\.?)[0-9]*(?:e[mx]|in|mm|p[ctx]|cm|\%)?|auto)[\u0009\u000A\u000D ]*\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."__text_x4ovwk3uop" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:false|true)(?: (?:false|true))*\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."__text_oc36elqfmy" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[\u0009\u000A\u000D ]*(?:transparent|\#[0-9A-Fa-f]{3}(?:[0-9A-Fa-f]{3})?|[Aa][Qq][Uu][Aa]|[Bb][Ll][Aa][Cc][Kk]|[Bb][Ll][Uu][Ee]|[Ff][Uu][Cc][Hh][Ss][Ii][Aa]|[Gg][Rr][Aa][Yy]|[Gg][Rr][Ee][Ee][Nn]|[Ll][Ii][Mm][Ee]|[Mm][Aa][Rr][Oo][Oo][Nn]|[Nn][Aa][Vv][Yy]|[Oo][Ll][Ii][Vv][Ee]|[Pp][Uu][Rr][Pp][Ll][Ee]|[Rr][Ee][Dd]|[Ss][Ii][Ll][Vv][Ee][Rr]|[Tt][Ee][Aa][Ll]|[Ww][Hh][Ii][Tt][Ee]|[Yy][Ee][Ll][Ll][Oo][Ww])[\u0009\u000A\u000D ]*\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."__text_o4z6v6eurt" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:dashed|none|solid)(?: (?:dashed|none|solid))*\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."__text_okcvipkynh" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:top|axis|bottom|baseline|center)(?: (?:top|axis|bottom|baseline|center))*\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."__text_nx57zic2sr" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[\u0009\u000A\u000D ]*(?:(?:negative)?(?:(?:very){0,2}thi(?:ck|n)|medium)mathspace|\-?[0-9]*(?:\.[0-9]|[0-9]\.?)[0-9]*(?:e[mx]|in|mm|p[ctx]|cm|\%)?|middle|top|bottom)[\u0009\u000A\u000D ]*\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."__text_j6r7doraiw" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[\u0009\u000A\u000D ]*(?:(?:negative)?(?:(?:very){0,2}thi(?:ck|n)|medium)mathspace|\-?[0-9]*(?:\.[0-9]|[0-9]\.?)[0-9]*(?:e[mx]|in|mm|p[ctx]|cm|\%)?|loose|medium|tight)[\u0009\u000A\u000D ]*\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."__text_vrj3u337cv" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[\u0009\u000A\u000D ]*[\+\-]?[0-9]*(?:\.[0-9]|[0-9]\.?)[0-9]*[\u0009\u000A\u000D ]*(?:(?:negative)?(?:(?:very){0,2}thi(?:ck|n)|medium)mathspace|\%?[\u0009\u000A\u000D ]*(?:depth|height|width)?|e[mx]|in|mm|p[ctx]|cm)?[\u0009\u000A\u000D ]*\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."__text_6ifjn7x3qm" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[\u0009\u000A\u000D ]*(?:(?:negative)?(?:(?:very){0,2}thi(?:ck|n)|medium)mathspace|\-?[0-9]*(?:\.[0-9]|[0-9]\.?)[0-9]*(?:e[mx]|in|mm|p[ctx]|cm|\%)?|normal|small|big)[\u0009\u000A\u000D ]*\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."__text_vpd3gbdfhl" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[\u0009\u000A\u000D ]*(?:\#[0-9A-Fa-f]{3}(?:[0-9A-Fa-f]{3})?|[Aa][Qq][Uu][Aa]|[Bb][Ll][Aa][Cc][Kk]|[Bb][Ll][Uu][Ee]|[Ff][Uu][Cc][Hh][Ss][Ii][Aa]|[Gg][Rr][Aa][Yy]|[Gg][Rr][Ee][Ee][Nn]|[Ll][Ii][Mm][Ee]|[Mm][Aa][Rr][Oo][Oo][Nn]|[Nn][Aa][Vv][Yy]|[Oo][Ll][Ii][Vv][Ee]|[Pp][Uu][Rr][Pp][Ll][Ee]|[Rr][Ee][Dd]|[Ss][Ii][Ll][Vv][Ee][Rr]|[Tt][Ee][Aa][Ll]|[Ww][Hh][Ii][Tt][Ee]|[Yy][Ee][Ll][Ll][Oo][Ww])[\u0009\u000A\u000D ]*\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."__text_7mihpbbens" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[\u0009\u000A\u000D ]*(?:(?:negative)?(?:(?:very){0,2}thi(?:ck|n)|medium)mathspace|\-?[0-9]*(?:\.[0-9]|[0-9]\.?)[0-9]*(?:e[mx]|in|mm|p[ctx]|cm|\%)?|infinity)[\u0009\u000A\u000D ]*\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."__text_r5z7lvpd56" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:left|right|center)(?: (?:left|right|center))*\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."__text_hubjq5m7kx" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[\u0009\u000A\u000D ]*[\u0001-\u0008\u000B\u000C\u000E-\u001F\!-\U0010FFFF][\u0009\u000A\u000D ]*\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."__text_cfvofy6jst" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:(?:negative)?(?:(?:very){0,2}thi(?:ck|n)|medium)mathspace|\-?[0-9]*(?:\.[0-9]|[0-9]\.?)[0-9]*(?:e[mx]|in|mm|p[ctx]|cm|\%)?) (?:(?:negative)?(?:(?:very){0,2}thi(?:ck|n)|medium)mathspace|\-?[0-9]*(?:\.[0-9]|[0-9]\.?)[0-9]*(?:e[mx]|in|mm|p[ctx]|cm|\%)?)\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."__text_yyhgrftqjx" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[\u0009\u000A\u000D ]*(?:top|axis|bottom|baseline|center)(?:[\u0009\u000A\u000D ]+\-?[0-9]+)?[\u0009\u000A\u000D ]*\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."__text_vwyq7r3dau" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:[\u0009\u000A\u000D ]*\{[\u0009\u000A\u000D ]*(?:decimalpoint|left|right|center)(?:[\u0009\u000A\u000D ]+(?:decimalpoint|left|right|center))*\})*[\u0009\u000A\u000D ]*\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."__text_mlv3bwkpew" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:0*(?:[0-9]{1,19}|1[0-7][0-9]{18}|18[0-3][0-9]{17}|184[0-3][0-9]{16}|1844[0-5][0-9]{15}|18446[0-6][0-9]{14}|184467[0-3][0-9]{13}|1844674[0-3][0-9]{12}|184467440[0-6][0-9]{10}|1844674407[0-2][0-9]{9}|18446744073[0-6][0-9]{8}|1844674407370[0-8][0-9]{6}|18446744073709[0-4][0-9]{5}|184467440737095[0-4][0-9]{4}|18446744073709550[0-9]{3}|18446744073709551[0-5][0-9]{2}|1844674407370955160[0-9]|1844674407370955161[0-4]|18446744073709551615)|\-0+)\Z'::"pg_catalog"."text") IS TRUE);

CREATE DOMAIN "qti"."__text_q57lslnkle" AS "pg_catalog"."text" COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:(?:downdiagonalstrike|horizontalstrike|none|updiagonalstrike|verticalstrike)(?: (?:downdiagonalstrike|horizontalstrike|none|updiagonalstrike|verticalstrike))*)?\Z'::"pg_catalog"."text") IS TRUE);
