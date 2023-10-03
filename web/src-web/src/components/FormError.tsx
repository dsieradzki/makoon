import React from 'react';

type Props = {
    error: string | undefined,
    touched: boolean | undefined
}

const FormError = (props: Props) => {
    return (
        <div className="h-[20px] italic text-sm">
            {props.error && props.touched && <div className="p-error">{props.error}</div>}
        </div>
    );
};

export default FormError;