import { action, query } from "@solidjs/router";
import { portToService as pts } from "./portingHelpers";
import { getRegisteredServices as gts } from "./streamingServices";
import { addToTransferList as attl } from "./transferTrackingHelper";

export const portToService = query(pts, "portToService");
export const getRegisteredServices = query(gts, "getRegisteredServices");
export const addToTransferList = action(attl, "addToTransferList");
