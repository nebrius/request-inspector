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
    HTTP_SERVER_REQUEST: string;
};
