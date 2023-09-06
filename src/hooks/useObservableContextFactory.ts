import { ObservableContext } from "index";
import { useContext, Context } from "react";

const contextHookFactory = <T extends Record<string, unknown>>(
  name: string,
  observableContext: Context<ObservableContext<T>>,
) => {
  const useObservableContext = () => {
    const observable = useContext(observableContext);
    if (observable === null)
      throw new Error(`useObservableContext must be used within a ${name}`);
    return observable;
  };

  return useObservableContext;
};

export default contextHookFactory;
