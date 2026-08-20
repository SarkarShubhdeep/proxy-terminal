export interface NanoBuffer {
  lines: string[];
  row: number;
  col: number;
  scrollRow: number;
  scrollCol: number;
}

export function createBuffer(content: string): NanoBuffer {
  return {
    lines: content.split("\n"),
    row: 0,
    col: 0,
    scrollRow: 0,
    scrollCol: 0,
  };
}

export function bufferText(buffer: NanoBuffer): string {
  return buffer.lines.join("\n");
}

function clampCol(buffer: NanoBuffer): void {
  const line = buffer.lines[buffer.row] ?? "";
  buffer.col = Math.min(buffer.col, line.length);
}

export function insertText(buffer: NanoBuffer, text: string): void {
  const parts = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const line = buffer.lines[buffer.row] ?? "";
  const before = line.slice(0, buffer.col);
  const after = line.slice(buffer.col);

  buffer.lines[buffer.row] = before + parts[0];
  if (parts.length === 1) {
    buffer.lines[buffer.row] += after;
    buffer.col += parts[0].length;
    return;
  }

  const last = parts[parts.length - 1] + after;
  buffer.lines.splice(buffer.row + 1, 0, ...parts.slice(1, -1), last);
  buffer.row += parts.length - 1;
  buffer.col = parts[parts.length - 1].length;
}

export function backspace(buffer: NanoBuffer): void {
  if (buffer.col > 0) {
    const line = buffer.lines[buffer.row];
    buffer.lines[buffer.row] =
      line.slice(0, buffer.col - 1) + line.slice(buffer.col);
    buffer.col -= 1;
    return;
  }
  if (buffer.row === 0) return;
  const current = buffer.lines[buffer.row];
  const prev = buffer.lines[buffer.row - 1];
  buffer.col = prev.length;
  buffer.lines[buffer.row - 1] = prev + current;
  buffer.lines.splice(buffer.row, 1);
  buffer.row -= 1;
}

export function deleteForward(buffer: NanoBuffer): void {
  const line = buffer.lines[buffer.row];
  if (buffer.col < line.length) {
    buffer.lines[buffer.row] =
      line.slice(0, buffer.col) + line.slice(buffer.col + 1);
    return;
  }
  if (buffer.row >= buffer.lines.length - 1) return;
  buffer.lines[buffer.row] = line + buffer.lines[buffer.row + 1];
  buffer.lines.splice(buffer.row + 1, 1);
}

export function moveLeft(buffer: NanoBuffer): void {
  if (buffer.col > 0) {
    buffer.col -= 1;
    return;
  }
  if (buffer.row === 0) return;
  buffer.row -= 1;
  buffer.col = buffer.lines[buffer.row].length;
}

export function moveRight(buffer: NanoBuffer): void {
  const line = buffer.lines[buffer.row];
  if (buffer.col < line.length) {
    buffer.col += 1;
    return;
  }
  if (buffer.row >= buffer.lines.length - 1) return;
  buffer.row += 1;
  buffer.col = 0;
}

export function moveUp(buffer: NanoBuffer): void {
  if (buffer.row === 0) return;
  buffer.row -= 1;
  clampCol(buffer);
}

export function moveDown(buffer: NanoBuffer): void {
  if (buffer.row >= buffer.lines.length - 1) return;
  buffer.row += 1;
  clampCol(buffer);
}

export function moveHome(buffer: NanoBuffer): void {
  buffer.col = 0;
}

export function moveEnd(buffer: NanoBuffer): void {
  buffer.col = buffer.lines[buffer.row].length;
}

export function pageUp(buffer: NanoBuffer, page: number): void {
  buffer.row = Math.max(0, buffer.row - Math.max(1, page));
  clampCol(buffer);
}

export function pageDown(buffer: NanoBuffer, page: number): void {
  buffer.row = Math.min(
    buffer.lines.length - 1,
    buffer.row + Math.max(1, page),
  );
  clampCol(buffer);
}

export function cutLine(buffer: NanoBuffer): string {
  const line = buffer.lines[buffer.row];
  if (buffer.lines.length === 1) {
    buffer.lines[0] = "";
    buffer.col = 0;
    return `${line}\n`;
  }
  buffer.lines.splice(buffer.row, 1);
  if (buffer.row >= buffer.lines.length) {
    buffer.row = buffer.lines.length - 1;
  }
  clampCol(buffer);
  return `${line}\n`;
}

export function ensureVisible(
  buffer: NanoBuffer,
  viewRows: number,
  viewCols: number,
): void {
  const rows = Math.max(1, viewRows);
  const cols = Math.max(1, viewCols);
  if (buffer.row < buffer.scrollRow) buffer.scrollRow = buffer.row;
  if (buffer.row >= buffer.scrollRow + rows) {
    buffer.scrollRow = buffer.row - rows + 1;
  }
  if (buffer.col < buffer.scrollCol) buffer.scrollCol = buffer.col;
  if (buffer.col >= buffer.scrollCol + cols) {
    buffer.scrollCol = buffer.col - cols + 1;
  }
}
