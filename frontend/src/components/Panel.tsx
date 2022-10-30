import React from 'react';

const collapsedContentStyle = {
    backgroundColor: "var(--surface-card)",
    borderColor: "#292524",
    borderWidth: "2px",
    borderRadius: "15px",
    padding: "15px"
}

type Props = {
   className?: string
} & React.PropsWithChildren
const Panel = (props: Props) => {
    return <div className={`grow mr-4 ${props.className}`} style={collapsedContentStyle}>
        {props.children}
    </div>
};

export default Panel;