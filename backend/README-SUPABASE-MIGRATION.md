# Migrace z SQLite na Supabase

Tento dokument popisuje proces migrace databáze z SQLite na Supabase pro e-shop Italské brašnářství.

## Obsah

1. [Přehled změn](#přehled-změn)
2. [Prerekvizity](#prerekvizity)
3. [Instalace](#instalace)
4. [Migrace dat](#migrace-dat)
5. [Spuštění aplikace s Supabase](#spuštění-aplikace-s-supabase)
6. [Struktura souborů](#struktura-souborů)
7. [API endpointy](#api-endpointy)
8. [Kroky migrace](#kroky-migrace)
9. [Řešení problémů](#řešení-problémů)
10. [Budoucí vylepšení](#budoucí-vylepšení)

## Přehled změn

Migrace z SQLite na Supabase zahrnuje následující změny:

- Přechod z lokální SQLite databáze na cloudovou PostgreSQL databázi v Supabase
- Vytvoření nových tabulek v Supabase s odpovídající strukturou
- Migrace existujících dat ze SQLite do Supabase
- Aktualizace API endpointů pro práci se Supabase
- Zachování kompatibility s frontendovou částí aplikace

## Prerekvizity

- Node.js (verze 14 nebo vyšší)
- NPM (verze 6 nebo vyšší)
- Přístup k Supabase projektu (URL a API klíč)
- Existující SQLite databáze s daty

## Instalace

1. Naklonujte repozitář (pokud jste tak ještě neučinili)
2. Nainstalujte závislosti:

```bash
cd backend
npm install
```

3. Vytvořte soubor `.env` v adresáři `backend` s následujícím obsahem:

```
# Supabase konfigurace
SUPABASE_URL=https://dbnfkzctensbpktgbsgn.supabase.co
SUPABASE_KEY=váš_supabase_klíč

# Port pro server
PORT=3001
```

## Migrace dat

Pro migraci dat ze SQLite do Supabase použijte následující příkaz:

```bash
npm run migrate:supabase
```

Tento příkaz:
1. Vytvoří potřebné tabulky v Supabase (products, categories, orders, order_items)
2. Přenese data z SQLite do Supabase
3. Vytvoří potřebné indexy a RLS politiky

## Spuštění aplikace s Supabase

Pro spuštění aplikace s Supabase použijte následující příkaz:

```bash
npm run start:supabase
```

Pro vývojový režim s automatickým restartem při změnách:

```bash
npm run dev:supabase
```

## Struktura souborů

- `server-supabase.js` - Hlavní soubor serveru pro práci se Supabase
- `config/supabase-config.js` - Konfigurace připojení k Supabase
- `scripts/migrate-to-supabase.js` - Skript pro migraci dat ze SQLite do Supabase
- `scripts/supabase-procedures.sql` - SQL procedury pro Supabase
- `scripts/test-supabase-connection.js` - Skript pro testování připojení k Supabase
- `scripts/test-supabase-api.js` - Skript pro testování API endpointů

## API endpointy

Všechny API endpointy zůstávají stejné jako v původní verzi s SQLite, takže frontendová část aplikace by měla fungovat bez změn.

Hlavní endpointy:

- `GET /api/products` - Získání všech produktů
- `GET /api/products/:id` - Získání produktu podle ID
- `POST /api/products` - Vytvoření nového produktu
- `PUT /api/products/:id` - Aktualizace produktu
- `DELETE /api/products/:id` - Smazání produktu
- `GET /api/categories` - Získání všech kategorií
- `GET /api/products/category/:category` - Získání produktů podle kategorie
- `POST /api/orders` - Vytvoření nové objednávky
- `GET /api/orders` - Získání všech objednávek
- `GET /api/orders/:id` - Získání detailu objednávky
- `PUT /api/orders/:id/status` - Aktualizace stavu objednávky
- `GET /api/stats` - Získání statistik

## Kroky migrace

1. **Příprava prostředí**
   - Vytvořte Supabase projekt (pokud ještě nemáte)
   - Získejte URL a API klíč pro přístup k Supabase
   - Vytvořte soubor `.env` s potřebnými proměnnými

2. **Migrace dat**
   - Spusťte migrační skript: `npm run migrate:supabase`
   - Ověřte, že data byla úspěšně přenesena

3. **Testování**
   - Otestujte připojení k Supabase: `node scripts/test-supabase-connection.js`
   - Spusťte server: `npm run start:supabase`
   - Otestujte API endpointy: `node scripts/test-supabase-api.js`

4. **Nasazení**
   - Aktualizujte konfiguraci na produkčním serveru
   - Spusťte server s Supabase: `npm run start:supabase`

## Řešení problémů

### Problém s připojením k Supabase

- Zkontrolujte, zda jsou správně nastaveny proměnné prostředí v souboru `.env`
- Ověřte, že máte správný API klíč s dostatečnými oprávněními
- Zkontrolujte, zda je váš Supabase projekt aktivní

### Chyba při migraci dat

- Zkontrolujte, zda existuje SQLite databáze a obsahuje data
- Ověřte, že máte dostatečná oprávnění pro vytváření tabulek v Supabase
- Zkontrolujte logy pro detailnější informace o chybě

### API endpointy nefungují

- Zkontrolujte, zda server běží: `npm run start:supabase`
- Ověřte, že data byla úspěšně migrována
- Zkontrolujte logy serveru pro detailnější informace o chybách

## Budoucí vylepšení

- Implementace autentizace a autorizace pomocí Supabase Auth
- Využití Supabase Storage pro ukládání obrázků produktů
- Implementace real-time funkcí pomocí Supabase Realtime
- Vytvoření administrátorského rozhraní pomocí Supabase Dashboard
- Optimalizace výkonu pomocí cachování a indexů