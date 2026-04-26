import tkinter as tk
from tkinter import ttk
import pygame
import numpy as np
from pygame import mixer, sndarray
import time
import threading
import os
from datetime import datetime

# ====================== INICIALIZAÇÃO ======================
pygame.mixer.pre_init(44100, -16, 2, 512)
mixer.init()
mixer.set_num_channels(48)

SAMPLE_RATE = 44100

# ====================== GERAÇÃO DE SONS ======================
def generate_tone(freq, duration=0.6, volume=0.35, decay=4.0):
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
    envelope = np.exp(-t * decay)
    wave = np.sin(2 * np.pi * freq * t) * envelope * volume
    audio = np.int16(wave * 32767)
    return sndarray.make_sound(np.column_stack((audio, audio)))

def generate_drum_sound(type_name):
    if type_name == "kick":
        duration = 0.45
        t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
        freq = 160 * (30 / 160) ** (t / duration)
        wave = np.sin(2 * np.pi * freq * t) * np.exp(-t * 8)
        audio = np.int16(wave * 32767 * 0.9)
        return sndarray.make_sound(np.column_stack((audio, audio)))
    
    elif type_name == "snare":
        duration = 0.35
        t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
        noise = np.random.uniform(-1, 1, len(t))
        tone = np.sin(2 * np.pi * 180 * t) * 0.3
        wave = noise * 0.8 + tone
        wave *= np.exp(-t * 11)
        audio = np.int16(wave * 32767 * 0.85)
        return sndarray.make_sound(np.column_stack((audio, audio)))
    
    elif type_name == "closed_hh":
        duration = 0.15
        t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
        noise = np.random.uniform(-1, 1, len(t))
        wave = noise * np.exp(-t * 28) * 0.65
        audio = np.int16(wave * 32767)
        return sndarray.make_sound(np.column_stack((audio, audio)))
    
    elif type_name == "open_hh":
        duration = 0.7
        t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
        noise = np.random.uniform(-1, 1, len(t))
        wave = noise * np.exp(-t * 7) * 0.55
        audio = np.int16(wave * 32767)
        return sndarray.make_sound(np.column_stack((audio, audio)))
    
    elif type_name == "clap":
        duration = 0.4
        t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
        noise = np.random.uniform(-1, 1, len(t)) * np.exp(-t * 12)
        wave = noise * 0.75
        audio = np.int16(wave * 32767 * 0.8)
        return sndarray.make_sound(np.column_stack((audio, audio)))
    
    elif type_name == "tom":
        duration = 0.4
        t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
        freq = 120 * (0.4) ** (t / duration)
        wave = np.sin(2 * np.pi * freq * t) * np.exp(-t * 6)
        audio = np.int16(wave * 32767 * 0.8)
        return sndarray.make_sound(np.column_stack((audio, audio)))
    
    return generate_tone(440, 0.3, 0.4)

# Sons base
drum_sounds = {
    "Kick": generate_drum_sound("kick"),
    "Snare": generate_drum_sound("snare"),
    "Clap": generate_drum_sound("clap"),
    "Closed HH": generate_drum_sound("closed_hh"),
    "Open HH": generate_drum_sound("open_hh"),
    "Tom Low": generate_drum_sound("tom"),
    "Tom Mid": generate_drum_sound("tom"),
    "Tom High": generate_drum_sound("tom"),
    "Perc 1": generate_drum_sound("clap"),
    "Perc 2": generate_drum_sound("closed_hh"),
}

# Notas para Melody tab
NOTES = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"]
note_sounds = {note: generate_tone(freq) for note, freq in {
    "C4": 261.63, "D4": 293.66, "E4": 329.63, "F4": 349.23,
    "G4": 392.00, "A4": 440.00, "B4": 493.88, "C5": 523.25
}.items()}

