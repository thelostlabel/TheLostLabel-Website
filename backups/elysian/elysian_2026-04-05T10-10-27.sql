--
-- PostgreSQL database dump
--

\restrict cFk199t9bC6bdPYtpZ96vbamYepwKCUiPJ4mu8Xzf5iGPfdB4suRTpOorPyfUub

-- Dumped from database version 18.3 (Debian 18.3-1.pgdg13+1)
-- Dumped by pg_dump version 18.3

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

ALTER TABLE IF EXISTS ONLY public."RoyaltySplit" DROP CONSTRAINT IF EXISTS "RoyaltySplit_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."RoyaltySplit" DROP CONSTRAINT IF EXISTS "RoyaltySplit_contractId_fkey";
ALTER TABLE IF EXISTS ONLY public."RoyaltySplit" DROP CONSTRAINT IF EXISTS "RoyaltySplit_artistId_fkey";
ALTER TABLE IF EXISTS ONLY public."PayoutRequest" DROP CONSTRAINT IF EXISTS "PayoutRequest_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Payment" DROP CONSTRAINT IF EXISTS "Payment_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Earning" DROP CONSTRAINT IF EXISTS "Earning_contractId_fkey";
ALTER TABLE IF EXISTS ONLY public."Demo" DROP CONSTRAINT IF EXISTS "Demo_artistId_fkey";
ALTER TABLE IF EXISTS ONLY public."DemoFile" DROP CONSTRAINT IF EXISTS "DemoFile_demoId_fkey";
ALTER TABLE IF EXISTS ONLY public."Contract" DROP CONSTRAINT IF EXISTS "Contract_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Contract" DROP CONSTRAINT IF EXISTS "Contract_releaseId_fkey";
ALTER TABLE IF EXISTS ONLY public."Contract" DROP CONSTRAINT IF EXISTS "Contract_demoId_fkey";
ALTER TABLE IF EXISTS ONLY public."Contract" DROP CONSTRAINT IF EXISTS "Contract_artistId_fkey";
ALTER TABLE IF EXISTS ONLY public."ChangeRequest" DROP CONSTRAINT IF EXISTS "ChangeRequest_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."ChangeRequest" DROP CONSTRAINT IF EXISTS "ChangeRequest_releaseId_fkey";
ALTER TABLE IF EXISTS ONLY public."ChangeRequest" DROP CONSTRAINT IF EXISTS "ChangeRequest_assignedToId_fkey";
ALTER TABLE IF EXISTS ONLY public."ChangeRequestComment" DROP CONSTRAINT IF EXISTS "ChangeRequestComment_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."ChangeRequestComment" DROP CONSTRAINT IF EXISTS "ChangeRequestComment_requestId_fkey";
ALTER TABLE IF EXISTS ONLY public."BalanceAdjustment" DROP CONSTRAINT IF EXISTS "BalanceAdjustment_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."BalanceAdjustment" DROP CONSTRAINT IF EXISTS "BalanceAdjustment_createdById_fkey";
ALTER TABLE IF EXISTS ONLY public."BalanceAdjustment" DROP CONSTRAINT IF EXISTS "BalanceAdjustment_artistId_fkey";
ALTER TABLE IF EXISTS ONLY public."Artist" DROP CONSTRAINT IF EXISTS "Artist_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."ArtistStatsHistory" DROP CONSTRAINT IF EXISTS "ArtistStatsHistory_artistId_fkey";
DROP INDEX IF EXISTS public.idx_user_discord_id_unique;
DROP INDEX IF EXISTS public.idx_payment_user_id_created_at;
DROP INDEX IF EXISTS public.idx_payment_status_created_at;
DROP INDEX IF EXISTS public.idx_earning_created_at;
DROP INDEX IF EXISTS public.idx_earning_contract_id_period;
DROP INDEX IF EXISTS public.idx_discord_role_sync_queue_pending;
DROP INDEX IF EXISTS public.idx_discord_oauth_states_expires_at;
DROP INDEX IF EXISTS public.idx_discord_internal_audit_signature;
DROP INDEX IF EXISTS public.idx_discord_internal_audit_request_id;
DROP INDEX IF EXISTS public.idx_discord_internal_audit_created_at;
DROP INDEX IF EXISTS public.idx_discord_event_outbox_pending;
DROP INDEX IF EXISTS public.idx_discord_account_links_discord_user_id;
DROP INDEX IF EXISTS public.idx_demo_status_created_at;
DROP INDEX IF EXISTS public.idx_demo_artist_id_created_at;
DROP INDEX IF EXISTS public.idx_contract_user_id_created_at;
DROP INDEX IF EXISTS public.idx_contract_status_created_at;
DROP INDEX IF EXISTS public.idx_contract_release_id;
DROP INDEX IF EXISTS public.idx_contract_artist_id_created_at;
DROP INDEX IF EXISTS public.idx_change_request_user_id_created_at;
DROP INDEX IF EXISTS public.idx_change_request_status_created_at;
DROP INDEX IF EXISTS public.idx_change_request_assigned_to_created_at;
DROP INDEX IF EXISTS public.idx_balance_adjustment_user_id_created_at;
DROP INDEX IF EXISTS public.idx_balance_adjustment_created_by_created_at;
DROP INDEX IF EXISTS public.idx_balance_adjustment_artist_id_created_at;
DROP INDEX IF EXISTS public."User_email_key";
DROP INDEX IF EXISTS public."SiteContent_key_key";
DROP INDEX IF EXISTS public."Release_baseTitle_idx";
DROP INDEX IF EXISTS public."Contract_demoId_key";
DROP INDEX IF EXISTS public."Artist_userId_key";
DROP INDEX IF EXISTS public."ArtistStatsHistory_artistId_date_idx";
ALTER TABLE IF EXISTS ONLY public.discord_role_sync_queue DROP CONSTRAINT IF EXISTS discord_role_sync_queue_pkey;
ALTER TABLE IF EXISTS ONLY public.discord_oauth_states DROP CONSTRAINT IF EXISTS discord_oauth_states_pkey;
ALTER TABLE IF EXISTS ONLY public.discord_internal_audit DROP CONSTRAINT IF EXISTS discord_internal_audit_pkey;
ALTER TABLE IF EXISTS ONLY public.discord_event_outbox DROP CONSTRAINT IF EXISTS discord_event_outbox_pkey;
ALTER TABLE IF EXISTS ONLY public.discord_account_links DROP CONSTRAINT IF EXISTS discord_account_links_pkey;
ALTER TABLE IF EXISTS ONLY public.discord_account_links DROP CONSTRAINT IF EXISTS discord_account_links_discord_user_id_key;
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public."Webhook" DROP CONSTRAINT IF EXISTS "Webhook_pkey";
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_pkey";
ALTER TABLE IF EXISTS ONLY public."SystemSettings" DROP CONSTRAINT IF EXISTS "SystemSettings_pkey";
ALTER TABLE IF EXISTS ONLY public."SiteContent" DROP CONSTRAINT IF EXISTS "SiteContent_pkey";
ALTER TABLE IF EXISTS ONLY public."RoyaltySplit" DROP CONSTRAINT IF EXISTS "RoyaltySplit_pkey";
ALTER TABLE IF EXISTS ONLY public."Release" DROP CONSTRAINT IF EXISTS "Release_pkey";
ALTER TABLE IF EXISTS ONLY public."PayoutRequest" DROP CONSTRAINT IF EXISTS "PayoutRequest_pkey";
ALTER TABLE IF EXISTS ONLY public."Payment" DROP CONSTRAINT IF EXISTS "Payment_pkey";
ALTER TABLE IF EXISTS ONLY public."Earning" DROP CONSTRAINT IF EXISTS "Earning_pkey";
ALTER TABLE IF EXISTS ONLY public."Demo" DROP CONSTRAINT IF EXISTS "Demo_pkey";
ALTER TABLE IF EXISTS ONLY public."DemoFile" DROP CONSTRAINT IF EXISTS "DemoFile_pkey";
ALTER TABLE IF EXISTS ONLY public."Contract" DROP CONSTRAINT IF EXISTS "Contract_pkey";
ALTER TABLE IF EXISTS ONLY public."ChangeRequest" DROP CONSTRAINT IF EXISTS "ChangeRequest_pkey";
ALTER TABLE IF EXISTS ONLY public."ChangeRequestComment" DROP CONSTRAINT IF EXISTS "ChangeRequestComment_pkey";
ALTER TABLE IF EXISTS ONLY public."BalanceAdjustment" DROP CONSTRAINT IF EXISTS "BalanceAdjustment_pkey";
ALTER TABLE IF EXISTS ONLY public."Artist" DROP CONSTRAINT IF EXISTS "Artist_pkey";
ALTER TABLE IF EXISTS ONLY public."ArtistStatsHistory" DROP CONSTRAINT IF EXISTS "ArtistStatsHistory_pkey";
ALTER TABLE IF EXISTS public.discord_role_sync_queue ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.discord_internal_audit ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.discord_event_outbox ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.discord_role_sync_queue_id_seq;
DROP TABLE IF EXISTS public.discord_role_sync_queue;
DROP TABLE IF EXISTS public.discord_oauth_states;
DROP SEQUENCE IF EXISTS public.discord_internal_audit_id_seq;
DROP TABLE IF EXISTS public.discord_internal_audit;
DROP SEQUENCE IF EXISTS public.discord_event_outbox_id_seq;
DROP TABLE IF EXISTS public.discord_event_outbox;
DROP TABLE IF EXISTS public.discord_account_links;
DROP TABLE IF EXISTS public._prisma_migrations;
DROP TABLE IF EXISTS public."Webhook";
DROP TABLE IF EXISTS public."User";
DROP TABLE IF EXISTS public."SystemSettings";
DROP TABLE IF EXISTS public."SiteContent";
DROP TABLE IF EXISTS public."RoyaltySplit";
DROP TABLE IF EXISTS public."Release";
DROP TABLE IF EXISTS public."PayoutRequest";
DROP TABLE IF EXISTS public."Payment";
DROP TABLE IF EXISTS public."Earning";
DROP TABLE IF EXISTS public."DemoFile";
DROP TABLE IF EXISTS public."Demo";
DROP TABLE IF EXISTS public."Contract";
DROP TABLE IF EXISTS public."ChangeRequestComment";
DROP TABLE IF EXISTS public."ChangeRequest";
DROP TABLE IF EXISTS public."BalanceAdjustment";
DROP TABLE IF EXISTS public."ArtistStatsHistory";
DROP TABLE IF EXISTS public."Artist";
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Artist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Artist" (
    id text NOT NULL,
    name text NOT NULL,
    image text,
    "spotifyUrl" text,
    email text,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "userId" text,
    "monthlyListeners" integer DEFAULT 0,
    followers integer DEFAULT 0,
    genres text,
    "lastSyncedAt" timestamp(3) without time zone,
    popularity integer DEFAULT 0,
    verified boolean DEFAULT false
);


--
-- Name: ArtistStatsHistory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ArtistStatsHistory" (
    id text NOT NULL,
    "artistId" text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "monthlyListeners" integer NOT NULL,
    followers integer,
    popularity integer
);


--
-- Name: BalanceAdjustment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BalanceAdjustment" (
    id text NOT NULL,
    "artistId" text NOT NULL,
    "userId" text,
    amount double precision NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    reason text,
    "createdById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ChangeRequest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ChangeRequest" (
    id text NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    details text,
    "adminNote" text,
    "filesJson" text,
    "releaseId" text,
    "userId" text NOT NULL,
    "assignedToId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ChangeRequestComment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ChangeRequestComment" (
    id text NOT NULL,
    "requestId" text NOT NULL,
    "userId" text NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Contract; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Contract" (
    id text NOT NULL,
    "demoId" text,
    "releaseId" text,
    "userId" text,
    "artistId" text,
    "artistShare" double precision DEFAULT 0.70 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "labelShare" double precision DEFAULT 0.30 NOT NULL,
    notes text,
    "pdfUrl" text,
    status text DEFAULT 'active'::text NOT NULL,
    title text,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "featuredArtists" text,
    "primaryArtistEmail" text,
    "primaryArtistName" text,
    "signedAt" timestamp(3) without time zone,
    "terminatedAt" timestamp(3) without time zone
);


--
-- Name: Demo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Demo" (
    id text NOT NULL,
    title text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "artistId" text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    genre text,
    message text,
    "rejectionReason" text,
    "reviewedAt" timestamp(3) without time zone,
    "reviewedBy" text,
    "scheduledReleaseDate" text,
    "trackLink" text,
    "featuredArtists" text
);


--
-- Name: DemoFile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DemoFile" (
    id text NOT NULL,
    filename text NOT NULL,
    filepath text NOT NULL,
    filesize integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "demoId" text NOT NULL
);


--
-- Name: Earning; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Earning" (
    id text NOT NULL,
    "contractId" text NOT NULL,
    period text NOT NULL,
    "grossAmount" double precision NOT NULL,
    "artistAmount" double precision NOT NULL,
    "labelAmount" double precision NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    streams integer,
    source text,
    "expenseAmount" double precision DEFAULT 0 NOT NULL,
    "paidToArtist" boolean DEFAULT false NOT NULL,
    "paidAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Payment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    "userId" text NOT NULL,
    amount double precision NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    method text,
    reference text,
    status text DEFAULT 'pending'::text NOT NULL,
    "processedAt" timestamp(3) without time zone,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: PayoutRequest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PayoutRequest" (
    id text NOT NULL,
    "userId" text NOT NULL,
    amount double precision NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    "wiseEmail" text,
    "wiseAccountId" text,
    "wiseTransferId" text,
    status text DEFAULT 'pending'::text NOT NULL,
    notes text,
    "processedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Release; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Release" (
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    name text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "artistName" text,
    "artistsJson" text,
    image text,
    "releaseDate" text,
    type text DEFAULT 'album'::text NOT NULL,
    "baseTitle" text,
    popularity integer,
    "previewUrl" text,
    "spotifyUrl" text,
    "streamCountText" text,
    "totalTracks" integer DEFAULT 1 NOT NULL,
    "versionName" text
);


--
-- Name: RoyaltySplit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RoyaltySplit" (
    id text NOT NULL,
    "contractId" text NOT NULL,
    "userId" text,
    name text NOT NULL,
    percentage double precision NOT NULL,
    "artistId" text,
    email text
);


--
-- Name: SiteContent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SiteContent" (
    id text NOT NULL,
    key text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: SystemSettings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SystemSettings" (
    id text DEFAULT 'default'::text NOT NULL,
    config text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    "fullName" text,
    "stageName" text,
    role text DEFAULT 'artist'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "emailVerified" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    address text,
    "legalName" text,
    "monthlyListeners" integer,
    "notifyContracts" boolean DEFAULT true NOT NULL,
    "notifyDemos" boolean DEFAULT true NOT NULL,
    "notifyEarnings" boolean DEFAULT true NOT NULL,
    "notifySupport" boolean DEFAULT true NOT NULL,
    "phoneNumber" text,
    "resetToken" text,
    "resetTokenExpiry" timestamp(3) without time zone,
    "spotifyUrl" text,
    "verificationToken" text,
    "verificationTokenExpiry" timestamp(3) without time zone,
    permissions text,
    "discordId" text,
    "discordNotifyEnabled" boolean DEFAULT false NOT NULL,
    "wiseEmail" text,
    "wiseAccountId" text,
    "wiseLinkedAt" timestamp(3) without time zone
);


