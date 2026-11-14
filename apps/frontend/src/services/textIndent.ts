export type TextEdit = { text: string; start: number; end: number };

/** Indent/outdent whole selected lines; a selection ending at a line start excludes that line. */
export function indentLines(text: string, start: number, end: number, outdent = false): TextEdit {
    const first = start === 0 ? 0 : text.lastIndexOf('\n', start - 1) + 1;
    const lastPosition = end > start && text[end - 1] === '\n' ? end - 1 : end;
    const newline = text.indexOf('\n', lastPosition);
    const last = newline < 0 ? text.length : newline;
    const lines = text.slice(first, last).split('\n');
    let offset = first;
    const changes = lines.map((line) => {
        const count = outdent ? (line.startsWith('\t') ? 1 : Math.min(2, line.match(/^ */)![0].length)) : 0;
        const change = { offset, removed: count, inserted: outdent ? '' : '  ' };
        offset += line.length + 1;
        return change;
    });
    function position(pos: number) {
        let delta = 0;
        for (const change of changes) {
            if (pos < change.offset) break;
            delta += change.inserted.length - Math.min(change.removed, pos - change.offset);
        }
        return pos + delta;
    }
    return {
        text: text.slice(0, first) + lines.map((line, index) => changes[index].inserted + line.slice(changes[index].removed)).join('\n') + text.slice(last),
        start: position(start), end: position(end),
    };
}

export function insertIndentedLine(text: string, start: number, end: number): TextEdit {
    const first = start === 0 ? 0 : text.lastIndexOf('\n', start - 1) + 1;
    const indentation = text.slice(first, start).match(/^[\t ]*/)![0];
    const insertion = `\n${indentation}`;
    const cursor = start + insertion.length;
    return { text: text.slice(0, start) + insertion + text.slice(end), start: cursor, end: cursor };
}

export function removeIndent(text: string, start: number, end: number): TextEdit | null {
    if (start !== end || start === 0) return null;
    const first = start === 0 ? 0 : text.lastIndexOf('\n', start - 1) + 1;
    const prefix = text.slice(first, start);
    if (!/^[\t ]+$/.test(prefix)) return null;
    const count = prefix.endsWith('\t') ? 1 : (prefix.length % 2 || 2);
    return { text: text.slice(0, start - count) + text.slice(end), start: start - count, end: start - count };
}

