import { useLayoutEffect, useRef, useState } from 'react';
import { indentLines, insertIndentedLine, removeIndent, type TextEdit } from '../../../services/textIndent.ts';

type Props = {
    id: string;
    value: string;
    describedBy: string;
    onChange: (value: string) => void;
};

/** Plain-text editing with predictable indentation and keyboard undo. */
export function PathTextEditor({ id, value, describedBy, onChange }: Props) {
    const textarea = useRef<HTMLTextAreaElement>(null);
    const pending = useRef<(TextEdit & { top: number; left: number }) | null>(null);
    const knownValue = useRef(value);
    const undo = useRef<TextEdit[]>([]);
    const redo = useRef<TextEdit[]>([]);
    const beforeInput = useRef<TextEdit | null>(null);
    const escapeTab = useRef(false);
    const [revision, setRevision] = useState(0);

    useLayoutEffect(() => {
        if (knownValue.current !== value) {
            // Applying, cancelling, or loading another path starts a fresh edit history.
            undo.current = [];
            redo.current = [];
            pending.current = null;
            knownValue.current = value;
        }
        if (pending.current && textarea.current) {
            const next = pending.current;
            textarea.current.setSelectionRange(next.start, next.end);
            textarea.current.scrollTop = next.top;
            textarea.current.scrollLeft = next.left;
            pending.current = null;
        }
    }, [value, revision]);

    function snapshot(): TextEdit {
        return { text: value, start: textarea.current?.selectionStart ?? 0, end: textarea.current?.selectionEnd ?? 0 };
    }

    function apply(edit: TextEdit, remember = true) {
        if (remember) {
            undo.current.push(snapshot());
            if (undo.current.length > 200) undo.current.shift();
            redo.current = [];
        }
        pending.current = { ...edit, top: textarea.current?.scrollTop ?? 0, left: textarea.current?.scrollLeft ?? 0 };
        knownValue.current = edit.text;
        onChange(edit.text);
        setRevision((current) => current + 1);
    }

    return <textarea ref={textarea} id={id} value={value} spellCheck={false} wrap="off"
        aria-describedby={describedBy} placeholder={'First step:\n  Next step: First step'}
        onBeforeInput={() => { beforeInput.current = snapshot(); }}
        onBlur={() => { escapeTab.current = false; }}
        onChange={(event) => {
            undo.current.push(beforeInput.current ?? snapshot());
            beforeInput.current = null;
            if (undo.current.length > 200) undo.current.shift();
            redo.current = [];
            knownValue.current = event.target.value;
            onChange(event.target.value);
        }}
        onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            const key = event.key.toLowerCase();
            if ((event.ctrlKey || event.metaKey) && !event.altKey && (key === 'z' || key === 'y')) {
                event.preventDefault();
                const isRedo = key === 'y' || event.shiftKey;
                const from = isRedo ? redo.current : undo.current;
                const to = isRedo ? undo.current : redo.current;
                const previous = from.pop();
                if (previous) { to.push(snapshot()); apply(previous, false); }
                return;
            }
            if (event.key === 'Escape') {
                // Let keyboard users leave the textarea without trapping Tab.
                escapeTab.current = true;
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            if (event.key === 'Tab' && escapeTab.current) { escapeTab.current = false; return; }
            escapeTab.current = false;
            if (event.ctrlKey || event.metaKey || event.altKey) return;
            const { selectionStart: start, selectionEnd: end } = event.currentTarget;
            if (event.key === 'Tab') {
                event.preventDefault();
                apply(indentLines(value, start, end, event.shiftKey));
            } else if (event.key === 'Enter') {
                event.preventDefault();
                apply(insertIndentedLine(value, start, end));
            } else if (event.key === 'Backspace') {
                const edit = removeIndent(value, start, end);
                if (edit) { event.preventDefault(); apply(edit); }
            }
        }} />;
}
