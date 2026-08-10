import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Auth ਪੂਰਾ ਹੋਣ ਤੋਂ ਬਾਅਦ ਸਿੱਧਾ ਡੈਸ਼ਬੋਰਡ / ਹੋਮ ਪੇਜ 'ਤੇ ਰੀਡਾਇਰੈਕਟ ਕਰੋ
  return NextResponse.redirect(requestUrl.origin);
}