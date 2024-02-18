import { ONECLICK_CANCEL_ATTRIBUTE } from "./common";
import { observeEditSubscriptionModal } from "./editSubscription";
import { buttonStyles } from "./styles";

export function processSubscriptionCard(subscriptionCard: HTMLElement): {
    subscriptionId: string;
    cancelButton: HTMLButtonElement;
} | null {
    // there may be placeholder buttons for "Add new subscription"
    // verify there is a `data-subscription-id` attribute
    if (!subscriptionCard.dataset.subscriptionId) {
        return null;
    }

    // there is a notification on this subscription
    // it may be a notification for a subscription that has already been cancelled
    if (
        subscriptionCard.querySelector(
            ".subscription-notification-title-container.info-notification",
        )
    ) {
        return null;
    }

    // if this card has already been processed
    if (subscriptionCard.hasAttribute(ONECLICK_CANCEL_ATTRIBUTE)) {
        return null;
    }

    subscriptionCard.setAttribute(ONECLICK_CANCEL_ATTRIBUTE, "true");

    const subscriptionId = subscriptionCard.dataset.subscriptionId;

    if (!subscriptionId) {
        console.error("Subscription ID not found");
        return null;
    }

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

    return { subscriptionId, cancelButton };
}
