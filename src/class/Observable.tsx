export type Handler<T, K extends keyof T = keyof T> = (
  key: K,
  value: T[K],
) => void;

export type Subscriber = <T>(key: keyof T, handler: Handler<T>) => void;

export type SubscriberData = {
  key: string;
  handler: string;
  details: string;
};

export class Observable<T extends Record<string, unknown>> {
  #subjectProxy: T;
  #keys: Array<keyof T>;
  #handlers: Map<keyof T, Set<Handler<T>>> | null = null;
  #allHandlers: Set<Handler<T>> | null = null;

  onSubscribe: Subscriber | null = null;
  onUnsubscribe: Subscriber | null = null;

  constructor(subject: T) {
    this.#keys = Object.keys(subject) as Array<keyof T>;

    this.#subjectProxy = new Proxy(subject, {
      set: (target, property, newValue: T[keyof T], receiver) => {
        // Property must be of type string
        if (typeof property !== "string") return false;

        // Get property from observed object (target)
        const reflectValue = Reflect.get(target, property, receiver);

        // Do not update property if old and new value are equal
        if (newValue === reflectValue) return true;

        // Update property
        const success = Reflect.set(target, property, newValue, receiver);
        if (!success) return false;

        const invokeHandler = (handler: Handler<T>) =>
          handler(property, newValue);

        // Notify listeners
        this.#handlers?.get(property)?.forEach(invokeHandler);

        // Notify global listeners
        this.#allHandlers?.forEach(invokeHandler);

        return true;
      },
    });
  }

  get observed() {
    return this.#subjectProxy as T;
  }

  subscribe<K extends keyof T>(key: K, handler: Handler<T, K>) {
    this.#handlers ??= new Map();
    const handlers = this.#handlers.get(key) ?? new Set();
    handlers.add(handler as Handler<T>);
    this.#handlers.set(key, handlers);
    this.onSubscribe?.(key, handler as Handler<T>);
    return () => {
      this.unsubscribe(key, handler);
    };
  }

  subscribeMany<K extends keyof T>(keys: Array<K>, handler: Handler<T>) {
    keys.forEach((key) => this.subscribe(key, handler));
    return () => keys.forEach((key) => this.unsubscribe(key, handler));
  }

  subscribeAll(handler: Handler<T>) {
    this.#allHandlers ??= new Set();
    this.#allHandlers.add(handler);
    this.onSubscribe?.("All", handler as Handler<T>);
    return () => {
      this.#allHandlers?.delete(handler);
      this.onUnsubscribe?.("All", handler as Handler<T>);
    };
  }

  unsubscribe<K extends keyof T>(key: K, handler: Handler<T, K>) {
    if (!this.#handlers) return;
    this.#handlers.get(key)?.delete(handler as Handler<T>);
    if (!this.#handlers.get(key)?.size) this.#handlers.delete(key);
    this.onUnsubscribe?.(key, handler as Handler<T>);
  }

  unsubscribeAll() {
    this.#handlers?.clear();
    this.#allHandlers?.clear();
  }

  subscriberCount(key: keyof T) {
    return this.#handlers?.get(key)?.size ?? 0;
  }

  subscriberAllCount() {
    if (!this.#handlers) return 0;
    return Array.from(this.#handlers.values()).reduce(
      (acc, handlers) => acc + handlers.size,
      0,
    );
  }

  printSubscribers(output = false) {
    const tableData: SubscriberData[] = [];

    this.#handlers?.forEach((handlers, key) => {
      let index = 0;
      handlers.forEach((handler) =>
        tableData.push({
          key: String(key),
          handler: handler.name || `Anonymous #${index++}`,
          details: handler.toString().substring(0, 100) + "...",
        }),
      );
    });

    this.#allHandlers?.forEach((handler) => {
      let index = 0;
      tableData.push({
        key: "All",
        handler: handler.name || `Anonymous #${index++}`,
        details: handler.toString().substring(0, 100) + "...",
      });
    });

    if (output) console.table(tableData);
    return tableData.length ? tableData : "No subscribers";
  }

  printObservedValues(output = false) {
    const observedValues = Array.from(this.#keys).map((key) => ({
      Property: key,
      Value: this.#subjectProxy[key],
    }));

    if (output) console.table(observedValues);
    return observedValues.length ? observedValues : "No observed values";
  }
}
