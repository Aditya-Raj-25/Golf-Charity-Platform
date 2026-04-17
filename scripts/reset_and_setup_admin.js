console.log("⚠️ resetDatabase file is being executed");
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables in backend/.env');
  // process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetDatabase() {
  console.log('🚀 Starting Database Reset...');

  try {
    // Delete in order of constraints
    console.log('🗑️ Clearing data from tables...');

    const tables = ['winnings', 'user_charities', 'scores', 'draws', 'profiles'];
    for (const table of tables) {
      const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      if (error) {
        console.warn(`⚠️ Warning: Could not clear table ${table}:`, error.message);
      } else {
        console.log(`✅ Cleared ${table}`);
      }
    }

    // Clear Auth Users
    console.log('🗑️ Clearing Auth Users...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    for (const user of users) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      if (deleteError) {
        console.warn(`⚠️ Could not delete auth user ${user.email}:`, deleteError.message);
      } else {
        console.log(`✅ Deleted auth user ${user.email}`);
      }
    }

    // Create New Admin
    const adminEmail = 'admin123@gmail.com';
    const adminPass = '123456';

    console.log(`👤 Creating new admin: ${adminEmail}...`);
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPass,
      email_confirm: true
    });

    if (createError) throw createError;
    console.log('✅ Admin user created in Auth.');

    // The trigger 'on_auth_user_created' should have created the profile.
    // Let's force update it to be an admin.
    console.log('👑 Promoting to Admin status...');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', newUser.user.id);

    if (updateError) {
      // If profile doesn't exist yet (trigger delay), upsert it
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({ id: newUser.user.id, email: adminEmail, is_admin: true });
      if (upsertError) throw upsertError;
    }

    console.log('✨ Database reset and Admin setup complete!');

  } catch (err) {
    console.error('❌ Error during reset:', err.message);
  }
}

resetDatabase();
