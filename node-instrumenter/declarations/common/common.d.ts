export interface IMeasurementEvent {
    id: string;
    requestId: string;
    name: string;
    start: number;
    end: number;
    details: {
        [key: string]: any;
    };
}
export declare const EVENT_NAMES: {
    NODE_HTTP_SERVER_REQUEST: string;
    NODE_HTTP_CLIENT_REQUEST: string;
};
export declare const HEADER_NAME = "X-Request-Inspector-Request-ID";
