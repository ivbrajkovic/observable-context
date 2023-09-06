import { Observable } from "class/Observable";
import { useCallback, useEffect, useRef, useState } from "react";

const subscribeAllHookFactory = <T extends Record<string, unknown>>(
  useObservableContext: () => Observable<T>,
) => {
  const useSubscribeAll = (
    handler?: (key: keyof T, value: T[keyof T]) => void,
  ) => {
    const observable = useObservableContext();

    const [state, setState] = useState(() => observable.observed);

    const handlerRef = useRef(handler);
    useEffect(() => {
      handlerRef.current = handler;
    }, [handler]);

    useEffect(() => {
      return observable.subscribeAll((key, value) => {
        if (handlerRef.current) handlerRef.current(key, value);
        else setState((state) => ({ ...state, [key]: value }));
      });
    }, [observable]);

    const setValue = useCallback(
      (updates: Partial<T>) =>
        Object.entries(updates).forEach(([key, value]) => {
          observable.observed[key as keyof T] = value as T[keyof T];
        }),
      [observable],
    );

    return [state, setValue] as const;
  };

  return useSubscribeAll;
};

export default subscribeAllHookFactory;
