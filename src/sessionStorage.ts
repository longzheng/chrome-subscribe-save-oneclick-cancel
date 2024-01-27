const ONECLICK_CANCEL_SUBMITTED_KEY = "oneClickCancelSubmitted";
const ONECLICK_CANCEL_QUEUE_KEY = "oneClickCancelQueue";

export function setCancelSubmitted() {
    sessionStorage.setItem(ONECLICK_CANCEL_SUBMITTED_KEY, "true");
}

export function hasCancelSubmitted() {
    return sessionStorage.getItem(ONECLICK_CANCEL_SUBMITTED_KEY) === "true";
}

export function removeCancelSubmitted() {
    sessionStorage.removeItem(ONECLICK_CANCEL_SUBMITTED_KEY);
}

export function getCancelQueue(): string[] {
    const storageValue = sessionStorage.getItem(ONECLICK_CANCEL_QUEUE_KEY);

    if (!storageValue) return [];

    const parsed = JSON.parse(storageValue);

    if (!Array.isArray(parsed)) return [];

    return parsed;
}

export function addToCancelQueue(subscriptionIds: string[]) {
    const queue = getCancelQueue();

    queue.push(...subscriptionIds);

    sessionStorage.setItem(ONECLICK_CANCEL_QUEUE_KEY, JSON.stringify(queue));
}

export function removeFromCancelQueue(subscriptionId: string) {
    const queue = getCancelQueue();

    const newQueue = queue.filter((id) => id !== subscriptionId);

    sessionStorage.setItem(ONECLICK_CANCEL_QUEUE_KEY, JSON.stringify(newQueue));
}
