import {
    addToCancelQueue,
    getCancelQueue,
    removeFromCancelQueue,
} from "./sessionStorage";
import { observeEditSubscriptionModal } from "./subscription";

const itemCancelButtonButtonBySubscriptionId = new Map<
    string,
    HTMLButtonElement
>();

// since the MutationObserver may run multiple times
// we don't want to re-add the cancel button if it's already been added
export const ONECLICK_CANCEL_ATTRIBUTE = "data-oneclick-cancel";

const deliveriesContainer = document.querySelector(".deliveries-container");

// the element containing all the deliveries will be loaded asynchronously
// we need to observe the element for changes when it is loaded
const deliveriesContainerObserver = new MutationObserver(async () => {
    if (!deliveriesContainer) {
        return;
    }

    const deliveryCards = Array.from(
        deliveriesContainer.querySelectorAll<HTMLElement>(".delivery-card"),
    );

    for (const deliveryCard of deliveryCards) {
        if (deliveryCard.hasAttribute(ONECLICK_CANCEL_ATTRIBUTE)) {
            continue;
        }

        deliveryCard.setAttribute(ONECLICK_CANCEL_ATTRIBUTE, "true");

        processDeliveryCard(deliveryCard);
    }

    await addCancelAllButton();
    await processCancelQueue();
});

export function observeDeliveriesContainer() {
    if (!deliveriesContainer) {
        return;
    }

    deliveriesContainerObserver.observe(deliveriesContainer, {
        childList: true,
    });
}

function processDeliveryCard(deliveryCard: HTMLElement) {
    const subscriptionCards = Array.from(
        deliveryCard.querySelectorAll<HTMLElement>(".subscription-card"),
    );

    const deliveryCardSubscriptionIds: string[] = [];

    for (const subscriptionCard of subscriptionCards) {
        // there may be placeholder buttons for "Add new subscription"
        // verify there is a `data-subscription-id` attribute
        if (!subscriptionCard.dataset.subscriptionId) {
            continue;
        }

        if (
            subscriptionCard.querySelector(
                ".subscription-notification-title-container.info-notification",
            )
        ) {
            // there is a notification on this subscription
            // it may be a notification for a subscription that has already been cancelled
            // ignore
            continue;
        }

        if (subscriptionCard.hasAttribute(ONECLICK_CANCEL_ATTRIBUTE)) {
            continue;
        }

        subscriptionCard.setAttribute(ONECLICK_CANCEL_ATTRIBUTE, "true");

        const subscriptionId = subscriptionCard.dataset.subscriptionId;

        if (!subscriptionId) {
            console.error("Subscription ID not found");
        }

        deliveryCardSubscriptionIds.push(subscriptionId);

        const subscriptionCancelButton =
            processSubscriptionCard(subscriptionCard);

        itemCancelButtonButtonBySubscriptionId.set(
            subscriptionCard.dataset.subscriptionId!,
            subscriptionCancelButton,
        );
    }

    if (deliveryCardSubscriptionIds.length === 0) {
        return;
    }

    const deliveryInformationContainer = deliveryCard.querySelector(
        ".delivery-information-container",
    );

    if (!deliveryInformationContainer) {
        console.error("Could not find delivery information container");
        return;
    }

    const cancelAllButton = document.createElement("button");
    cancelAllButton.innerText = `One-click cancel all (${deliveryCardSubscriptionIds.length})`;
    Object.assign(cancelAllButton.style, {
        ...buttonStyles,
        display: "block",
        width: "100%",
        marginTop: "10px",
    });

    cancelAllButton.onclick = async () => {
        if (
            !confirm(
                `Are you sure you want to cancel all ${deliveryCardSubscriptionIds.length} subscriptions in this delivery?\n\nThe screen will automatically refresh after each cancellation and cancel the next subscription.  Do not click on anything until it is all done.`,
            )
        ) {
            return;
        }

        await addToCancelQueue(deliveryCardSubscriptionIds);
        await processCancelQueue();
    };

    deliveryInformationContainer.appendChild(cancelAllButton);
}

function processSubscriptionCard(subscriptionCard: HTMLElement) {
    const cancelButton = document.createElement("button");
    cancelButton.innerText = "One-click cancel";

    Object.assign(cancelButton.style, {
        ...buttonStyles,
        display: "block",
        width: "100%",
        marginTop: "10px",
    });

    cancelButton.onclick = () => {
        // click on the subscription image to open edit subscription modal
        const editSubscriptionModalTrigger =
            subscriptionCard.querySelector<HTMLElement>(
                ".subscription-image-container > span",
            );

        if (!editSubscriptionModalTrigger) {
            console.error("Could not find edit subscription modal trigger");
            return;
        }

        // the edit subscription modal is loaded asynchronously
        // start edit subscription modal observer to know when it is ready to trigger cancellation
        observeEditSubscriptionModal();

        editSubscriptionModalTrigger.click();
    };

    subscriptionCard.appendChild(cancelButton);

    return cancelButton;
}

function addCancelAllButton() {
    const subscriptionsCount = itemCancelButtonButtonBySubscriptionId.size;

    if (subscriptionsCount === 0) {
        return;
    }

    const navigationTabs = document.querySelector(
        ".navigation-component-wrapper",
    );

    if (!navigationTabs) {
        console.error("Could not find navigation tabs");
        return;
    }

    const cancelAllButton = document.createElement("button");
    cancelAllButton.innerText = `One-click cancel all (${subscriptionsCount})`;
    Object.assign(cancelAllButton.style, {
        ...buttonStyles,
        marginTop: "-30px",
    });

    cancelAllButton.onclick = async () => {
        if (
            !confirm(
                `Are you sure you want to cancel all ${subscriptionsCount} subscriptions?\n\nThe screen will automatically refresh after each cancellation and cancel the next subscription. Do not click on anything until it is all done.`,
            )
        ) {
            return;
        }

        const subscriptionIds = Array.from(
            itemCancelButtonButtonBySubscriptionId.keys(),
        );

        await addToCancelQueue(subscriptionIds);
        await processCancelQueue();
    };

    navigationTabs.insertAdjacentElement("afterend", cancelAllButton);
}

async function processCancelQueue() {
    const cancelQueue = await getCancelQueue();

    if (cancelQueue.length === 0) {
        return;
    }

    const firstItem = cancelQueue[0];

    const cancelButton = itemCancelButtonButtonBySubscriptionId.get(firstItem);

    if (!cancelButton) {
        // if cancel button is not found, remove from queue and try again
        await removeFromCancelQueue(firstItem);
        await processCancelQueue();
        return;
    }

    // click on the cancel button
    cancelButton.click();
}

const buttonStyles: Partial<CSSStyleDeclaration> = {
    background: "red",
    color: "white",
    padding: "4px",
    border: "none",
    borderRadius: "2px",
};
