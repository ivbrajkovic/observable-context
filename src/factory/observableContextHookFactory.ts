import { Subject } from "class/types";
import { ObservableContext } from "index";
import { useContext, Context } from "react";

const observableContextHookFactory =
  <T extends Subject>(
    name: string,
    observableContext: Context<ObservableContext<T>>,
  ) =>
  () => {
    const observable = useContext(observableContext);
    if (observable === null)
      throw new Error(
        `useObservableContext must be used within a ${name} Provider`,
      );

    return observable;
  };

export default observableContextHookFactory;
