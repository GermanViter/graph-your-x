import type { ReactNode } from "react";
import "./PageHeader.css";

interface PageHeaderProps {
    title: string;
    buttonText?: string;
    onButtonClick?: () => void;
    customAction?: ReactNode;
}


export default function PageHeader({ title, buttonText, onButtonClick, customAction }: PageHeaderProps) {

    return (

        <div className="page-header">

            <h2 className="page-header-title">{title}</h2>


            <div className="page-header-actions">
                {customAction && (
                    <div className="page-header-custom">
                        {customAction}
                    </div>
                )}

                {buttonText && (
                    <button
                        className="page-header-btn"
                        onClick={onButtonClick}
                    >
                        {buttonText}
                    </button>
                )}
            </div>
        </div>
    );
}