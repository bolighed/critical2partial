

export function delay(timeout: number = 0) {
    return new Promise((res) => {
        setTimeout(() => {
            res();
        }, timeout);
    })
}
