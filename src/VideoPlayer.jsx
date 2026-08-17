import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

function formatTime(secs) {
  const total = Number.isFinite(secs) && secs > 0 ? Math.floor(secs) : 0
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = n => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const IconPlay = () => (
  <svg {...svgProps} fill="currentColor" stroke="none"><path d="M8 5.5v13l11-6.5z" /></svg>
)
const IconPause = () => (
  <svg {...svgProps}><line x1="9" y1="5" x2="9" y2="19" /><line x1="15" y1="5" x2="15" y2="19" /></svg>
)
const IconReplay = () => (
  <svg {...svgProps}><polyline points="1 4 1 10 7 10" /><path d="M3.5 15a9 9 0 1 0 2.1-9.4L1 10" /></svg>
)
const IconVolume = () => (
  <svg {...svgProps}><polygon points="4 9 8 9 12.5 5 12.5 19 8 15 4 15" /><path d="M16 9.5a3.5 3.5 0 0 1 0 5" /><path d="M18.5 7a7 7 0 0 1 0 10" /></svg>
)
const IconMuted = () => (
  <svg {...svgProps}><polygon points="4 9 8 9 12.5 5 12.5 19 8 15 4 15" /><line x1="16.5" y1="9.5" x2="21" y2="14.5" /><line x1="21" y1="9.5" x2="16.5" y2="14.5" /></svg>
)
const IconExpand = () => (
  <svg {...svgProps}><polyline points="9 4 4 4 4 9" /><polyline points="15 4 20 4 20 9" /><polyline points="9 20 4 20 4 15" /><polyline points="15 20 20 20 20 15" /></svg>
)
const IconCollapse = () => (
  <svg {...svgProps}><polyline points="4 9 9 9 9 4" /><polyline points="20 9 15 9 15 4" /><polyline points="4 15 9 15 9 20" /><polyline points="20 15 15 15 15 20" /></svg>
)

const IDLE_DELAY = 2600

/* Coresearch monogram, inlined so `currentColor` can tint it.
   Source of truth for the artwork: public/Coresearchlogo.svg */
const LogoMark = () => (
  <svg viewBox="0 0 683 659" fill="currentColor" aria-hidden="true" style={{ fillRule: 'evenodd', clipRule: 'evenodd' }}>
    <g transform="matrix(1,0,0,1,-672.5,-694.746702)">
      <g>
        <g transform="matrix(0.563067,0,0,0.563067,515.685903,548.630874)">
          <path d="M746,885.684C746,897.039 741.489,907.93 733.459,915.959C725.43,923.989 714.539,928.5 703.184,928.5L613,928.5C428.384,928.5 278.5,778.616 278.5,594C278.5,409.384 428.384,259.5 613,259.5L703.184,259.5C714.539,259.5 725.43,264.011 733.459,272.041C741.489,280.07 746,290.961 746,302.316L746,341.684C746,353.039 741.489,363.93 733.459,371.959C725.43,379.989 714.539,384.5 703.184,384.5L613,384.5C497.374,384.5 403.5,478.374 403.5,594C403.5,709.626 497.374,803.5 613,803.5L703.184,803.5C714.539,803.5 725.43,808.011 733.459,816.041C741.489,824.07 746,834.961 746,846.316L746,885.684Z" />
        </g>
        <g transform="matrix(0.563067,0,0,0.563067,515.685903,548.630874)">
          <path d="M822.5,302.316C822.5,290.961 827.011,280.07 835.041,272.041C843.07,264.011 853.961,259.5 865.316,259.5L1157,259.5C1341.616,259.5 1491.5,409.384 1491.5,594C1491.5,730.435 1409.64,847.901 1292.399,899.921C1284.258,903.566 1278.083,910.544 1275.455,919.068C1272.827,927.592 1274.001,936.835 1278.676,944.432C1299.841,978.864 1333.554,1033.648 1355.789,1069.779C1368.182,1089.918 1361.903,1116.291 1341.764,1128.684L1308.236,1149.316C1298.565,1155.268 1286.926,1157.134 1275.879,1154.503C1264.832,1151.873 1255.283,1144.962 1249.332,1135.291L1131.154,943.253C1125.512,934.085 1115.518,928.5 1104.753,928.5L978.5,928.5C961.379,928.5 947.5,942.379 947.5,959.5L947.5,1386.184C947.5,1397.539 942.989,1408.43 934.959,1416.459C926.93,1424.489 916.039,1429 904.684,1429L865.316,1429C853.961,1429 843.07,1424.489 835.041,1416.459C827.011,1408.43 822.5,1397.539 822.5,1386.184L822.5,905.983C822.5,849.383 868.383,803.5 924.983,803.5L1157,803.5C1272.626,803.5 1366.5,709.626 1366.5,594C1366.5,478.374 1272.626,384.5 1157,384.5L865.316,384.5C853.961,384.5 843.07,379.989 835.041,371.959C827.011,363.93 822.5,353.039 822.5,341.684L822.5,302.316Z" />
        </g>
        <g transform="matrix(0,-0.563067,0.563067,0,543.839242,1245.707543)">
          <circle cx="644" cy="594" r="88" />
        </g>
        <g transform="matrix(0,-0.563067,0.563067,0,815.237428,1245.707543)">
          <circle cx="644" cy="594" r="88" />
        </g>
      </g>
    </g>
  </svg>
)

export function VideoPlayer({
  src,
  poster,
  autoPlay = false,
  loop = false,
  label,
  watermark = 'logo',
  className = '',
}) {
  const { t } = useTranslation()
  const videoRef = useRef(null)
  const wrapRef = useRef(null)
  const trackRef = useRef(null)
  const idleTimer = useRef(null)

  const [started, setStarted] = useState(autoPlay)
  const [playing, setPlaying] = useState(false)
  const [ended, setEnded] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(autoPlay)
  const [scrubbing, setScrubbing] = useState(false)
  const [hover, setHover] = useState(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [idle, setIdle] = useState(false)

  const progress = duration > 0 ? Math.min(1, current / duration) : 0
  const controlsHidden = started && playing && idle && !scrubbing

  /* ── Playback ─────────────────────────────────────────── */
  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    setStarted(true)
    if (v.paused || v.ended) v.play().catch(() => {})
    else v.pause()
  }, [])

  const seekTo = useCallback(time => {
    const v = videoRef.current
    if (!v || !Number.isFinite(v.duration)) return
    const next = Math.min(v.duration, Math.max(0, time))
    v.currentTime = next
    setCurrent(next)
  }, [])

  const ratioFromEvent = (el, clientX) => {
    const r = el.getBoundingClientRect()
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width))
  }

  /* ── Idle / auto-hide controls ────────────────────────── */
  const wake = useCallback(() => {
    setIdle(false)
    clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => setIdle(true), IDLE_DELAY)
  }, [])

  useEffect(() => () => clearTimeout(idleTimer.current), [])

  useEffect(() => {
    if (!playing) {
      clearTimeout(idleTimer.current)
      setIdle(false)
    } else {
      wake()
    }
  }, [playing, wake])

  /* ── Volume ───────────────────────────────────────────── */
  const applyVolume = useCallback(value => {
    const v = videoRef.current
    if (!v) return
    const next = Math.min(1, Math.max(0, value))
    v.volume = next
    v.muted = next === 0
    setVolume(next)
    setMuted(next === 0)
  }, [])

  const toggleMute = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    const next = !v.muted
    v.muted = next
    setMuted(next)
    if (!next && v.volume === 0) applyVolume(0.6)
  }, [applyVolume])

  /* ── Fullscreen ───────────────────────────────────────── */
  const toggleFullscreen = useCallback(() => {
    const el = wrapRef.current
    if (!el) return
    const active = document.fullscreenElement || document.webkitFullscreenElement
    if (active) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen
      exit?.call(document)
    } else {
      const enter = el.requestFullscreen || el.webkitRequestFullscreen
      enter?.call(el)
    }
  }, [])

  useEffect(() => {
    const onChange = () => {
      setFullscreen(Boolean(document.fullscreenElement || document.webkitFullscreenElement))
    }
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [])

  /* ── Keyboard ─────────────────────────────────────────── */
  const onKeyDown = e => {
    const v = videoRef.current
    if (!v) return
    switch (e.key) {
      case ' ':
      case 'k':
      case 'K':
        e.preventDefault()
        togglePlay()
        break
      case 'ArrowLeft':
        e.preventDefault()
        seekTo(v.currentTime - 5)
        break
      case 'ArrowRight':
        e.preventDefault()
        seekTo(v.currentTime + 5)
        break
      case 'ArrowUp':
        e.preventDefault()
        applyVolume(v.volume + 0.1)
        break
      case 'ArrowDown':
        e.preventDefault()
        applyVolume(v.volume - 0.1)
        break
      case 'm':
      case 'M':
        toggleMute()
        break
      case 'f':
      case 'F':
        toggleFullscreen()
        break
      default:
        return
    }
    wake()
  }

  /* ── Track (progress) pointer handling ────────────────── */
  const onTrackDown = e => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setScrubbing(true)
    seekTo(ratioFromEvent(trackRef.current, e.clientX) * duration)
  }
  const onTrackMove = e => {
    const ratio = ratioFromEvent(trackRef.current, e.clientX)
    if (scrubbing) seekTo(ratio * duration)
    setHover({ ratio, time: ratio * duration })
  }
  const onTrackUp = e => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    setScrubbing(false)
  }

  /* ── Volume slider pointer handling ───────────────────── */
  const onVolumeDown = e => {
    e.currentTarget.setPointerCapture(e.pointerId)
    e.currentTarget.dataset.dragging = 'true'
    applyVolume(ratioFromEvent(e.currentTarget, e.clientX))
  }
  const onVolumeMove = e => {
    if (e.currentTarget.dataset.dragging === 'true') {
      applyVolume(ratioFromEvent(e.currentTarget, e.clientX))
    }
  }
  const onVolumeUp = e => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    delete e.currentTarget.dataset.dragging
  }

  const level = muted ? 0 : volume

  return (
    <div
      ref={wrapRef}
      className={`vp${controlsHidden ? ' vp--idle' : ''}${started ? ' vp--started' : ''}${className ? ` ${className}` : ''}`}
      tabIndex={0}
      role="region"
      aria-label={label || t('player.region', 'Video player')}
      onKeyDown={onKeyDown}
      onPointerMove={wake}
      onPointerLeave={() => playing && setIdle(true)}
    >
      <video
        ref={videoRef}
        className="vp-video"
        src={src}
        poster={poster}
        playsInline
        loop={loop}
        autoPlay={autoPlay}
        muted={autoPlay}
        preload="metadata"
        onClick={togglePlay}
        onPlay={() => { setPlaying(true); setEnded(false); setStarted(true) }}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setEnded(true) }}
        onLoadedMetadata={e => {
          setDuration(e.currentTarget.duration || 0)
          setVolume(e.currentTarget.volume)
          setMuted(e.currentTarget.muted)
        }}
        onTimeUpdate={e => { if (!scrubbing) setCurrent(e.currentTarget.currentTime) }}
        onProgress={e => {
          const v = e.currentTarget
          if (v.buffered.length && Number.isFinite(v.duration) && v.duration > 0) {
            setBuffered(v.buffered.end(v.buffered.length - 1) / v.duration)
          }
        }}
      />

      {/* Watermark — signs the work in screen recordings and fullscreen */}
      {watermark && (
        <span className="vp-mark" aria-hidden="true">
          {watermark === 'logo' ? <LogoMark /> : watermark}
        </span>
      )}

      {/* Poster / replay overlay */}
      {(!started || ended) && (
        <button
          type="button"
          className="vp-bigplay"
          onClick={togglePlay}
          aria-label={ended ? t('player.replay', 'Replay') : t('player.play', 'Play')}
        >
          <span className="vp-bigplay-ring">{ended ? <IconReplay /> : <IconPlay />}</span>
        </button>
      )}

      {/* Hairline progress, visible once the controls retract */}
      <div className="vp-hairline" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>

      <div className="vp-scrim" aria-hidden="true" />

      <div className="vp-controls">
        <div
          ref={trackRef}
          className={`vp-track${scrubbing ? ' is-scrubbing' : ''}`}
          role="slider"
          tabIndex={-1}
          aria-label={t('player.seek', 'Seek')}
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(current)}
          aria-valuetext={`${formatTime(current)} / ${formatTime(duration)}`}
          onPointerDown={onTrackDown}
          onPointerMove={onTrackMove}
          onPointerUp={onTrackUp}
          onPointerLeave={() => setHover(null)}
        >
          <span className="vp-track-buffer" style={{ transform: `scaleX(${buffered})` }} />
          <span className="vp-track-fill" style={{ transform: `scaleX(${progress})` }} />
          <span className="vp-track-head" style={{ left: `calc(${progress} * (100% - 3px))` }} />
          {hover && (
            <span className="vp-track-tip" style={{ left: `${hover.ratio * 100}%` }}>
              {formatTime(hover.time)}
            </span>
          )}
        </div>

        <div className="vp-bar">
          <button
            type="button"
            className="vp-btn"
            onClick={togglePlay}
            aria-label={playing ? t('player.pause', 'Pause') : t('player.play', 'Play')}
          >
            {playing ? <IconPause /> : <IconPlay />}
          </button>

          <div className="vp-volume">
            <button
              type="button"
              className="vp-btn"
              onClick={toggleMute}
              aria-label={muted ? t('player.unmute', 'Unmute') : t('player.mute', 'Mute')}
            >
              {muted ? <IconMuted /> : <IconVolume />}
            </button>
            <div
              className="vp-volume-track"
              role="slider"
              tabIndex={-1}
              aria-label={t('player.volume', 'Volume')}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(level * 100)}
              onPointerDown={onVolumeDown}
              onPointerMove={onVolumeMove}
              onPointerUp={onVolumeUp}
            >
              <span className="vp-volume-fill" style={{ transform: `scaleX(${level})` }} />
            </div>
          </div>

          <div className="vp-time">
            <span className="vp-time-current">{formatTime(current)}</span>
            <span className="vp-time-sep">/</span>
            <span className="vp-time-total">{formatTime(duration)}</span>
          </div>

          <button
            type="button"
            className="vp-btn vp-btn--last"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? t('player.exitFullscreen', 'Exit fullscreen') : t('player.fullscreen', 'Fullscreen')}
          >
            {fullscreen ? <IconCollapse /> : <IconExpand />}
          </button>
        </div>
      </div>
    </div>
  )
}
