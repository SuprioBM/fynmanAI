export default function DashboardHero() {
  return (
    <section className="flex flex-col gap-2 py-8 inner-divider">
      <h1 className="font-display text-display text-on-surface">
        Welcome Back, Investigator.
      </h1>
      <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
        Your cognitive system has processed 4 active threads since your last
        session. Causal links in "Neural Architecture" require immediate
        validation.
      </p>
    </section>
  );
}