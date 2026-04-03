import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { sanitizeArtistDirectoryPayload } from "../app/api/admin/artists/route.js";
import { ownsDemoFileAsset } from "../app/api/files/asset/route.js";
import { calculateOwnedArtistSharePercent } from "../lib/artist-balance";

describe("artist directory sanitization", () => {
  test("removes PII for limited artist directory viewers", () => {
    const sanitized = sanitizeArtistDirectoryPayload({
      id: "artist_1",
      name: "Lost Boy",
      email: "artist@example.com",
      user: {
        id: "user_1",
        stageName: "Lost Boy",
        fullName: "Real Name",
        legalName: "Legal Name",
        phoneNumber: "+90 555 000 00 00",
        address: "Istanbul",
        email: "artist@example.com",
      },
    });

    assert.equal(sanitized.email, null);
    assert.deepEqual(sanitized.user, {
      id: "user_1",
      stageName: "Lost Boy",
      fullName: null,
      legalName: null,
      phoneNumber: null,
      address: null,
      email: null,
    });
  });

  test("preserves non-sensitive artist fields", () => {
    const sanitized = sanitizeArtistDirectoryPayload({
      id: "artist_2",
      name: "Night Runner",
      monthlyListeners: 125000,
      _count: { contracts: 3 },
      user: null,
    });

    assert.equal(sanitized.id, "artist_2");
    assert.equal(sanitized.name, "Night Runner");
    assert.equal(sanitized.monthlyListeners, 125000);
    assert.deepEqual(sanitized._count, { contracts: 3 });
    assert.equal(sanitized.user, null);
  });
});

describe("demo file ownership", () => {
  test("accepts direct user ownership", () => {
    assert.equal(
      ownsDemoFileAsset({
        viewerUserId: "user_1",
        viewerArtistProfileId: null,
        demoUserId: "user_1",
        demoArtistProfileId: null,
      }),
      true,
    );
  });

  test("accepts linked artist profile ownership", () => {
    assert.equal(
      ownsDemoFileAsset({
        viewerUserId: "user_2",
        viewerArtistProfileId: "artist_profile_7",
        demoUserId: "user_1",
        demoArtistProfileId: "artist_profile_7",
      }),
      true,
    );
  });

  test("rejects unrelated viewers", () => {
    assert.equal(
      ownsDemoFileAsset({
        viewerUserId: "user_3",
        viewerArtistProfileId: "artist_profile_9",
        demoUserId: "user_1",
        demoArtistProfileId: "artist_profile_7",
      }),
      false,
    );
  });

  test("rejects empty ownership context", () => {
    assert.equal(
      ownsDemoFileAsset({
        viewerUserId: null,
        viewerArtistProfileId: null,
        demoUserId: null,
        demoArtistProfileId: null,
      }),
      false,
    );
  });
});

describe("artist balance share calculation", () => {
  test("gives primary artist the remaining share when no splits exist", () => {
    const percent = calculateOwnedArtistSharePercent({
      viewer: {
        userId: "user_1",
        userEmail: "artist@example.com",
        artistId: "artist_1",
      },
      contract: {
        userId: "user_1",
        primaryArtistEmail: "artist@example.com",
        artist: { id: "artist_1", userId: "user_1", email: "artist@example.com" },
      },
      splits: [],
    });

    assert.equal(percent, 100);
  });

  test("gives collaborator only their explicit split", () => {
    const percent = calculateOwnedArtistSharePercent({
      viewer: {
        userId: "collab_1",
        userEmail: "collab@example.com",
        artistId: "artist_2",
      },
      contract: {
        userId: "primary_1",
        primaryArtistEmail: "primary@example.com",
        artist: { id: "artist_1", userId: "primary_1", email: "primary@example.com" },
      },
      splits: [
        {
          percentage: 25,
          userId: "collab_1",
          artistId: "artist_2",
          email: "collab@example.com",
          user: { email: "collab@example.com" },
        },
      ],
    });

    assert.equal(percent, 25);
  });

  test("gives primary artist the remainder after collaborator splits", () => {
    const percent = calculateOwnedArtistSharePercent({
      viewer: {
        userId: "primary_1",
        userEmail: "primary@example.com",
        artistId: "artist_1",
      },
      contract: {
        userId: "primary_1",
        primaryArtistEmail: "primary@example.com",
        artist: { id: "artist_1", userId: "primary_1", email: "primary@example.com" },
      },
      splits: [
        {
          percentage: 20,
          userId: "collab_1",
          artistId: "artist_2",
          email: "collab@example.com",
          user: { email: "collab@example.com" },
        },
        {
          percentage: 15,
          userId: null,
          artistId: null,
          email: "writer@example.com",
          user: { email: null },
        },
      ],
    });

    assert.equal(percent, 65);
  });

  test("matches split ownership by email when no ids are linked", () => {
    const percent = calculateOwnedArtistSharePercent({
      viewer: {
        userId: null,
        userEmail: "writer@example.com",
        artistId: null,
      },
      contract: {
        userId: "primary_1",
        primaryArtistEmail: "primary@example.com",
        artist: { id: "artist_1", userId: "primary_1", email: "primary@example.com" },
      },
      splits: [
        {
          percentage: 15,
          userId: null,
          artistId: null,
          email: "writer@example.com",
          user: { email: null },
        },
      ],
    });

    assert.equal(percent, 15);
  });

  test("returns zero when viewer owns neither primary contract nor splits", () => {
    const percent = calculateOwnedArtistSharePercent({
      viewer: {
        userId: "outsider_1",
        userEmail: "outsider@example.com",
        artistId: "artist_9",
      },
      contract: {
        userId: "primary_1",
        primaryArtistEmail: "primary@example.com",
        artist: { id: "artist_1", userId: "primary_1", email: "primary@example.com" },
      },
      splits: [
        {
          percentage: 25,
          userId: "collab_1",
          artistId: "artist_2",
          email: "collab@example.com",
          user: { email: "collab@example.com" },
        },
      ],
    });

    assert.equal(percent, 0);
  });

  test("never produces a negative primary remainder", () => {
    const percent = calculateOwnedArtistSharePercent({
      viewer: {
        userId: "primary_1",
        userEmail: "primary@example.com",
        artistId: "artist_1",
      },
      contract: {
        userId: "primary_1",
        primaryArtistEmail: "primary@example.com",
        artist: { id: "artist_1", userId: "primary_1", email: "primary@example.com" },
      },
      splits: [
        {
          percentage: 70,
          userId: "collab_1",
          artistId: "artist_2",
          email: "collab@example.com",
          user: { email: "collab@example.com" },
        },
        {
          percentage: 40,
          userId: "collab_2",
          artistId: "artist_3",
          email: "collab2@example.com",
          user: { email: "collab2@example.com" },
        },
      ],
    });

    assert.equal(percent, 0);
  });
});
