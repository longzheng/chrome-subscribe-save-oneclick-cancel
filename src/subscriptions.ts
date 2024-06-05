import { addToCancelQueue } from './sessionStorage';
import { processSubscriptionCard } from './subscriptionCard';
import { buttonStyles } from './styles';
import { ONECLICK_CANCEL_ATTRIBUTE, processCancelQueue } from './common';

const itemCancelButtonButtonBySubscriptionId = new Map<string, HTMLButtonElement>();

const subscriptionsContainer = document.querySelector('#mysContainer');

// the element containing all the deliveries will be loaded asynchronously
// we need to observe the element for changes when it is loaded
const subscriptionsContainerObserver = new MutationObserver(() => {
    void (async () => {
        if (!subscriptionsContainer) {
            return;
        }

        const subscriptionCards = Array.from(
            subscriptionsContainer.querySelectorAll<HTMLElement>('.subscription-card'),
        );

        for (const subscriptionCard of subscriptionCards) {
            const result = processSubscriptionCard(subscriptionCard);

            if (!result) {
                continue;
            }

            itemCancelButtonButtonBySubscriptionId.set(result.subscriptionId, result.cancelButton);
        }

        addCancelAllButton();
        await processCancelQueue(itemCancelButtonButtonBySubscriptionId);
    })();
});

export function observeSubscriptionsContainer() {
    if (!subscriptionsContainer) {
        return;
    }

    const searchParams = new URLSearchParams(location.search);
    const listFilter = searchParams.get('listFilter');

    // ignore cancelled subscriptions page
    if (listFilter === 'inactive') {
        return;
    }

    subscriptionsContainerObserver.observe(subscriptionsContainer, {
        subtree: true,
        childList: true,
    });
}

function addCancelAllButton() {
    if (!subscriptionsContainer) {
        return null;
    }

    const subscriptionsCount = itemCancelButtonButtonBySubscriptionId.size;

    if (subscriptionsCount === 0) {
        return;
    }

    const subscriptionFilters = subscriptionsContainer.querySelector('.subscription-filters-row-thick');

    if (!subscriptionFilters) {
        throw new Error('Could not find subscriptions filter');
    }

    if (subscriptionFilters.hasAttribute(ONECLICK_CANCEL_ATTRIBUTE)) {
        return;
    }

    subscriptionFilters.setAttribute(ONECLICK_CANCEL_ATTRIBUTE, 'true');

    const cancelAllButton = document.createElement('button');
    cancelAllButton.innerText = `One-click cancel all ${subscriptionsCount} subscriptions`;
    Object.assign(cancelAllButton.style, {
        ...buttonStyles,
        marginLeft: '30px',
    });

    cancelAllButton.onclick = async () => {
        if (
            !confirm(
                `Are you sure you want to cancel ${subscriptionsCount} subscriptions?\n\nThe screen will automatically refresh after each cancellation and cancel the next subscription. Do not click on anything until it is all done.`,
            )
        ) {
            return;
        }

        const subscriptionIds = Array.from(itemCancelButtonButtonBySubscriptionId.keys());

        await addToCancelQueue(subscriptionIds);
        await processCancelQueue(itemCancelButtonButtonBySubscriptionId);
    };

    subscriptionFilters.insertAdjacentElement('beforeend', cancelAllButton);
}
