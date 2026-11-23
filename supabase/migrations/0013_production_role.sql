-- HB Portal · Production team, part 1: new enum values.
-- (New enum values cannot be used in the same transaction that adds them, so they live in their own migration.)
alter type public.app_role add value if not exists 'production';
alter type public.content_visibility add value if not exists 'production';
