# Iron Vault

Iron Vault is a React + Vite storefront PWA with customer accounts, a persistent cart, database-backed order history, and a protected admin order desk.

## Run locally

Create `.env` in the project root with the Supabase project URL and publishable key:

```env
VITE_API_BASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Then run:

```bash
npm install
npm run dev
```

The customer storefront is available at `/`. The admin order desk is at `/admin` and requires a profile with `is_admin = true`.

## Supabase setup

In Supabase SQL Editor, run these files in order:

1. `supabase/iron-vault-commerce.sql` creates customer profiles, protected order tables, admin-only product writes, and the secure checkout RPC.
2. `supabase/seed-catalog.sql` inserts the complete 15-item demo catalogue.
3. Sign up through the storefront and confirm the email if Supabase requests it.
4. Promote the store owner by replacing the email in this statement and running it in SQL Editor:

   ```sql
   update public.profiles set is_admin = true where email = 'owner@example.com';
   ```

Customers can browse, add seeded products to their cart, place orders, and view order history. Administrators can manage catalogue items and update order statuses from `/admin`. Checkout records an order only; no payment processor or shipping integration is configured.

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```
