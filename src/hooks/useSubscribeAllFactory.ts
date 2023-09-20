import { Observable } from "class/Observable";
import { useCallback, useEffect, useRef, useState } from "react";

const subscribeAllHookFactory = <T extends Record<string, unknown>>(
  useObservableContext: () => Observable<T>,
) => {
  const useSubscribeAll = (
    handler?: (key: keyof T, value: T[keyof T]) => void,
  ) => {
    const observable = useObservableContext();

    const [state, _setState] = useState(() => observable.proxy);

    const handlerRef = useRef(handler);
    useEffect(() => {
      handlerRef.current = handler;
    }, [handler]);

    useEffect(() => {
      return observable.subscribeAll((key, value) => {
        if (handlerRef.current) handlerRef.current(key, value);
        else _setState((state) => ({ ...state, [key]: value }));
      });
    }, [observable]);

    const setState = useCallback(
      (updates: Partial<T>) =>
        Object.entries(updates).forEach(([key, value]) => {
          observable.proxy[key as keyof T] = value as T[keyof T];
        }),
      [observable],
    );

    return { state, setState, proxy: observable.proxy };
  };

  return useSubscribeAll;
};

export default subscribeAllHookFactory;
