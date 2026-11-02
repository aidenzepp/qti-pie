CREATE TYPE "qti"."bound" AS ENUM ('bounded', 'unlimited');

CREATE TYPE "qti"."idref_attribute" AS ENUM ('aria-activedescendant', 'aria-controls', 'aria-describedby', 'aria-details', 'aria-errormessage', 'aria-flowto', 'aria-labelledby', 'aria-owns', 'data-catalog-idref', 'headers');

CREATE TYPE "qti"."orientation" AS ENUM ('vertical', 'horizontal');

CREATE TYPE "qti"."printed_variable_attr" AS ENUM ('base', 'index');

CREATE TYPE "qti"."shape" AS ENUM ('circle', 'default', 'ellipse', 'poly', 'rect');

CREATE TYPE "qti"."show_hide" AS ENUM ('show', 'hide');

CREATE TYPE "qti"."yes_no" AS ENUM ('yes', 'no');

CREATE DOMAIN "qti"."__text_osqmo2ktsg" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:[A-Za-z]{1,8}(?:\-[0-9A-Za-z]{1,8}){0,127})?\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_t27tgfubfq" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A\+?0*[1-9][0-9]*\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_ffwr4dbfx2" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('both'::text, 'inline'::text, 'list'::text, 'none'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_ocl2hjarfs" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('baseline'::text, 'bottom'::text, 'middle'::text, 'top'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_uc3mvgolsg" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:[A-Z\_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF][\-\.0-9A-Z\_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF]{0,255}(?: [A-Z\_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF][\-\.0-9A-Z\_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF]{0,255})*)?\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_dqq6r4bdbe" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('anonymous'::text, 'use-credentials'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_tq7gq2jmkl" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A\+?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[Ee][\+\-]?[0-9]+)?\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_wu54ry3yoe" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('assertive'::text, 'off'::text, 'polite'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_oct7jwkpoj" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('false'::text, 'true'::text, 'undefined'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_oy4m3tqgfd" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:[\u0001-\u0008\u000B\u000C\u000E-\u001F\!-\.0-\U0010FFFF]{1,127}\/[\u0001-\u0008\u000B\u000C\u000E-\u001F\!-\U0010FFFF]{1,255}(?: [\u0001-\u0008\u000B\u000C\u000E-\u001F\!-\.0-\U0010FFFF]{1,127}\/[\u0001-\u0008\u000B\u000C\u000E-\u001F\!-\U0010FFFF]{1,255})*)?\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_fictzx37my" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('date'::text, 'false'::text, 'location'::text, 'page'::text, 'step'::text, 'time'::text, 'true'::text, 'undefined'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_xs56r6cx4y" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[\+\-]?[0-9]{1,10}\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_6gan25pdor" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('false'::text, 'grammar'::text, 'spelling'::text, 'true'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_dwt2qnsttp" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('ascending'::text, 'descending'::text, 'none'::text, 'other'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_x5wrjyn3pc" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:d(?:e(?:finition|letion)|ialog|ocument)|emphasis|f(?:igure|orm)|g(?:eneric|r(?:id(?:cell)?|oup))|heading|i(?:mg|nsertion)|l(?:i(?:nk|st(?:item|box)?)|og)|m(?:e(?:nu(?:item(?:radio|checkbox)?|bar)?|ter)|a(?:in|rquee|th))|n(?:ote|avigation)|option|pr(?:esentation|ogressbar)|r(?:egion|ow(?:group|header)?|adio(?:group)?)|s(?:e(?:parator|arch(?:box)?)|lider|pinbutton|t(?:rong|atus)|u(?:perscript|bscript)|witch|crollbar)|t(?:e(?:rm|xtbox)|imer?|ool(?:tip|bar)|ree(?:grid|item)?|ab(?:list|panel)?)|a(?:lert(?:dialog)?|pplication|rticle)|b(?:utton|anner)|c(?:heckbox|o(?:de|lumnheader|m(?:plementary|bobox)|ntentinfo)))\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_awt4t5kosa" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A\%[ \#\+\-0]*[0-9]*(?:\.[0-9]+)?[EGRXe-giorx]\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_hawigbfw6m" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('all'::text, 'computer-read-aloud'::text, 'screen-reader'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_gubl3xpcnx" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:[0-9]+\%?(?:\,[0-9]+\%?){2}(?:\,[0-9]+\%?)?|[0-9]+\%?(?:\,[0-9]+\%?){5}(?:\,[0-9]+\%?\,[0-9]+\%?)*)\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_a4spx6pjqw" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[0-9]+\%?(?:\,[0-9]+\%?){3}\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_5zvd6hcv2x" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('DATA'::text, 'REF'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_djykoynpls" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:[\+\-]?[0-9]+|[A-Z\_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF][\-\.0-9A-Z\_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF]{0,255})\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_72jqunyi7z" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('auto'::text, 'metadata'::text, 'none'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_5lyuoloiou" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:proctor|scorer|testConstructor|tutor|author|candidate)(?: (?:proctor|scorer|testConstructor|tutor|author|candidate))*\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_bvx3fqniye" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[0-9]+\%?(?:\,[0-9]+\%?){2}\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_dbdfklalek" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('captions'::text, 'chapters'::text, 'descriptions'::text, 'metadata'::text, 'subtitles'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_tdupg63xcv" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('plain'::text, 'preformatted'::text, 'xhtml'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_oy6p76tbqw" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('center'::text, 'char'::text, 'justify'::text, 'left'::text, 'right'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_tmjud3n2tg" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[A-Z\_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF][\-\.0-9A-Z\_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF]{0,255}(?: [A-Z\_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF][\-\.0-9A-Z\_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\U00010000-\U000EFFFF]{0,255})*\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_o3dskk7ctt" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('auto'::text, 'ltr'::text, 'rtl'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_o3e7dedzyv" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:(?:[A-Za-z]{4}|[A-Za-z]{5,8}|[A-Za-z]{2,3}(?:\-[A-Za-z]{3}){0,3})(?:\-[A-Za-z]{4})?(?:\-(?:[0-9]{3}|[A-Za-z]{2}))?(?:\-(?:[0-9A-Za-z]{5,8}|[0-9][0-9A-Za-z]{3})){0,8}(?:\-[0-9A-WYZa-wyz](?:\-[0-9A-Za-z]{2,8}){1,8}){0,8}(?:\-[Xx](?:\-[0-9A-Za-z]{1,8}){1,8})?|[Xx](?:\-[0-9A-Za-z]{1,8}){1,8})?\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_wjqnoy6t2y" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('col'::text, 'colgroup'::text, 'row'::text, 'rowgroup'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_fgbxwprcwx" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[\+\-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_h4r6alp6hk" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:[\+\-]?[0-9]+(?: [\+\-]?[0-9]+)*)?\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_exm3fkarq3" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE IN ('false'::text, 'mixed'::text, 'true'::text, 'undefined'::text)) IS TRUE);

CREATE DOMAIN "qti"."__text_kcydnvglpj" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:ext\:[\-\.0-9A-Z\_a-z]+|instructions|navigation|scoring)\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_gm4clqaaza" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A[0-9]+\%?(?:\,[0-9]+\%?){5}(?:\,[0-9]+\%?\,[0-9]+\%?)*\Z'::text) IS TRUE);

CREATE DOMAIN "qti"."__text_saolosnhkp" AS text COLLATE "pg_catalog"."pg_c_utf8" CONSTRAINT "check" CHECK ((VALUE ~ '\A(?:(?:removals|text|additions|all)(?: (?:removals|text|additions|all))*)?\Z'::text) IS TRUE);
