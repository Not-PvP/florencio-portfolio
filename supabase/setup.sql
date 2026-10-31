-- Challenger Roster: database setup for the KRAM.DEV footer.
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- It is safe to run again; it only creates what is missing and refreshes the rules.
--
-- The anon key ships inside the website, so anyone can call the API directly.
-- That is why every rule (length, links, bad words, cooldown, flood limit) lives HERE,
-- not just in the browser. The browser copy only gives faster, friendlier errors.

-- 1. Tables ------------------------------------------------------------------------------------

create table if not exists public.challengers (
  id         uuid primary key default gen_random_uuid(),
  tag        text        not null check (tag ~ '^[A-Z0-9]{3}$'),
  avatar     smallint    not null check (avatar between 0 and 7),
  remark     text        not null check (char_length(remark) between 1 and 140),
  client_id  uuid        not null,            -- random id the browser keeps; used for the cooldown
  reports    smallint    not null default 0,
  hidden     boolean     not null default false,
  created_at timestamptz not null default now()
);

create index if not exists challengers_recent_idx on public.challengers (created_at desc);
create index if not exists challengers_client_idx on public.challengers (client_id, created_at desc);

create table if not exists public.challenger_reports (
  challenger_id uuid not null references public.challengers (id) on delete cascade,
  client_id     uuid not null,
  created_at    timestamptz not null default now(),
  primary key (challenger_id, client_id)      -- one report per visitor per remark
);

-- 2. Word filter (mirror of src/data/blocklist.ts) ---------------------------------------------

create or replace function public.mk_is_blocked(txt text)
returns boolean
language plpgsql
immutable
as $$
declare
  tok   text;
  w     text;
  words text[] := array['dick','cock','pussy','ass','fag','rape','rapist','porn','kys','coon','spic','kike','chink','tranny'];
begin
  for tok in select regexp_split_to_table(translate(lower(txt), '0134578@$', 'oieastbas'), '\s+') loop
    w := regexp_replace(tok, '[^a-z]', '', 'g');
    w := replace(replace(replace(w, 'shiitakes', ''), 'shiitake', ''), 'scunthorpe', '');
    if w = '' then
      continue;
    end if;
    if w = any(words) or regexp_replace(w, 's$', '') = any(words) then
      return true;
    end if;
    if w ~ 'f+u+c+k+|s+h+i+t+|b+i+t+c+h+|c+u+n+t+|w+h+o+r+e+|s+l+u+t+|n+i+g+g+|f+a+g+g+o+t+|r+e+t+a+r+d+|a+s+s+h+o+l+e+|d+i+c+k+h+e+a+d+|c+o+c+k+s+u+c+k+|m+o+t+h+e+r+f+u+c+k+|n+a+z+i+' then
      return true;
    end if;
  end loop;
  return false;
end;
$$;

-- 3. Guard: runs before every insert -----------------------------------------------------------

create or replace function public.challengers_guard()
returns trigger
language plpgsql
security definer           -- needs to read client_id, which the public key cannot
set search_path = public
as $$
declare
  recent int;
begin
  new.tag    := upper(btrim(new.tag));
  new.remark := btrim(regexp_replace(regexp_replace(new.remark, '[[:cntrl:]]', ' ', 'g'), '\s+', ' ', 'g'));

  if char_length(new.remark) < 1 or char_length(new.remark) > 140 then
    raise exception 'mk_empty';
  end if;

  -- no links, domains or email addresses
  if new.remark ~* '(https?://|www\.|\y[a-z0-9-]+\.(com|net|org|io|ph|gg|co|me|xyz|ly|app|dev|link|ru|cn|tk|top|site|online|shop)\y|\S+@\S+\.\S+)' then
    raise exception 'mk_link';
  end if;

  if public.mk_is_blocked(new.remark)
     or public.mk_is_blocked(new.tag)
     or translate(lower(new.tag), '0134578@$', 'oieastbas') = any (array['ass','fag','kkk','cum','dik','fuk','sht','nig','sex']) then
    raise exception 'mk_blocked';
  end if;

  -- one remark per visitor every 3 minutes
  if exists (
    select 1 from public.challengers
    where client_id = new.client_id and created_at > now() - interval '3 minutes'
  ) then
    raise exception 'mk_cooldown';
  end if;

  -- flood brake for the whole site: at most 20 new remarks a minute
  select count(*) into recent from public.challengers where created_at > now() - interval '1 minute';
  if recent >= 20 then
    raise exception 'mk_busy';
  end if;

  return new;
end;
$$;

drop trigger if exists challengers_guard_trg on public.challengers;
create trigger challengers_guard_trg
  before insert on public.challengers
  for each row execute function public.challengers_guard();

-- 4. Reporting: 3 different visitors reporting a remark hides it automatically ------------------

create or replace function public.report_challenger(p_id uuid, p_client uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.challenger_reports (challenger_id, client_id)
  values (p_id, p_client)
  on conflict do nothing;

  if found then
    update public.challengers
       set reports = reports + 1,
           hidden  = hidden or reports + 1 >= 3     -- change 3 to tune how touchy the auto-hide is
     where id = p_id;
  end if;
end;
$$;

-- 5. Permissions: the public key can only read visible remarks, add one, or report one ----------

alter table public.challengers        enable row level security;
alter table public.challenger_reports enable row level security;

revoke all on public.challengers        from anon, authenticated;
revoke all on public.challenger_reports from anon, authenticated;

grant select (id, tag, avatar, remark, created_at, hidden) on public.challengers to anon;
grant insert (tag, avatar, remark, client_id)              on public.challengers to anon;

drop policy if exists "anyone can read visible remarks" on public.challengers;
create policy "anyone can read visible remarks"
  on public.challengers for select to anon
  using (hidden = false);

drop policy if exists "anyone can add a remark" on public.challengers;
create policy "anyone can add a remark"
  on public.challengers for insert to anon
  with check (true);

revoke all on function public.report_challenger(uuid, uuid) from public;
grant execute on function public.report_challenger(uuid, uuid) to anon;

-- 6. Moderating by hand (run any of these in the SQL Editor, or use the Table Editor) -----------
--
--   See what visitors flagged, worst first:
--     select id, tag, remark, reports, hidden from public.challengers where reports > 0 order by reports desc;
--
--   Remove a remark for good:
--     delete from public.challengers where id = '<paste id>';
--
--   Hide it without deleting (and bring it back later with hidden = false):
--     update public.challengers set hidden = true where id = '<paste id>';
--
--   Wipe test posts:
--     delete from public.challengers where tag = 'TST';
