/**
 * The wire of a runtime interaction (D2): its response is a set of light-DOM hidden inputs under
 * the interaction's root, one per value, named by the entry name the SSR wrote, so the author's
 * form posts it with the one form encoding and `decode` reads it as it reads a native control.
 *
 * The writer touches only `input[type=hidden]` elements of its own name: a visible control, and a
 * hidden input of another name, are never read, moved or removed.
 *
 * @module
 */

/**
 * Read the entry name an interaction's response posts under: the `data-entry-name` the SSR wrote on
 * its root, or, without one, the `name` of the root's Control part (`<kind>-interaction-control`).
 *
 * @param root The interaction's root.
 * @returns The entry name, or `undefined` when the root names none.
 */
export const entryNameOf = (root: HTMLElement): string | undefined => {
  const written = root.dataset["entryName"];

  if (written !== undefined && written !== "") {
    return written;
  }

  const controlSlot = `${root.dataset["slot"] ?? ""}-control`;
  const name = [...root.querySelectorAll<HTMLElement>("[name]")]
    .find((element) => element.dataset["slot"] === controlSlot)
    ?.getAttribute("name");

  return name === null || name === undefined || name === "" ? undefined : name;
};

/**
 * List the hidden inputs of one name under an interaction's root, in document order.
 *
 * @param root The interaction's root.
 * @param name The entry name.
 * @returns The `input[type=hidden]` elements whose `name` is the entry name.
 */
const hiddenInputs = (root: HTMLElement, name: string): readonly HTMLInputElement[] =>
  [...root.querySelectorAll<HTMLInputElement>('input[type="hidden"]')].filter(
    (input) => input.name === name,
  );

/**
 * Write an interaction's response as hidden inputs: afterwards the root holds exactly one
 * `input[type=hidden]` of the name per value, in the values' order, and no other of that name.
 *
 * The inputs already there are reused in order, so writing the same values twice changes nothing;
 * a new input follows the last existing one of the name, or ends the root when there is none; an
 * input past the values' count is removed.
 *
 * @param root The interaction's root.
 * @param name The entry name, as {@link entryNameOf} reads it.
 * @param values The response's values, one per input, repeats kept.
 */
export const writeHidden = (root: HTMLElement, name: string, values: readonly string[]): void => {
  const existing = hiddenInputs(root, name);

  for (const [index, value] of values.entries()) {
    const reused = existing[index];

    if (reused === undefined) {
      const input = document.createElement("input");
      const last = hiddenInputs(root, name).at(-1);

      input.type = "hidden";
      input.name = name;
      input.value = value;

      if (last === undefined) {
        root.append(input);
      } else {
        last.after(input);
      }
    } else if (reused.value !== value) {
      reused.value = value;
    }
  }

  for (const stale of existing.slice(values.length)) {
    stale.remove();
  }
};

/**
 * Read an interaction's response back from its hidden inputs.
 *
 * @param root The interaction's root.
 * @param name The entry name.
 * @returns The values of the `input[type=hidden]` elements of the name, in document order.
 */
export const readHidden = (root: HTMLElement, name: string): readonly string[] =>
  hiddenInputs(root, name).map((input) => input.value);
