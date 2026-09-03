-- ============================================================================
-- EduNovaAI Supabase Database Migration
-- Vector Dimension: 384 (sentence-transformers/all-MiniLM-L6-v2)
-- ============================================================================

-- 1. Enable pgvector extension
create extension if not exists vector;

-- 2. Create the document_chunks table
create table if not exists public.document_chunks (
    id bigint primary key generated always as identity,
    content text not null,
    metadata jsonb default '{}'::jsonb,
    page integer default 1,
    source text default 'unknown',
    embedding vector(384),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create indexes
-- HNSW index for fast approximate nearest neighbor vector similarity search (cosine distance)
create index if not exists document_chunks_embedding_hnsw_idx
on public.document_chunks
using hnsw (embedding vector_cosine_ops);

-- B-tree index for filtering by source document
create index if not exists document_chunks_source_idx
on public.document_chunks (source);

-- 4. Create similarity search RPC function matching Python code interface
create or replace function public.match_document_chunks (
    query_embedding vector(384),
    match_count int default 5
)
returns table (
    id bigint,
    content text,
    metadata jsonb,
    page integer,
    source text,
    similarity float8
)
language plpgsql
stable
as $$
begin
    return query
    select
        dc.id,
        dc.content,
        dc.metadata,
        dc.page,
        dc.source,
        (1 - (dc.embedding <=> query_embedding))::float8 as similarity
    from public.document_chunks dc
    where dc.embedding is not null
    order by dc.embedding <=> query_embedding
    limit match_count;
end;
$$;

-- 5. Row Level Security and Grants
alter table public.document_chunks enable row level security;

-- Allow read/write access for anon, authenticated, and service_role keys
drop policy if exists "Allow full access for application clients" on public.document_chunks;
create policy "Allow full access for application clients"
on public.document_chunks
for all
to anon, authenticated, service_role
using (true)
with check (true);

-- Grant appropriate permissions
grant usage on schema public to anon, authenticated, service_role;
grant all on table public.document_chunks to anon, authenticated, service_role;
grant execute on function public.match_document_chunks(vector, int) to anon, authenticated, service_role;
