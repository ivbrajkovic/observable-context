import { ReactNode, createContext, useState } from "react";
import { Observable } from "../class/Observable";
import contextHookFactory from "hooks/useObservableContextFactory";
import subscribeHookFactory from "hooks/useSubscribeFactory";
import subscribeManyHookFactory from "hooks/useSubscribeManyFactory";
import subscribeAllHookFactory from "hooks/useSubscribeAllFactory";

export type ObservableContext<T extends Record<string, unknown>> =
  Observable<T> | null;

type ContextProviderProps<T> = {
  initial: T;
  children: ReactNode;
};

export function observableContextFactory<T extends Record<string, unknown>>(
  name = "ContextProvider",
) {
  const ObservableContext = createContext<ObservableContext<T>>(null);

  function ContextProvider(props: ContextProviderProps<T>) {
    const [observable] = useState<Observable<T>>(
      () => new Observable(props.initial),
    );

    return (
      <ObservableContext.Provider value={observable}>
        {props.children}
      </ObservableContext.Provider>
    );
  }

  const useObservableContext = contextHookFactory(name, ObservableContext);
  const useSubscribe = subscribeHookFactory(useObservableContext);
  const useSubscribeMany = subscribeManyHookFactory(useObservableContext);
  const useSubscribeAll = subscribeAllHookFactory(useObservableContext);

  return {
    ContextProvider,
    useObservableContext,
    useSubscribe,
    useSubscribeMany,
    useSubscribeAll,
  };
}
