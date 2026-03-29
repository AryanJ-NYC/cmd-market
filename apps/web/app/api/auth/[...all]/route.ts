import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "../../../../lib/auth";

export const { DELETE, GET, PATCH, POST, PUT } = toNextJsHandler(auth);
