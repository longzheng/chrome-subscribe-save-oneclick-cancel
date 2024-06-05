import { getCancelQueue } from "./sessionStorage";

// since the MutationObserver may run multiple times
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

    // loop through each item in the cancel queue
    for (const subscriptionId of cancelQueue) {
        const cancelButton =
            itemCancelButtonButtonBySubscriptionId.get(subscriptionId);

        // due to the asynchronous nature of the page loading
        // there's a chance the subscription hasn't been loaded/rendered onto the page yet
        // if we can't find the cancel button, just skip this item
        // we assume a future trigger from the MutationObserver will handle this
        // worst case scenario the subscription is never found and we try forever
        if (!cancelButton) {
            continue;
        }

        // click on the cancel button
        cancelButton.click();
        return;
    }
}
