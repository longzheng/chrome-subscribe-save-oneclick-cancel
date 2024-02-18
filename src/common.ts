// since the MutationObserver may run multiple times

import { getCancelQueue, removeFromCancelQueue } from "./sessionStorage";

// we don't want to re-add the cancel button if it's already been added
export const ONECLICK_CANCEL_ATTRIBUTE = "data-oneclick-cancel";

export async function processCancelQueue(
    itemCancelButtonButtonBySubscriptionId: Map<string, HTMLButtonElement>,
) {
    // no cancel button found, page may not have finished loading
    if (itemCancelButtonButtonBySubscriptionId.size === 0) {
        return;
    }

    const cancelQueue = await getCancelQueue();

    if (cancelQueue.length === 0) {
        return;
    }

    const firstItem = cancelQueue[0];

    const cancelButton = itemCancelButtonButtonBySubscriptionId.get(firstItem);

    if (!cancelButton) {
        // if cancel button is not found, remove from queue and try again
        await removeFromCancelQueue(firstItem);
        await processCancelQueue(itemCancelButtonButtonBySubscriptionId);
        return;
    }

    // click on the cancel button
    cancelButton.click();
}
