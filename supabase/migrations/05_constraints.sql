-- Stage 13: bound payload size and enforce a readable project shape.
begin;
alter table public.projects add constraint projects_content_size check (octet_length(content::text) <= 16384);
alter table public.projects add constraint projects_content_shape check (
  content ?& array['topic', 'kind', 'titles', 'description', 'tags', 'checklist']
  and jsonb_typeof(content->'titles') = 'array'
  and jsonb_typeof(content->'tags') = 'array'
  and jsonb_typeof(content->'checklist') = 'array'
  and jsonb_typeof(content->'description') = 'string'
  and content->>'kind' = kind
  and content->>'topic' = title
);
commit;
