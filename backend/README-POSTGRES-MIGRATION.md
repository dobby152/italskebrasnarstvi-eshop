# Migrace na PostgreSQL a Supabase

Tento dokument popisuje postup migrace z SQLite na PostgreSQL a Supabase pro e-shop Italské brašnářství.

## Přehled změn

- Přidána podpora pro PostgreSQL databázi
- Integrace se Supabase pro budoucí rozšíření (autentizace, storage, realtime)
- Vytvořen migrační skript pro přenos dat
- Zachována zpětná kompatibilita se stávajícím SQLite řešením

## Prerekvizity

- Node.js (verze 14 nebo vyšší)
- PostgreSQL server (lokální nebo vzdálený)
- Supabase účet (volitelné, pro pokročilé funkce)

## Instalace

1. Nainstalujte nové závislosti:

```bash
cd frontend/backend
npm install
```

2. Vytvořte `.env` soubor podle vzoru `.env.example`:

```
# Server configuration
PORT=3001
NODE_ENV=development

# Supabase configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key

# PostgreSQL configuration
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=italskebrasnarstvi
PG_USER=postgres
PG_PASSWORD=your_password
```

3. Vytvořte PostgreSQL databázi:

```sql
CREATE DATABASE italskebrasnarstvi;
```

## Migrace dat

Pro migraci dat ze SQLite do PostgreSQL použijte připravený skript:

```bash
npm run migrate
```

Tento skript:
- Vytvoří potřebné tabulky v PostgreSQL
- Přenese data z SQLite do PostgreSQL
- Zachová všechny ID a relace

## Spuštění PostgreSQL verze

Pro spuštění serveru s PostgreSQL:

```bash
# Produkční režim
npm run start:postgres

# Vývojový režim s automatickým restartem
npm run dev:postgres
```

## Struktura souborů

- `server.js` - Původní SQLite verze serveru
- `server-postgres.js` - Nová PostgreSQL verze serveru
- `config/supabase.js` - Konfigurace připojení k PostgreSQL a Supabase
- `migrate-to-postgres.js` - Migrační skript
- `start-postgres-server.js` - Pomocný skript pro spuštění PostgreSQL verze

## API Endpointy

Všechny API endpointy zůstávají stejné jako v původní verzi:

- `GET /api/products` - Seznam produktů s filtrováním a stránkováním
- `GET /api/products/:id` - Detail produktu
- `POST /api/products` - Vytvoření produktu
- `PUT /api/products/:id` - Aktualizace produktu
- `DELETE /api/products/:id` - Smazání produktu
- `GET /api/collections` - Seznam kolekcí
- `GET /api/stats` - Statistiky
- `GET /api/orders` - Seznam objednávek
- `GET /api/orders/:id` - Detail objednávky
- `POST /api/orders` - Vytvoření objednávky
- `PUT /api/orders/:id` - Aktualizace objednávky

## Přechod na novou verzi

Pro přechod na PostgreSQL verzi:

1. Zastavte stávající SQLite server
2. Spusťte migrační skript
3. Spusťte PostgreSQL verzi serveru
4. Ověřte funkčnost všech API endpointů

## Řešení problémů

### Chyba připojení k databázi

Ujistěte se, že:
- PostgreSQL server běží
- Přihlašovací údaje v `.env` jsou správné
- Databáze existuje

### Chyba při migraci

Pokud se vyskytne chyba při migraci:
- Zkontrolujte logy pro detaily chyby
- Ujistěte se, že SQLite databáze je přístupná
- Zkontrolujte, zda máte dostatečná oprávnění pro zápis do PostgreSQL

## Budoucí rozšíření

- Implementace autentizace pomocí Supabase Auth
- Využití Supabase Storage pro ukládání obrázků
- Realtime aktualizace pomocí Supabase Realtime