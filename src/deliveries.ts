import { addToCancelQueue } from "./sessionStorage";
import { processSubscriptionCard } from "./subscriptionCard";
import { buttonStyles } from "./styles";
import { ONECLICK_CANCEL_ATTRIBUTE, processCancelQueue } from "./common";

const itemCancelButtonButtonBySubscriptionId = new Map<
    string,
    HTMLButtonElement
>();

const deliveriesContainer = document.querySelector("#mydContainer");

// the element containing all the deliveries will be loaded asynchronously
// we need to observe the element for changes when it is loaded
const deliveriesContainerObserver = new MutationObserver(() => {
    void (async () => {
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

        await processCancelQueue(itemCancelButtonButtonBySubscriptionId);
    })();
});

export function observeDeliveriesContainer() {
    if (!deliveriesContainer) {
        return;
    }

    deliveriesContainerObserver.observe(deliveriesContainer, {
        subtree: true,
        childList: true,
    });
}

function processDeliveryCard(deliveryCard: HTMLElement) {
    const subscriptionCards = Array.from(
        deliveryCard.querySelectorAll<HTMLElement>(".subscription-card"),
    );

    const deliveryCardSubscriptionIds: string[] = [];

    for (const subscriptionCard of subscriptionCards) {
        const result = processSubscriptionCard(subscriptionCard);

        if (!result) {
            continue;
        }

        itemCancelButtonButtonBySubscriptionId.set(
            result.subscriptionId,
            result.cancelButton,
        );

        deliveryCardSubscriptionIds.push(result.subscriptionId);
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
    cancelAllButton.innerText = `One-click cancel delivery`;
    Object.assign(cancelAllButton.style, {
        ...buttonStyles,
        display: "block",
        width: "100%",
        marginTop: "10px",
    });

    cancelAllButton.onclick = async () => {
        if (
            !confirm(
                `Are you sure you want to cancel ${deliveryCardSubscriptionIds.length} subscriptions in this delivery?\n\nThe screen will automatically refresh after each cancellation and cancel the next subscription.  Do not click on anything until it is all done.`,
            )
        ) {
            return;
        }

        await addToCancelQueue(deliveryCardSubscriptionIds);
        await processCancelQueue(itemCancelButtonButtonBySubscriptionId);
    };

    deliveryInformationContainer.appendChild(cancelAllButton);
}
