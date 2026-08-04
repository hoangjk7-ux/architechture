/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import schema from "./schema";

const modules = import.meta.glob("./**/!(*.*.*)*.*s");

export function createConvexTest() {
  return convexTest(schema, modules);
}
