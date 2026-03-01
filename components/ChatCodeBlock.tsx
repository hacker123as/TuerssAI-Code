"use client";

import { Highlight } from "prism-react-renderer";
import type { Language } from "prism-react-renderer";
import Prism from "prismjs";
// eslint-disable-next-line @typescript-eslint/no-require-imports
require("prismjs/components/prism-lua");

const theme = {
  plain: { color: "#d4d4d4", backgroundColor: "transparent" },
  styles: [
    { types: ["comment"], style: { color: "#6a9955" } },
    { types: ["keyword", "selector"], style: { color: "#c586c0" } },
    { types: ["string", "attr-value"], style: { color: "#ce9178" } },
    { types: ["number", "constant"], style: { color: "#b5cea8" } },
    { types: ["function", "builtin"], style: { color: "#dcdcaa" } },
    { types: ["punctuation"], style: { color: "#d4d4d4" } },
    { types: ["operator"], style: { color: "#d4d4d4" } },
    { types: ["variable", "property"], style: { color: "#9cdcfe" } },
  ],
};

export function ChatCodeBlock({ code, language = "lua" }: { code: string; language?: string }) {
  return (
    <Highlight
      prism={Prism as unknown as import("prism-react-renderer").Prism}
      code={code.trimEnd()}
      language={language as Language}
      theme={theme}
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre className={`${className} overflow-x-auto p-4 text-[13px] leading-relaxed`} style={{ ...style, margin: 0, background: "transparent" }}>
          <code className="font-mono">
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, k) => (
                  <span key={k} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </code>
        </pre>
      )}
    </Highlight>
  );
}
