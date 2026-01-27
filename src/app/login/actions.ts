'use server';

import { createMainClient } from "@/lib/db/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  // await を追加
  const supabase = await createMainClient(); 

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Login error:', error.message);
    return redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}