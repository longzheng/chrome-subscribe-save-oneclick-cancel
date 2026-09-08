import { addToCancelQueue } from './sessionStorage';
import { observeEditSubscriptionModal } from './editSubscription';
import { addOneClickCancelButton, ONECLICK_CANCEL_BUTTON_ATTRIBUTE, processSubscriptionCard } from './subscriptionCard';
import { buttonStyles } from './styles';
import { ONECLICK_CANCEL_ATTRIBUTE, processCancelQueue } from './common';

const itemCancelButtonBySubscriptionId = new Map<string, HTMLButtonElement>();
const NEW_DELIVERY_CANCEL_PARAMETER = 'oneClickCancelDelivery';
const NEW_DELIVERY_TILE_SELECTOR = '[data-testid="desktop-subscription-tile"]';
const DELIVERIES_OBSERVER_SELECTOR = [
    '#mydContainer',
    '.delivery-card',
    '.hub-delivery-card',
    '[data-testid="desktop-delivery-list"]',
    NEW_DELIVERY_TILE_SELECTOR,
    '[data-testid="smx-render-complete-card"]',
].join(', ');
const subscriptionIdsByOldDeliveryCard = new WeakMap<HTMLElement, string[]>();

let isPreparingNewDeliveryCancellation = false;
let isProcessingDeliveriesScheduled = false;
let hasHandledNewDeliveryCancelParameter = false;

const deliveriesContainerObserver = new MutationObserver((mutations) => {
    if (mutations.some(mutationTouchesDeliveries)) {
        scheduleProcessDeliveries();
    }
});

export function observeDeliveriesContainer() {
    deliveriesContainerObserver.observe(document.body, {
        subtree: true,
        childList: true,
    });

    // The content script can run after Amazon has already rendered the cards.
    scheduleProcessDeliveries();
}

function scheduleProcessDeliveries() {
    if (isProcessingDeliveriesScheduled) {
        return;
    }

    isProcessingDeliveriesScheduled = true;
    queueMicrotask(() => {
        isProcessingDeliveriesScheduled = false;
        void processDeliveries();
    });
}

function mutationTouchesDeliveries(mutation: MutationRecord) {
    const addedElements = Array.from(mutation.addedNodes).flatMap((node) => {
        if (node instanceof Element) {
            return [node];
        }

        return node.parentElement ? [node.parentElement] : [];
    });

    if (
        addedElements.length > 0 &&
        addedElements.every((element) => element.closest(`[${ONECLICK_CANCEL_BUTTON_ATTRIBUTE}]`))
    ) {
        return false;
    }

    const target = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;

    if (target?.closest(DELIVERIES_OBSERVER_SELECTOR)) {
        return true;
    }

    return addedElements.some(
        (element) =>
            element.matches(DELIVERIES_OBSERVER_SELECTOR) || element.querySelector(DELIVERIES_OBSERVER_SELECTOR),
    );
}

async function processDeliveries() {
    processOldDeliveryCards();
    processNewHubDeliveryCards();
    processNewDeliveryDetail();

    await processCancelQueue(itemCancelButtonBySubscriptionId);
}

function processOldDeliveryCards() {
    const deliveryCards = Array.from(document.querySelectorAll<HTMLElement>('#mydContainer .delivery-card'));

    for (const deliveryCard of deliveryCards) {
        processOldDeliveryCard(deliveryCard);
    }
}

function processOldDeliveryCard(deliveryCard: HTMLElement) {
    const subscriptionCards = Array.from(deliveryCard.querySelectorAll<HTMLElement>('.subscription-card'));
    const deliveryCardSubscriptionIds: string[] = [];

    for (const subscriptionCard of subscriptionCards) {
        const result = processSubscriptionCard(subscriptionCard);

        if (!result) {
            continue;
        }

        itemCancelButtonBySubscriptionId.set(result.subscriptionId, result.cancelButton);
        deliveryCardSubscriptionIds.push(result.subscriptionId);
    }

    if (deliveryCardSubscriptionIds.length === 0) {
        return;
    }

    subscriptionIdsByOldDeliveryCard.set(deliveryCard, deliveryCardSubscriptionIds);

    if (deliveryCard.hasAttribute(ONECLICK_CANCEL_ATTRIBUTE)) {
        return;
    }

    const deliveryInformationContainer = deliveryCard.querySelector('.delivery-information-container');

    if (!deliveryInformationContainer) {
        return;
    }

    deliveryCard.setAttribute(ONECLICK_CANCEL_ATTRIBUTE, 'true');

    const cancelAllButton = createCancelDeliveryButton(async () => {
        const currentSubscriptionIds = subscriptionIdsByOldDeliveryCard.get(deliveryCard) ?? [];

        if (!confirmDeliveryCancellation(currentSubscriptionIds.length)) {
            return;
        }

        await addToCancelQueue(currentSubscriptionIds);
        await processCancelQueue(itemCancelButtonBySubscriptionId);
    });

    deliveryInformationContainer.appendChild(cancelAllButton);
}

