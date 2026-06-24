alter table public.ask_leilia_requests
drop constraint if exists ask_leilia_requests_status_check;

alter table public.ask_leilia_requests
add constraint ask_leilia_requests_status_check
check (status in ('Pending Payment', 'Paid', 'In Progress', 'Delivered'));

create index if not exists ask_leilia_requests_payment_id_idx
on public.ask_leilia_requests(payment_id);
