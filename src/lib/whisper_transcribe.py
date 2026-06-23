#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import time

try:
    from faster_whisper import WhisperModel
except ImportError:
    print("Error: faster-whisper is not installed in the python environment.")
    sys.exit(1)

def main():
    if len(sys.argv) < 3:
        print("Error: Missing arguments.")
        print("Usage: python whisper_transcribe.py <input_audio_path> <output_text_path>")
        sys.exit(1)

    audio_path = sys.argv[1]
    output_path = sys.argv[2]
    model_size = "small"  # small model is balanced for speed and accuracy on CPU

    if not os.path.exists(audio_path):
        print(f"Error: Input file not found: {audio_path}")
        sys.exit(1)

    try:
        # Initialize model on CPU with INT8 quantization for memory and speed efficiency
        # Using CPU because we cannot assume GPU is available in standard environments
        model = WhisperModel(model_size, device="cpu", compute_type="int8")
        
        # Transcribe audio file.
        # vad_filter=True removes silent parts to make it faster
        segments, info = model.transcribe(
            audio_path,
            beam_size=5,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500)
        )

        with open(output_path, "w", encoding="utf-8") as f:
            for segment in segments:
                # Format timestamps [MM:SS -> MM:SS]
                start_min, start_sec = int(segment.start // 60), int(segment.start % 60)
                end_min, end_sec = int(segment.end // 60), int(segment.end % 60)
                timestamp_str = f"[{start_min:02d}:{start_sec:02d} -> {end_min:02d}:{end_sec:02d}]"
                
                # Write to output file
                f.write(f"{timestamp_str} {segment.text}\n")
                f.flush()

        print("SUCCESS")
        sys.exit(0)

    except Exception as e:
        print(f"Error during transcription: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
