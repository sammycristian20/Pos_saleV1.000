-- Create users table to store additional user information
create table public.users (
    id uuid references auth.users on delete cascade,
    email text unique,
    role text check (role in ('vendedor', 'admin', 'contador')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (id)
);

-- Enable RLS
alter table public.users enable row level security;

-- Create policies
create policy "Users can view all users"
    on public.users for select
    using (true);

create policy "Only admins can insert users"
    on public.users for insert
    using (auth.jwt() ->> 'role' = 'admin');

create policy "Only admins can update users"
    on public.users for update
    using (auth.jwt() ->> 'role' = 'admin');

create policy "Only admins can delete users"
    on public.users for delete
    using (auth.jwt() ->> 'role' = 'admin');

-- Create indexes
create index users_email_idx on public.users (email);
create index users_role_idx on public.users (role);

-- Set up triggers for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger handle_users_updated_at
    before update on public.users
    for each row
    execute procedure public.handle_updated_at();

-- Grant permissions
grant usage on schema public to anon, authenticated;
grant all on public.users to anon, authenticated;
grant usage on all sequences in schema public to anon, authenticated;