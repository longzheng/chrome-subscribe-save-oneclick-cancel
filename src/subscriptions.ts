import { addToCancelQueue } from './sessionStorage';
import {
    ONECLICK_CANCEL_BUTTON_ATTRIBUTE,
    processSubscriptionCard,
    SUBSCRIPTION_CARD_SELECTOR,
} from './subscriptionCard';
import { buttonStyles } from './styles';
import { ONECLICK_CANCEL_ATTRIBUTE, processCancelQueue } from './common';

const itemCancelButtonButtonBySubscriptionId = new Map<string, HTMLButtonElement>();
const CANCEL_ALL_BUTTON_ATTRIBUTE = 'data-oneclick-cancel-all-button';
const SUBSCRIPTIONS_OBSERVER_SELECTOR = [
    '#mysContainer',
    '#subscriptionsDesktopGridLayout',
    '#subscriptions-desktop-section-heading',
    SUBSCRIPTION_CARD_SELECTOR,
].join(', ');
let isProcessingSubscriptionsScheduled = false;

// the element containing all the deliveries will be loaded asynchronously
// we observe the body because both the old and new containers are inserted asynchronously
const subscriptionsContainerObserver = new MutationObserver((mutations) => {
    if (mutations.some(mutationTouchesSubscriptions)) {
        scheduleProcessSubscriptions();
    }
});

export function observeSubscriptionsContainer() {
    const searchParams = new URLSearchParams(location.search);
    const listFilter = searchParams.get('listFilter');

    // ignore cancelled subscriptions page
    if (listFilter === 'inactive') {
        return;
    }

    subscriptionsContainerObserver.observe(document.body, {
        subtree: true,
        childList: true,
    });

    // The content script can run after Amazon has already rendered the cards.
    scheduleProcessSubscriptions();
}

function scheduleProcessSubscriptions() {
    if (isProcessingSubscriptionsScheduled) {
        return;
    }

    isProcessingSubscriptionsScheduled = true;
    queueMicrotask(() => {
        isProcessingSubscriptionsScheduled = false;
        void processSubscriptions();
    });
}

function mutationTouchesSubscriptions(mutation: MutationRecord) {
    const addedElements = Array.from(mutation.addedNodes).flatMap((node) => {
        if (node instanceof Element) {
            return [node];
        }

        return node.parentElement ? [node.parentElement] : [];
    });

    if (
        addedElements.length > 0 &&
        addedElements.every((element) =>
            element.closest(`[${CANCEL_ALL_BUTTON_ATTRIBUTE}], [${ONECLICK_CANCEL_BUTTON_ATTRIBUTE}]`),
        )
    ) {
        return false;
    }

    const target = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;

    if (target?.closest(SUBSCRIPTIONS_OBSERVER_SELECTOR)) {
        return true;
    }

    return addedElements.some(
        (element) =>
            element.matches(SUBSCRIPTIONS_OBSERVER_SELECTOR) || element.querySelector(SUBSCRIPTIONS_OBSERVER_SELECTOR),
    );
}

async function processSubscriptions() {
    const subscriptionCards = Array.from(document.querySelectorAll<HTMLElement>(SUBSCRIPTION_CARD_SELECTOR));

    for (const subscriptionCard of subscriptionCards) {
        const result = processSubscriptionCard(subscriptionCard);

        if (!result) {
            continue;
        }

        itemCancelButtonButtonBySubscriptionId.set(result.subscriptionId, result.cancelButton);
    }

    for (const [subscriptionId, cancelButton] of itemCancelButtonButtonBySubscriptionId) {
        if (!cancelButton.isConnected) {
            itemCancelButtonButtonBySubscriptionId.delete(subscriptionId);
        }
    }

    addCancelAllButton();
    await processCancelQueue(itemCancelButtonButtonBySubscriptionId);
}

function addCancelAllButton() {
    const oldSubscriptionsContainer = document.querySelector('#mysContainer');
    const newSubscriptionsContainer = document.querySelector('#subscriptionsDesktopGridLayout');
    const subscriptionsContainer = oldSubscriptionsContainer ?? newSubscriptionsContainer;

    if (!subscriptionsContainer) {
        return;
    }

    const subscriptionsCount = itemCancelButtonButtonBySubscriptionId.size;

    if (subscriptionsCount === 0) {
        return;
    }

    const subscriptionFilters = oldSubscriptionsContainer
        ? oldSubscriptionsContainer.querySelector('.subscription-filters-row-thick')
        : document.querySelector('#subscriptions-desktop-section-heading #cardHeader');

    if (!subscriptionFilters) {
        return;
    }

    const existingCancelAllButton = subscriptionFilters.querySelector<HTMLButtonElement>(
        `[${CANCEL_ALL_BUTTON_ATTRIBUTE}]`,
    );

    if (existingCancelAllButton) {
        const buttonText = `One-click cancel all ${subscriptionsCount} subscriptions`;

        if (existingCancelAllButton.innerText !== buttonText) {
            existingCancelAllButton.innerText = buttonText;
        }

        return;
    }

    subscriptionFilters.setAttribute(ONECLICK_CANCEL_ATTRIBUTE, 'true');

    const cancelAllButton = document.createElement('button');
    cancelAllButton.type = 'button';
    cancelAllButton.setAttribute(CANCEL_ALL_BUTTON_ATTRIBUTE, 'true');
    cancelAllButton.innerText = `One-click cancel all ${subscriptionsCount} subscriptions`;
    Object.assign(cancelAllButton.style, buttonStyles, {
        marginLeft: '30px',
    });

    cancelAllButton.addEventListener('click', async () => {
        const currentSubscriptionIds = Array.from(itemCancelButtonButtonBySubscriptionId.keys());

        if (
            !confirm(
                `Are you sure you want to cancel ${currentSubscriptionIds.length} subscriptions?\n\nThe screen will automatically refresh after each cancellation and cancel the next subscription. Do not click on anything until it is all done.`,
            )
        ) {
            return;
        }

        await addToCancelQueue(currentSubscriptionIds);
        await processCancelQueue(itemCancelButtonButtonBySubscriptionId);
    });

    subscriptionFilters.insertAdjacentElement('beforeend', cancelAllButton);
}
