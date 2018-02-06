export { IMeasurementEvent } from './common/common';
export { isInRequestContext, begin, end } from './event';
export interface IOptions {
    serverHostname: string;
    serverPort: number;
}
export declare function init({serverHostname, serverPort}: IOptions, cb: (err: Error | undefined) => void): void;
