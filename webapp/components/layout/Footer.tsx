import { Logo } from "@/components/ui/Brand";
import { Github } from "@/components/ui/icons";
import { LAST_UPDATED } from "@/lib/content";
import { longDate } from "@/lib/format";
import { REPO_URL } from "@/lib/site";

const COLUMNS = [
  { title: "Use Fishy", links: [["#scan", "Check a link"], ["#protection", "Your blocklist"], ["#how", "How it decides"], ["#accuracy", "Accuracy"]] },
  { title: "Project", links: [[REPO_URL, "GitHub repository"], ["#findings", "Findings"], ["#sources", "Sources"], ["#about", "About and team"]] },
] as const;

export function Footer() {
  return (
    <footer className="wrap pb-7 pt-16">
      <div className="flex flex-wrap justify-between gap-12 px-3">
        <a href="#top" aria-label="Fishy home" className="self-start"><Logo size={26} /></a>
        <div className="flex flex-wrap gap-x-16 gap-y-10 text-sm">
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title} className="flex flex-col gap-2.5">
              <b className="text-[13px] font-bold">{col.title}</b>
              {col.links.map(([href, label]) => (
                <a key={href} href={href} className="text-muted hover:text-ink"
                  {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{label}</a>
              ))}
            </nav>
          ))}
          <div className="flex flex-col gap-2.5 text-muted">
            <b className="text-[13px] font-bold text-ink">Course</b>
            <span>CSIT375 AI for Cybersecurity</span>
            <span>University of Wollongong</span>
            <span>Last updated <time dateTime={LAST_UPDATED}>{longDate(LAST_UPDATED)}</time></span>
          </div>
        </div>
      </div>
      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-line px-3 pt-5 text-[13px] text-muted">
        <span>© 2026 Fishy team. A student project, not a replacement for security software.</span>
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer" aria-label="Fishy on GitHub" className="text-ink hover:text-teal-deep">
          <Github size={18} />
        </a>
      </div>
    </footer>
  );
}
