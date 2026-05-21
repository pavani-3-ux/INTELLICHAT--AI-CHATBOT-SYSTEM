import React, { useState } from "react";
import { Info, CheckCircle, AlertTriangle, Copy, Check } from "lucide-react";

interface HighlightParserProps {
  text: string;
}

export function HighlightParser({ text }: HighlightParserProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (codeText: string, id: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!text) return null;

  // We will split the text by lines to parse markdown elements like headings, lists, codeblocks, and special alert wrappers.
  const lines = text.split("\n");
  const renderedElements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLang = "";
  let blockKey = 0;

  const parseInlineElements = (lineText: string): React.ReactNode[] => {
    // 1. Parse special color codes: Blue Info, Green Success, Red Warning
    // Regex for: [Color Type: text]
    const parts: React.ReactNode[] = [];
    let currentText = lineText;

    const alertRegex = /\[(Blue Info|Green Success|Red Warning):\s*([^\]]+)\]/g;
    let match;
    let lastIndex = 0;

    // Reset regex due to global flag
    alertRegex.lastIndex = 0;

    while ((match = alertRegex.exec(lineText)) !== null) {
      const matchIndex = match.index;
      const type = match[1];
      const content = match[2];

      // Add normal text before match
      if (matchIndex > lastIndex) {
        parts.push(...parseMarkdownStyles(currentText.substring(lastIndex, matchIndex)));
      }

      // Add styled Alert Box
      const alertId = `alert-${matchIndex}`;
      if (type === "Blue Info") {
        parts.push(
          <span
            key={alertId}
            className="flex items-start gap-2.5 glass-card-info text-blue-100 rounded-xl p-3.5 my-2.5 w-full text-sm leading-relaxed"
          >
            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <span className="flex-1">
              <strong>Info:</strong> {content}
            </span>
          </span>
        );
      } else if (type === "Green Success") {
        parts.push(
          <span
            key={alertId}
            className="flex items-start gap-2.5 glass-card-success text-emerald-100 rounded-xl p-3.5 my-2.5 w-full text-sm leading-relaxed"
          >
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <span className="flex-1">
              <strong>Success:</strong> {content}
            </span>
          </span>
        );
      } else if (type === "Red Warning") {
        parts.push(
          <span
            key={alertId}
            className="flex items-start gap-2.5 glass-card-warning text-rose-100 rounded-xl p-3.5 my-2.5 w-full text-sm leading-relaxed"
          >
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <span className="flex-1">
              <strong>Warning:</strong> {content}
            </span>
          </span>
        );
      }

      lastIndex = alertRegex.lastIndex;
    }

    if (lastIndex < currentText.length) {
      parts.push(...parseMarkdownStyles(currentText.substring(lastIndex)));
    }

    return parts.length > 0 ? parts : [lineText];
  };

  const parseMarkdownStyles = (inputText: string): React.ReactNode[] => {
    let textToParse = inputText;
    const pieces: React.ReactNode[] = [];
    let pieceKey = 0;

    // Split on bold text "**" and inline code "`"
    // An basic tokenizer for inline styles:
    const tokenRegex = /(\*\*.*?\*\*|`.*?`)/g;
    const tokens = textToParse.split(tokenRegex);

    tokens.forEach((token, index) => {
      if (token.startsWith("**") && token.endsWith("**")) {
        pieces.push(
          <strong key={`${index}-${pieceKey++}`} className="font-semibold text-slate-100">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith("`") && token.endsWith("`")) {
        pieces.push(
          <code
            key={`${index}-${pieceKey++}`}
            className="px-1.5 py-0.5 mx-0.5 bg-slate-800 text-pink-400 rounded text-xs font-mono border border-slate-700/50"
          >
            {token.slice(1, -1)}
          </code>
        );
      } else {
        pieces.push(token);
      }
    });

    return pieces;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check code blocks
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        // End code block
        inCodeBlock = false;
        const codeContentString = codeBlockContent.join("\n");
        const currentLang = codeBlockLang;
        const currentId = `code-block-${blockKey++}`;

        renderedElements.push(
          <div key={currentId} className="my-3 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 font-mono text-xs w-full">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-950 text-slate-400 border-b border-slate-800 select-none">
              <span className="lowercase font-semibold text-slate-300">{currentLang || "code"}</span>
              <button
                onClick={() => handleCopy(codeContentString, currentId)}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 hover:bg-slate-850 hover:text-slate-200 transition text-[11px]"
                title="Copy code"
              >
                {copiedId === currentId ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-slate-200 leading-relaxed max-w-full">
              <code>{codeContentString}</code>
            </pre>
          </div>
        );
        codeBlockContent = [];
        codeBlockLang = "";
      } else {
        // Start code block
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Handle normal elements
    const trimmedLine = line.trim();

    // 1. Heading level 1, 2, 3
    if (trimmedLine.startsWith("###")) {
      renderedElements.push(
        <h3 key={`h3-${i}`} className="text-base font-semibold font-display text-emerald-400 mt-4 mb-2">
          {parseInlineElements(trimmedLine.slice(3).trim())}
        </h3>
      );
    } else if (trimmedLine.startsWith("##")) {
      renderedElements.push(
        <h2 key={`h2-${i}`} className="text-lg font-bold font-display text-slate-100 mt-4 mb-2">
          {parseInlineElements(trimmedLine.slice(2).trim())}
        </h2>
      );
    } else if (trimmedLine.startsWith("#")) {
      renderedElements.push(
        <h1 key={`h1-${i}`} className="text-xl font-bold font-display text-slate-50 mt-5 mb-3 border-b border-slate-800 pb-1">
          {parseInlineElements(trimmedLine.slice(1).trim())}
        </h1>
      );
    }
    // 2. Unordered lists
    else if (trimmedLine.startsWith("-") || trimmedLine.startsWith("*")) {
      renderedElements.push(
        <li key={`li-${i}`} className="ml-5 list-disc text-sm text-slate-300 leading-relaxed py-1">
          {parseInlineElements(trimmedLine.slice(1).trim())}
        </li>
      );
    }
    // 3. Numbered lists
    else if (/^\d+\.\s/.test(trimmedLine)) {
      const match = trimmedLine.match(/^(\d+)\.\s(.*)/);
      const num = match ? match[1] : "1";
      const rest = match ? match[2] : trimmedLine;
      renderedElements.push(
        <div key={`ol-${i}`} className="flex items-start gap-2 text-sm text-slate-300 leading-relaxed py-1 pl-1">
          <span className="font-semibold text-emerald-400 font-mono text-xs mt-0.5 shrink-0 bg-emerald-500/10 rounded px-1">{num}.</span>
          <span>{parseInlineElements(rest)}</span>
        </div>
      );
    }
    // 4. Horizontal rule
    else if (trimmedLine === "---" || trimmedLine === "***") {
      renderedElements.push(
        <hr key={`hr-${i}`} className="my-4 border-slate-800" />
      );
    }
    // 5. Normal paragraphs
    else if (trimmedLine.length > 0) {
      renderedElements.push(
        <p key={`p-${i}`} className="text-sm text-slate-300 leading-relaxed my-2.5 break-words">
          {parseInlineElements(line)}
        </p>
      );
    } else {
      renderedElements.push(<div key={`br-${i}`} className="h-2" />);
    }
  }

  return <div className="space-y-1 w-full max-w-full overflow-hidden text-left">{renderedElements}</div>;
}
