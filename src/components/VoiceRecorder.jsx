import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const MAX_SECONDS = 300 // 5 minutes

export default function VoiceRecorder({ onRecorded, onCancel }) {
    const { user } = useAuth()
    const [state, setState] = useState('idle') // idle | recording | preview | uploading
    const [seconds, setSeconds] = useState(0)
    const [audioUrl, setAudioUrl] = useState(null)
    const [audioBlob, setAudioBlob] = useState(null)
    const [error, setError] = useState(null)
    const [waveform, setWaveform] = useState(Array(30).fill(4))

    const mediaRecorderRef = useRef(null)
    const chunksRef = useRef([])
    const timerRef = useRef(null)
    const analyserRef = useRef(null)
    const animFrameRef = useRef(null)
    const streamRef = useRef(null)

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopEverything()
        }
    }, [])

    const stopEverything = () => {
        clearInterval(timerRef.current)
        cancelAnimationFrame(animFrameRef.current)
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop())
        }
    }

    const formatTime = (s) => {
        const m = Math.floor(s / 60)
        const sec = s % 60
        return `${m}:${sec.toString().padStart(2, '0')}`
    }

    const startRecording = async () => {
        setError(null)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            streamRef.current = stream

            // Waveform analyser
            const audioCtx = new AudioContext()
            const source = audioCtx.createMediaStreamSource(stream)
            const analyser = audioCtx.createAnalyser()
            analyser.fftSize = 64
            source.connect(analyser)
            analyserRef.current = analyser

            const drawWave = () => {
                const data = new Uint8Array(analyser.frequencyBinCount)
                analyser.getByteFrequencyData(data)
                const bars = Array.from({ length: 30 }, (_, i) => {
                    const val = data[Math.floor(i * data.length / 30)] || 0
                    return Math.max(4, (val / 255) * 40)
                })
                setWaveform(bars)
                animFrameRef.current = requestAnimationFrame(drawWave)
            }
            drawWave()

            // Recorder
            const mr = new MediaRecorder(stream)
            mediaRecorderRef.current = mr
            chunksRef.current = []

            mr.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            mr.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
                const url = URL.createObjectURL(blob)
                setAudioBlob(blob)
                setAudioUrl(url)
                setState('preview')
                stopEverything()
            }

            mr.start(100)
            setState('recording')
            setSeconds(0)

            timerRef.current = setInterval(() => {
                setSeconds(s => {
                    if (s + 1 >= MAX_SECONDS) {
                        stopRecording()
                        return MAX_SECONDS
                    }
                    return s + 1
                })
            }, 1000)

        } catch (err) {
            setError('Microphone access denied. Please allow mic permission.')
        }
    }

    const stopRecording = () => {
        clearInterval(timerRef.current)
        cancelAnimationFrame(animFrameRef.current)
        if (mediaRecorderRef.current?.state !== 'inactive') {
            mediaRecorderRef.current?.stop()
        }
        setWaveform(Array(30).fill(4))
    }

    const handleUpload = async () => {
        if (!audioBlob) return
        setState('uploading')

        try {
            const filename = `voice-${user.id}-${Date.now()}.webm`
            const { data, error: uploadError } = await supabase.storage
                .from('voice-notes')
                .upload(filename, audioBlob, {
                    contentType: 'audio/webm',
                    cacheControl: '3600',
                })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('voice-notes')
                .getPublicUrl(filename)

            onRecorded({ voice_url: publicUrl, voice_duration: seconds })
        } catch (err) {
            setError('Upload failed. Please try again.')
            setState('preview')
        }
    }

    const reset = () => {
        stopEverything()
        setAudioUrl(null)
        setAudioBlob(null)
        setSeconds(0)
        setWaveform(Array(30).fill(4))
        setState('idle')
        setError(null)
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                borderRadius: 14,
                border: '1px solid rgba(183,110,121,0.20)',
                background: 'rgba(255,255,255,0.02)',
                padding: '14px 16px',
                marginBottom: 12,
            }}
        >
            {/* Error */}
            {error && (
                <p style={{ fontSize: 11, color: 'rgba(220,80,80,0.85)', fontFamily: 'var(--font-body)', marginBottom: 10, textAlign: 'center' }}>
                    {error}
                </p>
            )}

            <AnimatePresence mode="wait">

                {/* Idle */}
                {state === 'idle' && (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                        <p style={{ fontSize: 12, color: 'rgba(183,110,121,0.55)', fontFamily: 'var(--font-body)' }}>
                            🎙️ Record a voice note (max 5 min)
                        </p>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <motion.button
                                onClick={startRecording}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.92 }}
                                style={{
                                    width: 40, height: 40, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, rgba(183,110,121,0.8), rgba(212,175,55,0.6))',
                                    border: 'none', cursor: 'pointer', fontSize: 18,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 4px 14px rgba(183,110,121,0.30)',
                                }}
                            >🎙️</motion.button>
                            <motion.button
                                onClick={onCancel}
                                whileTap={{ scale: 0.92 }}
                                style={{
                                    width: 40, height: 40, borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    cursor: 'pointer', fontSize: 14, color: 'rgba(255,255,255,0.35)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >✕</motion.button>
                        </div>
                    </motion.div>
                )}

                {/* Recording */}
                {state === 'recording' && (
                    <motion.div key="recording" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {/* Waveform */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 44, marginBottom: 10, justifyContent: 'center' }}>
                            {waveform.map((h, i) => (
                                <motion.div
                                    key={i}
                                    animate={{ height: h }}
                                    transition={{ duration: 0.1 }}
                                    style={{
                                        width: 3, borderRadius: 2,
                                        background: `rgba(183,110,121,${0.4 + (h / 40) * 0.6})`,
                                        minHeight: 4,
                                    }}
                                />
                            ))}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            {/* Timer */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <motion.div
                                    animate={{ opacity: [1, 0.2, 1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    style={{ width: 7, height: 7, borderRadius: '50%', background: '#e05050' }}
                                />
                                <span style={{ fontSize: 13, color: 'rgba(232,224,226,0.7)', fontFamily: 'var(--font-body)', fontVariantNumeric: 'tabular-nums' }}>
                                    {formatTime(seconds)} / 5:00
                                </span>
                            </div>

                            {/* Stop */}
                            <motion.button
                                onClick={stopRecording}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.92 }}
                                style={{
                                    width: 40, height: 40, borderRadius: '50%',
                                    background: 'rgba(220,80,80,0.15)',
                                    border: '1.5px solid rgba(220,80,80,0.40)',
                                    cursor: 'pointer', fontSize: 14,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'rgba(220,80,80,0.85)',
                                }}
                            >⏹</motion.button>
                        </div>
                    </motion.div>
                )}

                {/* Preview */}
                {state === 'preview' && (
                    <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <audio
                            src={audioUrl}
                            controls
                            style={{
                                width: '100%', height: 36,
                                marginBottom: 10,
                                borderRadius: 8,
                                outline: 'none',
                            }}
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                            <motion.button
                                onClick={reset}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    flex: 1, padding: '8px', borderRadius: 10,
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.07)',
                                    color: 'rgba(232,224,226,0.5)',
                                    fontSize: 12, fontFamily: 'var(--font-body)',
                                    cursor: 'pointer',
                                }}
                            >🗑 Re-record</motion.button>
                            <motion.button
                                onClick={handleUpload}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                style={{
                                    flex: 1, padding: '8px', borderRadius: 10,
                                    background: 'linear-gradient(135deg, rgba(183,110,121,0.8), rgba(212,175,55,0.6))',
                                    border: 'none',
                                    color: 'rgba(255,248,240,0.95)',
                                    fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 600,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 14px rgba(183,110,121,0.25)',
                                }}
                            >✓ Use this</motion.button>
                        </div>
                        <p style={{ fontSize: 10, color: 'rgba(183,110,121,0.4)', fontFamily: 'var(--font-body)', marginTop: 8, textAlign: 'center' }}>
                            Duration: {formatTime(seconds)}
                        </p>
                    </motion.div>
                )}

                {/* Uploading */}
                {state === 'uploading' && (
                    <motion.div
                        key="uploading"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ textAlign: 'center', padding: '8px 0' }}
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            style={{ fontSize: 22, display: 'block', marginBottom: 8 }}
                        >🎵</motion.div>
                        <p style={{ fontSize: 12, color: 'rgba(183,110,121,0.6)', fontFamily: 'var(--font-body)' }}>
                            Uploading voice note...
                        </p>
                    </motion.div>
                )}

            </AnimatePresence>
        </motion.div>
    )
}
