const ONECLICK_CANCEL_SUBMITTED_KEY = "oneClickCancelSubmitted";

export function setOneClickCancelSessionKey() {
    sessionStorage.setItem(ONECLICK_CANCEL_SUBMITTED_KEY, "true");
}

export function hasOneClickCancelSessionKey() {
    return sessionStorage.getItem(ONECLICK_CANCEL_SUBMITTED_KEY) === "true";
}

export function removeOneClickCancelSessionKey() {
    sessionStorage.removeItem(ONECLICK_CANCEL_SUBMITTED_KEY);
}
