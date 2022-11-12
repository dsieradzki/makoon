import React, { useState } from 'react';

type Props = {
    password: string
}
const HiddenPassword = (props: Props) => {
    const [show, setShow] = useState(false)

    if (show) {
        return <span>{props.password}</span>
    } else {
        return <span
            className="primary-text-color cursor-pointer"
            onClick={() => {
                setShow(true)
            }}>
            show
        </span>
    }
};

export default HiddenPassword;