import { HealthCheck } from "@/components/features/system/health-check";

export default function Home() {
  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4">
      {/* DaisyUI Hero Component */}
      <div className="hero max-w-5xl mx-auto">
        <div className="hero-content flex-col lg:flex-row-reverse gap-12">
          {/* Right Column: Interactive Status Card */}
          <div className="flex flex-col gap-4">
            <HealthCheck />

            <div className="card bg-base-100 shadow-xl border border-base-300">
              <div className="card-body">
                <h2 className="card-title">Tech Stack</h2>
                <ul className="list-disc list-inside text-sm text-base-content/80 space-y-1">
                  <li>Next.js 16 (App Router)</li>
                  <li>Tailwind CSS v4 (Alpha)</li>
                  <li>DaisyUI v5</li>
                  <li>Supabase (Docker)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Left Column: Hero Text */}
          <div className="text-center lg:text-left">
            <h1 className="text-5xl font-bold bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
              SaaS Boilerplate
            </h1>
            <p className="py-6 text-lg text-base-content/80 max-w-md">
              Your environment is fully configured. This page demonstrates the
              integration of your local Dockerized database with the modern
              frontend stack.
            </p>
            <div className="flex gap-2 justify-center lg:justify-start">
              <button className="btn btn-primary">Get Started</button>
              <button className="btn btn-ghost">View Documentation</button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Proof of Tailwind v4 */}
      <footer className="absolute bottom-4 text-xs text-base-content/40 font-mono">
        Running on WSL 2 • Ubuntu 24.04
      </footer>
    </div>
  );
}
