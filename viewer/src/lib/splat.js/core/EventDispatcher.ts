class EventDispatcher {
    listeners: { [key: string]: Function[] } = {};

    addEventListener(type: string, listener: Function): void {
        if (this.listeners[type] === undefined) {
            this.listeners[type] = [];
        }
        if (this.listeners[type].indexOf(listener) === -1) {
            this.listeners[type].push(listener);
        }
    }

    hasEventListener(type: string, listener: Function): boolean {
        return this.listeners[type] !== undefined && this.listeners[type].indexOf(listener) !== -1;
    }

    removeEventListener(type: string, listener: Function): void {
        const listenerArray = this.listeners[type];
        if (listenerArray !== undefined) {
            const index = listenerArray.indexOf(listener);
            if (index !== -1) {
                listenerArray.splice(index, 1);
            }
        }
    }

    dispatchEvent(event: { type: string }): void {
        const listenerArray = this.listeners[event.type];
        if (listenerArray !== undefined) {
            const array = listenerArray.slice(0);
            for (let i = 0, l = array.length; i < l; i++) {
                array[i].call(this, event);
            }
        }
    }
}

export { EventDispatcher };
