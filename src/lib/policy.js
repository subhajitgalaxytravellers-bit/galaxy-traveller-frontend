import { marked } from "marked";

export function parsePolicy(markdown) {
  const tokens = marked.lexer(markdown);

  const sections = [];
  let current = null;

  tokens.forEach((token) => {
    if (token.type === "heading" && token.depth === 2) {
      if (current) sections.push(current);

      current = {
        title: token.text,
        paragraphs: [],
        list: [],
      };
    }

    if (!current) return;

    if (token.type === "paragraph") {
      current.paragraphs.push(token.text);
    }

    if (token.type === "list") {
      current.list.push(...token.items.map((i) => i.text));
    }
  });

  if (current) sections.push(current);

  return sections;
}
