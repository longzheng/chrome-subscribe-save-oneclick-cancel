const ONECLICK_CANCEL_ATTRIBUTE = "data-oneclick-cancel";

const deliveriesContainer = document.getElementsByClassName(
    "deliveries-container",
)[0];

const deliveriesContainerObserver = new MutationObserver(() => {
    const subscriptionItems = Array.from(
        deliveriesContainer.querySelectorAll<HTMLElement>(".subscription-card"),
    );

    for (const subscriptionItem of subscriptionItems) {
        // verify there is a `data-subscription-id` attribute
        if (!subscriptionItem.dataset.subscriptionId) {
            console.error(
                "subscription-card did not contain a `data-subscription-id` attribute",
            );
            continue;
        }

        if (subscriptionItem.hasAttribute(ONECLICK_CANCEL_ATTRIBUTE)) {
            continue;
        }

        subscriptionItem.setAttribute(ONECLICK_CANCEL_ATTRIBUTE, "true");

        const cancelButton = getCancelButton(subscriptionItem);
        subscriptionItem.appendChild(cancelButton);
    }
});

deliveriesContainerObserver.observe(deliveriesContainer, {
    attributes: true,
    childList: true,
});

function getCancelButton(subscriptionItemHtml: HTMLElement) {
    const cancelButton = document.createElement("button");
    cancelButton.innerText = "One-click cancel";
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

    modalTrigger.click();

    // wait for popup
    // click cancel button
    // wait for cancel page
    // click cancel
    // refresh page? how do we go back?
}
