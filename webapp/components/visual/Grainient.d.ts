import type { CSSProperties, JSX } from "react";

/** Types for the React Bits <Grainient /> component (Grainient.jsx is kept exactly as published). */
export interface GrainientProps {
  colors?: string[];
  type?: "linear" | "radial";
  angle?: number;
  bands?: number;
  speed?: number;
  flow?: number;
  scale?: number;
  softness?: number;
  silk?: number;
  grainAmount?: number;
  grainSize?: number;
  grainAnimated?: boolean;
  contrast?: number;
  saturation?: number;
  variation?: number;
  interactive?: boolean;
  stir?: number;
  clickSwirl?: boolean;
  intro?: boolean;
  lightMode?: boolean;
  dpr?: number;
  className?: string;
  style?: CSSProperties;
}

declare function Grainient(props: GrainientProps): JSX.Element;
export default Grainient;
