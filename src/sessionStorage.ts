import { retryFnAsync } from './retry';

const ONECLICK_CANCEL_SUBMITTED_KEY = 'oneClickCancelSubmitted';
const ONECLICK_CANCEL_QUEUE_KEY = 'oneClickCancelQueue';

// helpers to automatically retry `chrome.storage...` on failure
// it has been observed in the wild that at runtime `chrome.storage` sometimes returns undefined for unknown reasons
async function chromeStorageLocalSetWithRetry(param: Parameters<typeof chrome.storage.local.set>[0]) {
    return retryFnAsync(() => chrome.storage.local.set(param));
}

async function chromeStorageLocalGetWithRetry(param: Parameters<typeof chrome.storage.local.get>[0]) {
    return retryFnAsync(() => chrome.storage.local.get(param));
}

export async function setCancelSubmitted() {
    await chromeStorageLocalSetWithRetry({ [ONECLICK_CANCEL_SUBMITTED_KEY]: true });
}

export async function hasCancelSubmitted() {
    const value = await chromeStorageLocalGetWithRetry(ONECLICK_CANCEL_SUBMITTED_KEY);

    return value[ONECLICK_CANCEL_SUBMITTED_KEY] === true;
}

export async function removeCancelSubmitted() {
    await retryFnAsync(() => chrome.storage.local.remove(ONECLICK_CANCEL_SUBMITTED_KEY));
}

export async function getCancelQueue(): Promise<string[]> {
    const value = await chromeStorageLocalGetWithRetry(ONECLICK_CANCEL_QUEUE_KEY);

    const storageValue = value[ONECLICK_CANCEL_QUEUE_KEY] as unknown;

    if (!storageValue) return [];

    if (!Array.isArray(storageValue)) return [];

    return storageValue as string[];
}

export async function addToCancelQueue(subscriptionIds: string[]) {
    const queue = await getCancelQueue();

    queue.push(...subscriptionIds);

    await chromeStorageLocalSetWithRetry({
        [ONECLICK_CANCEL_QUEUE_KEY]: queue,
    });
}

export async function removeFromCancelQueue(subscriptionId: string) {
    const queue = await getCancelQueue();

    const newQueue = queue.filter((id) => id !== subscriptionId);

    await chromeStorageLocalSetWithRetry({ [ONECLICK_CANCEL_QUEUE_KEY]: newQueue });
}
