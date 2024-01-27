import { observeEditSubscriptionModal } from "./subscription";

// since the MutationObserver may run multiple times
// we don't want to re-add the cancel button if it's already been added
export const ONECLICK_CANCEL_ATTRIBUTE = "data-oneclick-cancel";

// the element containing all the deliveries will be loaded asynchronously
// this is the element we want to observe for changes
const deliveriesContainer = document.querySelector(".deliveries-container");

const deliveriesContainerObserver = new MutationObserver(() => {
    if (!deliveriesContainer) {
        return;
    }

    const subscriptionItems = Array.from(
        deliveriesContainer.querySelectorAll<HTMLElement>(".subscription-card"),
    );

    for (const subscriptionItem of subscriptionItems) {
        // verify there is a `data-subscription-id` attribute
        if (!subscriptionItem.dataset.subscriptionId) {
            continue;
        }

        if (subscriptionItem.hasAttribute(ONECLICK_CANCEL_ATTRIBUTE)) {
            continue;
        }

        subscriptionItem.setAttribute(ONECLICK_CANCEL_ATTRIBUTE, "true");

        const itemCancelButton = createItemCancelButton(subscriptionItem);
        subscriptionItem.appendChild(itemCancelButton);
    }
});

export function observeDeliveriesContainer() {
    if (!deliveriesContainer) {
        return;
    }

    deliveriesContainerObserver.observe(deliveriesContainer, {
        childList: true,
    });
}

function createItemCancelButton(subscriptionItemHtml: HTMLElement) {
    const cancelButton = document.createElement("button");
    cancelButton.innerText = "One-click cancel";

    const styles: Partial<CSSStyleDeclaration> = {
        display: "block",
        width: "100%",
        marginTop: "10px",
        background: "red",
        color: "white",
        padding: "4px",
        border: "1px solid red",
        borderRadius: "2px",
    };
    Object.assign(cancelButton.style, styles);

    cancelButton.onclick = () => {
        oneClickCancel(subscriptionItemHtml);
    };

    return cancelButton;
}

function oneClickCancel(subscriptionItemHtml: HTMLElement) {
    // click on the image
    const modalTrigger = subscriptionItemHtml.querySelector<HTMLElement>(
        ".subscription-image-container > span",
    );

    if (!modalTrigger) {
        console.error("Could not find modal trigger");
        return;
    }

    // start edit subscription modal observer
    observeEditSubscriptionModal();

    modalTrigger.click();
}