function processNewHubDeliveryCards() {
    const deliveryCards = Array.from(document.querySelectorAll<HTMLElement>('.hub-delivery-card'));

    for (const deliveryCard of deliveryCards) {
        if (deliveryCard.hasAttribute(ONECLICK_CANCEL_ATTRIBUTE)) {
            continue;
        }

        const cardClickHandler = deliveryCard.closest<HTMLElement>('[data-mix-operations="cardClickHandler"]');
        const manageUrl =
            cardClickHandler?.dataset['manageurl'] ??
            deliveryCard.querySelector<HTMLAnchorElement>('a[href*="deliveryDate="]')?.href;

        if (!manageUrl) {
            continue;
        }

        deliveryCard.setAttribute(ONECLICK_CANCEL_ATTRIBUTE, 'true');

        const cancelAllButton = createCancelDeliveryButton(() => {
            if (!confirmDeliveryCancellation()) {
                return;
            }

            const deliveryUrl = new URL(manageUrl, location.href);
            deliveryUrl.searchParams.set(NEW_DELIVERY_CANCEL_PARAMETER, 'true');
            location.assign(deliveryUrl);
        });

        const manageLink = deliveryCard.querySelector<HTMLAnchorElement>('a[href*="deliveryDate="]');
        const actionStack = manageLink?.closest('.a-section');
        const cancelButtonRow = document.createElement('div');
        cancelButtonRow.setAttribute(ONECLICK_CANCEL_BUTTON_ATTRIBUTE, 'true');
        Object.assign(cancelButtonRow.style, {
            display: 'block',
            width: '100%',
        });
        cancelButtonRow.appendChild(cancelAllButton);

        if (actionStack) {
            actionStack.insertAdjacentElement('afterend', cancelButtonRow);
        } else {
            deliveryCard.appendChild(cancelButtonRow);
        }
    }
}

function processNewDeliveryDetail() {
    const deliveryTiles = Array.from(document.querySelectorAll<HTMLElement>(NEW_DELIVERY_TILE_SELECTOR));

    for (const deliveryTile of deliveryTiles) {
        const editTrigger = deliveryTile.querySelector<HTMLElement>(
            `button:not([${ONECLICK_CANCEL_BUTTON_ATTRIBUTE}])`,
        );

        if (editTrigger) {
            addOneClickCancelButton(deliveryTile, editTrigger);
        }
    }

    addNewDeliveryDetailCancelAllButton(deliveryTiles);

    const searchParams = new URLSearchParams(location.search);

    if (
        searchParams.get(NEW_DELIVERY_CANCEL_PARAMETER) === 'true' &&
        deliveryTiles.length > 0 &&
        document.querySelector('[data-testid="smx-render-complete-card"]') &&
        !hasHandledNewDeliveryCancelParameter
    ) {
        hasHandledNewDeliveryCancelParameter = true;
        void queueNewDeliverySubscriptions(deliveryTiles);
    }
}

function addNewDeliveryDetailCancelAllButton(deliveryTiles: HTMLElement[]) {
    const deliveryList = document.querySelector<HTMLElement>('[data-testid="desktop-delivery-list"]');

    if (!deliveryList || deliveryTiles.length === 0 || deliveryList.hasAttribute(ONECLICK_CANCEL_ATTRIBUTE)) {
        return;
    }

    deliveryList.setAttribute(ONECLICK_CANCEL_ATTRIBUTE, 'true');

    const cancelAllButton = createCancelDeliveryButton(async () => {
        const currentDeliveryTiles = Array.from(document.querySelectorAll<HTMLElement>(NEW_DELIVERY_TILE_SELECTOR));

        if (!confirmDeliveryCancellation(currentDeliveryTiles.length)) {
            return;
        }

        await queueNewDeliverySubscriptions(currentDeliveryTiles);
    });

    Object.assign(cancelAllButton.style, {
        marginBottom: '10px',
    });

    deliveryList.prepend(cancelAllButton);
}

