-- Normalise stored display names before enforcing uniqueness.
update public.profiles
set display_name = trim(regexp_replace(display_name, '\s+', ' ', 'g'))
where display_name is not null
  and display_name <> trim(regexp_replace(display_name, '\s+', ' ', 'g'));

-- Case-insensitive unique display names (race-safe at the database layer).
create unique index if not exists profiles_display_name_lower_unique
on public.profiles (lower(display_name));
