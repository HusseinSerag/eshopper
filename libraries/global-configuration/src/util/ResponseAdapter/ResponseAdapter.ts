export interface ResponseAdapter<T> {
  setCookie(name: string, value: string, options: T): void;
  clearCookie(name: string): void;
  setHeader(name: string, value: string): void;
  clearHeader?(name: string): void;
  domain: string;
}
