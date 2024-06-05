const maxRetries = 3;
const retryDelay = 500;

export async function retryFnAsync<T>(fn: () => Promise<T>) {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            return await fn();
        } catch (error) {
            console.error('Error in retryFn', error);
            retries++;
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
    }
    throw new Error('Max retries exceeded');
}
