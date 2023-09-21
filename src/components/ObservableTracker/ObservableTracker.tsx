import { Observable } from "class/Observable";
import { ElementRef, useEffect, useReducer, useRef, useState } from "react";
import { createPortal } from "react-dom";

import classes from "./ObservableTracker.module.css";
import { SubscriberData } from "class/types";

function stringifyWithCircularCheck(obj: Record<string, unknown>) {
  const seen = new Set();
  return JSON.stringify(
    obj,
    (_, value) => {
      if (typeof value === "object" && value !== null) {
        if (value instanceof HTMLElement) {
          return {
            id: value.id,
            tagName: value.tagName,
            name: "name" in value ? value.name : undefined,
            value: "value" in value ? value.value : undefined,
          };
        }
        if (seen.has(value)) return; // If we've seen this object before, skip it
        seen.add(value);
      }
      return value;
    },
    2,
  );
}

function ObservableTracker<T extends Record<string, unknown>>({
  useObservableContext,
  refreshInterval = 1000,
}: {
  useObservableContext: () => Observable<T>;
  refreshInterval?: number;
}) {
  const observable = useObservableContext();

  const observableTrackerRef = useRef<ElementRef<"article">>(null);
  const observableTrackerHeaderRef = useRef<ElementRef<"header">>(null);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, render] = useReducer((s) => s ^ 1, 0);
  const [subscribers, setSubscribers] = useState<SubscriberData[]>([]);

  const getWatchers = () => {
    const sub = observable.printWatchers();
    if (Array.isArray(sub)) setSubscribers(sub);
  };

  useEffect(() => {
    const interval = setInterval(render, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  useEffect(() => {
    observable.onWatch = getWatchers;
    observable.onUnwatch = getWatchers;
    observable.onWatchAll = getWatchers;
    observable.onUnwatchAll = getWatchers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [observable]);

  useEffect(() => {
    return observable.watchAll(() => render());
  }, [observable]);

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

  const mainRef = useRef<ElementRef<"main">>(null);
  const toggleClose = () => {
    if (!mainRef.current) return;
    mainRef.current.classList.toggle(classes["closed"]);
  };

  return (
    <>
      {createPortal(
        (
          <article ref={observableTrackerRef} className={classes.card}>
            <div onDoubleClick={toggleClose}>
              <header ref={observableTrackerHeaderRef}>
                <h3>Observable Tracker</h3>
              </header>
            </div>

            <main ref={mainRef} className={classes["closed"]}>
              <section>
                <p>State:</p>
                <pre>{stringifyWithCircularCheck(observable.proxy)}</pre>
              </section>

              <section>
                <p>Subscribers ({subscribers.length}):</p>
                <div className={classes["subscriber-card-container"]}>
                  {subscribers.map((subscriber) => (
                    <div
                      key={`${subscriber.key}-${subscriber.handler}`}
                      className={classes["subscriber-card"]}
                    >
                      <pre>Key: {subscriber.key}</pre>
                      <pre>Handler: {subscriber.handler}</pre>
                      <pre>
                        {/* Details: {JSON.stringify(subscriber.details, null, 2)} */}
                      </pre>
                    </div>
                  ))}
                </div>
              </section>
            </main>

            <footer>
              <button onClick={render}>Refresh</button>
              <button onClick={getWatchers}>Subscribers</button>
            </footer>
          </article>
        ) as any,
        document.body,
      )}
    </>
  );
}
export default ObservableTracker;
