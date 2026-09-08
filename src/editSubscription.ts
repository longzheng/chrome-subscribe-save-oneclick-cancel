import { setCancelSubmitted } from './sessionStorage';

const popoverModalSelector = '.a-popover-modal .editSubscriptionContent';
const subActionSelector = '.subActionContent';

let activePopoverModal: Element | null = null;

const modalObserver = new MutationObserver((_, observer) => {
    processEditSubscriptionModal(observer);
});

function processEditSubscriptionModal(observer?: MutationObserver) {
    const popoverModal = Array.from(document.querySelectorAll(popoverModalSelector)).find(
        (content) => content.closest('.a-popover-modal')?.getAttribute('aria-hidden') !== 'true',
    );

    if (!popoverModal) {
        return false;
    }

    const cancelButton = popoverModal.querySelector<HTMLElement>('.t-action-type-CANCEL');

    if (!cancelButton) {
        return false;
    }

    const subActionContent = popoverModal.querySelector<HTMLElement>(subActionSelector);

    if (!subActionContent) {
        return false;
    }

    observer?.disconnect();
    activePopoverModal = popoverModal;

    subActionObserver.observe(subActionContent, {
        childList: true,
        subtree: true,
    });

    cancelButton.click();

    return true;
}

export function observeEditSubscriptionModal() {
    if (processEditSubscriptionModal()) {
        return;
    }

    modalObserver.observe(document.body, {
        childList: true,
        subtree: true,
    });
}

const subActionObserver = new MutationObserver((_, observer) => {
    void (async () => {
        const cancelButton = activePopoverModal?.querySelector<HTMLElement>(
            `${subActionSelector} form input[type='submit'], ${subActionSelector} form button[type='submit']`,
        );

        if (!cancelButton) {
            return;
        }

        await setCancelSubmitted();

        cancelButton.click();

        observer.disconnect();
        activePopoverModal = null;
    })();
});
