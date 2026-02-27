import { useEffect, useRef, useState } from 'react';

export function useMinimumLoader(isLoading, minDurationMs = 900) {
    const [holdVisible, setHoldVisible] = useState(isLoading);
    const startedAtRef = useRef(null);

    useEffect(() => {
        let startId;
        let endId;

        if (isLoading) {
            startedAtRef.current = Date.now();

            if (!holdVisible) {
                startId = window.setTimeout(() => {
                    setHoldVisible(true);
                }, 0);
            }

            return () => {
                if (startId) window.clearTimeout(startId);
            };
        }

        if (!holdVisible) {
            startedAtRef.current = null;
            return undefined;
        }

        const startedAt = startedAtRef.current ?? Date.now();
        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(0, minDurationMs - elapsed);

        endId = window.setTimeout(() => {
            setHoldVisible(false);
            startedAtRef.current = null;
        }, remaining);

        return () => {
            if (endId) window.clearTimeout(endId);
        };
    }, [isLoading, minDurationMs, holdVisible]);

    return isLoading || holdVisible;
}
