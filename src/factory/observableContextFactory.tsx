import { ReactNode, createContext, useState } from "react";
import observableContextHookFactory from "factory/observableContextHookFactory";
import watchHookFactory from "factory/watchHookFactory";
import watchListHookFactory from "factory/watchListHookFactory";
import watchAllHookFactory from "factory/watchAllHookFactory";
import { Observable } from "../class/Observable";
import { Subject } from "../class/types";

export type ObservableContext<T extends Subject> = Observable<T> | null;

type ContextProviderProps<T> = {
  initial: T | (() => T);
  children: ReactNode;
};

export function observableContextFactory<T extends Subject>(
  name = "ObservableContextProvider",
) {
  const ObservableContext = createContext<ObservableContext<T>>(null);

  function ContextProvider(props: ContextProviderProps<T>) {
    const [observable] = useState<Observable<T>>(
      () =>
        new Observable(
          typeof props.initial === "function" //
            ? props.initial()
            : props.initial,
        ),
    );

    return (
      <ObservableContext.Provider value={observable}>
        {props.children}
      </ObservableContext.Provider>
    );
  }

  const useObservableContext = observableContextHookFactory(
    name,
    ObservableContext,
  );
  const useWatch = watchHookFactory(useObservableContext);
  const useWatchList = watchListHookFactory(useObservableContext);
  const useWatchAll = watchAllHookFactory(useObservableContext);

  return {
    ContextProvider,
    useObservableContext,
    useWatch,
    useWatchList,
    useWatchAll,
  };
}
