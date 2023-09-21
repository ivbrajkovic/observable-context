export type Subject = Record<string, unknown>;

export type ChangesForKeys<T extends Subject, K extends keyof T> = {
  [P in K]: T[P];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Handler<T extends Subject, K extends keyof T = any> = (
  changes: ChangesForKeys<T, K>,
) => void;

export type SubscriberData = {
  key: string;
  handler: string;
  details: string;
};
