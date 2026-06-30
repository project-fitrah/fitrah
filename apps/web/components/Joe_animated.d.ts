import type { ReactElement } from "react";

type JoeAnimatedProps = {
  pose?: "idle" | "talking";
  position?: [number, number, number];
  rotation?: [number, number, number];
  [key: string]: unknown;
};

export function Joe_animated(props: JoeAnimatedProps): ReactElement;
