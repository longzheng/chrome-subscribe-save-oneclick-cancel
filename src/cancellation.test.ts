// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const nativeMutationObserver = globalThis.MutationObserver;
const observers: MutationObserver[] = [];
const storage: Record<string, unknown> = {};
const assign = vi.fn();
const submittedIds: string[] = [];

function disconnectObservers() {
    for (const observer of observers) {
        observer.disconnect();
    }

    observers.length = 0;
}

beforeEach(() => {
    vi.resetModules();
    assign.mockClear();
    submittedIds.length = 0;

    for (const key of Object.keys(storage)) {
        delete storage[key];
    }

    vi.stubGlobal(
        'MutationObserver',
        class extends nativeMutationObserver {
            constructor(callback: MutationCallback) {
                super(callback);
                observers.push(this);
            }
        },
    );
    vi.stubGlobal('location', { search: '?ref_=nav_AccountFlyout_sns', assign });
    vi.stubGlobal(
        'confirm',
        vi.fn(() => true),
    );
    vi.stubGlobal('chrome', {
        storage: {
            local: {
                get: async (key: string) => ({ [key]: storage[key] }),
                set: async (values: Record<string, unknown>) => {
                    Object.assign(storage, values);
                },
                remove: async (key: string) => {
                    delete storage[key];
                },
            },
        },
    });
    document.body.innerHTML = '';
});

