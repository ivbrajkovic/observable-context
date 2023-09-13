import { Observable } from "class/Observable";
import { useCallback, useEffect, useRef, useState } from "react";

const subscribeManyHookFactory = <T extends Record<string, unknown>>(
  useObservableContext: () => Observable<T>,
) => {
  const useSubscribeMany = <K extends keyof T>(
    keys: K[],
    handler?: (key: K, value: T[K]) => void,
  ) => {
    const observable = useObservableContext();

    const [state, _setState] = useState(() =>
      keys.reduce((acc, key) => {
        acc[key] = observable.observed[key];
        return acc;
      }, {} as Pick<T, K>),
    );

    const handlerRef = useRef(handler);
    useEffect(() => {
      handlerRef.current = handler;
    }, [handler]);

    useEffect(() => {
      return observable.subscribeMany(keys, (key, value) => {
        if (handlerRef.current) handlerRef.current(key as K, value as T[K]);
        else _setState((state) => ({ ...state, [key]: value }));
      });
    }, [keys, observable]);

    const setState = useCallback(
      (updates: {
        [key in K]?: T[key];
      }) =>
        Object.entries(updates).forEach(([key, value]) => {
          observable.observed[key as keyof T] = value as T[keyof T];
        }),
      [observable],
    );

    return { state, setState, observed: observable.observed };
  };

  return useSubscribeMany;
};

export default subscribeManyHookFactory;
