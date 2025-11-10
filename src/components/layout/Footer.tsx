import { Link } from "react-router-dom";
import { Container } from "@/components/layout/Container";

const footerLinks = [
  { label: "About", to: "/about" },
  { label: "Whitepaper", to: "/whitepaper" },
  { label: "Tokenomics", to: "/tokenomics" },
  { label: "Burn", to: "/burn" },
  { label: "Privacy", to: "/privacy" },
  { label: "Terms", to: "/terms" },
  { label: "Cookies", to: "/cookies" },
  { label: "Security", to: "/security" },
  { label: "Guidelines", to: "/guidelines" },
  { label: "Contact", to: "/contact" },
  { label: "Support", to: "/support" },
  { label: "Admin", to: "/admin" },
];

const socialLinks = [
  {
    label: "Twitter / X",
    href: "https://twitter.com/nopintelligencelayer",
  },
  {
    label: "Telegram",
    href: "https://t.me/nopintelligencelayer",
  },
  {
    label: "Discord",
    href: "https://discord.gg/nopintelligencelayer",
  },
  {
    label: "GitHub",
    href: "https://github.com/nopintelligencelayer",
  },
];

export const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-[#F5F8FF] py-10 text-sm text-slate-600">
      <Container>
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="text-base font-semibold text-[#0F172A]">
              NOP Intelligence Layer
            </div>
            <p className="max-w-sm leading-relaxed text-[#475569]">
              AI-led SocialFi intelligence network. Earn for meaningful signal,
              burn to prove commitment, build a safer crypto ecosystem.
            </p>
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} NOP Intelligence Layer. All rights
              reserved.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0F172A]">
                Site
              </h2>
              <ul className="mt-3 space-y-2">
                {footerLinks.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="transition hover:text-[#0F172A]"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0F172A]">
                Connect
              </h2>
              <ul className="mt-3 space-y-2">
                {socialLinks.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="transition hover:text-[#0F172A]"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
