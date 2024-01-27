const ONECLICK_CANCEL_KEY = "oneClickCancel";

export function setOneClickCancelSessionKey() {
    sessionStorage.setItem(ONECLICK_CANCEL_KEY, "true");
}

export function hasOneClickCancelSessionKey() {
    return sessionStorage.getItem(ONECLICK_CANCEL_KEY) === "true";
}

export function removeOneClickCancelSessionKey() {
    sessionStorage.removeItem(ONECLICK_CANCEL_KEY);
}
