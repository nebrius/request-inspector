import { IMeasurementEvent } from './common/common';
export declare function init(cb: (err: Error | undefined) => void): void;
export declare function isInRequestContext(): boolean;
export declare function begin(type: string, details?: {
    [key: string]: any;
}): IMeasurementEvent;
export declare function end(event: IMeasurementEvent, details?: {
    [key: string]: any;
}): void;
