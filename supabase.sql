create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  category text not null check (category in ('Food & dining', 'Transport', 'Entertainment', 'Housing', 'Other')),
  amount numeric(12, 2) not null check (amount > 0),
  expense_date date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

create policy "Anyone can view shared expenses"
  on public.expenses for select
  to anon, authenticated
  using (true);

create policy "Anyone can add shared expenses"
  on public.expenses for insert
  to anon, authenticated
  with check (true);

create policy "Anyone can edit shared expenses"
  on public.expenses for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "Anyone can delete shared expenses"
  on public.expenses for delete
  to anon, authenticated
  using (true);
