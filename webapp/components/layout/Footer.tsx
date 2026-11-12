import { Logo } from "@/components/ui/Brand";
import { Github } from "@/components/ui/icons";
import { LAST_UPDATED } from "@/lib/content";
import { longDate } from "@/lib/format";
import { REPO_URL } from "@/lib/site";

/** The page is built once per deploy, so this is the date the live site last changed. */
const SITE_UPDATED = new Date().toISOString().slice(0, 10);

const COLUMNS = [
  { title: "Use Fishy", links: [["#scan", "Check a link"], ["#protection", "Your blocklist"], ["#how", "How it decides"], ["#accuracy", "Accuracy"]] },
  { title: "Project", links: [[REPO_URL, "GitHub repository"], ["#findings", "Findings"], ["#sources", "Sources"], ["#about", "About and team"]] },
] as const;

export function Footer() {
  return (
    <footer className="wrap pb-8 pt-16">
      <div className="flex flex-wrap justify-between gap-12 px-3">
        <a href="#top" aria-label="Fishy home" className="self-start"><Logo size={26} /></a>
        <div className="flex flex-wrap gap-x-16 gap-y-10 text-sm">
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title} className="flex flex-col gap-3">
              <b className="font-semibold">{col.title}</b>
              {col.links.map(([href, label]) => (
                <a key={href} href={href} className="text-muted hover:text-ink"
                  {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{label}</a>
              ))}
            </nav>
          ))}
          <div className="flex flex-col gap-3 text-muted">
            <b className="font-semibold text-ink">Course</b>
            <span>CSIT375 AI for Cybersecurity</span>
            <span>University of Wollongong</span>
            <a href="#privacy" className="hover:text-ink">Privacy</a>
          </div>
        </div>
      </div>
      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-line px-3 pt-6 text-sm text-muted">
        <span>© 2026 Fishy team. A student project, not a replacement for security software.</span>
        <span className="flex flex-wrap items-center gap-4">
          <span>
            Site updated <time dateTime={SITE_UPDATED}>{longDate(SITE_UPDATED)}</time> · Results from{" "}
            <time dateTime={LAST_UPDATED}>{longDate(LAST_UPDATED)}</time>
          </span>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" aria-label="Fishy on GitHub" className="text-ink hover:text-teal-deep">
            <Github size={18} />
          </a>
        </span>
      </div>
    </footer>
  );
}
