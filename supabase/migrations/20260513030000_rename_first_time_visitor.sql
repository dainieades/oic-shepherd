-- Rename church_attendance value 'first-time-visitor' to 'visitor'.

update people
  set church_attendance = 'visitor'
  where church_attendance = 'first-time-visitor';
