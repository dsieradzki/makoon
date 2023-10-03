import React, { useState } from 'react';
import {Button} from "primereact/button";

type Props = {
    password: string
}
const HiddenPassword = (props: Props) => {
    const [show, setShow] = useState(false)

    if (show) {
        return <span>{props.password}</span>
    } else {

        return <span
            className="text-primary cursor-pointer hover:underline"
            onClick={() => {
                setShow(true)
            }}>
            show
        </span>
    }
};

export default HiddenPassword;