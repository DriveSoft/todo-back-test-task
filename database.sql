-- Table: public.todo

-- DROP TABLE IF EXISTS public.todo;

CREATE TABLE IF NOT EXISTS public.todo
(
    id integer NOT NULL DEFAULT nextval('todo_id_seq'::regclass),
    title character varying(255) COLLATE pg_catalog."default" NOT NULL,
    description character varying(255) COLLATE pg_catalog."default" NOT NULL,
    completed boolean NOT NULL DEFAULT false,
    user_id integer NOT NULL,
    CONSTRAINT todo_pkey PRIMARY KEY (id),
    CONSTRAINT "todo_userId_fkey" FOREIGN KEY (user_id)
        REFERENCES public."user" (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.todo
    OWNER to postgres;
-- Index: fki_todo_userId_fkey

-- DROP INDEX IF EXISTS public."fki_todo_userId_fkey";

CREATE INDEX IF NOT EXISTS "fki_todo_userId_fkey"
    ON public.todo USING btree
    (user_id ASC NULLS LAST)
    TABLESPACE pg_default;


-- Table: public.user

-- DROP TABLE IF EXISTS public."user";

CREATE TABLE IF NOT EXISTS public."user"
(
    id integer NOT NULL DEFAULT nextval('user_id_seq'::regclass),
    email character varying(255) COLLATE pg_catalog."default" NOT NULL,
    password character varying(255) COLLATE pg_catalog."default" NOT NULL,
    refreshtoken character varying(255) COLLATE pg_catalog."default",
    CONSTRAINT user_pkey PRIMARY KEY (id),
    CONSTRAINT user_email_key UNIQUE (email)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."user"
    OWNER to postgres;