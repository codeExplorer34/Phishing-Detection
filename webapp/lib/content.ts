import example from "@/data/example-result.json";
import metrics from "@/data/metrics.json";

import { f3, thousands } from "./format";
import { scanResultSchema } from "./schemas";
import { REPO_URL } from "./site";

/** All facts on the site come from data/metrics.json (built by scripts/build_metrics.py). */
export const METRICS = metrics;
export const LAST_UPDATED = metrics.last_updated;
export const EXAMPLE_RESULT = scanResultSchema.parse(example);

export interface AccuracyRow {
  name: string;
  links: number;
  a: number;
  b: number;
  both: number;
}

export const ACCURACY_ROWS: AccuracyRow[] = [
  { name: "Web-page dataset", ...metrics.cross_dataset.web_page },
  { name: "URL dataset", ...metrics.cross_dataset.url },
];

export const WORST = {
  a: Math.min(...ACCURACY_ROWS.map((r) => r.a)),
  b: Math.min(...ACCURACY_ROWS.map((r) => r.b)),
  both: Math.min(...ACCURACY_ROWS.map((r) => r.both)),
};

export interface Finding {
  figure: string;
  title: string;
  body: string;
  link: { href: string; label: string };
}

export const FINDINGS: Finding[] = [
  {
    figure: `${f3(metrics.in_domain.model_a_all_features_f1)} → ${f3(metrics.in_domain.model_a_no_leakage_f1)}`,
    title: "Two columns were giving the answer away.",
    body: "“google_index” and “page_rank” come from outside services, not from the page itself. The dataset’s authors also found outside-service features the most predictive. We removed them so the test is fair, and Model A’s F1 barely moved.",
    link: { href: "https://arxiv.org/abs/2010.12847", label: "Source: Hannousse and Yahiouche, 2021" },
  },
  {
    figure: thousands(metrics.ip_mismatches),
    title: "training links were marked as IP addresses but had none.",
    body: "For example “support-appleld.com.secureupdate…” is a normal domain name. We checked every feature against our own calculation and left out the three that did not match.",
    link: { href: REPO_URL, label: "Source: our feature check, on GitHub" },
  },
  {
    figure: f3(metrics.cross_dataset.url.a),
    title: "Model A’s F1 on the other dataset.",
    body: `A model can score ${f3(metrics.in_domain.model_a_url_only_f1)} on its own test set and still fail on links collected a different way. This is why Fishy uses two models and shows you both scores.`,
    link: { href: "#accuracy", label: "See the accuracy table" },
  },
];

export interface TeamMember {
  name: string;
  role: string;
  contribution: string;
  photo: string | null;
  initials: string;
}

export const TEAM: TeamMember[] = [
  { name: "Member 1", role: "Data", initials: "M1", photo: null,
    contribution: "Cleaned both datasets and built the train and test splits." },
  { name: "Taha", role: "Model A", initials: "T", photo: "/team/taha.webp",
    contribution: "Trained and compared Logistic Regression, Random Forest and Gradient Boosting on URL and page features." },
  { name: "Numaan", role: "Model B", initials: "N", photo: "/team/numaan.webp",
    contribution: "Built the letter-pattern model, its four threat types and the slash-bug regression test." },
  { name: "Suhayb", role: "App and report", initials: "S", photo: "/team/suhayb.webp",
    contribution: "Designed and built this site, its alerts and blocking, and the final report." },
];

export interface Source {
  text: string;
  emphasis?: string;
  tail?: string;
  href: string;
  linkLabel: string;
}

export const SOURCES: Source[] = [
  { text: "Hannousse, A. and Yahiouche, S. (2021). Towards benchmark datasets for machine learning based website phishing detection.",
    emphasis: "Engineering Applications of Artificial Intelligence", tail: ", 104, 104347.",
    href: "https://arxiv.org/abs/2010.12847", linkLabel: "arXiv:2010.12847" },
  { text: "Web page phishing detection dataset (shashwatwork).",
    href: "https://www.kaggle.com/datasets/shashwatwork/web-page-phishing-detection-dataset",
    linkLabel: "Kaggle" },
  { text: "Malicious URLs dataset (sid321axn).", href: "https://www.kaggle.com/datasets/sid321axn/malicious-urls-dataset",
    linkLabel: "Kaggle" },
  { text: "scikit-learn documentation.", href: "https://scikit-learn.org/stable/", linkLabel: "scikit-learn.org" },
];

export interface Faq {
  question: string;
  answer: string;
}

export const FAQS: Faq[] = [
  { question: "What do “Random Forest” and “TF‑IDF” mean?",
    answer: "A Random Forest is a few hundred small decision trees that each vote, for example “is the address longer than 75 characters?”. TF-IDF counts short groups of letters, like “pay” or “.exe”, and gives more weight to the ones that are rare. Logistic Regression then turns those counts into a probability." },
  { question: "Does Fishy open the links it checks?",
    answer: "No. Fishy only reads the text of the address. It never visits the site, so checking a link can’t infect your device or tell the site that you looked." },
  { question: "Why did Model B give google.com 68.8%?",
    answer: "Model B learned from a dataset where most bare homepages, a name with nothing after it, were phishing pages. So it is wary of any short address. Fishy checks a short list of well-known sites first and marks them safe, but still shows you both models’ scores." },
  { question: "What data were the models trained on?",
    answer: `Model A learned from 9,143 labelled web pages (the Web page phishing detection dataset). Model B learned from ${thousands(metrics.splits.url_train)} labelled links (the Malicious URLs dataset). Both were cleaned and split so that no link appears in both training and testing.` },
  { question: "Where are my checks stored?",
    answer: "Your blocklist, history and alerts stay in this browser and never leave it. The links you check are sent to Fishy’s server only to be scored. They are not saved or logged there." },
  { question: "Can I use Fishy instead of antivirus?",
    answer: "No. Fishy is a student project. On links unlike its training data it still misses some phishing and flags some safe sites, as the accuracy table shows. Use it as a second opinion, alongside your browser’s built-in protection." },
];

export const SAMPLE_MESSAGE = [
  "Subject: Urgent: your account has been suspended",
  "",
  "Dear customer,",
  "We noticed unusual activity on your PayPal account. Verify your account within 24 hours or it will be permanently suspended.",
  "",
  "Confirm your password here: http://paypa1-secure-update.com/signin",
  "Or use this short link: bit.ly/3xR9qPz",
  "",
  "Need help? Visit https://www.paypal.com/help",
].join("\n");

export const EXAMPLE_LINKS = [
  { label: "google.com", url: "google.com" },
  { label: "paypa1-secure-update.com", url: "http://paypa1-secure-update.com/signin" },
  { label: "192.168.4.2/paypal-login", url: "http://192.168.4.2/paypal-login-verify/account.php" },
  { label: "free-gift-card.xyz", url: "http://free-gift-card.xyz/claim.exe" },
];
