import React from 'react';

type Props = {
    error: string | undefined,
    touched: boolean | undefined
}

const FormError = (props: Props) => {
    return (
        <div className="h-[24px]">
            {props.error && props.touched && <div className="p-error">{props.error}</div>}
        </div>
    );
};

export default FormError;