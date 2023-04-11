import React, { useState } from "react";
import "./Block.css"

type BlockProps = {
    title?: string
    tooltip?: string
    children?: React.ReactNode
    className?: string
    notActive?: boolean
    selected?: boolean
    onClick?: () => void
}

const Block = (props: BlockProps) => {
    const [hover, setHover] = useState(false)
    const blockBorder = () => {
        let cssClassNames: string[] = []
        if (props.selected) {
            cssClassNames.push("selectedBlock")
        }
        if (hover && !props.selected) {
            cssClassNames.push("hoveredBlock")
        }
        if (!hover && !props.selected) {
            cssClassNames.push("defaultBlock")
        }
        return cssClassNames.join(" ")
    }

    return <div
        onMouseOver={() => setHover(true)}
        onMouseOut={() => setHover(false)}
        onClick={event => {
            if (props.onClick && !props.notActive) {
                props.onClick();
            }
        }}
        title={props.tooltip}
        className={`block-container p-3 rounded-xl border-2 cursor-pointer ${blockBorder()} ${props.className}`}>
        {
            props.title &&
            <div className="text-center font-bold">
                <span className={`${props.notActive ? "text-stone-500" : ""}`}>{props.title}</span>
            </div>
        }
        <div className="flex items-center">{props.children}</div>
    </div>
}

export default Block