async function queueNewDeliverySubscriptions(deliveryTiles: HTMLElement[]) {
    if (isPreparingNewDeliveryCancellation) {
        return;
    }

    isPreparingNewDeliveryCancellation = true;

    try {
        const subscriptionIds: string[] = [];

        for (const [index, deliveryTile] of deliveryTiles.entries()) {
            const keepDialogOpen = index === deliveryTiles.length - 1;
            const subscriptionId = await discoverNewDeliverySubscriptionId(deliveryTile, keepDialogOpen);

            if (!subscriptionId) {
                throw new Error('Could not find a subscription ID in the delivery');
            }

            subscriptionIds.push(subscriptionId);
        }

        if (subscriptionIds.length === 0) {
            throw new Error('Could not find subscriptions in the delivery');
        }

        // The final subscription dialog is still open. Queue it first and move
        // directly into its cancellation panel instead of closing and reopening
        // the dialog, which races with Amazon's popover cleanup animation.
        const activeSubscriptionId = subscriptionIds.at(-1);

        if (!activeSubscriptionId) {
            throw new Error('Could not find an active subscription in the delivery');
        }

        await addToCancelQueue([activeSubscriptionId, ...subscriptionIds.slice(0, -1)]);
        observeEditSubscriptionModal();
    } catch (error) {
        isPreparingNewDeliveryCancellation = false;
        console.error('Could not prepare one-click delivery cancellation', error);
        alert('Could not prepare this delivery for cancellation. Please refresh the page and try again.');
    }
}

async function discoverNewDeliverySubscriptionId(
    deliveryTile: HTMLElement,
    keepDialogOpen: boolean,
): Promise<string | null> {
    const editTrigger = deliveryTile.querySelector<HTMLElement>(`button:not([${ONECLICK_CANCEL_BUTTON_ATTRIBUTE}])`);

    if (!editTrigger) {
        return null;
    }

    editTrigger.click();

    const cancelLink = await waitForElement<HTMLAnchorElement>(
        '.a-popover-modal[aria-hidden="false"] .editSubscriptionContent .t-action-type-CANCEL',
    );

    const subscriptionId = cancelLink
        ? new URL(cancelLink.href, location.href).searchParams.get('subscriptionId')
        : null;

    if (keepDialogOpen) {
        return subscriptionId;
    }

    const closeButton = cancelLink?.closest('.a-popover-modal')?.querySelector<HTMLButtonElement>('.a-button-close');

    closeButton?.click();

    if (closeButton) {
        await waitForElement('.a-popover-modal[aria-hidden="false"] .editSubscriptionContent', false);
        await new Promise((resolve) => setTimeout(resolve, 250));
    }

    return subscriptionId;
}

function waitForElement<T extends Element>(selector: string, shouldExist = true, timeout = 10_000): Promise<T | null> {
    const getElement = () => document.querySelector<T>(selector);
    const currentElement = getElement();

    if ((shouldExist && currentElement) || (!shouldExist && !currentElement)) {
        return Promise.resolve(currentElement);
    }

    return new Promise((resolve) => {
        const observer = new MutationObserver(() => {
            const element = getElement();

            if ((shouldExist && element) || (!shouldExist && !element)) {
                observer.disconnect();
                clearTimeout(timeoutId);
                resolve(element);
            }
        });

        const timeoutId = window.setTimeout(() => {
            observer.disconnect();
            resolve(null);
        }, timeout);

        observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    });
}

function confirmDeliveryCancellation(subscriptionCount?: number) {
    const targetText =
        subscriptionCount === undefined
            ? 'every subscription'
            : `${subscriptionCount} subscription${subscriptionCount === 1 ? '' : 's'}`;

    return confirm(
        `Are you sure you want to cancel ${targetText} in this delivery?\n\nThe screen will automatically refresh after each cancellation and cancel the next subscription. Do not click on anything until it is all done.`,
    );
}

function createCancelDeliveryButton(onClick: () => void | Promise<void>) {
    const cancelAllButton = document.createElement('button');
    cancelAllButton.type = 'button';
    cancelAllButton.setAttribute(ONECLICK_CANCEL_BUTTON_ATTRIBUTE, 'true');
    cancelAllButton.innerText = 'One-click cancel delivery';
    Object.assign(cancelAllButton.style, buttonStyles, {
        display: 'block',
        width: '100%',
        marginTop: '10px',
    });

    cancelAllButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        void onClick();
    });

    return cancelAllButton;
}
