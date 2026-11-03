import { resumeCancelCompletion } from './cancelCompletion';
import { observeDeliveriesContainer } from './deliveries';
import { observeSubscriptionsContainer } from './subscriptions';

void (async () => {
    try {
        if (await resumeCancelCompletion()) {
            return;
        }

        observeDeliveriesContainer();
        observeSubscriptionsContainer();
    } catch (error) {
        console.error(error);
    }
})();
