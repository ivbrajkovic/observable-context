import { Observable, SubscriberData } from "class/Observable";
import { cloneDeep } from "lodash-es";
import { ElementRef, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import classes from "components/ObservableTracker/ObservableTracker.module.css";

type WithEventListeners = {
  addEventListener: (type: string, listener: EventListener) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
};

function hasEventListeners(obj: unknown): obj is WithEventListeners {
  return typeof obj === "object" && obj !== null && "addEventListener" in obj;
}

function elementToObject(el: HTMLInputElement) {
  return {
    tagName: el.tagName,
    id: el.id,
    type: el.type,
    name: el.name,
    value: el.value,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseObject(obj: Record<string, any>) {
  for (const p in obj) {
    // eslint-disable-next-line no-prototype-builtins
    if (obj.hasOwnProperty(p)) {
      if (hasEventListeners(obj[p])) {
        obj[p] = elementToObject(obj[p]);
      } else if (typeof obj[p] === "object") {
        obj[p] = parseObject(obj[p]);
      }
    }
  }
  return obj;
}

function ObservableTracker<T extends Record<string, unknown>>({
  hasElement,
  useObservableContext,
}: {
  hasElement?: boolean;
  useObservableContext: () => Observable<T>;
}) {
  const observable = useObservableContext();

  const observableTrackerRef = useRef<ElementRef<"article">>(null);
  const observableTrackerHeaderRef = useRef<ElementRef<"header">>(null);

  const [state, setState] = useState(() => {
    return cloneDeep(observable.observed);
  });
  const [subscribers, setSubscribers] = useState<SubscriberData[]>([]);

  useEffect(() => {
    const getSubscribers = () => {
      const sub = observable.printSubscribers();
      if (Array.isArray(sub)) setSubscribers(sub);
    };

    observable.onSubscribe = getSubscribers;
    observable.onUnsubscribe = getSubscribers;
  }, [observable]);

  useEffect(() => {
    const subscription = observable.subscribeAll(() => {
      setState(cloneDeep(observable.observed));
    });
    return subscription;
  }, [observable]);

  // const [elements] = useState<Set<Element>>(() => new Set());
  useEffect(() => {
    if (!hasElement) return;
    const handleChange = () => setState(cloneDeep(observable.observed));
    const elements = new Set<WithEventListeners>();
    const deepForEach = (obj: Record<string, unknown>) => {
      for (const p in obj) {
        // eslint-disable-next-line no-prototype-builtins
        if (obj.hasOwnProperty(p)) {
          const element = obj[p];
          if (hasEventListeners(element)) {
            elements.add(element);
            element.addEventListener("input", handleChange);
          } else if (typeof element === "object" && element !== null) {
            deepForEach(element as Record<string, unknown>);
          }
        }
      }
    };
    deepForEach(observable.observed);
    return () => {
      elements.forEach((element) => {
        element.removeEventListener("input", handleChange);
      });
    };
  }, [hasElement, observable.observed]);

  useEffect(() => {
    if (!observableTrackerRef.current) return;
    if (!observableTrackerHeaderRef.current) return;

    const observableTracker = observableTrackerRef.current;
    const observableTrackerHeader = observableTrackerHeaderRef.current;

    let pos1 = 0,
      pos2 = 0,
      pos3 = 0,
      pos4 = 0;

    observableTrackerHeader.onmousedown = dragMouseDown;

    function dragMouseDown(e: MouseEvent) {
      e.preventDefault();
      // get the mouse cursor position at startup:
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      // call a function whenever the cursor moves:
      document.onmousemove = elementDrag;
    }

    function elementDrag(e: MouseEvent) {
      e.preventDefault();
      // calculate the new cursor position:
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      // set the element's new position:
      observableTracker.style.top = observableTracker.offsetTop - pos2 + "px";
      observableTracker.style.left = observableTracker.offsetLeft - pos1 + "px";
    }

    function closeDragElement() {
      // stop moving when mouse button is released:
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }, []);

  return (
    <>
      {createPortal(
        <article ref={observableTrackerRef} className={classes.card}>
          <header ref={observableTrackerHeaderRef}>
            <h3>Observable Tracker</h3>
          </header>
          <main>
            <section>
              <p>State:</p>
              <pre>{JSON.stringify(parseObject(state), null, 2)}</pre>
            </section>

            <section>
              <p>Subscribers ({subscribers.length}):</p>
              <div className={classes["subscriber-card-container"]}>
                {subscribers.map((subscriber) => (
                  <div
                    key={`${subscriber.key}-${subscriber.handler}`}
                    className={classes["subscriber-card"]}
                  >
                    <p>Key: {subscriber.key}</p>
                    <p>Handler: {subscriber.handler}</p>
                    {/* <p>Details: {subscriber.details}</p> */}
                  </div>
                ))}
              </div>
            </section>
          </main>
        </article>,
        document.body,
      )}
    </>
  );
}
export default ObservableTracker;
