type Props = {
    value: string;
    onChange: (value: string) => void;
    onReset: () => void;
};

/** Lets visitors replace the sample curriculum with their own subject tree. */
export function CurriculumEditor({ value, onChange, onReset }: Props) {
    return (
        <section className="pv-sec" id="build">
            <div className="pv-build">
                <div>
                    <h2>Works for any subject tree.</h2>
                    <p className="pv-lede">
                        Write one line per item as <code>Name: prerequisite, prerequisite</code>. The map redraws as you
                        type. Use it for a degree plan, a skill tree, a certification path or a learning roadmap.
                    </p>
                    <button className="pv-btn alt" onClick={onReset}>
                        Restore sample curriculum
                    </button>
                </div>
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    spellCheck={false}
                    aria-label="Course list"
                />
            </div>
        </section>
    );
}