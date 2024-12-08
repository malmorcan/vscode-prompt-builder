export interface IncomingMessage {
    command: string;
    [key: string]: any;
}

export interface OutgoingMessage {
    command: string;
    data: any;
}
