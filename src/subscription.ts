import { setOneClickCancelSessionKey } from "./sessionStorage";

const popoverModalSelector = ".a-popover-modal .editSubscriptionContent";
const subActionSelector = ".subActionContent";

const modalObserver = new MutationObserver((_, observer) => {
    const popoverModal = document.querySelector(popoverModalSelector);

    if (!popoverModal) {
        return;
    }

    // the button will trigger navigating to the cancel page
    // the span inside the button opens the cancel page inside the existing modal
    const cancelButton = popoverModal.querySelector<HTMLElement>(
        ".t-action-type-CANCEL > span",
    );

    if (!cancelButton) {
        console.error("Could not find cancel button");
        return;
    }

    observer.disconnect();

    const subActionContent =
        popoverModal.querySelector<HTMLElement>(subActionSelector);

    if (!subActionContent) {
        console.error("Could not find subActionContainer");
        return;
    }

    subActionObserver.observe(subActionContent, {
        childList: true,
    });

    cancelButton.click();
});

export function observeEditSubscriptionModal() {
    modalObserver.observe(document.body, {
        childList: true,
        subtree: true,
    });
}

const subActionObserver = new MutationObserver((_, observer) => {
    const cancelButton = document.querySelector<HTMLFormElement>(
        `${popoverModalSelector} ${subActionSelector} form input[type='submit']`,
    );

    if (!cancelButton) {
        return;
    }

    setOneClickCancelSessionKey();

    cancelButton.click();

    observer.disconnect();
});
