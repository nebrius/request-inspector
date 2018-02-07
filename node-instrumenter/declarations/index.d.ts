export { IMeasurementEvent } from './common/common';
export { isInRequestContext, begin, end } from './event';
export interface IOptions {
    serverHostname: string;
    serverPort: number;
    serviceName: string;
}
export declare type Callback = (err: Error | undefined) => void;
export declare function init(options: IOptions, cb?: Callback): void;
