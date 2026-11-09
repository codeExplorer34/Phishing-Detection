// Vercel sets VERCEL_PROJECT_PRODUCTION_URL (without https://) on every deployment.
const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const SITE_URL = productionHost ? `https://${productionHost}` : "http://localhost:3000";
export const SITE_NAME = "Fishy";
export const REPO_URL = "https://github.com/codeExplorer34/Phishing-Detection";
export const SITE_DESCRIPTION =
  "Fishy checks whether a link or message is phishing. Two machine-learning models score it, " +
  "explain why, and block dangerous links in your browser. A CSIT375 student project.";
