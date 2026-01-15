import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import React from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ParsedLink {
  text: string;
  url: string;
  isLink: boolean;
}

export function parseLinks(text: string): ParsedLink[] {
  // Format: [[text]]{{url}}
  // Use negated character classes to prevent catastrophic backtracking
  // [[...]] captures any text without a closing bracket; {{...}} captures until closing brace
  // Bounded quantifiers prevent ReDoS attacks
  const linkRegex = /\[\[([^\]]{0,500})\]\]\{\{([^}]{0,2000})\}\}/g;
  const parts: ParsedLink[] = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push({
        text: text.slice(lastIndex, match.index),
        url: "",
        isLink: false,
      });
    }

    // Add the link
    parts.push({
      text: match[1],
      url: match[2],
      isLink: true,
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      text: text.slice(lastIndex),
      url: "",
      isLink: false,
    });
  }

  return parts;
}

export function formatTextWithLinks(
  text: string,
  color: string = "#ADD8E6"
): React.ReactNode[] {
  const parts = parseLinks(text);
  return parts.map((part, index) => {
    if (part.isLink) {
      return React.createElement(
        "a",
        {
          key: `link-${part.url}-${part.text}-${index}`,
          href: part.url,
          target: "_blank",
          rel: "noopener noreferrer",
          className: `text-${color} hover:text-${color} hover:underline`,
        },
        part.text
      );
    }
    return React.createElement("span", { key: `text-${part.text}-${index}` }, part.text);
  });
}
