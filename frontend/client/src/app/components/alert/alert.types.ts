export type AlertAppearance =
    | 'border'
    | 'fill'
    | 'outline'
    | 'soft';

export type AlertType =
    | 'primary'
    | 'accent'
    | 'warn'
    | 'basic'
    | 'info'
    | 'success'
    | 'warning'
    | 'error';

export class Alert {

    id: string;

    message: string;

    appearance: AlertAppearance;

    type: AlertType;

    timestamp: number;

    constructor(message: string, type: AlertType = 'success', appearance: AlertAppearance = 'fill') {
        this.id = this.#generateUUID();
        this.message = message;
        this.appearance = appearance;
        this.type = type;
        this.timestamp = Date.now();
    }

    #generateUUID() {
        let dt = new Date().getTime();
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (dt + Math.random() * 16) % 16 | 0;
            dt = Math.floor(dt / 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    }

}