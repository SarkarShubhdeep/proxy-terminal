type QuoteChar = '"' | "'";

export function parseCommand(input: string): string[] {
  const args: string[] = [];
  let current = "";
  let quote: QuoteChar | null = null;

  for (const char of input) {
    if (quote) {
      if (char === quote) quote = null;
      else current += char;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
    } else if (char === " " || char === "\t") {
      if (current) {
        args.push(current);
        current = "";
      }
    } else {
      current += char;
    }
  }

  if (current) args.push(current);

  return args;
}
