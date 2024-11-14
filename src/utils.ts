export const callWithTimeout = <T> (promise: Promise<any>, limitMs = 1000): Promise<T> =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Time out (${limitMs} ms)`)), limitMs);
    }),
  ]);

export const wait = async (ms = 5000) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});
