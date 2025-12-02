'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function HealthCheck() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [envCheck, setEnvCheck] = useState<string>('Checking...');

  useEffect(() => {
    async function checkConnection() {
      try {
        const supabase = createClient();
        
        // 1. Check if ENV vars are loaded
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
          throw new Error('Missing Env Vars');
        }
        setEnvCheck('Env Vars Loaded');

        // 2. Simple ping to Auth service
        const { error } = await supabase.auth.getSession();
        
        if (error) throw error;
        setStatus('connected');
      } catch (e) {
        console.error(e);
        setStatus('error');
      }
    }

    checkConnection();
  }, []);

  return (
    <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl border border-base-300">
      <div className="card-body">
        <h3 className="card-title text-sm opacity-70">System Status</h3>
        
        {/* Tailwind v4 + DaisyUI v5 Badge */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-mono">Supabase</span>
          {status === 'loading' && <span className="badge badge-warning animate-pulse">Checking...</span>}
          {status === 'connected' && <span className="badge badge-success gap-2">🟢 Online</span>}
          {status === 'error' && <span className="badge badge-error gap-2">🔴 Offline</span>}
        </div>

        <div className="text-xs text-base-content/50 mt-2 font-mono">
           {envCheck}
        </div>
      </div>
    </div>
  );
}