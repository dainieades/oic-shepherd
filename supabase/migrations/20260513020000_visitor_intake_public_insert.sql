-- Allow anonymous (unauthenticated) inserts into visitor_submissions for the
-- public /welcome form. Only source='qr' & status='pending' are accepted from
-- anon, and person_id must be NULL — promotion to a Person is gated by the
-- authenticated review flow.

create policy "Anonymous can insert pending QR submissions"
  on visitor_submissions for insert
  to anon
  with check (
    source = 'qr'
    and status = 'pending'
    and person_id is null
    and submitted_by is null
  );
