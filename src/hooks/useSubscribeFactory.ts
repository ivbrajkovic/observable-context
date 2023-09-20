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

    const [state, _setState] = useState(() => observable.proxy[key]);
    const handlerRef = useRef(handler ?? _setState);

    useEffect(() => {
      handlerRef.current = handler ?? _setState;
    }, [handler]);

    useEffect(() => {
      return observable.subscribe(key, (_, value) => handlerRef.current(value));
    }, [key, observable]);

    const setState = useCallback(
      (value: T[K]) => (observable.proxy[key] = value),
      [key, observable],
    );

    return { state, setState, proxy: observable.proxy };
  };

  return useSubscribe;
};

export default subscribeHookFactory;
