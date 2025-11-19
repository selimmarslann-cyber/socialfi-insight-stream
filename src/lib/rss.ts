export async function fetchRssFeed(listCsv: string, limit = 10) {
  if (!listCsv) {
    return [];
  }

  const feeds = listCsv.split(",").map((entry) => entry.trim()).filter(Boolean);
  const collected: Array<{
    title: string;
    url: string;
    published_at: string;
    source: string;
  }> = [];

  for (const url of feeds) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      const xml = await response.text();

      const matches = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g)).slice(0, limit);

      const items = matches.map((match) => {
        const block = match[1] ?? "";
        const cdataTitle = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
        const simpleTitle = block.match(/<title>(.*?)<\/title>/);
        const title = cdataTitle?.[1] ?? simpleTitle?.[1] ?? "";

        const linkMatch = block.match(/<link>(.*?)<\/link>/);
        const link = linkMatch?.[1] ?? "";

        const pubMatch = block.match(/<pubDate>(.*?)<\/pubDate>/);
        const publishedAt = pubMatch?.[1] ?? new Date().toISOString();

        const sourceHost = (() => {
          try {
            const href = link || url;
            return new URL(href).hostname;
          } catch {
            return "unknown";
          }
        })();

        return {
          title: decodeHTMLEntities(title),
          url: link,
          published_at: publishedAt,
          source: sourceHost,
        };
      });

      collected.push(...items);
    } catch (error) {
      console.warn("RSS fail", url, error);
    }
  }

  collected.sort(
    (a, b) =>
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
  );

  return collected.slice(0, limit);
}

function decodeHTMLEntities(value: string) {
  if (typeof document === "undefined") {
    return value;
  }
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}
