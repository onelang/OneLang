declare namespace one {
    class Console {
        static print(str: any);
    }

    class Array<T> {
        length: number;
        add(item: T);
    }
}
