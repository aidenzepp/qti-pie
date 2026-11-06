import { connect } from "node:net";
import { Effect, Predicate } from "effect";

/**
 * Open a TCP connection to a port on `127.0.0.1` and close it at once.
 *
 * The tests that prove a listener bound a port, and freed it when its scope closed, read the
 * answer; any failure other than a refused connection is a defect of the test's machine.
 *
 * @param port The port.
 * @returns `accepted` when something listens there, `refused` when nothing does.
 */
export const dial = (port: number) =>
  Effect.callback<"accepted" | "refused">((resume) => {
    const socket = connect(port, "127.0.0.1");
    socket.once("connect", () => {
      socket.destroy();
      resume(Effect.succeed("accepted"));
    });
    socket.once("error", (error) => {
      resume(
        Predicate.hasProperty(error, "code") && error.code === "ECONNREFUSED"
          ? Effect.succeed("refused")
          : Effect.die(error),
      );
    });
  });
