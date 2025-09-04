import {useCallback, useEffect, useRef, useState} from "react";

type FetchState<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
  aborted: boolean;
  retryCount: number;
  retrying: boolean;
};

interface FetchOptions extends RequestInit {
  maxRetries?: number;
  retryDelay?: number;
}

export function useFetch<T>() {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: false,
    error: null,
    aborted: false,
    retryCount: 0,
    retrying: false,
  });

  const controllerRef = useRef<AbortController | null>(null);
  const retriesRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function that runs when the component unmounts
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Cancel any pending retry
  const cancelRetry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      retrying: false,
    }));
  }, []);

  const fetchWithRetry = useCallback(
    async (
      url: string,
      options: FetchOptions = {},
      attempt: number = 1,
    ): Promise<{ data: T } | { aborted: boolean } | { error: Error }> => {
      const { maxRetries = 3, retryDelay = 1000, ...fetchOptions } = options;

      // Create a new controller for this request
      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        });

        if (!response.ok) {
          // Check if it's a "Model overloaded" error
          if (response.status === 503) {
            const errorData = await response.json();
            if (errorData.message === "Model overloaded") {
              throw new Error("Model overloaded");
            }
          }
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = (await response.json()) as T;
        setState({
          data,
          loading: false,
          error: null,
          aborted: false,
          retryCount: 0,
          retrying: false,
        });

        retriesRef.current = 0;
        return { data };
      } catch (error) {
        // Handle abort
        if (error instanceof DOMException && error.name === "AbortError") {
          setState((prev) => ({
            ...prev,
            loading: false,
            aborted: true,
            retrying: false,
          }));
          cancelRetry();
          return { aborted: true };
        }

        // Handle retries for other errors
        if (attempt < maxRetries) {
          // Calculate exponential backoff time
          const backoffTime = retryDelay * 2 ** (attempt - 1);

          console.log(
            `Attempt ${attempt} failed, retrying in ${backoffTime}ms...`,
          );

          setState((prev) => ({
            ...prev,
            retryCount: attempt,
            retrying: true,
            error: error instanceof Error ? error : new Error(String(error)),
          }));

          // Set up retry with exponential backoff
          return new Promise((resolve) => {
            retryTimeoutRef.current = setTimeout(() => {
              retryTimeoutRef.current = null;
              resolve(fetchWithRetry(url, options, attempt + 1));
            }, backoffTime);
          });
        } else {
          // Max retries reached, give up
          setState({
            data: null,
            loading: false,
            error: error instanceof Error ? error : new Error(String(error)),
            aborted: false,
            retryCount: attempt,
            retrying: false,
          });

          retriesRef.current = 0;
          return {
            error: error instanceof Error ? error : new Error(String(error)),
          };
        }
      } finally {
        // Clear the controller reference if it's the current one
        if (controllerRef.current === controller) {
          controllerRef.current = null;
        }
      }
    },
    [cancelRetry],
  );

  const execute = useCallback(
    async (url: string, options: FetchOptions = {}) => {
      // Abort any in-flight request
      if (controllerRef.current) {
        controllerRef.current.abort();
      }

      // Cancel any pending retry
      cancelRetry();

      // Reset state
      setState({
        data: null,
        loading: true,
        error: null,
        aborted: false,
        retryCount: 0,
        retrying: false,
      });

      retriesRef.current = 0;
      return fetchWithRetry(url, options);
    },
    [fetchWithRetry, cancelRetry],
  );

  const abort = useCallback(() => {
    if (controllerRef.current && state.loading) {
      controllerRef.current.abort();
    }
    cancelRetry();
  }, [state.loading, cancelRetry]);

  return {
    ...state,
    execute,
    abort,
    isAbortable: state.loading,
  };
}
