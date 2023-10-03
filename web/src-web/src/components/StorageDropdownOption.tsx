import React from 'react';
import { AvailableStorage } from "@/api/model";
import { toHumanReadableSize } from "@/utils/size";

const StorageDropdownOption = (option: AvailableStorage) => {
    return <div className="flex items-center">
        <div className="mr-2 font-bold">
            {option.storage}
        </div>
        <div className="ml-2 flex flex-col items-end">
            <div className="flex mb-1">
                <div className="mr-1 text-stone-400 text-sm flex items-center">
                    Available:
                </div>
                <div className="font-bold">
                    {toHumanReadableSize(option.avail)}
                </div>
            </div>
            <div className="flex mb-1">
                <div className="mr-1 text-stone-400 text-sm flex items-center">
                    Used:
                </div>
                <div>
                    {toHumanReadableSize(option.used)}
                </div>
            </div>
            <div className="flex">
                <div className="mr-1 text-stone-400 text-sm flex items-center">
                    Total:
                </div>
                <div>
                    {toHumanReadableSize(option.total)}
                </div>
            </div>
        </div>
    </div>
};

export default StorageDropdownOption;