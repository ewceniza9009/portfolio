import { createHighlighter } from 'shiki';

let highlighterPromise: Promise<any> | null = null;

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildTokenHtml(tokens: any[][], fg: string): string {
  return tokens
    .map((line) =>
      line.length === 0
        ? '<div class="cm-line"><br></div>'
        : `<div class="cm-line">${line
            .map((t) => {
              const color = t.color || fg;
              let style = `color:${color}`;
              if (t.fontStyle & 1) style += ";font-style:italic";
              if (t.fontStyle & 2) style += ";font-weight:bold";
              return `<span class="cm-tok" style="${style}">${esc(t.content)}</span>`;
            })
            .join("")}</div>`
    )
    .join("");
}

self.onmessage = async (e) => {
  const { id, snapshots, lang } = e.data;

  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-dark", "github-light"],
      langs: [
        "javascript",
        "typescript",
        "csharp",
        "css",
        "html",
        "json",
        "sql",
        "python",
        "bash",
        "markdown",
        "yaml",
        "text",
      ],
    });
  }

  try {
    const shiki = await highlighterPromise;

    const dark = await Promise.all(
      snapshots.map(async (s: string) => {
        const r = await shiki.codeToTokens(s, { lang, theme: "github-dark" });
        return buildTokenHtml(r.tokens, r.fg);
      })
    );

    const light = await Promise.all(
      snapshots.map(async (s: string) => {
        const r = await shiki.codeToTokens(s, { lang, theme: "github-light" });
        return buildTokenHtml(r.tokens, r.fg);
      })
    );

    self.postMessage({ id, dark, light });
  } catch (error: any) {
    self.postMessage({ id, error: error.message || 'Error tokenizing code' });
  }
};
