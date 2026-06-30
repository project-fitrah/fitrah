import type { ReactElement } from "react";

type SpaceModelProps = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  [key: string]: unknown;
};

export function Model(props: SpaceModelProps): ReactElement;
