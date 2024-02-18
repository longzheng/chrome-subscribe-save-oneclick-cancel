import { observeDeliveriesContainer } from "./deliveries";
import {
    hasCancelSubmitted,
    removeCancelSubmitted,
    removeFromCancelQueue,
} from "./sessionStorage";
import { observeSubscriptionsContainer } from "./subscriptions";

(async () => {
    const search = location.search;

    if (search.includes("snsActionCompleted=cancelSubscription")) {
        // check if we've possible redirected after a one-click cancel form submission
        if (await hasCancelSubmitted()) {
            await removeCancelSubmitted();

            const searchParams = new URLSearchParams(location.search);
            const subscriptionId = searchParams.get("subscriptionId");

            if (subscriptionId) {
                await removeFromCancelQueue(subscriptionId);
            }

            // automatically redirect back to the "Deliveries" page for more cancelling
            location.pathname = "/auto-deliveries/";
        }
    }

    observeDeliveriesContainer();
    observeSubscriptionsContainer();
})();
