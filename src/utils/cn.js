// Joins class names, skipping falsy values. Arrays and nested arrays are flattened.
export const cn = (...parts) => parts.flat(Infinity).filter(Boolean).join(" ");
