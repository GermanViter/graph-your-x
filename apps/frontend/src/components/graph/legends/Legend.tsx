import "./Legend.css";
import { SELECTED_COLOR, STATUS_STYLES } from "../../../constants/constants";
import type { Status } from "../../../types/types";

export function Legend() {
    return (
        <div className="pv-legend ui">
            {(Object.keys(STATUS_STYLES) as Status[]).map((status) => (
                <span key={status}>
                    <i style={{ background: STATUS_STYLES[status].fill, border: `1.5px solid ${STATUS_STYLES[status].stroke}` }} />
                    {STATUS_STYLES[status].label}
                </span>
            ))}
            <span>
                <i style={{ background: "#fff", border: `3px solid ${SELECTED_COLOR}` }} />
                Selected course
            </span>
        </div>
    );
}