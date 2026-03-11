"use client";

import { useCallback, useEffect, useState } from "react";

const EMPTY_DISCORD_LINK = {
    linked: false,
    discordUserId: null,
    discordUsername: null,
    linkedAt: null,
    loading: true
};

async function readDiscordLink(userId) {
    if (!userId) {
        return { ...EMPTY_DISCORD_LINK, loading: false };
    }

    const res = await fetch('/api/profile/discord-link');
    if (!res.ok) {
        return { ...EMPTY_DISCORD_LINK, loading: false };
    }

    const data = await res.json();
    return {
        linked: Boolean(data?.linked),
        discordUserId: data?.discordUserId || null,
        discordUsername: data?.discordUsername || null,
        linkedAt: data?.linkedAt || null,
        loading: false
    };
}

export function useDiscordLink(userId) {
    const [discordLink, setDiscordLink] = useState(EMPTY_DISCORD_LINK);

    const refreshDiscordLink = useCallback(async () => {
        try {
            const nextLink = await readDiscordLink(userId);
            setDiscordLink(nextLink);
            return nextLink;
        } catch (error) {
            console.error(error);
            setDiscordLink({ ...EMPTY_DISCORD_LINK, loading: false });
            return null;
        }
    }, [userId]);

    useEffect(() => {
        let cancelled = false;

        async function loadDiscordLink() {
            try {
                const nextLink = await readDiscordLink(userId);
                if (!cancelled) {
                    setDiscordLink(nextLink);
                }
            } catch (error) {
                console.error(error);
                if (!cancelled) {
                    setDiscordLink({ ...EMPTY_DISCORD_LINK, loading: false });
                }
            }
        }

        void loadDiscordLink();

        return () => {
            cancelled = true;
        };
    }, [userId]);

    return {
        discordLink,
        hasDiscordLink: Boolean(discordLink?.linked && discordLink?.discordUserId),
        refreshDiscordLink,
        setDiscordLink
    };
}
