import { Link } from "react-router-dom";
import { Container } from "@/components/layout/Container";

const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "About", to: "/about" },
      { label: "Features", to: "/features" },
      { label: "Roadmap", to: "/roadmap" },
    ],
  },
  {
    title: "Docs",
    links: [
      { label: "Whitepaper", to: "/whitepaper" },
      { label: "FAQ", to: "/faq" },
      { label: "API Docs", to: "/docs/api" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help & Support", to: "/support" },
      { label: "Contact", to: "/contact" },
      { label: "Community", to: "/community" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", to: "/legal/privacy" },
      { label: "Terms", to: "/legal/terms" },
      { label: "Cookies", to: "/legal/cookies" },
    ],
  },
  {
    title: "System",
    links: [
      { label: "Admin Panel", to: "/admin" },
      { label: "Status", to: "/status" },
    ],
  },
];

export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-[color:var(--ring)] bg-[color:var(--bg-base)]/95 text-[color:var(--text-secondary)]">
      <Container>
        <div className="grid gap-10 py-12 lg:grid-cols-[1.4fr_3fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo.svg"
                alt="NOP Intelligence Layer"
                className="h-10 w-10"
                loading="lazy"
              />
              <div>
                <p className="text-base font-semibold text-[color:var(--text-primary)]">
                  NOP Intelligence Layer
                </p>
                <p className="text-xs text-[color:var(--text-secondary)]">
                  SocialFi · AI · Proof-of-Burn
                </p>
              </div>
            </div>
            <p className="max-w-sm text-sm">
              A professional signal network where researchers publish, communities
              co-fund, and AI moderates the flow. Every contribution is scored,
              every burn is accounted for.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {footerColumns.map((column) => (
              <div key={column.title} className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]/80">
                  {column.title}
                </p>
                <ul className="space-y-2 text-sm">
                  {column.links.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="transition hover:text-[color:var(--text-primary)]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Container>
      <div className="border-t border-[color:var(--ring)] px-6 py-4 text-center text-xs text-[color:var(--text-secondary)]">
        © {year} NOP Intelligence Layer. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
