import { ElementRef, useEffect, useRef, useState } from "react";
import classes from "./ObservableTracker.module.css";
import { Observable, SubscriberData } from "class/Observable";
import { createPortal } from "react-dom";

function ObservableTracker<T extends Record<string, unknown>>(props: {
  useObservableContext: () => Observable<T>;
}) {
  const observable = props.useObservableContext();

  const observableTrackerRef = useRef<ElementRef<"article">>(null);
  const observableTrackerHeaderRef = useRef<ElementRef<"header">>(null);

  const [state, setState] = useState(() => ({ ...observable.observed }));
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
    const subscription = observable.subscribeAll((key, value) =>
      setState((state) => ({ ...state, [key]: value })),
    );
    return subscription;
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
              <pre>{JSON.stringify(state, null, 2)}</pre>
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