# ====================== APP PRINCIPAL ======================
class DrumApp:
    def __init__(self, root):
        self.root = root
        self.root.title("GroovePad - Bateria & Melodia")
        self.root.geometry("1080x720")
        self.root.configure(bg="#0f0f0f")
        
        self.is_recording = False
        self.recording = []
        self.loop_thread = None
        self._loop_stop = threading.Event()
        self._loop_thread = None
        self.bpm = 120
        self.metronome_running = False

        self.setup_ui()
        self.bind_keyboard()

    def setup_ui(self):
        # Título
        title = tk.Label(self.root, text="GROOVEPAD", font=("Arial", 28, "bold"),
                         fg="#00ffcc", bg="#0f0f0f")
        title.pack(pady=15)

        # Tabs
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill="both", expand=True, padx=20, pady=10)

        # Tab Drums
        self.drums_tab = tk.Frame(self.notebook, bg="#0f0f0f")
        self.notebook.add(self.drums_tab, text="🥁 DRUMS")

        # Tab Melody
        self.melody_tab = tk.Frame(self.notebook, bg="#0f0f0f")
        self.notebook.add(self.melody_tab, text="🎹 MELODY")

        self.create_drum_pads()
        self.create_melody_pads()
        self.create_controls()

    def create_drum_pads(self):
        drum_frame = tk.Frame(self.drums_tab, bg="#0f0f0f")
        drum_frame.pack(pady=20)

        self.drum_buttons = {}
        drum_list = list(drum_sounds.keys())

        for i in range(16):
            row = i // 4
            col = i % 4
            name = drum_list[i % len(drum_list)]
            
            btn = tk.Button(drum_frame, text=name, width=14, height=4,
                            font=("Arial", 11, "bold"), bg="#1e1e1e", fg="#00ffcc",
                            activebackground="#00ffcc", activeforeground="#0f0f0f",
                            relief="raised", bd=4,
                            command=lambda n=name: self.play_drum(n))
            btn.grid(row=row, column=col, padx=8, pady=8)
            self.drum_buttons[name] = btn

    def create_melody_pads(self):
        melody_frame = tk.Frame(self.melody_tab, bg="#0f0f0f")
        melody_frame.pack(pady=20)

        self.melody_buttons = {}
        for i, note in enumerate(NOTES * 2):   # 16 pads
            row = i // 4
            col = i % 4
            btn = tk.Button(melody_frame, text=note, width=14, height=4,
                            font=("Arial", 12, "bold"), bg="#1e1e1e", fg="#ffcc00",
                            activebackground="#ffcc00", activeforeground="#0f0f0f",
                            relief="raised", bd=4,
                            command=lambda n=note: self.play_note(n))
            btn.grid(row=row, column=col, padx=8, pady=8)
            self.melody_buttons[note] = btn

    def create_controls(self):
        control_frame = tk.Frame(self.root, bg="#0f0f0f")
        control_frame.pack(pady=15, fill="x")

        tk.Button(control_frame, text="⏹️ STOP ALL", font=("Arial", 12, "bold"),
                  bg="#ff3366", fg="white", width=12, height=2,
                  command=self.stop_all).pack(side="left", padx=10)

        tk.Button(control_frame, text="🔴 RECORD / LOOP", font=("Arial", 12, "bold"),
                  bg="#ff8800", fg="white", width=15, height=2,
                  command=self.toggle_recording).pack(side="left", padx=10)

        tk.Button(control_frame, text="🗑️ CLEAR", font=("Arial", 12, "bold"),
                  bg="#555555", fg="white", width=10, height=2,
                  command=self.clear_recording).pack(side="left", padx=10)

        # BPM Control
        bpm_frame = tk.Frame(control_frame, bg="#0f0f0f")
        bpm_frame.pack(side="right", padx=20)

        tk.Label(bpm_frame, text="BPM:", font=("Arial", 11), fg="#aaaaaa", bg="#0f0f0f").pack(side="left")
        self.bpm_var = tk.IntVar(value=self.bpm)
        bpm_spin = tk.Spinbox(bpm_frame, from_=60, to=200, width=5, textvariable=self.bpm_var,
                              font=("Arial", 11), command=self.update_bpm)
        bpm_spin.pack(side="left", padx=5)

        tk.Button(bpm_frame, text="⏰ Metronome", font=("Arial", 11),
                  bg="#00ccff", command=self.toggle_metronome).pack(side="left", padx=5)

    def play_drum(self, name):
        if name in drum_sounds:
            drum_sounds[name].play()
            if self.is_recording:
                self.recording.append(("drum", name, time.time()))

    def play_note(self, note):
        if note in note_sounds:
            note_sounds[note].play()
            if self.is_recording:
                self.recording.append(("melody", note, time.time()))

    def stop_all(self):
        mixer.stop()
        self.is_recording = False
        self._stop_loop_playback()

    def toggle_recording(self):
        if not self.is_recording:
            self.recording = []
            self.is_recording = True
            print("🔴 Gravando...")
        else:
            self.is_recording = False
            if self.recording:
                self.start_loop()

    def clear_recording(self):
        self._stop_loop_playback()
        self.recording = []
        print("🗑️ Gravação limpa")

    def _stop_loop_playback(self):
        self._loop_stop.set()
        if self._loop_thread and self._loop_thread.is_alive():
            self._loop_thread.join(timeout=2.0)
        self._loop_thread = None

    def start_loop(self):
        if not self.recording:
            return
        self._stop_loop_playback()
        self._loop_stop.clear()
        print(f"▶️ Reproduzindo loop com {len(self.recording)} eventos")
        self._loop_thread = threading.Thread(target=self._loop_playback, daemon=True)
        self._loop_thread.start()

    def _loop_playback(self):
        """Replay recorded hits on a quantised loop window (default 16 beats, extended if needed)."""
        events = sorted(self.recording, key=lambda e: e[2])
        t0 = events[0][2]
        rel = [(e[0], e[1], e[2] - t0) for e in events]
        beat = 60.0 / max(self.bpm, 1)
        loop_beats = 16
        loop_duration = loop_beats * beat
        last_t = rel[-1][2] if rel else 0.0
        if loop_duration < last_t + 0.05:
            bars = int((last_t + beat) / (4 * beat)) + 1
            loop_beats = max(16, bars * 4)
            loop_duration = loop_beats * beat

        while not self._loop_stop.is_set():
            loop_start = time.perf_counter()
            for kind, name, dt in rel:
                if self._loop_stop.is_set():
                    return
                target = loop_start + dt
                wait = target - time.perf_counter()
                if wait > 0:
                    time.sleep(wait)
                if self._loop_stop.is_set():
                    return
                if kind == "drum" and name in drum_sounds:
                    drum_sounds[name].play()
                elif kind in ("melody", "note") and name in note_sounds:
                    note_sounds[name].play()
            elapsed = time.perf_counter() - loop_start
            rem = loop_duration - elapsed
            if rem > 0:
                end = time.perf_counter() + rem
                while time.perf_counter() < end and not self._loop_stop.is_set():
                    time.sleep(0.01)

    def update_bpm(self):
        self.bpm = self.bpm_var.get()

    def toggle_metronome(self):
        self.metronome_running = not self.metronome_running
        if self.metronome_running:
            threading.Thread(target=self.metronome_loop, daemon=True).start()

    def metronome_loop(self):
        while self.metronome_running:
            # Som simples de click
            click = generate_tone(800, 0.05, 0.6, decay=30)
            click.play()
            time.sleep(60 / self.bpm)

    def bind_keyboard(self):
        self.root.bind("<KeyPress>", self.on_key_press)

    def on_key_press(self, event):
        key = event.keysym.lower()
        # Mapeamento básico de teclado (podes expandir)
        drum_map = {'z':'Kick', 'x':'Snare', 'c':'Clap', 'v':'Closed HH'}
        if key in drum_map and self.notebook.index("current") == 0:
            self.play_drum(drum_map[key])

# ====================== EXECUTAR ======================
if __name__ == "__main__":
    root = tk.Tk()
    app = DrumApp(root)
    root.mainloop()
