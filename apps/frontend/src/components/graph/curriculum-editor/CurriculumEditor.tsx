import './CurriculumEditor.css';

type Props = {
    value: string;
    onChange: (value: string) => void;
    onReset: () => void;
};

/** Text box for the "Name: prerequisite, prerequisite" format. */
export function CurriculumEditor({ value, onChange, onReset }: Props) {
    return (
        <div className="pv-editor">
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                spellCheck={false}
                aria-label="Course list"
            />
            <button className="pv-btn alt" onClick={onReset}>
                Restore sample curriculum
            </button>
        </div>
    );
}