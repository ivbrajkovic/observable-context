import { Observable } from "class/Observable";
import { useCallback, useEffect, useRef, useState } from "react";

const subscribeHookFactory = <T extends Record<string, unknown>>(
  useObservableContext: () => Observable<T>,
) => {
  const useSubscribe = <K extends keyof T>(
    key: K,
    handler?: (value: T[K]) => void,
  ) => {
    const observable = useObservableContext();

    const [state, setState] = useState(() => observable.observed[key]);
    const handlerRef = useRef(handler ?? setState);

    useEffect(() => {
      handlerRef.current = handler ?? setState;
    }, [handler]);

    useEffect(() => {
      return observable.subscribe(key, (_, value) => handlerRef.current(value));
    }, [key, observable]);

    const setValue = useCallback(
      (value: T[K]) => (observable.observed[key] = value),
      [key, observable],
    );

    return [state, setValue, observable.observed] as const;
  };

  return useSubscribe;
};

export default subscribeHookFactory;
