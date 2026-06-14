import requests
import sounddevice as sd
import soundfile as sf
import io
import re


# =========================
# GPT-SOVITS CONFIG
# =========================

GPTSOVITS_URL = (
    "http://127.0.0.1:9880/tts"
)

REFERENCE_AUDIO = (
    r"E:\riko\riko_project-main\character_files\main_sample.wav"
)

REFERENCE_TEXT = (
    "This is a sample voice for you to just get started with because it sounds kind of cute but just make sure this doesn't have long silences."
)


# =========================
# CLEAN TEXT
# =========================

def clean_tts_text(text):

    text = re.sub(
        r"\*.*?\*",
        "",
        text
    )

    text = re.sub(
        r"\(.*?\)",
        "",
        text
    )

    text = re.sub(
        r"\[.*?\]",
        "",
        text
    )

    text = re.sub(
        r"<.*?>",
        "",
        text
    )

    text = re.sub(
        r"[#`_~>|]",
        "",
        text
    )

    text = re.sub(
        r"\s+",
        " ",
        text
    ).strip()

    return text


# =========================
# SPEAK
# =========================

def speak(text):

    text = clean_tts_text(text)

    if not text:
        return

    try:

        params = {

            "text": text,

            "text_lang": "en",

            "ref_audio_path": REFERENCE_AUDIO,

            "prompt_lang": "en",

            "prompt_text": REFERENCE_TEXT,

            "top_k": 15,

            "top_p": 1,

            "temperature": 1,

            "text_split_method": "cut5",

            "batch_size": 1,

            "speed_factor": 1,

            "media_type": "wav",

            "streaming_mode": False
        }

        response = requests.get(
            GPTSOVITS_URL,
            params=params
        )

        if response.status_code != 200:

            print(
                "\n[GPT-SOVITS ERROR]\n"
            )

            print(response.text)

            return

        audio_data, sample_rate = sf.read(
            io.BytesIO(response.content)
        )

        sd.play(
            audio_data,
            sample_rate
        )

        sd.wait()

    except Exception as e:

        print(
            "\n[VOICE ERROR]\n"
        )

        print(e)