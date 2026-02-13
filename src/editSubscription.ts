import { setCancelSubmitted } from './sessionStorage';

const popoverModalSelector = '.a-popover-modal .editSubscriptionContent';
const subActionSelector = '.subActionContent';

const modalObserver = new MutationObserver((_, observer) => {
    const popoverModal = document.querySelector(popoverModalSelector);

    if (!popoverModal) {
        return;
    }

    const cancelButton = popoverModal.querySelector<HTMLElement>('.t-action-type-CANCEL');

    if (!cancelButton) {
        throw new Error('Could not find cancel button');
    }

    observer.disconnect();

    const subActionContent = popoverModal.querySelector<HTMLElement>(subActionSelector);

    if (!subActionContent) {
        throw new Error('Could not find subActionContainer');
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
    void (async () => {
        const cancelButton = document.querySelector<HTMLFormElement>(
            `${popoverModalSelector} ${subActionSelector} form input[type='submit']`,
        );

        if (!cancelButton) {
            return;
        }

        await setCancelSubmitted();

        cancelButton.click();

        observer.disconnect();
    })();
});
