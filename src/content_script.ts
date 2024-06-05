import { observeDeliveriesContainer } from './deliveries';
import { hasCancelSubmitted, removeCancelSubmitted, removeFromCancelQueue } from './sessionStorage';
import { observeSubscriptionsContainer } from './subscriptions';
import rg4js from 'raygun4js';
import { VERSION } from './version';

rg4js('apiKey', 'AcjYeDpxudocd1VnNiiFg');
rg4js('enableCrashReporting', true);
rg4js('setVersion', VERSION);

void (async () => {
    try {
        const search = location.search;

        if (search.includes('snsActionCompleted=cancelSubscription')) {
            // check if we've possible redirected after a one-click cancel form submission
            if (await hasCancelSubmitted()) {
                await removeCancelSubmitted();

                const searchParams = new URLSearchParams(location.search);
                const subscriptionId = searchParams.get('subscriptionId');

                if (subscriptionId) {
                    await removeFromCancelQueue(subscriptionId);
                }

                // automatically redirect back to the "Deliveries" page for more cancelling
                location.pathname = '/auto-deliveries/';
            }
        }

        observeDeliveriesContainer();
        observeSubscriptionsContainer();
    } catch (error) {
        rg4js('send', error);
    }
})();
