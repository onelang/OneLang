export class ExposedPromise<T> extends Promise<T> {
    resolve: (value?: T | PromiseLike<T>) => void;
    reject: (reason?: any) => void;

    constructor(executor: (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void = null) {
        let resolve, reject;
        
        super((_resolve, _reject) => {
            resolve = _resolve;
            reject = _reject;
            if (executor)
                executor(resolve, reject);
        });

        this.resolve = resolve;
        this.reject = reject;
    }
}