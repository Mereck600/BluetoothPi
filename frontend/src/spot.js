import React, { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";
import SpotifyWebApi from "spotify-web-api-js";

// should split this up but for now all in app is fine
const spotifyApi = new SpotifyWebApi();

const getTokenFromUrl = () => {
  return window.location.hash
    .substring(1)
    .split("&")
    .reduce((initial, item) => {
      let parts = item.split("=");
      initial[parts[0]] = decodeURIComponent(parts[1]);
      return initial;
    }, {});
};

function spot() {
  const [spotifyToken, setSpotifyToken] = useState("");
  const [nowPlaying, setNowPlaying] = useState({});
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const tokenObj = getTokenFromUrl();
    const token = tokenObj.access_token;
    window.location.hash = "";

    console.log("This is our Spotify token:", token);

    if (token) {
      setSpotifyToken(token);
      spotifyApi.setAccessToken(token); // Use token directly

      spotifyApi.getMe().then((user) => {
        console.log(user);
      }).catch((error) => {
        console.error("Error fetching user:", error);
      });

      setLoggedIn(true);
    }
  }, []);

  const getNowPlaying = () => {
    spotifyApi.getMyCurrentPlaybackState().then((response) => {
      if (!response || !response.item) {
        console.warn("No song currently playing");
        return;
      }

      setNowPlaying({
        name: response.item.name,
        albumArt: response.item.album.images[0].url,
      });
    }).catch((error) => {
      console.error("Error fetching now playing:", error);
    });
  };

  return (
    <div className="App">
      {!loggedIn && <a href="http://localhost:8888">Login to Spotify</a>}
      {loggedIn && (
        <>
          <div>Now playing: {nowPlaying.name}</div>
          <div>
            {nowPlaying.albumArt && (
              <img src={nowPlaying.albumArt} style={{ height: 150 }} alt="Album Art" />
            )}
          </div>
          <button onClick={getNowPlaying}>Check Now Playing</button>
        </>
      )}
    </div>
  );
}

export default spot;
