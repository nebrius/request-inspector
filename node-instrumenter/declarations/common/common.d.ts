export interface IMeasurementEvent {
    eventId: string;
    requestId: string;
    serviceId: string;
    type: string;
    start: number;
    end: number;
    details: {
        [key: string]: any;
    };
}
export interface IService {
    serviceId: string;
    serviceName: string;
}
export declare const EVENT_NAMES: {
    NODE_HTTP_SERVER_REQUEST: string;
    BROWSER_HTTP_CLIENT_REQUEST: string;
};
export declare const HEADER_NAME = "x-request-inspector-request-ID";
