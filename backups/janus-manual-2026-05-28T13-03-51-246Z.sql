--
-- PostgreSQL database dump
--

\restrict RjKLH6KB6A7IhcZv8mpTDVJ7JHXE4HhOqIzPvblvR4SEIjoKofEudZWWaVLcWic

-- Dumped from database version 18.3 (Debian 18.3-1.pgdg13+1)
-- Dumped by pg_dump version 18.3 (Debian 18.3-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: blog_post_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.blog_post_status AS ENUM (
    'DRAFT',
    'PUBLISHED'
);


ALTER TYPE public.blog_post_status OWNER TO postgres;

--
-- Name: project_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.project_type AS ENUM (
    'LANDING_PAGE',
    'INSTITUTIONAL'
);


ALTER TYPE public.project_type OWNER TO postgres;

--
-- Name: script_position; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.script_position AS ENUM (
    'HEAD',
    'BODY_END'
);


ALTER TYPE public.script_position OWNER TO postgres;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'ADMIN',
    'DEFAULT',
    'DEVELOPER'
);


ALTER TYPE public.user_role OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: blog_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blog_categories (
    id uuid NOT NULL,
    name text NOT NULL,
    description text,
    image_url text,
    slug text NOT NULL,
    project_id uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    parent_id uuid,
    seo_description text,
    seo_keywords text,
    seo_title text,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.blog_categories OWNER TO postgres;

--
-- Name: blog_post_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blog_post_categories (
    post_id uuid NOT NULL,
    category_id uuid NOT NULL
);


ALTER TABLE public.blog_post_categories OWNER TO postgres;

--
-- Name: blog_post_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blog_post_tags (
    post_id uuid NOT NULL,
    tag_id uuid NOT NULL
);


ALTER TABLE public.blog_post_tags OWNER TO postgres;

--
-- Name: blog_posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blog_posts (
    id uuid NOT NULL,
    title text NOT NULL,
    subtitle text,
    published_at timestamp(3) without time zone,
    body text NOT NULL,
    cover_image_url text,
    author_name text NOT NULL,
    seo_title text,
    seo_description text,
    seo_keywords text,
    project_id uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    reading_time integer,
    slug text,
    author_id uuid,
    status public.blog_post_status DEFAULT 'PUBLISHED'::public.blog_post_status NOT NULL
);


ALTER TABLE public.blog_posts OWNER TO postgres;

--
-- Name: blog_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blog_tags (
    id uuid NOT NULL,
    name text NOT NULL,
    description text,
    image_url text,
    slug text NOT NULL,
    project_id uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    parent_id uuid,
    seo_description text,
    seo_keywords text,
    seo_title text,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.blog_tags OWNER TO postgres;

--
-- Name: companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.companies (
    id uuid NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    description text,
    logo text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone,
    created_by_id uuid,
    guest_mode_enabled boolean DEFAULT false NOT NULL,
    webhook_token text,
    webhook_url text
);


ALTER TABLE public.companies OWNER TO postgres;

--
-- Name: guest_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.guest_entries (
    id uuid NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "companyId" uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.guest_entries OWNER TO postgres;

--
-- Name: guest_posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.guest_posts (
    id uuid NOT NULL,
    title text,
    message text NOT NULL,
    "imageUrl" text NOT NULL,
    "guestId" uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    "mediaType" text DEFAULT 'IMAGE'::text NOT NULL
);


ALTER TABLE public.guest_posts OWNER TO postgres;

--
-- Name: login_attempts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.login_attempts (
    id uuid NOT NULL,
    ip text NOT NULL,
    email text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.login_attempts OWNER TO postgres;

--
-- Name: pages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pages (
    id uuid NOT NULL,
    "projectId" uuid NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    content jsonb DEFAULT '{}'::jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone,
    is_published boolean DEFAULT false NOT NULL,
    content_data jsonb DEFAULT '{}'::jsonb,
    schema_data jsonb DEFAULT '{}'::jsonb,
    preview_url text,
    is_advanced boolean DEFAULT false NOT NULL,
    ui_schema jsonb DEFAULT '{}'::jsonb
);


ALTER TABLE public.pages OWNER TO postgres;

--
-- Name: project_histories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_histories (
    id uuid NOT NULL,
    "projectId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    "previousState" jsonb,
    "newState" jsonb,
    version integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.project_histories OWNER TO postgres;

--
-- Name: projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.projects (
    id uuid NOT NULL,
    "companyId" uuid NOT NULL,
    name text NOT NULL,
    type public.project_type NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone,
    deleted_by text,
    deletion_reason text,
    is_active boolean DEFAULT true NOT NULL,
    preview_url text,
    blog_enabled boolean DEFAULT false NOT NULL,
    cms_sync_script_url text,
    cms_enabled boolean DEFAULT false NOT NULL
);


ALTER TABLE public.projects OWNER TO postgres;

--
-- Name: site_scripts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.site_scripts (
    id uuid NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    "position" public.script_position DEFAULT 'HEAD'::public.script_position NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    project_id uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.site_scripts OWNER TO postgres;

--
-- Name: user_companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_companies (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    company_id uuid NOT NULL,
    permissions text[] DEFAULT ARRAY[]::text[],
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_companies OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role public.user_role DEFAULT 'DEFAULT'::public.user_role NOT NULL,
    user_image text,
    preferences jsonb DEFAULT '{}'::jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone,
    "companyId" uuid,
    name text,
    phone text,
    requires_password_reset boolean DEFAULT false NOT NULL,
    created_by_id uuid,
    permissions text[] DEFAULT ARRAY[]::text[]
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
e35ca7dc-df74-44f1-be04-b53fff81661b	a3171e0110565f22fe4da5fa82dd0fe4a22fe9d9aa99c3cb076564541ce2834d	2026-05-07 02:47:07.620146+00	20260507024707_update_user_ui_fields	\N	\N	2026-05-07 02:47:07.600446+00	1
cf79fe8f-03f5-4970-8dab-918443ebfd3f	dcf0f01505d4c58056a96d7b6aebb02914a11985246cc045d7cd1b91171616fe	2026-05-09 23:27:29.04989+00	20260509232658_add_multi_tenant_architecture	\N	\N	2026-05-09 23:27:29.0028+00	1
b71d198d-a8a7-4676-93de-62f42a42699a	e83f6b01201b1c8abd020404cbc26c6ce8894101b34d16f2eba95517504f6f97	2026-05-10 00:32:13.408234+00	20260510003213_add_is_published_to_pages	\N	\N	2026-05-10 00:32:13.400742+00	1
47f9e719-72fe-4dc8-ada2-7ff856880495	d1978a38d4714f9618f713b06b06e98481af2fe0cc92d2413a1077c830bfd4ab	2026-05-19 02:37:19.578865+00	20260515024918_add_media_type_to_guest_posts		\N	2026-05-19 02:37:19.578865+00	0
e19e6c64-ea1c-4dcf-b83e-111e46cdce95	85cc47d7cad3d7e2cd27c7fa9c2d7e06eeedae69d970f040a65906889ff5faae	\N	20260519000000_add_is_advanced_to_pages	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260519000000_add_is_advanced_to_pages\n\nDatabase error code: 42701\n\nDatabase error:\nERROR: column "is_advanced" of relation "pages" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42701), message: "column \\"is_advanced\\" of relation \\"pages\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("tablecmds.c"), line: Some(7686), routine: Some("check_for_column_name_collision") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260519000000_add_is_advanced_to_pages"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20260519000000_add_is_advanced_to_pages"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:255	2026-05-19 13:12:08.621999+00	2026-05-19 12:58:10.045016+00	0
c121e013-ca31-4fda-bf22-2a54407e1cce	85cc47d7cad3d7e2cd27c7fa9c2d7e06eeedae69d970f040a65906889ff5faae	2026-05-19 13:12:08.632403+00	20260519000000_add_is_advanced_to_pages		\N	2026-05-19 13:12:08.632403+00	0
7b4fdc44-290e-47c9-8237-b03a97e877ee	02afb9bdc482a78115acd06c6fd69434324e4aa367dc3bdd4ba362dd6f04ee4b	2026-05-24 04:17:02.599243+00	20260524000000_add_user_company		\N	2026-05-24 04:17:02.599243+00	0
eafcf6f8-4a0d-4fa5-bb24-78dfca1f133b	37bf589045725b67e925569a2ece3baf20aab13898b52092c17c26f588f91caa	2026-05-24 04:37:02.035229+00	20260524000001_user_company_nullable		\N	2026-05-24 04:37:02.035229+00	0
\.


--
-- Data for Name: blog_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.blog_categories (id, name, description, image_url, slug, project_id, created_at, updated_at, parent_id, seo_description, seo_keywords, seo_title, is_active) FROM stdin;
195ed147-9c7c-4807-93f9-347427da5e5f	ee	\N	\N	ee	abc54359-95c3-4066-a8fa-05e998c8fc7f	2026-05-20 00:41:35.984	2026-05-20 00:41:35.984	\N	\N	\N	\N	t
77848c03-4b28-457b-9462-42420a43e910	e	e	https://mavellium-janus.b-cdn.net/blog-categories/uid-1779237691440.avif	e	abc54359-95c3-4066-a8fa-05e998c8fc7f	2026-05-20 00:41:40.233	2026-05-20 00:41:40.233	195ed147-9c7c-4807-93f9-347427da5e5f	e	e	e	t
\.


--
-- Data for Name: blog_post_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.blog_post_categories (post_id, category_id) FROM stdin;
\.


--
-- Data for Name: blog_post_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.blog_post_tags (post_id, tag_id) FROM stdin;
\.


--
-- Data for Name: blog_posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.blog_posts (id, title, subtitle, published_at, body, cover_image_url, author_name, seo_title, seo_description, seo_keywords, project_id, created_at, updated_at, reading_time, slug, author_id, status) FROM stdin;
538e42f9-c75a-416b-bff8-76e4ad699d91	eee	eee	2026-05-20 00:00:00	<p>eeeeeeeeeeeeee</p>	https://mavellium-janus.b-cdn.net/blog-covers/uid-1779245551358.avif	ee	ee	e	e	abc54359-95c3-4066-a8fa-05e998c8fc7f	2026-05-20 02:52:39.897	2026-05-20 02:52:39.897	\N	\N	\N	PUBLISHED
\.


--
-- Data for Name: blog_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.blog_tags (id, name, description, image_url, slug, project_id, created_at, updated_at, parent_id, seo_description, seo_keywords, seo_title, is_active) FROM stdin;
7131a6e1-da5c-480f-9700-96f84746148b	e	e	\N	e	abc54359-95c3-4066-a8fa-05e998c8fc7f	2026-05-20 02:52:16.911	2026-05-20 02:52:16.911	\N	e	e	e	t
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.companies (id, slug, name, description, logo, created_at, updated_at, deleted_at, created_by_id, guest_mode_enabled, webhook_token, webhook_url) FROM stdin;
00000000-0000-0000-0000-000000000001	default	Default Company	\N	\N	2026-05-09 23:27:29.018	2026-05-09 23:27:29.018	\N	\N	f	\N	\N
bedaf6ce-590f-4171-9b1c-3d61894a9218	test-company	Test Company	Ambiente de testes automatizados	\N	2026-05-09 23:33:42.587	2026-05-13 02:14:52.166	\N	\N	f	\N	\N
d34e02ac-b8fd-4d86-9ba3-aa56a33c4e31	testee	teste	e	\N	2026-05-17 03:11:05.986	2026-05-17 03:11:05.986	\N	5ec3cc01-8cf2-4b9e-87df-9c85dcc0b1fa	f	\N	\N
6109563c-5f2d-4576-96c8-342f02b87f05	teste-company	123123	eeee	\N	2026-05-13 01:36:19.978	2026-05-17 05:57:00.34	\N	15ed1ffd-853f-4bc1-b05f-f50e154a151d	t	\N	\N
4225cb65-ab52-4c18-87e0-d649ce401942	ee	teste 90	eeeee	\N	2026-05-17 06:01:38.689	2026-05-17 06:01:38.689	\N	b8128e79-9502-4c97-abfe-06cb02c8cfc6	f	\N	\N
14d989da-3a81-435c-ac4a-0e5afcf3efa3	eee	1231231231233	eee	\N	2026-05-17 05:53:27.598	2026-05-17 06:01:52.12	\N	b8128e79-9502-4c97-abfe-06cb02c8cfc6	f	\N	\N
\.


--
-- Data for Name: guest_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.guest_entries (id, name, email, "companyId", created_at, updated_at) FROM stdin;
26687c16-4bc8-4067-a6cc-7b42e24b30bf	teste	teste2@gmail.com	6109563c-5f2d-4576-96c8-342f02b87f05	2026-05-13 01:41:40.679	2026-05-13 01:41:40.679
6d848c26-2917-4634-8d2b-7e6d63dcb6bd	teste3	teste3@gmail.com	6109563c-5f2d-4576-96c8-342f02b87f05	2026-05-13 01:58:28.294	2026-05-13 01:58:28.294
0e98b59a-dfee-47a8-a642-8cc64c2b2f6f	eeee	eeee@gmail.com	6109563c-5f2d-4576-96c8-342f02b87f05	2026-05-14 13:04:25.38	2026-05-14 13:04:25.38
\.


--
-- Data for Name: guest_posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.guest_posts (id, title, message, "imageUrl", "guestId", created_at, updated_at, "mediaType") FROM stdin;
982641d5-265a-4911-ab0b-a7e3df2a2606	ee	ee	https://mavellium-janus.b-cdn.net/guest-posts/uid-1778636884004.avif	26687c16-4bc8-4067-a6cc-7b42e24b30bf	2026-05-13 01:48:04.843	2026-05-13 01:48:04.843	IMAGE
b61d44d8-ea47-4975-a0be-54e2e9541e6f	eee	eeee	https://mavellium-janus.b-cdn.net/guest-posts/uid-1778637519827.avif	6d848c26-2917-4634-8d2b-7e6d63dcb6bd	2026-05-13 01:58:40.854	2026-05-13 01:58:40.854	IMAGE
f5c63d02-84a1-477b-a277-81dd95bd81e3	ee	ee	https://mavellium-janus.b-cdn.net/guest-posts/uid-1778765970558.avif	0e98b59a-dfee-47a8-a642-8cc64c2b2f6f	2026-05-14 13:39:32.636	2026-05-14 13:39:32.636	IMAGE
19ffe38b-c0de-44aa-a6a5-6ad43df01b6f	ee	e	https://mavellium-janus.b-cdn.net/guest-posts/uid-1778813655952.avif	6d848c26-2917-4634-8d2b-7e6d63dcb6bd	2026-05-15 02:54:24.211	2026-05-15 02:54:24.211	IMAGE
96b0e4f7-9323-4eb0-8d54-b35cd4b379a4	e	e	https://mavellium-janus.b-cdn.net/guest-posts/uid-1778813942406.mp4	6d848c26-2917-4634-8d2b-7e6d63dcb6bd	2026-05-15 02:59:31.559	2026-05-15 02:59:31.559	VIDEO
b684e0f1-9288-43c4-bfe1-8ebd856a45f1	e	e	https://mavellium-janus.b-cdn.net/guest-posts/uid-1778814303179.png	6d848c26-2917-4634-8d2b-7e6d63dcb6bd	2026-05-15 03:05:14.573	2026-05-15 03:05:14.573	IMAGE
e97e22a8-a4a9-4b9c-805d-86523dc60f55	e	e	https://mavellium-janus.b-cdn.net/guest-posts/uid-1778815012674.png	6d848c26-2917-4634-8d2b-7e6d63dcb6bd	2026-05-15 03:16:54.723	2026-05-15 03:16:54.723	IMAGE
7ac86ac6-17e0-4266-9eea-b4bd344aaac6	e	e	https://mavellium-janus.b-cdn.net/guest-posts/uid-1778815308765.png	6d848c26-2917-4634-8d2b-7e6d63dcb6bd	2026-05-15 03:21:50.263	2026-05-15 03:21:50.263	IMAGE
b700be48-6d85-4bde-af6c-bebc772704df	e	e	https://mavellium-janus.b-cdn.net/guest-posts/uid-1778815396628.mp4	6d848c26-2917-4634-8d2b-7e6d63dcb6bd	2026-05-15 03:24:00.981	2026-05-15 03:24:00.981	VIDEO
c1292a35-42dc-43a8-bcf0-1d2df35286ed	\N	eee	https://mavellium-janus.b-cdn.net/guest-posts/uid-1778847367842.png	0e98b59a-dfee-47a8-a642-8cc64c2b2f6f	2026-05-15 12:16:09.655	2026-05-15 12:16:09.655	IMAGE
\.


--
-- Data for Name: login_attempts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.login_attempts (id, ip, email, created_at) FROM stdin;
f578043a-d221-4c80-8115-d04d498e4bc0	::1	teste2@gmail.com	2026-05-10 04:41:54.726
8fcfa247-8def-4a67-a63a-0459180ff2f7	::1	teste2@gmail.com	2026-05-10 04:44:34.105
2bf5c818-a7a1-4e01-8960-3ce35eaa36db	::1	teste3@gmail.com	2026-05-12 19:17:47.211
77abfb37-e38c-47e1-883e-1e755d3d6d1c	::1	teste6@gmail.com	2026-05-13 03:01:15.928
1fd58643-4099-4562-92ad-2cd6f1436c9f	::1	teste7@gmail.com	2026-05-17 05:48:12.183
97fe211c-6ea4-49ac-8864-e4f14141e216	::1	teste7@gmail.com	2026-05-17 17:14:27.212
8c7de570-c857-4194-8d79-7faf09e1158e	::1	teste2@gmail.com	2026-05-19 12:49:51.078
9b994151-43d8-4327-9634-e9c7206d7f15	::1	teste2@gmail.com	2026-05-19 12:50:03.728
ea205f83-117b-4264-85c5-fcf80d220022	::1	teste2@gmail.com	2026-05-24 05:25:50.702
6ad497b7-5a95-4877-a8c2-692f96a8afa5	::1	e2@gmail.com	2026-05-24 05:43:11.873
\.


--
-- Data for Name: pages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pages (id, "projectId", name, slug, content, created_at, updated_at, deleted_at, is_published, content_data, schema_data, preview_url, is_advanced, ui_schema) FROM stdin;
ca00700a-9f6d-4e92-99c9-488d008f7bad	4557b656-217e-4f3f-9a50-8876193c4399	Home	home	{"nodes": [{"id": "dbfbebc5-8e51-44b6-bb40-d37d62b09759", "type": "Section", "props": {}, "children": []}], "globalSettings": {"textColor": "#161718", "fontFamily": "Inter", "backgroundColor": "#F5F5F5"}}	2026-05-09 23:33:42.669	2026-05-10 02:52:52.778	\N	f	{}	{}	\N	f	{}
2b00d81d-4295-4d84-b390-a9618bfeeb0a	fea47d61-f0d1-4b04-ba10-f872f87bc422	Home	/	{"nodes": [], "globalSettings": {}}	2026-05-10 03:21:21.176	2026-05-10 03:21:21.176	\N	f	{}	{}	\N	f	{}
62651f9a-9155-4ef4-a56b-b1d78959c1f7	b61d688d-8251-4b8a-9325-21004b1c6f30	Home	/	{"nodes": [{"id": "4f756621-8562-4494-a939-a13356fdb8ea", "type": "Section", "props": {"style": {"display": "flex", "marginTop": "232222"}}, "children": []}, {"id": "4ecaf74b-c9d1-4043-8ee6-01ace89f961d", "type": "Section", "props": {}, "children": []}, {"id": "adad97cb-647d-4f47-ad47-5c45153fe28a", "type": "Section", "props": {}, "children": []}, {"id": "d7e075bd-d107-4cb1-aa0e-ea8d6343e1ad", "type": "Heading", "props": {"content": "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"}, "children": []}], "globalSettings": {}}	2026-05-10 03:23:00.69	2026-05-10 04:07:18.846	\N	f	{}	{}	\N	f	{}
543f5b4c-fa96-4859-85a6-fc3b7cfb3c45	d28080af-727e-43f5-9053-cc28603f61d8	Home	home2	[{"id": "0f2332fc-0c47-437f-8105-1c11f4cda948", "type": "Hero", "props": {"text": "Hero", "title": "fffzczx", "bgColor": "#ffb300", "subtitle": "dzxczxcz"}, "children": []}, {"id": "dbc2f94d-256f-4cdb-af51-260f45b9bdc2", "type": "Container", "props": {"text": "Container"}, "children": []}]	2026-05-09 23:36:16.925	2026-05-12 02:02:38.437	\N	f	{}	{"fields": ["eeeeeeeee"]}	\N	f	{}
3b020100-49a4-41ee-b7e2-4b665f23a5f9	a5777a12-7b69-4dfd-880c-7af9949ee87f	Home	/	{"nodes": [], "globalSettings": {}}	2026-05-12 02:05:14.084	2026-05-12 02:05:14.084	\N	f	{}	{}	\N	f	{}
8e07b30c-8ad4-4520-96ad-7d93b0ec0642	1e8460a4-8035-404d-8758-494b6a51f00f	Home	/	{"nodes": [], "globalSettings": {}}	2026-05-16 15:37:21.394	2026-05-16 15:37:21.394	\N	f	{}	{}	\N	f	{}
8945ca1b-a9da-474d-b47d-c6ec19d0848c	36b29239-2063-419b-840c-c34a5fbd454e	Home	/	{"nodes": [], "globalSettings": {}}	2026-05-16 22:40:23.742	2026-05-16 22:40:23.742	\N	f	{}	{}	\N	f	{}
8b383418-8248-4f61-80b7-10b921014338	9fac4645-77ed-4747-bd34-8230adeca5ac	Home	/	{"nodes": [], "globalSettings": {}}	2026-05-17 03:53:08.412	2026-05-17 03:53:08.412	\N	f	{}	{}	\N	f	{}
0e8ceb2a-022b-465e-b3bd-6b3054344c19	3f467c11-5252-4007-8ead-6abfc66eed9e	Home	/	{"nodes": [], "globalSettings": {}}	2026-05-17 05:10:15.033	2026-05-17 05:10:15.033	\N	f	{}	{}	\N	f	{}
c854f0cb-4b2f-42a8-a16b-ad77c6c2fcdb	958b393d-9cc6-45b6-b42b-b93f08ba414d	Home	/	{"nodes": [], "globalSettings": {}}	2026-05-17 06:21:08.367	2026-05-17 06:21:08.367	\N	f	{}	{}	\N	f	{}
eb528157-77fc-4c85-be9a-73c25443dac0	9adaf413-3d91-4a77-b36a-6ab739a6792f	Home	home	{"sections": [{"type": "hero", "title": "Welcome to Test Page", "description": "This is a test landing page"}]}	2026-05-19 12:51:11.742	2026-05-19 12:51:11.742	\N	f	{}	{}	\N	f	{}
19d75c40-5165-401b-9557-c2484c99e80f	abc54359-95c3-4066-a8fa-05e998c8fc7f	Home	-	{"nodes": [], "globalSettings": {}}	2026-05-17 06:05:15.507	2026-05-21 02:16:45.141	\N	f	{}	[{"id": "hero", "name": "Hero Section", "fields": [{"name": "title", "type": "text", "label": "Título"}]}, {"id": "video-zghwi", "name": "Vídeo", "fields": [{"name": "active", "type": "boolean", "label": "Ativo"}, {"name": "title", "type": "text", "label": "Título"}, {"name": "videoUrl", "type": "video", "label": "Vídeo"}]}, {"id": "rich-text-ymo8x", "name": "Texto Rico", "fields": [{"name": "active", "type": "boolean", "label": "Ativo"}, {"name": "content", "type": "html", "label": "Conteúdo HTML"}]}]	\N	f	{}
5a8ed14b-1b47-4d0d-81b9-7417c739e7eb	a5777a12-7b69-4dfd-880c-7af9949ee87f	teste	teste2	{}	2026-05-12 02:08:24.334	2026-05-19 16:30:04.683	\N	t	{"card": [{"id": "cltx8abc0001", "name": "Vinícius Tavares aaaaaaaaaaaaaaaaaaaaaaa", "role": "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.", "email": "vinicius.mota@mavellium.com.br", "image": "https://tegbe-cdn.b-cdn.net/uploads/1778547808015-121212.PNG", "phone": "+5511999999999"}, {"id": "cltx8abc0002", "name": "Luan dos Santos", "role": "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.", "email": "luan.santos@mavellium.com.br", "image": "https://tegbe-cdn.b-cdn.net/uploads/1778547940074-Gemini-Generated-Image-77102j77102j7710-1--1-.png", "phone": "+5511999999999"}, {"id": "cltx8abc0003", "name": "Márcio Piva Junior", "role": "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.", "email": "marcio.piva@mavellium.com.br", "image": "https://tegbe-cdn.b-cdn.net/uploads/1778547974116-Frame-44.ico", "phone": "+5511999999999"}]}	{"card": [{"id": "cltx8abc0001", "name": "123", "role": "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.", "email": "vinicius.mota@mavellium.com.br", "image": "https://tegbe-cdn.b-cdn.net/uploads/1778547808015-121212.PNG", "phone": "+5511999999999"}, {"id": "cltx8abc0002", "name": "Luan dos Santos", "role": "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.", "email": "luan.santos@mavellium.com.br", "image": "https://tegbe-cdn.b-cdn.net/uploads/1778547940074-Gemini-Generated-Image-77102j77102j7710-1--1-.png", "phone": "+5511999999999"}, {"id": "cltx8abc0003", "name": "Márcio Piva Junior", "role": "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.", "email": "marcio.piva@mavellium.com.br", "image": "https://tegbe-cdn.b-cdn.net/uploads/1778547974116-Frame-44.ico", "phone": "+5511999999999"}]}	https://www.mavellium.com.br/fitec-2026	t	{}
0d801959-9be6-4aa2-ba88-db434be663e8	abc54359-95c3-4066-a8fa-05e998c8fc7f	eeeeeeeeee222	eeeeeeeeee	{}	2026-05-17 06:19:00.392	2026-05-21 02:15:10.757	\N	t	{"hero-7pcf9": {"active": true, "backgroundImage": "https://mavellium-janus.b-cdn.net/media/uid-1779035881207.avif"}}	[{"id": "hero", "name": "Hero Section", "fields": [{"name": "title", "type": "text", "label": "Título"}]}, {"id": "features-qt1ce", "name": "Features Grid", "fields": [{"name": "active", "type": "boolean", "label": "Ativo"}, {"name": "title", "type": "text", "label": "Título"}, {"name": "items", "type": "textarea", "label": "Lista de Items"}]}, {"id": "carousel-9ra3z", "name": "Carrossel", "fields": [{"name": "active", "type": "boolean", "label": "Ativo"}, {"name": "slides", "type": "list", "label": "Slide", "itemFields": [{"name": "image", "type": "image", "label": "Imagem"}, {"name": "caption", "type": "text", "label": "Legenda"}]}, {"name": "autoplay", "type": "boolean", "label": "Autoplay"}, {"name": "interval", "type": "number", "label": "Intervalo (ms)"}]}, {"id": "seo-yi2ic", "name": "SEO Meta", "fields": [{"name": "active", "type": "boolean", "label": "Ativo"}, {"name": "metaTitle", "type": "text", "label": "Meta Title"}, {"name": "metaDescription", "type": "textarea", "label": "Meta Description"}, {"name": "ogImage", "type": "image", "label": "Open Graph Image"}]}, {"id": "advanced-uzveg", "name": "Componentes Avançados", "fields": [{"name": "active", "type": "boolean", "label": "Ativo"}, {"name": "quantity", "type": "number", "label": "Quantidade"}, {"name": "primaryColor", "type": "color", "label": "Cor Principal"}, {"name": "isVisible", "type": "boolean", "label": "Visível"}, {"name": "layout", "type": "select", "label": "Layout", "options": [{"label": "Coluna Única", "value": "single"}, {"label": "Duas Colunas", "value": "two-col"}, {"label": "Grade 3x3", "value": "grid-3"}]}]}]	\N	t	{"card": {"ui:label": "Integrantes da Equipe"}, "card.*.id": {"ui:widget": "hidden"}, "card.*.name": {"ui:label": "Nome Completo"}, "card.*.role": {"ui:label": "Descrição / Cargo", "ui:widget": "textarea", "ui:description": "Texto de apresentação do membro na página."}, "card.*.email": {"ui:label": "E-mail"}, "card.*.image": {"ui:label": "Foto do Membro", "ui:widget": "image"}, "card.*.phone": {"ui:label": "Telefone", "ui:description": "Formato: +5511999999999"}}
942d3a4c-3118-484c-9109-f4d46ab75e7b	20a8ef8a-1674-4bd5-8020-fa1a90c10d6e	Home	/	{"nodes": [], "globalSettings": {}}	2026-05-17 17:30:52.283	2026-05-23 14:52:42.535	\N	t	{}	{"name": "Home", "slug": "home", "schema": {"faq-mavellium": {"label": "FAQ", "fields": {"items": {"type": "array", "label": "Perguntas", "itemFields": {"image": {"type": "text", "label": "URL da imagem"}, "answer": {"type": "textarea", "label": "Resposta"}, "category": {"type": "text", "label": "Categoria"}, "question": {"type": "text", "label": "Pergunta"}}}}}, "sobre-mavellium": {"label": "Quem Somos", "fields": {"services": {"type": "array", "label": "Abas de serviço", "itemFields": {"id": {"type": "text", "label": "ID (01, 02...)"}, "tag": {"type": "text", "label": "Tag (ex: A Empresa)"}, "image": {"type": "text", "label": "URL da imagem"}, "title": {"type": "text", "label": "Título"}, "description": {"type": "textarea", "label": "Descrição"}}}}}, "solucoes-mavellium": {"label": "Soluções", "fields": {"cards": {"type": "array", "label": "Cards", "itemFields": {"id": {"type": "text", "label": "ID: sites-inteligentes | landing-pages | automacao-ia"}, "image": {"type": "text", "label": "URL da imagem"}, "imageAlt": {"type": "text", "label": "Alt da imagem"}, "buttonText": {"type": "text", "label": "Texto do botão"}, "frontTitle": {"type": "text", "label": "Título (frente)"}, "backDescription": {"type": "textarea", "label": "Descrição (verso)"}, "frontDescription": {"type": "textarea", "label": "Descrição (frente)"}}}, "description": {"type": "textarea", "label": "Descrição da seção"}}}, "cta-final-mavellium": {"label": "CTA Final", "fields": {"text": {"type": "object", "label": "Textos", "fields": {"headline": {"type": "text", "label": "Headline"}, "highlight": {"type": "text", "label": "Destaque (verde)"}, "description": {"type": "textarea", "label": "Descrição"}}}, "theme": {"type": "object", "label": "Tema", "fields": {"bg_color": {"type": "text", "label": "Cor de fundo (hex)"}, "button_bg": {"type": "text", "label": "Cor do botão"}, "gradient_end": {"type": "text", "label": "Gradiente fim"}, "gradient_start": {"type": "text", "label": "Gradiente início"}}}, "calls_to_action": {"type": "object", "label": "CTAs", "fields": {"primary": {"type": "object", "label": "Primário", "fields": {"href": {"type": "text", "label": "Link"}, "icon": {"type": "text", "label": "Ícone (iconify)"}, "label": {"type": "text", "label": "Texto"}}}, "secondary": {"type": "object", "label": "Secundário", "fields": {"href": {"type": "text", "label": "Link"}, "icon": {"type": "text", "label": "Ícone (iconify)"}, "label": {"type": "text", "label": "Texto"}}}}}}}, "manifesto-mavellium": {"label": "Manifesto", "fields": {"src": {"type": "text", "label": "URL da imagem principal"}, "date": {"type": "text", "label": "Subtítulo / data"}, "about": {"type": "object", "label": "Conteúdo", "fields": {"overview": {"type": "textarea", "label": "Parágrafo 1"}, "conclusion": {"type": "textarea", "label": "Parágrafo 2"}}}, "title": {"type": "text", "label": "Título"}, "background": {"type": "text", "label": "URL da imagem de fundo"}, "scrollToExpand": {"type": "text", "label": "Texto de scroll"}}}, "hero-section-mavellium": {"label": "Hero", "fields": {"slides": {"type": "array", "label": "Slides", "itemFields": {"id": {"type": "text", "label": "ID"}, "headline": {"type": "text", "label": "Headline"}, "mediaUrl": {"type": "text", "label": "URL da mídia (vídeo/imagem)"}, "mediaType": {"type": "text", "label": "Tipo: video | image"}, "description": {"type": "textarea", "label": "Descrição / subheadline"}, "headlineHighlight": {"type": "text", "label": "Destaque da headline"}, "primaryButtonLink": {"type": "text", "label": "Link do botão primário"}, "primaryButtonText": {"type": "text", "label": "Texto do botão primário"}, "secondaryButtonLink": {"type": "text", "label": "Link do botão secundário"}, "secondaryButtonText": {"type": "text", "label": "Texto do botão secundário"}}}}}}, "content": {"faq-mavellium": {"items": [{"image": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=600&auto=format&fit=crop", "answer": "Operamos com total transparência através de 5 fases críticas: Imersão Semântica e Briefing, Análise de Viabilidade Técnica, Estruturação de Dados, Engenharia de Código e Auditoria de Indexação para IA.", "category": "Metodologia", "question": "Como funciona o desenvolvimento técnico do meu projeto?"}, {"image": "https://images.unsplash.com/photo-1551288049-bbbda540d3b9?q=80&w=600&auto=format&fit=crop", "answer": "Significa que o código possui mapeamento de dados estruturados avançados (Schema Markup). Isso permite que inteligências como ChatGPT, Gemini e Perplexity leiam, contextualizem e recomendem a sua empresa diretamente nas respostas geradas para os utilizadores.", "category": "Tecnologia", "question": "O que significa ter um site otimizado para Inteligência Artificial?"}, {"image": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=600&auto=format&fit=crop", "answer": "Não. Desenvolvemos infraestruturas personalizadas e limpas do zero. Priorizamos a velocidade de carregamento absoluta e a organização lógica do código para garantir a máxima autoridade algorítmica.", "category": "Customização", "question": "Os sites utilizam templates ou estruturas genéricas?"}, {"image": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&auto=format&fit=crop", "answer": "Oferecemos uma parceria de evolução contínua. Asseguramos manutenções críticas de segurança, otimização de performance e atualização dos esquemas de dados conforme os principais modelos de LLM evoluem.", "category": "Evolução", "question": "Como funciona o suporte técnico após o lançamento?"}]}, "sobre-mavellium": {"services": [{"id": "01", "tag": "Engenharia Web", "image": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1200", "title": "Arquitetura Semântica Avançada", "description": "Sediados no polo tecnológico de Garça-SP, construímos plataformas estritamente alinhadas com os padrões de dados estruturados e prontos para indexação de LLMs."}, {"id": "02", "tag": "Expertise", "image": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200", "title": "Foco Técnico em IA e Dados", "description": "A nossa estrutura elimina intermediários. Cada departamento estratégico é liderado por engenheiros focados em performance algorítmica e inteligência artificial."}, {"id": "03", "tag": "Execução", "image": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200", "title": "Desenvolvimento Nativo e Seguro", "description": "Do planeamento técnico e injeção de JSON-LD ao código final, o seu ecossistema digital é construído por especialistas em RAG e SEO semântico de última geração."}, {"id": "04", "tag": "Resultados", "image": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200", "title": "Sistemas Inteligentes À Medida", "description": "Desenhamos aplicações cirúrgicas adaptadas à realidade do seu negócio, garantindo velocidade extrema e visibilidade total na nova era das pesquisas generativas."}]}, "solucoes-mavellium": {"cards": [{"id": "sites-inteligentes", "image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop", "imageAlt": "Sites Semânticos Prontos para IA", "buttonText": "Construir Autoridade", "frontTitle": "Sites Semânticos", "backDescription": "A sede digital da sua empresa. Um ecossistema veloz e mapeado com JSON-LD para transmitir credibilidade a humanos e ser o principal nó de resposta para assistentes de IA.", "frontDescription": "Estruturas de alta performance preparadas para os novos motores de busca."}, {"id": "landing-pages", "image": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop", "imageAlt": "Landing Pages de Alta Conversão", "buttonText": "Acelerar Vendas", "frontTitle": "Alta Conversão", "backDescription": "Código ultrarrápido e livre de distrações. Maximize o retorno dos seus anúncios pagos com arquiteturas focadas estritamente na experiência do utilizador e conversão imediata.", "frontDescription": "Páginas cirúrgicas desenhadas para transformar tráfego em receita ativa."}, {"id": "automacao-ia", "image": "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop", "imageAlt": "Automação e Agentes Autónomos integrados", "buttonText": "Operar 24/7", "frontTitle": "Agentes & IA", "backDescription": "Agentes autónomos customizados para qualificar leads, integrar bases de conhecimento corporativas e otimizar processos de atendimento com operação ininterrupta 24/7.", "frontDescription": "A revolução da eficiência operacional integrada nos seus sistemas."}], "description": "Aceleramos a transição da sua empresa para a economia da inteligência artificial através de três frentes de engenharia digital."}, "cta-final-mavellium": {"text": {"headline": "Pronto para posicionar a sua empresa", "highlight": "na era da IA?", "description": "Cada operação possui desafios e maturidade técnica específicos. Agende uma reunião estratégica com os nossos engenheiros para desenharmos a infraestrutura ideal para a escala do seu negócio."}, "theme": {"bg_color": "#ffffff", "button_bg": "#09090b", "gradient_end": "#009b4d", "gradient_start": "#00D26A"}, "calls_to_action": {"primary": {"href": "https://wa.me/5514998001008?text=Ol%C3%A1%21+Gostaria+de+agendar+uma+conversa+com+um+especialista+para+estruturar+a+arquitetura+tecnol%C3%B3gica+da+minha+empresa.", "icon": "mdi:whatsapp", "label": "Agendar Reunião Técnica"}, "secondary": {"href": "#solucoes", "icon": "mdi:arrow-up", "label": "Rever Soluções Semânticas"}}}, "manifesto-mavellium": {"src": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop", "date": "Manifesto Mavellium", "about": {"overview": "Acreditamos que a tecnologia não deve ser apenas uma montra estática, mas o maior motor de receita e escala do seu negócio. As pesquisas na internet deixaram de ser apenas uma lista de links azuis; hoje, os utilizadores recebem respostas consolidadas por inteligências artificiais.", "conclusion": "O nosso compromisso é com a engenharia digital cirúrgica. Não entregamos código genérico ou templates obsoletos; construímos as fundações semânticas indispensáveis para que a sua empresa lidere o mercado de amanhã."}, "title": "A Era da Pesquisa Mudou", "background": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop", "scrollToExpand": "Role para descobrir o novo padrão"}, "hero-section-mavellium": {"slides": [{"id": "1", "headline": "A arquitetura digital que as IAs ", "mediaUrl": "", "mediaType": "video", "description": "Desenvolvemos sites semânticos, landing pages de alta conversão e agentes autónomos. Estruturamos a infraestrutura de dados do seu negócio para dominar os motores de busca e os novos modelos de linguagem (LLMs).", "headlineHighlight": "recomendam e os seus clientes compram.", "primaryButtonLink": "https://wa.me/5514998001008?text=Ol%C3%A1%21+Gostaria+de+adequar+a+infraestrutura+do+meu+site+para+motores+de+IA.", "primaryButtonText": "Falar com um Engenheiro", "secondaryButtonLink": "/portfolio", "secondaryButtonText": "Ver Infraestruturas"}]}}}	\N	t	{"name": {"ui:widget": "hidden"}, "slug": {"ui:widget": "hidden"}, "schema": {"ui:widget": "hidden"}, "content.faq-mavellium": {"ui:label": "❓ FAQ"}, "content.sobre-mavellium": {"ui:label": "🏢 Quem Somos"}, "content.solucoes-mavellium": {"ui:label": "🧠 Soluções"}, "content.cta-final-mavellium": {"ui:label": "🚀 CTA Final"}, "content.faq-mavellium.items": {"ui:label": "Perguntas Frequentes"}, "content.manifesto-mavellium": {"ui:label": "📜 Manifesto"}, "content.hero-section-mavellium": {"ui:label": "🎬 Hero"}, "content.manifesto-mavellium.src": {"ui:color": "#3b82f6", "ui:label": "Imagem Principal", "ui:widget": "image"}, "content.cta-final-mavellium.text": {"ui:label": "Textos"}, "content.manifesto-mavellium.date": {"ui:color": "#f59e0b", "ui:label": "Subtítulo", "ui:widget": "text"}, "content.sobre-mavellium.services": {"ui:label": "Serviços"}, "content.solucoes-mavellium.cards": {"ui:label": "Cards de Soluções"}, "content.cta-final-mavellium.theme": {"ui:label": "Tema Visual"}, "content.manifesto-mavellium.about": {"ui:label": "Conteúdo"}, "content.manifesto-mavellium.title": {"ui:color": "#8b5cf6", "ui:label": "Título", "ui:widget": "text"}, "content.faq-mavellium.items..image": {"ui:color": "#3b82f6", "ui:label": "Imagem", "ui:widget": "image"}, "content.faq-mavellium.items..answer": {"ui:size": "lg", "ui:color": "#10b981", "ui:label": "Resposta", "ui:widget": "textarea"}, "content.sobre-mavellium.services..id": {"ui:widget": "hidden"}, "content.solucoes-mavellium.cards..id": {"ui:widget": "hidden"}, "content.faq-mavellium.items..category": {"ui:color": "#f59e0b", "ui:label": "Categoria", "ui:widget": "text"}, "content.faq-mavellium.items..question": {"ui:size": "md", "ui:color": "#8b5cf6", "ui:label": "Pergunta", "ui:widget": "textarea"}, "content.hero-section-mavellium.slides": {"ui:label": "Slides"}, "content.sobre-mavellium.services..tag": {"ui:color": "#f59e0b", "ui:label": "Tag", "ui:widget": "text"}, "content.manifesto-mavellium.background": {"ui:color": "#3b82f6", "ui:label": "Imagem de Fundo", "ui:widget": "image"}, "content.solucoes-mavellium.description": {"ui:size": "md", "ui:color": "#10b981", "ui:label": "Descrição da Seção", "ui:widget": "textarea"}, "content.sobre-mavellium.services..image": {"ui:color": "#3b82f6", "ui:label": "Imagem", "ui:widget": "image"}, "content.sobre-mavellium.services..title": {"ui:color": "#8b5cf6", "ui:label": "Título", "ui:widget": "text"}, "content.solucoes-mavellium.cards..image": {"ui:color": "#3b82f6", "ui:label": "Imagem", "ui:widget": "image"}, "content.cta-final-mavellium.text.headline": {"ui:color": "#8b5cf6", "ui:label": "Headline", "ui:widget": "text"}, "content.hero-section-mavellium.slides..id": {"ui:widget": "hidden"}, "content.cta-final-mavellium.text.highlight": {"ui:color": "#22c55e", "ui:label": "Texto em Destaque", "ui:widget": "text"}, "content.cta-final-mavellium.theme.bg_color": {"ui:color": "#ffffff", "ui:label": "Cor de Fundo", "ui:widget": "color"}, "content.manifesto-mavellium.about.overview": {"ui:size": "xl", "ui:color": "#10b981", "ui:label": "Parágrafo Inicial", "ui:widget": "textarea"}, "content.manifesto-mavellium.scrollToExpand": {"ui:color": "#f59e0b", "ui:label": "Texto de Scroll", "ui:widget": "text"}, "content.solucoes-mavellium.cards..imageAlt": {"ui:color": "#3b82f6", "ui:label": "Texto Alternativo", "ui:widget": "text"}, "content.cta-final-mavellium.calls_to_action": {"ui:label": "Botões CTA"}, "content.cta-final-mavellium.theme.button_bg": {"ui:color": "#09090b", "ui:label": "Cor do Botão", "ui:widget": "color"}, "content.cta-final-mavellium.text.description": {"ui:size": "lg", "ui:color": "#10b981", "ui:label": "Descrição", "ui:widget": "textarea"}, "content.manifesto-mavellium.about.conclusion": {"ui:size": "xl", "ui:color": "#10b981", "ui:label": "Parágrafo Final", "ui:widget": "textarea"}, "content.solucoes-mavellium.cards..buttonText": {"ui:color": "#f59e0b", "ui:label": "Texto do Botão", "ui:widget": "text"}, "content.solucoes-mavellium.cards..frontTitle": {"ui:color": "#8b5cf6", "ui:label": "Título Principal", "ui:widget": "text"}, "content.sobre-mavellium.services..description": {"ui:size": "lg", "ui:color": "#10b981", "ui:label": "Descrição", "ui:widget": "textarea"}, "content.cta-final-mavellium.theme.gradient_end": {"ui:color": "#009b4d", "ui:label": "Gradiente Final", "ui:widget": "color"}, "content.hero-section-mavellium.slides..headline": {"ui:color": "#8b5cf6", "ui:label": "Headline", "ui:widget": "text"}, "content.hero-section-mavellium.slides..mediaUrl": {"ui:color": "#3b82f6", "ui:label": "Mídia", "ui:widget": "video"}, "content.cta-final-mavellium.theme.gradient_start": {"ui:color": "#00D26A", "ui:label": "Gradiente Inicial", "ui:widget": "color"}, "content.hero-section-mavellium.slides..mediaType": {"ui:widget": "hidden"}, "content.solucoes-mavellium.cards..backDescription": {"ui:size": "lg", "ui:color": "#10b981", "ui:label": "Descrição do Verso", "ui:widget": "textarea"}, "content.hero-section-mavellium.slides..description": {"ui:size": "xl", "ui:color": "#10b981", "ui:label": "Descrição", "ui:widget": "textarea"}, "content.solucoes-mavellium.cards..frontDescription": {"ui:size": "md", "ui:color": "#10b981", "ui:label": "Descrição da Frente", "ui:widget": "textarea"}, "content.cta-final-mavellium.calls_to_action.primary": {"ui:label": "CTA Primário"}, "content.cta-final-mavellium.calls_to_action.secondary": {"ui:label": "CTA Secundário"}, "content.cta-final-mavellium.calls_to_action.primary.href": {"ui:color": "#3b82f6", "ui:label": "Link", "ui:widget": "url"}, "content.cta-final-mavellium.calls_to_action.primary.icon": {"ui:color": "#f59e0b", "ui:label": "Ícone", "ui:widget": "icon"}, "content.hero-section-mavellium.slides..headlineHighlight": {"ui:color": "#22c55e", "ui:label": "Texto em Destaque", "ui:widget": "text"}, "content.hero-section-mavellium.slides..primaryButtonLink": {"ui:color": "#3b82f6", "ui:label": "Link do Botão Primário", "ui:widget": "url"}, "content.hero-section-mavellium.slides..primaryButtonText": {"ui:color": "#f59e0b", "ui:label": "Texto do Botão Primário", "ui:widget": "text"}, "content.cta-final-mavellium.calls_to_action.primary.label": {"ui:color": "#8b5cf6", "ui:label": "Texto do Botão", "ui:widget": "text"}, "content.cta-final-mavellium.calls_to_action.secondary.href": {"ui:color": "#3b82f6", "ui:label": "Link", "ui:widget": "url"}, "content.cta-final-mavellium.calls_to_action.secondary.icon": {"ui:color": "#f59e0b", "ui:label": "Ícone", "ui:widget": "icon"}, "content.hero-section-mavellium.slides..secondaryButtonLink": {"ui:color": "#3b82f6", "ui:label": "Link do Botão Secundário", "ui:widget": "url"}, "content.hero-section-mavellium.slides..secondaryButtonText": {"ui:color": "#f59e0b", "ui:label": "Texto do Botão Secundário", "ui:widget": "text"}, "content.cta-final-mavellium.calls_to_action.secondary.label": {"ui:color": "#8b5cf6", "ui:label": "Texto do Botão", "ui:widget": "text"}}
da26cded-9747-4bf0-b4da-9ab9af9e2e1c	20a8ef8a-1674-4bd5-8020-fa1a90c10d6e	teste	teste	{}	2026-05-23 15:59:35.909	2026-05-23 16:00:06.095	\N	f	{}	{"hero": {"descricao": "Desenvolvemos sites semânticos, landing pages de alta conversão e agentes autónomos. Estruturamos a infraestrutura de dados do seu negócio para dominar os motores de busca e os novos modelos de linguagem (LLMs).", "titulo_destaque": "recomendam e os seus clientes compram.", "cta_primario_url": "https://wa.me/5514998001008?text=Ol%C3%A1%21+Gostaria+de+adequar+a+infraestrutura+do+meu+site+para+motores+de+IA.", "titulo_principal": "A arquitetura digital que as IAs", "cta_primario_texto": "Falar com um Engenheiro", "cta_secundario_url": "/portfolio", "cta_secundario_texto": "Ver Infraestruturas"}}	\N	t	{"hero": {"ui:label": "Hero Section", "descricao": {"ui:label": "Descrição", "ui:widget": "textarea"}, "titulo_destaque": {"ui:label": "Título Destaque (verde)", "ui:widget": "text"}, "cta_primario_url": {"ui:label": "Botão Primário — URL", "ui:widget": "text"}, "titulo_principal": {"ui:label": "Título Principal", "ui:widget": "text"}, "cta_primario_texto": {"ui:label": "Botão Primário — Texto", "ui:widget": "text"}, "cta_secundario_url": {"ui:label": "Botão Secundário — URL", "ui:widget": "text"}, "cta_secundario_texto": {"ui:label": "Botão Secundário — Texto", "ui:widget": "text"}}}
\.


--
-- Data for Name: project_histories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.project_histories (id, "projectId", "userId", "previousState", "newState", version, created_at) FROM stdin;
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.projects (id, "companyId", name, type, created_at, updated_at, deleted_at, deleted_by, deletion_reason, is_active, preview_url, blog_enabled, cms_sync_script_url, cms_enabled) FROM stdin;
4557b656-217e-4f3f-9a50-8876193c4399	bedaf6ce-590f-4171-9b1c-3d61894a9218	Test Project	LANDING_PAGE	2026-05-09 23:33:42.666	2026-05-09 23:33:42.666	\N	\N	\N	t	\N	f	\N	f
20a8ef8a-1674-4bd5-8020-fa1a90c10d6e	14d989da-3a81-435c-ac4a-0e5afcf3efa3	eee	INSTITUTIONAL	2026-05-17 17:30:52.261	2026-05-23 19:54:20.116	\N	\N	\N	t	https://www.mavellium.com.br/	t	https://mavellium-janus.b-cdn.net/scripts/20a8ef8a-1674-4bd5-8020-fa1a90c10d6e-1779565948472.js	t
d28080af-727e-43f5-9053-cc28603f61d8	bedaf6ce-590f-4171-9b1c-3d61894a9218	Test Project 23334676	LANDING_PAGE	2026-05-09 23:36:16.922	2026-05-10 03:59:43.945	\N	\N	\N	t	\N	f	\N	f
b61d688d-8251-4b8a-9325-21004b1c6f30	bedaf6ce-590f-4171-9b1c-3d61894a9218	eeeeee2123	INSTITUTIONAL	2026-05-10 03:23:00.686	2026-05-11 00:08:06.177	2026-05-11 00:08:06.171	eeeee	eeeee	f	\N	f	\N	f
fea47d61-f0d1-4b04-ba10-f872f87bc422	bedaf6ce-590f-4171-9b1c-3d61894a9218	teste213	INSTITUTIONAL	2026-05-10 03:21:21.168	2026-05-11 00:08:14.544	2026-05-11 00:08:14.543	teste	eeee	f	\N	f	\N	f
a5777a12-7b69-4dfd-880c-7af9949ee87f	bedaf6ce-590f-4171-9b1c-3d61894a9218	Mavellium - test	INSTITUTIONAL	2026-05-12 02:05:14.04	2026-05-12 02:05:31.903	\N	\N	\N	t	https://www.mavellium.com.br	f	\N	f
1e8460a4-8035-404d-8758-494b6a51f00f	6109563c-5f2d-4576-96c8-342f02b87f05	eeeeee	INSTITUTIONAL	2026-05-16 15:37:21.384	2026-05-16 15:43:46.298	\N	\N	\N	t	https://tegbe.com.br/	f	\N	f
36b29239-2063-419b-840c-c34a5fbd454e	6109563c-5f2d-4576-96c8-342f02b87f05	eee	INSTITUTIONAL	2026-05-16 22:40:23.716	2026-05-16 22:40:23.716	\N	\N	\N	t	\N	f	\N	f
3f467c11-5252-4007-8ead-6abfc66eed9e	6109563c-5f2d-4576-96c8-342f02b87f05	eeeee	LANDING_PAGE	2026-05-17 05:10:15.017	2026-05-17 05:10:15.017	\N	\N	\N	t	\N	f	\N	f
9fac4645-77ed-4747-bd34-8230adeca5ac	6109563c-5f2d-4576-96c8-342f02b87f05	teste1eeeeeeee	INSTITUTIONAL	2026-05-17 03:53:08.398	2026-05-17 05:34:57.153	\N	\N	\N	t	\N	t	\N	f
958b393d-9cc6-45b6-b42b-b93f08ba414d	d34e02ac-b8fd-4d86-9ba3-aa56a33c4e31	EEEE	LANDING_PAGE	2026-05-17 06:21:08.36	2026-05-17 06:21:08.36	\N	\N	\N	t	\N	f	\N	f
9adaf413-3d91-4a77-b36a-6ab739a6792f	bedaf6ce-590f-4171-9b1c-3d61894a9218	Test Project	LANDING_PAGE	2026-05-19 12:51:11.737	2026-05-19 12:51:11.737	\N	\N	\N	t	\N	f	\N	f
abc54359-95c3-4066-a8fa-05e998c8fc7f	4225cb65-ab52-4c18-87e0-d649ce401942	eeee	INSTITUTIONAL	2026-05-17 06:05:15.495	2026-05-20 00:39:07.051	\N	\N	\N	t	\N	t	\N	f
\.


--
-- Data for Name: site_scripts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.site_scripts (id, name, code, "position", is_active, project_id, created_at, updated_at) FROM stdin;
2983cca9-3c0b-4a0e-8d2f-ce3c3e43a949	teste	<script src="https://mavellium-janus.b-cdn.net/scripts/20a8ef8a-1674-4bd5-8020-fa1a90c10d6e-sync.js?v=1779561664495" defer></script>	HEAD	t	20a8ef8a-1674-4bd5-8020-fa1a90c10d6e	2026-05-23 18:47:46.591	2026-05-23 18:47:46.591
\.


--
-- Data for Name: user_companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_companies (id, user_id, company_id, permissions, created_at) FROM stdin;
24a2bf8e-e9b9-458a-96fd-86f7600cb8fa	5ec3cc01-8cf2-4b9e-87df-9c85dcc0b1fa	00000000-0000-0000-0000-000000000001	{sites:project:PROJECT_CREATE,sites:project:PROJECT_EDIT,sites:project:PROJECT_DELETE,sites:page:PAGE_CREATE,sites:page:PAGE_DELETE,sites:page:PAGE_BUILD,sites:page:BLOG_MANAGE,sites:page:GUEST_MANAGE,sites:page:TEAM_MANAGE,landingPages:project:PROJECT_CREATE,landingPages:page:PAGE_CREATE,landingPages:page:PAGE_DELETE,landingPages:page:PAGE_BUILD,landingPages:page:BLOG_MANAGE,landingPages:page:GUEST_MANAGE,landingPages:page:TEAM_MANAGE}	2026-05-12 19:27:41.512
8f871b1c-3f7a-4b36-9d96-1e6410a8bdf9	b8128e79-9502-4c97-abfe-06cb02c8cfc6	00000000-0000-0000-0000-000000000001	{sites:project:PROJECT_CREATE,sites:project:PROJECT_EDIT,sites:project:PROJECT_DELETE,sites:project:BLOG_MANAGE,sites:page:PAGE_CREATE,sites:page:PAGE_DELETE,sites:page:BLOG_MANAGE,sites:page:GUEST_MANAGE,sites:page:TEAM_MANAGE,sites:page:PAGE_BUILD,landingPages:project:PROJECT_CREATE,landingPages:project:PROJECT_EDIT,landingPages:project:PROJECT_DELETE,landingPages:project:BLOG_MANAGE,landingPages:page:PAGE_CREATE,landingPages:page:PAGE_DELETE,landingPages:page:PAGE_BUILD,landingPages:page:BLOG_MANAGE,landingPages:page:GUEST_MANAGE,landingPages:page:TEAM_MANAGE}	2026-05-13 03:01:01.856
a718c071-cff0-430f-a535-21228bb7e3e9	9e1e8fe3-d968-42be-b984-c1829a6c82da	00000000-0000-0000-0000-000000000001	{PAGE_CREATE,PAGE_DELETE,PAGE_BUILD,BLOG_MANAGE,GUEST_MANAGE,TEAM_MANAGE}	2026-05-13 00:50:34.266
fca12220-a14b-4e1e-a4fa-39ad0f524041	1dec826c-f7ef-4c39-9fc5-0b484351afe9	6109563c-5f2d-4576-96c8-342f02b87f05	{sites:page:PAGE_BUILD,landingPages:project:PROJECT_CREATE,landingPages:project:PROJECT_EDIT,landingPages:project:BLOG_MANAGE,landingPages:page:PAGE_BUILD}	2026-05-17 03:11:31.237
496a2b58-b3b2-4f78-8364-751dd621f446	7e7ddab8-1a99-41f9-9086-4763d119c6d8	bedaf6ce-590f-4171-9b1c-3d61894a9218	{}	2026-05-19 12:51:11.73
f8d4e37b-b881-424e-ae60-4b08e277c8c9	7e7ddab8-1a99-41f9-9086-4763d119c6d8	d34e02ac-b8fd-4d86-9ba3-aa56a33c4e31	{}	2026-05-24 04:29:12.673
bcadd453-4330-4e7a-96f6-63b8ebfc7acf	7e7ddab8-1a99-41f9-9086-4763d119c6d8	6109563c-5f2d-4576-96c8-342f02b87f05	{}	2026-05-24 04:29:13.036
3f55ed34-dfa8-4998-b55d-d1d63219a270	1dec826c-f7ef-4c39-9fc5-0b484351afe9	d34e02ac-b8fd-4d86-9ba3-aa56a33c4e31	{}	2026-05-24 04:29:21.571
ad00c01a-10e6-4279-ad48-feed851a9291	1dec826c-f7ef-4c39-9fc5-0b484351afe9	4225cb65-ab52-4c18-87e0-d649ce401942	{}	2026-05-24 04:29:22.498
2d2a732d-1bad-41d7-8982-e39b990d939c	1dec826c-f7ef-4c39-9fc5-0b484351afe9	bedaf6ce-590f-4171-9b1c-3d61894a9218	{}	2026-05-24 04:29:23.419
e2f98cc7-2fb5-4fdc-8ee2-9320a3d644be	1dec826c-f7ef-4c39-9fc5-0b484351afe9	00000000-0000-0000-0000-000000000001	{}	2026-05-24 04:29:23.763
7b2baa30-5f55-430a-9416-0dc1c46904b5	7e7ddab8-1a99-41f9-9086-4763d119c6d8	14d989da-3a81-435c-ac4a-0e5afcf3efa3	{}	2026-05-24 04:33:10.118
3785bb34-c0dd-4676-be16-f4599ff9f74f	1dec826c-f7ef-4c39-9fc5-0b484351afe9	14d989da-3a81-435c-ac4a-0e5afcf3efa3	{}	2026-05-24 04:42:03.125
42d025bc-c1e0-435b-8507-c3c1e0ddb2a7	dd134ff7-a275-48e1-a18e-c9f3de72dce3	4225cb65-ab52-4c18-87e0-d649ce401942	{}	2026-05-24 05:31:33.483
0885a385-f793-4d25-8dbd-339feeb182ea	dd134ff7-a275-48e1-a18e-c9f3de72dce3	14d989da-3a81-435c-ac4a-0e5afcf3efa3	{}	2026-05-24 05:31:33.483
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password, role, user_image, preferences, created_at, updated_at, deleted_at, "companyId", name, phone, requires_password_reset, created_by_id, permissions) FROM stdin;
5ec3cc01-8cf2-4b9e-87df-9c85dcc0b1fa	teste4@gmail.com	$2b$10$QarZNZcwUqH6u86e2ZjSfe1m3HN8PCCl3GhJguQ2yQCRdiCYEhbAq	DEVELOPER	\N	{}	2026-05-12 19:27:41.512	2026-05-17 06:21:01.899	\N	00000000-0000-0000-0000-000000000001	teste4@gmail.com	\N	f	\N	{sites:project:PROJECT_CREATE,sites:project:PROJECT_EDIT,sites:project:PROJECT_DELETE,sites:page:PAGE_CREATE,sites:page:PAGE_DELETE,sites:page:PAGE_BUILD,sites:page:BLOG_MANAGE,sites:page:GUEST_MANAGE,sites:page:TEAM_MANAGE,landingPages:project:PROJECT_CREATE,landingPages:page:PAGE_CREATE,landingPages:page:PAGE_DELETE,landingPages:page:PAGE_BUILD,landingPages:page:BLOG_MANAGE,landingPages:page:GUEST_MANAGE,landingPages:page:TEAM_MANAGE}
7e174734-46ce-4fbd-8570-92140a282205	eee@gmail.com	$2b$10$g4uEEXOswJkZnkAzOevTNubFNw5A.PbretH6n.5LIMGBp4azh6Xwu	DEFAULT	https://mavellium-janus.b-cdn.net/avatars/uid-1779595599362.avif	{}	2026-05-17 05:57:30.108	2026-05-24 04:40:44.549	\N	\N	eeeee	\N	t	b8128e79-9502-4c97-abfe-06cb02c8cfc6	{}
b8128e79-9502-4c97-abfe-06cb02c8cfc6	teste7@gmail.com	$2b$10$hnNDdDTtwITmkVKMMSlzK.9dpgKliNmQYxbc9RodIe83u0XIoyw4K	DEVELOPER	\N	{}	2026-05-13 03:01:01.856	2026-05-17 17:14:33.946	\N	00000000-0000-0000-0000-000000000001	teste	\N	f	15ed1ffd-853f-4bc1-b05f-f50e154a151d	{sites:project:PROJECT_CREATE,sites:project:PROJECT_EDIT,sites:project:PROJECT_DELETE,sites:project:BLOG_MANAGE,sites:page:PAGE_CREATE,sites:page:PAGE_DELETE,sites:page:BLOG_MANAGE,sites:page:GUEST_MANAGE,sites:page:TEAM_MANAGE,sites:page:PAGE_BUILD,landingPages:project:PROJECT_CREATE,landingPages:project:PROJECT_EDIT,landingPages:project:PROJECT_DELETE,landingPages:project:BLOG_MANAGE,landingPages:page:PAGE_CREATE,landingPages:page:PAGE_DELETE,landingPages:page:PAGE_BUILD,landingPages:page:BLOG_MANAGE,landingPages:page:GUEST_MANAGE,landingPages:page:TEAM_MANAGE}
7e7ddab8-1a99-41f9-9086-4763d119c6d8	teste2@gmail.com	$2b$10$pt5tm4/qt0PbZNZdY3S/6ucRrvEVhJvgLXYhLBq9bdZkYohyRzhlu	ADMIN	\N	{"darkMode": true, "sidebar_collapsed": false}	2026-05-19 12:51:11.73	2026-05-24 05:07:54.865	\N	bedaf6ce-590f-4171-9b1c-3d61894a9218	\N	\N	f	\N	{}
9e1e8fe3-d968-42be-b984-c1829a6c82da	teste5@gmail.com	$2b$10$OqLRMvF9mTq5pQQDEplbj.m44fdvisft6c3TQE2kXbXlGdkOYrcmS	DEVELOPER	\N	{}	2026-05-13 00:50:34.266	2026-05-16 21:41:54.856	\N	00000000-0000-0000-0000-000000000001	teste5@gmail.com	\N	t	15ed1ffd-853f-4bc1-b05f-f50e154a151d	{PAGE_CREATE,PAGE_DELETE,PAGE_BUILD,BLOG_MANAGE,GUEST_MANAGE,TEAM_MANAGE}
0cfc6ee6-a272-4311-a65f-6a253a2a2436	e3@gmail.com	$2b$10$Ui2eDlKrzoeZhMs0RewUb.2ZW3ibgotP2TIse/p5qVzZl1eRI9QAa	ADMIN	\N	{}	2026-05-24 05:29:23.717	2026-05-24 05:29:35.256	\N	\N	e3@gmail.com	\N	f	7e7ddab8-1a99-41f9-9086-4763d119c6d8	{PROJECT_CREATE,PROJECT_EDIT,PROJECT_DELETE,PAGE_CREATE,PAGE_DELETE,PAGE_BUILD,BLOG_MANAGE,GUEST_MANAGE,TEAM_MANAGE}
dd134ff7-a275-48e1-a18e-c9f3de72dce3	e2@gmail.com	$2b$10$RSNZ5rAbRrUI8MNmEKwP2.XDsEaW9jmIlGDZMEWC9sfaZjIWZXHzG	DEFAULT	\N	{}	2026-05-24 05:23:10.488	2026-05-24 05:31:33.47	\N	4225cb65-ab52-4c18-87e0-d649ce401942	teste	\N	f	7e7ddab8-1a99-41f9-9086-4763d119c6d8	{}
1dec826c-f7ef-4c39-9fc5-0b484351afe9	teste11@gmail.com	$2b$10$18ANB/OqMX5seLY9VDUx7OxCtE1bbyfolVRbo/lZNjhmG9bxWzw7W	DEFAULT	\N	{}	2026-05-17 03:11:31.237	2026-05-17 05:12:49.833	\N	6109563c-5f2d-4576-96c8-342f02b87f05	eee	\N	f	5ec3cc01-8cf2-4b9e-87df-9c85dcc0b1fa	{sites:page:PAGE_BUILD,landingPages:project:PROJECT_CREATE,landingPages:project:PROJECT_EDIT,landingPages:project:BLOG_MANAGE,landingPages:page:PAGE_BUILD}
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: blog_categories blog_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_categories
    ADD CONSTRAINT blog_categories_pkey PRIMARY KEY (id);


--
-- Name: blog_post_categories blog_post_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_post_categories
    ADD CONSTRAINT blog_post_categories_pkey PRIMARY KEY (post_id, category_id);


--
-- Name: blog_post_tags blog_post_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_post_tags
    ADD CONSTRAINT blog_post_tags_pkey PRIMARY KEY (post_id, tag_id);


--
-- Name: blog_posts blog_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);


--
-- Name: blog_tags blog_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_tags
    ADD CONSTRAINT blog_tags_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: guest_entries guest_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guest_entries
    ADD CONSTRAINT guest_entries_pkey PRIMARY KEY (id);


--
-- Name: guest_posts guest_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guest_posts
    ADD CONSTRAINT guest_posts_pkey PRIMARY KEY (id);


--
-- Name: login_attempts login_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_attempts
    ADD CONSTRAINT login_attempts_pkey PRIMARY KEY (id);


--
-- Name: pages pages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pages
    ADD CONSTRAINT pages_pkey PRIMARY KEY (id);


--
-- Name: project_histories project_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_histories
    ADD CONSTRAINT project_histories_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: site_scripts site_scripts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_scripts
    ADD CONSTRAINT site_scripts_pkey PRIMARY KEY (id);


--
-- Name: user_companies user_companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_companies
    ADD CONSTRAINT user_companies_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: blog_categories_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX blog_categories_parent_id_idx ON public.blog_categories USING btree (parent_id);


--
-- Name: blog_categories_project_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX blog_categories_project_id_idx ON public.blog_categories USING btree (project_id);


--
-- Name: blog_categories_project_id_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX blog_categories_project_id_slug_key ON public.blog_categories USING btree (project_id, slug);


--
-- Name: blog_posts_author_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX blog_posts_author_id_idx ON public.blog_posts USING btree (author_id);


--
-- Name: blog_posts_project_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX blog_posts_project_id_idx ON public.blog_posts USING btree (project_id);


--
-- Name: blog_posts_project_id_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX blog_posts_project_id_slug_key ON public.blog_posts USING btree (project_id, slug);


--
-- Name: blog_posts_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX blog_posts_status_idx ON public.blog_posts USING btree (status);


--
-- Name: blog_tags_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX blog_tags_parent_id_idx ON public.blog_tags USING btree (parent_id);


--
-- Name: blog_tags_project_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX blog_tags_project_id_idx ON public.blog_tags USING btree (project_id);


--
-- Name: blog_tags_project_id_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX blog_tags_project_id_slug_key ON public.blog_tags USING btree (project_id, slug);


--
-- Name: companies_created_by_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX companies_created_by_id_idx ON public.companies USING btree (created_by_id);


--
-- Name: companies_deleted_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX companies_deleted_at_idx ON public.companies USING btree (deleted_at);


--
-- Name: companies_slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX companies_slug_idx ON public.companies USING btree (slug);


--
-- Name: companies_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX companies_slug_key ON public.companies USING btree (slug);


--
-- Name: guest_entries_companyId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "guest_entries_companyId_idx" ON public.guest_entries USING btree ("companyId");


--
-- Name: guest_entries_email_companyId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "guest_entries_email_companyId_key" ON public.guest_entries USING btree (email, "companyId");


--
-- Name: guest_posts_guestId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "guest_posts_guestId_idx" ON public.guest_posts USING btree ("guestId");


--
-- Name: login_attempts_ip_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX login_attempts_ip_idx ON public.login_attempts USING btree (ip);


--
-- Name: pages_deleted_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pages_deleted_at_idx ON public.pages USING btree (deleted_at);


--
-- Name: pages_projectId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "pages_projectId_idx" ON public.pages USING btree ("projectId");


--
-- Name: pages_projectId_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "pages_projectId_slug_key" ON public.pages USING btree ("projectId", slug);


--
-- Name: project_histories_projectId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "project_histories_projectId_idx" ON public.project_histories USING btree ("projectId");


--
-- Name: project_histories_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "project_histories_userId_idx" ON public.project_histories USING btree ("userId");


--
-- Name: projects_companyId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "projects_companyId_idx" ON public.projects USING btree ("companyId");


--
-- Name: projects_deleted_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX projects_deleted_at_idx ON public.projects USING btree (deleted_at);


--
-- Name: projects_is_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX projects_is_active_idx ON public.projects USING btree (is_active);


--
-- Name: site_scripts_is_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX site_scripts_is_active_idx ON public.site_scripts USING btree (is_active);


--
-- Name: site_scripts_project_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX site_scripts_project_id_idx ON public.site_scripts USING btree (project_id);


--
-- Name: user_companies_company_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_companies_company_id_idx ON public.user_companies USING btree (company_id);


--
-- Name: user_companies_user_id_company_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX user_companies_user_id_company_id_key ON public.user_companies USING btree (user_id, company_id);


--
-- Name: user_companies_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_companies_user_id_idx ON public.user_companies USING btree (user_id);


--
-- Name: users_companyId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "users_companyId_idx" ON public.users USING btree ("companyId");


--
-- Name: users_created_by_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_created_by_id_idx ON public.users USING btree (created_by_id);


--
-- Name: users_deleted_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_deleted_at_idx ON public.users USING btree (deleted_at);


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: blog_categories blog_categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_categories
    ADD CONSTRAINT blog_categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.blog_categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: blog_categories blog_categories_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_categories
    ADD CONSTRAINT blog_categories_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: blog_post_categories blog_post_categories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_post_categories
    ADD CONSTRAINT blog_post_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.blog_categories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: blog_post_categories blog_post_categories_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_post_categories
    ADD CONSTRAINT blog_post_categories_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.blog_posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: blog_post_tags blog_post_tags_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_post_tags
    ADD CONSTRAINT blog_post_tags_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.blog_posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: blog_post_tags blog_post_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_post_tags
    ADD CONSTRAINT blog_post_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.blog_tags(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: blog_posts blog_posts_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: blog_posts blog_posts_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: blog_tags blog_tags_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_tags
    ADD CONSTRAINT blog_tags_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.blog_tags(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: blog_tags blog_tags_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_tags
    ADD CONSTRAINT blog_tags_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: guest_entries guest_entries_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guest_entries
    ADD CONSTRAINT "guest_entries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: guest_posts guest_posts_guestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guest_posts
    ADD CONSTRAINT "guest_posts_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES public.guest_entries(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pages pages_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pages
    ADD CONSTRAINT "pages_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_histories project_histories_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_histories
    ADD CONSTRAINT "project_histories_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_histories project_histories_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_histories
    ADD CONSTRAINT "project_histories_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: projects projects_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT "projects_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: site_scripts site_scripts_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_scripts
    ADD CONSTRAINT site_scripts_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_companies user_companies_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_companies
    ADD CONSTRAINT user_companies_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_companies user_companies_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_companies
    ADD CONSTRAINT user_companies_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict RjKLH6KB6A7IhcZv8mpTDVJ7JHXE4HhOqIzPvblvR4SEIjoKofEudZWWaVLcWic

