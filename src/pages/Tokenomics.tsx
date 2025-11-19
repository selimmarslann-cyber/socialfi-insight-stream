import { useMemo } from "react";
import { Link } from "react-router-dom";
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { DashboardSectionTitle } from "@/components/layout/visuals/DashboardSectionTitle";
import { Button } from "@/components/ui/button";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { extractSection, extractTableRows, toBullets } from "@/lib/markdown";
import tokenomicsMarkdown from "@/../docs/NOP_INTELLIGENCE_LAYER_TOKENOMICS.md?raw";
import tokenomicsDocUrl from "@/../docs/NOP_INTELLIGENCE_LAYER_TOKENOMICS.md?url";

type BulletTree = {
  text: string;
  subpoints: string[];
};

const buildBulletTree = (content: string): BulletTree[] => {
  const lines = content.replace(/\r/g, "").split("\n");
  const tree: BulletTree[] = [];
  let current: BulletTree | null = null;

  lines.forEach((line) => {
    if (!line.trim().startsWith("-")) {
      return;
    }
    const indent = line.search(/\S/);
    const text = line.replace(/^\s*-\s+/, "").trim();
    if (indent === 0 || indent === -1) {
      current = { text, subpoints: [] };
      tree.push(current);
    } else if (current) {
      current.subpoints.push(text);
    }
  });

  return tree;
};

const Tokenomics = () => {
  usePageMetadata({
    title: "NOP Tokenomics",
    description: "Utility, fee model, burn mechanics, and rewards logic for the NOP Intelligence Layer.",
  });

  const utilityBullets = useMemo(
    () => toBullets(extractSection(tokenomicsMarkdown, "2. Utility within NOP Intelligence Layer")),
    [],
  );

  const feeSection = useMemo(() => extractSection(tokenomicsMarkdown, "3. Protocol Fee Model"), []);
  const feeBullets = useMemo(() => toBullets(feeSection), [feeSection]);

  const feeExamples = useMemo(() => {
    const rows = extractTableRows(feeSection);
    return rows
      .filter((row) => /^\$/.test(row[0]))
      .map((row) => ({
        notional: row[0],
        fee: row[1],
        burn: row[2],
        treasury: row[3],
        rewards: row[4],
      }));
  }, [feeSection]);

  const emissionSection = useMemo(() => extractSection(tokenomicsMarkdown, "4. Emission & Rewards Logic (App Layer)"), []);
  const emissionBullets = useMemo(() => buildBulletTree(emissionSection), [emissionSection]);

  const sustainabilityBullets = useMemo(
    () => toBullets(extractSection(tokenomicsMarkdown, "5. Sustainability Considerations")),
    [],
  );

  return (
    <div className="space-y-5">
      <DashboardCard className="space-y-4">
        <DashboardSectionTitle label="Tokenomics" title="NOP Utility" />
        <ul className="space-y-3 text-sm text-slate-600">
          {utilityBullets.map((bullet) => (
            <li key={bullet} className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </DashboardCard>

      <DashboardCard className="space-y-4">
          <DashboardSectionTitle label="Fees" title="1% protocol fee split" />
          <div className="space-y-4">
            <ul className="space-y-2 text-sm text-text-secondary">
            {feeBullets.map((bullet) => (
              <li key={bullet} className="flex gap-3">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>

            <div className="overflow-x-auto rounded-2xl border border-border-subtle">
              <table className="min-w-full text-left text-sm text-text-secondary">
                <thead className="bg-surface-muted text-xs uppercase text-text-secondary">
                <tr>
                  <th className="px-4 py-3 font-semibold">Notional</th>
                  <th className="px-4 py-3 font-semibold">Fee (1%)</th>
                  <th className="px-4 py-3 font-semibold">Burn 50%</th>
                  <th className="px-4 py-3 font-semibold">Treasury 25%</th>
                  <th className="px-4 py-3 font-semibold">Rewards 25%</th>
                </tr>
              </thead>
                <tbody>
                {feeExamples.map((row) => (
                    <tr key={row.notional} className="border-t border-border-subtle">
                      <td className="px-4 py-3 font-medium text-text-primary">{row.notional}</td>
                    <td className="px-4 py-3">{row.fee}</td>
                    <td className="px-4 py-3">{row.burn}</td>
                    <td className="px-4 py-3">{row.treasury}</td>
                    <td className="px-4 py-3">{row.rewards}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard className="space-y-5">
        <DashboardSectionTitle label="Rewards" title="Emissions & Sustainability" />
            <div className="grid gap-4 lg:grid-cols-2">
              <section className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-card-soft">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Emission Controls</h3>
              <ul className="mt-3 space-y-3 text-sm text-text-secondary">
              {emissionBullets.map((item) => (
                <li key={item.text}>
                  <div className="flex gap-3">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                    <span>{item.text}</span>
                  </div>
                  {item.subpoints.length > 0 ? (
                        <ul className="mt-2 space-y-1 pl-6 text-[13px] text-text-muted">
                      {item.subpoints.map((subpoint) => (
                        <li key={subpoint} className="list-disc">
                          {subpoint}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
              <section className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-card-soft">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Sustainability</h3>
              <ul className="mt-3 space-y-3 text-sm text-text-secondary">
              {sustainabilityBullets.map((bullet) => (
                <li key={bullet} className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
        <div className="rounded-2xl border border-dashed border-slate-200 bg-gradient-to-r from-indigo-50 to-slate-50 p-5">
          <p className="text-sm text-slate-600">
            Track live burns and treasury events inside the{" "}
            <Link to="/burn" className="font-semibold text-indigo-600 hover:underline">
              burn dashboard
            </Link>{" "}
            and Boosted Tasks widget.
          </p>
        </div>
      </DashboardCard>

      <DashboardCard className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <DashboardSectionTitle label="Full Document" title="Download detailed tokenomics" />
          <p className="text-sm text-slate-600">
            Includes token overview, supply placeholders, fee routing plan, and governance roadmap.
          </p>
        </div>
        <Button asChild>
          <a href={tokenomicsDocUrl} target="_blank" rel="noreferrer">
            Download Tokenomics
          </a>
        </Button>
      </DashboardCard>
    </div>
  );
};

export default Tokenomics;
