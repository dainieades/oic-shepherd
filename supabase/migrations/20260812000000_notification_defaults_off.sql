-- personAdded, noticeAdded, and personUpdated should be opt-in, matching the
-- notifications settings UI's intended defaults, not opt-out like shepherdAssigned/todoCreated.
ALTER TABLE "public"."personas"
  ALTER COLUMN "notify_person_added" SET DEFAULT false,
  ALTER COLUMN "notify_notice_added" SET DEFAULT false,
  ALTER COLUMN "notify_person_updated" SET DEFAULT false;