afterEach(() => {
    disconnectObservers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

function showSuccess(product = 'Test product') {
    document.querySelector('#page-level-success-alert')?.remove();
    document.body.insertAdjacentHTML(
        'afterbegin',
        `<div id="page-level-success-alert" class="a-box a-alert a-alert-success">
            <div class="a-box-inner a-alert-container">
                <h4 class="a-alert-heading">Cancellation confirmed</h4>
                <div class="a-alert-content">You have cancelled your subscription to <strong>${product}</strong></div>
            </div>
        </div>`,
    );
}

async function loadSubscriptions(subscriptionIds: string[]) {
    // Model a full navigation: module state and observers reset, Chrome storage survives.
    disconnectObservers();
    vi.resetModules();
    document.body.innerHTML = `
        <div id="subscriptions-desktop-section-heading"><div id="cardHeader"></div></div>
        <div id="subscriptionsDesktopGridLayout"></div>`;
    const grid = document.querySelector('#subscriptionsDesktopGridLayout');

    for (const subscriptionId of subscriptionIds) {
        const card = document.createElement('div');
        card.dataset['mixOperations'] = 'editSubscriptionModalHandler';
        card.dataset['editUrl'] = `/auto-deliveries/ajax/editSubscription?subscriptionId=${subscriptionId}`;
        card.textContent = subscriptionId;
        card.addEventListener('click', () => {
            document.querySelector('.a-popover-modal')?.remove();
            const modal = document.createElement('div');
            modal.className = 'a-popover-modal';
            modal.setAttribute('aria-hidden', 'false');
            modal.innerHTML = `
                <div class="editSubscriptionContent">
                    <a class="t-action-type-CANCEL" href="#cancel">Cancel subscription</a>
                    <div class="subActionContent"></div>
                </div>`;
            modal.querySelector('a')?.addEventListener('click', (event) => {
                event.preventDefault();
                const form = document.createElement('form');
                form.action = `https://www.amazon.com.au/auto-deliveries/ajax/cancelSubscriptionAction?subscriptionId=${subscriptionId}`;
                form.innerHTML = '<button type="submit">Confirm cancellation</button>';
                form.addEventListener('submit', (submitEvent) => {
                    submitEvent.preventDefault();
                    // Progress must be durable before Amazon receives the submission.
                    expect(storage['oneClickCancelSubmitted']).toBeTruthy();
                    submittedIds.push(subscriptionId);
                });
                modal.querySelector('.subActionContent')?.appendChild(form);
            });
            document.body.appendChild(modal);
        });
        grid?.appendChild(card);
    }

    await import('./content_script');
    await vi.waitFor(() => {
        expect(document.querySelector('[data-oneclick-cancel-all-button]')).not.toBeNull();
    });
}

describe('cancellation queue', () => {
    it('continues through all seven subscriptions after AJAX confirmations without a success URL', async () => {
        const subscriptionIds = Array.from({ length: 7 }, (_, index) => `subscription-${index + 1}`);

        for (const [index, subscriptionId] of subscriptionIds.entries()) {
            await loadSubscriptions(subscriptionIds.slice(index));

            if (index === 0) {
                document.querySelector<HTMLButtonElement>('[data-oneclick-cancel-all-button]')?.click();
            }

            await vi.waitFor(() => {
                expect(submittedIds).toEqual(subscriptionIds.slice(0, index + 1));
            });
            expect(assign).toHaveBeenCalledTimes(index);

            // Amazon leaves the old subscription cards in place after AJAX success.
            showSuccess(subscriptionId);

            await vi.waitFor(() => {
                expect(assign).toHaveBeenCalledTimes(index + 1);
            });
            expect(assign).toHaveBeenLastCalledWith('/auto-deliveries/subscriptionList');
            expect(storage['oneClickCancelQueue']).toEqual(subscriptionIds.slice(index + 1));
            expect(storage['oneClickCancelSubmitted']).toBeUndefined();
        }

        expect(new Set(submittedIds).size).toBe(7);
    });

    it('keeps the queue and submitted ID when Amazon reports an error', async () => {
        await loadSubscriptions(['first', 'second']);
        document.querySelector<HTMLButtonElement>('[data-oneclick-cancel-all-button]')?.click();

        await vi.waitFor(() => {
            expect(submittedIds).toEqual(['first']);
        });

        document.body.insertAdjacentHTML('afterbegin', '<div class="a-alert-error">Cancellation failed</div>');
        await new Promise((resolve) => setTimeout(resolve, 20));

        expect(storage['oneClickCancelQueue']).toEqual(['first', 'second']);
        expect(storage['oneClickCancelSubmitted']).toBe('first');
        expect(assign).not.toHaveBeenCalled();
    });

    it('handles an individual cancellation when there is no bulk queue', async () => {
        await loadSubscriptions(['only']);
        document.querySelector<HTMLButtonElement>('[data-oneclick-cancel-button]')?.click();
        await vi.waitFor(() => {
            expect(submittedIds).toEqual(['only']);
        });

        showSuccess();
        await vi.waitFor(() => {
            expect(assign).toHaveBeenCalledOnce();
        });
        expect(storage['oneClickCancelQueue']).toEqual([]);
        expect(storage['oneClickCancelSubmitted']).toBeUndefined();
    });
});

describe('cancellation completion', () => {
    it('resumes a confirmed cancellation after a reload without URL parameters', async () => {
        storage['oneClickCancelSubmitted'] = 'second';
        storage['oneClickCancelQueue'] = ['first', 'second', 'third'];
        showSuccess();
        const { resumeCancelCompletion } = await import('./cancelCompletion');

        expect(await resumeCancelCompletion()).toBe(true);
        expect(storage['oneClickCancelQueue']).toEqual(['first', 'third']);
        expect(storage['oneClickCancelSubmitted']).toBeUndefined();
        expect(assign).toHaveBeenCalledWith('/auto-deliveries/subscriptionList');
    });

    it('supports legacy redirect responses and boolean submission flags', async () => {
        storage['oneClickCancelSubmitted'] = true;
        storage['oneClickCancelQueue'] = ['first', 'second'];
        location.search = '?snsActionCompleted=cancelSubscription&subscriptionId=first';
        const { resumeCancelCompletion } = await import('./cancelCompletion');

        expect(await resumeCancelCompletion()).toBe(true);
        expect(storage['oneClickCancelQueue']).toEqual(['second']);
        expect(storage['oneClickCancelSubmitted']).toBeUndefined();
        expect(assign).toHaveBeenCalledWith('/auto-deliveries/subscriptionList');
    });

    it('uses the submitted ID when a redirect omits the subscription ID', async () => {
        storage['oneClickCancelSubmitted'] = 'first';
        storage['oneClickCancelQueue'] = ['first', 'second'];
        location.search = '?snsActionCompleted=cancelSubscription';
        const { resumeCancelCompletion } = await import('./cancelCompletion');

        expect(await resumeCancelCompletion()).toBe(true);
        expect(storage['oneClickCancelQueue']).toEqual(['second']);
    });

    it('ignores success banners from cancellations made outside the extension', async () => {
        storage['oneClickCancelQueue'] = ['first'];
        showSuccess();
        const { resumeCancelCompletion } = await import('./cancelCompletion');

        expect(await resumeCancelCompletion()).toBe(false);
        expect(storage['oneClickCancelQueue']).toEqual(['first']);
        expect(assign).not.toHaveBeenCalled();
    });

    it('ignores an old success banner until Amazon updates it for the next cancellation', async () => {
        storage['oneClickCancelSubmitted'] = 'second';
        storage['oneClickCancelQueue'] = ['second', 'third'];
        showSuccess('Previous product');
        const { observeCancelCompletion } = await import('./cancelCompletion');
        observeCancelCompletion();

        document.body.appendChild(document.createElement('div'));
        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(assign).not.toHaveBeenCalled();
        expect(storage['oneClickCancelQueue']).toEqual(['second', 'third']);

        const content = document.querySelector('#page-level-success-alert .a-alert-content');
        if (content) {
            content.textContent = 'Second cancellation confirmed';
        }

        await vi.waitFor(() => {
            expect(assign).toHaveBeenCalledOnce();
        });
        expect(storage['oneClickCancelQueue']).toEqual(['third']);
    });
});
