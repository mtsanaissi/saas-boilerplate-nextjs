import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/dashboard");
  }

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-sm text-base-content/70">
            Signed in as <span className="font-mono">{user.email}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card bg-base-100 shadow-md border border-base-300">
            <div className="card-body">
              <h2 className="card-title text-base">Current plan</h2>
              <p className="text-sm text-base-content/70">
                You are currently on the{" "}
                <span className="font-medium">Free</span> plan.
              </p>
              <div className="card-actions mt-4">
                <a href="/plans" className="btn btn-primary btn-sm">
                  View plans
                </a>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md border border-base-300">
            <div className="card-body">
              <h2 className="card-title text-base">Getting started</h2>
              <ul className="list-disc list-inside text-sm space-y-1 text-base-content/80">
                <li>Explore the API and Supabase tables.</li>
                <li>Configure Stripe price IDs in your env.</li>
                <li>Deploy when you are ready for production.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
