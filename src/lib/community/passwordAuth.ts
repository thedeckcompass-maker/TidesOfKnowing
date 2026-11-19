import type { SupabaseClient } from '@supabase/supabase-js';
export async function passwordAction(auth: SupabaseClient['auth'], mode: string, form: FormData, origin: string) {
 const email=String(form.get('email')??'').trim().toLowerCase(),password=String(form.get('password')??'');
 if(mode!=='update'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return {error:'Enter a valid email address.'};
 try {
  if(mode==='confirm') {
   const result=await auth.resend({type:'signup',email,options:{emailRedirectTo:origin+'/auth/callback/?redirectTo=%2Fstudio%2F'}});
   if(result.error&&!['user_not_found','email_not_confirmed'].includes(result.error.code??''))return {error:'Unable to request confirmation right now. Please wait a few minutes and try again.'};
   return {message:'If this address has an unconfirmed account, a fresh confirmation email will be requested. Check your inbox and spam folder; this message does not confirm delivery.'};
  }
  if(mode==='forgot') {const result=await auth.resetPasswordForEmail(email,{redirectTo:origin+'/auth/callback/?redirectTo=%2Fauth%2Fpassword-update%2F'});if(result.error && result.error.code!=='user_not_found')return {error:'Unable to request a reset email right now. Please wait a few minutes and try again.'};return {message:`A password setup or reset request was submitted for ${email}. If it matches an account, an email may be sent. This message does not confirm sending or delivery. Check the address above and your inbox and spam folder. Open any reset email in this browser.`};}
  if(mode==='update') {
   const {data,error}=await auth.getUser();if(error||!data.user)return {error:'Your session has expired. Request a new reset link.'};
   if(password.length<12||password.length>128)return {error:'Use a password between 12 and 128 characters.'};
   if(password!==String(form.get('confirmPassword')??''))return {error:'The passwords do not match.'};
   const result=await auth.updateUser({password});if(result.error){if(['reauthentication_needed','reauthentication_not_valid','session_not_found'].includes(result.error.code??''))return {error:'Please sign in again using a secure link or request a fresh password reset email, then return here to save your password.'};return {error:'Unable to save this password. Try another password or request a fresh link.'};}return {success:true};
  }
  if(mode==='signin') {
   if(!password||password.length>128)return {error:'Enter your email and password.'};
   const result=await auth.signInWithPassword({email,password});
   if(result.error?.code==='email_not_confirmed')return {error:'Confirm your email before signing in. Use Confirm your email below to request a fresh message for your existing account.'};
   return result.error?{error:'Unable to sign in with those details. Check your email and password, or use password setup/reset or a secure link.'}:{success:true};
  }
  return {error:'Invalid request.'};
 }catch{return {error:'Unable to complete this request right now. Please try again.'};}
}
