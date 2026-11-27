-- onlyus: memperbaiki trigger generik artworks/memories/drawings, validasi goresan,
-- notifikasi perubahan konten/koneksi, dan konfigurasi lokasi untuk akun baru.
-- tidak mengubah kredensial, keanggotaan, atau media yang sudah tersimpan.
create or replace function public.onlyus_validate_shared_media()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  row_data jsonb := to_jsonb(new);
  writer_id uuid;
  captured timestamptz;
  stroke jsonb;
  point jsonb;
begin
  perform public.onlyus_lock_active_space(new.couple_id);
  writer_id := case when tg_table_name = 'drawings' then (row_data ->> 'sender_id')::uuid else (row_data ->> 'user_id')::uuid end;
  if writer_id is distinct from auth.uid() or split_part(new.image_url, '/', 1) <> new.couple_id::text
     or split_part(new.image_url, '/', 2) <> writer_id::text or not exists (
       select 1 from storage.objects where bucket_id = 'onlyus-media' and name = new.image_url
     ) then raise exception 'Media harus diunggah ke ruang privat milik penulis.'; end if;
  -- membaca field melalui jsonb: artworks/drawings tidak memiliki captured_at.
  if tg_table_name = 'memories' then
    captured := (row_data ->> 'captured_at')::timestamptz;
    if captured is null or captured > now() + interval '1 day' then
      raise exception 'Tanggal kenangan tidak valid atau berada di masa depan.';
    end if;
  end if;
  if tg_table_name = 'drawings' then
    if jsonb_typeof(row_data -> 'strokes') is distinct from 'array' then raise exception 'Goresan tidak valid.'; end if;
    if jsonb_array_length(row_data -> 'strokes') not between 1 and 300 then raise exception 'Jumlah goresan harus 1 sampai 300.'; end if;
    for stroke in select value from jsonb_array_elements(row_data -> 'strokes') loop
      if jsonb_typeof(stroke) is distinct from 'object' or coalesce(stroke ->> 'color', '') !~ '^#[0-9a-fA-F]{6}$'
        or jsonb_typeof(stroke -> 'width') is distinct from 'number' or jsonb_typeof(stroke -> 'points') is distinct from 'array'
      then raise exception 'Format goresan tidak valid.'; end if;
      if (stroke ->> 'width')::numeric not between 1 and 32 or jsonb_array_length(stroke -> 'points') not between 2 and 1201 then raise exception 'Ukuran pena atau jumlah titik tidak valid.'; end if;
      for point in select value from jsonb_array_elements(stroke -> 'points') loop
        if jsonb_typeof(point -> 'x') is distinct from 'number' or jsonb_typeof(point -> 'y') is distinct from 'number' then raise exception 'Titik goresan tidak valid.'; end if;
        if (point ->> 'x')::numeric not between 0 and 300 or (point ->> 'y')::numeric not between 0 and 300 then raise exception 'Titik goresan berada di luar canvas.'; end if;
      end loop;
    end loop;
  end if;
  return new;
end;
$$;
revoke all on function public.onlyus_validate_shared_media() from public, anon, authenticated;
-- mengganti trigger yang ada secara idempoten; data tidak dihapus.
drop trigger if exists onlyus_validate_media on public.artworks;
create trigger onlyus_validate_media before insert or update on public.artworks for each row execute function public.onlyus_validate_shared_media();
drop trigger if exists onlyus_validate_media on public.memories;
create trigger onlyus_validate_media before insert or update on public.memories for each row execute function public.onlyus_validate_shared_media();
drop trigger if exists onlyus_validate_media on public.drawings;
create trigger onlyus_validate_media before insert on public.drawings for each row execute function public.onlyus_validate_shared_media();
-- perubahan artwork/kenangan ikut memberi kabar kepada pasangan.
drop trigger if exists onlyus_notify_content on public.artworks;
create trigger onlyus_notify_content after insert or update on public.artworks for each row execute function public.onlyus_content_notification();
drop trigger if exists onlyus_notify_content on public.memories;
create trigger onlyus_notify_content after insert or update on public.memories for each row execute function public.onlyus_content_notification();

create or replace function public.onlyus_connection_notification()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.status = 'waiting' and new.status = 'active' then
    perform public.onlyus_notify_partner(new.id, coalesce(auth.uid(), new.created_by), 'connection', 'Couple Space aktif', 'Kalian kini terhubung dalam satu ruang pribadi.', jsonb_build_object('couple_id', new.id));
  end if;
  return new;
end;
$$;
revoke all on function public.onlyus_connection_notification() from public, anon, authenticated;
drop trigger if exists onlyus_notify_connection on public.couples;
create trigger onlyus_notify_connection after update of status on public.couples for each row execute function public.onlyus_connection_notification();

-- setiap akun memiliki konfigurasi backend, termasuk akun pengujian yang dibuat belakangan.
insert into public.onlyus_location_config(user_id) select id from public.profiles on conflict (user_id) do nothing;
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, email, username)
  values (new.id, coalesce(new.email, ''), left(coalesce(new.raw_user_meta_data ->> 'username', ''), 60)) on conflict (id) do nothing;
  insert into public.themes(user_id) values (new.id) on conflict (user_id) do nothing;
  insert into public.onlyus_location_config(user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
