
-- Update password for es73896@gmail.com to 'hammer123'
UPDATE auth.users 
SET encrypted_password = crypt('hammer123', gen_salt('bf'))
WHERE email = 'es73896@gmail.com';
