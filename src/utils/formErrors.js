// Maps the 422 envelope errors ([{ path, message }]) to { [path]: message }. The first message per path wins.
export const toFieldErrors = (errors) => {
  const out = {};
  (Array.isArray(errors) ? errors : []).forEach(({ path, message }) => {
    if (path && !out[path]) out[path] = message;
  });
  return out;
};
