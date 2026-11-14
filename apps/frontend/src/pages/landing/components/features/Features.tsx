const FEATURES = [
    {
        title: "Trace the full chain",
        body: "Prerequisites of prerequisites are included, so you see the real number of courses ahead of a goal.",
    },
    {
        title: "Track what’s done",
        body: "Mark courses complete and the ones you can take next turn amber right away.",
    },
    {
        title: "See what each course opens",
        body: "Check which later courses depend on the one you’re considering before you commit.",
    },
];

export function Features() {
    return (
        <section className="pv-sec" id="how">
            <h2>Plan your term without reading a catalog.</h2>
            <div className="pv-three">
                {FEATURES.map((f) => (
                    <div key={f.title}>
                        <h3>{f.title}</h3>
                        <p>{f.body}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}