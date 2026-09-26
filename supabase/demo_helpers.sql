-- Optional helper examples for a teacher after creating an account.
-- Replace YOUR_TEACHER_UUID with the teacher profile UUID from public.profiles.

-- insert into public.subjects(teacher_id, name) values ('YOUR_TEACHER_UUID', 'Matematik');
-- insert into public.students(teacher_id, full_name, grade_level, school)
-- values ('YOUR_TEACHER_UUID', 'Ahmet Yılmaz', '11. Sınıf', 'Anadolu Lisesi');

-- Create a parent/student invite after you know STUDENT_UUID:
-- insert into public.invites(teacher_id, student_id, target_role, code)
-- values ('YOUR_TEACHER_UUID', 'STUDENT_UUID', 'parent', 'AHMET-VELI-01');
-- insert into public.invites(teacher_id, student_id, target_role, code)
-- values ('YOUR_TEACHER_UUID', 'STUDENT_UUID', 'student', 'AHMET-OGR-01');
