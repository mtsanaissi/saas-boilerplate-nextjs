import { notFound } from "next/navigation";

interface DevA11yPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DevA11yPage({ searchParams }: DevA11yPageProps) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const showLongContent = resolvedSearchParams.long === "1";

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Accessibility surface</h1>
        <p className="opacity-80">
          Use this page to validate focus visibility, heading hierarchy, and
          interactive control semantics.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Focusable controls</h2>
        <div className="flex flex-wrap gap-3 items-center">
          <button type="button" className="btn btn-primary">
            Primary button
          </button>
          <button type="button" className="btn btn-outline">
            Outline button
          </button>
          <button type="button" className="btn btn-ghost">
            Ghost button
          </button>
          <a href="#contrast" className="link">
            In-page link
          </a>
          <label className="label cursor-pointer gap-2">
            <span className="label-text">Checkbox</span>
            <input type="checkbox" className="checkbox" />
          </label>
          <label className="label cursor-pointer gap-2">
            <span className="label-text">Toggle</span>
            <input type="checkbox" className="toggle" />
          </label>
        </div>
        <p className="text-sm opacity-80">
          Tip: keyboard-tab through the controls and confirm the focus indicator
          is always visible.
        </p>
      </section>

      <section id="contrast" className="space-y-4">
        <h2 className="text-xl font-semibold">Contrast samples</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-box bg-base-100 border border-base-300">
            <p className="font-medium">Base surface</p>
            <p className="text-sm opacity-80">
              Text on base background for quick visual checks.
            </p>
          </div>
          <div className="p-4 rounded-box bg-primary text-primary-content">
            <p className="font-medium">Primary surface</p>
            <p className="text-sm opacity-90">
              Verify contrast for primary tokens.
            </p>
          </div>
          <div className="p-4 rounded-box bg-success text-success-content">
            <p className="font-medium">Success surface</p>
            <p className="text-sm opacity-90">
              Used for success alerts and badges.
            </p>
          </div>
          <div className="p-4 rounded-box bg-error text-error-content">
            <p className="font-medium">Error surface</p>
            <p className="text-sm opacity-90">
              Used for error alerts and validation messages.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Headings + content</h2>
        <p className="opacity-80">
          This section exists to help validate consistent heading order and a
          single page-level heading.
        </p>
        {showLongContent ? (
          <div className="space-y-3">
            {Array.from({ length: 12 }).map((_, index) => (
              <p key={index} className="opacity-80">
                Placeholder paragraph {index + 1}. Use this to test scroll,
                focus retention, and any skip-to-content behavior once added.
              </p>
            ))}
          </div>
        ) : (
          <p className="text-sm opacity-80">
            Add <code className="px-1 rounded bg-base-300">?long=1</code> to
            generate more content.
          </p>
        )}
      </section>
    </div>
  );
}
