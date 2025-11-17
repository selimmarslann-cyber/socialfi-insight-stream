const normalize = (markdown: string) => markdown.replace(/\r/g, "");

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const extractSection = (markdown: string, heading: string) => {
  if (!markdown) {
    return "";
  }
  const normalized = normalize(markdown);
  const pattern = new RegExp(`##\\s+${escapeRegex(heading)}\\s*\\n+([\\s\\S]*?)(?=\\n##\\s+[^\\n]+|$)`, "i");
  const match = normalized.match(pattern);
  if (!match) {
    return "";
  }
  return match[1].trim();
};

export const extractSubsections = (sectionContent: string) => {
  if (!sectionContent) {
    return [];
  }
  const normalized = normalize(sectionContent);
  const matches = normalized.matchAll(/###\s+([^\n]+)\n([\s\S]*?)(?=(\n###\s+|$))/g);
  return Array.from(matches, (match) => ({
    title: match[1].trim(),
    content: match[2].trim(),
  }));
};

export const toParagraphs = (content: string) => {
  if (!content) {
    return [];
  }
  return content
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((block) => block.replace(/\n/g, " ").trim())
    .filter(Boolean);
};

export const toBullets = (content: string) => {
  if (!content) {
    return [];
  }
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[-*+]\s+/.test(line))
    .map((line) => line.replace(/^[-*+]\s+/, "").trim());
};

export const toOrderedList = (content: string) => {
  if (!content) {
    return [];
  }
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^\d+\.\s+/.test(line))
    .map((line) => line.replace(/^\d+\.\s+/, "").trim());
};

export const extractTableRows = (content: string) => {
  if (!content) {
    return [];
  }
  const rows = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"))
    .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()))
    .filter((row) => row.length > 0 && !row.every((cell) => /^-+$/.test(cell)));
  return rows;
};
