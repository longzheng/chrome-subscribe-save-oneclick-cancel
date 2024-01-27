import { observeDeliveriesContainer } from "./deliveries";
import {
    hasOneClickCancelSessionKey,
    removeOneClickCancelSessionKey,
} from "./sessionStorage";

const search = location.search;

if (search.includes("snsActionCompleted=cancelSubscription")) {
    // check if we've possible redirected after a one-click cancel form submission
    // if so, automatically redirect back to the "Deliveries" page for more cancelling
    if (hasOneClickCancelSessionKey()) {
        removeOneClickCancelSessionKey();

        location.pathname = "/auto-deliveries/";
    }
}

observeDeliveriesContainer();
