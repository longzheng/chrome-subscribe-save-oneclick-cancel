import { getCancelSubmitted, removeCancelSubmitted, removeFromCancelQueue } from './sessionStorage';

const CANCEL_SUCCESS_SELECTOR = '#page-level-success-alert.a-alert-success';

async function completeCancellation() {
    const submitted = await getCancelSubmitted();

    if (!submitted) {
        return false;
    }

    const subscriptionId =
        typeof submitted === 'string' ? submitted : new URLSearchParams(location.search).get('subscriptionId');

    if (!subscriptionId) {
        return false;
    }

    // Persist progress before navigating. The hub can leave the cancelled card
    // on screen, so reload the list to obtain fresh cards for the remaining queue.
    await removeFromCancelQueue(subscriptionId);
    await removeCancelSubmitted();
    location.assign('/auto-deliveries/subscriptionList');
    return true;
}

export async function resumeCancelCompletion() {
    const searchParams = new URLSearchParams(location.search);

    if (
        searchParams.get('snsActionCompleted') !== 'cancelSubscription' &&
        !document.querySelector(CANCEL_SUCCESS_SELECTOR)
    ) {
        return false;
    }

    return completeCancellation();
}

export function observeCancelCompletion() {
    // A previous cancellation's banner may still be displayed. Only respond to
    // a new banner or an update to it after the next form is submitted.
    const previousSuccessAlert = document.querySelector(CANCEL_SUCCESS_SELECTOR);
    const observer = new MutationObserver((mutations) => {
        const successAlert = document.querySelector(CANCEL_SUCCESS_SELECTOR);

        if (!successAlert) {
            return;
        }

        const successAlertUpdated =
            successAlert !== previousSuccessAlert ||
            mutations.some(
                (mutation) =>
                    successAlert.contains(mutation.target) ||
                    Array.from(mutation.addedNodes).some((node) => node.contains(successAlert)),
            );

        if (!successAlertUpdated) {
            return;
        }

        observer.disconnect();
        void completeCancellation().catch((error: unknown) => {
            console.error('Could not finish one-click cancellation', error);
        });
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}
