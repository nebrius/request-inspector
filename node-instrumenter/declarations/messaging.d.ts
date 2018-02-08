import { IMeasurementEvent } from './common/common';
export declare function init(newHostname: string, newPort: number, serviceName: string, cb: (err: Error | undefined) => void): void;
export declare function getServiceId(): string;
export declare function storeEvent(event: IMeasurementEvent): void;
