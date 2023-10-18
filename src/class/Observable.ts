import { Handler, Subject, SubscriberData } from "class/types";

export class Observable<T extends Subject> {
  #proxy: T;
  #listeners = new Map<keyof T, Set<Handler<T>>>();
  #allHandlers = new Set<Handler<T>>();

  #isBatching = false;
  #batchedUpdates = new Map<keyof T, T[keyof T]>();

  onWatch: ((key: keyof T, handler: Handler<T>) => void) | null = null;
  onUnwatch: ((key: keyof T, handler: Handler<T>) => void) | null = null;
  onWatchAll: ((handler: Handler<T>) => void) | null = null;
  onUnwatchAll: ((handler: Handler<T>) => void) | null = null;

  constructor(subject: T) {
    this.#proxy = this.#createProxy(subject);
  }

  #createProxy(subject: T) {
    return new Proxy(subject, {
      set: (target, property, newValue: T[keyof T], receiver) => {
        // Allow only property keys of type string
        if (typeof property !== "string") return false;

        // Get property from observed object (target)
        const reflectValue = Reflect.get(target, property, receiver);

        // Do not update property if old and new value are equal
        if (Object.is(newValue, reflectValue)) return true;

        // Update property
        const success = Reflect.set(target, property, newValue, receiver);
        if (!success) return false;

        // Notify listeners
        this.#notify(property, newValue);

        return true;
      },
    });
  }

  get proxy() {
    return this.#proxy;
  }

  // Notify ---------------------------------------------------------------

  #notify<U extends keyof T>(key: U, value: T[U]) {
    this.#isBatching
      ? this.#batchUpdate(key, value)
      : this.#notifyImmediate(key, value);
  }

  #notifyImmediate(key: keyof T, value: T[keyof T]) {
    const invokeHandler = (handler: Handler<T>) =>
      handler({ [key]: value } as Record<keyof T, T[keyof T]>);
    this.#listeners.get(key)?.forEach(invokeHandler);
    this.#allHandlers.forEach(invokeHandler);
  }

  // Batched updates ------------------------------------------------------

  #batchUpdate<U extends keyof T>(key: U, value: T[U]) {
    this.#batchedUpdates.set(key, value);
  }

  #processBatchedUpdates() {
    const aggregatedChangesByHandler = new Map<
      Handler<T>,
      Record<keyof T, T[keyof T]>
    >();

    // Aggregate changes by listener
    this.#batchedUpdates.forEach((value, key) => {
      const aggregateForHandler = (handler: Handler<T>) => {
        const currentChanges =
          aggregatedChangesByHandler.get(handler) ||
          ({} as Record<keyof T, T[keyof T]>);

        currentChanges[key] = value;
        aggregatedChangesByHandler.set(handler, currentChanges);
      };

      // Aggregate changes for listeners subscribed to the specific key
      this.#listeners.get(key)?.forEach(aggregateForHandler);

      // Aggregate changes for watchAll handlers
      this.#allHandlers.forEach(aggregateForHandler);
    });

    // Notify each listener with their aggregated changes
    aggregatedChangesByHandler.forEach((changes, handler) => {
      handler(changes);
    });

    // Clear batched updates
    this.#batchedUpdates.clear();
  }

  beginBatchUpdate = () => {
    this.#isBatching = true;
  };

  endBatchUpdate = () => {
    this.#isBatching = false;
    this.#processBatchedUpdates();
  };

  // Watchers -------------------------------------------------------------

  resetWatchers = () => {
    this.#listeners.clear();
    this.#allHandlers.clear();
  };

  #unwatch<K extends keyof T>(key: keyof T, handler: Handler<T, K>) {
    this.#listeners.get(key)?.delete(handler);
    if (this.#listeners.get(key)?.size === 0) this.#listeners.delete(key);
    this.onUnwatch?.(key, handler);
  }

  watch<K extends keyof T>(key: K, handler: Handler<T, K>) {
    if (!this.#listeners.has(key)) this.#listeners.set(key, new Set());
    this.#listeners.get(key)?.add(handler);
    this.onWatch?.(key, handler);
    return () => {
      this.#unwatch(key, handler);
    };
  }

  watchList<K extends keyof T>(keys: Array<K>, handler: Handler<T, K>) {
    keys.forEach((key) => this.watch(key, handler));
    return () => {
      keys.forEach((key) => this.#unwatch(key, handler));
    };
  }

  #unwatchAll(handler: Handler<T>) {
    this.#allHandlers.delete(handler);
    this.onUnwatchAll?.(handler);
  }

  watchAll(handler: Handler<T, keyof T>) {
    this.#allHandlers.add(handler);
    this.onWatchAll?.(handler);
    return () => {
      this.#unwatchAll(handler);
    };
  }

  // Count watchers -------------------------------------------------------

  watchersCount = () => {
    return this.#listeners.size + this.#allHandlers.size;
  };

  watchersCountFor = (key: keyof T) => {
    return this.#listeners.get(key)?.size ?? 0;
  };

  watchersCountForAllKeys = () => {
    return Array.from(this.#listeners.values()).reduce(
      (acc, handlers) => acc + handlers.size,
      0,
    );
  };

  watchersAllCount = () => {
    return this.#allHandlers.size;
  };

  // Print watchers -------------------------------------------------------

  printWatchers = (output = true) => {
    const tableData: SubscriberData[] = [];

    this.#listeners?.forEach((handlers, key) => {
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
  };
}
