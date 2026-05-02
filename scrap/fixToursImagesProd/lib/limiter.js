"use strict";

/**
 * Simple concurrency limiter — no external dependencies.
 * Limits how many async tasks run simultaneously.
 *
 * @param {number} concurrency - Max parallel tasks
 * @returns {function} limit(fn) – wrap an async fn to queue it
 */
function createLimiter(concurrency) {
  if (typeof concurrency !== "number" || concurrency < 1) {
    throw new RangeError("concurrency must be a positive number");
  }

  let running = 0;
  const queue = [];

  function run() {
    while (running < concurrency && queue.length > 0) {
      running++;
      const { fn, resolve, reject } = queue.shift();
      Promise.resolve()
        .then(fn)
        .then(
          (result) => { running--; resolve(result); run(); },
          (err)    => { running--; reject(err);    run(); }
        );
    }
  }

  /**
   * @param {() => Promise<any>} fn
   * @returns {Promise<any>}
   */
  return function limit(fn) {
    return new Promise((resolve, reject) => {
      queue.push({ fn, resolve, reject });
      run();
    });
  };
}

module.exports = { createLimiter };
