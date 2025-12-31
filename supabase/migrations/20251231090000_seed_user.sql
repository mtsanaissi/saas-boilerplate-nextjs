-- The migration needed for seeding an user on db reset
-- Email: dev@dev.com
-- Password: devdevdev

DO $$ 
DECLARE 
  dev_user_id UUID := '00000000-0000-0000-0000-000000000001';
  dev_user_email TEXT := 'dev@dev.com';
  dev_user_password TEXT := 'devdevdev';
  encrypted_pw TEXT;
BEGIN 
  -- Generate encrypted password using Supabase's method
  encrypted_pw := extensions.crypt(dev_user_password, extensions.gen_salt('bf'));
  
  -- Create the user in auth.users if they don't exist
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = dev_user_email) THEN
    INSERT INTO auth.users (
      instance_id, 
      id, 
      aud, 
      role, 
      email, 
      encrypted_password, 
      email_confirmed_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      phone_confirmed_at,
      confirmation_sent_at,
      recovery_sent_at,
      email_change_sent_at,
      raw_app_meta_data, 
      raw_user_meta_data,
      created_at, 
      updated_at,
      last_sign_in_at,
      email_change,
      email_change_confirm_status,
      banned_until
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      dev_user_id,
      'authenticated',
      'authenticated',
      dev_user_email,
      encrypted_pw,
      now(),
      '',
      '',
      '',
      null,
      null,
      null,
      null,
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'sub', dev_user_id::text,
        'email', dev_user_email,
        'email_verified', true,
        'phone_verified', false
      ),
      now(),
      now(),
      now(),
      '',
      0,
      null
    );
    RAISE NOTICE 'Development user created with email: %', dev_user_email;
  ELSE
    RAISE NOTICE 'Development user with email % already exists, skipping creation.', dev_user_email;
  END IF;

  -- Create the user's identity if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = dev_user_id AND provider = 'email') THEN
    INSERT INTO auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      dev_user_id,
      dev_user_id,
      jsonb_build_object(
        'sub', dev_user_id::text,
        'email', dev_user_email,
        'email_verified', false,
        'phone_verified', false
      ),
      'email',
      now(),
      now(),
      now()
    );
    RAISE NOTICE 'Development user identity created for email: %', dev_user_email;
  ELSE
    RAISE NOTICE 'Development user identity for ID % already exists, skipping creation.', dev_user_id;
  END IF;

END $$;