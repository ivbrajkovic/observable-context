import { Observable } from "class/Observable";
import { ChangesForKeys, Subject } from "class/types";
import { useCallback, useEffect, useRef, useState } from "react";

const watchListHookFactory =
  <T extends Subject>(useObservableContext: () => Observable<T>) =>
  <K extends keyof T>(
    keys: K[],
    handler?: (changes: ChangesForKeys<T, K>) => void,
  ) => {
    const observable = useObservableContext();

    const [state, internalSetState] = useState(() =>
      keys.reduce((acc, key) => {
        acc[key] = observable.proxy[key];
        return acc;
      }, {} as Pick<T, K>),
    );

    const handlerRef = useRef(handler);
    useEffect(() => {
      handlerRef.current = handler;
    }, [handler]);

    const keysStr = keys.join(",");
    useEffect(() => {
      return observable.watchList(keys, (changes) => {
        if (handlerRef.current) handlerRef.current(changes);
        else internalSetState((state) => ({ ...state, ...changes }));
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [keysStr, observable]);

    const setState = useCallback(
      (updates: Partial<ChangesForKeys<T, K>>) => {
        observable.beginBatchUpdate();
        Object.entries(updates).forEach(([key, value]) => {
          observable.proxy[key as keyof T] = value as T[keyof T];
        });
        observable.endBatchUpdate();
      },
      [observable],
    );

    return [state, setState] as const;
  };

export default watchListHookFactory;
