import { ONECLICK_CANCEL_ATTRIBUTE } from './common';
import { observeEditSubscriptionModal } from './editSubscription';
import { buttonStyles } from './styles';

export const SUBSCRIPTION_CARD_SELECTOR = [
    '.subscription-card',
    '#subscriptionsDesktopGridLayout [data-mix-operations="editSubscriptionModalHandler"][data-edit-url]',
].join(', ');

export const ONECLICK_CANCEL_BUTTON_ATTRIBUTE = 'data-oneclick-cancel-button';

function getSubscriptionId(subscriptionCard: HTMLElement): string | null {
    if (subscriptionCard.dataset['subscriptionId']) {
        return subscriptionCard.dataset['subscriptionId'];
    }

    const editUrl = subscriptionCard.dataset['editUrl'];

    if (!editUrl) {
        return null;
    }

    return new URL(editUrl, document.baseURI).searchParams.get('subscriptionId');
}

function getEditSubscriptionModalTrigger(subscriptionCard: HTMLElement): HTMLElement | null {
    // Old layout: only the product image opens the edit dialog.
    const oldLayoutTrigger = subscriptionCard.querySelector<HTMLElement>('.subscription-image-container > span');

    if (oldLayoutTrigger) {
        return oldLayoutTrigger;
    }

    // New hub layout: the entire tile is the edit-dialog trigger.
    if (subscriptionCard.matches('[data-mix-operations="editSubscriptionModalHandler"]')) {
        return subscriptionCard;
    }

    return null;
}

export function addOneClickCancelButton(
    subscriptionCard: HTMLElement,
    editSubscriptionModalTrigger: HTMLElement,
): HTMLButtonElement {
    const existingButton = subscriptionCard.querySelector<HTMLButtonElement>(`[${ONECLICK_CANCEL_BUTTON_ATTRIBUTE}]`);

    if (existingButton) {
        return existingButton;
    }

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.innerText = 'One-click cancel';
    cancelButton.setAttribute(ONECLICK_CANCEL_BUTTON_ATTRIBUTE, 'true');

    Object.assign(cancelButton.style, buttonStyles, {
        display: 'block',
        width: '100%',
        marginTop: '10px',
    });

    cancelButton.addEventListener('click', (event) => {
        // New-layout tiles have their click handler on an ancestor. Avoid triggering
        // it once from the injected button and a second time below.
        event.preventDefault();
        event.stopPropagation();

        // the edit subscription modal is loaded asynchronously
        // start edit subscription modal observer to know when it is ready to trigger cancellation
        observeEditSubscriptionModal();

        editSubscriptionModalTrigger.click();
    });

    subscriptionCard.appendChild(cancelButton);

    return cancelButton;
}

export function processSubscriptionCard(subscriptionCard: HTMLElement): {
    subscriptionId: string;
    cancelButton: HTMLButtonElement;
} | null {
    // The old layout exposes the ID directly, while the new layout includes it
    // in the AJAX URL used to open the subscription dialog.
    const subscriptionId = getSubscriptionId(subscriptionCard);

    // there may be placeholder buttons for "Add new subscription"
    if (!subscriptionId) {
        return null;
    }

    // there is a notification on this subscription
    // it may be a notification for a subscription that has already been cancelled
    if (subscriptionCard.querySelector('.subscription-notification-title-container.info-notification')) {
        return null;
    }

    const editSubscriptionModalTrigger = getEditSubscriptionModalTrigger(subscriptionCard);

    if (!editSubscriptionModalTrigger) {
        return null;
    }

    // if this card has already been processed, return its button so a newly
    // created observer/map can still associate it with the subscription ID.
    if (subscriptionCard.hasAttribute(ONECLICK_CANCEL_ATTRIBUTE)) {
        const cancelButton = subscriptionCard.querySelector<HTMLButtonElement>(`[${ONECLICK_CANCEL_BUTTON_ATTRIBUTE}]`);

        return cancelButton ? { subscriptionId, cancelButton } : null;
    }

    subscriptionCard.setAttribute(ONECLICK_CANCEL_ATTRIBUTE, 'true');
    const cancelButton = addOneClickCancelButton(subscriptionCard, editSubscriptionModalTrigger);

    return { subscriptionId, cancelButton };
}
