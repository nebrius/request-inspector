import { IMeasurementEvent } from './common/common';
export declare function isInRequestContext(): boolean;
export declare function begin(name: string, details?: {
    [key: string]: any;
}): IMeasurementEvent;
export declare function end(event: IMeasurementEvent, details?: {
    [key: string]: any;
}): void;
