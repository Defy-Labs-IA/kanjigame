-- Kanji Memory Game — schema inicial
-- Rode no Supabase: SQL Editor > New query > cole e execute.

create table if not exists public.kanji (
  id            text primary key,           -- K001...
  kanji         text not null,
  significado   text not null,
  mundo         text,
  fase          int,
  hiragana      text,
  romaji        text,
  onyomi        text[] default '{}',
  kunyomi       text[] default '{}',
  tracos        int,
  needs_review  boolean default true,
  status        text default 'Novo',
  atualizado_em timestamptz default now()
);

create index if not exists kanji_fase_idx on public.kanji (fase);

-- RLS: qualquer um pode LER; escrita só pelo service_role (server).
alter table public.kanji enable row level security;

drop policy if exists "leitura publica do catalogo" on public.kanji;
create policy "leitura publica do catalogo"
  on public.kanji for select
  using (true);

-- Sem policy de insert/update/delete para anon/authenticated:
-- gravações acontecem apenas via service_role (que ignora RLS), pelo backend.

-- Atualiza atualizado_em em cada update
create or replace function public.touch_kanji() returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_touch_kanji on public.kanji;
create trigger trg_touch_kanji before update on public.kanji
  for each row execute function public.touch_kanji();
