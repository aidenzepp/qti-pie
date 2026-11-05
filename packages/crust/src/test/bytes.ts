/**
 * The bytes of ASCII `text`.
 */
export const ascii = (text: string): readonly number[] => [...new TextEncoder().encode(text)];

/**
 * Builds the bytes of a document from runs of byte values, in the order given.
 */
export const bytesOf = (...parts: readonly (readonly number[])[]): Uint8Array =>
  Uint8Array.from(parts.flat());

/**
 * A document that declares `encoding` and whose root `a` holds the byte runs of `body`.
 */
export const declared = (encoding: string, ...body: readonly (readonly number[])[]): Uint8Array =>
  bytesOf(ascii(`<?xml version="1.0" encoding="${encoding}"?><a>`), ...body, ascii("</a>"));
