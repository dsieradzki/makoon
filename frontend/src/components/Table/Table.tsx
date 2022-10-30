import React from 'react';
import styles from "./Table.module.scss"
import { ProgressSpinner } from "primereact/progressspinner";

const Header = (props: React.PropsWithChildren) => {
    return <th>{props.children}</th>
}

type ColumnProps = {
    className?: string
    title?: string
} & React.PropsWithChildren

const Column = (props: ColumnProps) => {
    return <td>
        <div className={props.className} title={props.title}>{props.children}</div>
    </td>
}

type RowProps = {
    selected?: boolean
    id?: any
    onClick?: (key: any) => void
} & React.PropsWithChildren

const Row = (props: RowProps) => {

    const onClickHandler = () => {
        props.onClick && props.id && props.onClick(props.id)
    }

    return <tr onClick={onClickHandler}
               className={props.selected ? styles.selected : ""}>{props.children}</tr>
}

const filterComponents = (children: React.ReactNode, targetType: any) => {
    return React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
            if (child.type === targetType) {
                return child
            }
        }
        return null
    })?.filter(e => e != null)
}

type TableProps = {
    length?: number;
    emptyMessage?: React.ReactNode;
    loadingInProgress?: boolean
} & React.PropsWithChildren

const Table = (props: TableProps) => {


    return <>
        <table className={styles.table}>
            <thead>
            <tr>
                {filterComponents(props.children, Header)}
            </tr>
            </thead>
            <tbody>

            {filterComponents(props.children, Row)}
            </tbody>
        </table>
        {
            (!props.loadingInProgress && props.emptyMessage && (props.length != null && props.length == 0)) &&
            <div className="w-full text-2xl text-stone-600 text-center mt-4">{props.emptyMessage}</div>
        }
        {
            props.loadingInProgress && <div className="flex justify-center mt-6">
                <ProgressSpinner style={{width: '50px', height: '50px'}} strokeWidth="8" fill="var(--surface-ground)"/>
            </div>
        }
    </>
}

Table.Header = Header
Table.Column = Column
Table.Row = Row
export default Table;