--
-- Name: Webhook; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Webhook" (
    id text NOT NULL,
    name text NOT NULL,
    url text NOT NULL,
    events text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    config text
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: discord_account_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discord_account_links (
    user_id text NOT NULL,
    discord_user_id text NOT NULL,
    discord_username text,
    discord_avatar text,
    guild_id text,
    linked_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: discord_event_outbox; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discord_event_outbox (
    id bigint NOT NULL,
    event_type text NOT NULL,
    aggregate_id text,
    payload jsonb NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    next_attempt_at timestamp with time zone DEFAULT now() NOT NULL,
    last_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: discord_event_outbox_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.discord_event_outbox_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: discord_event_outbox_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.discord_event_outbox_id_seq OWNED BY public.discord_event_outbox.id;


--
-- Name: discord_internal_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discord_internal_audit (
    id bigint NOT NULL,
    request_id text,
    endpoint text NOT NULL,
    method text NOT NULL,
    discord_user_id text,
    guild_id text,
    success boolean DEFAULT false NOT NULL,
    status_code integer,
    signature text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: discord_internal_audit_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.discord_internal_audit_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: discord_internal_audit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.discord_internal_audit_id_seq OWNED BY public.discord_internal_audit.id;


--
-- Name: discord_oauth_states; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discord_oauth_states (
    state text NOT NULL,
    user_id text,
    discord_user_id text,
    discord_username text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    consumed_at timestamp with time zone
);


--
-- Name: discord_role_sync_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discord_role_sync_queue (
    id bigint NOT NULL,
    user_id text NOT NULL,
    discord_user_id text,
    target_role text NOT NULL,
    target_discord_role_id text,
    status text DEFAULT 'pending'::text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    last_error text,
    guild_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: discord_role_sync_queue_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.discord_role_sync_queue_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: discord_role_sync_queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.discord_role_sync_queue_id_seq OWNED BY public.discord_role_sync_queue.id;


--
-- Name: discord_event_outbox id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discord_event_outbox ALTER COLUMN id SET DEFAULT nextval('public.discord_event_outbox_id_seq'::regclass);


--
-- Name: discord_internal_audit id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discord_internal_audit ALTER COLUMN id SET DEFAULT nextval('public.discord_internal_audit_id_seq'::regclass);


--
-- Name: discord_role_sync_queue id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discord_role_sync_queue ALTER COLUMN id SET DEFAULT nextval('public.discord_role_sync_queue_id_seq'::regclass);


--
-- Data for Name: Artist; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Artist" (id, name, image, "spotifyUrl", email, status, "createdAt", "updatedAt", "userId", "monthlyListeners", followers, genres, "lastSyncedAt", popularity, verified) FROM stdin;
6JvsRSaeBQIAb6LYyNCBht	GARIX	https://i.scdn.co/image/ab6761610000e5eba61ada4378dc66826af4c062	\N	\N	active	2026-03-04 20:27:20.511	2026-03-07 21:01:41.941	\N	27844	164	funkot	2026-03-07 21:01:41.94	25	f
04zt4agcJcyZoHpSs3RnqW	MXRDERDEAD	https://i.scdn.co/image/ab6761610000e5eb617ed461c4dc6ce5275ca267	\N	\N	active	2026-03-04 20:25:35.025	2026-03-07 21:00:58.944	\N	11848	108	\N	2026-03-07 21:00:58.943	18	f
07CoGyrUbcBkSzvs1Kd9i6	74blade	https://i.scdn.co/image/ab6761610000e5eb86f84f4d9b372981af0279d5	\N	\N	active	2026-03-04 20:25:24.391	2026-03-07 21:00:47.92	\N	640602	15482	phonk,brazilian phonk	2026-03-07 21:00:47.919	49	f
0exQbKNFd9pLmdIGycwmlf	h6itam	https://i.scdn.co/image/ab6761610000e5eb0f08faa78d1c51ee3ddf5b5e	\N	\N	active	2026-03-04 20:25:13.666	2026-03-07 21:00:36.952	\N	7456651	202383	phonk,brazilian phonk,funk	2026-03-07 21:00:36.951	73	f
0DVWkIG75PBtzwbE0Sly8w	REGXRD	https://i.scdn.co/image/ab6761610000e5eb7192fd7aa01687b4a08700df	\N	\N	active	2026-03-04 20:26:06.698	2026-03-07 21:01:20.456	\N	115797	2132	phonk	2026-03-07 21:01:20.455	36	f
0ypzv0AG6k3yZjNxdhpnJF	DudePlaya	https://i.scdn.co/image/ab6761610000e5ebdd68128518560ef4bcbc1fab	\N	\N	active	2026-03-04 20:25:56.153	2026-03-07 21:01:09.78	\N	1788482	22592	phonk	2026-03-07 21:01:09.779	57	f
53yzF4tOwqwPwwkdo70fmL	skullidze	https://i.scdn.co/image/ab6761610000e5eb0609005992e4395a5457b4cc	\N	\N	active	2026-03-04 20:27:31.054	2026-03-07 21:01:41.956	\N	160263	443	brazilian phonk,phonk	2026-03-07 21:01:41.954	36	f
4YeITwoqeIks45gELm488B	NOIXES	https://i.scdn.co/image/ab6761610000e5eb79176580686fbef816dff21b	\N	\N	active	2026-03-04 20:25:24.358	2026-03-07 21:00:48.03	\N	856166	21447	edm trap	2026-03-07 21:00:48.025	50	f
02wf6SCDwrs2qTX09X0IRE	Yb Wasg'ood	https://i.scdn.co/image/ab6761610000e5eb2e218205c3a64311fdd7984d	\N	\N	active	2026-03-04 20:26:48.949	2026-03-07 21:01:20.515	\N	8906703	210130	phonk,brazilian phonk	2026-03-07 21:01:20.514	68	f
2UKmwMB2wMQMvQcduijrQi	DRAWMEDEATH	https://i.scdn.co/image/ab67616d0000b273b4c6e41bb213116218b261d0	\N	\N	active	2026-03-04 20:25:35.124	2026-03-07 21:00:58.96	\N	20129	817	brazilian phonk	2026-03-07 21:00:58.959	51	f
3ysIyoivMDpeqLg0VMRPQw	ONIMXRU	https://i.scdn.co/image/ab6761610000e5ebedfcf37d6e57e65324f182ae	\N	\N	active	2026-03-04 20:25:45.664	2026-03-07 21:01:09.726	\N	873002	235445	phonk,drift phonk,brazilian phonk	2026-03-07 21:01:09.725	49	f
6qVUFaRkVzdtF9Wg0vxeKH	ZEVXR	https://i.scdn.co/image/ab6761610000e5eb202b025887a539755b11acdb	\N	\N	active	2026-03-04 20:27:10.017	2026-03-07 21:01:31.242	\N	63550	2874	phonk	2026-03-07 21:01:31.241	29	f
6E7d0UydWwTMqxXzNRdp78	LeoTHM	https://i.scdn.co/image/ab6761610000e5eb95edaba0615adde79e221cd7	\N	\N	active	2026-03-04 20:28:34.991	2026-03-07 21:02:14.352	\N	1397757	6242	phonk,brazilian phonk	2026-03-07 21:02:14.351	55	f
4hDC6zuK2V5qwyeJcydSPS	stxrbøy	https://i.scdn.co/image/ab6761610000e5ebe306f889794e1e3c4c13b946	\N	\N	active	2026-03-04 20:26:59.435	2026-03-07 21:01:31.291	\N	501298	3370	brazilian phonk,phonk	2026-03-07 21:01:31.29	44	f
0NakXcxWSSLTMHvJsDWPVC	SK3TCH01	https://i.scdn.co/image/ab6761610000e5ebca8960773cb59cd8650f19e5	\N	\N	active	2026-03-04 20:28:56.456	2026-03-07 21:02:25.119	\N	278896	3283	phonk,brazilian phonk	2026-03-07 21:02:25.118	42	f
5uDZGPzOYAzfOhw1lxmhwL	nreaz	https://i.scdn.co/image/ab6761610000e5eb2d74eb853a514b1c3412290e	\N	\N	active	2026-03-04 20:28:24.186	2026-03-07 21:02:14.228	\N	59828	491	brazilian phonk,phonk	2026-03-07 21:02:14.227	28	f
5xyNvcWaZKre83tW46w5Jp	TXMZ	https://i.scdn.co/image/ab6761610000e5eb621347ae2a79b13793fd3303	\N	\N	active	2026-03-04 20:27:41.612	2026-03-07 21:01:52.703	\N	17146	378	brazilian phonk	2026-03-07 21:01:52.702	22	f
4JQGeB5BANQdgSABnKHBVY	AxelitoHmn	https://i.scdn.co/image/ab6761610000e5eb39ecb3962df812e65671467f	\N	\N	active	2026-03-04 20:28:45.651	2026-03-07 21:02:25.036	\N	436258	3633	brazilian phonk,phonk	2026-03-07 21:02:25.034	45	f
0EXytqF1qOmpGIVb1AwYdJ	BEATHXVEN	https://i.scdn.co/image/ab6761610000e5eb203395bafc1afe531c905e97	\N	\N	active	2026-03-04 20:25:02.988	2026-03-07 21:00:25.653	\N	363055	1034	phonk,brazilian phonk	2026-03-07 21:00:25.652	45	f
1PvcWjADPMezv8CTyJO9Uk	Vermillion	https://i.scdn.co/image/ab6761610000e5ebc32e87b3317165df56731e5a	\N	\N	active	2026-03-04 20:30:12.135	2026-03-07 21:02:46.537	\N	1371163	50063	phonk,brazilian phonk	2026-03-07 21:02:46.536	54	f
4thCAXlpGSQSUe13fvzjrA	justforgetme	https://i.scdn.co/image/ab6761610000e5eb2c1355f7dd9bbd777f464a27	\N	\N	active	2026-03-04 20:27:53.568	2026-03-07 21:02:03.636	\N	642449	7680	phonk,brazilian phonk	2026-03-07 21:02:03.635	46	f
7drEn5GMrJRJhb3dy0LxSR	Hxlkart	https://i.scdn.co/image/ab6761610000e5eb5550cb84d95481ec369682f6	\N	\N	active	2026-03-04 20:27:42.835	2026-03-07 21:01:52.665	\N	283000	6323	\N	2026-03-07 21:01:52.663	43	f
7Kf6LvyojtWsyXbEEU7yIF	Cytrena	https://i.scdn.co/image/ab6761610000e5eb2f25ec37f6bf2e5db73896ac	\N	\N	active	2026-03-04 20:29:29.299	2026-03-07 21:02:35.903	\N	86308	3320	phonk,brazilian phonk	2026-03-07 21:02:35.902	32	f
5ldM1bXOYDVjt8Q9QWB1Uv	EnvyMind	https://i.scdn.co/image/ab6761610000e5eb73143942f17ab8d7a1bdf594	\N	\N	active	2026-03-04 20:29:07.115	2026-03-07 21:02:35.924	\N	65109	2099	brazilian phonk,phonk	2026-03-07 21:02:35.923	29	f
1o2FbPtsJOONvAlInXNwYo	Penkramin	https://i.scdn.co/image/ab6761610000e5eb1ccd739b06d510b84c064825	\N	\N	active	2026-03-04 20:30:32.067	2026-03-07 21:02:57.178	\N	196452	1501	brazilian phonk,phonk	2026-03-07 21:02:57.177	38	f
7ByARkW6MwBGBC6ak72wPN	SNYSTA	https://i.scdn.co/image/ab6761610000e5ebf91886486349da5e8cdd7c4c	\N	\N	active	2026-03-04 20:30:43.173	2026-03-07 21:03:08.08	\N	182561	1333	phonk,brazilian phonk	2026-03-07 21:03:08.079	38	f
164O6SBXwBBGLV2P809KUS	RVNGE	https://i.scdn.co/image/ab6761610000e5eb1a14197318a6c131003cd519	\N	\N	active	2026-03-04 20:29:40.086	2026-03-07 21:02:46.574	\N	2494196	33104	phonk,brazilian phonk	2026-03-07 21:02:46.573	58	f
3f8c42vQhwylI4lWCC6ARZ	wharoxmane	https://i.scdn.co/image/ab6761610000e5eb8edd05205a930bceb9c71995	\N	\N	active	2026-03-04 20:31:06.29	2026-03-07 21:03:08.082	\N	138732	3708	phonk,brazilian phonk	2026-03-07 21:03:08.081	36	f
2PpXe1ZQ4tmhWVWaJVCxfK	QR Moe	https://i.scdn.co/image/ab6761610000e5ebb25787bd3a56d58f8862caaf	\N	\N	active	2026-03-04 20:30:22.885	2026-03-07 21:02:57.335	\N	30977	547	electroclash	2026-03-07 21:02:57.334	23	f
1QYXUjQBqVpFKlxfrYsk4h	NVXUS	https://i.scdn.co/image/ab6761610000e5eb752ae08aba74b52706724c0b	\N	\N	active	2026-03-04 20:41:44.422	2026-03-07 21:03:29.664	\N	514426	13562	phonk,brazilian phonk	2026-03-07 21:03:29.663	49	f
62vwt2P3iBw4NwHdDZb27q	JXNDRO	https://i.scdn.co/image/ab6761610000e5eb181b451769b802b8589452df	\N	\N	active	2026-03-04 20:41:44.511	2026-03-07 21:03:29.727	\N	8529100	79647	phonk,brazilian phonk	2026-03-07 21:03:29.726	69	f
51K0b3lRd87cKX02hU26we	elysian.	https://i.scdn.co/image/ab6761610000e5eb50bd55a3fb24bab8780684c5	\N	\N	active	2026-03-04 20:24:52.413	2026-03-08 07:20:22.157	e92bb90c-cd0e-4214-a3cf-bf485316b6fd	6072860	19034	phonk,brazilian phonk	2026-03-07 21:00:14.864	64	f
0OTjk4QUX6zTvaZy6XOooY	TRVXER	https://i.scdn.co/image/ab6761610000e5ebb7dd37e587bb2cfeedfba135	\N	\N	active	2026-03-04 20:31:17.201	2026-03-07 21:03:18.891	\N	159716	1948	brazilian phonk,phonk	2026-03-07 21:03:18.89	36	f
4czULjQ9jyER349yjpYYcS	DJ FXSH	https://i.scdn.co/image/ab6761610000e5eb37207fb0a1e99f6a440ecf65	\N	\N	active	2026-03-04 20:41:55.115	2026-03-07 21:03:40.443	\N	297794	2327	brazilian phonk,phonk	2026-03-07 21:03:40.442	41	f
2EOtEHNNR9N1dP5J2I1cHo	Mc Gimenes	https://i.scdn.co/image/ab6761610000e5eb010381c3c78ca2895b07683a	\N	\N	active	2026-03-04 20:41:33.68	2026-03-07 21:03:18.934	\N	1260220	17359	brazilian phonk,brazilian funk	2026-03-07 21:03:18.932	51	f
1w8PO0gTOOk74D2bH8Bmue	Pheyx	https://i.scdn.co/image/ab6761610000e5eb53d7bfc56ec73c12792f91d6	\N	\N	active	2026-03-04 20:25:02.957	2026-03-08 21:00:17.454	\N	168752	2251	phonk,brazilian phonk	2026-03-08 21:00:17.453	38	f
5mU6enX6pYYKEs0zfRkm1R	MVSTERIOUS	https://i.scdn.co/image/ab6761610000e5eb5877eceec6fc9bbe79ad65b5	\N	\N	active	2026-03-04 20:28:13.546	2026-03-08 21:00:34.927	\N	2497090	52462	phonk,brazilian phonk	2026-03-08 21:00:34.926	59	f
1Sdc6ySbIvzO0X9vbyHzWm	Ogryzek	https://i.scdn.co/image/ab6761610000e5ebf5083570c3167efac89e6713	\N	\N	active	2026-03-04 20:25:13.666	2026-03-07 21:00:36.474	\N	6172201	621125	phonk,brazilian phonk	2026-03-07 21:00:36.473	66	f
30S401kK22I3HKdI2uHZgp	JFEXX	https://i.scdn.co/image/ab6761610000e5eb0ceec9d686fcb507f2e26849	\N	\N	active	2026-03-04 20:42:16.813	2026-03-07 21:04:01.998	\N	9565	917	\N	2026-03-07 21:04:01.997	17	f
4xLBtr9d1JOwYvW39g2mUl	MC Alexandre Fabuloso	https://i.scdn.co/image/ab6761610000e5eb280c23e6fc80e5d56b710540	\N	\N	active	2026-03-04 20:42:38.604	2026-03-07 21:04:23.619	\N	890162	4044	phonk,brazilian phonk	2026-03-07 21:04:23.617	50	f
6I1Xg3EHFdDmWqy7UPmqKb	En1t	https://i.scdn.co/image/ab67616d0000b2736a6674d2a785c57b32899e9f	\N	\N	active	2026-03-04 20:42:16.945	2026-03-07 21:04:01.965	\N	29706	79	\N	2026-03-07 21:04:01.964	21	f
3eZBjp3ibCgDuKzo3PA8vh	Slixshøt	https://i.scdn.co/image/ab6761610000e5eb7fe98cef8fa40d00766fc42c	\N	\N	active	2026-03-04 20:42:27.779	2026-03-07 21:04:12.684	\N	69009	375	\N	2026-03-07 21:04:12.683	31	f
5w4mniCcdjpn4yTHlPfniW	LØST	https://i.scdn.co/image/ab6761610000e5eb885811db7f3b69642faf9a9f	\N	\N	active	2026-03-04 20:42:49.395	2026-03-07 21:04:34.482	\N	48147	1924	electroclash	2026-03-07 21:04:34.481	30	f
5tvPbCrx8LMaL9Zby5e7c2	fennecxx	https://i.scdn.co/image/ab6761610000e5eb99c3571b334f6efde821b4fb	\N	\N	active	2026-03-04 20:42:27.737	2026-03-07 21:04:12.92	\N	3905279	172842	phonk,brazilian phonk	2026-03-07 21:04:12.919	62	f
03pt9mCEKaO0GepoXTV5uZ	Prost	https://i.scdn.co/image/ab6761610000e5eb6d0a91012b51018e2ddfbf75	\N	\N	active	2026-03-04 20:43:00.153	2026-03-07 21:04:45.141	\N	55594	461	brazilian phonk,phonk	2026-03-07 21:04:45.14	27	f
7FgaWBwYSxy5cywT6XOPdt	Igrxs	https://i.scdn.co/image/ab6761610000e5eb6766d890bbb589a230281733	\N	\N	active	2026-03-04 20:42:38.63	2026-03-07 21:04:23.668	\N	64210	2556	electroclash	2026-03-07 21:04:23.667	30	f
514Qze5V7AvD6wVSwdQB8Y	Beyounger	https://i.scdn.co/image/ab6761610000e5eb7f3779afd441bbda265a20c8	\N	\N	active	2026-03-04 20:42:49.435	2026-03-07 21:04:34.502	\N	129646	8370	brazilian phonk,drift phonk,phonk	2026-03-07 21:04:34.494	33	f
5dDNNq04RjKXFOADdHd6VX	Scythermane	https://i.scdn.co/image/ab6761610000e5eb78c7eac7f83aef818f78356c	\N	\N	active	2026-03-04 20:43:21.88	2026-03-07 21:05:07.084	\N	9188972	296784	phonk,brazilian phonk,funk	2026-03-07 21:05:07.083	71	f
60J22gmJOU5t1n8NmW0XSK	KXNSEI	https://i.scdn.co/image/ab6761610000e5ebaa0ba18d2a4dcc84e9c80e08	\N	\N	active	2026-03-04 20:43:11.121	2026-03-07 21:04:56.227	\N	50990	1392	brazilian phonk,phonk	2026-03-07 21:04:56.226	25	f
7lAaAGxYxk2GH8cMbTEwAL	NXGHT!	https://i.scdn.co/image/ab6761610000e5eb713989d4a746224d67148e02	\N	\N	active	2026-03-04 20:43:00.2	2026-03-07 21:04:45.677	\N	5609549	216984	phonk,brazilian phonk	2026-03-07 21:04:45.676	65	f
57ukrt4OCWcR4HL9sStvKW	NXDLS	https://i.scdn.co/image/ab6761610000e5eb303cde31981abb0ffa7007c4	\N	\N	active	2026-03-04 20:43:32.651	2026-03-07 21:05:17.756	\N	24926	948	brazilian phonk,phonk	2026-03-07 21:05:17.755	21	f
1yevH7mkPMXeSTnA9SwHvq	SEKIMANE	https://i.scdn.co/image/ab6761610000e5eba88b9d8bbca7581200fa1b77	\N	\N	active	2026-03-04 20:43:11.1	2026-03-07 21:04:56.382	\N	6839447	94240	phonk,brazilian phonk,funk	2026-03-07 21:04:56.381	72	f
4PMSwT0eBQfWB3cjH4t30s	Mwwlkiy	https://i.scdn.co/image/ab6761610000e5eb64f4cb6eac15b34728f42cd2	\N	\N	active	2026-03-04 20:43:21.899	2026-03-07 21:05:07.14	\N	46578	2541	phonk,brazilian phonk	2026-03-07 21:05:07.139	27	f
0x9bzpifUdZFBQw7R1UWPT	RezaDead	https://i.scdn.co/image/ab6761610000e5eb465e6bb060fb7222208d4688	\N	\N	active	2026-03-04 20:43:43.479	2026-03-07 21:05:28.608	\N	700389	9906	phonk,brazilian phonk	2026-03-07 21:05:28.607	47	f
2bXiTuKR1AMkSvmgh60706	NEKKZI	https://i.scdn.co/image/ab6761610000e5eb229a316daf455919b57c908b	\N	\N	active	2026-03-04 20:43:43.294	2026-03-07 21:05:28.757	\N	57473	3688	brazilian phonk,phonk	2026-03-07 21:05:28.756	28	f
1Zg2f2iwwB2bfxtKPkb4eI	DVNIZER	https://i.scdn.co/image/ab6761610000e5eb62a3a55278106b6a24e1ed53	\N	\N	active	2026-03-04 20:43:32.561	2026-03-07 21:05:17.915	\N	3167	410	\N	2026-03-07 21:05:17.914	9	f
3FUCRB0hJhe9BrXW1yonDh	DARKANASE	https://i.scdn.co/image/ab6761610000e5eb5e1dcffb73ca9e8af6a1608f	\N	\N	active	2026-03-04 20:43:54.348	2026-03-07 21:05:39.434	\N	1756753	15041	phonk,brazilian phonk	2026-03-07 21:05:39.433	56	f
2Wt4l7cu2A5QctQ04QCR6S	DYNAMIS	https://i.scdn.co/image/ab6761610000e5eb0170d3112945a3832a1494ab	\N	\N	active	2026-03-04 20:44:05.29	2026-03-07 21:05:50.204	\N	220411	2218	phonk,drift phonk,brazilian phonk	2026-03-07 21:05:50.203	40	f
70bgV7fa5H6sTah58wm73l	HXDES	https://i.scdn.co/image/ab6761610000e5eb085d6d06558b88e5dc3e140c	\N	\N	active	2026-03-04 20:43:54.444	2026-03-07 21:05:39.576	\N	275544	4001	phonk,brazilian phonk	2026-03-07 21:05:39.575	40	f
5bePP411ITzZyWf1QZ2SX4	Flame Runner	https://i.scdn.co/image/ab6761610000e5eb5c3e66a98ca9813c9d97eec0	\N	\N	active	2026-03-04 20:44:26.983	2026-03-07 21:06:11.634	\N	4943904	132924	phonk,brazilian phonk	2026-03-07 21:06:11.633	66	f
6Gr49ikaor5MuFQPBlOZ29	Mc Bockaum	https://i.scdn.co/image/ab6761610000e5ebe7f1dea6f68e40da46d244b3	\N	\N	active	2026-03-04 20:44:16.123	2026-03-07 21:06:00.975	\N	478732	1435	phonk,brazilian phonk	2026-03-07 21:06:00.974	45	f
5dt5VvKgK1bVZodVPnx7AI	NOTXNDYBOY	https://i.scdn.co/image/ab6761610000e5eb87940193ec59807bcf432e53	\N	\N	active	2026-03-04 20:44:05.121	2026-03-07 21:05:50.281	\N	543381	2034	brazilian phonk,phonk	2026-03-07 21:05:50.28	46	f
50LbWtqqQeduRjJHLuwQed	HIMXN	https://i.scdn.co/image/ab6761610000e5ebb5187c80afc6f4b995c51ca2	\N	\N	active	2026-03-04 20:44:16.075	2026-03-07 21:06:00.991	\N	1708466	33063	phonk,brazilian phonk	2026-03-07 21:06:00.99	57	f
2nIlwjrcU54whF2MWBcJSu	S4Y4N	https://i.scdn.co/image/ab6761610000e5eb0a5f956e2d1cf6ff6ef6e545	\N	\N	active	2026-03-04 20:44:37.732	2026-03-07 21:06:22.573	\N	4879	91	\N	2026-03-07 21:06:22.572	10	f
2sQHo73pQF1OTq3lDuQhlO	Mc Pogba	https://i.scdn.co/image/ab6761610000e5ebafc0a66ccd73a51918dbe283	\N	\N	active	2026-03-04 20:44:27.005	2026-03-07 21:06:11.904	\N	4226379	61253	phonk,brazilian phonk,brazilian funk	2026-03-07 21:06:11.903	60	f
30vnw2IDoHflDzAn9DpqLf	BLXSTR	https://i.scdn.co/image/ab6761610000e5ebb3f43e21a36a37dd16e76363	\N	\N	active	2026-03-04 20:44:48.609	2026-03-07 21:06:33.258	\N	47194	1226	brazilian phonk	2026-03-07 21:06:33.257	26	f
4bcHlUu9N2JzWzpz3kpzzy	SoyFlowers	https://i.scdn.co/image/ab6761610000e5eb07a6bb6abb0e806770546f79	\N	\N	active	2026-03-04 20:44:37.769	2026-03-07 21:06:22.666	\N	183606	17455	brazilian phonk,phonk	2026-03-07 21:06:22.665	38	f
3iG3DOwDRNNcU4SD26P0qp	Yung Zime	https://i.scdn.co/image/ab6761610000e5eb862f59e77c2fcccb2cf970a1	\N	\N	active	2026-03-04 20:44:59.295	2026-03-07 21:06:44.48	\N	202776	8617	phonk,drift phonk,brazilian phonk	2026-03-07 21:06:44.479	39	f
1mEkCpjXPIymCGkKCJzcl5	BERNZ	https://i.scdn.co/image/ab6761610000e5ebc84f8e7e96197db848c185ad	\N	\N	active	2026-03-04 20:44:48.596	2026-03-07 21:06:33.679	\N	196322	1421	\N	2026-03-07 21:06:33.678	41	f
4hV3aU0WKvFaiX5ugXP5hp	MC MN	https://i.scdn.co/image/ab6761610000e5ebfef24c383829c81f31738b6c	\N	\N	active	2026-03-04 20:45:10.092	2026-03-07 21:06:55.095	\N	3206467	112369	phonk,brazilian phonk,brazilian funk	2026-03-07 21:06:55.094	59	f
1RklNDIiYVZ3dYdEUnB0cS	ANDROMEDA	https://i.scdn.co/image/ab6761610000e5ebae8fbc0ea27164c6ff6b5267	\N	\N	active	2026-03-04 20:24:52.445	2026-03-07 21:00:14.799	\N	6451993	95497	phonk,brazilian phonk	2026-03-07 21:00:14.797	65	f
6UR6L0rt11tuAsNdfMi7VP	kanajes	https://i.scdn.co/image/ab6761610000e5eb186ce0920c0994a4764b32d2	\N	\N	active	2026-03-08 21:00:09.887	2026-03-08 21:00:09.887	\N	374285	3665	phonk,brazilian phonk	2026-03-08 21:00:09.886	45	f
1nIwABuN4D2w2SaE4ML7OA	Phonknight	https://i.scdn.co/image/ab6761610000e5ebc709168b4f609ecf6f8307c3	\N	\N	active	2026-03-04 20:41:55.231	2026-03-07 21:03:40.523	\N	184814	2544	phonk,brazilian phonk	2026-03-07 21:03:40.522	38	f
2dVJkcQL5tMX02UH56iTo1	n¡no	https://i.scdn.co/image/ab6761610000e5eb23c8b0d372018d26656e6b19	\N	\N	active	2026-03-04 20:42:06.153	2026-03-07 21:03:51.245	\N	154	19	\N	2026-03-07 21:03:51.244	1	f
4WBFx3Wen7AY4vlMffuZTO	LAYXMANE	https://i.scdn.co/image/ab6761610000e5eb484d4f9bc7c2b1891298b0ef	\N	\N	active	2026-03-04 20:42:06.098	2026-03-07 21:03:51.323	\N	4662	267	brazilian phonk	2026-03-07 21:03:51.323	13	f
2D6Twj1xGUoCVJExiBMQxU	NXGORI!	https://i.scdn.co/image/ab67616d0000b27346c2eb833f2a88bf4ac8e26b	\N	\N	active	2026-03-08 21:00:09.928	2026-03-08 21:00:09.928	\N	27321	494	brazilian phonk	2026-03-08 21:00:09.927	24	f
7I9nmXtGIFw9XUxNG36Q7N	heapper	https://i.scdn.co/image/ab6761610000e5ebe888e07f84543b1a4e27f6a4	\N	\N	active	2026-03-08 21:00:10.905	2026-03-08 21:00:10.905	\N	3071805	37099	phonk,brazilian phonk,funk	2026-03-08 21:00:10.904	62	f
0iPVlUddVxi8XrL3Ju8GAw	DJ JUAN	https://i.scdn.co/image/ab6761610000e5eb958d3b003b5045ba6c49d294	\N	\N	active	2026-03-08 21:00:10.967	2026-03-08 21:00:10.967	\N	2714385	34800	phonk,brazilian phonk	2026-03-08 21:00:10.965	59	f
1NCYiPysYUzRk4YFg4rdic	heqxrte	https://i.scdn.co/image/ab6761610000e5ebb686a916d386f76ae8f0d11a	\N	\N	active	2026-03-08 21:00:11.957	2026-03-08 21:00:11.957	\N	203633	1777	brazilian phonk,phonk	2026-03-08 21:00:11.955	50	f
2Ytgz8jqYULfKBtQCNrihy	WXRTNAX	https://i.scdn.co/image/ab6761610000e5eb0c691bf22937ec87007bf5d2	\N	\N	active	2026-03-08 21:00:12.208	2026-03-08 21:00:12.208	\N	1184422	8852	phonk,brazilian phonk	2026-03-08 21:00:12.207	54	f
6lTfkJgd8GHfPWGXHZWobD	Manlikefdot	https://i.scdn.co/image/ab6761610000e5eb53160933c43a5660279540b5	\N	\N	active	2026-03-08 21:00:13.464	2026-03-08 21:00:13.464	\N	415005	28324	phonk,brazilian phonk	2026-03-08 21:00:13.461	43	f
7toT5rOUXkAj7zSVTs5qK1	4KBATU	https://i.scdn.co/image/ab6761610000e5eb0f31c3a521462c8266599861	\N	\N	active	2026-03-08 21:00:13.557	2026-03-08 21:00:13.557	\N	1083638	3594	brazilian phonk,funk bruxaria	2026-03-08 21:00:13.556	51	f
1mGbsqWvPgf7klYyW21hbl	ZZXWNCH	https://i.scdn.co/image/ab6761610000e5ebbf55bca35f181127e2d31ca5	\N	\N	active	2026-03-08 21:00:14.521	2026-03-08 21:00:14.521	\N	297193	708	phonk,brazilian phonk	2026-03-08 21:00:14.519	46	f
5jAVTF0vIdW64WZ7Lkiznq	S1lque	https://i.scdn.co/image/ab6761610000e5eb4724966541c2b3a03d1dc39c	\N	\N	active	2026-03-08 21:00:14.673	2026-03-08 21:00:14.673	\N	62713	427	phonk,brazilian phonk	2026-03-08 21:00:14.672	32	f
4LUGwmhDZqtSjnUczFG30c	prod. gabryll	https://i.scdn.co/image/ab6761610000e5eb38c15e1170999a1c029ba4fe	\N	\N	active	2026-03-08 21:00:15.675	2026-03-08 21:00:15.675	\N	2662	36	jersey club	2026-03-08 21:00:15.674	7	f
5DRLYtYlq2OfR5zqiW2phF	Zeyvex	https://i.scdn.co/image/ab6761610000e5eb99c239f8fe18207de9988ed9	\N	\N	active	2026-03-08 21:00:15.934	2026-03-08 21:00:15.934	\N	15396	31	\N	2026-03-08 21:00:15.932	18	f
2DgNOnbtbBDq1mchoEP1nU	VORTEXON	https://i.scdn.co/image/ab6761610000e5eb3c2a075612568a80e1f82205	\N	\N	active	2026-03-08 21:00:17.232	2026-03-08 21:00:17.232	\N	28527	722	\N	2026-03-08 21:00:17.231	25	f
6e1LwzV1WAJFCdT1RsgqMK	KIXIA	https://i.scdn.co/image/ab6761610000e5eb1453a6bd36f096cd378570c7	\N	\N	active	2026-03-08 21:00:18.666	2026-03-08 21:00:18.666	\N	3914088	48259	phonk,brazilian phonk,funk	2026-03-08 21:00:18.665	66	f
2w3GrIBWmUZBrLUfj6O1dN	SXLLX	https://i.scdn.co/image/ab6761610000e5eb0c531e660145e32d34355dd4	\N	\N	active	2026-03-08 21:00:18.803	2026-03-08 21:00:18.803	\N	3132911	51050	phonk,brazilian phonk	2026-03-08 21:00:18.802	61	f
1TNkCF5hm5hJClAFD4LDAX	KAPPO	https://i.scdn.co/image/ab67616d0000b273c80bcdaa678ea622dac4ca66	\N	\N	active	2026-03-08 21:00:20.044	2026-03-08 21:00:20.044	\N	20209	137	\N	2026-03-08 21:00:20.043	22	f
247gLNFpJ7XimY1OgHpcPV	$ERUM	https://i.scdn.co/image/ab6761610000e5eb03962e8f9d04b7ae71c37725	\N	\N	active	2026-03-08 21:00:20.147	2026-03-08 21:00:20.147	\N	373766	5211	brazilian phonk,phonk	2026-03-08 21:00:20.146	45	f
033KOsWZnDKwpgINy9fZgp	INFINITIX	https://i.scdn.co/image/ab6761610000e5ebc46f96e5b9184a1f5acc6a36	\N	\N	active	2026-03-08 21:00:21.462	2026-03-08 21:00:21.462	\N	67733	188	phonk	2026-03-08 21:00:21.461	31	f
3EdNJeTXrsR5jbmICchj3R	KoruSe	https://i.scdn.co/image/ab6761610000e5eb2befffafc3e3aaa31b38acc8	\N	\N	active	2026-03-08 21:00:21.583	2026-03-08 21:00:21.583	\N	549108	33471	phonk,synthwave,drift phonk	2026-03-08 21:00:21.582	48	f
01YWFqWt6zsYOoq0MbIIJD	prodbydxm	https://i.scdn.co/image/ab6761610000e5eb3717b6c4701b0788ccb9b356	\N	\N	active	2026-03-08 21:00:22.885	2026-03-08 21:00:22.885	\N	1434927	16924	phonk,brazilian phonk	2026-03-08 21:00:22.884	59	f
3UGzyQLULhjLbOzpXqhnEJ	Jlaverde	https://i.scdn.co/image/ab67616d0000b2738b0baf1770cd793c60fd7874	\N	\N	active	2026-03-08 21:00:22.921	2026-03-08 21:00:22.921	\N	16516	11	\N	2026-03-08 21:00:22.92	19	f
0ugPb6wev8X4JtROGeCzm1	DJ ZENITE	https://i.scdn.co/image/ab6761610000e5eb01f9b1ddb0cdc713ceaabe7a	\N	\N	active	2026-03-08 21:00:24.061	2026-03-08 21:00:24.061	\N	363446	29936	phonk,brazilian phonk	2026-03-08 21:00:24.054	45	f
3Ri3fz9VRH2u2Ohi9ngw4z	PRODlopesz	https://i.scdn.co/image/ab67616d0000b2737d27345630baefad1e314dc6	\N	\N	active	2026-03-08 21:00:24.092	2026-03-08 21:00:24.092	\N	1331	7	brazilian phonk	2026-03-08 21:00:24.091	7	f
2ttCihAGZn9a8pck022YN6	MEMXPRA	https://i.scdn.co/image/ab6761610000e5ebee928f6901f05071bd1060b3	\N	\N	active	2026-03-08 21:00:25.25	2026-03-08 21:00:25.25	\N	101577	199	\N	2026-03-08 21:00:25.249	36	f
0NnCzXdSBu86fPXy6ZsfgU	DJ TKG	https://i.scdn.co/image/ab67616d0000b273f65b0e1a4c1bd1aa85b81db3	\N	\N	active	2026-03-08 21:00:25.406	2026-03-08 21:00:25.406	\N	825	6	brazilian phonk	2026-03-08 21:00:25.405	4	f
3Oohh6pTxKXeLNeLXgalhe	GRXTOR	https://i.scdn.co/image/ab6761610000e5eb2b8d33ea172213e3c1090528	\N	\N	active	2026-03-08 21:00:26.716	2026-03-08 21:00:26.716	\N	1689	225	\N	2026-03-08 21:00:26.715	6	f
6fgxSvkznI98Dc33X7FynB	LXGHTLXSS	https://i.scdn.co/image/ab6761610000e5eb2895f60b876227ed289f1d49	\N	\N	active	2026-03-08 21:00:26.827	2026-03-08 21:00:26.827	\N	310898	5026	phonk,brazilian phonk	2026-03-08 21:00:26.826	42	f
6DlWUEM6Qr9z6p6YAOLBDh	DJ FLG	https://i.scdn.co/image/ab6761610000e5eb40afa4e40db3e1e6cf92b263	\N	\N	active	2026-03-08 21:00:28.178	2026-03-08 21:00:28.178	\N	898568	92387	phonk,brazilian phonk	2026-03-08 21:00:28.177	52	f
2ONVcxFJ3vwQQirfRz7MAj	DJ Sylvi	\N	\N	\N	active	2026-03-08 21:00:28.283	2026-03-08 21:00:28.283	\N	6	10	\N	2026-03-08 21:00:28.28	1	f
5KTdGzdx68HWOnDAhNSvhs	Ocean	https://i.scdn.co/image/ab6761610000e5eb71d39fa72dbaebb6575fe2bc	\N	\N	active	2026-03-08 21:00:29.546	2026-03-08 21:00:29.546	\N	687924	3177	\N	2026-03-08 21:00:29.544	50	f
2cx6gOmSDTfLBddNLTuA0X	INFXRNVM	https://i.scdn.co/image/ab6761610000e5eb5ff135bd1dbda6fb105f14b4	\N	\N	active	2026-03-08 21:00:29.671	2026-03-08 21:00:29.671	\N	145120	14894	brazilian phonk,phonk	2026-03-08 21:00:29.67	37	f
1XDHghf5LSNMthHOcpK6rT	SICXRIUS	https://i.scdn.co/image/ab6761610000e5ebb6850b8dd75dd0e74e68cc50	\N	\N	active	2026-03-08 21:00:30.508	2026-03-08 21:00:30.508	\N	1494892	6752	phonk,brazilian phonk	2026-03-08 21:00:30.507	55	f
6qExyenranMv8TbLhG0B9p	SXNTIRO	https://i.scdn.co/image/ab67616d0000b2739ee03a877f5c9a6539cafba3	\N	\N	active	2026-03-08 21:00:30.829	2026-03-08 21:00:30.829	\N	19048	64	\N	2026-03-08 21:00:30.828	22	f
2xUrLIAss3e2KH44O8Iwt2	lirvie	https://i.scdn.co/image/ab6761610000e5eb2b847244f83c13f9eb2c6fd2	\N	\N	active	2026-03-08 21:00:32.017	2026-03-08 21:00:32.017	\N	2096	23	brazilian phonk	2026-03-08 21:00:32.014	7	f
7z3YJMEmDL2kLzZEsk4z6V	DJ ANYZZ	https://i.scdn.co/image/ab6761610000e5ebee7f62bc06638172f88957dc	\N	\N	active	2026-03-08 21:00:32.033	2026-03-08 21:00:32.033	\N	317667	5238	phonk,brazilian phonk	2026-03-08 21:00:32.029	43	f
0nkcbIDXNqh0qBDV0iyEJl	FZK	https://i.scdn.co/image/ab6761610000e5ebed56e38a8a2dcbb3c937df7b	\N	\N	active	2026-03-08 21:00:33.23	2026-03-08 21:00:33.23	\N	135840	670	brazilian phonk,phonk	2026-03-08 21:00:33.228	35	f
11kSAdTlX9GkEFnTMbFJxz	LXST DRAGON	https://i.scdn.co/image/ab6761610000e5ebdaefc156f0e6486b807737d4	\N	\N	active	2026-03-08 21:00:33.437	2026-03-08 21:00:33.437	\N	660619	4019	brazilian phonk,phonk	2026-03-08 21:00:33.437	50	f
1w1IS5ufNR3HLQ0tMWYyGc	MC K3	https://i.scdn.co/image/ab6761610000e5eb02ad1abf61648393f0e0e208	\N	\N	active	2026-03-08 21:00:34.873	2026-03-08 21:00:34.873	\N	490559	7480	phonk,brazilian phonk	2026-03-08 21:00:34.868	48	f
6ZhleMHIGIpjkBHrQDl4G7	DYGO	https://i.scdn.co/image/ab6761610000e5eb1d8900065e9bc4c4e7f06950	\N	\N	active	2026-03-08 21:00:36.117	2026-03-08 21:00:36.117	\N	3853907	79924	phonk,brazilian phonk	2026-03-08 21:00:36.113	62	f
4V9UWItDzoRmEGRJMXwjgx	Naxzo on the beat	https://i.scdn.co/image/ab6761610000e5eb2ba91bda75bcdd934bec162a	\N	\N	active	2026-03-08 21:00:36.27	2026-03-08 21:00:36.27	\N	355071	675	phonk,brazilian phonk	2026-03-08 21:00:36.268	43	f
5mj2wRTtOG1m2r0dm8yPII	$oezy	https://i.scdn.co/image/ab6761610000e5eb04ef07bbf3c7d3ae99a63f16	\N	\N	active	2026-03-08 21:00:37.638	2026-03-08 21:00:37.638	\N	10189	2457	brazilian phonk,phonk	2026-03-08 21:00:37.637	16	f
1FTARqKNnQBxM5xreSwERx	DJ TUUV	https://i.scdn.co/image/ab6761610000e5ebc36b2ca11310ffb30d0b1655	\N	\N	active	2026-03-08 21:00:37.733	2026-03-08 21:00:37.733	\N	655712	3447	phonk,brazilian phonk	2026-03-08 21:00:37.732	53	f
1RQBeB371joZAYaFhNnAAD	ryoka	https://i.scdn.co/image/ab6761610000e5eb577a6164e2bc03db33a2826e	\N	\N	active	2026-03-08 21:00:39.167	2026-03-08 21:00:39.167	\N	109702	1340	brazilian phonk,phonk	2026-03-08 21:00:39.165	34	f
45c1TFQbVUqKUXJlMMDmUF	mykenia	https://i.scdn.co/image/ab6761610000e5eb2e7b8209d8e43e96b7e64d71	\N	\N	active	2026-03-08 21:00:39.188	2026-03-08 21:00:39.188	\N	78249	361	brazilian phonk,phonk	2026-03-08 21:00:39.187	32	f
5sZrMlmLdssEPC5EsdPMhm	yngastrobeatz.	https://i.scdn.co/image/ab6761610000e5eb110d68465c68da51711e76c8	\N	\N	active	2026-03-08 21:00:40.448	2026-03-08 21:00:40.448	\N	2301757	17898	phonk,brazilian phonk	2026-03-08 21:00:40.444	57	f
7qxDImq6MFph8fLy0FOTCq	TRVNSPORTER	https://i.scdn.co/image/ab6761610000e5ebd0af1001352d3cc4982aba82	\N	\N	active	2026-03-08 21:00:40.533	2026-03-08 21:00:40.533	\N	202100	12976	phonk,drift phonk	2026-03-08 21:00:40.532	39	f
0TIzSozDGqKFcjoLMu1Jaf	DJ VRK	https://i.scdn.co/image/ab6761610000e5eb181b8a7ef6d82d71bd0ef359	\N	\N	active	2026-03-08 21:00:41.646	2026-03-08 21:00:41.646	\N	3677	38	\N	2026-03-08 21:00:41.645	11	f
4XbwBWx9DLeZkb5bMYagyO	prox1ma.	https://i.scdn.co/image/ab67616d0000b2739538c6e1eb216f16d5e1d41a	\N	\N	active	2026-03-08 21:00:41.653	2026-03-08 21:00:41.653	\N	738	16	brazilian phonk	2026-03-08 21:00:41.651	5	f
0hqEZSihgORoXhQfj618gL	dxmnbroo	https://i.scdn.co/image/ab6761610000e5eb6e34fa7fc36778ab82149a73	\N	\N	active	2026-03-08 21:00:42.946	2026-03-08 21:00:42.946	\N	29701	611	\N	2026-03-08 21:00:42.944	22	f
1C2UjkEqaG9qPWJQMPouLV	Retenlol2	https://i.scdn.co/image/ab6761610000e5eb64aa92c93d35c51934ac2892	\N	\N	active	2026-03-08 21:00:42.964	2026-03-08 21:00:42.964	\N	8127	1202	\N	2026-03-08 21:00:42.963	16	f
0nENDvp4J2yRmBy3r2rsn8	CA$$INI	https://i.scdn.co/image/ab6761610000e5eb433bc1cd53a0edfd5ffed591	\N	\N	active	2026-03-08 21:00:44.088	2026-03-08 21:00:44.088	\N	2666	75	brazilian phonk	2026-03-08 21:00:44.085	6	f
26m3xIZAVqVGBmzBRPjZM0	DxFuSee	https://i.scdn.co/image/ab6761610000e5eb994352794c182bf8696e6680	\N	\N	active	2026-03-08 21:00:44.284	2026-03-08 21:00:44.284	\N	25557	275	funkot	2026-03-08 21:00:44.283	23	f
7FqHcUwnhxJZAgS3I6GFFL	DJ ALEX	https://i.scdn.co/image/ab6761610000e5ebabf12d55c96a755dfe5abf37	\N	\N	active	2026-03-08 21:00:45.679	2026-03-08 21:00:45.679	\N	4249842	76020	phonk,brazilian phonk	2026-03-08 21:00:45.678	63	f
5A0DJQ2QfFYNZPMtChUYwi	DEKO	https://i.scdn.co/image/ab6761610000e5eb6b2eebba89234c7e54ef0122	\N	\N	active	2026-03-08 21:00:45.713	2026-03-08 21:00:45.713	\N	82	531	\N	2026-03-08 21:00:45.712	0	f
0lcBc44GjjqgkeMaH7RHuy	JUICYMANE	https://i.scdn.co/image/ab6761610000e5eb26ce850a576894a2a54dd261	\N	\N	active	2026-03-08 21:00:46.7	2026-03-08 21:00:46.7	\N	3111	36	\N	2026-03-08 21:00:46.699	12	f
07iqb0293YC35yDyYm6sjB	DJ SERIAL	https://i.scdn.co/image/ab6761610000e5eb7ff708e74e52110e738010e1	\N	\N	active	2026-03-08 21:00:46.966	2026-03-08 21:00:46.966	\N	243879	34435	phonk,brazilian phonk	2026-03-08 21:00:46.965	43	f
2SE6mfDFx1U34XJsT48MUN	DJ FallThox	https://i.scdn.co/image/ab6761610000e5eb56e5f06f551c26efa3d1a967	\N	\N	active	2026-03-08 21:00:47.818	2026-03-08 21:00:47.818	\N	2156182	20912	phonk,brazilian phonk,funk	2026-03-08 21:00:47.815	63	f
40wHE22g6LncLlOebhziyB	weezyrsx	https://i.scdn.co/image/ab6761610000e5eb1f1a38c4fd256f967a465b9a	\N	\N	active	2026-03-08 21:00:47.939	2026-03-08 21:00:47.939	\N	113121	643	brazilian phonk,phonk	2026-03-08 21:00:47.938	35	f
5hfVobwxTC73whNVhzwlcP	RZXT!	https://i.scdn.co/image/ab6761610000e5ebba75dd01a8a2baa72c720af3	\N	\N	active	2026-03-08 21:00:49.148	2026-03-08 21:00:49.148	\N	269576	12024	brazilian phonk,phonk	2026-03-08 21:00:49.146	39	f
7KcQJ4ZkFbeaf8kTBjhkFV	ATTXCK	https://i.scdn.co/image/ab6761610000e5eb6f0bc3876a6d9a53147a6fa5	\N	\N	active	2026-03-08 21:00:49.244	2026-03-08 21:00:49.244	\N	24648	1209	brazilian phonk	2026-03-08 21:00:49.243	23	f
3OkRC6Ds1vCw9z22oaa6LG	ghost funeral	https://i.scdn.co/image/ab67616d0000b2732947e4aca374a2ce67f76fea	\N	\N	active	2026-03-08 21:00:50.055	2026-03-08 21:00:50.055	\N	1	2	\N	2026-03-08 21:00:50.052	0	f
18NE0VFCA7M9c8coZaczZF	Brvski	https://i.scdn.co/image/ab6761610000e5eb893729b4507fce25135b55f6	\N	\N	active	2026-03-08 21:00:50.178	2026-03-08 21:00:50.178	\N	58060	1158	drift phonk,phonk	2026-03-08 21:00:50.173	28	f
7ycusxDuR1PWLAdnnlIJLG	xenslav1	https://i.scdn.co/image/ab6761610000e5ebdf7a508fb2a6b5cf218fce36	\N	\N	active	2026-03-08 21:00:51.429	2026-03-08 21:00:51.429	\N	7595	43	\N	2026-03-08 21:00:51.428	16	f
5kFKWKOi67GISDFKogGbRP	Mc Luizinho	https://i.scdn.co/image/ab6761610000e5eb3596d3118c652f49f1bc3e3f	\N	\N	active	2026-03-08 21:00:51.459	2026-03-08 21:00:51.459	\N	4401972	12831	phonk,brazilian phonk	2026-03-08 21:00:51.458	62	f
3u1FpUUqf57ITUFhImpSvQ	CAWN	https://i.scdn.co/image/ab67616d0000b273f7773699c5ffe137366d38ee	\N	\N	active	2026-03-08 21:00:52.467	2026-03-08 21:00:52.467	\N	56149	322	\N	2026-03-08 21:00:52.466	30	f
01PZm56J8KOLP7nS8wwc5H	APHRO	https://i.scdn.co/image/ab6761610000e5eb7993eb3d8cd2a4e553cb2a7b	\N	\N	active	2026-03-08 21:00:52.626	2026-03-08 21:00:52.626	\N	326241	8659	brazilian phonk,phonk	2026-03-08 21:00:52.624	42	f
6ugw7JCu0AG7txRcRAxU8d	Mc Rd	https://i.scdn.co/image/ab6761610000e5ebcb01cf3b71adb6cb7e47bd3e	\N	\N	active	2026-03-08 21:00:53.805	2026-03-08 21:00:53.805	\N	4291712	92319	brazilian funk,phonk,brazilian phonk,funk carioca	2026-03-08 21:00:53.803	64	f
1H0ekJzZfzIWYp6rnLLDNp	Elcofff	https://i.scdn.co/image/ab6761610000e5eb7a4b4df96be8d35d763b72cc	\N	\N	active	2026-03-08 21:00:53.831	2026-03-08 21:00:53.831	\N	95634	1204	\N	2026-03-08 21:00:53.83	38	f
6GPRIUFXdQ1I2uttxcC6gp	LYKYOR	https://i.scdn.co/image/ab6761610000e5eb25941efa73431624a6bd0562	\N	\N	active	2026-03-08 21:00:54.917	2026-03-08 21:00:54.917	\N	326496	8915	phonk,funkot,brazilian phonk	2026-03-08 21:00:54.912	47	f
4YE03NBlIAI15Z63f9nGAz	SZEKTAS	https://i.scdn.co/image/ab6761610000e5eb9fee520153f801901d5a8596	\N	\N	active	2026-03-08 21:00:55.271	2026-03-08 21:00:55.271	\N	49427	1310	phonk	2026-03-08 21:00:55.269	28	f
6r6BCAeSvCMnNWuINxcod0	DJ FRIZER	https://i.scdn.co/image/ab6761610000e5eb84bf2f020ef802724962c5d8	\N	\N	active	2026-03-08 21:00:56.554	2026-03-08 21:00:56.554	\N	1041761	8197	phonk,brazilian phonk	2026-03-08 21:00:56.552	56	f
6LaVVeak29aEvfZRe0LeZM	DJ WN DA ZL	https://i.scdn.co/image/ab67616d0000b2739d7879987bff49853c69408a	\N	\N	active	2026-03-08 21:00:56.732	2026-03-08 21:00:56.732	\N	10620	681	brazilian phonk	2026-03-08 21:00:56.731	17	f
2kNYL2JYHSNC4CcAhFLmv1	DJ WN DA ZL	https://i.scdn.co/image/ab67616d0000b2739d30e27d96608fdcd356d1b5	\N	\N	active	2026-03-08 21:00:57.979	2026-03-08 21:00:57.979	\N	1944	38	\N	2026-03-08 21:00:57.978	7	f
0UU33EaoXPdJmS3n4UqkMB	CRXSXDE	https://i.scdn.co/image/ab6761610000e5eb07c0727bc51016cb49c02495	\N	\N	active	2026-03-08 21:00:58.025	2026-03-08 21:00:58.025	\N	114628	1920	\N	2026-03-08 21:00:58.023	37	f
4R9PzNRzLax8kYg4FBFW9v	N1KE	https://i.scdn.co/image/ab6761610000e5eb7ddef291b2ca86d66ff9afe1	\N	\N	active	2026-03-08 21:00:59.474	2026-03-08 21:00:59.474	\N	10196	448	\N	2026-03-08 21:00:59.473	14	f
7srge3YZhsbYJDADQ3hNAh	C3N6	https://i.scdn.co/image/ab6761610000e5eb83449acf4da43323fbb1dbfa	\N	\N	active	2026-03-08 21:00:59.483	2026-03-08 21:00:59.483	\N	43647	10015	brazilian phonk,phonk	2026-03-08 21:00:59.482	27	f
4u8I7U2aikV5cFNNgkFspb	Serhat Kanat	https://i.scdn.co/image/ab6761610000e5ebb47498d7985f08981a6c9d1a	\N	\N	active	2026-03-08 21:01:00.721	2026-03-08 21:01:00.721	\N	653	418	\N	2026-03-08 21:01:00.72	5	f
3yiG6mZEIkR6tCVm27zR8M	MC Luana SP	https://i.scdn.co/image/ab6761610000e5eb4189a2f735d85d0eba83db4c	\N	\N	active	2026-03-08 21:01:00.8	2026-03-08 21:01:00.8	\N	373452	3977	funk bruxaria,funk carioca	2026-03-08 21:01:00.799	42	f
3OeZMNhadN6lQLzCZj36Co	Frnc$	https://i.scdn.co/image/ab6761610000e5ebc4bc97eb007f5425c03abe9f	\N	\N	active	2026-03-08 21:01:01.852	2026-03-08 21:01:01.852	\N	27760	459	brazilian phonk	2026-03-08 21:01:01.851	21	f
2Kh25suyWxMoKhr8myU6qT	VA	https://i.scdn.co/image/ab6761610000e5ebfb01195a0223393dc6a8958a	\N	\N	active	2026-03-08 21:01:02.126	2026-03-08 21:01:02.126	\N	525	94	\N	2026-03-08 21:01:02.125	3	f
2N8joKKxKZgfI1KzoTE32s	NIC4TE	https://i.scdn.co/image/ab6761610000e5ebecc36fd3b091ee47d26708e8	\N	\N	active	2026-03-08 21:01:03.351	2026-03-08 21:01:03.351	\N	673	204	rally house	2026-03-08 21:01:03.35	4	f
54gsrh6DBME953Fpy8ehiL	PlayaBlaster	https://i.scdn.co/image/ab6761610000e5eb98f6ba50e8c3708f16397146	\N	\N	active	2026-03-08 21:01:03.565	2026-03-08 21:01:03.565	\N	715	175	rally house	2026-03-08 21:01:03.563	4	f
7omIFZwIkStG7uBV0YvUOo	emirhxn	https://i.scdn.co/image/ab6761610000e5eb36e910a51c3e8ad3e7875dda	\N	\N	active	2026-03-08 21:01:05.062	2026-03-08 21:01:05.062	\N	25201	1170	\N	2026-03-08 21:01:05.06	21	f
6Js6q2eytf3lr0kscLwQLr	C4ELUM	https://i.scdn.co/image/ab6761610000e5eb4cc68d98eb4b25c8da8d57ac	\N	\N	active	2026-03-08 21:01:05.188	2026-03-08 21:01:05.188	\N	185505	1700	phonk	2026-03-08 21:01:05.187	40	f
5JtqySd5P0rQkyiP1VJNY4	LXRD EGOISTA	https://i.scdn.co/image/ab6761610000e5ebc658c87aa81a1e3ab31e3bd3	\N	\N	active	2026-03-08 21:01:06.532	2026-03-08 21:01:06.532	\N	48436	1346	\N	2026-03-08 21:01:06.53	29	f
64Dm5t28gM3cFboYRoyXx3	Fxcklosbicos	https://i.scdn.co/image/ab6761610000e5eb4e2f39807b12e2072513424d	\N	\N	active	2026-03-08 21:01:06.723	2026-03-08 21:01:06.723	\N	25532	3388	\N	2026-03-08 21:01:06.722	21	f
3cxlQ0Uewom7A5991BxLrs	SHYX	https://i.scdn.co/image/ab6761610000e5eb39c91d091fb3466cf22f0598	\N	\N	active	2026-03-08 21:01:08.07	2026-03-08 21:01:08.07	\N	46367	2810	brazilian phonk,phonk	2026-03-08 21:01:08.067	26	f
1J4Pgh45jPSztpKaYf28IU	Sesmxc	https://i.scdn.co/image/ab6761610000e5eb82c4ed371887bad46a3d6f1a	\N	\N	active	2026-03-08 21:01:08.111	2026-03-08 21:01:08.111	\N	319	51	brazilian phonk	2026-03-08 21:01:08.11	1	f
6Zx7LVroSu8P7ZOaYN1N26	orkxn	https://i.scdn.co/image/ab6761610000e5eb94584923634a0f42f67b3c12	\N	\N	active	2026-03-08 21:01:09.166	2026-03-08 21:01:09.166	\N	10009	121	brazilian phonk	2026-03-08 21:01:09.165	15	f
6ghX1w9BWeRwePfrU7CHDY	Zalwana	https://i.scdn.co/image/ab6761610000e5ebcf52c12611462020f285086e	\N	\N	active	2026-03-08 21:01:09.465	2026-03-08 21:01:09.465	\N	269	226	\N	2026-03-08 21:01:09.464	4	f
1JZl3ouvyXBttMXp0S1CxR	crowlys	https://i.scdn.co/image/ab6761610000e5eb0c1abe4332478d4c38b3a4ec	\N	\N	active	2026-03-08 21:01:10.68	2026-03-08 21:01:10.68	\N	24	24	\N	2026-03-08 21:01:10.663	0	f
0jqTwXrRNHAazdLpGZPAbO	S3XIN	https://i.scdn.co/image/ab6761610000e5ebacb27fc8ca179ea6861dacac	\N	\N	active	2026-03-08 21:01:10.724	2026-03-08 21:01:10.724	\N	11034	1720	brazilian phonk,phonk	2026-03-08 21:01:10.722	16	f
3FYvJvCdMjMJbpKevAWRD1	Giyumito	https://i.scdn.co/image/ab6761610000e5ebef80d735584763592f2e59a9	\N	\N	active	2026-03-08 21:01:11.818	2026-03-08 21:01:11.818	\N	6039	2290	\N	2026-03-08 21:01:11.817	13	f
1nzIoHG5B7klgAPdwjqRDj	MC LONE	https://i.scdn.co/image/ab6761610000e5ebd64f5e89c4783b6b679521c5	\N	\N	active	2026-03-04 20:44:59.395	2026-03-08 21:01:11.924	\N	2290642	28324	phonk,brazilian phonk	2026-03-08 21:01:11.922	56	f
1lDzPdaXBLpD4PQhz1BVDZ	jjZIIIK	https://i.scdn.co/image/ab6761610000e5eb26b94d6cb0faa65a539a5737	\N	\N	active	2026-03-08 21:01:13.009	2026-03-08 21:01:13.009	\N	83289	433	phonk,brazilian phonk	2026-03-08 21:01:13.005	32	f
6pSimfu6LjnKpyGp21DfNx	Nexjian	https://i.scdn.co/image/ab6761610000e5ebded8b4191dfafd37405bc16c	\N	\N	active	2026-03-08 21:01:13.215	2026-03-08 21:01:13.215	\N	14	23	\N	2026-03-08 21:01:13.214	0	f
4ImTKqVizHcoMSabJSYUUd	Mikel Deinielle	https://i.scdn.co/image/ab6761610000e5eb894d5201cd7a1b944921ca2d	\N	\N	active	2026-03-08 21:01:14.333	2026-03-08 21:01:14.333	\N	21383	5432	brazilian phonk	2026-03-08 21:01:14.327	22	f
2KQL6GwvxSKudMNOYXosgh	nohøpless	https://i.scdn.co/image/ab6761610000e5eb0709f51c0ffb8de6febae5e5	\N	\N	active	2026-03-08 21:01:14.439	2026-03-08 21:01:14.439	\N	10725	90	drift phonk	2026-03-08 21:01:14.438	16	f
5hhGRImEQUVLGGK6kXH6IW	krush!	https://i.scdn.co/image/ab6761610000e5ebfe6a4c39f0d09077fb20c1fd	\N	\N	active	2026-03-08 21:01:15.201	2026-03-08 21:01:15.201	\N	64669	1251	jersey club	2026-03-08 21:01:15.2	28	f
2TFvXvSjQQE2k66UqQaUu0	YØUNG PHØNK	https://i.scdn.co/image/ab6761610000e5eb78a8861f9ff4a00c122b7279	\N	\N	active	2026-03-08 21:01:15.449	2026-03-08 21:01:15.449	\N	6628	1002	\N	2026-03-08 21:01:15.443	14	f
5I9zgK6oqzspM98XVV7mX5	HERMVXAL	https://i.scdn.co/image/ab6761610000e5ebc260bd085036e93de2c19bdf	\N	\N	active	2026-03-08 21:01:16.796	2026-03-08 21:01:16.796	\N	696	268	\N	2026-03-08 21:01:16.795	5	f
1pKN9cQE0DUMTaVjK3GDer	DJ SicaRio	https://i.scdn.co/image/ab6761610000e5eb84308521f6ed2811e5fed12c	\N	\N	active	2026-03-08 21:01:16.888	2026-03-08 21:01:16.888	\N	8472	139	\N	2026-03-08 21:01:16.887	14	f
46rrLekDLMkLlqjKcKlRjF	dj ditinho original	https://i.scdn.co/image/ab67616d0000b2738a26ccba8d1cec1eea553eab	\N	\N	active	2026-03-08 21:01:17.921	2026-03-08 21:01:17.921	\N	7	3	\N	2026-03-08 21:01:17.917	0	f
5yQ9nLSyfsWBHgGitXUgI6	DJ Igor da ZL	https://i.scdn.co/image/ab67616d0000b2738a26ccba8d1cec1eea553eab	\N	\N	active	2026-03-08 21:01:18.219	2026-03-08 21:01:18.219	\N	15	7	\N	2026-03-08 21:01:18.218	0	f
3AFAHn97pYdoN04JQmiU9L	$TRANDED	https://i.scdn.co/image/ab6761610000e5ebc6ef83e941eb7aa767a4dc4f	\N	\N	active	2026-03-08 21:01:19.258	2026-03-08 21:01:19.258	\N	10584	762	brazilian phonk,phonk	2026-03-08 21:01:19.257	15	f
5ujvUnyWSyn55iavLm4gmO	DJ Lucca 01	https://i.scdn.co/image/ab6761610000e5ebe27bcaef47c160022e51cc85	\N	\N	active	2026-03-08 21:01:19.515	2026-03-08 21:01:19.515	\N	209867	4196	phonk,brazilian phonk	2026-03-08 21:01:19.514	43	f
2dI2HO9HTC4ncZX4eSWBqo	Badola	https://i.scdn.co/image/ab6761610000e5eb991b77c6ca7c783b084501de	\N	\N	active	2026-03-08 21:01:20.358	2026-03-08 21:01:20.358	\N	333948	248	funk bruxaria,phonk,brazilian phonk	2026-03-08 21:01:20.357	43	f
7MRnU6jGSb7wmPPN2elcAZ	e9cx	https://i.scdn.co/image/ab6761610000e5ebea54825e349af85873317177	\N	\N	active	2026-03-08 21:01:20.87	2026-03-08 21:01:20.87	\N	171701	1734	phonk,brazilian phonk	2026-03-08 21:01:20.869	38	f
0RIxb6yWBOE3yGMYOk4GBf	Mc 4R	https://i.scdn.co/image/ab6761610000e5ebf8fdf429d7cd20e0dea36b76	\N	\N	active	2026-03-08 21:01:21.987	2026-03-08 21:01:21.987	\N	340058	3328	funk bruxaria	2026-03-08 21:01:21.985	42	f
0dvtLRu7WVJfrOPyzyh0xV	SPIXLEX	https://i.scdn.co/image/ab6761610000e5eb491cf64e231d367a05402b34	\N	\N	active	2026-03-08 21:01:22.149	2026-03-08 21:01:22.149	\N	71639	944	brazilian phonk,phonk	2026-03-08 21:01:22.144	29	f
2zVtiyn1AJTHZjaGy3fLxo	KXNGSXZE!	https://i.scdn.co/image/ab6761610000e5eb9ddb1d6f425eccbd8e69191f	\N	\N	active	2026-03-08 21:01:23.205	2026-03-08 21:01:23.205	\N	126312	863	brazilian phonk,phonk	2026-03-08 21:01:23.196	34	f
2ggORvovDqjBh2JBoj6UzH	MINXSXL	https://i.scdn.co/image/ab6761610000e5eb4be29a911a896e5f63aff6c0	\N	\N	active	2026-03-08 21:01:23.44	2026-03-08 21:01:23.44	\N	159301	1036	brazilian phonk,phonk	2026-03-08 21:01:23.439	38	f
3XQPFdkxaZvbKP9bfaTwql	Axzured	https://i.scdn.co/image/ab6761610000e5eb550e207f85542e68574a3bc6	\N	\N	active	2026-03-08 21:01:24.436	2026-03-08 21:01:24.436	\N	144946	4376	phonk	2026-03-08 21:01:24.433	39	f
1lwGYXEMwAdAnGSMg2AwUc	prod gomes	https://i.scdn.co/image/ab6761610000e5eb584919afa957a418210d72ac	\N	\N	active	2026-03-08 21:01:24.664	2026-03-08 21:01:24.664	\N	3545	278	\N	2026-03-08 21:01:24.661	9	f
0s0DvJFAQKeusgS4pEy7nE	DJ GVRNVCHI	https://i.scdn.co/image/ab6761610000e5ebb659e4e65655373415a83912	\N	\N	active	2026-03-08 21:01:25.733	2026-03-08 21:01:25.733	\N	7152	222	\N	2026-03-08 21:01:25.732	15	f
5sCC5D4QRUqUzdZm75OtFO	DJ Sylvi	https://i.scdn.co/image/ab67616d0000b273316c8d847cbab4554a3fabc4	\N	\N	active	2026-03-08 21:01:25.852	2026-03-08 21:01:25.852	\N	1211	11	brazilian phonk	2026-03-08 21:01:25.849	7	f
1jQxSJ2pdouWzijTdkWsIQ	Emko	https://i.scdn.co/image/ab6761610000e5ebf7a22f3ea141588858bcf6c0	\N	\N	active	2026-03-08 21:01:27.07	2026-03-08 21:01:27.07	\N	1080	184	\N	2026-03-08 21:01:27.069	6	f
2p1bgggvCXinSQz2OtBHXu	IzRosh	https://i.scdn.co/image/ab6761610000e5eb3fc7363acc4eb62311bb078c	\N	\N	active	2026-03-08 21:01:27.145	2026-03-08 21:01:27.145	\N	794768	35182	jersey club	2026-03-08 21:01:27.144	55	f
\.


--
-- Data for Name: ArtistStatsHistory; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ArtistStatsHistory" (id, "artistId", date, "monthlyListeners", followers, popularity) FROM stdin;
e52f7214-e8a7-4781-809b-9ec2cfce10ab	51K0b3lRd87cKX02hU26we	2026-03-04 20:24:52.417	6055083	18771	64
1af4ee00-cebc-4c64-a0e5-f9d49d2afebf	1RklNDIiYVZ3dYdEUnB0cS	2026-03-04 20:24:52.447	6420710	94936	65
27a71265-ffd0-453a-97ee-9f49c029df8e	1w8PO0gTOOk74D2bH8Bmue	2026-03-04 20:25:02.959	187154	2222	38
69e877a5-eea3-4615-9120-7a2439688560	0EXytqF1qOmpGIVb1AwYdJ	2026-03-04 20:25:02.99	383531	1013	46
6cd214b0-9baf-4da9-b5cd-9f22429ae409	0exQbKNFd9pLmdIGycwmlf	2026-03-04 20:25:13.668	7341842	200288	73
9d76c544-62bf-40b5-b86a-8de50d1621a8	1Sdc6ySbIvzO0X9vbyHzWm	2026-03-04 20:25:13.684	6213887	618522	66
6daedd3d-9765-4254-908c-c24883cc4bc6	4YeITwoqeIks45gELm488B	2026-03-04 20:25:24.36	875189	21416	50
946ef1b4-9e03-4574-9adb-2804a650a5cc	07CoGyrUbcBkSzvs1Kd9i6	2026-03-04 20:25:24.397	639013	15416	48
d6c1a02d-0d88-44e7-8dc4-cc8fa64dacbe	04zt4agcJcyZoHpSs3RnqW	2026-03-04 20:25:35.028	12190	107	18
03846886-8dca-409f-8dcf-7ca93cbc5aa2	2UKmwMB2wMQMvQcduijrQi	2026-03-04 20:25:35.126	19280	808	51
e8dafd2c-5d57-4e8a-be6b-f68b995b685a	51K0b3lRd87cKX02hU26we	2026-03-04 20:25:45.593	6055083	18771	64
6044c960-c24f-4ea0-be5c-b45d8aabcee0	3ysIyoivMDpeqLg0VMRPQw	2026-03-04 20:25:45.666	869725	235427	49
c7377325-e2e8-4a70-ba2c-b21a05306e25	0ypzv0AG6k3yZjNxdhpnJF	2026-03-04 20:25:56.156	1817209	22474	57
aab24dc8-8c53-4594-9ba7-53bd90812969	1RklNDIiYVZ3dYdEUnB0cS	2026-03-04 20:25:56.384	6420710	94936	65
3f276af5-a87b-407e-b401-0216cf11dce5	0DVWkIG75PBtzwbE0Sly8w	2026-03-04 20:26:06.7	111299	2063	36
5a24b413-b228-40d6-8d55-de65c41987e4	1w8PO0gTOOk74D2bH8Bmue	2026-03-04 20:26:06.919	187154	2222	38
b4f41c3b-eeb0-4121-9e9f-f01acdafff10	1RklNDIiYVZ3dYdEUnB0cS	2026-03-04 20:26:17.282	6420710	94936	65
70ded394-8aac-401c-83ee-05a6b0adc633	51K0b3lRd87cKX02hU26we	2026-03-04 20:26:17.696	6055083	18771	64
bbb7547d-dfc7-46f2-a91d-557aa0f5c508	0EXytqF1qOmpGIVb1AwYdJ	2026-03-04 20:26:27.914	383531	1013	46
ba53f9aa-5199-48e9-8ece-3772b2bde86a	1w8PO0gTOOk74D2bH8Bmue	2026-03-04 20:26:28.295	187154	2222	38
47d03868-f222-45f8-ae81-a8442d1ebf8e	0exQbKNFd9pLmdIGycwmlf	2026-03-04 20:26:38.438	7341842	200288	73
4d42f921-d865-40ba-91e0-d1866654ad3f	1Sdc6ySbIvzO0X9vbyHzWm	2026-03-04 20:26:39.178	6213887	618522	66
def90db5-db0b-4e7a-a641-b0bc28536858	02wf6SCDwrs2qTX09X0IRE	2026-03-04 20:26:48.951	9043957	209510	68
74ea85ac-81b9-4bfe-8edc-2b0b2dcb8141	4YeITwoqeIks45gELm488B	2026-03-04 20:26:49.814	875189	21416	50
b5a9976f-bf90-4164-84bc-b4a05183e59f	4hDC6zuK2V5qwyeJcydSPS	2026-03-04 20:26:59.437	498796	3277	44
521781fd-55bd-4377-aa82-c324fef3e98d	07CoGyrUbcBkSzvs1Kd9i6	2026-03-04 20:27:00.538	639013	15416	48
4393e2b4-e215-4704-b8a5-70f286760884	6qVUFaRkVzdtF9Wg0vxeKH	2026-03-04 20:27:10.019	60844	2873	29
5bf384c4-0445-4812-8377-8e69001051fd	2UKmwMB2wMQMvQcduijrQi	2026-03-04 20:27:11.079	19280	808	51
bf532441-28a5-4fd2-bc8b-b993296eb746	6JvsRSaeBQIAb6LYyNCBht	2026-03-04 20:27:20.512	28542	160	25
7977e5d0-13b7-417f-b0f2-55defe7310b1	0EXytqF1qOmpGIVb1AwYdJ	2026-03-04 20:27:21.766	383531	1013	46
3b01dd2a-30be-4e85-aed4-832b18a96909	53yzF4tOwqwPwwkdo70fmL	2026-03-04 20:27:31.057	167344	439	37
fd06b94b-f11f-4e52-9cc3-7242e43b1842	0exQbKNFd9pLmdIGycwmlf	2026-03-04 20:27:32.276	7341842	200288	73
aff58163-35e8-45f1-9073-f00085e7a955	5xyNvcWaZKre83tW46w5Jp	2026-03-04 20:27:41.615	17453	356	22
0274f97e-2522-4496-b7b8-6ee8cf8e8791	7drEn5GMrJRJhb3dy0LxSR	2026-03-04 20:27:42.837	283772	6297	43
33d52991-4d28-4172-9904-f0cfd14354da	1Sdc6ySbIvzO0X9vbyHzWm	2026-03-04 20:27:52.233	6213887	618522	66
3496a306-acde-4d68-a3d8-441a91495dc1	4thCAXlpGSQSUe13fvzjrA	2026-03-04 20:27:53.57	658006	7646	46
5f64d9fd-a76f-4217-b784-ecf2d1342139	4YeITwoqeIks45gELm488B	2026-03-04 20:28:02.782	875189	21416	50
5fefe743-a232-4c7a-bfd2-f55a255c8aca	04zt4agcJcyZoHpSs3RnqW	2026-03-04 20:28:04.118	12190	107	18
a820b21e-5b95-4f0b-80da-0f242cf4ca50	5mU6enX6pYYKEs0zfRkm1R	2026-03-04 20:28:13.551	2505524	52171	59
49b73fe0-aa7a-4729-af4e-039c64df7676	3ysIyoivMDpeqLg0VMRPQw	2026-03-04 20:28:14.636	869725	235427	49
0b053357-cc1a-46af-90d9-f045a428a10c	5uDZGPzOYAzfOhw1lxmhwL	2026-03-04 20:28:24.189	61955	487	28
13e84855-3cd8-4fe2-a321-f770070c93f1	07CoGyrUbcBkSzvs1Kd9i6	2026-03-04 20:28:25.333	639013	15416	48
11ee8e51-e8ab-43f8-b3e4-6d45bf5f0457	6E7d0UydWwTMqxXzNRdp78	2026-03-04 20:28:34.994	1393427	6155	55
a7540578-9505-4fee-95b0-af30c982f708	2UKmwMB2wMQMvQcduijrQi	2026-03-04 20:28:35.898	19280	808	51
911c846c-070a-4c5b-8d63-6f6f26b14d1c	4JQGeB5BANQdgSABnKHBVY	2026-03-04 20:28:45.653	438243	3476	45
7f2abc63-4016-4a29-9154-f462b3f2593c	0ypzv0AG6k3yZjNxdhpnJF	2026-03-04 20:28:46.435	1817209	22474	57
36d0d19f-91f1-4427-8785-6535f6bffc56	0NakXcxWSSLTMHvJsDWPVC	2026-03-04 20:28:56.458	288670	3206	42
d4d6a4d6-f301-4cdd-8ef0-e8780966e47d	0DVWkIG75PBtzwbE0Sly8w	2026-03-04 20:28:57.025	111299	2063	36
0f206652-13ed-4d59-bd8f-fd19c564e024	5ldM1bXOYDVjt8Q9QWB1Uv	2026-03-04 20:29:07.117	67062	2068	30
b8a98c68-8bde-4587-9c87-9f8ab5e55c5c	04zt4agcJcyZoHpSs3RnqW	2026-03-04 20:29:07.786	12190	107	18
ebd4c967-8893-479b-87d3-6c6e5faae9da	02wf6SCDwrs2qTX09X0IRE	2026-03-04 20:29:17.831	9043957	209510	68
c59e209b-b0ae-499f-b58b-66cb9b543f9b	3ysIyoivMDpeqLg0VMRPQw	2026-03-04 20:29:18.458	869725	235427	49
15aa7aa8-2727-4773-bdd6-2580db3f485e	4hDC6zuK2V5qwyeJcydSPS	2026-03-04 20:29:28.358	498796	3277	44
226b247c-b9c5-420e-a6d7-409e187e9fb4	7Kf6LvyojtWsyXbEEU7yIF	2026-03-04 20:29:29.301	93040	3299	32
b4cffa96-9392-48ee-b641-d825acedc85e	0ypzv0AG6k3yZjNxdhpnJF	2026-03-04 20:29:39.134	1817209	22474	57
d6d67c53-ee74-4010-92d5-eff30401c773	164O6SBXwBBGLV2P809KUS	2026-03-04 20:29:40.088	2484839	32498	58
24b4f63b-dd3c-42f2-94c4-d6b6736e78e6	0DVWkIG75PBtzwbE0Sly8w	2026-03-04 20:29:49.6	111299	2063	36
bc88a813-c831-487e-abd0-b05eb912436c	6qVUFaRkVzdtF9Wg0vxeKH	2026-03-04 20:29:50.654	60844	2873	29
959a47ab-3c8a-4637-a12f-95a6c0a984b1	02wf6SCDwrs2qTX09X0IRE	2026-03-04 20:30:00.159	9043957	209510	68
b9d5364c-a4ac-4b62-8c55-1aede71df953	6JvsRSaeBQIAb6LYyNCBht	2026-03-04 20:30:01.178	28542	160	25
14986c2e-dae4-4c1d-8226-360cece8721e	53yzF4tOwqwPwwkdo70fmL	2026-03-04 20:30:10.834	167344	439	37
5a283e52-a9a6-4bac-a08c-01dd13766a3d	1PvcWjADPMezv8CTyJO9Uk	2026-03-04 20:30:12.137	1393036	49962	54
052c2d96-e223-4139-acdd-3712a3bf00bd	5xyNvcWaZKre83tW46w5Jp	2026-03-04 20:30:21.367	17453	356	22
e85a41f3-24f2-4a93-9636-5aeea874ab64	2PpXe1ZQ4tmhWVWaJVCxfK	2026-03-04 20:30:22.893	31596	544	23
4f64cf56-e228-431b-bedd-bfb57fe5eb3b	1o2FbPtsJOONvAlInXNwYo	2026-03-04 20:30:32.072	212620	1488	39
e1d8ec32-119e-450b-9a9b-ccdd32a989db	4hDC6zuK2V5qwyeJcydSPS	2026-03-04 20:30:33.624	498796	3277	44
cdfee688-e23f-4aba-a393-6214e085c35c	7ByARkW6MwBGBC6ak72wPN	2026-03-04 20:30:43.177	198915	1313	38
4f08a42d-d650-4f5d-af42-80ea45a7005f	7drEn5GMrJRJhb3dy0LxSR	2026-03-04 20:30:44.758	283772	6297	43
533c9124-99ba-4697-8fc9-ce58142ecf70	6qVUFaRkVzdtF9Wg0vxeKH	2026-03-04 20:30:54.177	60844	2873	29
e0b8bbcc-81fa-46df-abe0-9e30560d21fd	4thCAXlpGSQSUe13fvzjrA	2026-03-04 20:30:55.392	658006	7646	46
b4c1d247-cff5-471d-8a71-dbb948a591df	6JvsRSaeBQIAb6LYyNCBht	2026-03-04 20:31:04.77	28542	160	25
49c78a8f-b9d3-4168-ad5c-4a2957eb0ad4	3f8c42vQhwylI4lWCC6ARZ	2026-03-04 20:31:06.3	141590	3692	36
a91b1c62-7a9c-46ca-b5d5-87128e94b952	5mU6enX6pYYKEs0zfRkm1R	2026-03-04 20:31:15.294	2505524	52171	59
d083c012-579f-497c-bbba-6a96cf1b4cc7	0OTjk4QUX6zTvaZy6XOooY	2026-03-04 20:31:17.205	164527	1905	36
b2a48dda-3b2a-4952-adc0-2c0fa6895a06	5uDZGPzOYAzfOhw1lxmhwL	2026-03-04 20:31:25.901	61955	487	28
a6f92e74-f28d-4765-bd9e-b98dfd6065fa	53yzF4tOwqwPwwkdo70fmL	2026-03-04 20:31:27.832	167344	439	37
77448fb8-09f1-4579-b95f-1944329feaf9	51K0b3lRd87cKX02hU26we	2026-03-04 20:38:32.55	6055083	18771	64
122a6593-4f89-45f8-a4ad-c81dd8743489	1RklNDIiYVZ3dYdEUnB0cS	2026-03-04 20:38:32.562	6420710	94936	65
13140e09-874a-4f10-a45b-f98d439ba043	1w8PO0gTOOk74D2bH8Bmue	2026-03-04 20:38:43.18	187154	2222	38
bbb3392a-5b95-4e64-a63c-f88387217134	0EXytqF1qOmpGIVb1AwYdJ	2026-03-04 20:38:43.23	383531	1013	46
f8a99e96-deb7-4073-b4d8-6ab8d2c087e3	1Sdc6ySbIvzO0X9vbyHzWm	2026-03-04 20:38:53.896	6213887	618522	66
4a9e330e-1a49-414f-888a-3b30ac164964	0exQbKNFd9pLmdIGycwmlf	2026-03-04 20:38:53.912	7341842	200288	73
044d2e9e-b0a8-484a-a422-f65d6cc9dc50	4YeITwoqeIks45gELm488B	2026-03-04 20:39:04.529	875189	21416	50
b6f29c8d-c695-445d-b77f-1ad221af0089	07CoGyrUbcBkSzvs1Kd9i6	2026-03-04 20:39:04.565	639013	15416	48
d6107ae6-477f-42f2-8d9b-a7e19eb5fa25	2UKmwMB2wMQMvQcduijrQi	2026-03-04 20:39:15.216	19280	808	51
e91dfee9-b53f-4a61-aaee-ab2d1489fa33	04zt4agcJcyZoHpSs3RnqW	2026-03-04 20:39:15.217	12190	107	18
c837bb8d-85a8-485a-9a9d-7e4830c862b0	0ypzv0AG6k3yZjNxdhpnJF	2026-03-04 20:39:25.793	1817209	22474	57
192d3ed3-7ef0-49e4-96f2-3ecf33353c8f	3ysIyoivMDpeqLg0VMRPQw	2026-03-04 20:39:25.809	869725	235427	49
1dbd80c0-1833-4c71-b84f-741c92b1e2e3	0DVWkIG75PBtzwbE0Sly8w	2026-03-04 20:39:36.422	111299	2063	36
2a55556f-b501-4435-a5bb-67465107da07	02wf6SCDwrs2qTX09X0IRE	2026-03-04 20:39:36.481	9043957	209510	68
73a40094-4466-4b75-b990-09a51e3cfe76	6qVUFaRkVzdtF9Wg0vxeKH	2026-03-04 20:39:47.055	60844	2873	29
ebb5552e-c9aa-49a2-8bd1-9a3c259237dc	4hDC6zuK2V5qwyeJcydSPS	2026-03-04 20:39:47.089	498796	3277	44
69e2fe09-e82a-49b6-81ec-d8ddf887e1b4	53yzF4tOwqwPwwkdo70fmL	2026-03-04 20:39:57.58	167344	439	37
64813daf-d8ba-41e5-9817-2b813ee69407	6JvsRSaeBQIAb6LYyNCBht	2026-03-04 20:39:57.627	28542	160	25
e13b8913-0085-47c4-8cdf-01aeca80be3e	7drEn5GMrJRJhb3dy0LxSR	2026-03-04 20:40:08.274	283772	6297	43
9d23d0ea-9ae4-4ae8-a055-165fb7bdc16c	5xyNvcWaZKre83tW46w5Jp	2026-03-04 20:40:08.308	17453	356	22
6ad8fabb-0f37-41bd-ae7c-37f8d8893656	4thCAXlpGSQSUe13fvzjrA	2026-03-04 20:40:18.949	658006	7646	46
9b3e6a5d-efa9-480d-b500-3def8eacb330	5mU6enX6pYYKEs0zfRkm1R	2026-03-04 20:40:18.949	2505524	52171	59
795a7d88-a512-4506-aedd-0d55bee04daa	5uDZGPzOYAzfOhw1lxmhwL	2026-03-04 20:40:29.581	61955	487	28
559c6937-ba38-4020-943a-b3b58d4e2b5e	6E7d0UydWwTMqxXzNRdp78	2026-03-04 20:40:29.669	1393427	6155	55
8504ea7f-3bef-43d0-8f69-5ee43fc7a7af	4JQGeB5BANQdgSABnKHBVY	2026-03-04 20:40:40.262	438243	3476	45
244b242c-171b-4f66-8b79-1069efff1503	0NakXcxWSSLTMHvJsDWPVC	2026-03-04 20:40:40.293	288670	3206	42
d73bc009-6e3f-4e50-a688-3c60ef70b9c4	5ldM1bXOYDVjt8Q9QWB1Uv	2026-03-04 20:40:50.899	67062	2068	30
eedcf499-41ea-4973-9b88-10638c4e668c	7Kf6LvyojtWsyXbEEU7yIF	2026-03-04 20:40:50.94	93040	3299	32
3a09b540-9db6-4d93-8019-9c8c2b37bf76	1PvcWjADPMezv8CTyJO9Uk	2026-03-04 20:41:01.517	1393036	49962	54
43e60d86-0238-4c24-b670-018a99236a5f	164O6SBXwBBGLV2P809KUS	2026-03-04 20:41:01.588	2484839	32498	58
b2d006fa-ed03-4faa-a3d6-6617836d555b	1o2FbPtsJOONvAlInXNwYo	2026-03-04 20:41:12.182	212620	1488	39
2575d61e-c31f-4d99-9793-02fbc201d38c	2PpXe1ZQ4tmhWVWaJVCxfK	2026-03-04 20:41:12.301	31596	544	23
0fa2aecf-75a2-441f-a356-9c357bb3d1c5	3f8c42vQhwylI4lWCC6ARZ	2026-03-04 20:41:22.94	141590	3692	36
0c7a33ef-be7f-479a-b5ac-1d319f7415d0	7ByARkW6MwBGBC6ak72wPN	2026-03-04 20:41:22.967	198915	1313	38
810cb41b-0be7-4f35-9919-0d8505c541d3	0OTjk4QUX6zTvaZy6XOooY	2026-03-04 20:41:33.549	164527	1905	36
ba411ea4-bf8a-42e7-8921-dbc78904f93e	2EOtEHNNR9N1dP5J2I1cHo	2026-03-04 20:41:33.683	1223153	17244	51
d13504ed-b9d2-4cfe-8cdb-d3d2c0adae61	1QYXUjQBqVpFKlxfrYsk4h	2026-03-04 20:41:44.424	526672	13505	50
ed7acb0e-40a6-47ea-a591-c1ed339c149e	62vwt2P3iBw4NwHdDZb27q	2026-03-04 20:41:44.513	8577840	78302	69
b3cf590a-26f8-4a6e-8253-529e3344379e	4czULjQ9jyER349yjpYYcS	2026-03-04 20:41:55.117	308124	2305	41
7bb687c1-d546-4b37-85a3-a0c36d260aad	1nIwABuN4D2w2SaE4ML7OA	2026-03-04 20:41:55.234	187122	2520	38
358f660c-897b-4a4c-827c-f09fbfa6c207	4WBFx3Wen7AY4vlMffuZTO	2026-03-04 20:42:06.1	5673	266	13
2101ea0e-3414-49d8-a6a3-fa3c8f25f344	2dVJkcQL5tMX02UH56iTo1	2026-03-04 20:42:06.155	230	18	1
3cfd2d6b-13ae-4609-ad8d-6b6ef09b586e	30S401kK22I3HKdI2uHZgp	2026-03-04 20:42:16.816	9657	912	17
d4d9e8b9-1714-4785-9e21-390e0ac25a47	6I1Xg3EHFdDmWqy7UPmqKb	2026-03-04 20:42:16.947	28690	79	21
7dfe4ff7-bde2-47e3-94b1-7c0bf145736b	5tvPbCrx8LMaL9Zby5e7c2	2026-03-04 20:42:27.739	3949208	172520	62
704429d0-13a8-4c91-af89-abf5274fe5df	3eZBjp3ibCgDuKzo3PA8vh	2026-03-04 20:42:27.78	67771	364	31
c52412bc-deea-48bc-8ca5-79bd57ab1c94	4xLBtr9d1JOwYvW39g2mUl	2026-03-04 20:42:38.608	898042	4029	50
7d327fdb-07ef-4b51-9d8a-e0c08c1ed17d	7FgaWBwYSxy5cywT6XOPdt	2026-03-04 20:42:38.632	64027	2546	30
48453b05-ee10-4d58-818e-2cd265c7a403	5w4mniCcdjpn4yTHlPfniW	2026-03-04 20:42:49.401	49438	1917	30
fd2921fa-1aec-4122-ba43-9f3344f03941	514Qze5V7AvD6wVSwdQB8Y	2026-03-04 20:42:49.437	123212	8365	32
3e9eab05-e6c8-464d-bf2a-31b158421229	03pt9mCEKaO0GepoXTV5uZ	2026-03-04 20:43:00.169	57959	460	27
ddd74a68-1fbd-4266-ab08-6350643ffe56	7lAaAGxYxk2GH8cMbTEwAL	2026-03-04 20:43:00.202	5653317	216640	65
16098dee-6d54-47f9-b1d2-e33eb1770089	1yevH7mkPMXeSTnA9SwHvq	2026-03-04 20:43:11.102	6776910	93152	72
9509cd7d-d841-45ac-94ff-59f943b2d5cb	60J22gmJOU5t1n8NmW0XSK	2026-03-04 20:43:11.123	43259	1388	24
d5321fad-698c-48d2-a7db-7ee608e8dd8e	5dDNNq04RjKXFOADdHd6VX	2026-03-04 20:43:21.883	9225877	296219	71
644da12a-8460-4ae9-9713-46b93add346f	4PMSwT0eBQfWB3cjH4t30s	2026-03-04 20:43:21.901	47730	2512	27
660be0ba-bcd8-4d18-a2cd-9a32c7e0d68d	1Zg2f2iwwB2bfxtKPkb4eI	2026-03-04 20:43:32.563	3201	409	9
44a70546-1a8f-4018-9aa7-5c23c8a61580	57ukrt4OCWcR4HL9sStvKW	2026-03-04 20:43:32.653	25206	950	21
c6f29f7b-f144-44f5-b856-56825d8b5d7d	2bXiTuKR1AMkSvmgh60706	2026-03-04 20:43:43.297	58205	3686	28
df8d22c0-6b55-42be-a58a-5edc3ddaee96	0x9bzpifUdZFBQw7R1UWPT	2026-03-04 20:43:43.48	722496	9869	47
7cc1a85b-9ebd-4eca-913b-5bf3897edf64	3FUCRB0hJhe9BrXW1yonDh	2026-03-04 20:43:54.351	1771511	14821	56
9dc292df-a871-47c5-b2ad-25aba0448260	70bgV7fa5H6sTah58wm73l	2026-03-04 20:43:54.446	277235	3970	40
62c49c3e-fbd6-481b-b108-e2524dc25329	5dt5VvKgK1bVZodVPnx7AI	2026-03-04 20:44:05.124	540063	2021	46
55f12224-c11e-4754-844c-04eb6f6cd5e3	2Wt4l7cu2A5QctQ04QCR6S	2026-03-04 20:44:05.292	224176	2198	40
bfa901ff-b653-450b-bdd8-a27561fe1396	50LbWtqqQeduRjJHLuwQed	2026-03-04 20:44:16.077	1716618	32900	57
0911c1f4-3a9c-4ca0-a89c-be9681ac8fc1	6Gr49ikaor5MuFQPBlOZ29	2026-03-04 20:44:16.126	480869	1428	45
2afe3c8f-2c47-437d-8778-0ad2779d09b1	5bePP411ITzZyWf1QZ2SX4	2026-03-04 20:44:26.99	4929479	131972	66
eb49b040-2848-4287-b958-685eaa7f6de4	2sQHo73pQF1OTq3lDuQhlO	2026-03-04 20:44:27.007	4258234	61204	60
c42ce24c-e91c-408e-9f16-b7dd3d7e73ab	2nIlwjrcU54whF2MWBcJSu	2026-03-04 20:44:37.734	4804	90	10
6a73f638-0f8a-42a7-b537-f5d7b2398e08	4bcHlUu9N2JzWzpz3kpzzy	2026-03-04 20:44:37.771	181879	17450	38
1327aad3-a0aa-415e-9ff3-30f817dd2451	1mEkCpjXPIymCGkKCJzcl5	2026-03-04 20:44:48.599	198831	1416	40
0e6ba3ba-1b50-476f-be0b-850b5a002d02	30vnw2IDoHflDzAn9DpqLf	2026-03-04 20:44:48.611	49905	1222	26
5af2de0f-aa5c-4f2d-a600-e2e869f4d644	3iG3DOwDRNNcU4SD26P0qp	2026-03-04 20:44:59.298	202820	8604	38
aee438da-26d4-40f9-a500-68fc84ef676a	1nzIoHG5B7klgAPdwjqRDj	2026-03-04 20:44:59.398	2250604	28219	56
02f06728-3f5c-419e-bda2-61e1721a6731	4hV3aU0WKvFaiX5ugXP5hp	2026-03-04 20:45:10.102	3206863	112199	59
90135caf-6ae8-4090-8f00-43be8fe6acc3	1RklNDIiYVZ3dYdEUnB0cS	2026-03-04 21:00:12.267	6420710	94936	65
66e34567-90fd-4af0-ad87-1fca10b3cf8a	51K0b3lRd87cKX02hU26we	2026-03-04 21:00:12.287	6055083	18771	64
05f41fc5-4cf4-4ed9-a2da-7968cb8b3b4e	1w8PO0gTOOk74D2bH8Bmue	2026-03-04 21:00:22.966	187154	2222	38
b109aa5a-b74a-4dda-81ae-259f8fe3325d	0EXytqF1qOmpGIVb1AwYdJ	2026-03-04 21:00:22.991	383531	1013	46
92a84b28-993d-49e4-9acb-69668904c4ff	1Sdc6ySbIvzO0X9vbyHzWm	2026-03-04 21:00:33.652	6213887	618522	66
553208e3-dffd-4bc1-abb3-4f428c4adbbb	0exQbKNFd9pLmdIGycwmlf	2026-03-04 21:00:33.736	7341842	200288	73
308a4159-2458-4525-8fa6-f20d7d3a3fa7	07CoGyrUbcBkSzvs1Kd9i6	2026-03-04 21:00:44.394	639013	15416	48
897b525e-3600-48d7-a6aa-a513087e8f95	4YeITwoqeIks45gELm488B	2026-03-04 21:00:44.447	875189	21416	50
300daa2d-0bfd-4123-a32c-c9eb55dac430	04zt4agcJcyZoHpSs3RnqW	2026-03-04 21:00:55.139	12190	107	18
af94d667-9bb5-4c7c-bdf4-bd19d2d8715a	2UKmwMB2wMQMvQcduijrQi	2026-03-04 21:00:55.146	19280	808	51
dcd6d7e9-b76e-4aa5-8eec-c98c48acc3b0	0ypzv0AG6k3yZjNxdhpnJF	2026-03-04 21:01:05.792	1817209	22474	57
33523bf3-550e-430d-887e-2073f51ca6f8	3ysIyoivMDpeqLg0VMRPQw	2026-03-04 21:01:05.886	869725	235427	49
f4e3600e-4f23-4cfb-9bf3-3ab370c9f29a	0DVWkIG75PBtzwbE0Sly8w	2026-03-04 21:01:16.48	111299	2063	36
1b84019c-9d4c-46ab-8686-3a6fe4618bb3	02wf6SCDwrs2qTX09X0IRE	2026-03-04 21:01:16.504	9043957	209510	68
494d9fcb-289f-41d7-9371-2565b9f77faa	4hDC6zuK2V5qwyeJcydSPS	2026-03-04 21:01:27.224	498796	3277	44
f39b1ea0-6d96-45fa-b27c-08794d3411a6	6qVUFaRkVzdtF9Wg0vxeKH	2026-03-04 21:01:27.275	60844	2873	29
4195d05e-5f59-44cd-873a-fa3511c4a8d5	6JvsRSaeBQIAb6LYyNCBht	2026-03-04 21:01:37.874	28542	160	25
e8e3d897-5d2a-4762-8ea7-d50f8b641330	53yzF4tOwqwPwwkdo70fmL	2026-03-04 21:01:37.953	167344	439	37
bc1aacd6-ed39-41e7-b939-fa8d9def4f3e	5xyNvcWaZKre83tW46w5Jp	2026-03-04 21:01:48.421	17453	356	22
c27bc284-c353-4e7c-923d-57abf58c01c5	7drEn5GMrJRJhb3dy0LxSR	2026-03-04 21:01:48.728	283772	6297	43
6a14287c-1334-4119-9bdd-b3ea8de7b986	4thCAXlpGSQSUe13fvzjrA	2026-03-04 21:01:59.294	658006	7646	46
c556c650-f961-4231-85f5-4a3455ddaf53	5mU6enX6pYYKEs0zfRkm1R	2026-03-04 21:01:59.356	2505524	52171	59
7645be57-007f-41b2-8013-49244d222104	6E7d0UydWwTMqxXzNRdp78	2026-03-04 21:02:09.938	1393427	6155	55
762e41e7-eacc-4deb-829d-632c01ff269b	5uDZGPzOYAzfOhw1lxmhwL	2026-03-04 21:02:09.942	61955	487	28
0a3561f9-068f-400c-a9a3-2ca76fbda8c2	4JQGeB5BANQdgSABnKHBVY	2026-03-04 21:02:20.509	438243	3476	45
4c55097f-8481-42a2-b501-6150f96af808	0NakXcxWSSLTMHvJsDWPVC	2026-03-04 21:02:20.513	288670	3206	42
f09ebafc-9da8-4cc8-90c0-09e0404ec536	7Kf6LvyojtWsyXbEEU7yIF	2026-03-04 21:02:31.182	93040	3299	32
d7094a07-5d89-42c4-9e9b-341499ba1bbc	5ldM1bXOYDVjt8Q9QWB1Uv	2026-03-04 21:02:31.269	67062	2068	30
a284be99-76d6-4c17-a3b3-c8a6e9998958	1PvcWjADPMezv8CTyJO9Uk	2026-03-04 21:02:41.865	1393036	49962	54
db23a852-97ea-41b8-9d74-49eeac5cf6a0	164O6SBXwBBGLV2P809KUS	2026-03-04 21:02:41.92	2484839	32498	58
ec45d531-8f6b-4264-a9b0-96eabc6711f6	1o2FbPtsJOONvAlInXNwYo	2026-03-04 21:02:52.541	212620	1488	39
061a5b61-3f34-413f-a9b7-b75c0bfa472b	2PpXe1ZQ4tmhWVWaJVCxfK	2026-03-04 21:02:52.561	31596	544	23
969ab74f-7539-4af2-87f0-86eedb11479b	7ByARkW6MwBGBC6ak72wPN	2026-03-04 21:03:03.184	198915	1313	38
5d0a543a-f551-40c4-bd0e-e8951c6f43d6	3f8c42vQhwylI4lWCC6ARZ	2026-03-04 21:03:03.194	141590	3692	36
1db2dc34-6a61-4b7a-8a85-01186960118e	2EOtEHNNR9N1dP5J2I1cHo	2026-03-04 21:03:13.819	1223153	17244	51
11384814-b062-4a48-ba5f-20e2af78387d	0OTjk4QUX6zTvaZy6XOooY	2026-03-04 21:03:13.842	164527	1905	36
bd6850e4-5162-4421-a03e-19728f502049	62vwt2P3iBw4NwHdDZb27q	2026-03-04 21:03:24.453	8577840	78302	69
23980b49-e58f-4e0d-ab1f-317b50c5f56c	1QYXUjQBqVpFKlxfrYsk4h	2026-03-04 21:03:24.545	526672	13505	50
0d0ff179-9239-47c3-a9ac-d0b9a8f52928	1nIwABuN4D2w2SaE4ML7OA	2026-03-04 21:03:35.17	187122	2520	38
20ecea36-9895-4301-8a93-a294eb91b8d2	4czULjQ9jyER349yjpYYcS	2026-03-04 21:03:35.192	308124	2305	41
41526faf-55d8-41eb-8ed9-8ecd614e07da	2dVJkcQL5tMX02UH56iTo1	2026-03-04 21:03:45.809	230	18	1
ee407c9a-5999-45c2-bbf1-688eb21a1cc7	4WBFx3Wen7AY4vlMffuZTO	2026-03-04 21:03:45.866	5673	266	13
d5d098a4-aa8e-4be4-8512-da4581106794	30S401kK22I3HKdI2uHZgp	2026-03-04 21:03:56.48	9657	912	17
f8b1e40f-7025-472e-bd3f-101f11871d72	6I1Xg3EHFdDmWqy7UPmqKb	2026-03-04 21:03:56.569	28690	79	21
9dc82788-8444-49d3-a091-13068dcb0e64	3eZBjp3ibCgDuKzo3PA8vh	2026-03-04 21:04:07.227	67771	364	31
69e17305-d4fc-47c1-8323-c5442b4cdaeb	5tvPbCrx8LMaL9Zby5e7c2	2026-03-04 21:04:07.314	3949208	172520	62
e74f526c-61fc-4ea7-9998-66b46171f763	4xLBtr9d1JOwYvW39g2mUl	2026-03-04 21:04:18.032	898042	4029	50
eb9a6ea7-60ab-4947-a895-1170f3f15add	7FgaWBwYSxy5cywT6XOPdt	2026-03-04 21:04:18.133	64027	2546	30
9c42f4ac-e7fb-4ca4-ad12-b2c661eafee3	5w4mniCcdjpn4yTHlPfniW	2026-03-04 21:04:28.815	49438	1917	30
d95369d4-f211-4998-a2da-d71202bdb6f6	514Qze5V7AvD6wVSwdQB8Y	2026-03-04 21:04:28.881	123212	8365	32
003c0df2-9ddf-4cfe-9b71-a6729f43a7fe	03pt9mCEKaO0GepoXTV5uZ	2026-03-04 21:04:39.589	57959	460	27
5ddf4ce7-7d54-44aa-a645-eb2c4311b6a4	7lAaAGxYxk2GH8cMbTEwAL	2026-03-04 21:04:39.62	5653317	216640	65
8bd7387f-271b-4c7a-9af3-d64796dd19a0	60J22gmJOU5t1n8NmW0XSK	2026-03-04 21:04:50.223	43259	1388	24
4350173d-7b34-40c5-82c1-3dae6c595388	1yevH7mkPMXeSTnA9SwHvq	2026-03-04 21:04:50.282	6776910	93152	72
215cb694-5e7c-4b13-98d8-6b472a2ce016	4PMSwT0eBQfWB3cjH4t30s	2026-03-04 21:05:00.841	47730	2512	27
4cecdce5-8d30-4d66-9db8-ccb71ba378a7	5dDNNq04RjKXFOADdHd6VX	2026-03-04 21:05:00.966	9225877	296219	71
a668dee6-9016-4730-9980-5b4dea6e0029	57ukrt4OCWcR4HL9sStvKW	2026-03-04 21:05:11.625	25206	950	21
c13f7e5c-c9aa-46f8-818f-8ffbdc39d5ff	1Zg2f2iwwB2bfxtKPkb4eI	2026-03-04 21:05:11.673	3201	409	9
02298f9b-b189-4350-9d6c-a25642118bd5	2bXiTuKR1AMkSvmgh60706	2026-03-04 21:05:22.422	58205	3686	28
a22df9c4-cbb9-4b7e-b8fc-4f77e8a3a6b6	0x9bzpifUdZFBQw7R1UWPT	2026-03-04 21:05:22.481	722496	9869	47
a113bd1a-c506-4206-9c86-0482e0297cb3	70bgV7fa5H6sTah58wm73l	2026-03-04 21:05:33.142	277235	3970	40
3dd60108-e7b1-48f0-a02a-9d1770cbfd5f	3FUCRB0hJhe9BrXW1yonDh	2026-03-04 21:05:33.197	1771511	14821	56
67f83d6b-41d9-42c1-a957-c64fba40f5f1	2Wt4l7cu2A5QctQ04QCR6S	2026-03-04 21:05:43.867	224176	2198	40
821dc14e-a486-4d0e-a6c4-817367e79424	5dt5VvKgK1bVZodVPnx7AI	2026-03-04 21:05:43.894	540063	2021	46
3f305c4c-4883-4913-bacf-cf9a0304183a	6Gr49ikaor5MuFQPBlOZ29	2026-03-04 21:05:54.588	480869	1428	45
78581c23-a1b2-4351-9520-2b6bc567c8b4	50LbWtqqQeduRjJHLuwQed	2026-03-04 21:05:54.673	1716618	32900	57
aea0779f-869b-480d-8814-d29cb5341923	5bePP411ITzZyWf1QZ2SX4	2026-03-04 21:06:05.394	4929479	131972	66
fc8c84fb-093b-493f-bf31-171697ca501d	2sQHo73pQF1OTq3lDuQhlO	2026-03-04 21:06:05.471	4258234	61204	60
c82f29b6-5b7a-4018-8955-483e13face2b	2nIlwjrcU54whF2MWBcJSu	2026-03-04 21:06:16.15	4804	90	10
7c60d252-5ec2-4f38-bde8-8b217beb366b	4bcHlUu9N2JzWzpz3kpzzy	2026-03-04 21:06:16.158	181879	17450	38
de8a6a02-0d2e-4a8b-ab9e-789c84bca267	30vnw2IDoHflDzAn9DpqLf	2026-03-04 21:06:26.922	49905	1222	26
98e15e03-c264-4043-8a00-5b012518ccf4	1mEkCpjXPIymCGkKCJzcl5	2026-03-04 21:06:26.958	198831	1416	40
2435569b-84eb-4653-b4a2-c1d1cc16184d	3iG3DOwDRNNcU4SD26P0qp	2026-03-04 21:06:37.805	202820	8604	38
18b278b5-5229-451d-a2ba-76806d40ed29	1nzIoHG5B7klgAPdwjqRDj	2026-03-04 21:06:37.845	2250604	28219	56
c9b39cc8-3c05-469b-91f7-53b7597b2b72	4hV3aU0WKvFaiX5ugXP5hp	2026-03-04 21:06:48.394	3206863	112199	59
c130b1a2-3d8f-43ab-a201-32500de7b52d	51K0b3lRd87cKX02hU26we	2026-03-05 21:00:15.145	6065364	18859	64
8cee4ade-a4dc-4798-9894-2674173383c3	1RklNDIiYVZ3dYdEUnB0cS	2026-03-05 21:00:15.302	6429831	95113	65
66586635-285f-4e5b-b64a-fbd13e9f39a6	1w8PO0gTOOk74D2bH8Bmue	2026-03-05 21:00:25.994	182406	2228	38
4b95b545-f71e-4104-84e6-b10e0f3d22d0	0EXytqF1qOmpGIVb1AwYdJ	2026-03-05 21:00:26.053	374490	1017	45
c5778922-ec5f-4910-814e-47fa59cabe3f	1Sdc6ySbIvzO0X9vbyHzWm	2026-03-05 21:00:36.746	6192756	618877	66
9b953e70-b5aa-4747-884c-fc4bcd942b32	0exQbKNFd9pLmdIGycwmlf	2026-03-05 21:00:36.764	7378735	200931	73
705f5a7b-01d9-47ad-86af-768118bcc580	4YeITwoqeIks45gELm488B	2026-03-05 21:00:47.564	870069	21429	50
6d5ccdbe-66ec-4949-bf53-994398e734c9	07CoGyrUbcBkSzvs1Kd9i6	2026-03-05 21:00:47.645	639035	15434	48
85e4b93b-ad29-4a5b-ac2c-f20dc34f690c	2UKmwMB2wMQMvQcduijrQi	2026-03-05 21:00:58.387	19562	815	51
933719ea-fa2d-47ee-8d3a-5365941edfe4	04zt4agcJcyZoHpSs3RnqW	2026-03-05 21:00:58.453	12174	107	18
d8dfd215-15ad-4c74-b76d-1c60e5f030ab	0ypzv0AG6k3yZjNxdhpnJF	2026-03-05 21:01:09.083	1806982	22512	57
73e100a8-0fab-44ec-8b5e-8dc451c37bd3	3ysIyoivMDpeqLg0VMRPQw	2026-03-05 21:01:09.245	869476	235434	49
775ccf2f-e0bd-4eb8-8e9f-ec844523a29d	0DVWkIG75PBtzwbE0Sly8w	2026-03-05 21:01:20.05	113035	2083	36
de5823eb-5ecc-4aac-9dc9-beebc9cfaff4	02wf6SCDwrs2qTX09X0IRE	2026-03-05 21:01:20.066	9008869	209702	68
cb5519d7-c6a9-4a91-b180-aeb82ec43913	4hDC6zuK2V5qwyeJcydSPS	2026-03-05 21:01:30.72	499972	3300	44
b4c59a2e-fbe0-400e-b2ba-8e23bdeede93	6qVUFaRkVzdtF9Wg0vxeKH	2026-03-05 21:01:30.873	61723	2871	29
7e7feef2-436e-4452-92e6-b2cf1de3f2d1	6JvsRSaeBQIAb6LYyNCBht	2026-03-05 21:01:41.57	28234	161	25
b27b564a-23bc-49b7-ae4d-5a259f1e904a	53yzF4tOwqwPwwkdo70fmL	2026-03-05 21:01:41.605	164844	440	37
49358a26-9c1a-4415-b4ad-ad2e491f5cca	7drEn5GMrJRJhb3dy0LxSR	2026-03-05 21:01:52.25	283903	6301	43
917708c8-1b05-42b9-a7f4-762f04be8734	5xyNvcWaZKre83tW46w5Jp	2026-03-05 21:01:52.364	17345	361	22
e2aed552-a48b-49c2-8b05-ac3c5e34c913	4thCAXlpGSQSUe13fvzjrA	2026-03-05 21:02:02.946	653118	7665	46
cf09eccb-c50b-4bd3-b2cf-b681b9e1bac2	5mU6enX6pYYKEs0zfRkm1R	2026-03-05 21:02:03.102	2501129	52225	59
4fd3fef4-bdd1-4993-9fa9-deb76ad25fdf	5uDZGPzOYAzfOhw1lxmhwL	2026-03-05 21:02:13.837	61295	489	28
ed06f9c0-444a-4fe0-92ac-1683b3f13700	6E7d0UydWwTMqxXzNRdp78	2026-03-05 21:02:13.877	1393121	6184	55
908dc340-5d37-44b5-942d-2d8da7919d1d	4JQGeB5BANQdgSABnKHBVY	2026-03-05 21:02:24.845	439630	3525	45
3b06ad3a-6061-463f-9214-4581b4f881a1	0NakXcxWSSLTMHvJsDWPVC	2026-03-05 21:02:24.86	286114	3225	42
7507aef9-3a2f-45cd-a63c-8996db327ffd	5ldM1bXOYDVjt8Q9QWB1Uv	2026-03-05 21:02:35.622	66478	2075	30
9fef06f5-dda2-470b-a207-cca49b04890b	7Kf6LvyojtWsyXbEEU7yIF	2026-03-05 21:02:35.629	90771	3303	32
2e33f812-086b-42f8-be72-0e2da1eec5d2	1PvcWjADPMezv8CTyJO9Uk	2026-03-05 21:02:46.278	1387219	49988	54
dd85217a-4b7b-4481-9951-563f69a3d7f8	164O6SBXwBBGLV2P809KUS	2026-03-05 21:02:46.564	2487706	32663	58
eb5b5809-8ef1-4296-9f82-2e0e4e8e5a94	1o2FbPtsJOONvAlInXNwYo	2026-03-05 21:02:57.333	206798	1492	39
28dbb447-0b59-4c05-b91b-6095588062b3	2PpXe1ZQ4tmhWVWaJVCxfK	2026-03-05 21:02:57.355	31127	543	23
82ef0ca4-1e2e-4693-9a85-2616ed4ed6aa	3f8c42vQhwylI4lWCC6ARZ	2026-03-05 21:03:08.072	140095	3697	36
e39f0084-bd9e-42a7-94a8-105d5bfd4fd3	7ByARkW6MwBGBC6ak72wPN	2026-03-05 21:03:08.234	192940	1318	38
cdc074a6-9fe1-4dd8-95e3-245348cb2429	0OTjk4QUX6zTvaZy6XOooY	2026-03-05 21:03:18.919	162414	1920	36
d56d3da2-3ac8-437e-8fe4-dd91cca16a46	2EOtEHNNR9N1dP5J2I1cHo	2026-03-05 21:03:19.534	1235147	17281	51
70a0e8a9-499c-4d5f-aeab-7bad5d9f42a8	62vwt2P3iBw4NwHdDZb27q	2026-03-05 21:03:30.436	8549540	78728	69
41f4dba7-b53c-42ca-805e-a3558e51881e	1QYXUjQBqVpFKlxfrYsk4h	2026-03-05 21:03:30.442	521756	13519	50
365e822e-0513-43f7-b16e-a050c212dd31	1nIwABuN4D2w2SaE4ML7OA	2026-03-05 21:03:41.182	186143	2527	38
9b83bc2b-f36a-4675-8398-142870e4e2c2	4czULjQ9jyER349yjpYYcS	2026-03-05 21:03:41.254	304249	2313	41
942181d8-b99e-4098-a7d4-bad02710247d	4WBFx3Wen7AY4vlMffuZTO	2026-03-05 21:03:57.044	5371	266	13
a0cc72bf-1864-456f-8304-75de68795fa1	2dVJkcQL5tMX02UH56iTo1	2026-03-05 21:03:57.146	215	18	1
dcca0a62-8af8-42e1-a629-668dff8a915c	30S401kK22I3HKdI2uHZgp	2026-03-05 21:04:07.867	9698	913	17
a6bdc189-cba7-4b56-8a8b-06b9a3cf77f5	6I1Xg3EHFdDmWqy7UPmqKb	2026-03-05 21:04:07.889	29379	79	21
df7b00ba-96d3-4c1b-a061-d200a3261eee	3eZBjp3ibCgDuKzo3PA8vh	2026-03-05 21:04:18.705	68382	368	31
d59923cf-6811-41a5-94f5-4ba3b48aee46	5tvPbCrx8LMaL9Zby5e7c2	2026-03-05 21:04:18.716	3933239	172621	62
706f0022-7f6c-45c3-9ff6-0f154aebe3ec	4xLBtr9d1JOwYvW39g2mUl	2026-03-05 21:04:29.438	895279	4033	50
194c24ba-5277-4239-a010-7c8c9e0931b8	7FgaWBwYSxy5cywT6XOPdt	2026-03-05 21:04:29.873	63295	2548	30
56e4b405-c2d6-4cba-bf33-a60e12cdd9c4	514Qze5V7AvD6wVSwdQB8Y	2026-03-05 21:04:40.548	125863	8365	33
18db20ff-67db-4a1f-a746-e120983c8b10	5w4mniCcdjpn4yTHlPfniW	2026-03-05 21:04:40.721	49152	1919	30
db5a9e77-530f-4298-8ee9-cfaa56356807	03pt9mCEKaO0GepoXTV5uZ	2026-03-05 21:04:51.337	57028	460	27
3f1cb5af-ebd1-4593-8373-a78529ddeedf	7lAaAGxYxk2GH8cMbTEwAL	2026-03-05 21:04:51.531	5642652	216730	65
cdd14000-dfbb-4799-a34a-65b5f6f4022e	60J22gmJOU5t1n8NmW0XSK	2026-03-05 21:05:02.234	45540	1388	25
71085b54-2a2f-4b26-80f7-41a396b89ae0	1yevH7mkPMXeSTnA9SwHvq	2026-03-05 21:05:02.263	6793062	93495	72
8a2fc8c9-5473-4d23-b414-3859bec19211	4PMSwT0eBQfWB3cjH4t30s	2026-03-05 21:05:13.042	47447	2521	27
e01b5544-81eb-496d-a5fb-9e8e6c55de99	5dDNNq04RjKXFOADdHd6VX	2026-03-05 21:05:13.069	9222488	296379	71
01fb5063-405a-4fa8-8927-41af50b5bddc	57ukrt4OCWcR4HL9sStvKW	2026-03-05 21:05:23.869	25071	951	21
1bc88334-e9e8-4980-922e-66cb339a7962	1Zg2f2iwwB2bfxtKPkb4eI	2026-03-05 21:05:23.909	3198	409	9
d01cb3b8-4af9-4da3-8f2b-55ff6bde4227	0x9bzpifUdZFBQw7R1UWPT	2026-03-05 21:05:34.691	715690	9872	47
a49ee0fd-ac3a-48b0-8b7c-44e4d962af4d	2bXiTuKR1AMkSvmgh60706	2026-03-05 21:05:34.768	58082	3687	28
6b0d6174-13f9-4448-8743-2720c8fabdcb	3FUCRB0hJhe9BrXW1yonDh	2026-03-05 21:05:45.491	1766174	14889	56
bd34281b-1917-4019-8e3a-bfab0da06a13	70bgV7fa5H6sTah58wm73l	2026-03-05 21:05:45.568	276842	3981	40
ea5e7455-2e82-427a-b44e-f0ba5a109f64	2Wt4l7cu2A5QctQ04QCR6S	2026-03-05 21:05:56.258	222461	2204	40
e11e0a91-876a-4007-a99b-4d7e6a89471c	5dt5VvKgK1bVZodVPnx7AI	2026-03-05 21:05:56.487	539749	2027	46
ccffad03-23f7-4715-a85d-c8cb56881e6c	50LbWtqqQeduRjJHLuwQed	2026-03-05 21:06:07.287	1715694	32943	57
518126b3-2deb-403d-8fb2-24c8c9950b8c	6Gr49ikaor5MuFQPBlOZ29	2026-03-05 21:06:07.36	479319	1432	45
03dbf1dc-d643-48c9-839a-2b5e56dcc971	5bePP411ITzZyWf1QZ2SX4	2026-03-05 21:06:18.254	4934210	132291	66
bc97e920-332c-438b-be3a-28a6139a4164	2sQHo73pQF1OTq3lDuQhlO	2026-03-05 21:06:18.37	4243352	61214	60
c248f3bc-b29a-4fad-8ad9-0bbd08eeec47	4bcHlUu9N2JzWzpz3kpzzy	2026-03-05 21:06:29.122	184256	17451	38
507670a8-c261-4d58-adf4-16d41883ad4f	2nIlwjrcU54whF2MWBcJSu	2026-03-05 21:06:29.249	4832	90	10
3b289705-8424-477b-96b7-5770a0c6338f	1mEkCpjXPIymCGkKCJzcl5	2026-03-05 21:06:40.072	197811	1420	41
1268ad3e-a350-471f-8cfb-4ce2954fce11	30vnw2IDoHflDzAn9DpqLf	2026-03-05 21:06:40.165	49053	1223	26
4383b193-85e2-4ac9-a928-ef4d3eb54111	1nzIoHG5B7klgAPdwjqRDj	2026-03-05 21:06:50.712	2256631	28242	56
6faf79ab-e53f-41bb-804f-549982f9d7f8	3iG3DOwDRNNcU4SD26P0qp	2026-03-05 21:06:50.955	202575	8609	38
f69aa18d-dd44-4356-91ad-99466f0ddfa5	4hV3aU0WKvFaiX5ugXP5hp	2026-03-05 21:07:01.882	3206489	112250	59
50f89a50-5876-4c5b-b2dd-5b382bc1dcdb	51K0b3lRd87cKX02hU26we	2026-03-06 21:00:14.792	6068029	18939	64
93d08b6a-df0a-440d-8964-12a8749efc07	1RklNDIiYVZ3dYdEUnB0cS	2026-03-06 21:00:18.78	6441180	95299	65
3df92f4c-6bee-4a1e-b48a-5daae450979e	0EXytqF1qOmpGIVb1AwYdJ	2026-03-06 21:00:29.472	369309	1023	45
f88d6d70-3c85-4a58-a2a5-d59bc1f67967	1w8PO0gTOOk74D2bH8Bmue	2026-03-06 21:00:29.569	178044	2239	38
61596b8d-d5b0-4998-9066-716f2c6b0191	0exQbKNFd9pLmdIGycwmlf	2026-03-06 21:00:40.286	7419471	201625	73
fe6569cd-9d16-41ea-8e13-5a5fc23f70b2	1Sdc6ySbIvzO0X9vbyHzWm	2026-03-06 21:00:40.357	6180185	619236	66
0ca365f5-51cb-4031-96d4-36e801e53997	4YeITwoqeIks45gELm488B	2026-03-06 21:00:51.148	864476	21436	50
64372eeb-1f43-4773-bb89-8360e9afa50f	07CoGyrUbcBkSzvs1Kd9i6	2026-03-06 21:00:51.302	639258	15466	49
8ae39cf9-896f-41a4-a91e-a357fd74edd4	2UKmwMB2wMQMvQcduijrQi	2026-03-06 21:01:02.418	19826	814	51
0e71d389-1db8-4e10-a414-f41a162df4b6	04zt4agcJcyZoHpSs3RnqW	2026-03-06 21:01:02.564	12067	107	18
1c9547f7-1c5f-4700-bdd1-348d3ed5eda8	3ysIyoivMDpeqLg0VMRPQw	2026-03-06 21:01:13.597	871641	235441	49
d23c463d-23fb-4318-8b45-90d741cf2b59	0ypzv0AG6k3yZjNxdhpnJF	2026-03-06 21:01:13.617	1797560	22551	57
c96ad649-19dd-463d-bf9c-0acfff23b0da	0DVWkIG75PBtzwbE0Sly8w	2026-03-06 21:01:24.472	114387	2105	36
08f4d5ec-1e78-447f-adb8-87ba44ceac69	02wf6SCDwrs2qTX09X0IRE	2026-03-06 21:01:24.505	8956036	209901	68
9a34f3c7-8bce-47f3-a415-38c9ef1a9763	4hDC6zuK2V5qwyeJcydSPS	2026-03-06 21:01:35.394	500642	3333	44
f67c05d6-cec5-421c-a7a1-263d0e3db113	6qVUFaRkVzdtF9Wg0vxeKH	2026-03-06 21:01:35.633	62443	2873	29
8bc10ff1-d2c5-4111-895a-e3b2f5f8f6ae	6JvsRSaeBQIAb6LYyNCBht	2026-03-06 21:01:46.599	27929	163	25
f0a00be0-21d0-4115-97f5-7eeecbd91949	53yzF4tOwqwPwwkdo70fmL	2026-03-06 21:01:46.659	162728	441	37
a6e11eb6-be49-4143-80a2-d9b862f40054	7drEn5GMrJRJhb3dy0LxSR	2026-03-06 21:01:57.346	283501	6311	43
7814aeb2-6e44-4af7-99e5-096c7d1f829a	5xyNvcWaZKre83tW46w5Jp	2026-03-06 21:01:57.413	17366	372	22
bd2eb06b-e24d-4b76-9196-d81b9cdf2e1a	5mU6enX6pYYKEs0zfRkm1R	2026-03-06 21:02:07.923	2499496	52300	59
33e4b49c-2dae-4041-a541-e8ae3821dbcc	4thCAXlpGSQSUe13fvzjrA	2026-03-06 21:02:08.269	649418	7673	46
49ce85c2-1bdc-49f1-8de5-17cb911017a1	5uDZGPzOYAzfOhw1lxmhwL	2026-03-06 21:02:19.005	60682	489	28
195c72b3-eb47-4190-a9d7-9bb56ba2a706	6E7d0UydWwTMqxXzNRdp78	2026-03-06 21:02:19.406	1394166	6204	55
bcc44829-98e4-4c12-97ce-de9bd140f978	0NakXcxWSSLTMHvJsDWPVC	2026-03-06 21:02:30.006	282601	3257	42
64355c8d-178f-4188-b6f3-b280f050d2a7	4JQGeB5BANQdgSABnKHBVY	2026-03-06 21:02:30.517	439111	3577	45
2e35cb1b-308b-4757-a791-7d8fc97edfe7	5ldM1bXOYDVjt8Q9QWB1Uv	2026-03-06 21:02:41.086	65786	2088	30
16b56ffa-5fe9-4065-bfe5-9b4bc3d586bd	7Kf6LvyojtWsyXbEEU7yIF	2026-03-06 21:02:41.296	88359	3315	32
4d6afe71-9115-4672-aa53-aaa9a992c6ee	1PvcWjADPMezv8CTyJO9Uk	2026-03-06 21:02:51.949	1378868	50019	54
23624fba-7a9d-4866-bd7a-f289c86de469	164O6SBXwBBGLV2P809KUS	2026-03-06 21:02:52.094	2491463	32884	58
9d70ba64-1fdd-4ecb-9c4c-a4f1259999ff	2PpXe1ZQ4tmhWVWaJVCxfK	2026-03-06 21:03:02.88	31010	543	23
667154dc-a7bc-40db-8a79-932268abf17e	1o2FbPtsJOONvAlInXNwYo	2026-03-06 21:03:02.955	201419	1502	39
4c339732-bf96-4d0e-b319-93c2e88ed37f	7ByARkW6MwBGBC6ak72wPN	2026-03-06 21:03:13.645	187540	1326	38
18b21b66-0394-4e89-9c03-a368ed9523c4	3f8c42vQhwylI4lWCC6ARZ	2026-03-06 21:03:13.728	139285	3703	36
21e88ff2-d97c-4dac-904d-f31a1f9e9970	2EOtEHNNR9N1dP5J2I1cHo	2026-03-06 21:03:24.48	1247990	17316	51
c51d921d-4e9d-4832-9f4a-1efe12e7dc34	0OTjk4QUX6zTvaZy6XOooY	2026-03-06 21:03:24.526	160958	1934	36
788476b8-ef52-4a87-9415-71f737b6d8bf	1QYXUjQBqVpFKlxfrYsk4h	2026-03-06 21:03:35.166	517724	13545	50
eef39ab9-4e85-4629-9198-b71dbfbd51ac	62vwt2P3iBw4NwHdDZb27q	2026-03-06 21:03:35.35	8538357	79155	69
78ce80a2-5c2e-4756-80df-9c21d113e57f	1nIwABuN4D2w2SaE4ML7OA	2026-03-06 21:03:46.069	185510	2535	38
1302c37e-c1cb-45bf-8cb1-560a2a6f6d45	4czULjQ9jyER349yjpYYcS	2026-03-06 21:03:46.116	300247	2320	41
c823f8dc-9c6e-46b0-a7db-7b3d384b7bfd	2dVJkcQL5tMX02UH56iTo1	2026-03-06 21:03:56.739	173	18	1
f4862491-7687-4385-b45a-61b75b6ec3c8	4WBFx3Wen7AY4vlMffuZTO	2026-03-06 21:03:56.832	4956	267	13
be1b290b-77aa-47f1-8eee-a2fa9b6c5cd0	6I1Xg3EHFdDmWqy7UPmqKb	2026-03-06 21:04:07.502	29866	79	21
4b2df448-74ea-483c-aee5-3ba8d24bf6f3	30S401kK22I3HKdI2uHZgp	2026-03-06 21:04:07.627	9637	915	17
b54ed3c9-384b-4500-a25d-8276464aad84	5tvPbCrx8LMaL9Zby5e7c2	2026-03-06 21:04:18.405	3923972	172740	62
c2973c1d-96ae-4252-af56-2bab517e720b	3eZBjp3ibCgDuKzo3PA8vh	2026-03-06 21:04:18.416	68763	371	31
7c13ad13-d903-49e0-81bb-2287a02aff13	7FgaWBwYSxy5cywT6XOPdt	2026-03-06 21:04:29.02	62902	2549	30
f855bd9f-d37b-431b-85b8-399de4ec805c	4xLBtr9d1JOwYvW39g2mUl	2026-03-06 21:04:29.152	893194	4040	50
e2c40867-c386-4c4e-99fa-0e69d1e1f1cc	514Qze5V7AvD6wVSwdQB8Y	2026-03-06 21:04:39.881	127671	8364	33
9888b90d-23e9-4862-b207-3058b550c42d	5w4mniCcdjpn4yTHlPfniW	2026-03-06 21:04:39.938	48753	1923	30
0f2906aa-d222-4f16-8e32-d18b587da240	7lAaAGxYxk2GH8cMbTEwAL	2026-03-06 21:04:50.652	5627188	216872	65
7dc433f7-cd54-4de7-96f1-e04722387627	03pt9mCEKaO0GepoXTV5uZ	2026-03-06 21:04:50.681	56207	460	27
71209012-c07c-4467-99c5-fe424d32685b	1yevH7mkPMXeSTnA9SwHvq	2026-03-06 21:05:01.476	6810354	93848	72
1bf4bb5f-7010-4579-ab0d-32abafb5c2e7	60J22gmJOU5t1n8NmW0XSK	2026-03-06 21:05:01.55	48401	1389	25
2f7db340-ad21-4e79-bfcd-e32aa1669498	4PMSwT0eBQfWB3cjH4t30s	2026-03-06 21:05:12.31	46895	2532	27
51bea03d-2f52-4991-8e03-50d84c73be26	5dDNNq04RjKXFOADdHd6VX	2026-03-06 21:05:12.347	9207956	296564	71
ba9bd438-0e96-44f4-830f-189e432e47ce	1Zg2f2iwwB2bfxtKPkb4eI	2026-03-06 21:05:23.08	3174	410	9
5d7bde3d-88e8-4da1-91fd-4bb3e379d1ed	57ukrt4OCWcR4HL9sStvKW	2026-03-06 21:05:23.151	25020	949	21
22be4210-55ef-4345-88ff-8e071aad328f	0x9bzpifUdZFBQw7R1UWPT	2026-03-06 21:05:33.924	706745	9893	47
c97a28d7-5f57-4571-ae7f-67f9df3a4b9d	2bXiTuKR1AMkSvmgh60706	2026-03-06 21:05:33.96	57986	3689	28
d2db4070-7daf-4287-839d-234dd4bbc401	3FUCRB0hJhe9BrXW1yonDh	2026-03-06 21:05:44.579	1760721	14961	56
0d2ae13e-da50-49f3-8a05-440d9e58c761	70bgV7fa5H6sTah58wm73l	2026-03-06 21:05:44.713	276068	3995	40
21673006-68ba-4b5c-a8da-029e57679933	5dt5VvKgK1bVZodVPnx7AI	2026-03-06 21:05:55.376	541209	2033	46
de40330e-7ea5-4731-8688-542eeba3673d	2Wt4l7cu2A5QctQ04QCR6S	2026-03-06 21:05:55.715	220997	2209	40
1e659d91-b8bd-45be-abeb-226d675249b2	50LbWtqqQeduRjJHLuwQed	2026-03-06 21:06:06.518	1716850	33018	57
6fc37485-b301-449b-85ce-fcbadd4716bf	6Gr49ikaor5MuFQPBlOZ29	2026-03-06 21:06:06.548	478805	1435	45
dd859a15-b392-4c00-93b5-e1af0168e25a	5bePP411ITzZyWf1QZ2SX4	2026-03-06 21:06:17.178	4938382	132610	66
04f848cd-f533-48fe-bcd0-252fa779a0a5	2sQHo73pQF1OTq3lDuQhlO	2026-03-06 21:06:17.277	4237636	61233	60
f90f53c2-3c3e-4b88-85d4-15944eecd968	4bcHlUu9N2JzWzpz3kpzzy	2026-03-06 21:06:28.009	184406	17456	38
0cdb8ee8-663a-4acf-ba22-842913eeb501	2nIlwjrcU54whF2MWBcJSu	2026-03-06 21:06:28.011	4834	90	11
8189edc1-2736-4bc9-b841-418c0a7c958e	30vnw2IDoHflDzAn9DpqLf	2026-03-06 21:06:38.75	48159	1224	26
7cbcc84a-f0c3-4145-8bd7-4a0d5faa4491	1mEkCpjXPIymCGkKCJzcl5	2026-03-06 21:06:38.862	197074	1421	41
350c7b5d-8af7-4d90-ad64-2ffdf89ec74f	1nzIoHG5B7klgAPdwjqRDj	2026-03-06 21:06:49.332	2262839	28267	56
9f315bdb-f343-4aa2-bbcb-a007252fd0db	3iG3DOwDRNNcU4SD26P0qp	2026-03-06 21:06:49.525	202484	8616	38
29a19949-3dcf-44b0-900b-28c89081873b	4hV3aU0WKvFaiX5ugXP5hp	2026-03-06 21:07:00.153	3207261	112292	59
a74eb370-ef25-48be-831e-e4c5d03e3bb6	1RklNDIiYVZ3dYdEUnB0cS	2026-03-07 21:00:14.804	6451993	95497	65
745da273-78ea-44be-a9f3-a2f07264f534	51K0b3lRd87cKX02hU26we	2026-03-07 21:00:14.868	6072860	19034	64
f7ed0947-c8fe-4cb7-8f8b-9a4c8b65e777	1w8PO0gTOOk74D2bH8Bmue	2026-03-07 21:00:25.486	173435	2244	38
f71175da-7ca3-4ca0-a306-91bbf7a198b2	0EXytqF1qOmpGIVb1AwYdJ	2026-03-07 21:00:25.655	363055	1034	45
f91cf423-0db5-4472-b0b4-3bb684a7909a	1Sdc6ySbIvzO0X9vbyHzWm	2026-03-07 21:00:36.477	6172201	621125	66
a0ee6ea3-3eb8-4a55-993d-28a029701f2f	0exQbKNFd9pLmdIGycwmlf	2026-03-07 21:00:36.955	7456651	202383	73
74ff99bd-81cd-4352-956d-f18b1b9d6bdd	07CoGyrUbcBkSzvs1Kd9i6	2026-03-07 21:00:47.923	640602	15482	49
6534a27b-7a52-4506-bc1d-e436e29e2351	4YeITwoqeIks45gELm488B	2026-03-07 21:00:48.033	856166	21447	50
a4864274-d08f-462a-9e83-d2ff25322925	04zt4agcJcyZoHpSs3RnqW	2026-03-07 21:00:58.946	11848	108	18
4f8486c8-3ff6-48b5-a59c-9edf06464016	2UKmwMB2wMQMvQcduijrQi	2026-03-07 21:00:58.967	20129	817	51
a332d26e-94ee-4feb-a233-c2a7a04b9f3c	3ysIyoivMDpeqLg0VMRPQw	2026-03-07 21:01:09.728	873002	235445	49
aa5bcf8a-33f9-40cc-8ac9-bff086aa4798	0ypzv0AG6k3yZjNxdhpnJF	2026-03-07 21:01:09.782	1788482	22592	57
c419ade3-781f-4ede-85f9-46aed1d75193	0DVWkIG75PBtzwbE0Sly8w	2026-03-07 21:01:20.458	115797	2132	36
e114829f-e551-4f06-9d91-89f562284fb6	02wf6SCDwrs2qTX09X0IRE	2026-03-07 21:01:20.517	8906703	210130	68
6534d61e-998c-4248-8271-84ffc06c5186	6qVUFaRkVzdtF9Wg0vxeKH	2026-03-07 21:01:31.244	63550	2874	29
c172544e-1688-48db-8779-909bd5b62eda	4hDC6zuK2V5qwyeJcydSPS	2026-03-07 21:01:31.294	501298	3370	44
05c2b9fd-6bc8-4650-abe9-20791cc0b47e	6JvsRSaeBQIAb6LYyNCBht	2026-03-07 21:01:41.943	27844	164	25
99c86527-12c4-432b-850a-c14ac64cc1ee	53yzF4tOwqwPwwkdo70fmL	2026-03-07 21:01:41.957	160263	443	36
ecf83f3a-cdf7-4e60-97c6-8c2a2329dba7	7drEn5GMrJRJhb3dy0LxSR	2026-03-07 21:01:52.684	283000	6323	43
ac020fba-434d-4d26-be30-dab6c9e51db2	5xyNvcWaZKre83tW46w5Jp	2026-03-07 21:01:52.705	17146	378	22
276184b6-c782-420c-97c7-fff27e614ec4	5mU6enX6pYYKEs0zfRkm1R	2026-03-07 21:02:03.185	2497367	52387	59
83334bc5-754d-4b9f-83b5-86d77d911ffb	4thCAXlpGSQSUe13fvzjrA	2026-03-07 21:02:03.638	642449	7680	46
a827624b-5ca7-47ac-9340-5ee12e11be21	5uDZGPzOYAzfOhw1lxmhwL	2026-03-07 21:02:14.23	59828	491	28
d736c788-53a1-40a4-9267-2468ef54ad9b	6E7d0UydWwTMqxXzNRdp78	2026-03-07 21:02:14.354	1397757	6242	55
ecdffdcb-bc41-4f4a-8c2e-5597c8197158	4JQGeB5BANQdgSABnKHBVY	2026-03-07 21:02:25.038	436258	3633	45
0f5b3ded-bde3-4816-b1ba-bb7d73bd9253	0NakXcxWSSLTMHvJsDWPVC	2026-03-07 21:02:25.121	278896	3283	42
759f678a-892f-4b2e-9cc1-2b8dc231b61d	7Kf6LvyojtWsyXbEEU7yIF	2026-03-07 21:02:35.906	86308	3320	32
c885fec6-604c-4632-9f09-04748c6a8f76	5ldM1bXOYDVjt8Q9QWB1Uv	2026-03-07 21:02:35.926	65109	2099	29
fcfad5fd-0111-4535-b93e-6182533d492a	1PvcWjADPMezv8CTyJO9Uk	2026-03-07 21:02:46.539	1371163	50063	54
e86480cb-9a60-424a-bb0a-055c544d4252	164O6SBXwBBGLV2P809KUS	2026-03-07 21:02:46.576	2494196	33104	58
d3eb993e-39df-445b-b9c5-e05667fb22bd	1o2FbPtsJOONvAlInXNwYo	2026-03-07 21:02:57.18	196452	1501	38
062014b2-ded2-4c4d-9a97-20012e5c9d64	2PpXe1ZQ4tmhWVWaJVCxfK	2026-03-07 21:02:57.337	30977	547	23
9f5081d3-619b-464a-bbda-ef12ac243c24	7ByARkW6MwBGBC6ak72wPN	2026-03-07 21:03:08.087	182561	1333	38
671b918e-ab73-442a-b1c8-70541b244605	3f8c42vQhwylI4lWCC6ARZ	2026-03-07 21:03:08.098	138732	3708	36
31a2fc11-4629-49df-8c3d-6bbd4f03b502	0OTjk4QUX6zTvaZy6XOooY	2026-03-07 21:03:18.893	159716	1948	36
6332935b-9702-48b2-95b6-ec6e7f5323d9	2EOtEHNNR9N1dP5J2I1cHo	2026-03-07 21:03:18.935	1260220	17359	51
fdb66fee-da74-4061-8109-e634d7a031a9	1QYXUjQBqVpFKlxfrYsk4h	2026-03-07 21:03:29.667	514426	13562	49
df028023-cd99-4d50-b56a-9e670dcaf525	62vwt2P3iBw4NwHdDZb27q	2026-03-07 21:03:29.729	8529100	79647	69
dd666e7b-0d33-452f-b816-a085ff61e3ab	4czULjQ9jyER349yjpYYcS	2026-03-07 21:03:40.446	297794	2327	41
f9d37138-8cb4-47df-9ed2-0a681881c14b	1nIwABuN4D2w2SaE4ML7OA	2026-03-07 21:03:40.524	184814	2544	38
216231a5-1ecd-4f7b-9ce2-4f3c051bc2c5	2dVJkcQL5tMX02UH56iTo1	2026-03-07 21:03:51.247	154	19	1
bc8de537-a385-4d1f-bf3b-9614118da1bb	4WBFx3Wen7AY4vlMffuZTO	2026-03-07 21:03:51.325	4662	267	13
58f92cf7-9d94-4cc3-b0ce-eca5fd11d41d	6I1Xg3EHFdDmWqy7UPmqKb	2026-03-07 21:04:01.967	29706	79	21
f60a3979-7dcf-4f4d-b4f9-d631d1d19f67	30S401kK22I3HKdI2uHZgp	2026-03-07 21:04:02.001	9565	917	17
852d2de8-c7a5-4347-953f-184f5d149eaf	3eZBjp3ibCgDuKzo3PA8vh	2026-03-07 21:04:12.686	69009	375	31
d668d0b7-93ba-4783-8d15-f2627075a3dc	5tvPbCrx8LMaL9Zby5e7c2	2026-03-07 21:04:12.922	3905279	172842	62
c0d93a66-06a2-49f1-b94d-1a022aa40b5a	4xLBtr9d1JOwYvW39g2mUl	2026-03-07 21:04:23.621	890162	4044	50
8788a0c4-f325-468f-83d0-3cae739bc53c	7FgaWBwYSxy5cywT6XOPdt	2026-03-07 21:04:23.669	64210	2556	30
6e15404e-c3d6-4454-a9e8-6f73a48c08fb	5w4mniCcdjpn4yTHlPfniW	2026-03-07 21:04:34.484	48147	1924	30
32f5bc8d-5fb7-40ba-bdb7-cd42282fda5d	514Qze5V7AvD6wVSwdQB8Y	2026-03-07 21:04:34.504	129646	8370	33
a313f982-3eb7-41f2-aa05-66801885cb49	03pt9mCEKaO0GepoXTV5uZ	2026-03-07 21:04:45.145	55594	461	27
0a0b3be8-52af-4821-b613-0ad688927c83	7lAaAGxYxk2GH8cMbTEwAL	2026-03-07 21:04:45.678	5609549	216984	65
1a432de2-9790-4669-93cb-ddc2fe7f287f	60J22gmJOU5t1n8NmW0XSK	2026-03-07 21:04:56.229	50990	1392	25
697d5a85-717a-4fa9-9583-158ef5a17690	1yevH7mkPMXeSTnA9SwHvq	2026-03-07 21:04:56.385	6839447	94240	72
80a5a00a-9f38-4fbc-8692-bcebe61f900c	5dDNNq04RjKXFOADdHd6VX	2026-03-07 21:05:07.086	9188972	296784	71
4e7af058-aa03-4b93-a6be-7c6c5f6d8e35	4PMSwT0eBQfWB3cjH4t30s	2026-03-07 21:05:07.142	46578	2541	27
54fee9cf-cb97-4219-81e8-0536bc77500d	57ukrt4OCWcR4HL9sStvKW	2026-03-07 21:05:17.758	24926	948	21
895b3e7f-0a22-4def-b66f-328a998a0a44	1Zg2f2iwwB2bfxtKPkb4eI	2026-03-07 21:05:17.917	3167	410	9
2088d9b8-c6ff-4177-a7f8-7e3a299de5dc	0x9bzpifUdZFBQw7R1UWPT	2026-03-07 21:05:28.61	700389	9906	47
fe11d5ea-065d-4eec-a7a2-eb01a0e08297	2bXiTuKR1AMkSvmgh60706	2026-03-07 21:05:28.759	57473	3688	28
52fdfba7-249b-47eb-b705-68a4e650e922	3FUCRB0hJhe9BrXW1yonDh	2026-03-07 21:05:39.437	1756753	15041	56
c3367c52-e878-49b5-be5f-438f0880c8cd	70bgV7fa5H6sTah58wm73l	2026-03-07 21:05:39.578	275544	4001	40
e2a234ac-52a5-48ac-bebe-6a3a7e729483	2Wt4l7cu2A5QctQ04QCR6S	2026-03-07 21:05:50.206	220411	2218	40
6934711d-f78b-4cff-a180-f911dfc6c832	5dt5VvKgK1bVZodVPnx7AI	2026-03-07 21:05:50.283	543381	2034	46
888146ff-be6b-43b3-b69c-96c3828a1d0f	6Gr49ikaor5MuFQPBlOZ29	2026-03-07 21:06:00.978	478732	1435	45
8be23435-8468-4de9-93d4-2fffa93aacf7	50LbWtqqQeduRjJHLuwQed	2026-03-07 21:06:00.993	1708466	33063	57
837bc85f-9d96-44a4-8436-fabb458c2ece	5bePP411ITzZyWf1QZ2SX4	2026-03-07 21:06:11.637	4943904	132924	66
659a47cf-8de0-411f-b964-60cf745cda43	2sQHo73pQF1OTq3lDuQhlO	2026-03-07 21:06:11.906	4226379	61253	60
683000c9-bcab-4b34-aea9-4cd3e8b68810	2nIlwjrcU54whF2MWBcJSu	2026-03-07 21:06:22.577	4879	91	10
25064673-631e-4436-b6aa-335437d5a632	4bcHlUu9N2JzWzpz3kpzzy	2026-03-07 21:06:22.668	183606	17455	38
732667e3-b135-463a-b9a1-5930b6704532	30vnw2IDoHflDzAn9DpqLf	2026-03-07 21:06:33.26	47194	1226	26
29677743-e8b5-4b28-877d-83979623a46f	1mEkCpjXPIymCGkKCJzcl5	2026-03-07 21:06:33.681	196322	1421	41
40606e90-6db6-44e8-ac79-ad4438f29d86	1nzIoHG5B7klgAPdwjqRDj	2026-03-07 21:06:44.154	2275901	28285	56
0e5821b7-d493-429b-a7c7-44ad5282765b	3iG3DOwDRNNcU4SD26P0qp	2026-03-07 21:06:44.481	202776	8617	39
c99a72fc-7b78-4bf2-bea1-af107abab7e9	4hV3aU0WKvFaiX5ugXP5hp	2026-03-07 21:06:55.098	3206467	112369	59
5a67529c-c8dd-4aa3-b2ff-11dbfc8bcd05	6UR6L0rt11tuAsNdfMi7VP	2026-03-08 21:00:09.899	374285	3665	45
4a9bb6ff-f3f3-4b2e-9ad0-7a2bd7a7ba2b	2D6Twj1xGUoCVJExiBMQxU	2026-03-08 21:00:09.93	27321	494	24
3868d485-2076-46e4-8f7c-d3eed2690468	7I9nmXtGIFw9XUxNG36Q7N	2026-03-08 21:00:10.909	3071805	37099	62
00a8532c-0e1f-4cab-b089-03d75efc2404	0iPVlUddVxi8XrL3Ju8GAw	2026-03-08 21:00:10.969	2714385	34800	59
3012eab1-d28e-4950-97b0-2fa406677640	1NCYiPysYUzRk4YFg4rdic	2026-03-08 21:00:11.959	203633	1777	50
7e7d22ff-bfe6-437b-bee1-bfac2c15aff8	2Ytgz8jqYULfKBtQCNrihy	2026-03-08 21:00:12.21	1184422	8852	54
7060f85e-c5a5-49ad-afb4-932eca302954	6lTfkJgd8GHfPWGXHZWobD	2026-03-08 21:00:13.466	415005	28324	43
7f141335-8080-4cce-8db1-0b98fe86dfa8	7toT5rOUXkAj7zSVTs5qK1	2026-03-08 21:00:13.578	1083638	3594	51
715814ad-84f2-443d-b307-aaa55a865393	1mGbsqWvPgf7klYyW21hbl	2026-03-08 21:00:14.523	297193	708	46
cecf7ce9-944e-4529-a58f-768116f101d5	5jAVTF0vIdW64WZ7Lkiznq	2026-03-08 21:00:14.678	62713	427	32
5e45444b-7e4d-477f-81d6-554d57d01312	4LUGwmhDZqtSjnUczFG30c	2026-03-08 21:00:15.678	2662	36	7
f8148ad2-5aeb-49d0-9266-d09f7747a21d	5DRLYtYlq2OfR5zqiW2phF	2026-03-08 21:00:15.935	15396	31	18
0edab356-1184-4afb-9a0e-028ee4269a95	2DgNOnbtbBDq1mchoEP1nU	2026-03-08 21:00:17.234	28527	722	25
82f5372e-d59e-4d19-98a2-10b160bfe568	1w8PO0gTOOk74D2bH8Bmue	2026-03-08 21:00:17.456	168752	2251	38
ff023e83-2b7e-4cf6-b708-5f1561ed5a58	6e1LwzV1WAJFCdT1RsgqMK	2026-03-08 21:00:18.668	3914088	48259	66
b9984336-fc1f-4194-a7af-4e3ed49283da	2w3GrIBWmUZBrLUfj6O1dN	2026-03-08 21:00:18.806	3132911	51050	61
f96bb1a9-a994-4b56-969e-635fbda76d62	1TNkCF5hm5hJClAFD4LDAX	2026-03-08 21:00:20.047	20209	137	22
fc73d907-edcd-49a5-bad3-5e59d4feb3b7	247gLNFpJ7XimY1OgHpcPV	2026-03-08 21:00:20.154	373766	5211	45
5c674496-d1bd-4584-94d9-9ca91af69e19	033KOsWZnDKwpgINy9fZgp	2026-03-08 21:00:21.464	67733	188	31
2b1aa688-8697-4b39-9334-770d6964c53b	3EdNJeTXrsR5jbmICchj3R	2026-03-08 21:00:21.585	549108	33471	48
f58c6e73-f898-459b-8451-eeced268dcac	01YWFqWt6zsYOoq0MbIIJD	2026-03-08 21:00:22.897	1434927	16924	59
525c7c0d-b011-49d3-b18c-eb2b50102778	3UGzyQLULhjLbOzpXqhnEJ	2026-03-08 21:00:22.923	16516	11	19
8f3067cb-956e-453c-bb9b-369bcd5982c5	0ugPb6wev8X4JtROGeCzm1	2026-03-08 21:00:24.064	363446	29936	45
2f7ed4a9-f111-4fbb-9844-720e4cf8810c	3Ri3fz9VRH2u2Ohi9ngw4z	2026-03-08 21:00:24.095	1331	7	7
8c2b61c1-1406-4751-877d-da45c4a31b15	2ttCihAGZn9a8pck022YN6	2026-03-08 21:00:25.254	101577	199	36
569f5cdb-5059-4c3c-be01-062471847911	0NnCzXdSBu86fPXy6ZsfgU	2026-03-08 21:00:25.41	825	6	4
4d6be1e9-dd6a-4781-ad60-0a99c42851d4	3Oohh6pTxKXeLNeLXgalhe	2026-03-08 21:00:26.721	1689	225	6
c5ba071b-5c23-43c7-bf17-2e5ed3f39073	6fgxSvkznI98Dc33X7FynB	2026-03-08 21:00:26.829	310898	5026	42
2e0f76c7-456e-4241-b2d9-c3e0ddab063a	6DlWUEM6Qr9z6p6YAOLBDh	2026-03-08 21:00:28.185	898568	92387	52
f732d9df-d567-498c-bd06-e4ec4e7a41b7	2ONVcxFJ3vwQQirfRz7MAj	2026-03-08 21:00:28.285	6	10	1
ced298e0-6685-44e3-8f93-1b47357ea70b	5KTdGzdx68HWOnDAhNSvhs	2026-03-08 21:00:29.548	687924	3177	50
cade5493-94e0-46c5-8546-e0b82bd46dd6	2cx6gOmSDTfLBddNLTuA0X	2026-03-08 21:00:29.678	145120	14894	37
f762743c-0450-4a13-ae48-bb906ae5d828	1XDHghf5LSNMthHOcpK6rT	2026-03-08 21:00:30.51	1494892	6752	55
9c2fa4bd-91e7-41bc-9b06-3a56405df1f5	6qExyenranMv8TbLhG0B9p	2026-03-08 21:00:30.832	19048	64	22
688f9aa3-cb5f-4171-a8dd-ea303dfea12c	2xUrLIAss3e2KH44O8Iwt2	2026-03-08 21:00:32.023	2096	23	7
42ab1f19-836e-4998-887d-40c97adf9b90	7z3YJMEmDL2kLzZEsk4z6V	2026-03-08 21:00:32.045	317667	5238	43
54236ceb-bc70-4d68-b108-dbe96eec5877	0nkcbIDXNqh0qBDV0iyEJl	2026-03-08 21:00:33.234	135840	670	35
a57be3d4-4389-42cb-a97c-8d27daae900d	11kSAdTlX9GkEFnTMbFJxz	2026-03-08 21:00:33.446	660619	4019	50
5c86da06-3253-48af-8ca7-7ea480a22c7d	1w1IS5ufNR3HLQ0tMWYyGc	2026-03-08 21:00:34.877	490559	7480	48
044a0de7-c412-4a23-a57f-60eaee8db7d1	5mU6enX6pYYKEs0zfRkm1R	2026-03-08 21:00:34.93	2497090	52462	59
1eced7c9-8818-47bf-bacf-01e9577108d9	6ZhleMHIGIpjkBHrQDl4G7	2026-03-08 21:00:36.12	3853907	79924	62
8150674c-d60e-4495-94af-6d1abb3ed40b	4V9UWItDzoRmEGRJMXwjgx	2026-03-08 21:00:36.272	355071	675	43
9db4c07f-bfca-4902-b768-d1103088b52d	5mj2wRTtOG1m2r0dm8yPII	2026-03-08 21:00:37.641	10189	2457	16
b189df12-0521-436e-8b19-9824f791fb4d	1FTARqKNnQBxM5xreSwERx	2026-03-08 21:00:37.734	655712	3447	53
affac534-d9f6-4211-87be-c175f5adc638	1RQBeB371joZAYaFhNnAAD	2026-03-08 21:00:39.169	109702	1340	34
92206ecf-c2e7-433a-9fc5-949eedc8d63e	45c1TFQbVUqKUXJlMMDmUF	2026-03-08 21:00:39.19	78249	361	32
b65556ac-4120-43ff-94ba-e2714327a85b	5sZrMlmLdssEPC5EsdPMhm	2026-03-08 21:00:40.453	2301757	17898	57
a403afb1-2add-4d56-8513-12a3d95e8430	7qxDImq6MFph8fLy0FOTCq	2026-03-08 21:00:40.535	202100	12976	39
e5561d09-1a51-4de4-bbbb-ec3d29a36022	0TIzSozDGqKFcjoLMu1Jaf	2026-03-08 21:00:41.65	3677	38	11
dc6ed9b4-72d7-4662-88cf-4216e2a8173d	4XbwBWx9DLeZkb5bMYagyO	2026-03-08 21:00:41.654	738	16	5
72d880c4-831c-42ab-b781-f1a5b486eb00	0hqEZSihgORoXhQfj618gL	2026-03-08 21:00:42.949	29701	611	22
e22d6a6e-6d30-48b9-b0f9-5cc44792da96	1C2UjkEqaG9qPWJQMPouLV	2026-03-08 21:00:42.965	8127	1202	16
fd932a25-c1d2-4f41-a6b7-9dd017af87f4	0nENDvp4J2yRmBy3r2rsn8	2026-03-08 21:00:44.091	2666	75	6
2a515db2-6a3b-4224-b325-759ad53a0f16	26m3xIZAVqVGBmzBRPjZM0	2026-03-08 21:00:44.287	25557	275	23
759f3864-8fe5-421a-957c-a34613e172cb	7FqHcUwnhxJZAgS3I6GFFL	2026-03-08 21:00:45.683	4249842	76020	63
ac877df9-649a-42c1-8eb3-dce6698752d8	5A0DJQ2QfFYNZPMtChUYwi	2026-03-08 21:00:45.715	82	531	0
39db10eb-8517-4851-8778-0864fe23ccda	0lcBc44GjjqgkeMaH7RHuy	2026-03-08 21:00:46.702	3111	36	12
134af93b-1819-45d3-ab3f-9bc5087d9606	07iqb0293YC35yDyYm6sjB	2026-03-08 21:00:46.968	243879	34435	43
ed68a800-a0aa-4989-98a3-9a9654370880	2SE6mfDFx1U34XJsT48MUN	2026-03-08 21:00:47.825	2156182	20912	63
e257256d-8b60-435a-970d-e9f02689bf00	40wHE22g6LncLlOebhziyB	2026-03-08 21:00:47.941	113121	643	35
e22519e0-311e-4229-a14b-7ce525215620	5hfVobwxTC73whNVhzwlcP	2026-03-08 21:00:49.152	269576	12024	39
708744d9-c020-4d54-85e4-3ef9e1d50991	7KcQJ4ZkFbeaf8kTBjhkFV	2026-03-08 21:00:49.251	24648	1209	23
2d9990f6-8d11-447e-8b2a-c7b8c8d272cf	3OkRC6Ds1vCw9z22oaa6LG	2026-03-08 21:00:50.061	1	2	0
d76dd046-a901-4fe4-95d9-8fca36daa361	18NE0VFCA7M9c8coZaczZF	2026-03-08 21:00:50.181	58060	1158	28
2e26d5ad-5495-4450-ba47-31c686b5afd1	7ycusxDuR1PWLAdnnlIJLG	2026-03-08 21:00:51.432	7595	43	16
f699db14-b5b2-4164-919e-a36154fe7a98	5kFKWKOi67GISDFKogGbRP	2026-03-08 21:00:51.462	4401972	12831	62
f077af8d-1eb4-4da7-b2c9-0afe5c25fc1e	3u1FpUUqf57ITUFhImpSvQ	2026-03-08 21:00:52.469	56149	322	30
63fab3e6-390b-4e9c-a922-19fc5b4a9990	01PZm56J8KOLP7nS8wwc5H	2026-03-08 21:00:52.628	326241	8659	42
36e2c424-5f55-40a3-a8d2-fb978bde8372	6ugw7JCu0AG7txRcRAxU8d	2026-03-08 21:00:53.807	4291712	92319	64
3d9c7468-8d6d-4d15-a784-68b154f152b1	1H0ekJzZfzIWYp6rnLLDNp	2026-03-08 21:00:53.836	95634	1204	38
fa809a24-5795-47d2-9c30-7518469d58bd	6GPRIUFXdQ1I2uttxcC6gp	2026-03-08 21:00:54.925	326496	8915	47
792c7d5f-b571-4642-8b9d-ce97b05a244d	4YE03NBlIAI15Z63f9nGAz	2026-03-08 21:00:55.273	49427	1310	28
1abdf13f-6f53-4751-95ed-99f670d30fc2	6r6BCAeSvCMnNWuINxcod0	2026-03-08 21:00:56.558	1041761	8197	56
87520ceb-496c-41a1-884b-d77469dea175	6LaVVeak29aEvfZRe0LeZM	2026-03-08 21:00:56.733	10620	681	17
3e3a48d6-fe6d-4b88-bac1-ffe0f0a89770	2kNYL2JYHSNC4CcAhFLmv1	2026-03-08 21:00:57.987	1944	38	7
29b9cd3f-ed70-4686-bd7e-92963e38f437	0UU33EaoXPdJmS3n4UqkMB	2026-03-08 21:00:58.03	114628	1920	37
2ecf1d0b-7206-4f13-8ca3-0b0979d0a27a	4R9PzNRzLax8kYg4FBFW9v	2026-03-08 21:00:59.476	10196	448	14
5c6a376a-9790-477d-9a21-15bba82cc224	7srge3YZhsbYJDADQ3hNAh	2026-03-08 21:00:59.485	43647	10015	27
80a66094-f462-4a45-8600-601487a33540	4u8I7U2aikV5cFNNgkFspb	2026-03-08 21:01:00.724	653	418	5
257e1995-7cd7-42d4-b52f-0b64ce12f21d	3yiG6mZEIkR6tCVm27zR8M	2026-03-08 21:01:00.803	373452	3977	42
3fdeb8ce-7fa5-431c-9dbc-bf752118e1d2	3OeZMNhadN6lQLzCZj36Co	2026-03-08 21:01:01.857	27760	459	21
07e610cc-65e1-49e7-ad9c-aa87345d9012	2Kh25suyWxMoKhr8myU6qT	2026-03-08 21:01:02.132	525	94	3
880a02b6-a4b2-4d83-8033-1ba911900934	2N8joKKxKZgfI1KzoTE32s	2026-03-08 21:01:03.354	673	204	4
32525666-f36f-4b3c-b852-1cb437da6e4a	54gsrh6DBME953Fpy8ehiL	2026-03-08 21:01:03.567	715	175	4
caa3d921-42b9-4ff0-8d2a-ad12604731c3	7omIFZwIkStG7uBV0YvUOo	2026-03-08 21:01:05.066	25201	1170	21
14470c93-e90a-441e-8acd-e214d6c41bca	6Js6q2eytf3lr0kscLwQLr	2026-03-08 21:01:05.191	185505	1700	40
22430614-2dc5-4b2c-ab86-9b09143dff0e	5JtqySd5P0rQkyiP1VJNY4	2026-03-08 21:01:06.535	48436	1346	29
90992b46-558f-442f-a9e7-e82d3a5e3509	64Dm5t28gM3cFboYRoyXx3	2026-03-08 21:01:06.725	25532	3388	21
b71bb570-284e-453a-aef0-12c13099d208	3cxlQ0Uewom7A5991BxLrs	2026-03-08 21:01:08.08	46367	2810	26
82134161-d38f-4b5e-85f5-f31108c728df	1J4Pgh45jPSztpKaYf28IU	2026-03-08 21:01:08.113	319	51	1
1df2f777-ed32-4350-bbdc-dcc5058b3ba4	6Zx7LVroSu8P7ZOaYN1N26	2026-03-08 21:01:09.175	10009	121	15
749ca941-c85a-4ed5-89d0-8a1aaa87950b	6ghX1w9BWeRwePfrU7CHDY	2026-03-08 21:01:09.468	269	226	4
ef2d7085-5e05-4cde-b409-415f1716e655	1JZl3ouvyXBttMXp0S1CxR	2026-03-08 21:01:10.695	24	24	0
6bf099ac-dfd6-4b85-b3c8-28ed642296c8	0jqTwXrRNHAazdLpGZPAbO	2026-03-08 21:01:10.731	11034	1720	16
2aa28185-bbad-42a1-a344-300b282445e0	3FYvJvCdMjMJbpKevAWRD1	2026-03-08 21:01:11.821	6039	2290	13
50851756-7856-4cb9-b37b-766f50ae3f98	1nzIoHG5B7klgAPdwjqRDj	2026-03-08 21:01:11.926	2290642	28324	56
452c4c30-d68c-45f0-aa89-06019291cd7e	1lDzPdaXBLpD4PQhz1BVDZ	2026-03-08 21:01:13.014	83289	433	32
eab29658-ed3b-4680-8f2f-6ae36af86839	6pSimfu6LjnKpyGp21DfNx	2026-03-08 21:01:13.217	14	23	0
29c413cc-5371-45f1-92ca-179dfb0ca293	4ImTKqVizHcoMSabJSYUUd	2026-03-08 21:01:14.352	21383	5432	22
1661e37b-ec4e-49c1-b1ef-d0045724097e	2KQL6GwvxSKudMNOYXosgh	2026-03-08 21:01:14.445	10725	90	16
e0c68a17-8d8b-4a19-9bba-4adde58b890d	5hhGRImEQUVLGGK6kXH6IW	2026-03-08 21:01:15.213	64669	1251	28
4ddad7e1-d43e-4a43-8fe3-0e77a0b7823d	2TFvXvSjQQE2k66UqQaUu0	2026-03-08 21:01:15.452	6628	1002	14
dafd3d88-c07f-4488-8117-cf11e95ce2c1	5I9zgK6oqzspM98XVV7mX5	2026-03-08 21:01:16.803	696	268	5
7b3bb747-04c1-4b99-bb16-2428433a2e1f	1pKN9cQE0DUMTaVjK3GDer	2026-03-08 21:01:16.897	8472	139	14
db392036-5fe8-4acf-99f2-fe7a6cf750e6	46rrLekDLMkLlqjKcKlRjF	2026-03-08 21:01:17.923	7	3	0
8571d947-2b3c-4767-bf99-ae82ddbb7829	5yQ9nLSyfsWBHgGitXUgI6	2026-03-08 21:01:18.222	15	7	0
194a1dbe-88df-473a-825e-ccc086c26ab9	3AFAHn97pYdoN04JQmiU9L	2026-03-08 21:01:19.259	10584	762	15
424d11d2-b338-4b09-88f3-0e703ed2e650	5ujvUnyWSyn55iavLm4gmO	2026-03-08 21:01:19.518	209867	4196	43
ef3deac0-9139-4ff1-a5a9-a6f8285e8242	2dI2HO9HTC4ncZX4eSWBqo	2026-03-08 21:01:20.361	333948	248	43
a294a047-3862-49f2-8cab-062680594617	7MRnU6jGSb7wmPPN2elcAZ	2026-03-08 21:01:20.872	171701	1734	38
de684947-db5e-407e-a2d2-d2cf20c69a07	0RIxb6yWBOE3yGMYOk4GBf	2026-03-08 21:01:21.997	340058	3328	42
f2c6b4bf-2abd-4071-9c82-1d2df092a022	0dvtLRu7WVJfrOPyzyh0xV	2026-03-08 21:01:22.152	71639	944	29
335e8456-823b-4db3-a924-48fe992e1aa3	2zVtiyn1AJTHZjaGy3fLxo	2026-03-08 21:01:23.209	126312	863	34
bb292e03-5a69-433e-91c9-2d609b58bfbf	2ggORvovDqjBh2JBoj6UzH	2026-03-08 21:01:23.442	159301	1036	38
30a19bed-b141-4b1b-a335-9e8ee17fc148	3XQPFdkxaZvbKP9bfaTwql	2026-03-08 21:01:24.44	144946	4376	39
68f9160e-a84f-4227-88c0-b1168b8a3938	1lwGYXEMwAdAnGSMg2AwUc	2026-03-08 21:01:24.668	3545	278	9
b5b40d06-febf-4ca1-8cd7-9202a1d2c2b0	0s0DvJFAQKeusgS4pEy7nE	2026-03-08 21:01:25.746	7152	222	15
d50fe098-367d-4c15-a034-701e4e326311	5sCC5D4QRUqUzdZm75OtFO	2026-03-08 21:01:25.854	1211	11	7
7770d283-7593-4851-863a-e92618568c79	1jQxSJ2pdouWzijTdkWsIQ	2026-03-08 21:01:27.074	1080	184	6
7790bb00-a4be-40c8-ba32-5a3a98ebf130	2p1bgggvCXinSQz2OtBHXu	2026-03-08 21:01:27.154	794768	35182	55
\.


--
-- Data for Name: BalanceAdjustment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BalanceAdjustment" (id, "artistId", "userId", amount, currency, reason, "createdById", "createdAt") FROM stdin;
3c0b43de-cdc8-48f5-8727-af91fcbf2370	51K0b3lRd87cKX02hU26we	e92bb90c-cd0e-4214-a3cf-bf485316b6fd	100	USD	test	e92bb90c-cd0e-4214-a3cf-bf485316b6fd	2026-03-08 07:26:27.598
\.


--
-- Data for Name: ChangeRequest; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ChangeRequest" (id, type, status, details, "adminNote", "filesJson", "releaseId", "userId", "assignedToId", "createdAt", "updatedAt") FROM stdin;
79ee33fe-3319-407b-9656-8c09edc0813d	take_down	pending	dfaf	\N	\N	\N	e92bb90c-cd0e-4214-a3cf-bf485316b6fd	\N	2026-03-08 08:06:48.073	2026-03-08 08:06:48.073
\.


--
-- Data for Name: ChangeRequestComment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ChangeRequestComment" (id, "requestId", "userId", content, "createdAt") FROM stdin;
\.


--
-- Data for Name: Contract; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Contract" (id, "demoId", "releaseId", "userId", "artistId", "artistShare", "createdAt", "labelShare", notes, "pdfUrl", status, title, "updatedAt", "featuredArtists", "primaryArtistEmail", "primaryArtistName", "signedAt", "terminatedAt") FROM stdin;
\.


--
-- Data for Name: Demo; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Demo" (id, title, status, "createdAt", "artistId", "updatedAt", genre, message, "rejectionReason", "reviewedAt", "reviewedBy", "scheduledReleaseDate", "trackLink", "featuredArtists") FROM stdin;
\.


--
-- Data for Name: DemoFile; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."DemoFile" (id, filename, filepath, filesize, "createdAt", "demoId") FROM stdin;
\.


--
-- Data for Name: Earning; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Earning" (id, "contractId", period, "grossAmount", "artistAmount", "labelAmount", currency, streams, source, "expenseAmount", "paidToArtist", "paidAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Payment" (id, "userId", amount, currency, method, reference, status, "processedAt", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PayoutRequest; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PayoutRequest" (id, "userId", amount, currency, "wiseEmail", "wiseAccountId", "wiseTransferId", status, notes, "processedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Release; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Release" (id, "createdAt", name, "updatedAt", "artistName", "artistsJson", image, "releaseDate", type, "baseTitle", popularity, "previewUrl", "spotifyUrl", "streamCountText", "totalTracks", "versionName") FROM stdin;
2EVkHvO9C4nbgSeqtXZNMD	2026-03-04 20:15:03.555	MONTAGEM RAKETA	2026-03-09 17:04:19.132	ANDROMEDA, Yb Wasg'ood, elysian.	[{"id":"1RklNDIiYVZ3dYdEUnB0cS","name":"ANDROMEDA"},{"id":"02wf6SCDwrs2qTX09X0IRE","name":"Yb Wasg'ood"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b27355749ee475273a3b79b382fd	2025-09-19T00:00:00.000Z	single	MONTAGEM RAKETA	36	\N	https://open.spotify.com/album/2EVkHvO9C4nbgSeqtXZNMD	\N	5	\N
6H6i8kdbyBzQZY5QPxu4g3	2026-03-04 20:15:03.556	FUNK DO ATMOSPHERE	2026-03-09 17:04:19.271	74blade, stxrbøy, elysian.	[{"id":"07CoGyrUbcBkSzvs1Kd9i6","name":"74blade"},{"id":"4hDC6zuK2V5qwyeJcydSPS","name":"stxrbøy"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b2738e39a3bdb4a8b3b26132e1ef	2025-10-20T00:00:00.000Z	single	FUNK DO ATMOSPHERE	42	\N	https://open.spotify.com/album/6H6i8kdbyBzQZY5QPxu4g3	\N	5	\N
6LQSLKfk6hWtRxwMrN1P2w	2026-03-04 20:15:03.561	MARASMA	2026-03-09 17:04:19.482	ZEVXR, GARIX, elysian.	[{"id":"6qVUFaRkVzdtF9Wg0vxeKH","name":"ZEVXR"},{"id":"6JvsRSaeBQIAb6LYyNCBht","name":"GARIX"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b27344d315c6e762e5638ae93a21	2025-10-17T00:00:00.000Z	single	MARASMA	21	\N	https://open.spotify.com/album/6LQSLKfk6hWtRxwMrN1P2w	\N	4	\N
3zu9L8OuehwTTdEwZyiRTC	2026-03-04 20:15:03.563	Som Do Jogar	2026-03-09 17:04:19.574	skullidze, TXMZ, elysian.	[{"id":"53yzF4tOwqwPwwkdo70fmL","name":"skullidze"},{"id":"5xyNvcWaZKre83tW46w5Jp","name":"TXMZ"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b2736bf71bbaca294a97b1afbfc8	2025-10-15T00:00:00.000Z	single	Som Do Jogar	2	\N	https://open.spotify.com/album/3zu9L8OuehwTTdEwZyiRTC	\N	5	\N
4dXuus8PEpZtEs09O63nC3	2026-03-04 20:15:03.565	DARK SINNER	2026-03-09 17:04:19.744	Hxlkart, justforgetme, elysian.	[{"id":"7drEn5GMrJRJhb3dy0LxSR","name":"Hxlkart"},{"id":"4thCAXlpGSQSUe13fvzjrA","name":"justforgetme"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b273f3059e7746247d657435909e	2025-10-08T00:00:00.000Z	single	DARK SINNER	4	\N	https://open.spotify.com/album/4dXuus8PEpZtEs09O63nC3	\N	5	\N
5LQj42CQd89r4ZifHKDMfv	2026-03-04 20:15:03.567	MONTAGEM MANDELA BAILA	2026-03-09 17:04:19.822	MVSTERIOUS, elysian.	[{"id":"5mU6enX6pYYKEs0zfRkm1R","name":"MVSTERIOUS"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b273254d3faf142b15d37a4165d1	2025-10-03T00:00:00.000Z	single	MONTAGEM MANDELA BAILA	30	\N	https://open.spotify.com/album/5LQj42CQd89r4ZifHKDMfv	\N	4	\N
0YyAbc9dGtIELiSAYiWfKN	2026-03-04 20:15:03.568	SEM PARAR	2026-03-09 17:04:19.898	nreaz, LeoTHM, AxelitoHmn, elysian.	[{"id":"5uDZGPzOYAzfOhw1lxmhwL","name":"nreaz"},{"id":"6E7d0UydWwTMqxXzNRdp78","name":"LeoTHM"},{"id":"4JQGeB5BANQdgSABnKHBVY","name":"AxelitoHmn"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b273b50c6bfd60c68be0397ae0ba	2025-10-01T00:00:00.000Z	single	SEM PARAR	13	\N	https://open.spotify.com/album/0YyAbc9dGtIELiSAYiWfKN	\N	5	\N
6pZzTWRDph1xawUdVCuDoF	2026-03-04 20:15:03.537	MONTAGEM COMA (Versions)	2026-03-09 17:04:18.171	ANDROMEDA, elysian.	[{"id":"1RklNDIiYVZ3dYdEUnB0cS","name":"ANDROMEDA"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b273554cf87dd4c09873f8c3f9a1	2025-09-01T00:00:00.000Z	single	MONTAGEM COMAs)	53	\N	https://open.spotify.com/album/6pZzTWRDph1xawUdVCuDoF	\N	3	Version
1jiBZtlymjxX6HEcScQaqJ	2026-03-04 20:15:03.539	MONTAGEM PASA	2026-03-09 17:04:18.247	ANDROMEDA, Pheyx, elysian.	[{"id":"1RklNDIiYVZ3dYdEUnB0cS","name":"ANDROMEDA"},{"id":"1w8PO0gTOOk74D2bH8Bmue","name":"Pheyx"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b273072d1a17d5c931e3879304fb	2025-10-10T00:00:00.000Z	single	MONTAGEM PASA	49	\N	https://open.spotify.com/album/1jiBZtlymjxX6HEcScQaqJ	\N	4	\N
50GFIHrHmyaDEJDbwEsdvY	2026-03-04 20:15:03.541	SUPORTANO	2026-03-09 17:04:18.327	ANDROMEDA, BEATHXVEN, elysian.	[{"id":"1RklNDIiYVZ3dYdEUnB0cS","name":"ANDROMEDA"},{"id":"0EXytqF1qOmpGIVb1AwYdJ","name":"BEATHXVEN"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b2738fa59a5e032b265a993258ee	2025-11-14T00:00:00.000Z	single	SUPORTANO	32	\N	https://open.spotify.com/album/50GFIHrHmyaDEJDbwEsdvY	\N	5	\N
5iLh0rSG2c0iQHvN6fo0O6	2026-03-04 20:15:03.543	ERES MI CORAZON	2026-03-09 17:04:18.408	ANDROMEDA, h6itam, elysian.	[{"id":"1RklNDIiYVZ3dYdEUnB0cS","name":"ANDROMEDA"},{"id":"0exQbKNFd9pLmdIGycwmlf","name":"h6itam"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b2738674f1968984d45256d1be86	2025-10-31T00:00:00.000Z	single	ERES MI CORAZON	33	\N	https://open.spotify.com/album/5iLh0rSG2c0iQHvN6fo0O6	\N	5	\N
7psOLx0K87hzoeyc6ZUl69	2026-03-04 20:15:03.545	LEDA VEM!	2026-03-09 17:04:18.486	ANDROMEDA, Ogryzek, elysian.	[{"id":"1RklNDIiYVZ3dYdEUnB0cS","name":"ANDROMEDA"},{"id":"1Sdc6ySbIvzO0X9vbyHzWm","name":"Ogryzek"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b2739975cc12794035a1fdf10167	2025-10-24T00:00:00.000Z	single	LEDA VEM!	31	\N	https://open.spotify.com/album/7psOLx0K87hzoeyc6ZUl69	\N	5	\N
5vtp47ErGQ03G9BYIYXjWr	2026-03-04 20:15:03.547	BATIDA SOMBRIA	2026-03-09 17:04:18.57	NOIXES, elysian.	[{"id":"4YeITwoqeIks45gELm488B","name":"NOIXES"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b2736efce0a459b9814149bc6155	2025-11-12T00:00:00.000Z	single	BATIDA SOMBRIA	14	\N	https://open.spotify.com/album/5vtp47ErGQ03G9BYIYXjWr	\N	4	\N
4Cmp8b66znhz6PnlVdgeLh	2026-03-04 20:15:03.55	MONTAGEM TACHI	2026-03-09 17:04:18.655	74blade, DRAWMEDEATH, MXRDERDEAD, elysian.	[{"id":"07CoGyrUbcBkSzvs1Kd9i6","name":"74blade"},{"id":"2UKmwMB2wMQMvQcduijrQi","name":"DRAWMEDEATH"},{"id":"04zt4agcJcyZoHpSs3RnqW","name":"MXRDERDEAD"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b2732d44e18da6b8b06612c8a0f8	2025-10-29T00:00:00.000Z	single	MONTAGEM TACHI	29	\N	https://open.spotify.com/album/4Cmp8b66znhz6PnlVdgeLh	\N	5	\N
4GQ3aSNOTZSj9bFCXu8p05	2026-03-04 20:15:03.552	FELA FELA	2026-03-09 17:04:18.786	ANDROMEDA, ONIMXRU, elysian.	[{"id":"1RklNDIiYVZ3dYdEUnB0cS","name":"ANDROMEDA"},{"id":"3ysIyoivMDpeqLg0VMRPQw","name":"ONIMXRU"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b273061cfa23848768cc016956e4	2025-10-27T00:00:00.000Z	single	FELA FELA	26	\N	https://open.spotify.com/album/4GQ3aSNOTZSj9bFCXu8p05	\N	4	\N
60k4dBKamKNMfikbFH0rkf	2026-03-04 20:15:03.553	MOGGED	2026-03-09 17:04:18.864	DudePlaya, elysian.	[{"id":"0ypzv0AG6k3yZjNxdhpnJF","name":"DudePlaya"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b2736b4ada55c1b9e13f339b35ad	2025-05-02T00:00:00.000Z	single	MOGGED	36	\N	https://open.spotify.com/album/60k4dBKamKNMfikbFH0rkf	\N	4	\N
55t4LBHy9G9deFYLJcZioC	2026-03-04 20:15:03.554	PASSO MANA	2026-03-09 17:04:18.943	REGXRD, elysian.	[{"id":"0DVWkIG75PBtzwbE0Sly8w","name":"REGXRD"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b273e667b2ecd40a2474d2877c52	2025-04-21T00:00:00.000Z	single	PASSO MANA	37	\N	https://open.spotify.com/album/55t4LBHy9G9deFYLJcZioC	\N	4	\N
6IYWZhaa0UkyslGzmlfDhw	2026-03-04 20:15:03.598	AHEYA	2026-03-09 17:04:20.924	n¡no, elysian.	[{"id":"2dVJkcQL5tMX02UH56iTo1","name":"n¡no"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b273d8900ae8d6cdfc4f87687cfe	2025-07-25T00:00:00.000Z	single	AHEYA	3	\N	https://open.spotify.com/album/6IYWZhaa0UkyslGzmlfDhw	\N	4	\N
4wpOhJXmL3pPpDZ8ea8rdF	2026-03-04 20:15:03.599	KIMO DE KIMO	2026-03-09 17:04:21.004	LAYXMANE, En1t, justforgetme, elysian.	[{"id":"4WBFx3Wen7AY4vlMffuZTO","name":"LAYXMANE"},{"id":"6I1Xg3EHFdDmWqy7UPmqKb","name":"En1t"},{"id":"4thCAXlpGSQSUe13fvzjrA","name":"justforgetme"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b27385029a845c3e90dda94e6a7a	2025-07-23T00:00:00.000Z	single	KIMO DE KIMO	1	\N	https://open.spotify.com/album/4wpOhJXmL3pPpDZ8ea8rdF	\N	4	\N
0u2gksMGiuBWnp4iVdSytz	2026-03-04 20:15:03.601	MONTAGEM CELEBRADO	2026-03-09 17:04:21.083	JFEXX, elysian.	[{"id":"30S401kK22I3HKdI2uHZgp","name":"JFEXX"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b2736145239f683869a78eac1b5f	2025-07-21T00:00:00.000Z	single	MONTAGEM CELEBRADO	10	\N	https://open.spotify.com/album/0u2gksMGiuBWnp4iVdSytz	\N	5	\N
59SmpB7vJycT858aYL40j2	2026-03-04 20:15:03.602	Noche Magica	2026-03-09 17:04:21.34	NOIXES, Phonknight, elysian.	[{"id":"4YeITwoqeIks45gELm488B","name":"NOIXES"},{"id":"1nIwABuN4D2w2SaE4ML7OA","name":"Phonknight"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b273b99e9e4ab92967c3f08dd651	2025-07-18T00:00:00.000Z	single	Noche Magica	11	\N	https://open.spotify.com/album/59SmpB7vJycT858aYL40j2	\N	4	\N
145FxIZbHRBDCeicDeEGdQ	2026-03-04 20:15:03.604	Lost.exe	2026-03-09 17:04:21.506	Slixshøt, elysian.	[{"id":"3eZBjp3ibCgDuKzo3PA8vh","name":"Slixshøt"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b273cea852e6e4a58fbdc6e6f204	2025-07-18T00:00:00.000Z	single	Lost.exe	33	\N	https://open.spotify.com/album/145FxIZbHRBDCeicDeEGdQ	\N	4	\N
13XKL8Z7DvrBKwzkf40eZ2	2026-03-04 20:15:03.614	VEM PRO BAILE	2026-03-09 17:04:21.584	stxrbøy, justforgetme, LAYXMANE, elysian.	[{"id":"4hDC6zuK2V5qwyeJcydSPS","name":"stxrbøy"},{"id":"4thCAXlpGSQSUe13fvzjrA","name":"justforgetme"},{"id":"4WBFx3Wen7AY4vlMffuZTO","name":"LAYXMANE"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b273a9dc47b941254dcb4913f5a5	2025-07-16T00:00:00.000Z	single	VEM PRO BAILE	10	\N	https://open.spotify.com/album/13XKL8Z7DvrBKwzkf40eZ2	\N	4	\N
6CAEpsksYNnKANNzUNAXut	2026-03-04 20:15:03.581	VEM SARRANDO	2026-03-09 17:04:20.261	RVNGE, NOIXES, elysian.	[{"id":"164O6SBXwBBGLV2P809KUS","name":"RVNGE"},{"id":"4YeITwoqeIks45gELm488B","name":"NOIXES"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b27313349ea7880b308b1fe5df92	2025-09-01T00:00:00.000Z	single	VEM SARRANDO	17	\N	https://open.spotify.com/album/6CAEpsksYNnKANNzUNAXut	\N	4	\N
5hJb8Zzb8BWYSnkIZ1ik3F	2026-03-04 20:15:03.586	MONTAGEM SENDITA	2026-03-09 17:04:20.339	ANDROMEDA, MVSTERIOUS, elysian.	[{"id":"1RklNDIiYVZ3dYdEUnB0cS","name":"ANDROMEDA"},{"id":"5mU6enX6pYYKEs0zfRkm1R","name":"MVSTERIOUS"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b2735d5dbb7d5b9d1a23881667ae	2025-08-29T00:00:00.000Z	single	MONTAGEM SENDITA	28	\N	https://open.spotify.com/album/5hJb8Zzb8BWYSnkIZ1ik3F	\N	4	\N
2RLovgMjQ8o2SNPJD0OdUy	2026-03-04 20:15:03.588	MONTAGEM QUIERO	2026-03-09 17:04:20.42	Penkramin, SNYSTA, elysian.	[{"id":"1o2FbPtsJOONvAlInXNwYo","name":"Penkramin"},{"id":"7ByARkW6MwBGBC6ak72wPN","name":"SNYSTA"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b27362ec21485121790700a3a8a6	2025-08-25T00:00:00.000Z	single	MONTAGEM QUIERO	12	\N	https://open.spotify.com/album/2RLovgMjQ8o2SNPJD0OdUy	\N	5	\N
2JLd1JfmWvSc042aCowS5j	2026-03-04 20:15:03.589	KADO	2026-03-09 17:04:20.498	wharoxmane, TRVXER, elysian.	[{"id":"3f8c42vQhwylI4lWCC6ARZ","name":"wharoxmane"},{"id":"0OTjk4QUX6zTvaZy6XOooY","name":"TRVXER"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b273622fbf6c066eaabda4f8cbd6	2025-08-18T00:00:00.000Z	single	KADO	8	\N	https://open.spotify.com/album/2JLd1JfmWvSc042aCowS5j	\N	5	\N
2UFr9rkSJ4Uno1E3VrKeOd	2026-03-04 20:15:03.591	PONTA DO PARAFALL	2026-03-09 17:04:20.586	NOIXES, Mc Gimenes, elysian.	[{"id":"4YeITwoqeIks45gELm488B","name":"NOIXES"},{"id":"2EOtEHNNR9N1dP5J2I1cHo","name":"Mc Gimenes"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b2732de9771a10cc357583370ed9	2025-08-13T00:00:00.000Z	single	PONTA DO PARAFALL	6	\N	https://open.spotify.com/album/2UFr9rkSJ4Uno1E3VrKeOd	\N	4	\N
6ukCTpXuBGw6yZMzcuOUR9	2026-03-04 20:15:03.593	Corazon Estallar	2026-03-09 17:04:20.668	RVNGE, JXNDRO, elysian.	[{"id":"164O6SBXwBBGLV2P809KUS","name":"RVNGE"},{"id":"62vwt2P3iBw4NwHdDZb27q","name":"JXNDRO"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b273b5d17ec67a7a0f3ff2336784	2025-08-08T00:00:00.000Z	single	Corazon Estallar	31	\N	https://open.spotify.com/album/6ukCTpXuBGw6yZMzcuOUR9	\N	6	\N
7GSK9yKM2GRH0vNO41BXyV	2026-03-04 20:15:03.595	VERA	2026-03-09 17:04:20.745	NVXUS, DJ FXSH, elysian.	[{"id":"1QYXUjQBqVpFKlxfrYsk4h","name":"NVXUS"},{"id":"4czULjQ9jyER349yjpYYcS","name":"DJ FXSH"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b273326b29d3a7deb27853e935b9	2025-08-04T00:00:00.000Z	single	VERA	12	\N	https://open.spotify.com/album/7GSK9yKM2GRH0vNO41BXyV	\N	5	\N
55XELY10VGCjcx2KyaRT7N	2026-03-04 20:15:03.596	COM CALMA	2026-03-09 17:04:20.847	NOIXES, Phonknight, elysian.	[{"id":"4YeITwoqeIks45gELm488B","name":"NOIXES"},{"id":"1nIwABuN4D2w2SaE4ML7OA","name":"Phonknight"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b273d566352936fe28d09721fba4	2025-07-30T00:00:00.000Z	single	COM CALMA	15	\N	https://open.spotify.com/album/55XELY10VGCjcx2KyaRT7N	\N	4	\N
0AIjLnjFwiNiavroWmg1Tj	2026-03-04 20:15:03.635	CORALINE FUNK	2026-03-09 17:04:23.827	NEKKZI, RezaDead, elysian.	[{"id":"2bXiTuKR1AMkSvmgh60706","name":"NEKKZI"},{"id":"0x9bzpifUdZFBQw7R1UWPT","name":"RezaDead"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b273d037bb2cb4a52a06fc9326df	2025-05-21T00:00:00.000Z	single	CORALINE FUNK	13	\N	https://open.spotify.com/album/0AIjLnjFwiNiavroWmg1Tj	\N	5	\N
6G2bbsIiICVczM9v2ds4dH	2026-03-04 20:15:03.637	ELO DO JACARÉ	2026-03-09 17:04:24.58	DARKANASE, elysian.	[{"id":"3FUCRB0hJhe9BrXW1yonDh","name":"DARKANASE"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b273d07b57ce8b7e76744470992c	2025-05-19T00:00:00.000Z	single	ELO DO JACARÉ	0	\N	https://open.spotify.com/album/6G2bbsIiICVczM9v2ds4dH	\N	4	\N
3atWaETbKgKeE9kVHitVyi	2026-03-04 20:15:03.642	MONTAGEM DESCONTROLADO	2026-03-09 17:04:25.807	NOIXES, Phonknight, elysian.	[{"id":"4YeITwoqeIks45gELm488B","name":"NOIXES"},{"id":"1nIwABuN4D2w2SaE4ML7OA","name":"Phonknight"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b27308cf06c6c507f9e09f08c11e	2025-05-16T00:00:00.000Z	single	MONTAGEM DESCONTROLADO	14	\N	https://open.spotify.com/album/3atWaETbKgKeE9kVHitVyi	\N	4	\N
28oTMwJekFIXVxuG3vWIrj	2026-03-04 20:15:03.644	RIO RAVE	2026-03-09 17:04:26.046	HXDES, DYNAMIS, elysian.	[{"id":"70bgV7fa5H6sTah58wm73l","name":"HXDES"},{"id":"2Wt4l7cu2A5QctQ04QCR6S","name":"DYNAMIS"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b2736217247a787da9cc075a195f	2025-05-14T00:00:00.000Z	single	RIO RAVE	6	\N	https://open.spotify.com/album/28oTMwJekFIXVxuG3vWIrj	\N	4	\N
2oWLUTU3VMGEbBM7G0Bmxd	2026-03-04 20:15:03.646	COMPLEXO DO ALEMÃO	2026-03-09 17:04:26.333	NOTXNDYBOY, HIMXN, Mc Bockaum, elysian.	[{"id":"5dt5VvKgK1bVZodVPnx7AI","name":"NOTXNDYBOY"},{"id":"50LbWtqqQeduRjJHLuwQed","name":"HIMXN"},{"id":"6Gr49ikaor5MuFQPBlOZ29","name":"Mc Bockaum"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b2730de67075e04a585468843f8b	2025-05-12T00:00:00.000Z	single	COMPLEXO DO ALEMÃO	14	\N	https://open.spotify.com/album/2oWLUTU3VMGEbBM7G0Bmxd	\N	4	\N
6sFCGivyUSMOMKSMcv7tGJ	2026-03-04 20:15:03.647	MONTAGEM FAVELA	2026-03-09 17:04:26.617	REGXRD, elysian.	[{"id":"0DVWkIG75PBtzwbE0Sly8w","name":"REGXRD"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b2733f057760fd68755fd266ebbb	2025-05-09T00:00:00.000Z	single	MONTAGEM FAVELA	11	\N	https://open.spotify.com/album/6sFCGivyUSMOMKSMcv7tGJ	\N	4	\N
1n8QTJZGBr0HAqn2TIxz7T	2026-03-04 20:15:03.65	LA VIDA	2026-03-09 17:04:26.892	NOIXES, elysian.	[{"id":"4YeITwoqeIks45gELm488B","name":"NOIXES"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b27333e2d45f9327ac10d2b3e87c	2025-05-07T00:00:00.000Z	single	LA VIDA	12	\N	https://open.spotify.com/album/1n8QTJZGBr0HAqn2TIxz7T	\N	4	\N
4B2tw87U16tCEWSz2hIFaz	2026-03-04 20:15:03.618	Sad Girl	2026-03-09 17:04:21.81	Igrxs, LØST, elysian.	[{"id":"7FgaWBwYSxy5cywT6XOPdt","name":"Igrxs"},{"id":"5w4mniCcdjpn4yTHlPfniW","name":"LØST"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b273582412d2bafafbae7fe281f5	2025-07-09T00:00:00.000Z	single	Sad Girl	1	\N	https://open.spotify.com/album/4B2tw87U16tCEWSz2hIFaz	\N	4	\N
6eFtE9qzpxM0NapCtOC717	2026-03-04 20:15:03.62	Solara	2026-03-09 17:04:21.92	LØST, elysian.	[{"id":"5w4mniCcdjpn4yTHlPfniW","name":"LØST"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b27370c300a6ae2f03d8e676fde6	2025-06-30T00:00:00.000Z	single	Solara	14	\N	https://open.spotify.com/album/6eFtE9qzpxM0NapCtOC717	\N	4	\N
2fLUJWx8qadc6PDuYplxdP	2026-03-04 20:15:03.622	AYE PAPI FUNK	2026-03-09 17:04:22.029	Beyounger, Prost, elysian.	[{"id":"514Qze5V7AvD6wVSwdQB8Y","name":"Beyounger"},{"id":"03pt9mCEKaO0GepoXTV5uZ","name":"Prost"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b273938e11af8533b4cbdd815ded	2025-06-23T00:00:00.000Z	single	AYE PAPI FUNK	6	\N	https://open.spotify.com/album/2fLUJWx8qadc6PDuYplxdP	\N	4	\N
5lOVdC1m3c0Kpf1YRAdrA6	2026-03-04 20:15:03.624	VIBE	2026-03-09 17:04:22.187	Ogryzek, NOIXES, elysian.	[{"id":"1Sdc6ySbIvzO0X9vbyHzWm","name":"Ogryzek"},{"id":"4YeITwoqeIks45gELm488B","name":"NOIXES"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b273eeba9aa3169df8ca26f41753	2025-06-20T00:00:00.000Z	single	VIBE	41	\N	https://open.spotify.com/album/5lOVdC1m3c0Kpf1YRAdrA6	\N	4	\N
3NfjzoPZqb2wd8pONoyRGa	2026-03-04 20:15:03.626	LIFT OFF	2026-03-09 17:04:22.37	NXGHT!, SEKIMANE, elysian.	[{"id":"7lAaAGxYxk2GH8cMbTEwAL","name":"NXGHT!"},{"id":"1yevH7mkPMXeSTnA9SwHvq","name":"SEKIMANE"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b273cbe8e49e3a25dc40a0b557db	2025-06-18T00:00:00.000Z	single	LIFT OFF	21	\N	https://open.spotify.com/album/3NfjzoPZqb2wd8pONoyRGa	\N	6	\N
0ZVKOKyUAkbp4wZke2CP6r	2026-03-04 20:15:03.628	ZINC	2026-03-09 17:04:22.447	KXNSEI, elysian.	[{"id":"60J22gmJOU5t1n8NmW0XSK","name":"KXNSEI"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b273c6aeef16c10cf88a10c510cf	2025-06-16T00:00:00.000Z	single	ZINC	0	\N	https://open.spotify.com/album/0ZVKOKyUAkbp4wZke2CP6r	\N	5	\N
1tU39Wj0sWvmn5VDY2cR7a	2026-03-04 20:15:03.629	TE VEO POR AHÌ	2026-03-09 17:04:22.53	Scythermane, SEKIMANE, elysian.	[{"id":"5dDNNq04RjKXFOADdHd6VX","name":"Scythermane"},{"id":"1yevH7mkPMXeSTnA9SwHvq","name":"SEKIMANE"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b2730dd098d2c6b1d2c76de57f29	2025-06-12T00:00:00.000Z	single	TE VEO POR AHÌ	33	\N	https://open.spotify.com/album/1tU39Wj0sWvmn5VDY2cR7a	\N	6	\N
2TERHQRdsuWHv1iuo8E1y7	2026-03-04 20:15:03.631	BAILAR	2026-03-09 17:04:22.754	ANDROMEDA, Mwwlkiy, Phonknight, elysian.	[{"id":"1RklNDIiYVZ3dYdEUnB0cS","name":"ANDROMEDA"},{"id":"4PMSwT0eBQfWB3cjH4t30s","name":"Mwwlkiy"},{"id":"1nIwABuN4D2w2SaE4ML7OA","name":"Phonknight"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b273ff8af8bdc04395365e9adf6b	2025-06-11T00:00:00.000Z	single	BAILAR	19	\N	https://open.spotify.com/album/2TERHQRdsuWHv1iuo8E1y7	\N	4	\N
7Ek69mTA4S6F5msF9BzkWU	2026-03-04 20:15:03.632	Funk De Rio	2026-03-09 17:04:22.835	Penkramin, DVNIZER, elysian.	[{"id":"1o2FbPtsJOONvAlInXNwYo","name":"Penkramin"},{"id":"1Zg2f2iwwB2bfxtKPkb4eI","name":"DVNIZER"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b2732943a92edc7dd800b1527d15	2025-06-09T00:00:00.000Z	single	Funk De Rio	6	\N	https://open.spotify.com/album/7Ek69mTA4S6F5msF9BzkWU	\N	4	\N
0OWSU8BjgN3XQSem9fGVrw	2026-03-04 20:15:03.634	MTG HALO	2026-03-09 17:04:23.411	NXDLS, elysian.	[{"id":"57ukrt4OCWcR4HL9sStvKW","name":"NXDLS"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b27349ff20ffbeea5be6257f0f43	2025-05-26T00:00:00.000Z	single	MTG HALO	14	\N	https://open.spotify.com/album/0OWSU8BjgN3XQSem9fGVrw	\N	5	\N
2BgtZq8eLVpq6KAcRPhAAc	2026-03-04 20:15:03.66	FUNK CORACAO	2026-03-09 17:04:28.587	NOIXES, Yung Zime, elysian.	[{"id":"4YeITwoqeIks45gELm488B","name":"NOIXES"},{"id":"3iG3DOwDRNNcU4SD26P0qp","name":"Yung Zime"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b273e06f4d60ef56d944c37c5191	2024-12-27T00:00:00.000Z	single	FUNK CORACAO	16	\N	https://open.spotify.com/album/2BgtZq8eLVpq6KAcRPhAAc	\N	4	\N
0npGPBqY9AtD8NqFSLMF5P	2026-03-04 20:15:03.665	TOMA TOMA	2026-03-09 17:04:28.905	Mc Pogba, NOIXES, elysian.	[{"id":"2sQHo73pQF1OTq3lDuQhlO","name":"Mc Pogba"},{"id":"4YeITwoqeIks45gELm488B","name":"NOIXES"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b273fe83199f3b564297140759fe	2024-11-08T00:00:00.000Z	single	TOMA TOMA	36	\N	https://open.spotify.com/album/0npGPBqY9AtD8NqFSLMF5P	\N	5	\N
5k8jDV518pIk74gBsU72fi	2026-03-04 20:15:03.531	MONTAGEM COMA	2026-03-09 17:04:17.919	ANDROMEDA, elysian.	[{"id":"1RklNDIiYVZ3dYdEUnB0cS","name":"ANDROMEDA"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b2731164d485c1327d039b38ff9f	2025-06-06T00:00:00.000Z	single	MONTAGEM COMA	80	\N	https://open.spotify.com/album/5k8jDV518pIk74gBsU72fi	\N	4	\N
3AcpgYrjhW7FJJLdcrk4dS	2026-03-04 20:15:03.617	RENICHT PERPLEX	2026-03-09 17:04:21.663	fennecxx, MC Alexandre Fabuloso, elysian.	[{"id":"5tvPbCrx8LMaL9Zby5e7c2","name":"fennecxx"},{"id":"4xLBtr9d1JOwYvW39g2mUl","name":"MC Alexandre Fabuloso"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b27362fdb125520ce7d89eb3f6ec	2025-07-11T00:00:00.000Z	single	RENICHT PERPLEX	20	\N	https://open.spotify.com/album/3AcpgYrjhW7FJJLdcrk4dS	\N	5	\N
21YFfueaorPjG3wU92EaPf	2026-03-04 20:15:03.653	CORAL BRUXA	2026-03-09 17:04:27.521	NXGHT!, NOIXES, elysian.	[{"id":"7lAaAGxYxk2GH8cMbTEwAL","name":"NXGHT!"},{"id":"4YeITwoqeIks45gELm488B","name":"NOIXES"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b273c71b2b8c6394dcd4dc5596f0	2025-03-28T00:00:00.000Z	single	CORAL BRUXA	27	\N	https://open.spotify.com/album/21YFfueaorPjG3wU92EaPf	\N	5	\N
7pNCyGj0ZSbBUSHKD7PKIh	2026-03-04 20:15:03.656	Paka Poka Funk	2026-03-09 17:04:28.226	BLXSTR, Beyounger, elysian.	[{"id":"30vnw2IDoHflDzAn9DpqLf","name":"BLXSTR"},{"id":"514Qze5V7AvD6wVSwdQB8Y","name":"Beyounger"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b2733bb054ab9c464431416a734b	2025-01-24T00:00:00.000Z	single	Paka Poka Funk	13	\N	https://open.spotify.com/album/7pNCyGj0ZSbBUSHKD7PKIh	\N	4	\N
42x0YHZA2Jieu1WaPKFMZM	2026-03-04 20:15:03.661	PIECES	2026-03-09 17:04:28.665	HXDES, elysian.	[{"id":"70bgV7fa5H6sTah58wm73l","name":"HXDES"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b2732f7d2281e0dec5a4e161ca17	2024-12-20T00:00:00.000Z	single	PIECES	14	\N	https://open.spotify.com/album/42x0YHZA2Jieu1WaPKFMZM	\N	4	\N
6JZCAw2ZtETl4fA54J3W8Y	2026-03-04 20:15:03.569	Ritmo Celeste	2026-03-09 17:04:19.977	SK3TCH01, EnvyMind, Cytrena, elysian.	[{"id":"0NakXcxWSSLTMHvJsDWPVC","name":"SK3TCH01"},{"id":"5ldM1bXOYDVjt8Q9QWB1Uv","name":"EnvyMind"},{"id":"7Kf6LvyojtWsyXbEEU7yIF","name":"Cytrena"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b273f4410381c96c40ec0899cfbd	2025-09-22T00:00:00.000Z	single	Ritmo Celeste	6	\N	https://open.spotify.com/album/6JZCAw2ZtETl4fA54J3W8Y	\N	4	\N
0VgV7KHAaitPOxrhY2TxKi	2026-03-04 20:15:03.651	VEY	2026-03-09 17:04:27.17	Mc Pogba, Flame Runner, S4Y4N, elysian.	[{"id":"2sQHo73pQF1OTq3lDuQhlO","name":"Mc Pogba"},{"id":"5bePP411ITzZyWf1QZ2SX4","name":"Flame Runner"},{"id":"2nIlwjrcU54whF2MWBcJSu","name":"S4Y4N"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b2731438ee348059592406efaa94	2025-04-18T00:00:00.000Z	single	VEY	22	\N	https://open.spotify.com/album/0VgV7KHAaitPOxrhY2TxKi	\N	4	\N
4nZMZnZed574Pv20bnX7Tw	2026-03-04 20:15:03.657	TROIKA FUNK	2026-03-09 17:04:28.414	NOIXES, S4Y4N, elysian.	[{"id":"4YeITwoqeIks45gELm488B","name":"NOIXES"},{"id":"2nIlwjrcU54whF2MWBcJSu","name":"S4Y4N"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b273ffae3ffb4076567a269ffc1f	2025-01-10T00:00:00.000Z	single	TROIKA FUNK	11	\N	https://open.spotify.com/album/4nZMZnZed574Pv20bnX7Tw	\N	4	\N
0ratr5PQvRjZLZnvjCAmuV	2026-03-04 20:15:03.663	FUNK GALAXIA	2026-03-09 17:04:28.742	NOIXES, MC LONE, elysian.	[{"id":"4YeITwoqeIks45gELm488B","name":"NOIXES"},{"id":"1nzIoHG5B7klgAPdwjqRDj","name":"MC LONE"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b273adfcda3196806916cdc152f8	2024-12-13T00:00:00.000Z	single	FUNK GALAXIA	9	\N	https://open.spotify.com/album/0ratr5PQvRjZLZnvjCAmuV	\N	4	\N
5A4NgW1yPi2wdNMTCpljWB	2026-03-04 20:15:03.664	VAPO SOCA	2026-03-09 17:04:28.821	NOIXES, MC MN, elysian.	[{"id":"4YeITwoqeIks45gELm488B","name":"NOIXES"},{"id":"4hV3aU0WKvFaiX5ugXP5hp","name":"MC MN"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b273c5e4e24ea167508ebf4eff99	2024-12-06T00:00:00.000Z	single	VAPO SOCA	20	\N	https://open.spotify.com/album/5A4NgW1yPi2wdNMTCpljWB	\N	4	\N
4KnVWfkdoBGOatv8Boc4nA	2026-03-04 20:15:03.655	SEQUENCIA DO FLOWERS	2026-03-09 17:04:27.897	NOIXES, SoyFlowers, elysian.	[{"id":"4YeITwoqeIks45gELm488B","name":"NOIXES"},{"id":"4bcHlUu9N2JzWzpz3kpzzy","name":"SoyFlowers"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b273b54d367c3e566e348eb4b718	2025-03-24T00:00:00.000Z	single	SEQUENCIA DO FLOWERS	6	\N	https://open.spotify.com/album/4KnVWfkdoBGOatv8Boc4nA	\N	4	\N
27P5Ebws78XWbAYFPANClv	2026-03-04 20:15:03.571	MTG AMA	2026-03-09 17:04:20.057	RVNGE, NOIXES, elysian.	[{"id":"164O6SBXwBBGLV2P809KUS","name":"RVNGE"},{"id":"4YeITwoqeIks45gELm488B","name":"NOIXES"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b273716a0113f660de8b3a6be26e	2025-09-08T00:00:00.000Z	single	MTG AMA	22	\N	https://open.spotify.com/album/27P5Ebws78XWbAYFPANClv	\N	4	\N
6dVAHX1UPchndn86z120qC	2026-03-04 20:15:03.577	Me Beija	2026-03-09 17:04:20.183	Vermillion, SK3TCH01, QR Moe, elysian.	[{"id":"1PvcWjADPMezv8CTyJO9Uk","name":"Vermillion"},{"id":"0NakXcxWSSLTMHvJsDWPVC","name":"SK3TCH01"},{"id":"2PpXe1ZQ4tmhWVWaJVCxfK","name":"QR Moe"},{"id":"51K0b3lRd87cKX02hU26we","name":"elysian."}]	https://i.scdn.co/image/ab67616d0000b273e8d3f71d4831d7a52bea7189	2025-09-05T00:00:00.000Z	single	Me Beija	28	\N	https://open.spotify.com/album/6dVAHX1UPchndn86z120qC	\N	4	\N
\.


--
-- Data for Name: RoyaltySplit; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."RoyaltySplit" (id, "contractId", "userId", name, percentage, "artistId", email) FROM stdin;
\.


--
-- Data for Name: SiteContent; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SiteContent" (id, key, title, content, "updatedAt") FROM stdin;
\.


--
-- Data for Name: SystemSettings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SystemSettings" (id, config, "updatedAt") FROM stdin;
default	{"genres":["Hip-Hop","R&B","Pop","Electronic","Phonk","Brazilian Funk","Other"],"discord":"","spotify":"","twitter":"","youtube":"","facebook":"","heroText":"THE NEW ORDER","siteName":"ELYSIAN MUSIC","instagram":"","showStats":true,"adminEmail":"","allowAudio":true,"allowOther":true,"allowDelete":true,"heroSubText":"INDEPENDENT DISTRIBUTION REDEFINED.","joinHeroSub":"A&R UNIT // UNRELEASED DEMOS & RELEASED TRACKS","allowCoverArt":true,"joinHeroTitle":"WORK WITH THE LOST. COMPANY","brandingDotName":"ELYSIAN.","brandingLogoUrl":"","featureEarnings":true,"featureInvoices":true,"featurePayments":true,"featureReleases":true,"maintenanceMode":false,"payoutThreshold":25,"brandingFullName":"ELYSIAN RECORDS","featureContracts":true,"brandingShortName":"ELYSIAN","defaultPlaylistId":"30krZYWmJMhDgUAl0EI3K2","featuredReleaseId":"","registrationsOpen":true,"featureSpotifySync":true,"featureSubmissions":true,"featureWisePayouts":true,"brandingPrimaryColor":"#ffffff","brandingSupportEmail":"","featureAnnouncements":true,"featureDiscordBridge":false,"featuredReleaseLabel":"FEATURED RELEASE","featureCommunications":true,"featuredReleaseStatus":"Featured","featuredReleaseSubLabel":"NOW STREAMING"}	2026-04-05 09:59:14.874
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, email, password, "fullName", "stageName", role, status, "emailVerified", "createdAt", "updatedAt", address, "legalName", "monthlyListeners", "notifyContracts", "notifyDemos", "notifyEarnings", "notifySupport", "phoneNumber", "resetToken", "resetTokenExpiry", "spotifyUrl", "verificationToken", "verificationTokenExpiry", permissions, "discordId", "discordNotifyEnabled", "wiseEmail", "wiseAccountId", "wiseLinkedAt") FROM stdin;
7cef012e-40f3-4923-9ad9-c41cf02f4e7e	admin@elysianlabel.com	$2b$12$xr.8Mjj3xAwgCAHqMFhBHePNc/lSOxxFhrlWT1DZopaw7nxH4n.2G	Elysian Admin	\N	admin	active	\N	2026-03-03 04:35:20.114	2026-03-03 04:35:20.114	\N	\N	\N	t	t	t	t	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N
e92bb90c-cd0e-4214-a3cf-bf485316b6fd	admin@elysianrecords.com	$2b$12$dC1fFu78BOVFkGDTWhRsfOQ0gSXyBmnwqJ0pQGvgljjECNhQsX0TG	Elysian Admin	elysian.	admin	approved	2026-03-03 11:30:59.051	2026-03-03 11:30:59.051	2026-03-08 07:20:20.681	\N	\N	\N	t	t	t	t	\N	\N	\N		\N	\N	{}	\N	f	\N	\N	\N
\.


--
-- Data for Name: Webhook; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Webhook" (id, name, url, events, enabled, "createdAt", "updatedAt", config) FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
2367fbac-144c-4944-8bab-50a87365c726	1ec02f4b3f3575ef6ddbad276e9726534fee271d22ac9f41a4604d975d73319d	2026-03-03 04:00:50.824058+00	20260303040045_init	\N	\N	2026-03-03 04:00:47.612805+00	1
4ef84b72-2b16-4fe7-a8db-9f54f53cb215	63d7f85c94ff67e1ad23c9d2de947fbeba780c4b871d5705c7062e2a2549ae6f	\N	20260308093000_baseline	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260308093000_baseline\n\nDatabase error code: 42P07\n\nDatabase error:\nERROR: relation "User" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P07), message: "relation \\"User\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("heap.c"), line: Some(1177), routine: Some("heap_create_with_catalog") }\n\n	2026-03-08 07:30:10.509554+00	2026-03-08 07:30:00.489023+00	0
dd2c9f6b-c317-490d-93d0-91fb78960b05	63d7f85c94ff67e1ad23c9d2de947fbeba780c4b871d5705c7062e2a2549ae6f	2026-03-08 07:30:10.878429+00	20260308093000_baseline		\N	2026-03-08 07:30:10.878429+00	0
0bb36632-f247-4775-a042-c8fd4369559f	a9b1fbc3a973b7e5f3be82f6a585596d0ffe1a7acb172e94a1b2f542e585707a	2026-03-08 07:30:14.006355+00	20260308093100_add_artist_balance_adjustments		\N	2026-03-08 07:30:14.006355+00	0
236bc477-4ee2-4524-9a36-bddf8193f2dd	ceb8bc4c753abdc3526a44357eb8140a481ec72b43a36d01dc71020e3e785cca	2026-03-08 07:30:17.480455+00	20260308133000_add_wise_fields_and_payout_requests	\N	\N	2026-03-08 07:30:17.119563+00	1
\.


--
-- Data for Name: discord_account_links; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.discord_account_links (user_id, discord_user_id, discord_username, discord_avatar, guild_id, linked_at, updated_at) FROM stdin;
\.


--
-- Data for Name: discord_event_outbox; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.discord_event_outbox (id, event_type, aggregate_id, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: discord_internal_audit; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.discord_internal_audit (id, request_id, endpoint, method, discord_user_id, guild_id, success, status_code, signature, created_at) FROM stdin;
\.


--
-- Data for Name: discord_oauth_states; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.discord_oauth_states (state, user_id, discord_user_id, discord_username, created_at, expires_at, consumed_at) FROM stdin;
\.


--
-- Data for Name: discord_role_sync_queue; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.discord_role_sync_queue (id, user_id, discord_user_id, target_role, target_discord_role_id, status, attempts, last_error, guild_id, created_at, updated_at) FROM stdin;
\.


--
-- Name: discord_event_outbox_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.discord_event_outbox_id_seq', 1, false);


--
-- Name: discord_internal_audit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.discord_internal_audit_id_seq', 1, false);


--
-- Name: discord_role_sync_queue_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.discord_role_sync_queue_id_seq', 1, false);


--
-- Name: ArtistStatsHistory ArtistStatsHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ArtistStatsHistory"
    ADD CONSTRAINT "ArtistStatsHistory_pkey" PRIMARY KEY (id);


--
-- Name: Artist Artist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Artist"
    ADD CONSTRAINT "Artist_pkey" PRIMARY KEY (id);


--
-- Name: BalanceAdjustment BalanceAdjustment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BalanceAdjustment"
    ADD CONSTRAINT "BalanceAdjustment_pkey" PRIMARY KEY (id);


--
-- Name: ChangeRequestComment ChangeRequestComment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChangeRequestComment"
    ADD CONSTRAINT "ChangeRequestComment_pkey" PRIMARY KEY (id);


--
-- Name: ChangeRequest ChangeRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChangeRequest"
    ADD CONSTRAINT "ChangeRequest_pkey" PRIMARY KEY (id);


--
-- Name: Contract Contract_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Contract"
    ADD CONSTRAINT "Contract_pkey" PRIMARY KEY (id);


--
-- Name: DemoFile DemoFile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DemoFile"
    ADD CONSTRAINT "DemoFile_pkey" PRIMARY KEY (id);


--
-- Name: Demo Demo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Demo"
    ADD CONSTRAINT "Demo_pkey" PRIMARY KEY (id);


--
-- Name: Earning Earning_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Earning"
    ADD CONSTRAINT "Earning_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: PayoutRequest PayoutRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PayoutRequest"
    ADD CONSTRAINT "PayoutRequest_pkey" PRIMARY KEY (id);


--
-- Name: Release Release_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Release"
    ADD CONSTRAINT "Release_pkey" PRIMARY KEY (id);


--
-- Name: RoyaltySplit RoyaltySplit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RoyaltySplit"
    ADD CONSTRAINT "RoyaltySplit_pkey" PRIMARY KEY (id);


--
-- Name: SiteContent SiteContent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SiteContent"
    ADD CONSTRAINT "SiteContent_pkey" PRIMARY KEY (id);


--
-- Name: SystemSettings SystemSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SystemSettings"
    ADD CONSTRAINT "SystemSettings_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Webhook Webhook_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Webhook"
    ADD CONSTRAINT "Webhook_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: discord_account_links discord_account_links_discord_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discord_account_links
    ADD CONSTRAINT discord_account_links_discord_user_id_key UNIQUE (discord_user_id);


--
-- Name: discord_account_links discord_account_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discord_account_links
    ADD CONSTRAINT discord_account_links_pkey PRIMARY KEY (user_id);


--
-- Name: discord_event_outbox discord_event_outbox_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discord_event_outbox
    ADD CONSTRAINT discord_event_outbox_pkey PRIMARY KEY (id);


--
-- Name: discord_internal_audit discord_internal_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discord_internal_audit
    ADD CONSTRAINT discord_internal_audit_pkey PRIMARY KEY (id);


--
-- Name: discord_oauth_states discord_oauth_states_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discord_oauth_states
    ADD CONSTRAINT discord_oauth_states_pkey PRIMARY KEY (state);


--
-- Name: discord_role_sync_queue discord_role_sync_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discord_role_sync_queue
    ADD CONSTRAINT discord_role_sync_queue_pkey PRIMARY KEY (id);


--
-- Name: ArtistStatsHistory_artistId_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ArtistStatsHistory_artistId_date_idx" ON public."ArtistStatsHistory" USING btree ("artistId", date);


--
-- Name: Artist_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Artist_userId_key" ON public."Artist" USING btree ("userId");


--
-- Name: Contract_demoId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Contract_demoId_key" ON public."Contract" USING btree ("demoId");


--
-- Name: Release_baseTitle_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Release_baseTitle_idx" ON public."Release" USING btree ("baseTitle");


--
-- Name: SiteContent_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "SiteContent_key_key" ON public."SiteContent" USING btree (key);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: idx_balance_adjustment_artist_id_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_balance_adjustment_artist_id_created_at ON public."BalanceAdjustment" USING btree ("artistId", "createdAt" DESC);


--
-- Name: idx_balance_adjustment_created_by_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_balance_adjustment_created_by_created_at ON public."BalanceAdjustment" USING btree ("createdById", "createdAt" DESC);


--
-- Name: idx_balance_adjustment_user_id_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_balance_adjustment_user_id_created_at ON public."BalanceAdjustment" USING btree ("userId", "createdAt" DESC);


--
-- Name: idx_change_request_assigned_to_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_change_request_assigned_to_created_at ON public."ChangeRequest" USING btree ("assignedToId", "createdAt" DESC);


--
-- Name: idx_change_request_status_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_change_request_status_created_at ON public."ChangeRequest" USING btree (status, "createdAt" DESC);


--
-- Name: idx_change_request_user_id_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_change_request_user_id_created_at ON public."ChangeRequest" USING btree ("userId", "createdAt" DESC);


--
-- Name: idx_contract_artist_id_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contract_artist_id_created_at ON public."Contract" USING btree ("artistId", "createdAt" DESC);


--
-- Name: idx_contract_release_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contract_release_id ON public."Contract" USING btree ("releaseId");


--
-- Name: idx_contract_status_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contract_status_created_at ON public."Contract" USING btree (status, "createdAt" DESC);


--
-- Name: idx_contract_user_id_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contract_user_id_created_at ON public."Contract" USING btree ("userId", "createdAt" DESC);


--
-- Name: idx_demo_artist_id_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_demo_artist_id_created_at ON public."Demo" USING btree ("artistId", "createdAt" DESC);


--
-- Name: idx_demo_status_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_demo_status_created_at ON public."Demo" USING btree (status, "createdAt" DESC);


--
-- Name: idx_discord_account_links_discord_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_discord_account_links_discord_user_id ON public.discord_account_links USING btree (discord_user_id);


--
-- Name: idx_discord_event_outbox_pending; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_discord_event_outbox_pending ON public.discord_event_outbox USING btree (status, next_attempt_at, created_at);


--
-- Name: idx_discord_internal_audit_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_discord_internal_audit_created_at ON public.discord_internal_audit USING btree (created_at DESC);


--
-- Name: idx_discord_internal_audit_request_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_discord_internal_audit_request_id ON public.discord_internal_audit USING btree (request_id);


--
-- Name: idx_discord_internal_audit_signature; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_discord_internal_audit_signature ON public.discord_internal_audit USING btree (signature);


--
-- Name: idx_discord_oauth_states_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_discord_oauth_states_expires_at ON public.discord_oauth_states USING btree (expires_at);


--
-- Name: idx_discord_role_sync_queue_pending; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_discord_role_sync_queue_pending ON public.discord_role_sync_queue USING btree (status, created_at);


--
-- Name: idx_earning_contract_id_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_earning_contract_id_period ON public."Earning" USING btree ("contractId", period DESC);


--
-- Name: idx_earning_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_earning_created_at ON public."Earning" USING btree ("createdAt" DESC);


--
-- Name: idx_payment_status_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_status_created_at ON public."Payment" USING btree (status, "createdAt" DESC);


--
-- Name: idx_payment_user_id_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_user_id_created_at ON public."Payment" USING btree ("userId", "createdAt" DESC);


--
-- Name: idx_user_discord_id_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_user_discord_id_unique ON public."User" USING btree ("discordId") WHERE ("discordId" IS NOT NULL);


--
-- Name: ArtistStatsHistory ArtistStatsHistory_artistId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ArtistStatsHistory"
    ADD CONSTRAINT "ArtistStatsHistory_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES public."Artist"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Artist Artist_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Artist"
    ADD CONSTRAINT "Artist_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BalanceAdjustment BalanceAdjustment_artistId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BalanceAdjustment"
    ADD CONSTRAINT "BalanceAdjustment_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES public."Artist"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BalanceAdjustment BalanceAdjustment_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BalanceAdjustment"
    ADD CONSTRAINT "BalanceAdjustment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: BalanceAdjustment BalanceAdjustment_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BalanceAdjustment"
    ADD CONSTRAINT "BalanceAdjustment_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ChangeRequestComment ChangeRequestComment_requestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChangeRequestComment"
    ADD CONSTRAINT "ChangeRequestComment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES public."ChangeRequest"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChangeRequestComment ChangeRequestComment_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChangeRequestComment"
    ADD CONSTRAINT "ChangeRequestComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChangeRequest ChangeRequest_assignedToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChangeRequest"
    ADD CONSTRAINT "ChangeRequest_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ChangeRequest ChangeRequest_releaseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChangeRequest"
    ADD CONSTRAINT "ChangeRequest_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES public."Release"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ChangeRequest ChangeRequest_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChangeRequest"
    ADD CONSTRAINT "ChangeRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Contract Contract_artistId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Contract"
    ADD CONSTRAINT "Contract_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES public."Artist"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Contract Contract_demoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Contract"
    ADD CONSTRAINT "Contract_demoId_fkey" FOREIGN KEY ("demoId") REFERENCES public."Demo"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Contract Contract_releaseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Contract"
    ADD CONSTRAINT "Contract_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES public."Release"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Contract Contract_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Contract"
    ADD CONSTRAINT "Contract_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DemoFile DemoFile_demoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DemoFile"
    ADD CONSTRAINT "DemoFile_demoId_fkey" FOREIGN KEY ("demoId") REFERENCES public."Demo"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Demo Demo_artistId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Demo"
    ADD CONSTRAINT "Demo_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Earning Earning_contractId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Earning"
    ADD CONSTRAINT "Earning_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES public."Contract"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Payment Payment_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PayoutRequest PayoutRequest_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PayoutRequest"
    ADD CONSTRAINT "PayoutRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RoyaltySplit RoyaltySplit_artistId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RoyaltySplit"
    ADD CONSTRAINT "RoyaltySplit_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES public."Artist"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RoyaltySplit RoyaltySplit_contractId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RoyaltySplit"
    ADD CONSTRAINT "RoyaltySplit_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES public."Contract"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RoyaltySplit RoyaltySplit_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RoyaltySplit"
    ADD CONSTRAINT "RoyaltySplit_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict cFk199t9bC6bdPYtpZ96vbamYepwKCUiPJ4mu8Xzf5iGPfdB4suRTpOorPyfUub

