-- ============================================================
-- REGISTRO ATTREZZATURE CON QR — Di Curzio Hospitality
-- Nuovo progetto Supabase dedicato
-- Da eseguire interamente nel SQL Editor di Supabase
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. STRUTTURE
-- ------------------------------------------------------------
create table properties (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text unique
);

insert into properties (name, code) values
  ('Grand Hotel Elite', 'GHE'),
  ('Country House Elite', 'CHE'),
  ('Country House Il Vecchio Ippocastano', 'IVI'),
  ('Palazzo Franceschini', 'PFR'),
  ('Casa per Ferie Ravasco San Pietro', 'RSP');

-- ------------------------------------------------------------
-- 2. CATEGORIE ATTREZZATURE TECNICHE
-- ------------------------------------------------------------
create table asset_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon text,
  sort_order int default 0
);

insert into asset_categories (name, icon, sort_order) values
  ('Climatizzazione (HVAC)',          'wind',          1),
  ('Impianti elettrici',              'zap',           2),
  ('Impianti idraulici',              'droplet',       3),
  ('Caldaie e produzione ACS',        'flame',         4),
  ('Antincendio e sicurezza',         'shield-alert',  5),
  ('Ascensori e montacarichi',        'arrow-up-down', 6),
  ('Cucina e lavanderia',             'utensils',      7),
  ('Piscina e SPA',                   'waves',         8),
  ('Generatori e gruppi continuità',  'battery-charging', 9),
  ('Altro',                           'wrench',        99);

-- ------------------------------------------------------------
-- 3. REGISTRO ATTREZZATURE (ASSETS)
-- Ogni riga = un bene fisico, quantità sempre 1.
-- qr_code è il codice breve stampato sull'etichetta.
-- ------------------------------------------------------------
create table assets (
  id uuid primary key default gen_random_uuid(),
  qr_code text not null unique
    default substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
  property_id uuid not null references properties(id),
  category_id uuid references asset_categories(id),
  name text not null,
  brand text,
  model text,
  serial_number text,
  location text,
  installation_date date,
  warranty_expiry date,
  status text not null default 'operativo'
    check (status in ('operativo','guasto','in_manutenzione','dismesso')),
  last_maintenance_date date,
  next_maintenance_date date,
  notes text,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_assets_property on assets(property_id);
create index idx_assets_category on assets(category_id);
create index idx_assets_qr       on assets(qr_code);
create index idx_assets_status   on assets(status);

-- ------------------------------------------------------------
-- 4. STORICO INTERVENTI / SEGNALAZIONI
-- ------------------------------------------------------------
create table asset_maintenance_log (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references assets(id) on delete cascade,
  date date not null default current_date,
  type text not null check (type in ('ordinaria','straordinaria','guasto','controllo')),
  description text not null,
  performed_by text,
  cost numeric(10,2),
  created_at timestamptz not null default now()
);

create index idx_log_asset on asset_maintenance_log(asset_id);
create index idx_log_date  on asset_maintenance_log(date);

-- ------------------------------------------------------------
-- 5. TRIGGER updated_at
-- ------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_assets_updated_at
  before update on assets
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- 6. VISTA RIEPILOGO (security_invoker: eredita le RLS delle tabelle)
-- ------------------------------------------------------------
create view assets_overview
with (security_invoker = true) as
select
  a.id,
  a.qr_code,
  a.name,
  a.brand,
  a.model,
  a.serial_number,
  a.location,
  a.status,
  a.next_maintenance_date,
  a.property_id,
  p.name as property_name,
  p.code as property_code,
  c.name as category_name,
  c.icon as category_icon
from assets a
join properties p on p.id = a.property_id
left join asset_categories c on c.id = a.category_id;

-- ------------------------------------------------------------
-- 7. ROW LEVEL SECURITY
--
-- Modello di accesso:
--  - properties, asset_categories, assets, assets_overview:
--      lettura pubblica (necessaria per la pagina QR /asset/:code),
--      scrittura solo per utenti autenticati (staff).
--  - asset_maintenance_log:
--      lettura solo staff (storico interventi nel pannello),
--      inserimento pubblico CONSENTITO SOLO per segnalazioni
--      di tipo 'guasto' (form pubblico sul QR),
--      inserimento di qualsiasi tipo per staff autenticato.
-- ------------------------------------------------------------

alter table properties enable row level security;
alter table asset_categories enable row level security;
alter table assets enable row level security;
alter table asset_maintenance_log enable row level security;

-- Properties: lettura pubblica
create policy "Public read properties" on properties
  for select using (true);

-- Categorie: lettura pubblica
create policy "Public read categories" on asset_categories
  for select using (true);

-- Assets: lettura pubblica, scrittura solo staff
create policy "Public read assets" on assets
  for select using (true);

create policy "Staff insert assets" on assets
  for insert with check (auth.role() = 'authenticated');

create policy "Staff update assets" on assets
  for update using (auth.role() = 'authenticated');

create policy "Staff delete assets" on assets
  for delete using (auth.role() = 'authenticated');

-- Storico interventi: lettura solo staff
create policy "Staff read log" on asset_maintenance_log
  for select using (auth.role() = 'authenticated');

-- Inserimento: pubblico solo per 'guasto', staff per tutti i tipi
create policy "Public report fault" on asset_maintenance_log
  for insert with check (
    auth.role() = 'authenticated'
    or type = 'guasto'
  );

-- ------------------------------------------------------------
-- 8. GRANT (necessari perché PostgREST esponga le tabelle ai ruoli)
-- ------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select on properties, asset_categories, assets, assets_overview
  to anon, authenticated;

grant insert, update, delete on assets to authenticated;

grant select, insert on asset_maintenance_log to anon, authenticated;
grant update, delete on asset_maintenance_log to authenticated;

-- ============================================================
-- NOTE OPERATIVE
-- ============================================================
-- 1. Crea gli utenti staff in Authentication → Users (email + password),
--    NON tramite il modulo di registrazione pubblica.
-- 2. In Authentication → Providers, disattiva "Email signups" se vuoi
--    impedire registrazioni pubbliche sul sito.
-- 3. Il form pubblico "Segnala guasto" (pagina /asset/:code senza login)
--    può SOLO scrivere righe con type='guasto' in asset_maintenance_log:
--    non può leggere lo storico né modificare lo stato del bene.
-- ============================================================
