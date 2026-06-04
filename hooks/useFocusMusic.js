import { useState, useRef, useEffect, useCallback } from 'react';
import { Audio } from 'expo-av';

const BASE = 'https://npptpnrhzobyifsdoyvc.supabase.co/storage/v1/object/public/focus-music';

export const MUSIC_STATIONS = [
  { id: 'off',  label: 'Off',   emoji: '🔕', tracks: [] },
  {
    id: 'lofi', label: 'Focus', emoji: '🌙',
    tracks: [
      `${BASE}/leberch.mp3`,
      `${BASE}/mirostar.mp3`,
      `${BASE}/mirostar2.mp3`,
      `${BASE}/mondamusic.mp3`,
      `${BASE}/mondamusic3.mp3`,
      `${BASE}/prettyjohn1.mp3`,
      `${BASE}/watermello.mp3`,
      `${BASE}/watermello2.mp3`,
    ],
  },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const VOLUME_STEPS = [0.15, 0.35, 0.55, 0.75, 1.0];

export function useFocusMusic() {
  const [stationId, setStationId] = useState('off');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volumeStep, setVolumeStep] = useState(1); // index into VOLUME_STEPS, default 0.35
  const soundRef = useRef(null);
  const playlistRef = useRef([]);
  const trackIndexRef = useRef(0);

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });
    return () => { soundRef.current?.unloadAsync(); };
  }, []);

  const unload = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  const playTrack = useCallback(async (url) => {
    if (!url) return;
    setIsLoading(true);
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true, isLooping: false, volume: VOLUME_STEPS[volumeStep] }
      );
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        setIsPlaying(status.isPlaying);
        setIsLoading(false);

        // Auto-advance to next track when current one finishes
        if (status.didJustFinish) {
          const playlist = playlistRef.current;
          if (playlist.length > 1) {
            trackIndexRef.current = (trackIndexRef.current + 1) % playlist.length;
            unload().then(() => playTrack(playlist[trackIndexRef.current]));
          } else if (playlist.length === 1) {
            // loop single track
            sound.replayAsync();
          }
        }
      });
    } catch {
      setIsLoading(false);
    }
  }, [unload]);

  const selectStation = useCallback(async (id) => {
    setStationId(id);
    await unload();
    const station = MUSIC_STATIONS.find(s => s.id === id);
    if (!station || station.tracks.length === 0) return;
    const playlist = shuffle(station.tracks);
    playlistRef.current = playlist;
    trackIndexRef.current = 0;
    await playTrack(playlist[0]);
  }, [unload, playTrack]);

  const togglePlay = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await soundRef.current.pauseAsync();
      } else if (status.isLoaded) {
        await soundRef.current.playAsync();
      }
    } catch {}
  }, []);

  const changeVolume = useCallback(async (step) => {
    const clamped = Math.max(0, Math.min(VOLUME_STEPS.length - 1, step));
    setVolumeStep(clamped);
    try {
      await soundRef.current?.setVolumeAsync(VOLUME_STEPS[clamped]);
    } catch {}
  }, []);

  const stopMusic = useCallback(async () => {
    await unload();
  }, [unload]);

  return {
    stationId,
    selectStation,
    isPlaying,
    isLoading,
    volumeStep,
    changeVolume,
    togglePlay,
    stopMusic,
    currentStation: MUSIC_STATIONS.find(s => s.id === stationId),
  };
}
