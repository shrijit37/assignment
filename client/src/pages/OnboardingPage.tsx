import { ArrowRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PREVIEW_TASKS = ["Finishing the wireframe", "Meeting with the team", "Buy cat food"];

/**
 * First screen of the app: a short pitch on a solid blue panel with a single
 * call to action into the planner.
 */
export function OnboardingPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[1.05fr_1fr]">
      <section className="relative isolate overflow-hidden bg-primary px-6 pb-16 pt-8 lg:min-h-dvh lg:px-16 lg:py-14">
        <div
          className="pointer-events-none absolute -right-24 -top-24 size-[420px] rounded-full border-[26px] border-white/10"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-32 bottom-[-140px] size-[380px] rounded-full border-[22px] border-white/10"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-10 top-24 hidden size-[220px] rounded-full border-[18px] border-white/10 lg:block"
          aria-hidden="true"
        />

        <div className="relative z-10 flex items-center gap-2 text-white">
          <span className="grid size-10 place-items-center rounded-2xl bg-white text-primary shadow-lg">
            <Check className="size-5" strokeWidth={3} />
          </span>
          <span className="text-sm font-extrabold uppercase tracking-[0.18em]">Taskly</span>
        </div>

        <div className="relative z-10 mt-12 max-w-sm lg:mt-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
            Weekly planner
          </p>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight text-white sm:text-4xl">
            One week, every task, nothing forgotten.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/80">
            Group your work Monday to Sunday, keep an eye on what is pending and swipe away the
            things you no longer need.
          </p>

          <ul className="mt-8 space-y-3">
            {PREVIEW_TASKS.map((task) => (
              <li
                key={task}
                className="flex items-center gap-3 rounded-2xl bg-white/12 px-4 py-3 text-sm font-medium text-white backdrop-blur-sm"
              >
                <span className="grid size-6 place-items-center rounded-lg border border-white/40">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                {task}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="relative z-10 -mt-8 rounded-t-[32px] bg-white px-6 pb-10 pt-8 shadow-card sm:px-10 lg:mt-0 lg:flex lg:min-h-dvh lg:flex-col lg:justify-center lg:rounded-none lg:px-20 lg:pb-16">
        <div className="mx-auto w-full max-w-md">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Manage what to do</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            The best way to manage what you have to do. Plan each day, mark it complete and let the
            weekly progress tell you how the week is going.
          </p>

          <button
            type="button"
            onClick={() => navigate("/app")}
            className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-white shadow-float transition hover:bg-primary-strong active:translate-y-px"
          >
            Get started
            <ArrowRight className="size-4" />
          </button>

          <p className="mt-4 text-center text-xs text-muted">
            Every change is saved to your own task list.
          </p>
        </div>
      </section>
    </main>
  );
}
