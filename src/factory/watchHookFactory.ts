import { Observable } from "class/Observable";
import { Subject } from "class/types";
import { useCallback, useEffect, useRef, useState } from "react";

const watchHookFactory =
  <T extends Subject>(useObservableContext: () => Observable<T>) =>
  <K extends keyof T>(key: K, handler?: (value: T[K]) => void) => {
    const observable = useObservableContext();
    const handlerRef = useRef(handler);
    const [state, internalSetState] = useState<T[K]>(
      () => observable.proxy[key],
    );

    useEffect(() => {
      handlerRef.current = handler;
    }, [handler]);

    useEffect(() => {
      return observable.watch(key, (changes) => {
        handlerRef.current
          ? handlerRef.current(changes[key])
          : internalSetState(changes[key]);
      });
    }, [key, observable]);

    const setState = useCallback(
      (value: T[K]) => (observable.proxy[key] = value),
      [key, observable],
    );

    return [state, setState] as const;
  };

export default watchHookFactory;
