const ONECLICK_CANCEL_SUBMITTED_KEY = "oneClickCancelSubmitted";
const ONECLICK_CANCEL_QUEUE_KEY = "oneClickCancelQueue";

export async function setCancelSubmitted() {
    await chrome.storage.local.set({ [ONECLICK_CANCEL_SUBMITTED_KEY]: true });
}

export async function hasCancelSubmitted() {
    const value = await chrome.storage.local.get(ONECLICK_CANCEL_SUBMITTED_KEY);

    return value[ONECLICK_CANCEL_SUBMITTED_KEY] === true;
}

export async function removeCancelSubmitted() {
    await chrome.storage.local.remove(ONECLICK_CANCEL_SUBMITTED_KEY);
}

export async function getCancelQueue(): Promise<string[]> {
    const value = await chrome.storage.local.get(ONECLICK_CANCEL_QUEUE_KEY);

    const storageValue = value[ONECLICK_CANCEL_QUEUE_KEY] as unknown;

    if (!storageValue) return [];

    if (!Array.isArray(storageValue)) return [];

    return storageValue as string[];
}

export async function addToCancelQueue(subscriptionIds: string[]) {
    const queue = await getCancelQueue();

    queue.push(...subscriptionIds);

    await chrome.storage.local.set({
        [ONECLICK_CANCEL_QUEUE_KEY]: queue,
    });
}

export async function removeFromCancelQueue(subscriptionId: string) {
    const queue = await getCancelQueue();

    const newQueue = queue.filter((id) => id !== subscriptionId);

    await chrome.storage.local.set({ [ONECLICK_CANCEL_QUEUE_KEY]: newQueue });
}
