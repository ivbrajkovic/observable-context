import { Observable } from "class/Observable";
import { useCallback, useEffect, useRef, useState } from "react";

const watchAllHookFactory =
  <T extends Record<string, unknown>>(
    useObservableContext: () => Observable<T>,
  ) =>
  (handler?: (changes: Partial<T>) => void) => {
    const observable = useObservableContext();
    const [state, internalSetState] = useState(() => observable.proxy);

    const handlerRef = useRef(handler);
    useEffect(() => {
      handlerRef.current = handler;
    }, [handler]);

    useEffect(() => {
      return observable.watchAll((changes) => {
        handlerRef.current
          ? handlerRef.current(changes)
          : internalSetState((state) => ({ ...state, ...changes }));
      });
    }, [observable]);

    const setState = useCallback(
      (updates: Partial<T>) => {
        observable.beginBatchUpdate();
        Object.entries(updates).forEach(([key, value]) => {
          observable.proxy[key as keyof T] = value as T[keyof T];
        }),
          observable.endBatchUpdate();
      },
      [observable],
    );

    return [state, setState] as const;
  };

export default watchAllHookFactory;
