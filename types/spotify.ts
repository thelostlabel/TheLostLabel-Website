export type SpotifyAuthToken = {
  access_token: string;
  expires_in?: number;
  token_type?: string;
};

export type SpotifyImage = {
  url: string;
  height?: number | null;
  width?: number | null;
};

export type SpotifyFollowers = {
  total?: number | null;
};

export type SpotifyArtist = {
  id: string;
  name: string;
  external_urls?: {
    spotify?: string;
  };
  images?: SpotifyImage[];
  followers?: SpotifyFollowers;
  popularity?: number | null;
};

export type SpotifyAlbum = {
  id: string;
  images?: SpotifyImage[];
  external_urls?: {
    spotify?: string;
  };
  release_date?: string;
};

export type SpotifyTrack = {
  id: string;
  name: string;
  album?: SpotifyAlbum | null;
  artists?: SpotifyArtist[];
  external_urls?: {
    spotify?: string;
  };
  popularity?: number | null;
  preview_url?: string | null;
};

export type SpotifyPlaylistTrackItem = {
  track?: SpotifyTrack | null;
};

export type SpotifySearchArtistsResponse = {
  artists?: {
    items?: SpotifyArtist[];
  };
};

export type SpotifyArtistsResponse = {
  artists?: SpotifyArtist[];
};

export type SpotifyArtistAlbumsResponse = {
  items?: SpotifyAlbum[];
};

export type SpotifyArtistSearchMatch = {
  id: string;
  name: string;
  spotifyUrl: string;
  image: string | null;
  followers: number;
  popularity: number | null;
  confidence: number;
};
