import { observeDeliveriesContainer } from "./deliveries";
import {
    hasOneClickCancelSessionKey,
    removeOneClickCancelSessionKey,
} from "./sessionStorage";

const search = location.search;

if (search.includes("snsActionCompleted=cancelSubscription")) {
    // check if we've used oneclick-cancel
    if (hasOneClickCancelSessionKey()) {
        removeOneClickCancelSessionKey();

        location.pathname = "/auto-deliveries/";
    }
}

observeDeliveriesContainer();
