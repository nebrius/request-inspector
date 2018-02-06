/// <reference types="node" />
import { IncomingMessage } from 'http';
export declare function init(cb: (err: Error | undefined) => void): void;
export declare function registerRequest(request: IncomingMessage): void;
export declare function getRequestId(): string | undefined;
export declare function getContextPath(): string;
